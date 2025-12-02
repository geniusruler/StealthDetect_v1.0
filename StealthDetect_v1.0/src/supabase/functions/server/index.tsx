import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import { iocRoutes } from "./ioc-routes.tsx";
import { adminRoutes } from "./admin-routes.tsx";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-91fc533e/health", (c) => {
  return c.json({ 
    status: "ok", 
    timestamp: new Date().toISOString(),
    services: ['ioc-management', 'spyguard-integration', 'threat-intelligence'],
  });
});

// Mount IoC routes
app.route("/", iocRoutes);

// Mount Admin routes
app.route("/", adminRoutes);

Deno.serve(app.fetch);