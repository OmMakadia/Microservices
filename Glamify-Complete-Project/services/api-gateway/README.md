# API Gateway Service

Routes requests to appropriate microservices, validates JWT tokens, and implements rate limiting.

## Endpoints

- `GET /health` - Health check
- `/api/v1/auth/*` - Authentication routes (public)
- `/api/v1/salons/*` - Salon routes (public read, protected write)
- `/api/v1/availability/*` - Availability routes (public read, protected write)
- `/api/v1/bookings/*` - Booking routes (protected)
- `/api/v1/notifications/*` - Notification routes (protected)

## Features

- JWT token validation
- Rate limiting (100 requests per 15 minutes)
- Service routing
- CORS enabled

