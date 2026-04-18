import { resolveImageUrl } from '../image';

/**
 * image.js reads EXPO_PUBLIC_API_URL at module load time, so tests that need a
 * different value use jest.isolateModules() + require() to get a fresh module.
 */

// Default env already set in the module loaded at the top of this file.
// For tests that need a controlled URL we load a fresh module via isolateModules.
const withEnv = (url, fn) => {
  let result;
  const saved = process.env.EXPO_PUBLIC_API_URL;
  process.env.EXPO_PUBLIC_API_URL = url;
  jest.isolateModules(() => {
    const mod = require('../image');
    result = fn(mod.resolveImageUrl);
  });
  process.env.EXPO_PUBLIC_API_URL = saved;
  return result;
};

describe('resolveImageUrl', () => {
  it('returns null for null input', () => {
    expect(resolveImageUrl(null)).toBeNull();
  });

  it('returns null for undefined input', () => {
    expect(resolveImageUrl(undefined)).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(resolveImageUrl('')).toBeNull();
  });

  it('returns an absolute http URL unchanged', () => {
    const url = 'http://other.com/image.png';
    expect(resolveImageUrl(url)).toBe(url);
  });

  it('returns an absolute https URL unchanged', () => {
    const url = 'https://cdn.example.com/storage/products/photo.jpg';
    expect(resolveImageUrl(url)).toBe(url);
  });

  it('prepends origin for a root-relative /storage/ path', () => {
    const result = withEnv('http://example.com/api', (fn) =>
      fn('/storage/products/image.png'),
    );
    expect(result).toBe('http://example.com/storage/products/image.png');
  });

  it('prepends origin for a storage/ path without leading slash', () => {
    const result = withEnv('http://example.com/api', (fn) =>
      fn('storage/products/image.png'),
    );
    expect(result).toBe('http://example.com/storage/products/image.png');
  });

  it('prepends /storage/ for a bare path like "products/abc.jpg"', () => {
    const result = withEnv('http://example.com/api', (fn) =>
      fn('products/abc.jpg'),
    );
    expect(result).toBe('http://example.com/storage/products/abc.jpg');
  });

  it('strips /api suffix from base URL when building origin', () => {
    const result = withEnv('http://example.com/api', (fn) =>
      fn('/storage/img.png'),
    );
    expect(result).toBe('http://example.com/storage/img.png');
  });

  it('works when EXPO_PUBLIC_API_URL is empty', () => {
    const result = withEnv('', (fn) => fn('/storage/img.png'));
    expect(result).toBe('/storage/img.png');
  });
});

