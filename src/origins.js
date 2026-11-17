const fixedVercelOrigins = [
  'https://studiospace-client-phi.vercel.app',
  'https://studiospace-client-git-main-amir-405a.vercel.app',
  'https://studiospace-client-ndd4es6e8-amir-405a.vercel.app'
];

function toOrigin(value) {
  const url = new URL(value.trim());

  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('Only HTTP and HTTPS origins are allowed.');
  }

  return url.origin;
}

export function getAllowedOrigins(env = process.env) {
  const configured = [
    env.CLIENT_URL || 'http://localhost:3000',
    ...(env.CLIENT_URLS || '').split(','),
    ...fixedVercelOrigins
  ];

  return new Set(
    configured
      .map((value) => value.trim())
      .filter(Boolean)
      .map(toOrigin)
  );
}

export function isAllowedOrigin(origin, allowedOrigins = getAllowedOrigins()) {
  try {
    return allowedOrigins.has(toOrigin(origin));
  } catch {
    return false;
  }
}
