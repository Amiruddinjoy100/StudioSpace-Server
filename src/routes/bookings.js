import express from 'express';import {z} from 'zod';import {bookings,studios,bookingLocks} from '../db.js';import {requireUser} from '../security.js';import {oid,withErrors} from '../utils.js';import {computeRange,timeSlots} from '../booking-time.js';import {randomUUID} from 'node:crypto';
const router=express.Router();router.use(requireUser);
const bookingSchema=z.object({studioId:z.string(),date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),startTime:z.string().regex(/^([01]\d|2[0-3]):(00|30)$/),endTime:z.string().regex(/^([01]\d|2[0-3]):(00|30)$/),note:z.string().max(500).optional().default('')});
router.get('/mine',withErrors(async(req,res)=>{const rows=await bookings.aggregate([{$match:{guestId:req.user.id}},{$sort:{createdAt:-1}},{$lookup:{from:'studios',localField:'studioId',foreignField:'_id',as:'studio'}},{$unwind:{path:'$studio',preserveNullAndEmptyArrays:true}}]).toArray();res.json(rows)}));
router.get('/hosting',withErrors(async(req,res)=>{const rows=await bookings.aggregate([{$match:{hostId:req.user.id}},{$sort:{createdAt:-1}},{$lookup:{from:'studios',localField:'studioId',foreignField:'_id',as:'studio'}},{$unwind:{path:'$studio',preserveNullAndEmptyArrays:true}}]).toArray();res.json(rows)}));
router.post('/',withErrors(async(req,res)=>{let data=bookingSchema.parse(req.body);const id=oid(data.studioId);if(!id)return res.status(400).json({message:'Invalid studio ID'});let range;try{range=computeRange(data.date,data.startTime,data.endTime)}catch(e){return res.status(400).json({message:e.message})}
 const studio=await studios.findOne({_id:id});if(!studio)return res.status(404).json({message:'Studio not found'});if(studio.ownerId===req.user.id)return res.status(400).json({message:'You cannot book your own studio'});
 const conflict=await bookings.findOne({studioId:id,status:{$in:['Confirmed','Completed']},start:{$lt:range.end},end:{$gt:range.start}});
 if(conflict)return res.status(409).json({message:'This slot overlaps an existing confirmed booking'});
 const doc={studioId:id,hostId:studio.ownerId,guestId:req.user.id,guestName:req.user.name,guestEmail:req.user.email,start:range.start,end:range.end,duration:range.duration,note:data.note,status:'Pending',hourlyRate:studio.hourlyRate,deposit:studio.deposit,total:Math.round(studio.hourlyRate*range.duration*100)/100,createdAt:new Date()};const r=await bookings.insertOne(doc);res.status(201).json({id:r.insertedId,status:'Pending'});
}));
router.patch('/:id/cancel',withErrors(async(req,res)=>{const id=oid(req.params.id);if(!id)return res.status(400).json({message:'Invalid booking ID'});const r=await bookings.updateOne({_id:id,guestId:req.user.id,status:'Pending'},{$set:{status:'Cancelled',updatedAt:new Date()}});if(!r.matchedCount)return res.status(409).json({message:'Only your pending bookings may be cancelled'});res.json({ok:true})}));
router.patch('/:id/status',withErrors(async(req,res)=>{const id=oid(req.params.id);if(!id)return res.status(400).json({message:'Invalid booking ID'});
 const target=z.enum(['Confirmed','Completed','Cancelled']).parse(req.body.status);const booking=await bookings.findOne({_id:id,hostId:req.user.id});if(!booking)return res.status(404).json({message:'Booking not found'});
 if(booking.status==='Cancelled'||booking.status==='Completed')return res.status(409).json({message:'This booking is already closed'});
 if(target==='Confirmed'&&booking.status!=='Pending')return res.status(409).json({message:'Only pending bookings can be confirmed'});
 if(target==='Completed'&&booking.status!=='Confirmed')return res.status(409).json({message:'Only confirmed bookings can be completed'});
 if(target==='Cancelled'&&booking.status!=='Pending')return res.status(409).json({message:'Only pending bookings can be cancelled'});
 const attemptId=randomUUID();
 if(target==='Confirmed'){
   const parts=timeSlots(booking.start,booking.end);try{await bookingLocks.insertMany(parts.map(slotKey=>({studioId:booking.studioId,slotKey,bookingId:id,attemptId})),{ordered:true});}
   catch(e){await bookingLocks.deleteMany({attemptId});if(e.code===11000)return res.status(409).json({message:'Someone else confirmed an overlapping time slot'});throw e;}
 }
 const filter={_id:id,hostId:req.user.id,status:booking.status};let result;try{result=await bookings.updateOne(filter,{$set:{status:target,updatedAt:new Date()}})}catch(e){if(target==='Confirmed')await bookingLocks.deleteMany({attemptId});throw e;}
 if(!result.matchedCount){if(target==='Confirmed')await bookingLocks.deleteMany({attemptId});return res.status(409).json({message:'Booking changed, please refresh'})}
 res.json({ok:true,status:target});
}));
export default router;
