import { describe, it, expect, vi, beforeEach } from 'vitest';
import { calculateRealRoute, routeCache, getCacheKey, calculateHaversineFallback } from '../src/lib/map/osrm';
import { selectBestRoute, multiRouteCache, getMultiCacheKey } from '../src/lib/map/route-selector';
import fetch from 'node-fetch';

vi.mock('node-fetch', async () => {
  return {
    default: vi.fn(),
  };
});

describe('OSRM Routing Cache & Fallback Audit', () => {
  beforeEach(() => {
    routeCache.clear();
    multiRouteCache.clear();
    vi.resetAllMocks();
  });

  it('should generate consistent cache keys formatted to 4 decimals', () => {
    const key1 = getCacheKey(12.115432, -86.236812, 12.126543, -86.247890);
    const key2 = getCacheKey(12.115410, -86.236830, 12.126510, -86.247870);
    expect(key1).toBe('12.1154,-86.2368->12.1265,-86.2479');
    expect(key1).toBe(key2); // Coordinates within ~11 meters map to same key
  });

  it('should compute high-fidelity Haversine fallback when OSRM is offline', () => {
    const fallback = calculateHaversineFallback(12.1154, -86.2368, 12.1265, -86.2479);
    expect(fallback.distanceKm).toBeGreaterThan(0);
    expect(fallback.distance_meters).toBeGreaterThan(0);
    expect(fallback.durationMinutes).toBeGreaterThan(0);
    expect(fallback.duration_seconds).toBeGreaterThan(0);
    expect(fallback.route.length).toBe(7); // start + 5 steps + end
  });

  it('should write computed routes to routeCache and hit cache on subsequent requests', async () => {
    const mockedFetch = fetch as any;
    
    // Mock successful OSRM response
    mockedFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 'Ok',
        routes: [
          {
            geometry: 'g_s`B_o~gHwE_@', // Encoded polyline representing coordinates
            distance: 1200,
            duration: 180,
          },
        ],
      }),
    });

    const startLat = 12.1154;
    const startLng = -86.2368;
    const endLat = 12.1265;
    const endLng = -86.2479;

    // First call: Should query OSRM (mockedFetch called)
    const result1 = await calculateRealRoute(startLat, startLng, endLat, endLng);
    expect(mockedFetch).toHaveBeenCalledTimes(1);
    expect(result1.distanceKm).toBe(1.2);
    expect(result1.durationMinutes).toBe(3);

    // Cache should now hold the result
    const cacheKey = getCacheKey(startLat, startLng, endLat, endLng);
    expect(routeCache.has(cacheKey)).toBe(true);

    // Second call: Should read from cache (mockedFetch not called again)
    const result2 = await calculateRealRoute(startLat, startLng, endLat, endLng);
    expect(mockedFetch).toHaveBeenCalledTimes(1); // Still 1
    expect(result2).toEqual(result1);
  });

  it('should write multi-waypoint routes to multiRouteCache and hit cache', async () => {
    const mockedFetch = fetch as any;
    
    // Mock successful route selector OSRM response
    mockedFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 'Ok',
        routes: [
          {
            geometry: {
              coordinates: [
                [-86.2368, 12.1154],
                [-86.2412, 12.1210],
                [-86.2479, 12.1265],
              ],
            },
            distance: 1500,
            duration: 210,
          },
        ],
      }),
    });

    const start = { lat: 12.1154, lng: -86.2368 };
    const end = { lat: 12.1265, lng: -86.2479 };
    const waypoints = [{ lat: 12.1210, lng: -86.2412 }];

    // First call: Should fetch from network
    const result1 = await selectBestRoute(start, end, waypoints);
    expect(mockedFetch).toHaveBeenCalledTimes(1);
    expect(result1.distanceKm).toBe(1.5);
    expect(result1.durationMinutes).toBe(4);

    // Second call: Should read from cache
    const result2 = await selectBestRoute(start, end, waypoints);
    expect(mockedFetch).toHaveBeenCalledTimes(1); // Still 1
    expect(result2.distanceKm).toBe(1.5);
  });
});
