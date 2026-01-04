const express = require('express');
const cors = require('cors');
require('dotenv').config();

const db = require('./db');

const app = express();
const PORT = process.env.PORT || 8005;

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
    res.json({ status: 'ok', service: 'notification-service' });
  } catch (error) {
    res.status(500).json({ status: 'error', service: 'notification-service' });
  }
});

// Create notification (internal use by other services)
app.post('/api/v1/notifications', async (req, res) => {
  try {
    const { userId, type, title, message, bookingId } = req.body;

    if (!userId || !type || !title || !message) {
      return res.status(400).json({ error: 'userId, type, title, and message are required' });
    }

    // Save to database
    const result = await db.query(
      `INSERT INTO notifications (user_id, type, title, message, booking_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, type, title, message, bookingId || null]
    );

    const notification = result.rows[0];

    // Simulate email sending (console output)
    console.log('\n📧 === EMAIL NOTIFICATION ===');
    console.log(`To: User ID ${userId}`);
    console.log(`Subject: ${title}`);
    console.log(`Body: ${message}`);
    if (bookingId) {
      console.log(`Booking ID: ${bookingId}`);
    }
    console.log('============================\n');

    res.status(201).json(notification);
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user notifications
app.get('/api/v1/notifications', getUserInfo, async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { unreadOnly } = req.query;

    let query = 'SELECT * FROM notifications WHERE user_id = $1';
    const params = [req.userId];

    if (unreadOnly === 'true') {
      query += ' AND is_read = false';
    }

    query += ' ORDER BY sent_at DESC LIMIT 50';

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark notification as read
app.put('/api/v1/notifications/:id/read', getUserInfo, async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    const result = await db.query(
      `UPDATE notifications 
       SET is_read = true, read_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [id, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark all notifications as read
app.put('/api/v1/notifications/read-all', getUserInfo, async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await db.query(
      `UPDATE notifications 
       SET is_read = true, read_at = CURRENT_TIMESTAMP
       WHERE user_id = $1 AND is_read = false
       RETURNING COUNT(*)`,
      [req.userId]
    );

    res.json({ message: 'All notifications marked as read', count: result.rowCount });
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get unread count
app.get('/api/v1/notifications/unread/count', getUserInfo, async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await db.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false',
      [req.userId]
    );

    res.json({ count: parseInt(result.rows[0].count) });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`🔔 Notification Service running on port ${PORT}`);
});

