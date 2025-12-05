// Production script to set environment variables and start the server
process.env.NODE_ENV = 'production';
process.env.PORT = process.env.PORT || 3000;

// Import and run the main server
import('./server.js');