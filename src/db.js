import 'dotenv/config';
import {MongoClient} from 'mongodb';
if(!process.env.MONGODB_URI)throw new Error('MONGODB_URI must be configured');
export const mongoClient=new MongoClient(process.env.MONGODB_URI);
export const db=mongoClient.db(process.env.MONGODB_DB||'studiospace');
export const studios=db.collection('studios');
export const bookings=db.collection('bookings');
export const bookingLocks=db.collection('bookingLocks');
export const wishlists=db.collection('wishlists');
export async function connectDB(){await mongoClient.connect();await Promise.all([
 studios.createIndex({createdAt:-1}),studios.createIndex({category:1,hourlyRate:1}),
 studios.createIndex({ownerId:1}),bookings.createIndex({guestId:1,start:1}),
 bookings.createIndex({studioId:1,status:1,start:1,end:1}),
 bookingLocks.createIndex({studioId:1,slotKey:1},{unique:true}),
 wishlists.createIndex({userId:1,studioId:1},{unique:true})
 ]);console.log('Connected to MongoDB')}
