import test from 'node:test';
import assert from 'node:assert/strict';
import { getAllowedOrigins, isAllowedOrigin } from '../src/origins.js';

test('configured production and Vercel origins are allowed', () => {
  const allowed = getAllowedOrigins({
    CLIENT_URL: 'https://example.com',
    CLIENT_URLS: 'https://preview.example.com, https://staging.example.com'
  });

  assert.equal(allowed.has('https://example.com'), true);
  assert.equal(allowed.has('https://preview.example.com'), true);
  assert.equal(allowed.has('https://staging.example.com'), true);
  assert.equal(allowed.has('https://studiospace-client-phi.vercel.app'), true);
});

test('unapproved and malformed origins are rejected', () => {
  const allowed = getAllowedOrigins({
    CLIENT_URL: 'https://example.com',
    CLIENT_URLS: ''
  });

  assert.equal(isAllowedOrigin('https://evil.example', allowed), false);
  assert.equal(isAllowedOrigin('not-a-url', allowed), false);
  assert.equal(isAllowedOrigin('javascript:alert(1)', allowed), false);
});

test('origin comparison ignores paths and trailing slashes', () => {
  const allowed = getAllowedOrigins({
    CLIENT_URL: 'https://example.com/path/',
    CLIENT_URLS: ''
  });

  assert.equal(isAllowedOrigin('https://example.com/another-path', allowed), true);
});
