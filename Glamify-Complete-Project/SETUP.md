# Glamify Setup Guide

## Prerequisites

- Docker Desktop (or Docker Engine + Docker Compose)
- Node.js 18+ (for local development)
- Git

## Quick Start with Docker

1. **Clone the repository** (if applicable) or navigate to the project directory

2. **Start all services:**
   ```bash
   docker-compose up -d
   ```

   This will:
   - Start 5 PostgreSQL databases
   - Start 6 microservices
   - Start the React frontend
   - Run database migrations automatically

3. **Wait for services to be ready** (about 30-60 seconds)

4. **Access the application:**
   - Frontend: http://localhost:3000
   - API Gateway: http://localhost:8000

5. **Check service health:**
   ```bash
   curl http://localhost:8000/health
   curl http://localhost:8001/health
   curl http://localhost:8002/health
   curl http://localhost:8003/health
   curl http://localhost:8004/health
   curl http://localhost:8005/health
   ```

## Local Development Setup

### 1. Start Databases

```bash
docker-compose up -d postgres-auth postgres-salon postgres-availability postgres-booking postgres-notification
```

### 2. Run Migrations

For each service:
```bash
cd services/auth-service
npm install
npm run migrate

cd ../salon-service
npm install
npm run migrate

cd ../availability-service
npm install
npm run migrate

cd ../booking-service
npm install
npm run migrate

cd ../notification-service
npm install
npm run migrate
```

### 3. Start Services

In separate terminals:

```bash
# Terminal 1 - Auth Service
cd services/auth-service
npm run dev

# Terminal 2 - Salon Service
cd services/salon-service
npm run dev

# Terminal 3 - Availability Service
cd services/availability-service
npm run dev

# Terminal 4 - Booking Service
cd services/booking-service
npm run dev

# Terminal 5 - Notification Service
cd services/notification-service
npm run dev

# Terminal 6 - API Gateway
cd services/api-gateway
npm run dev

# Terminal 7 - Frontend
cd frontend
npm install
npm start
```

## Environment Variables

Each service uses environment variables. Default values are set in `docker-compose.yml`. For local development, create `.env` files in each service directory if needed.

### Key Environment Variables

- `JWT_SECRET` - Secret key for JWT tokens (change in production!)
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` - Database connection details
- `REACT_APP_API_URL` - Frontend API URL (default: http://localhost:8000)

## Testing the Application

### 1. Register a Customer

```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe",
    "role": "CUSTOMER"
  }'
```

### 2. Register a Salon Owner

```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "owner@example.com",
    "password": "password123",
    "firstName": "Jane",
    "lastName": "Smith",
    "role": "SALON_OWNER"
  }'
```

### 3. Login

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@example.com",
    "password": "password123"
  }'
```

Save the token from the response.

### 4. Create a Salon (as owner)

```bash
curl -X POST http://localhost:8000/api/v1/salons \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Glamour Salon",
    "description": "Premium beauty services",
    "address": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "phone": "+1234567890",
    "email": "contact@glamour.com"
  }'
```

### 5. Add Services to Salon

```bash
curl -X POST http://localhost:8000/api/v1/salons/1/services \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Haircut",
    "description": "Professional haircut",
    "price": 50.00,
    "durationMinutes": 30,
    "category": "Hair"
  }'
```

### 6. Generate Time Slots

```bash
curl -X POST http://localhost:8000/api/v1/availability/generate-slots \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "salonId": 1,
    "startDate": "2024-01-15",
    "endDate": "2024-01-20",
    "serviceId": 1,
    "slotDuration": 30
  }'
```

### 7. Create a Booking (as customer)

```bash
curl -X POST http://localhost:8000/api/v1/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer CUSTOMER_TOKEN" \
  -d '{
    "salonId": 1,
    "slotId": 1,
    "serviceIds": [1],
    "notes": "Please use organic products"
  }'
```

## Database Access

### PostgreSQL Connection Details

- **Auth DB**: `localhost:5432` (user: `auth_user`, password: `auth_pass`, db: `auth_db`)
- **Salon DB**: `localhost:5433` (user: `salon_user`, password: `salon_pass`, db: `salon_db`)
- **Availability DB**: `localhost:5434` (user: `avail_user`, password: `avail_pass`, db: `availability_db`)
- **Booking DB**: `localhost:5435` (user: `booking_user`, password: `booking_pass`, db: `booking_db`)
- **Notification DB**: `localhost:5436` (user: `notify_user`, password: `notify_pass`, db: `notification_db`)

### Connect to Database

```bash
psql -h localhost -p 5432 -U auth_user -d auth_db
# Password: auth_pass
```

## Troubleshooting

### Services won't start

1. Check if ports are already in use:
   ```bash
   netstat -an | grep LISTEN | grep -E '8000|8001|8002|8003|8004|8005|3000|5432|5433|5434|5435|5436'
   ```

2. Check Docker logs:
   ```bash
   docker-compose logs -f [service-name]
   ```

3. Restart services:
   ```bash
   docker-compose restart [service-name]
   ```

### Database connection errors

1. Ensure databases are running:
   ```bash
   docker-compose ps
   ```

2. Check database logs:
   ```bash
   docker-compose logs postgres-auth
   ```

### Migration errors

1. Manually run migrations:
   ```bash
   cd services/[service-name]
   npm run migrate
   ```

2. Check database connection in `.env` or environment variables

## Stopping Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes data)
docker-compose down -v
```

## Production Considerations

Before deploying to production:

1. **Change JWT_SECRET** in `docker-compose.yml` and all service configurations
2. **Use strong database passwords**
3. **Enable HTTPS** for API Gateway
4. **Set up proper logging** and monitoring
5. **Configure rate limiting** appropriately
6. **Set up backup** strategies for databases
7. **Use environment-specific configurations**
8. **Enable CORS** only for trusted domains
9. **Add input validation** and sanitization
10. **Set up CI/CD pipelines**

## Next Steps

- Add payment integration
- Implement email notifications (SendGrid, AWS SES)
- Add Redis for caching
- Set up message queue (Kafka/RabbitMQ)
- Add monitoring and logging (Prometheus, Grafana)
- Implement API versioning
- Add comprehensive testing
- Set up Kubernetes deployment

