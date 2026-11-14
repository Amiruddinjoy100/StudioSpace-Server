
import 'dotenv/config';

import { betterAuth } from 'better-auth';
import { mongodbAdapter } from '@better-auth/mongo-adapter';
import { jwt } from 'better-auth/plugins';

import { db, mongoClient } from './db.js';



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


 
  baseURL: clientUrl,


  trustedOrigins: [
    clientUrl
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


  plugins: [
    jwt()
  ],


  advanced: {
    database: {
      joins: true
    }
  }

});
