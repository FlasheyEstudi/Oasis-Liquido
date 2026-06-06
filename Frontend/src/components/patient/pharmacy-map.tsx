'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '@/store/auth-store';
import {
  usePharmacies,
  usePrescription,
  useMedicines,
  getHookErrorMessage,
} from '@/hooks/use-api';
import { formatDistance, formatCurrency } from '@/utils/helpers';
import { DEFAULT_LAT, DEFAULT_LNG } from '@/utils/constants';
import { GlassCard } from '@/components/oasis/glass-card';
import { Button } from '@/components/ui/button';
import { MapView } from '@/components/common/map-view';
import type { MapMarker } from '@/components/common/map-view';
import { MapSearchBox } from '@/components/common/map-search-box';
import { useUserLocation } from '@/hooks/use-user-location';
import {
  searchNearbyPharmacies,
  searchNearbyClinics,
  OSMSearchResult,
} from '@/lib/map/search-places';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  MapPin,
  Truck,
  Phone,
  Pill,
  Navigation,
  LayoutList,
  Map as MapIcon,
  AlertCircle,
  CheckCircle2,
  Clock,
  Sparkles,
  RefreshCw,
  Search as SearchIcon,
  Crosshair,
} from 'lucide-react';

const fadeInUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // metres
  const phi1 = lat1 * Math.PI/180;
  const phi2 = lat2 * Math.PI/180;
  const deltaPhi = (lat2-lat1) * Math.PI/180;
  const deltaLambda = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(deltaPhi/2) * Math.sin(deltaPhi/2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(deltaLambda/2) * Math.sin(deltaLambda/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // in metres
}

export function PharmacyMap() {
  const { selectedItemId, prescriptionId, navigate } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');

  // --- Real-time Geolocation & OSM Integration States ---
  const userLoc = useUserLocation();
  const [mapCenter, setMapCenter] = useState<[number, number]>([DEFAULT_LAT, DEFAULT_LNG]);
  const [hasCenteredOnUser, setHasCenteredOnUser] = useState(false);
  const [showNearbyClinics, setShowNearbyClinics] = useState(true); // Toggle to show nearby clinics on the map
  const [nearbyPlaces, setNearbyPlaces] = useState<OSMSearchResult[]>([]);
  const [isSearchingNearby, setIsSearchingNearby] = useState(false);
  const [selectedNearbyPlace, setSelectedNearbyPlace] = useState<OSMSearchResult | null>(null);
  const [selectedPharmacy, setSelectedPharmacy] = useState<any | null>(null);

  // Load prescription context if available
  const activePrescriptionId = prescriptionId || (selectedItemId && selectedItemId.length === 36 ? selectedItemId : null);
  const prescriptionQuery = usePrescription(activePrescriptionId ?? '', !!activePrescriptionId);
  const medicineIds = useMemo(() => {
    return prescriptionQuery.data?.lines?.map((l) => l.medicine_id);
  }, [prescriptionQuery.data?.lines]);

  // Load pharmacies centered at mapCenter or user coordinates
  const pharmaciesQuery = usePharmacies({
    lat: mapCenter[0],
    lng: mapCenter[1],
    medicine_ids: medicineIds && medicineIds.length > 0 ? medicineIds : undefined,
    search: searchQuery || undefined,
  });

  // Load medicines for name lookups
  const medicinesQuery = useMedicines();

  const pharmacies = pharmaciesQuery.data?.data ?? [];
  const medicines = medicinesQuery.data?.data ?? [];

  // Sync initial user coordinates once resolved
  useEffect(() => {
    if (!userLoc.loading && !hasCenteredOnUser) {
      setMapCenter([userLoc.lat, userLoc.lng]);
      setHasCenteredOnUser(true);
    }
  }, [userLoc.loading, userLoc.lat, userLoc.lng, hasCenteredOnUser]);

  const fetchNearbyPlaces = async (lat: number, lng: number) => {
    setIsSearchingNearby(true);
    try {
      const [pharmaciesList, clinicsList] = await Promise.all([
        searchNearbyPharmacies(lat, lng, 5000, medicineIds), // 5km radius with active medicineIds filter
        showNearbyClinics ? searchNearbyClinics(lat, lng, 5000) : Promise.resolve([]),
      ]);
      setNearbyPlaces([...pharmaciesList, ...clinicsList]);
    } catch (error) {
      console.error('Error fetching nearby Oasis Network locations:', error);
    } finally {
      setIsSearchingNearby(false);
    }
  };

  // Fetch nearby Oasis database places whenever mapCenter, toggles, or selected medicines change
  const serializedMedicineIds = JSON.stringify(medicineIds);
  useEffect(() => {
    fetchNearbyPlaces(mapCenter[0], mapCenter[1]);
  }, [mapCenter[0], mapCenter[1], showNearbyClinics, serializedMedicineIds]);

  const handleSearchSelect = (lat: number, lng: number) => {
    setMapCenter([lat, lng]);
  };

  const handleRecenter = () => {
    setMapCenter([userLoc.lat, userLoc.lng]);
    userLoc.refresh();
  };

  // Dynamic route calculation to the selected location
  const mapRoute = useMemo(() => {
    if (selectedPharmacy && userLoc.lat && userLoc.lng) {
      return {
        origin: `${userLoc.lng},${userLoc.lat}`,
        destination: `${selectedPharmacy.longitude},${selectedPharmacy.latitude}`,
      };
    }
    if (selectedNearbyPlace && userLoc.lat && userLoc.lng) {
      return {
        origin: `${userLoc.lng},${userLoc.lat}`,
        destination: `${selectedNearbyPlace.lng},${selectedNearbyPlace.lat}`,
      };
    }
    return null;
  }, [selectedPharmacy, selectedNearbyPlace, userLoc.lat, userLoc.lng]);

  // Compile combined markers (DB registered + Nearby Network POIs)
  const markers = useMemo((): MapMarker[] => {
    const dbMarkers: MapMarker[] = pharmacies.map((p) => {
      const isSelected = selectedPharmacy?.id === p.id;
      return {
        id: p.id,
        lat: p.latitude,
        lng: p.longitude,
        type: isSelected ? 'destination' : 'pharmacy',
        label: p.name,
      };
    });

    const nearbyMarkers: MapMarker[] = nearbyPlaces.map((place) => {
      const isSelected = selectedNearbyPlace?.place_id === place.place_id;
      return {
        id: `osm-${place.place_id}`,
        lat: place.lat,
        lng: place.lng,
        type: isSelected ? 'destination' : (place.type === 'pharmacy' ? 'pharmacy' : 'clinic'),
        label: place.display_name,
        color: isSelected ? undefined : (place.type === 'pharmacy' ? '#0d9488' : '#2563eb'), // Teal for pharmacy, Blue for clinic
      };
    });

    // Deduplicate: if an item has the same ID or coordinate, keep the primary one
    const result: MapMarker[] = [...dbMarkers];
    for (const marker of nearbyMarkers) {
      const dbId = marker.id?.replace('osm-', '') || '';
      const exists = result.some((m) => m.id === dbId);
      if (!exists) {
        result.push(marker);
      }
    }

    // Add user's own location as a 'patient' type marker
    if (userLoc.lat && userLoc.lng) {
      result.push({
        id: 'patient-location',
        lat: userLoc.lat,
        lng: userLoc.lng,
        type: 'patient',
        label: 'Tu ubicación',
      });
    }

    return result;
  }, [pharmacies, nearbyPlaces, userLoc.lat, userLoc.lng, selectedPharmacy?.id, selectedNearbyPlace?.place_id]);

  // Helper: get medicine name by ID
  const getMedicineName = (id: string) => {
    return medicines.find((m) => m.id === id)?.name || 'Medicamento';
  };

  const isLoading =
    pharmaciesQuery.isLoading ||
    (selectedItemId ? prescriptionQuery.isLoading : false);
  const prescription = prescriptionQuery.data;

  if (isLoading) {
    return (
      <div className="bento-grid">
        <div className="col-span-12 lg:col-span-8">
          <div className="shimmer rounded-3xl h-96" />
        </div>
        <div className="col-span-12 lg:col-span-4">
          <div className="shimmer rounded-3xl h-96" />
        </div>
        <div className="col-span-6">
          <div className="shimmer rounded-3xl h-24" />
        </div>
        <div className="col-span-6">
          <div className="shimmer rounded-3xl h-24" />
        </div>
      </div>
    );
  }

  if (pharmaciesQuery.isError) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          className="rounded-full gap-2 text-muted-foreground"
          onClick={() => navigate('recetas')}
        >
          <ArrowLeft className="size-4" />
          Volver
        </Button>
        <GlassCard>
          <div className="flex flex-col items-center py-8 text-center">
            <AlertCircle className="size-10 text-red-500 mb-3" />
            <p className="text-sm text-muted-foreground mb-4">
              {getHookErrorMessage(pharmaciesQuery.error)}
            </p>
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => pharmaciesQuery.refetch()}
            >
              Reintentar
            </Button>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Premium Header with Trust Marketing Hook */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-teal-500/[0.03] dark:bg-teal-400/[0.02] border border-teal-500/10 dark:border-teal-400/5 rounded-3xl p-4 sm:p-5 backdrop-blur-md">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full gap-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white shrink-0 border border-slate-200 dark:border-white/5 bg-white/5 shadow-sm"
            onClick={() => navigate(prescription ? 'prescription-detail' : 'prescriptions')}
          >
            <ArrowLeft className="size-4" />
            <span className="hidden sm:inline font-bold">Volver</span>
          </Button>
          <div className="min-w-0">
            <motion.h2
              {...fadeInUp}
              className="text-lg sm:text-xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-2"
            >
              <Sparkles className="size-5 text-teal-500 dark:text-teal-400 animate-pulse shrink-0" />
              <span>Buscador Satelital de Farmacias</span>
            </motion.h2>
            <p className="text-[10px] sm:text-xs text-muted-foreground font-semibold mt-0.5">
              Encuentra medicamentos certificados y solicita entregas inmediatas
            </p>
          </div>
        </div>

        {/* MINSA Trust Badge & View Swappers */}
        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
          <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-3 py-1 text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            <CheckCircle2 className="size-3" />
            <span>Red Acreditada MINSA</span>
          </div>

          <div className="flex items-center gap-1 bg-white/5 border border-white/10 dark:border-white/5 p-1 rounded-full shadow-inner">
            <button
              className={cn(
                'flex size-9 items-center justify-center rounded-full transition-all duration-300',
                viewMode === 'map'
                  ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/20'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-white/5'
              )}
              onClick={() => setViewMode('map')}
              title="Vista de Mapa"
            >
              <MapIcon className="size-4" />
            </button>
            <button
              className={cn(
                'flex size-9 items-center justify-center rounded-full transition-all duration-300',
                viewMode === 'list'
                  ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/20'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-white/5'
              )}
              onClick={() => setViewMode('list')}
              title="Vista de Lista"
            >
              <LayoutList className="size-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Geolocation Telemetry Bar */}
      <motion.div
        {...fadeInUp}
        className="rounded-[2rem] glass p-4 border border-slate-200 dark:border-white/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all duration-300 shadow-xl"
      >
        <div className="flex items-start sm:items-center gap-3 w-full md:w-auto">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 shadow-md">
            <MapPin className="size-5 text-emerald-500 dark:text-emerald-400 animate-bounce" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-widest text-emerald-600 dark:text-emerald-400 font-black">
              Dirección de Entrega Detectada
            </p>
            <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-white truncate max-w-[280px] sm:max-w-md mt-0.5 leading-tight">
              {userLoc.address}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end border-t md:border-t-0 border-slate-200/50 dark:border-white/5 pt-3 md:pt-0">
          <motion.button
            whileHover={{ scale: 1.04, y: -1 }}
            whileTap={{ scale: 0.96 }}
            onClick={handleRecenter}
            className="flex items-center justify-center gap-1.5 h-10 px-4 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25 dark:border-emerald-500/15 hover:border-emerald-500/40 shadow-sm transition-all duration-300 flex-1 sm:flex-initial"
          >
            <Crosshair className="size-3.5 text-emerald-500 animate-spin shrink-0" />
            <span>Mi Ubicación</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.04, y: -1 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setShowNearbyClinics((prev) => !prev)}
            className={cn(
              'flex items-center justify-center gap-1.5 h-10 px-4 rounded-full text-xs font-black uppercase tracking-wider border transition-all duration-300 shadow-sm flex-1 sm:flex-initial',
              showNearbyClinics
                ? 'bg-teal-500/15 border-teal-500/30 text-teal-700 dark:text-teal-400 hover:bg-teal-500/25'
                : 'bg-slate-500/[0.03] border-slate-200/50 dark:border-white/5 text-slate-500 dark:text-zinc-400 hover:bg-slate-500/[0.08]'
            )}
          >
            <Clock className="size-3.5 text-teal-500 shrink-0" />
            <span>{showNearbyClinics ? 'Clínicas Visibles' : 'Ver Clínicas'}</span>
          </motion.button>
        </div>
      </motion.div>

      {/* Prescription Context Banner */}
      {prescription && (
        <motion.div {...fadeInUp}>
          <div className="rounded-3xl bg-teal-500/[0.07] border border-teal-500/20 p-4 shadow-sm flex items-start gap-3">
            <div className="size-6 rounded-full bg-teal-500/20 flex items-center justify-center shrink-0 mt-0.5">
              <Pill className="size-3.5 text-teal-600 dark:text-teal-400" />
            </div>
            <div>
              <p className="text-xs font-black text-teal-600 dark:text-teal-400 uppercase tracking-widest leading-none">
                Filtrando stock para Receta Médica
              </p>
              <p className="text-sm font-semibold text-teal-850 dark:text-teal-300 mt-1 leading-snug">
                Autorizada por: <span className="font-extrabold">{prescription.doctor?.name || 'Especialista'}</span> •{' '}
                {prescription.lines?.map((l) => getMedicineName(l.medicine_id)).join(', ')}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Advanced Nominatim Search Box */}
      <div className="relative">
        <MapSearchBox
          onSelectLocation={handleSearchSelect}
          placeholder="Buscar Masaya, Bello Horizonte, Altamira..."
        />
      </div>

      {/* Bento Grid Layout */}
      <div className="bento-grid">
        {/* Map View */}
        {viewMode === 'map' && (
          <GlassCard className="col-span-12 lg:col-span-8 !p-3 min-h-[460px] flex flex-col relative overflow-hidden rounded-[2.5rem] shadow-2xl">
            <div className="flex-1 relative rounded-[2rem] overflow-hidden border border-white/5 shadow-inner">
              <MapView
                markers={markers}
                center={mapCenter}
                height="440px"
                zoom={14}
                showUserLocation
                route={mapRoute}
                onMarkerClick={(marker) => {
                  if (marker.id?.startsWith('osm-')) {
                    const placeId = marker.id.replace('osm-', '');
                    const place = nearbyPlaces.find((p) => String(p.place_id) === placeId);
                    if (place) {
                      setSelectedNearbyPlace(place);
                      setSelectedPharmacy(null);
                    }
                  } else if (marker.id) {
                    const pharm = pharmacies.find((p) => p.id === marker.id);
                    if (pharm) {
                      setSelectedPharmacy(pharm);
                      setSelectedNearbyPlace(null);
                      setMapCenter([pharm.latitude, pharm.longitude]);
                    }
                  }
                }}
              />
            </div>

            {/* Database Status overlay */}
            {isSearchingNearby && (
              <div className="absolute top-6 left-6 z-10 px-3.5 py-2 rounded-full bg-white/90 dark:bg-zinc-950/95 backdrop-blur-md border border-slate-200 dark:border-white/10 flex items-center gap-2 shadow-lg animate-pulse">
                <RefreshCw className="size-3.5 text-teal-600 dark:text-teal-400 animate-spin" />
                <span className="text-[10px] font-black text-slate-800 dark:text-white uppercase tracking-wider">
                  Buscando en Red Oasis...
                </span>
              </div>
            )}
          </GlassCard>
        )}

        {/* Pharmacy sidebar / list */}
        <div className={viewMode === 'map' ? 'col-span-12 lg:col-span-4' : 'col-span-12'}>
          <GlassCard className={cn(
            "rounded-[2.5rem] shadow-2xl",
            viewMode === 'list' ? 'p-6' : '!p-4 min-h-[460px] flex flex-col justify-between'
          )}>
            <div>
              {/* Header Title */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/5">
                <h3 className="text-sm font-extrabold text-foreground tracking-tight uppercase">
                  {viewMode === 'list'
                    ? `${pharmacies.length} farmacia${pharmacies.length !== 1 ? 's' : ''} disponible${pharmacies.length !== 1 ? 's' : ''}`
                    : 'Farmacias en Zona'}
                </h3>
                {nearbyPlaces.length > 0 && (
                  <span className="text-[9px] font-black bg-teal-500/10 border border-teal-500/20 text-teal-500 dark:text-teal-400 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                    {nearbyPlaces.length} Encontradas
                  </span>
                )}
              </div>

              {/* Animate details panel if a nearby Oasis Place is clicked on the map */}
              <AnimatePresence mode="wait">
                {selectedNearbyPlace && (
                  <motion.div
                    key="nearby-detail"
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className="mb-4 p-4 rounded-3xl bg-teal-500/[0.08] dark:bg-teal-400/[0.04] border border-teal-500/25 dark:border-teal-400/15 text-xs relative transition-all duration-300 shadow-md"
                  >
                    <button
                      onClick={() => setSelectedNearbyPlace(null)}
                      className="absolute top-3 right-3 text-slate-400 dark:text-zinc-500 hover:text-slate-800 dark:hover:text-white font-black text-base"
                    >
                      ×
                    </button>
                    <p className="text-[9px] font-black text-teal-600 dark:text-teal-400 uppercase tracking-widest mb-1.5">
                      {selectedNearbyPlace.type === 'clinic' ? '🏥 Clínica Oasis' : '💊 Farmacia Oasis'}
                    </p>
                    <h4 className="font-black text-slate-800 dark:text-white text-sm mb-1 leading-tight">
                      {selectedNearbyPlace.display_name}
                    </h4>
                    <p className="text-slate-600 dark:text-zinc-350 mb-3 leading-relaxed font-semibold">
                      {selectedNearbyPlace.address?.road || 'Nicaragua'}
                    </p>
                    <div className="space-y-1.5 text-[11px] text-slate-500 dark:text-zinc-400 font-semibold mb-3.5">
                      <p className="flex items-center gap-2">
                        <Clock className="size-3.5 text-teal-500 shrink-0" />
                        <span>Abierto: Lunes a Sábado - 8am a 6pm</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <Phone className="size-3.5 text-teal-500 shrink-0" />
                        <span>Contacto Directo Integrado</span>
                      </p>
                      {userLoc.lat && userLoc.lng && (
                        <p className="flex items-center gap-2">
                          <Navigation className="size-3.5 text-teal-500 shrink-0 animate-pulse" />
                          <span>Distancia: {formatDistance(calculateDistanceMeters(userLoc.lat, userLoc.lng, selectedNearbyPlace.lat, selectedNearbyPlace.lng))}</span>
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedNearbyPlace(null)}
                        className="rounded-full px-3 py-1.5 font-bold border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 bg-white/5 text-[10px] uppercase hover:bg-white/10 transition-colors"
                      >
                        Cerrar
                      </button>
                      {selectedNearbyPlace.type === 'pharmacy' ? (
                        <button
                          onClick={() => navigate('delivery-request', selectedNearbyPlace.place_id)}
                          className="rounded-full px-4 py-1.5 text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-500/10 transition-all duration-300"
                        >
                          <Truck className="size-3.5" />
                          Pedir Domicilio
                        </button>
                      ) : (
                        <button
                          onClick={() => navigate('appointment-list')}
                          className="rounded-full px-4 py-1.5 text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 bg-teal-600 hover:bg-teal-500 text-white shadow-md shadow-teal-500/10 transition-all duration-300"
                        >
                          <Clock className="size-3.5" />
                          Agendar Cita
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}

                {selectedPharmacy && (
                  <motion.div
                    key="db-detail"
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className="mb-4 p-4 rounded-3xl bg-emerald-500/[0.08] dark:bg-emerald-400/[0.04] border border-emerald-500/25 dark:border-emerald-400/15 text-xs relative transition-all duration-300 shadow-md"
                  >
                    <button
                      onClick={() => setSelectedPharmacy(null)}
                      className="absolute top-3 right-3 text-slate-400 dark:text-zinc-500 hover:text-slate-800 dark:hover:text-white font-black text-base"
                    >
                      ×
                    </button>
                    <p className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1.5 animate-pulse">
                      📍 Farmacia Seleccionada
                    </p>
                    <h4 className="font-black text-slate-800 dark:text-white text-sm mb-1 leading-tight">
                      {selectedPharmacy.name}
                    </h4>
                    <p className="text-slate-600 dark:text-zinc-350 mb-3 leading-relaxed font-semibold">
                      {selectedPharmacy.address}
                    </p>
                    <div className="space-y-1.5 text-[11px] text-slate-500 dark:text-zinc-400 font-semibold mb-3">
                      {selectedPharmacy.phone && (
                        <p className="flex items-center gap-2">
                          <Phone className="size-3.5 text-emerald-500 shrink-0" />
                          <span>Teléfono: {selectedPharmacy.phone}</span>
                        </p>
                      )}
                      {(userLoc.lat && userLoc.lng) ? (
                        <p className="flex items-center gap-2">
                          <Navigation className="size-3.5 text-emerald-500 shrink-0 animate-pulse" />
                          <span>Distancia: {formatDistance(calculateDistanceMeters(userLoc.lat, userLoc.lng, selectedPharmacy.latitude, selectedPharmacy.longitude))}</span>
                        </p>
                      ) : selectedPharmacy.distance_in_meters != null ? (
                        <p className="flex items-center gap-2">
                          <Navigation className="size-3.5 text-emerald-500 shrink-0 animate-pulse" />
                          <span>Distancia: {formatDistance(selectedPharmacy.distance_in_meters)}</span>
                        </p>
                      ) : null}
                    </div>
                    
                    {prescription && (
                      <div className="mt-2.5 mb-3.5">
                        {(() => {
                          const matchedCount = selectedPharmacy.matchedMedicinesCount || 0;
                          const totalNeeded = medicineIds?.length || 0;
                          const isFullMatch = matchedCount === totalNeeded && totalNeeded > 0;
                          return (
                            <div className={cn(
                              "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider shadow-inner",
                              isFullMatch ? "bg-teal-500/10 text-teal-500 border border-teal-500/20" : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                            )}>
                              {isFullMatch ? <CheckCircle2 className="size-3 text-teal-500 animate-bounce" /> : <AlertCircle className="size-3 text-amber-500 animate-pulse" />}
                              <span>{isFullMatch ? "Disponibilidad de Stock Completo" : `Stock Parcial: ${matchedCount}/${totalNeeded}`}</span>
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedPharmacy(null)}
                        className="rounded-full px-3 py-1.5 font-bold border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 bg-white/5 text-[10px] uppercase hover:bg-white/10 transition-colors"
                      >
                        Cerrar
                      </button>
                      <button
                        onClick={() => navigate('delivery-request', selectedPharmacy.id)}
                        className="rounded-full px-4 py-1.5 text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-500/10 transition-all duration-300"
                      >
                        <Truck className="size-3.5" />
                        Pedir Domicilio
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Sidebar list items */}
              {pharmacies.length === 0 ? (
                <div className="flex flex-col items-center py-12 text-center">
                  <MapPin className="size-11 text-muted-foreground/30 mb-3 animate-bounce" />
                  <h3 className="text-base font-extrabold text-foreground mb-1">Sin farmacias</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
                    No se encontraron farmacias registradas en esta zona. Prueba buscando otra dirección en Nicaragua.
                  </p>
                </div>
              ) : (
                <div className="space-y-3.5 max-h-[320px] overflow-y-auto custom-scrollbar pr-1">
                  {pharmacies.map((pharmacy, index) => (
                    <motion.div
                      key={pharmacy.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <div
                        className={cn(
                          "rounded-[1.75rem] p-4 hover:bg-slate-100/80 dark:hover:bg-white/[0.04] border border-slate-100 dark:border-transparent hover:border-slate-200 dark:hover:border-white/5 cursor-pointer transition-all duration-300 bg-slate-500/[0.02] dark:bg-zinc-950/20",
                          selectedPharmacy?.id === pharmacy.id && "border-emerald-500/35 bg-emerald-500/5 dark:bg-emerald-500/5 ring-1 ring-emerald-500/20 shadow-md"
                        )}
                        onClick={() => {
                          setSelectedPharmacy(pharmacy);
                          setSelectedNearbyPlace(null);
                          setMapCenter([pharmacy.latitude, pharmacy.longitude]);
                        }}
                      >
                        <div className="flex items-start gap-3.5">
                          {/* Pharmacy icon */}
                          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-teal-500/10 border border-teal-500/20 shadow-sm">
                            <MapPin className="size-5 text-teal-600 dark:text-teal-500 animate-pulse" />
                          </div>

                          <div className="flex-1 min-w-0">
                            {/* Name & distance */}
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-xs font-extrabold text-slate-800 dark:text-white truncate">
                                {pharmacy.name}
                              </p>
                              {(userLoc.lat && userLoc.lng) ? (
                                <span className="flex items-center gap-1 text-[9px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full shrink-0 tracking-wide uppercase">
                                  <Navigation className="size-2.5 shrink-0" />
                                  {formatDistance(calculateDistanceMeters(userLoc.lat, userLoc.lng, pharmacy.latitude, pharmacy.longitude))}
                                </span>
                              ) : pharmacy.distance_in_meters != null ? (
                                <span className="flex items-center gap-1 text-[9px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full shrink-0 tracking-wide uppercase">
                                  <Navigation className="size-2.5 shrink-0" />
                                  {formatDistance(pharmacy.distance_in_meters)}
                                </span>
                              ) : null}
                            </div>

                            {/* Address */}
                            <p className="mt-1 text-[11px] font-semibold text-slate-500 dark:text-zinc-400 truncate leading-snug">
                              {pharmacy.address}
                            </p>

                            {/* Phone */}
                            {pharmacy.phone && (
                              <p className="mt-1 flex items-center gap-1.5 text-[10px] font-semibold text-slate-450 dark:text-zinc-500">
                                <Phone className="size-3 text-teal-500 shrink-0" />
                                <span>{pharmacy.phone}</span>
                              </p>
                            )}

                            {/* Smart Stock Indicators */}
                            {prescription && (
                              <div className="mt-2.5 space-y-2">
                                {(() => {
                                  const matchedCount = pharmacy.matchedMedicinesCount || 0;
                                  const totalNeeded = medicineIds?.length || 0;
                                  const isFullMatch = matchedCount === totalNeeded && totalNeeded > 0;

                                  return (
                                    <>
                                      <div
                                        className={cn(
                                          'flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[9px] font-black uppercase tracking-wider shadow-inner w-fit',
                                          isFullMatch
                                            ? 'bg-teal-500/15 text-teal-500 border-teal-500/20'
                                            : matchedCount > 0
                                            ? 'bg-amber-500/15 text-amber-500 border-amber-500/20'
                                            : 'bg-red-500/15 text-red-500 border-red-500/20'
                                        )}
                                      >
                                        {isFullMatch ? (
                                          <CheckCircle2 className="size-3 shrink-0 text-teal-500 animate-bounce" />
                                        ) : (
                                          <AlertCircle className="size-3 shrink-0 text-amber-500 animate-pulse" />
                                        )}
                                        <span>
                                          {isFullMatch
                                            ? 'STOCK COMPLETO'
                                            : matchedCount > 0
                                            ? `STOCK PARCIAL: ${matchedCount}/${totalNeeded}`
                                            : 'SIN STOCK'}
                                        </span>
                                      </div>

                                      {matchedCount > 0 && matchedCount < totalNeeded && (
                                        <p className="text-[9px] text-amber-400/80 italic leading-tight">
                                          * Nota: Puedes pedir medicamentos parciales y buscar el resto.
                                        </p>
                                      )}
                                    </>
                                  );
                                })()}
                              </div>
                            )}

                            {/* Available medicines list */}
                            {pharmacy.available_medicines && pharmacy.available_medicines.length > 0 && (
                              <div className="mt-2.5 flex flex-wrap gap-1">
                                {pharmacy.available_medicines.map((med) => (
                                  <span
                                    key={med.medicine_id}
                                    className="inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold bg-teal-500/10 text-teal-400 border border-teal-500/10"
                                  >
                                    {getMedicineName(med.medicine_id)} · {formatCurrency(med.price)}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Delivery button */}
                            <button
                              className="mt-3.5 rounded-full h-9 text-[10px] font-black uppercase tracking-wider gap-1.5 px-4 flex items-center justify-center bg-emerald-600 text-white hover:bg-emerald-500 shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/20 hover:scale-[1.02] transition-all duration-300"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate('delivery-request', pharmacy.id);
                              }}
                            >
                              <Truck className="size-3.5 shrink-0" />
                              Pedir Domicilio
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Smart Tips panel */}
            <div className="mt-4 pt-3.5 border-t border-white/5 text-[10px] font-semibold text-slate-400 dark:text-zinc-550 space-y-1">
              <p>💡 Marcadores verdes: Farmacias acreditadas con telemetría de stock.</p>
              <p>📍 Marcadores azules: Clínicas afiliadas para consultas médicas.</p>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
