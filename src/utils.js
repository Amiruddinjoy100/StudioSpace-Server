import {ObjectId} from 'mongodb';
export function oid(value){if(typeof value!=='string'||!ObjectId.isValid(value)||new ObjectId(value).toString()!==value.toLowerCase())return null;return new ObjectId(value)}
export function handleError(err,res){console.error(err);if(err?.code===11000)return res.status(409).json({message:'This item already exists or that time is unavailable.'});if(err?.name==='ZodError')return res.status(400).json({message:err.issues?.[0]?.message||'Invalid form data'});return res.status(500).json({message:'Something went wrong. Please try again.'})}
export const withErrors=fn=>(req,res,next)=>Promise.resolve(fn(req,res,next)).catch(e=>handleError(e,res));
export const serialize=x=>JSON.parse(JSON.stringify(x));
