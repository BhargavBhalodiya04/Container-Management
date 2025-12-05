# Container Management System

A comprehensive web application for managing container logistics, bookings, maintenance, and user requests.

## Features

- **Container Management**: Track container inventory, locations, and movements
- **Booking System**: Manage customer bookings for container rentals
- **Request Management**: Handle user requests for containers with approval workflow
- **Maintenance Tracking**: Monitor and schedule container maintenance
- **User Management**: Admins can create and manage users with different roles
- **Activity Logging**: Track user activities and system events
- **Real-time Notifications**: Keep users informed of status changes

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js with Express.js
- **Database**: SQLite (with potential to migrate to PostgreSQL)
- **Authentication**: JWT-based authentication
- **Deployment**: Ready for cloud or on-premise deployment

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm (v8 or higher)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd container-management-system
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Access the application at `http://localhost:3000`

### Default Credentials

- **Admin**: username `admin`, password `admin123`
- **Staff**: username `staff`, password `staff123`

⚠️ **Important**: Change these default credentials immediately after deployment!

## User Management

Admin users can create new users through the Admin Settings panel:
1. Navigate to System Settings in the admin dashboard
2. Go to the User Management tab
3. Click "Add New User"
4. Fill in user details including username, password, and role
5. New users can log in using their credentials

### Enhanced User Database Segregation

The system now implements role-based user storage:
- Users with 'user' or 'staff' roles are stored in the user database
- Admin users are stored in the admin database
- This segregation improves security and data organization

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

## Project Structure

```
container-management-system/
├── backend/
│   ├── config/          # Database configurations
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Authentication and other middleware
│   ├── models/          # Data models
│   └── server.js        # Main server file
├── frontend/
│   ├── *.html           # HTML pages
│   ├── *.js             # Client-side JavaScript
│   └── *.css            # Stylesheets
├── *.db                 # SQLite database files
├── package.json         # Project dependencies and scripts
└── README.md            # This file
```

## Security Considerations

- All API endpoints are protected with JWT authentication
- Role-based access control (RBAC) for different user types
- Passwords should be hashed in production (currently plain text for demo)
- Environment variables for sensitive configuration
- CORS protection enabled

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please open an issue on the repository or contact the development team."# Container-Management" 
