# Glamify Architecture Documentation

## System Architecture

### Technology Stack

**Backend:**
- Node.js + Express.js
- PostgreSQL (one per service)
- JWT for authentication
- Docker for containerization

**Frontend:**
- React 18+
- Tailwind CSS
- Axios for API calls
- React Router for navigation

**Infrastructure:**
- Docker Compose
- Service-to-service communication via HTTP REST

## Service Communication

### Synchronous Communication
- REST APIs for direct service calls
- API Gateway routes requests to services

### Asynchronous Communication (Future)
- Event-driven architecture ready
- Notification service listens for booking events
- Can be extended with Kafka/RabbitMQ

## Database Design

### Authentication Service Database
- `users` - User accounts
- `roles` - User roles (CUSTOMER, SALON_OWNER)

### Salon Service Database
- `salons` - Salon profiles
- `services` - Available services (haircut, facial, etc.)
- `working_hours` - Salon operating hours

### Availability Service Database
- `staff` - Staff members
- `schedules` - Staff schedules
- `time_slots` - Available time slots
- `slot_locks` - Temporary locks during booking

### Booking Service Database
- `bookings` - Booking records
- `booking_items` - Services in each booking

### Notification Service Database
- `notifications` - Notification logs

## Security

1. **JWT Authentication**
   - Tokens issued by Auth Service
   - Validated by API Gateway
   - Contains user ID and role

2. **Password Security**
   - bcrypt hashing (10 rounds)
   - No plain text storage

3. **Authorization**
   - Role-based access control
   - Endpoint-level permission checks

## Booking Flow

1. Customer browses salons (Salon Service)
2. Customer selects service and date (Salon + Availability Services)
3. Customer requests time slot (Availability Service)
4. Slot is locked (Availability Service)
5. Booking is created (Booking Service)
6. Slot is confirmed (Availability Service)
7. Notification sent (Notification Service)
8. Slot lock released (Availability Service)

## Scalability Considerations

- Each service can scale independently
- Stateless services (except databases)
- Ready for horizontal scaling
- Database connection pooling
- Future: Redis for caching
- Future: Message queue for async operations

## Error Handling

- Standardized error responses
- HTTP status codes
- Error logging
- Graceful degradation

## Monitoring (Future)

- Health check endpoints
- Logging aggregation
- Metrics collection
- Distributed tracing

