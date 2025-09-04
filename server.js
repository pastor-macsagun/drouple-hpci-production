/**
 * Custom Next.js Server with Socket.IO Integration
 * Enables realtime features for mobile clients
 */

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { initializeSocketServer } = require('./lib/socket-server');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const port = process.env.PORT || 3000;

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  // Initialize Socket.IO server
  initializeSocketServer(server, {
    cors: {
      origin: dev ? [
        'http://localhost:3000',
        'http://localhost:19006', // Expo dev server
        'http://127.0.0.1:19006', // Alternative Expo dev server
      ] : [
        `https://${process.env.VERCEL_URL}`,
        'https://*.vercel.app',
        process.env.FRONTEND_URL,
      ].filter(Boolean),
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${port}`);
    console.log(`> Socket.IO server running on same port`);
  });

  // Graceful shutdown
  const gracefulShutdown = () => {
    console.log('Received shutdown signal, closing server...');
    
    const { shutdownSocketServer } = require('./lib/socket-server');
    
    shutdownSocketServer().then(() => {
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });
  };

  process.on('SIGTERM', gracefulShutdown);
  process.on('SIGINT', gracefulShutdown);
});