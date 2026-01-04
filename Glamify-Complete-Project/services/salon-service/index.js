const express = require('express');
const cors = require('cors');
require('dotenv').config();

const db = require('./db');

const app = express();
const PORT = process.env.PORT || 8002;

app.use(cors());
app.use(express.json());

// Middleware to extract user info from headers (set by API Gateway)
const getUserInfo = (req, res, next) => {
  req.userId = req.headers['x-user-id'];
  req.userRole = req.headers['x-user-role'];
  next();
};

// Health check
app.get('/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ status: 'ok', service: 'salon-service' });
  } catch (error) {
    res.status(500).json({ status: 'error', service: 'salon-service' });
  }
});

// Get all salons (public)
app.get('/api/v1/salons', async (req, res) => {
  try {
    const { city, search } = req.query;
    let query = 'SELECT * FROM salons WHERE is_active = true';
    const params = [];
    let paramCount = 1;

    if (city) {
      query += ` AND city ILIKE $${paramCount}`;
      params.push(`%${city}%`);
      paramCount++;
    }

    if (search) {
      query += ` AND (name ILIKE $${paramCount} OR description ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    query += ' ORDER BY rating DESC, name ASC';

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get salons error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get salon by ID (public)
app.get('/api/v1/salons/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const salonResult = await db.query('SELECT * FROM salons WHERE id = $1', [id]);

    if (salonResult.rows.length === 0) {
      return res.status(404).json({ error: 'Salon not found' });
    }

    const salon = salonResult.rows[0];

    // Get services
    const servicesResult = await db.query(
      'SELECT * FROM services WHERE salon_id = $1 AND is_active = true ORDER BY name',
      [id]
    );

    // Get working hours
    const hoursResult = await db.query(
      'SELECT * FROM working_hours WHERE salon_id = $1 ORDER BY day_of_week',
      [id]
    );

    res.json({
      ...salon,
      services: servicesResult.rows,
      workingHours: hoursResult.rows
    });
  } catch (error) {
    console.error('Get salon error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create salon (protected - SALON_OWNER only)
app.post('/api/v1/salons', getUserInfo, async (req, res) => {
  try {
    if (!req.userId || req.userRole !== 'SALON_OWNER') {
      return res.status(403).json({ error: 'Only salon owners can create salons' });
    }

    const { name, description, address, city, state, zipCode, phone, email, imageUrl } = req.body;

    if (!name || !address || !city) {
      return res.status(400).json({ error: 'Name, address, and city are required' });
    }

    const result = await db.query(
      `INSERT INTO salons (owner_id, name, description, address, city, state, zip_code, phone, email, image_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [req.userId, name, description, address, city, state, zipCode, phone, email, imageUrl]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create salon error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update salon (protected - owner only)
app.put('/api/v1/salons/:id', getUserInfo, async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    // Check ownership
    const salonCheck = await db.query('SELECT owner_id FROM salons WHERE id = $1', [id]);
    if (salonCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Salon not found' });
    }

    if (salonCheck.rows[0].owner_id !== parseInt(req.userId)) {
      return res.status(403).json({ error: 'Not authorized to update this salon' });
    }

    const { name, description, address, city, state, zipCode, phone, email, imageUrl } = req.body;

    const result = await db.query(
      `UPDATE salons
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           address = COALESCE($3, address),
           city = COALESCE($4, city),
           state = COALESCE($5, state),
           zip_code = COALESCE($6, zip_code),
           phone = COALESCE($7, phone),
           email = COALESCE($8, email),
           image_url = COALESCE($9, image_url),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $10
       RETURNING *`,
      [name, description, address, city, state, zipCode, phone, email, imageUrl, id]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update salon error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add service to salon (protected - owner only)
app.post('/api/v1/salons/:salonId/services', getUserInfo, async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { salonId } = req.params;
    const { name, description, price, durationMinutes, category } = req.body;

    if (!name || !price || !durationMinutes) {
      return res.status(400).json({ error: 'Name, price, and duration are required' });
    }

    // Check ownership
    const salonCheck = await db.query('SELECT owner_id FROM salons WHERE id = $1', [salonId]);
    if (salonCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Salon not found' });
    }

    if (salonCheck.rows[0].owner_id !== parseInt(req.userId)) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const result = await db.query(
      `INSERT INTO services (salon_id, name, description, price, duration_minutes, category)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [salonId, name, description, price, durationMinutes, category]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Add service error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Set working hours (protected - owner only)
app.post('/api/v1/salons/:salonId/working-hours', getUserInfo, async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { salonId } = req.params;
    const { dayOfWeek, openTime, closeTime, isClosed } = req.body;

    if (dayOfWeek === undefined || dayOfWeek < 0 || dayOfWeek > 6) {
      return res.status(400).json({ error: 'Valid dayOfWeek (0-6) is required' });
    }

    // Check ownership
    const salonCheck = await db.query('SELECT owner_id FROM salons WHERE id = $1', [salonId]);
    if (salonCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Salon not found' });
    }

    if (salonCheck.rows[0].owner_id !== parseInt(req.userId)) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const result = await db.query(
      `INSERT INTO working_hours (salon_id, day_of_week, open_time, close_time, is_closed)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (salon_id, day_of_week)
       DO UPDATE SET open_time = $3, close_time = $4, is_closed = $5
       RETURNING *`,
      [salonId, dayOfWeek, openTime, closeTime, isClosed || false]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Set working hours error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get my salons (protected - owner only)
app.get('/api/v1/salons/owner/my-salons', getUserInfo, async (req, res) => {
  try {
    if (!req.userId || req.userRole !== 'SALON_OWNER') {
      return res.status(403).json({ error: 'Only salon owners can access this' });
    }

    const result = await db.query(
      'SELECT * FROM salons WHERE owner_id = $1 ORDER BY created_at DESC',
      [req.userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get my salons error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`💇 Salon Service running on port ${PORT}`);
});

