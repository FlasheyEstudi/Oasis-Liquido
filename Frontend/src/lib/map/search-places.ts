import { list as listPharmacies } from '@/api/pharmacies';
import { list as listClinics } from '@/api/clinics';

export interface OSMSearchResult {
  place_id: any;
  lat: number;
  lng: number;
  display_name: string;
  type: string;
  importance?: number;
  address?: {
    pharmacy?: string;
    clinic?: string;
    road?: string;
    city?: string;
    state?: string;
    country?: string;
  };
}

/**
 * Searches for nearby pharmacies using the Oasis Database (previously Overpass API).
 * Returns real, registered geolocated pharmacies in Oasis.
 */
export async function searchNearbyPharmacies(
  lat: number,
  lng: number,
  radiusMeters: number = 2000,
  medicineIds?: string[]
): Promise<OSMSearchResult[]> {
  try {
    const radiusKm = radiusMeters / 1000;
    const response = await listPharmacies({ lat, lng, radius: radiusKm, medicine_ids: medicineIds, limit: 100 });
    const pharmacies = Array.isArray(response.data) ? response.data : ((response.data as any)?.data || []);
    
    return pharmacies.map((pharmacy: any) => ({
      place_id: pharmacy.id,
      lat: pharmacy.latitude,
      lng: pharmacy.longitude,
      display_name: pharmacy.name,
      type: 'pharmacy',
      address: {
        pharmacy: pharmacy.name,
        road: pharmacy.address,
        city: 'Nicaragua',
      },
    }));
  } catch (error) {
    console.error('Error fetching nearby pharmacies from Oasis database:', error);
    return [];
  }
}

/**
 * Searches for nearby clinics using the Oasis Database (previously Overpass API).
 * Returns real, registered geolocated clinics in Oasis.
 */
export async function searchNearbyClinics(
  lat: number,
  lng: number,
  radiusMeters: number = 2000
): Promise<OSMSearchResult[]> {
  try {
    const radiusKm = radiusMeters / 1000;
    const response = await listClinics({ lat, lng, radius: radiusKm, limit: 100 });
    const clinics = Array.isArray(response.data) ? response.data : ((response.data as any)?.data || []);
    
    return clinics.map((clinic: any) => ({
      place_id: clinic.id,
      lat: clinic.latitude,
      lng: clinic.longitude,
      display_name: clinic.name,
      type: 'clinic',
      address: {
        clinic: clinic.name,
        road: clinic.address,
        city: 'Nicaragua',
      },
    }));
  } catch (error) {
    console.error('Error fetching nearby clinics from Oasis database:', error);
    return [];
  }
}

/**
 * Searches for locations by name query using OSM Nominatim.
 * Perfect for autocompleting pharmacies, neighborhoods, or cities in Nicaragua.
 */
export async function searchPlaceByName(query: string): Promise<OSMSearchResult[]> {
  if (!query || query.trim().length < 3) return [];

  // Limit to Nicaragua bounds or include Nicaragua in search to focus results
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
    query
  )}&format=json&limit=8&countrycodes=ni&addressdetails=1`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'OasisNicaragua/1.0 (contact: support@oasisnicaragua.org)',
      },
    });

    if (!response.ok) {
      throw new Error(`Nominatim error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.map((item: any) => ({
      place_id: parseInt(item.place_id, 10) || Math.random(),
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      display_name: item.display_name,
      type: item.type || item.class,
      importance: item.importance,
      address: {
        pharmacy: item.address?.pharmacy || item.address?.amenity,
        road: item.address?.road || item.address?.suburb,
        city: item.address?.city || item.address?.town || item.address?.village,
        state: item.address?.state,
        country: item.address?.country,
      },
    }));
  } catch (error) {
    console.error('Error geocoding place by name:', error);
    return [];
  }
}

/**
 * Performs reverse geocoding to retrieve a human-readable address for a given lat/lng.
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'OasisNicaragua/1.0 (contact: support@oasisnicaragua.org)',
      },
    });

    if (!response.ok) {
      throw new Error(`Nominatim reverse error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.display_name || 'Ubicación desconocida';
  } catch (error) {
    console.error('Error reverse geocoding coordinates:', error);
    return 'Ubicación actual';
  }
}
