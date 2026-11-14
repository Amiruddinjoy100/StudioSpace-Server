import 'dotenv/config';
import {betterAuth} from 'better-auth';
import {mongodbAdapter} from '@better-auth/mongo-adapter';
import {jwt} from 'better-auth/plugins';
import {db,mongoClient} from './db.js';
const googleEnabled=Boolean(process.env.GOOGLE_CLIENT_ID&&process.env.GOOGLE_CLIENT_SECRET);
export const auth=betterAuth({
 database: mongodbAdapter(db, process.env.MONGODB_REPLICA_SET==='true'?{client:mongoClient}:{}),
 secret: process.env.BETTER_AUTH_SECRET,
 baseURL:process.env.SERVER_URL||'http://localhost:5000',
 trustedOrigins:[process.env.CLIENT_URL||'http://localhost:3000'],
 emailAndPassword:{enabled:true,minPasswordLength:6, maxPasswordLength:128},
 socialProviders:googleEnabled?{google:{clientId:process.env.GOOGLE_CLIENT_ID,clientSecret:process.env.GOOGLE_CLIENT_SECRET}}:{},
 plugins:[jwt()],
 advanced:{database:{joins:true}}
});
