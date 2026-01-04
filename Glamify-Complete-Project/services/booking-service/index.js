const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const db = require('./db');

const app = express();
const PORT = process.env.PORT || 8004;

const SALON_SERVICE_URL = process.env.SALON_SERVICE_URL || 'http://localhost:8002';
const AVAILABILITY_SERVICE_URL = process.env.AVAILABILITY_SERVICE_URL || 'http://localhost:8003';
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:8005';

app.use(cors());
app.use(express.json());

// Middleware to extract user info
const getUserInfo = (req, res, next) => {
  req.userId = req.headers['x-user-id'];
  req.userRole = req.headers['x-user-role'];
  next();
};

// Health check
app.get('/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ status: 'ok', service: 'booking-service' });
  } catch (error) {
    res.status(500).json({ status: 'error', service: 'booking-service' });
  }
});

// Create booking
app.post('/api/v1/bookings', getUserInfo, async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { salonId, slotId, serviceIds, notes } = req.body;

    if (!salonId || !slotId || !serviceIds || !Array.isArray(serviceIds) || serviceIds.length === 0) {
      return res.status(400).json({ error: 'salonId, slotId, and serviceIds are required' });
    }

    await db.query('BEGIN');

    try {
      // Get slot details from availability service
      let slotResponse;
      try {
        slotResponse = await axios.get(
          `${AVAILABILITY_SERVICE_URL}/api/v1/availability/slots/${slotId}`
        );
      } catch (error) {
        await db.query('ROLLBACK');
        return res.status(404).json({ error: 'Slot not found' });
      }

      const slot = slotResponse.data;
      if (!slot.is_available || slot.is_booked) {
        await db.query('ROLLBACK');
        return res.status(409).json({ error: 'Slot is not available' });
      }

      // Lock the slot
      await axios.post(
        `${AVAILABILITY_SERVICE_URL}/api/v1/availability/slots/${slotId}/lock`,
        { durationMinutes: 5 },
        { headers: { 'Authorization': req.headers['authorization'] } }
      ).catch(() => {
        throw new Error('Failed to lock slot');
      });

      // Get service details from salon service
      const services = [];
      let totalAmount = 0;
      let totalDuration = 0;

      for (const serviceId of serviceIds) {
        const serviceResponse = await axios.get(
          `${SALON_SERVICE_URL}/api/v1/salons/${salonId}/services/${serviceId}`
        ).catch(() => null);

        if (!serviceResponse) {
          await db.query('ROLLBACK');
          return res.status(404).json({ error: `Service ${serviceId} not found` });
        }

        const service = serviceResponse.data;
        services.push(service);
        totalAmount += parseFloat(service.price);
        totalDuration += parseInt(service.duration_minutes);
      }

      // Create booking
      const bookingResult = await db.query(
        `INSERT INTO bookings (customer_id, salon_id, slot_id, total_amount, booking_date, booking_time, notes, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'PENDING')
         RETURNING *`,
        [req.userId, salonId, slotId, totalAmount, slot.slot_date, slot.slot_time, notes || null]
      );

      const booking = bookingResult.rows[0];

      // Create booking items
      for (const service of services) {
        await db.query(
          `INSERT INTO booking_items (booking_id, service_id, service_name, price, duration_minutes)
           VALUES ($1, $2, $3, $4, $5)`,
          [booking.id, service.id, service.name, service.price, service.duration_minutes]
        );
      }

      // Mark slot as booked
      await axios.post(
        `${AVAILABILITY_SERVICE_URL}/api/v1/availability/slots/${slotId}/book`,
        { bookingId: booking.id }
      ).catch(() => {
        console.error('Failed to mark slot as booked, but booking created');
      });

      // Confirm booking
      await db.query(
        `UPDATE bookings SET status = 'CONFIRMED' WHERE id = $1`,
        [booking.id]
      );

      booking.status = 'CONFIRMED';

      // Send notification
      await axios.post(
        `${NOTIFICATION_SERVICE_URL}/api/v1/notifications`,
        {
          userId: req.userId,
          type: 'BOOKING_CONFIRMED',
          title: 'Booking Confirmed',
          message: `Your booking at salon ${salonId} has been confirmed`,
          bookingId: booking.id
        }
      ).catch(() => {
        console.error('Failed to send notification');
      });

      await db.query('COMMIT');

      // Get full booking details
      const bookingItemsResult = await db.query(
        'SELECT * FROM booking_items WHERE booking_id = $1',
        [booking.id]
      );

      res.status(201).json({
        ...booking,
        items: bookingItemsResult.rows
      });
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Get user's bookings
app.get('/api/v1/bookings', getUserInfo, async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { status } = req.query;
    let query = `
      SELECT b.*, 
             json_agg(
               json_build_object(
                 'id', bi.id,
                 'serviceId', bi.service_id,
                 'serviceName', bi.service_name,
                 'price', bi.price,
                 'durationMinutes', bi.duration_minutes
               )
             ) as items
      FROM bookings b
      LEFT JOIN booking_items bi ON b.id = bi.booking_id
      WHERE b.customer_id = $1
    `;
    const params = [req.userId];

    if (status) {
      query += ' AND b.status = $2';
      params.push(status);
    }

    query += ' GROUP BY b.id ORDER BY b.created_at DESC';

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get booking by ID
app.get('/api/v1/bookings/:id', getUserInfo, async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    const bookingResult = await db.query(
      'SELECT * FROM bookings WHERE id = $1',
      [id]
    );

    if (bookingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const booking = bookingResult.rows[0];

    // Check authorization
    if (booking.customer_id !== parseInt(req.userId) && req.userRole !== 'SALON_OWNER') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const itemsResult = await db.query(
      'SELECT * FROM booking_items WHERE booking_id = $1',
      [id]
    );

    res.json({
      ...booking,
      items: itemsResult.rows
    });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Cancel booking
app.post('/api/v1/bookings/:id/cancel', getUserInfo, async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    await db.query('BEGIN');

    try {
      const bookingResult = await db.query(
        'SELECT * FROM bookings WHERE id = $1 FOR UPDATE',
        [id]
      );

      if (bookingResult.rows.length === 0) {
        await db.query('ROLLBACK');
        return res.status(404).json({ error: 'Booking not found' });
      }

      const booking = bookingResult.rows[0];

      // Check authorization
      if (booking.customer_id !== parseInt(req.userId) && req.userRole !== 'SALON_OWNER') {
        await db.query('ROLLBACK');
        return res.status(403).json({ error: 'Not authorized' });
      }

      if (booking.status === 'CANCELLED') {
        await db.query('ROLLBACK');
        return res.status(400).json({ error: 'Booking is already cancelled' });
      }

      if (booking.status === 'COMPLETED') {
        await db.query('ROLLBACK');
        return res.status(400).json({ error: 'Cannot cancel completed booking' });
      }

      // Update booking status
      await db.query(
        `UPDATE bookings SET status = 'CANCELLED', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [id]
      );

      // Release slot
      await axios.post(
        `${AVAILABILITY_SERVICE_URL}/api/v1/availability/slots/${booking.slot_id}/release`
      ).catch(() => {
        console.error('Failed to release slot');
      });

      // Send notification
      await axios.post(
        `${NOTIFICATION_SERVICE_URL}/api/v1/notifications`,
        {
          userId: req.userId,
          type: 'BOOKING_CANCELLED',
          title: 'Booking Cancelled',
          message: `Your booking #${id} has been cancelled`,
          bookingId: id
        }
      ).catch(() => {
        console.error('Failed to send notification');
      });

      await db.query('COMMIT');

      res.json({ message: 'Booking cancelled successfully' });
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get salon bookings (for salon owners)
app.get('/api/v1/bookings/salon/:salonId', getUserInfo, async (req, res) => {
  try {
    if (!req.userId || req.userRole !== 'SALON_OWNER') {
      return res.status(403).json({ error: 'Only salon owners can access this' });
    }

    const { salonId } = req.params;
    const { status, date } = req.query;

    let query = `
      SELECT b.*, 
             json_agg(
               json_build_object(
                 'id', bi.id,
                 'serviceId', bi.service_id,
                 'serviceName', bi.service_name,
                 'price', bi.price,
                 'durationMinutes', bi.duration_minutes
               )
             ) as items
      FROM bookings b
      LEFT JOIN booking_items bi ON b.id = bi.booking_id
      WHERE b.salon_id = $1
    `;
    const params = [salonId];

    if (status) {
      query += ' AND b.status = $2';
      params.push(status);
      if (date) {
        query += ' AND b.booking_date = $3';
        params.push(date);
      }
    } else if (date) {
      query += ' AND b.booking_date = $2';
      params.push(date);
    }

    query += ' GROUP BY b.id ORDER BY b.booking_date, b.booking_time';

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get salon bookings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`📅 Booking Service running on port ${PORT}`);
});

