import {SignJWT,jwtVerify} from 'jose';
import {fromNodeHeaders} from 'better-auth/node';
import {auth} from './auth.js';
const cookieName='studio_access';
function key(){const secret=process.env.STUDIO_JWT_SECRET;if(!secret||secret.length<32)throw new Error('STUDIO_JWT_SECRET should be at least 32 characters');return new TextEncoder().encode(secret)}
export async function issueToken(req,res){
 const session=await auth.api.getSession({headers:fromNodeHeaders(req.headers)});
 if(!session?.user)return res.status(401).json({message:'Please sign in to continue'});
 const token=await new SignJWT({email:session.user.email,name:session.user.name}).setProtectedHeader({alg:'HS256'}).setSubject(String(session.user.id)).setIssuedAt().setIssuer('studiospace-api').setAudience('studiospace-web').setExpirationTime('24h').sign(key());
 res.cookie(cookieName,token,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:24*60*60*1000});res.json({ok:true});
}
export function clearToken(_req,res){res.clearCookie(cookieName,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/'});res.json({ok:true})}
export async function requireUser(req,res,next){
 try{const token=req.cookies?.[cookieName];if(!token)return res.status(401).json({message:'Please sign in again'});
 const {payload}=await jwtVerify(token,key(),{issuer:'studiospace-api',audience:'studiospace-web'});
 // A JWT is accepted only while a valid Better Auth session still exists.
 const session=await auth.api.getSession({headers:fromNodeHeaders(req.headers)});
 if(!session?.user||String(session.user.id)!==payload.sub)return res.status(401).json({message:'Session expired. Please sign in again'});
 req.user={id:String(payload.sub),email:session.user.email,name:session.user.name,image:session.user.image};next();
 }catch(error){res.status(401).json({message:'Invalid or expired session'})}
}
export function verifyOrigin(req,res,next){
 if(!['POST','PATCH','PUT','DELETE'].includes(req.method))return next();
 const origin=req.headers.origin;
 if(origin&&origin!==(process.env.CLIENT_URL||'http://localhost:3000'))return res.status(403).json({message:'Untrusted request origin'});
 next();
}
