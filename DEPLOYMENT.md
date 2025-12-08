# Container Management System - Deployment Guide

## Prerequisites
- Node.js (v16 or higher)
- npm (v8 or higher)
- Server with at least 2GB RAM
- SSL certificate (recommended)

## Installation Steps

### 1. Clone the Repository
```bash
git clone <repository-url>
cd container-management-system
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory with the following variables:
```env
NODE_ENV=production
PORT=3000
JWT_SECRET=your-super-secret-jwt-key-here
DB_PATH=./cargo_management.db
USER_DB_PATH=./user_cargo_management.db
ADMIN_DB_PATH=./admin_cargo_management.db
```

### 4. Security Enhancements
- Change default passwords in the database configuration files
- Update JWT secret in the `.env` file
- Configure SSL/TLS for HTTPS

### 5. Database Setup
The application uses SQLite databases which are automatically created on first run:
- Main database: `cargo_management.db`
- User database: `user_cargo_management.db`
- Admin database: `admin_cargo_management.db`

### 6. Start the Application
```bash
npm start
```

### 7. Reverse Proxy Configuration (Recommended)
Configure nginx or Apache as a reverse proxy for better performance and security.

### 8. Process Manager
Use PM2 or similar process manager for production:
```bash
npm install -g pm2
pm2 start backend/server.js --name container-management
pm2 startup
pm2 save
```

## Deploying to Render Platform

### 1. Create a Render Account
Sign up at [render.com](https://render.com) if you don't have an account.

### 2. Connect Your Repository
- Fork this repository to your GitHub account
- Connect your GitHub account to Render
- Select this repository when creating a new web service

### 3. Configure Your Render Service
The repository includes a `render.yaml` file that defines:
- Node.js environment
- Build and start commands
- Environment variables
- Persistent disk for database storage

### 4. Environment Variables on Render
Render will automatically use the environment variables defined in `render.yaml`. 
The `JWT_SECRET` is configured to be auto-generated for security.

### 5. Deploy
Click "Create Web Service" and Render will:
- Clone your repository
- Install dependencies
- Build the application
- Start the server
- Mount persistent storage for databases

### 6. Access Your Application
Once deployed, Render will provide a URL to access your application.

## Default Credentials
- Admin user: `admin` / `admin123`
- Staff user: `staff` / `staff123`

**Important:** Change these default credentials immediately after deployment!

## Backup Strategy
Regularly backup the SQLite database files:
- `cargo_management.db`
- `user_cargo_management.db`
- `admin_cargo_management.db`

## Monitoring
Implement monitoring for:
- Application uptime
- Database performance
- Error rates
- Resource utilization

## Scaling Considerations
For high-traffic environments, consider:
- Migrating from SQLite to PostgreSQL
- Implementing load balancing
- Adding caching layers
- Using CDN for static assets