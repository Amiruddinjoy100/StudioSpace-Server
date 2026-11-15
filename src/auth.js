
import 'dotenv/config';

import { betterAuth } from 'better-auth';
import { mongodbAdapter } from '@better-auth/mongo-adapter';
import { jwt } from 'better-auth/plugins';

import { db, mongoClient } from './db.js';

// Backend URL (Render / Localhost)
const serverUrl = (
  process.env.SERVER_URL || 'http://localhost:5000'
).replace(/\/+$/, '');

// Frontend URL (Vercel / Localhost)
const clientUrl = (
  process.env.CLIENT_URL || 'http://localhost:3000'
).replace(/\/+$/, '');

// Google OAuth credentials
const googleClientId = process.env.GOOGLE_CLIENT_ID?.trim();
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();

const googleEnabled = Boolean(
  googleClientId && googleClientSecret
);

export const auth = betterAuth({

  appName: 'StudioSpace',

  // MongoDB connection
  database: mongodbAdapter(
    db,
    process.env.MONGODB_REPLICA_SET === 'true'
      ? { client: mongoClient }
      : {}
  ),

  // Authentication secret
  secret: process.env.BETTER_AUTH_SECRET,

  // IMPORTANT: Backend URL
  baseURL: serverUrl,

  // Allow frontend requests
  trustedOrigins: [
    clientUrl
  ],

  // Email and password authentication
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 6,
    maxPasswordLength: 128
  },

  // Google OAuth
  socialProviders: googleEnabled
    ? {
        google: {
          clientId: googleClientId,
          clientSecret: googleClientSecret
        }
      }
    : {},

  // JWT plugin
  plugins: [
    jwt()
  ],

  // Database configuration
  advanced: {
    database: {
      joins: true
    }
  }

});
