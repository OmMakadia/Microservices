# Installing Docker Desktop for Windows

## Step 1: Download Docker Desktop
1. Go to: https://www.docker.com/products/docker-desktop/
2. Click "Download for Windows"
3. Run the installer (Docker Desktop Installer.exe)

## Step 2: Install Docker Desktop
1. Follow the installation wizard
2. Make sure "Use WSL 2 instead of Hyper-V" is checked (if available)
3. Restart your computer when prompted

## Step 3: Start Docker Desktop
1. Open Docker Desktop from Start Menu
2. Wait for Docker to start (whale icon in system tray)
3. You'll see "Docker Desktop is running" when ready

## Step 4: Verify Installation
Open PowerShell and run:
```bash
docker --version
docker-compose --version
```

## Step 5: Start the Project
Once Docker is running:
```bash
cd C:\Users\91966\Desktop\pashuseva
docker-compose up -d
```

Wait 1-2 minutes, then access: http://localhost:3000

