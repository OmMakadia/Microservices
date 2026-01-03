# Salon Service

Manages salon profiles, services, and working hours.

## API Endpoints

### GET /api/v1/salons
Get all active salons (public).

**Query params:**
- `city` - Filter by city
- `search` - Search by name or description

### GET /api/v1/salons/:id
Get salon details with services and working hours (public).

### POST /api/v1/salons
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

### POST /api/v1/salons/:salonId/services
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

### POST /api/v1/salons/:salonId/working-hours
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

## Database Schema

- `salons` - Salon profiles
- `services` - Available services
- `working_hours` - Operating hours (0=Sunday, 6=Saturday)

