# Notification Service

Handles notifications and email simulation.

## API Endpoints

### POST /api/v1/notifications
Create a notification (internal use).

**Request:**
```json
{
  "userId": 1,
  "type": "BOOKING_CONFIRMED",
  "title": "Booking Confirmed",
  "message": "Your booking has been confirmed",
  "bookingId": 123
}
```

### GET /api/v1/notifications
Get user notifications.

**Query params:**
- `unreadOnly` - Only return unread notifications

### PUT /api/v1/notifications/:id/read
Mark a notification as read.

### PUT /api/v1/notifications/read-all
Mark all notifications as read.

### GET /api/v1/notifications/unread/count
Get count of unread notifications.

## Email Simulation

Notifications are logged to console as email simulations. In production, this would integrate with email services like SendGrid, AWS SES, etc.

## Database Schema

- `notifications` - Notification records

