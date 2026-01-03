# Booking Flow Explanation

This document explains the complete booking flow in the Glamify system.

## Overview

The booking process involves multiple microservices working together to ensure data consistency and prevent double bookings.

## Step-by-Step Flow

### 1. Customer Browses Salons
- **Service**: Salon Service
- **Endpoint**: `GET /api/v1/salons`
- Customer can search and filter salons by city, name, etc.

### 2. Customer Views Salon Details
- **Service**: Salon Service
- **Endpoint**: `GET /api/v1/salons/:id`
- Returns salon information, available services, and working hours

### 3. Customer Selects Service and Date
- **Service**: Salon Service + Availability Service
- Customer selects:
  - Service (e.g., Haircut)
  - Date for appointment

### 4. System Fetches Available Slots
- **Service**: Availability Service
- **Endpoint**: `GET /api/v1/availability/slots?salonId=1&date=2024-01-15&serviceId=1`
- Returns available time slots for the selected date and service
- Excludes:
  - Already booked slots
  - Currently locked slots (in booking process)

### 5. Customer Selects Time Slot
- Customer chooses a specific time slot from available options

### 6. Customer Initiates Booking
- **Service**: Booking Service
- **Endpoint**: `POST /api/v1/bookings`
- **Process**:
  1. Booking Service receives booking request
  2. Validates user authentication
  3. Starts database transaction

### 7. Lock the Slot
- **Service**: Availability Service
- **Endpoint**: `POST /api/v1/availability/slots/:slotId/lock`
- **Purpose**: Prevent other users from booking the same slot
- **Mechanism**:
  - Creates a temporary lock in `slot_locks` table
  - Lock expires after 5 minutes (configurable)
  - Uses database row-level locking (`FOR UPDATE`) to prevent race conditions

### 8. Verify Slot Availability
- **Service**: Availability Service
- Booking Service fetches slot details to verify:
  - Slot exists
  - Slot is available
  - Slot is not already booked

### 9. Fetch Service Details
- **Service**: Salon Service
- Booking Service fetches service details to:
  - Calculate total price
  - Calculate total duration
  - Validate service exists

### 10. Create Booking Record
- **Service**: Booking Service
- Creates booking in `bookings` table with status `PENDING`
- Creates booking items in `booking_items` table
- Calculates total amount

### 11. Mark Slot as Booked
- **Service**: Availability Service
- **Endpoint**: `POST /api/v1/availability/slots/:slotId/book`
- Updates slot:
  - Sets `is_booked = true`
  - Sets `booking_id` to the new booking ID
  - Removes the temporary lock

### 12. Confirm Booking
- **Service**: Booking Service
- Updates booking status from `PENDING` to `CONFIRMED`
- Commits database transaction

### 13. Send Notification
- **Service**: Notification Service
- **Endpoint**: `POST /api/v1/notifications`
- Creates notification record
- Simulates email sending (logs to console)
- In production, would send actual email

### 14. Release Lock (if booking fails)
- If any step fails, the lock is automatically released
- Lock also expires after 5 minutes if booking is abandoned

## Concurrency Control

### Problem
Multiple users trying to book the same slot simultaneously.

### Solution
1. **Database Transactions**: All booking operations wrapped in transactions
2. **Row-Level Locking**: `SELECT ... FOR UPDATE` prevents concurrent modifications
3. **Temporary Locks**: `slot_locks` table prevents double booking during booking process
4. **Atomic Operations**: Slot booking and booking creation are atomic

### Lock Cleanup
- Expired locks are automatically cleaned up every 5 minutes
- Manual cleanup endpoint: `POST /api/v1/availability/cleanup-locks`

## Booking States

1. **PENDING** - Initial state when booking is created
2. **CONFIRMED** - Booking confirmed, slot marked as booked
3. **CANCELLED** - Booking cancelled by customer or owner
4. **COMPLETED** - Service has been provided

## Cancellation Flow

1. Customer requests cancellation
2. Booking Service validates:
   - User has permission to cancel
   - Booking is not already cancelled
   - Booking is not completed
3. Update booking status to `CANCELLED`
4. Release slot in Availability Service
5. Send cancellation notification

## Error Handling

### Slot Already Booked
- Returns `409 Conflict`
- Customer must select another slot

### Slot Locked
- Returns `409 Conflict`
- Lock expires after 5 minutes
- Customer can retry

### Service Not Found
- Returns `404 Not Found`
- Booking cannot proceed

### Insufficient Permissions
- Returns `403 Forbidden`
- User must be authenticated and authorized

## Future Enhancements

1. **Payment Integration**: Add payment processing before confirming booking
2. **Reservation System**: Allow temporary reservations with payment deadline
3. **Waitlist**: Queue customers when slots are full
4. **Automatic Retry**: Retry booking if lock expires
5. **Booking Reminders**: Send reminders before appointment
6. **Cancellation Policies**: Enforce cancellation deadlines

