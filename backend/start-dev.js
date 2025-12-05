// Cross-platform script to set environment variables and start the server
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
process.env.PORT = process.env.PORT || 3000;

// Import and run the main server
import('./server.js');