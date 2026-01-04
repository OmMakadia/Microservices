# Glamify – Distributed Beauty Parlor Booking Platform

A scalable, microservices-based beauty parlor booking system built with modern technologies.

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
└──────────────────────────┬──────────────────────────────────┘
                            │
┌──────────────────────────▼──────────────────────────────────┐
│                    API Gateway (Port 8000)                  │
│  - Request Routing                                           │
│  - JWT Validation                                            │
│  - Rate Limiting                                             │
└──────┬──────────┬──────────┬──────────┬──────────┬──────────┘
       │          │          │          │          │
   ┌───▼───┐  ┌──▼───┐  ┌───▼───┐  ┌───▼───┐  ┌───▼───┐
   │ Auth │  │Salon │  │Avail. │  │Booking│  │Notify │
   │(8001)│  │(8002)│  │(8003) │  │(8004) │  │(8005) │
   └───┬───┘  └──┬───┘  └───┬───┘  └───┬───┘  └───┬───┘
       │         │          │          │          │
   ┌───▼───┐  ┌──▼───┐  ┌───▼───┐  ┌───▼───┐  ┌───▼───┐
   │Postgres│ │Postgres│ │Postgres│ │Postgres│ │Postgres│
   │ :5432  │ │ :5433  │ │ :5434  │ │ :5435  │ │ :5436  │
   └────────┘ └────────┘ └────────┘ └────────┘ └────────┘
```

## 🧩 Microservices

### 1. API Gateway (Port 8000)
- Routes requests to appropriate services
- Validates JWT tokens
- Implements rate limiting
- Service discovery

### 2. Authentication Service (Port 8001)
- User registration and login
- JWT token generation and validation
- Role-based access control (CUSTOMER, SALON_OWNER)

### 3. Salon Service (Port 8002)
- Salon profile management
- Service catalog (haircut, facial, etc.)
- Working hours configuration
- Service pricing and duration

### 4. Availability Service (Port 8003)
- Staff schedule management
- Time slot generation
- Availability checking
- Slot locking mechanism

### 5. Booking Service (Port 8004)
- Create and manage bookings
- Booking state management (PENDING → CONFIRMED → CANCELLED)
- Booking history

### 6. Notification Service (Port 8005)
- Event-driven notifications
- Email simulation (console logging)
- Booking confirmations and cancellations

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for local development)
- PostgreSQL (if running services locally)

### Start All Services

```bash
docker-compose up -d
```

This will start:
- All 6 microservices
- 5 PostgreSQL databases
- Frontend development server

### Access Points
- Frontend: http://localhost:3000
- API Gateway: http://localhost:8000
- Auth Service: http://localhost:8001
- Salon Service: http://localhost:8002
- Availability Service: http://localhost:8003
- Booking Service: http://localhost:8004
- Notification Service: http://localhost:8005

## 📁 Project Structure

```
glamify/
├── services/
│   ├── api-gateway/
│   ├── auth-service/
│   ├── salon-service/
│   ├── availability-service/
│   ├── booking-service/
│   └── notification-service/
├── frontend/
├── docker-compose.yml
└── README.md
```

## 🔐 Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## 📡 API Endpoints

See individual service README files for detailed API documentation.

## 🧪 Testing

Run tests for each service:
```bash
cd services/<service-name>
npm test
```

## 🛠️ Development

### Running Services Locally

1. Start databases:
```bash
docker-compose up -d postgres-auth postgres-salon postgres-availability postgres-booking postgres-notification
```

2. Run migrations:
```bash
cd services/<service-name>
npm run migrate
```

3. Start service:
```bash
npm run dev
```

## 📝 License

MIT

