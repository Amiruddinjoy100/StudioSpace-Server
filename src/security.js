import { SignJWT, jwtVerify } from 'jose';
import { fromNodeHeaders } from 'better-auth/node';
import { auth } from './auth.js';
import { isAllowedOrigin } from './origins.js';

const cookieName = 'studio_access';
const tokenLifetime = 24 * 60 * 60 * 1000;

function key() {
  const secret = process.env.STUDIO_JWT_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error('STUDIO_JWT_SECRET should be at least 32 characters');
  }

  return new TextEncoder().encode(secret);
}

async function getAuthSession(req) {
  return auth.api.getSession({
    headers: fromNodeHeaders(req.headers)
  });
}

export async function issueToken(req, res) {
  try {
    const session = await getAuthSession(req);

    if (!session?.user) {
      return res.status(401).json({
        message: 'Please sign in to continue'
      });
    }

    const token = await new SignJWT({
      email: session.user.email,
      name: session.user.name
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(String(session.user.id))
      .setIssuedAt()
      .setIssuer('studiospace-api')
      .setAudience('studiospace-web')
      .setExpirationTime('24h')
      .sign(key());

    res.cookie(cookieName, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: tokenLifetime
    });

    return res.json({ ok: true });
  } catch (error) {
    console.error('[Security] Token creation failed:', error);

    return res.status(500).json({
      message: 'Could not create access token'
    });
  }
}

export function clearToken(_req, res) {
  res.clearCookie(cookieName, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/'
  });

  return res.json({ ok: true });
}

export async function requireUser(req, res, next) {
  try {
    const token = req.cookies?.[cookieName];

    if (!token) {
      return res.status(401).json({
        message: 'Please sign in again'
      });
    }

    const { payload } = await jwtVerify(token, key(), {
      issuer: 'studiospace-api',
      audience: 'studiospace-web'
    });

    const session = await getAuthSession(req);

    if (!session?.user || String(session.user.id) !== payload.sub) {
      return res.status(401).json({
        message: 'Session expired. Please sign in again'
      });
    }

    req.user = {
      id: String(payload.sub),
      email: session.user.email,
      name: session.user.name,
      image: session.user.image
    };

    return next();
  } catch (error) {
    console.error('[Security] Authentication verification failed:', error.message);

    return res.status(401).json({
      message: 'Invalid or expired session'
    });
  }
}

export function verifyOrigin(req, res, next) {
  if (!['POST', 'PATCH', 'PUT', 'DELETE'].includes(req.method)) {
    return next();
  }

  const origin = req.get('origin');

  if (!origin) {
    return res.status(403).json({
      message: 'Missing request origin'
    });
  }

  if (!isAllowedOrigin(origin)) {
    return res.status(403).json({
      message: 'Untrusted request origin'
    });
  }

  return next();
}
