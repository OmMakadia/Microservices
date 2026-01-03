# Booking Service

Manages bookings, booking states, and coordinates with other services.

## API Endpoints

### POST /api/v1/bookings
Create a new booking.

**Request:**
```json
{
  "salonId": 1,
  "slotId": 123,
  "serviceIds": [1, 2],
  "notes": "Please use organic products"
}
```

**Response:**
```json
{
  "id": 1,
  "customerId": 5,
  "salonId": 1,
  "slotId": 123,
  "status": "CONFIRMED",
  "totalAmount": 100.00,
  "bookingDate": "2024-01-15",
  "bookingTime": "10:00:00",
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

### GET /api/v1/bookings
Get user's bookings (filtered by status if provided).

### GET /api/v1/bookings/:id
Get booking details.

### POST /api/v1/bookings/:id/cancel
Cancel a booking.

### GET /api/v1/bookings/salon/:salonId
Get bookings for a salon (SALON_OWNER only).

## Booking States

- `PENDING` - Initial state
- `CONFIRMED` - Booking confirmed
- `CANCELLED` - Booking cancelled
- `COMPLETED` - Service completed

## Database Schema

- `bookings` - Booking records
- `booking_items` - Services in each booking

