const express = require('express');
const cors = require('cors');
require('dotenv').config();

const db = require('./db');

const app = express();
const PORT = process.env.PORT || 8003;

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
    res.json({ status: 'ok', service: 'availability-service' });
  } catch (error) {
    res.status(500).json({ status: 'error', service: 'availability-service' });
  }
});

// Get available slots for a salon and date
app.get('/api/v1/availability/slots', async (req, res) => {
  try {
    const { salonId, date, serviceId } = req.query;

    if (!salonId || !date) {
      return res.status(400).json({ error: 'salonId and date are required' });
    }

    let query = `
      SELECT ts.*, s.name as staff_name
      FROM time_slots ts
      LEFT JOIN staff s ON ts.staff_id = s.id
      WHERE ts.salon_id = $1
        AND ts.slot_date = $2
        AND ts.is_available = true
        AND ts.is_booked = false
    `;
    const params = [salonId, date];
    let paramCount = 3;

    if (serviceId) {
      query += ` AND ts.service_id = $${paramCount}`;
      params.push(serviceId);
      paramCount++;
    }

    // Exclude locked slots
    query += `
      AND ts.id NOT IN (
        SELECT slot_id FROM slot_locks WHERE expires_at > NOW()
      )
    `;

    query += ' ORDER BY ts.slot_time';

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get slots error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get slot by ID
app.get('/api/v1/availability/slots/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
      `SELECT ts.*, s.name as staff_name
       FROM time_slots ts
       LEFT JOIN staff s ON ts.staff_id = s.id
       WHERE ts.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Slot not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get slot error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Lock a slot (for booking process)
app.post('/api/v1/availability/slots/:slotId/lock', getUserInfo, async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { slotId } = req.params;
    const { durationMinutes = 5 } = req.body; // Lock duration in minutes

    // Start transaction
    await db.query('BEGIN');

    try {
      // Check if slot exists and is available
      const slotCheck = await db.query(
        `SELECT id, is_available, is_booked FROM time_slots 
         WHERE id = $1 FOR UPDATE`,
        [slotId]
      );

      if (slotCheck.rows.length === 0) {
        await db.query('ROLLBACK');
        return res.status(404).json({ error: 'Slot not found' });
      }

      const slot = slotCheck.rows[0];

      if (!slot.is_available || slot.is_booked) {
        await db.query('ROLLBACK');
        return res.status(409).json({ error: 'Slot is not available' });
      }

      // Check for existing lock
      const lockCheck = await db.query(
        'SELECT id FROM slot_locks WHERE slot_id = $1 AND expires_at > NOW()',
        [slotId]
      );

      if (lockCheck.rows.length > 0) {
        await db.query('ROLLBACK');
        return res.status(409).json({ error: 'Slot is currently locked' });
      }

      // Create lock
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + durationMinutes);

      await db.query(
        `INSERT INTO slot_locks (slot_id, locked_by, expires_at)
         VALUES ($1, $2, $3)`,
        [slotId, req.userId, expiresAt]
      );

      await db.query('COMMIT');

      res.json({
        message: 'Slot locked successfully',
        slotId,
        expiresAt: expiresAt.toISOString()
      });
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Lock slot error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Release a lock
app.delete('/api/v1/availability/slots/:slotId/lock', getUserInfo, async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { slotId } = req.params;

    const result = await db.query(
      'DELETE FROM slot_locks WHERE slot_id = $1 AND locked_by = $2',
      [slotId, req.userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Lock not found or not owned by user' });
    }

    res.json({ message: 'Lock released successfully' });
  } catch (error) {
    console.error('Release lock error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark slot as booked (called by booking service)
app.post('/api/v1/availability/slots/:slotId/book', async (req, res) => {
  try {
    const { slotId } = req.params;
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({ error: 'bookingId is required' });
    }

    await db.query('BEGIN');

    try {
      // Check slot and lock
      const slotCheck = await db.query(
        `SELECT id, is_available, is_booked FROM time_slots 
         WHERE id = $1 FOR UPDATE`,
        [slotId]
      );

      if (slotCheck.rows.length === 0) {
        await db.query('ROLLBACK');
        return res.status(404).json({ error: 'Slot not found' });
      }

      const slot = slotCheck.rows[0];

      if (slot.is_booked) {
        await db.query('ROLLBACK');
        return res.status(409).json({ error: 'Slot is already booked' });
      }

      // Mark as booked
      await db.query(
        `UPDATE time_slots 
         SET is_booked = true, booking_id = $1
         WHERE id = $2`,
        [bookingId, slotId]
      );

      // Remove lock
      await db.query('DELETE FROM slot_locks WHERE slot_id = $1', [slotId]);

      await db.query('COMMIT');

      res.json({ message: 'Slot booked successfully' });
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Book slot error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Release a booked slot (for cancellation)
app.post('/api/v1/availability/slots/:slotId/release', async (req, res) => {
  try {
    const { slotId } = req.params;

    await db.query(
      `UPDATE time_slots 
       SET is_booked = false, booking_id = NULL
       WHERE id = $1`,
      [slotId]
    );

    res.json({ message: 'Slot released successfully' });
  } catch (error) {
    console.error('Release slot error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Generate slots for a salon (owner only)
app.post('/api/v1/availability/generate-slots', getUserInfo, async (req, res) => {
  try {
    if (!req.userId || req.userRole !== 'SALON_OWNER') {
      return res.status(403).json({ error: 'Only salon owners can generate slots' });
    }

    const { salonId, startDate, endDate, serviceId, slotDuration = 30 } = req.body;

    if (!salonId || !startDate || !endDate || !serviceId) {
      return res.status(400).json({ error: 'salonId, startDate, endDate, and serviceId are required' });
    }

    // This is a simplified version - in production, you'd fetch working hours
    // and generate slots based on them
    const slots = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Generate slots for each day (9 AM to 6 PM, every slotDuration minutes)
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      const dayOfWeek = date.getDay();
      // Skip if outside working hours (simplified - should check working_hours table)
      
      for (let hour = 9; hour < 18; hour++) {
        for (let minute = 0; minute < 60; minute += slotDuration) {
          const slotTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
          
          await db.query(
            `INSERT INTO time_slots (salon_id, service_id, slot_date, slot_time, duration_minutes)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (salon_id, staff_id, service_id, slot_date, slot_time) DO NOTHING`,
            [salonId, serviceId, date.toISOString().split('T')[0], slotTime, slotDuration]
          );

          slots.push({ date: date.toISOString().split('T')[0], time: slotTime });
        }
      }
    }

    res.json({ message: 'Slots generated successfully', count: slots.length });
  } catch (error) {
    console.error('Generate slots error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Clean up expired locks (should be run as a cron job)
app.post('/api/v1/availability/cleanup-locks', async (req, res) => {
  try {
    const result = await db.query(
      'DELETE FROM slot_locks WHERE expires_at < NOW()'
    );

    res.json({ message: 'Expired locks cleaned up', count: result.rowCount });
  } catch (error) {
    console.error('Cleanup locks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`📅 Availability Service running on port ${PORT}`);
  
  // Clean up expired locks every 5 minutes
  setInterval(async () => {
    try {
      await db.query('DELETE FROM slot_locks WHERE expires_at < NOW()');
    } catch (error) {
      console.error('Error cleaning up locks:', error);
    }
  }, 5 * 60 * 1000);
});

