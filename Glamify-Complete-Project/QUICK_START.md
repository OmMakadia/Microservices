# 🚀 Quick Start Guide - How to Run Glamify

## Method 1: Docker (Recommended - Easiest)

### Step 1: Install Docker
Make sure you have Docker Desktop installed:
- Windows/Mac: Download from [docker.com](https://www.docker.com/products/docker-desktop)
- Linux: Install Docker Engine and Docker Compose

### Step 2: Open Terminal/Command Prompt
Navigate to the project directory:
```bash
cd C:\Users\91966\Desktop\pashuseva
```

### Step 3: Start All Services
Run this single command:
```bash
docker-compose up -d
```

This will:
- ✅ Download required Docker images (first time only)
- ✅ Start 5 PostgreSQL databases
- ✅ Start 6 microservices
- ✅ Start the React frontend
- ✅ Run database migrations automatically

### Step 4: Wait for Services
Wait about 30-60 seconds for all services to start up.

### Step 5: Access the Application
Open your browser and go to:
- **Frontend (Main App)**: http://localhost:3000
- **API Gateway**: http://localhost:8000

### Step 6: Verify Services are Running
Check if services are healthy:
```bash
# Windows PowerShell
curl http://localhost:8000/health

# Or open in browser:
# http://localhost:8000/health
```

You should see: `{"status":"ok","service":"api-gateway"}`

## Method 2: Local Development (Without Docker)

### Prerequisites
- Node.js 18+ installed
- PostgreSQL installed (or use Docker for databases only)

### Step 1: Start Databases Only
```bash
docker-compose up -d postgres-auth postgres-salon postgres-availability postgres-booking postgres-notification
```

### Step 2: Install Dependencies for Each Service

Open multiple terminal windows and run:

**Terminal 1 - Auth Service:**
```bash
cd services/auth-service
npm install
npm run migrate
npm run dev
```

**Terminal 2 - Salon Service:**
```bash
cd services/salon-service
npm install
npm run migrate
npm run dev
```

**Terminal 3 - Availability Service:**
```bash
cd services/availability-service
npm install
npm run migrate
npm run dev
```

**Terminal 4 - Booking Service:**
```bash
cd services/booking-service
npm install
npm run migrate
npm run dev
```

**Terminal 5 - Notification Service:**
```bash
cd services/notification-service
npm install
npm run migrate
npm run dev
```

**Terminal 6 - API Gateway:**
```bash
cd services/api-gateway
npm install
npm run dev
```

**Terminal 7 - Frontend:**
```bash
cd frontend
npm install
npm start
```

## 🎯 First Time Using the App

### 1. Register as a Customer
1. Go to http://localhost:3000
2. Click "Sign Up"
3. Fill in your details
4. Select "Book appointments" as role
5. Click "Sign up"

### 2. Register as a Salon Owner
1. Click "Sign Up" again (or logout if logged in)
2. Fill in your details
3. Select "Own a salon" as role
4. Click "Sign up"

### 3. Create a Salon (as Owner)
1. Login as salon owner
2. Go to "Owner Dashboard"
3. Click "Create New Salon"
4. Fill in salon details
5. Click "Create Salon"

### 4. Add Services to Salon
1. Go to salon detail page
2. Add services (Haircut, Facial, etc.)
3. Set prices and durations

### 5. Generate Time Slots
1. Go to Owner Dashboard
2. Generate slots for your salon

### 6. Book an Appointment (as Customer)
1. Login as customer
2. Browse salons
3. Select a salon
4. Choose a service
5. Select date and time
6. Confirm booking

## 🛑 Stopping the Services

### If using Docker:
```bash
docker-compose down
```

To also remove all data:
```bash
docker-compose down -v
```

### If running locally:
Press `Ctrl+C` in each terminal window

## 🔍 Troubleshooting

### Port Already in Use
If you get "port already in use" error:
```bash
# Windows - Find what's using the port
netstat -ano | findstr :8000

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

### Services Not Starting
1. Check Docker is running:
   ```bash
   docker ps
   ```

2. Check logs:
   ```bash
   docker-compose logs -f
   ```

3. Restart services:
   ```bash
   docker-compose restart
   ```

### Database Connection Errors
1. Make sure databases are running:
   ```bash
   docker-compose ps
   ```

2. Check database logs:
   ```bash
   docker-compose logs postgres-auth
   ```

### Frontend Not Loading
1. Check if frontend container is running:
   ```bash
   docker ps | grep frontend
   ```

2. Check frontend logs:
   ```bash
   docker-compose logs frontend
   ```

3. Make sure port 3000 is not used by another app

## 📊 Service Status Check

Check if all services are running:
```bash
# Windows PowerShell
curl http://localhost:8000/health  # API Gateway
curl http://localhost:8001/health  # Auth
curl http://localhost:8002/health  # Salon
curl http://localhost:8003/health  # Availability
curl http://localhost:8004/health  # Booking
curl http://localhost:8005/health  # Notification
```

Or visit in browser:
- http://localhost:8000/health
- http://localhost:8001/health
- etc.

## 🎉 Success!

If you can access http://localhost:3000 and see the Glamify homepage, you're all set! 🎊

## Need Help?

- Check `SETUP.md` for detailed setup instructions
- Check `API_DOCUMENTATION.md` for API details
- Check `BOOKING_FLOW.md` to understand the booking process

