# Troubleshooting: Connection Refused Error

## Problem
You're seeing: `ERR_CONNECTION_REFUSED` when accessing http://localhost:3000

## Root Cause
The services are not running. Docker is not installed or services haven't been started.

## Solution Options

### ✅ Option 1: Install Docker (RECOMMENDED - Easiest)

**Why Docker?**
- Automatically sets up all databases
- Runs all services with one command
- No manual configuration needed

**Steps:**
1. **Download Docker Desktop:**
   - Visit: https://www.docker.com/products/docker-desktop/
   - Download "Docker Desktop for Windows"
   - Run the installer

2. **Install Docker Desktop:**
   - Follow the installation wizard
   - Restart your computer if prompted
   - Launch Docker Desktop from Start Menu
   - Wait until you see "Docker Desktop is running"

3. **Verify Docker is working:**
   ```powershell
   docker --version
   docker-compose --version
   ```

4. **Start the project:**
   ```powershell
   cd C:\Users\91966\Desktop\pashuseva
   docker-compose up -d
   ```

5. **Wait 1-2 minutes**, then check:
   - http://localhost:3000 (Frontend)
   - http://localhost:8000/health (API Gateway)

---

### ⚠️ Option 2: Run Without Docker (Advanced)

**Requirements:**
- PostgreSQL installed and running
- 5 separate PostgreSQL databases created
- More complex setup

**Steps:**
1. Install PostgreSQL from: https://www.postgresql.org/download/windows/

2. Create 5 databases:
   - `auth_db`
   - `salon_db`
   - `availability_db`
   - `booking_db`
   - `notification_db`

3. Update database connection strings in each service's code

4. Run the startup script:
   ```powershell
   .\start-local.ps1
   ```

**Note:** This is much more complex. Docker is strongly recommended.

---

## Quick Check: Is Docker Running?

Run this command:
```powershell
docker ps
```

**If you see:** `docker: The term 'docker' is not recognized`
→ Docker is not installed. Install Docker Desktop (Option 1 above).

**If you see:** `Cannot connect to the Docker daemon`
→ Docker Desktop is not running. Start Docker Desktop from Start Menu.

**If you see:** A list of containers
→ Docker is running! Try starting the project:
```powershell
docker-compose up -d
```

---

## After Installing Docker

1. **Start Docker Desktop** (from Start Menu)

2. **Wait for it to fully start** (whale icon in system tray)

3. **Open PowerShell** in the project folder:
   ```powershell
   cd C:\Users\91966\Desktop\pashuseva
   ```

4. **Start services:**
   ```powershell
   docker-compose up -d
   ```

5. **Check if services are running:**
   ```powershell
   docker ps
   ```
   You should see containers for:
   - api-gateway
   - auth-service
   - salon-service
   - availability-service
   - booking-service
   - notification-service
   - frontend
   - postgres-auth, postgres-salon, etc.

6. **Wait 30-60 seconds** for services to initialize

7. **Access the app:**
   - Frontend: http://localhost:3000
   - API: http://localhost:8000/health

---

## Still Having Issues?

### Check Ports
Make sure these ports are free:
- 3000 (Frontend)
- 8000-8005 (Services)
- 5432-5436 (Databases)

### Check Logs
```powershell
docker-compose logs
```

### Restart Services
```powershell
docker-compose down
docker-compose up -d
```

### Full Reset
```powershell
docker-compose down -v
docker-compose up -d
```
⚠️ Warning: This deletes all data!

---

## Need More Help?

1. Check `INSTALL_DOCKER.md` for Docker installation details
2. Check `QUICK_START.md` for step-by-step guide
3. Check `SETUP.md` for detailed setup instructions

