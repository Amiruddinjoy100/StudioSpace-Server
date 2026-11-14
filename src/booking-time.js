// Booking times use a normalized studio-local ISO representation (YYYY-MM-DDTHH:mm:ss).
// This teaching project assumes one booking timezone for each day. For multi-region production,
// add an IANA timezone per studio and persist UTC instants as well.
export function overlap(aStart,aEnd,bStart,bEnd){return aStart<bEnd&&aEnd>bStart}
export function timeSlots(start,end){
 const a=Date.parse(`${start}Z`),b=Date.parse(`${end}Z`);
 if(!Number.isFinite(a)||!Number.isFinite(b)||b<=a)throw new Error('Invalid time range');
 const result=[];for(let t=a;t<b;t+=30*60*1000)result.push(new Date(t).toISOString().slice(0,16));return result;
}
export function computeRange(date,startTime,endTime,now=Date.now()){
 const start=`${date}T${startTime}:00`,end=`${date}T${endTime}:00`;
 const a=Date.parse(`${start}Z`),b=Date.parse(`${end}Z`),duration=(b-a)/3600000;
 if(!Number.isFinite(duration)||duration<1||duration>12||!Number.isFinite(Date.parse(`${date}T00:00:00Z`))||new Date(`${date}T00:00:00Z`).toISOString().slice(0,10)!==date)throw new Error('Select 1–12 hours on the same day');
 if(a<=now)throw new Error('Booking time must be in the future');
 return {start,end,duration};
}
