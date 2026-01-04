# Glamify API Documentation

Base URL: `http://localhost:8000/api/v1`

All protected endpoints require JWT token in Authorization header:
```
Authorization: Bearer <token>
```

## Authentication Service

### POST /auth/register
Register a new user.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "role": "CUSTOMER"
}
```

**Response:** `201 Created`
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890",
    "role": "CUSTOMER"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### POST /auth/login
Login with email and password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:** `200 OK`
```json
{
  "message": "Login successful",
  "user": { ... },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### GET /auth/verify
Verify JWT token validity.

**Response:** `200 OK`
```json
{
  "valid": true,
  "user": { ... }
}
```

## Salon Service

### GET /salons
Get all active salons (public).

**Query Parameters:**
- `city` - Filter by city
- `search` - Search by name or description

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "owner_id": 5,
    "name": "Glamour Salon",
    "description": "Premium beauty services",
    "address": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zip_code": "10001",
    "phone": "+1234567890",
    "email": "contact@glamour.com",
    "rating": 4.5,
    "total_reviews": 120,
    "is_active": true
  }
]
```

### GET /salons/:id
Get salon details with services and working hours (public).

**Response:** `200 OK`
```json
{
  "id": 1,
  "name": "Glamour Salon",
  ...,
  "services": [
    {
      "id": 1,
      "name": "Haircut",
      "description": "Professional haircut",
      "price": 50.00,
      "duration_minutes": 30,
      "category": "Hair"
    }
  ],
  "workingHours": [
    {
      "id": 1,
      "day_of_week": 1,
      "open_time": "09:00:00",
      "close_time": "18:00:00",
      "is_closed": false
    }
  ]
}
```

### POST /salons
Create a new salon (SALON_OWNER only).

**Request:**
```json
{
  "name": "Glamour Salon",
  "description": "Premium beauty services",
  "address": "123 Main St",
  "city": "New York",
  "state": "NY",
  "zipCode": "10001",
  "phone": "+1234567890",
  "email": "contact@glamour.com",
  "imageUrl": "https://example.com/image.jpg"
}
```

### POST /salons/:salonId/services
Add a service to a salon (owner only).

**Request:**
```json
{
  "name": "Haircut",
  "description": "Professional haircut",
  "price": 50.00,
  "durationMinutes": 30,
  "category": "Hair"
}
```

### POST /salons/:salonId/working-hours
Set working hours for a salon (owner only).

**Request:**
```json
{
  "dayOfWeek": 1,
  "openTime": "09:00",
  "closeTime": "18:00",
  "isClosed": false
}
```

## Availability Service

### GET /availability/slots
Get available slots for a salon and date.

**Query Parameters:**
- `salonId` (required) - Salon ID
- `date` (required) - Date in YYYY-MM-DD format
- `serviceId` (optional) - Filter by service ID

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "salon_id": 1,
    "service_id": 1,
    "slot_date": "2024-01-15",
    "slot_time": "10:00:00",
    "duration_minutes": 30,
    "is_available": true,
    "is_booked": false
  }
]
```

### POST /availability/slots/:slotId/lock
Lock a slot for booking (prevents double booking).

**Request:**
```json
{
  "durationMinutes": 5
}
```

**Response:** `200 OK`
```json
{
  "message": "Slot locked successfully",
  "slotId": 1,
  "expiresAt": "2024-01-15T10:05:00.000Z"
}
```

### POST /availability/slots/:slotId/book
Mark a slot as booked (internal use).

**Request:**
```json
{
  "bookingId": 123
}
```

## Booking Service

### POST /bookings
Create a new booking (protected).

**Request:**
```json
{
  "salonId": 1,
  "slotId": 123,
  "serviceIds": [1, 2],
  "notes": "Please use organic products"
}
```

**Response:** `201 Created`
```json
{
  "id": 1,
  "customer_id": 5,
  "salon_id": 1,
  "slot_id": 123,
  "status": "CONFIRMED",
  "total_amount": 100.00,
  "booking_date": "2024-01-15",
  "booking_time": "10:00:00",
  "items": [
    {
      "serviceId": 1,
      "serviceName": "Haircut",
      "price": 50.00,
      "durationMinutes": 30
    }
  ]
}
```

### GET /bookings
Get user's bookings (protected).

**Query Parameters:**
- `status` (optional) - Filter by status (PENDING, CONFIRMED, CANCELLED, COMPLETED)

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "customer_id": 5,
    "salon_id": 1,
    "status": "CONFIRMED",
    "total_amount": 100.00,
    "booking_date": "2024-01-15",
    "booking_time": "10:00:00",
    "items": [...]
  }
]
```

### GET /bookings/:id
Get booking details (protected).

### POST /bookings/:id/cancel
Cancel a booking (protected).

**Response:** `200 OK`
```json
{
  "message": "Booking cancelled successfully"
}
```

### GET /bookings/salon/:salonId
Get bookings for a salon (SALON_OWNER only).

**Query Parameters:**
- `status` (optional) - Filter by status
- `date` (optional) - Filter by date

## Notification Service

### GET /notifications
Get user notifications (protected).

**Query Parameters:**
- `unreadOnly` (optional) - Only return unread notifications

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "user_id": 5,
    "type": "BOOKING_CONFIRMED",
    "title": "Booking Confirmed",
    "message": "Your booking has been confirmed",
    "booking_id": 123,
    "is_read": false,
    "sent_at": "2024-01-15T10:00:00.000Z"
  }
]
```

### PUT /notifications/:id/read
Mark a notification as read (protected).

### PUT /notifications/read-all
Mark all notifications as read (protected).

### GET /notifications/unread/count
Get count of unread notifications (protected).

**Response:** `200 OK`
```json
{
  "count": 5
}
```

## Error Responses

All endpoints return errors in the following format:

```json
{
  "error": "Error message"
}
```

### HTTP Status Codes

- `200 OK` - Success
- `201 Created` - Resource created
- `400 Bad Request` - Invalid request
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource conflict (e.g., already exists)
- `500 Internal Server Error` - Server error

## Rate Limiting

API Gateway implements rate limiting:
- 100 requests per 15 minutes per IP address

