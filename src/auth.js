
import 'dotenv/config';

import { betterAuth } from 'better-auth';
import { mongodbAdapter } from '@better-auth/mongo-adapter';
import { jwt } from 'better-auth/plugins';

import { db, mongoClient } from './db.js';


const serverUrl = (
  process.env.SERVER_URL || 'http://localhost:5000'
).replace(/\/+$/, '');


const clientUrl = (
  process.env.CLIENT_URL || 'http://localhost:3000'
).replace(/\/+$/, '');


const googleClientId = process.env.GOOGLE_CLIENT_ID?.trim();
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();

const googleEnabled = Boolean(
  googleClientId && googleClientSecret
);

export const auth = betterAuth({

  appName: 'StudioSpace',


  database: mongodbAdapter(
    db,
    process.env.MONGODB_REPLICA_SET === 'true'
      ? { client: mongoClient }
      : {}
  ),


  secret: process.env.BETTER_AUTH_SECRET,


  baseURL: serverUrl,


  trustedOrigins: [
    clientUrl,


    'https://studiospace-client-phi.vercel.app',


    'https://studiospace-client-git-main-amir-405a.vercel.app',


    'https://studiospace-client-ndd4es6e8-amir-405a.vercel.app',

    'https://studiospace-client-*-amir-405a.vercel.app'
  ],

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 6,
    maxPasswordLength: 128
  },


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


  advanced: {
    database: {
      joins: true
    }
  }

});
