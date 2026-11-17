
import express from 'express';
import { z } from 'zod';
import {
  studios,
  bookings,
  bookingLocks,
  wishlists
} from '../db.js';
import { requireUser } from '../security.js';
import { oid, withErrors } from '../utils.js';

const router = express.Router();

const imageUrlSchema = z.string().url().max(1500).refine(
  (value) => {
    const protocol = new URL(value).protocol;
    return protocol === 'http:' || protocol === 'https:';
  },
  { message: 'Image URL must use HTTP or HTTPS' }
);

const schema = z.object({
  title: z.string().trim().min(4).max(100),
  category: z.enum([
    'Photo Studio',
    'Film Stage',
    'Podcast Lounge',
    'Music Suite',
    'Art Workshop'
  ]),
  hourlyRate: z.number().positive().max(100000),
  deposit: z.number().min(0).max(100000),
  capacity: z.number().int().min(1).max(1000),
  location: z.string().trim().min(3).max(200),
  image: imageUrlSchema,
  gallery: z.array(imageUrlSchema).max(15).optional().default([]),
  amenities: z.array(z.string().max(60)).max(25).optional().default([]),
  overview: z.string().trim().min(30).max(6000)
});

const publicProjection = {
  ownerEmail: 0
};

router.get('/', withErrors(async (req, res) => {
  const {
    category,
    search,
    sort = 'newest',
    limit = '24',
    page = '1',
    featured
  } = req.query;

  const query = {};

  if (
    typeof category === 'string' &&
    category !== 'All' &&
    category.length < 80
  ) {
    query.category = category;
  }

  if (typeof search === 'string' && search.trim()) {
    const term = search.trim()
      .slice(0, 100)
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    query.$or = [
      { title: { $regex: term, $options: 'i' } },
      { location: { $regex: term, $options: 'i' } },
      { overview: { $regex: term, $options: 'i' } }
    ];
  }

  const requestedLimit =
    typeof limit === 'string' ? Number(limit) : NaN;

  const safeLimit = featured === 'true'
    ? 6
    : Number.isInteger(requestedLimit) && requestedLimit > 0
      ? Math.min(50, requestedLimit)
      : 24;

  const requestedPage =
    typeof page === 'string' ? Number(page) : NaN;

  const safePage =
    Number.isSafeInteger(requestedPage) && requestedPage > 0
      ? Math.min(requestedPage, 1000000)
      : 1;

  const order =
    sort === 'price-asc'
      ? { hourlyRate: 1 }
      : sort === 'price-desc'
        ? { hourlyRate: -1 }
        : sort === 'rated'
          ? { rating: -1, createdAt: -1 }
          : { createdAt: -1 };

  const [items, total] = await Promise.all([
    studios.find(query, {
      projection: publicProjection
    })
      .sort(order)
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .toArray(),

    studios.countDocuments(query)
  ]);

  res.json({
    items,
    total,
    page: safePage,
    pages: Math.ceil(total / safeLimit)
  });
}));

router.get('/mine', requireUser, withErrors(async (req, res) => {
  const items = await studios.find({
    ownerId: req.user.id
  })
    .sort({ createdAt: -1 })
    .toArray();

  res.json(items);
}));

router.get('/:id', withErrors(async (req, res) => {
  const id = oid(req.params.id);

  if (!id) {
    return res.status(400).json({
      message: 'Invalid studio ID'
    });
  }

  const item = await studios.findOne(
    { _id: id },
    { projection: publicProjection }
  );

  if (!item) {
    return res.status(404).json({
      message: 'Studio not found'
    });
  }

  res.json(item);
}));

router.post('/', requireUser, withErrors(async (req, res) => {
  const data = schema.parse(req.body);

  const out = await studios.insertOne({
    ...data,
    ownerId: req.user.id,
    ownerEmail: req.user.email,
    ownerName: req.user.name,
    ownerImage: req.user.image || '',
    rating: 0,
    reviewCount: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  res.status(201).json({
    id: out.insertedId
  });
}));

router.patch('/:id', requireUser, withErrors(async (req, res) => {
  const id = oid(req.params.id);

  if (!id) {
    return res.status(400).json({
      message: 'Invalid studio ID'
    });
  }

  const data = schema.parse(req.body);

  const result = await studios.updateOne(
    {
      _id: id,
      ownerId: req.user.id
    },
    {
      $set: {
        ...data,
        updatedAt: new Date()
      }
    }
  );

  if (!result.matchedCount) {
    return res.status(404).json({
      message: 'Studio not found or not yours'
    });
  }

  res.json({ ok: true });
}));

router.delete('/:id', requireUser, withErrors(async (req, res) => {
  const id = oid(req.params.id);

  if (!id) {
    return res.status(400).json({
      message: 'Invalid studio ID'
    });
  }

  const item = await studios.findOne({
    _id: id,
    ownerId: req.user.id
  });

  if (!item) {
    return res.status(404).json({
      message: 'Studio not found or not yours'
    });
  }

  const active = await bookings.countDocuments({
    studioId: id,
    status: {
      $in: ['Pending', 'Confirmed']
    }
  });

  if (active) {
    return res.status(409).json({
      message: 'Resolve pending or confirmed bookings before deleting this studio'
    });
  }

  await studios.deleteOne({
    _id: id,
    ownerId: req.user.id
  });

  await bookingLocks.deleteMany({ studioId: id });
  await wishlists.deleteMany({ studioId: id });

  res.json({ ok: true });
}));

export default router;
