const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// Service URLs
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:8001';
const SALON_SERVICE_URL = process.env.SALON_SERVICE_URL || 'http://localhost:8002';
const AVAILABILITY_SERVICE_URL = process.env.AVAILABILITY_SERVICE_URL || 'http://localhost:8003';
const BOOKING_SERVICE_URL = process.env.BOOKING_SERVICE_URL || 'http://localhost:8004';
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:8005';

app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/v1', limiter);

// JWT Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Optional authentication (for endpoints that work with or without auth)
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (!err) {
        req.user = user;
      }
    });
  }
  next();
};

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'api-gateway' });
});

// Auth Service Routes (public)
app.use('/api/v1/auth', createProxyMiddleware({
  target: AUTH_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/v1/auth': '/api/v1/auth'
  }
}));

// Salon Service Routes (public read, protected write)
app.use('/api/v1/salons', optionalAuth, createProxyMiddleware({
  target: SALON_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/v1/salons': '/api/v1/salons'
  },
  onProxyReq: (proxyReq, req) => {
    if (req.user) {
      proxyReq.setHeader('X-User-Id', req.user.userId);
      proxyReq.setHeader('X-User-Role', req.user.role);
    }
  }
}));

// Availability Service Routes (public read, protected write)
app.use('/api/v1/availability', optionalAuth, createProxyMiddleware({
  target: AVAILABILITY_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/v1/availability': '/api/v1/availability'
  },
  onProxyReq: (proxyReq, req) => {
    if (req.user) {
      proxyReq.setHeader('X-User-Id', req.user.userId);
      proxyReq.setHeader('X-User-Role', req.user.role);
    }
  }
}));

// Booking Service Routes (protected)
app.use('/api/v1/bookings', authenticateToken, createProxyMiddleware({
  target: BOOKING_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/v1/bookings': '/api/v1/bookings'
  },
  onProxyReq: (proxyReq, req) => {
    proxyReq.setHeader('X-User-Id', req.user.userId);
    proxyReq.setHeader('X-User-Role', req.user.role);
  }
}));

// Notification Service Routes (protected, mostly internal)
app.use('/api/v1/notifications', authenticateToken, createProxyMiddleware({
  target: NOTIFICATION_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/v1/notifications': '/api/v1/notifications'
  },
  onProxyReq: (proxyReq, req) => {
    proxyReq.setHeader('X-User-Id', req.user.userId);
    proxyReq.setHeader('X-User-Role', req.user.role);
  }
}));

// Error handling
app.use((err, req, res, next) => {
  console.error('Gateway Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 API Gateway running on port ${PORT}`);
  console.log(`📡 Routing to services:`);
  console.log(`   Auth: ${AUTH_SERVICE_URL}`);
  console.log(`   Salon: ${SALON_SERVICE_URL}`);
  console.log(`   Availability: ${AVAILABILITY_SERVICE_URL}`);
  console.log(`   Booking: ${BOOKING_SERVICE_URL}`);
  console.log(`   Notification: ${NOTIFICATION_SERVICE_URL}`);
});

