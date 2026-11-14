import 'dotenv/config';
import {connectDB,studios,mongoClient,db} from './db.js';
import {auth} from './auth.js';

// Local demonstration ONLY. Never deploy this account or run a public production seed.
const email='examiner@studiospace.test';
const password='DemoPass123';
await connectDB();
let user=await db.collection('user').findOne({email});
if(!user){
  try {
    const result=await auth.api.signUpEmail({body:{name:'StudioSpace Examiner',email,password}});
    user=result?.user || await db.collection('user').findOne({email});
    console.log('Created local examiner account');
  } catch(e) { console.error('Could not create test user:',e.message); process.exitCode=1; }
}
if(user){
 const examples=[
  ['The Lumen Loft','Photo Studio',85,'Brooklyn, New York','https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1100&q=85','Soft daylight, movable backdrops, and a beautifully minimal creative loft designed for editorial shoots and campaigns.'],
  ['Framehouse Cinema Stage','Film Stage',175,'Los Angeles, California','https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1100&q=85','A cinematic production space with practical sets, lighting control, generous ceiling height, and dedicated green room.'],
  ['The Signal Podcast Room','Podcast Lounge',65,'Austin, Texas','https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=1100&q=85','A cozy sound-treated podcast room with microphones, a mixer, comfortable seating, and warm adjustable studio lighting.'],
  ['Analog Sound Collective','Music Suite',110,'Nashville, Tennessee','https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=1100&q=85','Professional music rehearsal and recording facilities for artists, bands, and producers looking for inspired acoustics.'],
  ['Makers Atelier','Art Workshop',70,'Portland, Oregon','https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=1100&q=85','A light-filled workshop for pottery, painting, and community creativity, with flexible tables and an inspiring atmosphere.'],
  ['Daybreak Creative Studio','Photo Studio',125,'Chicago, Illinois','https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1100&q=85','An airy warehouse studio with a cyc wall, styling station, seamless paper, and sweeping natural light all day.'],
 ];
 const count=await studios.countDocuments();
 if(!count){await studios.insertMany(examples.map(([title,category,hourlyRate,location,image,overview],i)=>({title,category,hourlyRate,location,image,overview,deposit:50,capacity:12,gallery:[image],amenities:['Wi-Fi','Lighting gear','Air conditioning','Parking'],ownerId:String(user.id||user._id),ownerEmail:email,ownerName:'StudioSpace Examiner',rating:[4.9,4.8,5,4.7,4.9,4.8][i],reviewCount:[42,18,30,12,25,21][i],createdAt:new Date(Date.now()-i*86400000),updatedAt:new Date()})));
 console.log('Seeded six studios owned by the examiner account.');
 } else console.log(`Database already contains ${count} studios; skipping studio seed.`);
 console.log(`LOCAL EXAMINER LOGIN → ${email} / ${password}`);
}
await mongoClient.close();
