import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './auth.js';
import { connectDB } from './db.js';
import { isAllowedOrigin } from './origins.js';
import { issueToken, clearToken, verifyOrigin } from './security.js';
import studioRoutes from './routes/studios.js';
import bookingRoutes from './routes/bookings.js';
import wishlistRoutes from './routes/wishlist.js';
import uploadRoutes from './routes/uploads.js';

for (const envName of ['MONGODB_URI', 'BETTER_AUTH_SECRET', 'STUDIO_JWT_SECRET']) {
  if (!process.env[envName]) {
    throw new Error(`Missing environment variable ${envName}`);
  }
}

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(cors({
  origin(origin, callback) {
    if (!origin) {
      return callback(null, true);
    }

    try {
      return callback(null, isAllowedOrigin(origin));
    } catch {
      return callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS']
}));

app.all('/api/auth/*', toNodeHandler(auth));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use('/api', verifyOrigin);

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'StudioSpace API' });
});

app.post('/api/security/token', issueToken);
app.post('/api/security/logout', clearToken);

app.use('/api/studios', studioRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/uploads', uploadRoutes);

app.use('/api', (_req, res) => {
  res.status(404).json({ message: 'Endpoint not found' });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err instanceof SyntaxError ? 400 : 500).json({
    message: err?.message || 'Unexpected error'
  });
});

const port = Number(process.env.PORT || 5000);

connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`StudioSpace server listening on port ${port}`);
    });
  })
  .catch((error) => {
    console.error('Startup failed:', error);
    process.exit(1);
  });
