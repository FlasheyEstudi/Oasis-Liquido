import { NextRequest } from 'next/server';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils/api-response';
import { searchPhoton } from '@/lib/map/photon';

const cache = new Map<string, { results: any[]; expiry: number }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q');
    if (!q || q.trim().length < 3) {
      return successResponse({ results: [] });
    }

    const cacheKey = q.trim().toLowerCase();
    const cached = cache.get(cacheKey);
    const now = Date.now();
    if (cached && cached.expiry > now) {
      return successResponse({ results: cached.results });
    }

    const results = await searchPhoton(q);
    
    // Simple cache cleanup to avoid memory leak
    if (cache.size > 2000) {
      for (const [key, val] of cache.entries()) {
        if (val.expiry <= now) {
          cache.delete(key);
        }
      }
    }

    cache.set(cacheKey, { results, expiry: now + CACHE_TTL_MS });

    return successResponse({ results });
  } catch (error: any) {
    console.error('Geo Search API Error:', error);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Error al buscar direcciones', 500);
  }
}
