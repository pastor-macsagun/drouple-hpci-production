/**
 * Test app setup for mobile API integration tests
 */

import { NextRequest, NextResponse } from 'next/server';

// Create a mock app for supertest
export function createApp() {
  // Simple Express-like app for testing
  const app: any = {
    post: (path: string, handler: Function) => {
      app._routes = app._routes || {};
      app._routes[`POST ${path}`] = handler;
    },
    get: (path: string, handler: Function) => {
      app._routes = app._routes || {};
      app._routes[`GET ${path}`] = handler;
    },
    // Mock supertest-like interface
    listen: (callback?: Function) => {
      if (callback) callback();
      return { address: () => ({ port: 3000 }) };
    },
    // Handle requests for supertest
    handle: async (req: any, res: any) => {
      const method = req.method;
      const url = req.url;
      const route = `${method} ${url}`;
      
      if (app._routes[route]) {
        // Convert to Next.js format
        const nextReq = new NextRequest(req.url, {
          method: req.method,
          headers: req.headers,
          body: req.body ? JSON.stringify(req.body) : undefined,
        });
        
        const response = await app._routes[route](nextReq);
        
        if (response instanceof NextResponse) {
          const body = await response.text();
          res.status(response.status);
          res.set(Object.fromEntries(response.headers.entries()));
          res.send(body);
        } else if (response instanceof Response) {
          const body = await response.text();
          res.status(response.status);
          res.send(body);
        } else {
          res.status(200).json(response);
        }
      } else {
        res.status(404).json({ error: 'Not found' });
      }
    },
  };
  
  return app;
}