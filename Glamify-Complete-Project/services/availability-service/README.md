# Availability Service

Manages time slots, staff schedules, and handles concurrency control for bookings.

## API Endpoints

### GET /api/v1/availability/slots
Get available slots for a salon and date.

**Query params:**
- `salonId` - Salon ID (required)
- `date` - Date in YYYY-MM-DD format (required)
- `serviceId` - Filter by service ID (optional)

### POST /api/v1/availability/slots/:slotId/lock
Lock a slot for booking (prevents double booking).

**Request:**
```json
{
  "durationMinutes": 5
}
```

### DELETE /api/v1/availability/slots/:slotId/lock
Release a lock on a slot.

### POST /api/v1/availability/slots/:slotId/book
Mark a slot as booked (internal use by booking service).

### POST /api/v1/availability/slots/:slotId/release
Release a booked slot (for cancellations).

### POST /api/v1/availability/generate-slots
Generate time slots for a salon (SALON_OWNER only).

## Concurrency Control

- Uses database locks (`slot_locks` table) to prevent double booking
- Locks expire after a set duration (default 5 minutes)
- Automatic cleanup of expired locks

## Database Schema

- `staff` - Staff members
- `schedules` - Staff schedules
- `time_slots` - Available time slots
- `slot_locks` - Temporary locks during booking process

