export interface LatLng {
  lat: number;
  lng: number;
}

/**
 * Calculates the distance between two coordinates in meters using the Haversine formula.
 */
export function getHaversineDistance(p1: LatLng, p2: LatLng): number {
  const R = 6371e3; // Earth's radius in meters
  const radLat1 = (p1.lat * Math.PI) / 180;
  const radLat2 = (p2.lat * Math.PI) / 180;
  const deltaLat = ((p2.lat - p1.lat) * Math.PI) / 180;
  const deltaLng = ((p2.lng - p1.lng) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(radLat1) *
      Math.cos(radLat2) *
      Math.sin(deltaLng / 2) *
      Math.sin(deltaLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Finds the closest point on a line segment to a target point.
 */
function getClosestPointOnSegment(p: LatLng, s1: LatLng, s2: LatLng): LatLng {
  const x0 = p.lng;
  const y0 = p.lat;
  const x1 = s1.lng;
  const y1 = s1.lat;
  const x2 = s2.lng;
  const y2 = s2.lat;

  const dx = x2 - x1;
  const dy = y2 - y1;

  if (dx === 0 && dy === 0) {
    return s1;
  }

  // Projection factor
  let t = ((x0 - x1) * dx + (y0 - y1) * dy) / (dx * dx + dy * dy);
  t = Math.max(0, Math.min(1, t));

  return {
    lng: x1 + t * dx,
    lat: y1 + t * dy
  };
}

/**
 * Snaps a given GPS point to the nearest road rendering feature.
 */
export async function snapToRoad(map: any, point: LatLng, toleranceMeters = 30): Promise<LatLng> {
  if (!map || typeof window === 'undefined') return point;

  try {
    const pt = map.project([point.lng, point.lat]);
    // Query transportation features in a bounding box around the point (approx 20px)
    const features = map.queryRenderedFeatures(
      [
        [pt.x - 20, pt.y - 20],
        [pt.x + 20, pt.y + 20]
      ],
      { layers: ['transportation', 'road', 'roads'] }
    );

    if (!features || features.length === 0) {
      return point;
    }

    let nearestPoint = point;
    let minDistance = toleranceMeters;

    for (const feature of features) {
      const geometry = feature.geometry;
      if (!geometry) continue;

      if (geometry.type === 'LineString') {
        const coords = geometry.coordinates as [number, number][];
        for (let i = 0; i < coords.length - 1; i++) {
          const s1 = { lng: coords[i][0], lat: coords[i][1] };
          const s2 = { lng: coords[i + 1][0], lat: coords[i + 1][1] };
          const closest = getClosestPointOnSegment(point, s1, s2);
          const dist = getHaversineDistance(point, closest);
          if (dist < minDistance) {
            minDistance = dist;
            nearestPoint = closest;
          }
        }
      } else if (geometry.type === 'MultiLineString') {
        const lineStrings = geometry.coordinates as [number, number][][];
        for (const coords of lineStrings) {
          for (let i = 0; i < coords.length - 1; i++) {
            const s1 = { lng: coords[i][0], lat: coords[i][1] };
            const s2 = { lng: coords[i + 1][0], lat: coords[i + 1][1] };
            const closest = getClosestPointOnSegment(point, s1, s2);
            const dist = getHaversineDistance(point, closest);
            if (dist < minDistance) {
              minDistance = dist;
              nearestPoint = closest;
            }
          }
        }
      }
    }

    return nearestPoint;
  } catch (err) {
    console.warn('⚠️ [Snap To Road] Snapping failed, returning original point:', err);
    return point;
  }
}
