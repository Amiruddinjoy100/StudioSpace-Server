import express from 'express';import multer from 'multer';import {requireUser} from '../security.js';import {withErrors} from '../utils.js';const router=express.Router();const upload=multer({storage:multer.memoryStorage(),limits:{fileSize:5*1024*1024},fileFilter(_req,file,cb){if(!/^image\/(jpeg|png|webp|gif)$/.test(file.mimetype))return cb(new Error('Only JPEG, PNG, WEBP or GIF supported'));cb(null,true)}});
router.post('/',requireUser,upload.single('image'),withErrors(async(req,res)=>{if(!req.file)return res.status(400).json({message:'Select an image'});
 if(!process.env.IMGBB_API_KEY)return res.status(503).json({message:'Set IMGBB_API_KEY in server/.env to upload images. You may paste a URL instead.'});
 const fd=new FormData();fd.append('image',req.file.buffer.toString('base64'));
 const response=await fetch(`https://api.imgbb.com/1/upload?key=${encodeURIComponent(process.env.IMGBB_API_KEY)}`,{method:'POST',body:fd});
 const data=await response.json();if(!response.ok||!data?.data?.url)return res.status(502).json({message:'Image host could not process your upload'});res.json({url:data.data.url});
}));export default router;