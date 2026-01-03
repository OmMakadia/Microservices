# Authentication Service

Handles user registration, login, and JWT token management.

## API Endpoints

### POST /api/v1/auth/register
Register a new user.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "role": "CUSTOMER" // or "SALON_OWNER"
}
```

**Response:**
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

### POST /api/v1/auth/login
Login with email and password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### GET /api/v1/auth/verify
Verify JWT token validity.

### GET /api/v1/auth/profile
Get user profile (requires authentication).

## Database Schema

- `roles` - User roles (CUSTOMER, SALON_OWNER)
- `users` - User accounts with hashed passwords

