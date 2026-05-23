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

  // Fetch nearby Oasis database places whenever mapCenter, toggles, or selected medicines change
  const serializedMedicineIds = JSON.stringify(medicineIds);
  useEffect(() => {
    fetchNearbyPlaces(mapCenter[0], mapCenter[1]);
  }, [mapCenter[0], mapCenter[1], showNearbyClinics, serializedMedicineIds]);

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

  const handleSearchSelect = (lat: number, lng: number) => {
    setMapCenter([lat, lng]);
  };

  const handleRecenter = () => {
    setMapCenter([userLoc.lat, userLoc.lng]);
    userLoc.refresh();
  };

  // Compile combined markers (DB registered + Nearby Network POIs)
  const markers = useMemo((): MapMarker[] => {
    const dbMarkers: MapMarker[] = pharmacies.map((p) => ({
      id: p.id,
      lat: p.latitude,
      lng: p.longitude,
      type: 'pharmacy',
      label: p.name,
    }));

    const nearbyMarkers: MapMarker[] = nearbyPlaces.map((place) => ({
      id: `osm-${place.place_id}`,
      lat: place.lat,
      lng: place.lng,
      type: place.type === 'pharmacy' ? 'pharmacy' : 'clinic',
      label: place.display_name,
      color: place.type === 'pharmacy' ? '#0d9488' : '#2563eb', // Teal for pharmacy, Blue for clinic
    }));

    // Deduplicate: if an item has the same ID or coordinate, keep the primary one
    const result: MapMarker[] = [...dbMarkers];
    for (const marker of nearbyMarkers) {
      const dbId = marker.id?.replace('osm-', '') || '';
      const exists = result.some((m) => m.id === dbId);
      if (!exists) {
        result.push(marker);
      }
    }
    return result;
  }, [pharmacies, nearbyPlaces]);

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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full gap-1.5 text-muted-foreground shrink-0"
            onClick={() => navigate(prescription ? 'prescription-detail' : 'prescriptions')}
          >
            <ArrowLeft className="size-4" />
            Volver
          </Button>
          <motion.h2
            {...fadeInUp}
            className="text-lg font-bold text-foreground truncate flex items-center gap-2"
          >
            <Sparkles className="size-4 text-emerald-500" />
            Geolocalización & Farmacias
          </motion.h2>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            className={cn(
              'flex size-8 items-center justify-center rounded-full transition-all',
              viewMode === 'map' ? 'glass-btn-primary text-white' : 'glass text-muted-foreground'
            )}
            onClick={() => setViewMode('map')}
            title="Vista de Mapa"
          >
            <MapIcon className="size-3.5" />
          </button>
          <button
            className={cn(
              'flex size-8 items-center justify-center rounded-full transition-all',
              viewMode === 'list' ? 'glass-btn-primary text-white' : 'glass text-muted-foreground'
            )}
            onClick={() => setViewMode('list')}
            title="Vista de Lista"
          >
            <LayoutList className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Geolocation Status Bar */}
      <motion.div {...fadeInUp} className="rounded-2xl glass p-3 border border-slate-200 dark:border-white/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 transition-colors duration-300">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <MapPin className="size-4 text-emerald-500 animate-pulse" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-emerald-600 dark:text-emerald-500 font-black">
              Tu Dirección Detectada
            </p>
            <p className="text-xs font-semibold text-slate-800 dark:text-white truncate max-w-[280px] md:max-w-md">
              {userLoc.address}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch md:self-auto justify-end">
          <Button
            onClick={handleRecenter}
            variant="outline"
            size="sm"
            className="rounded-xl border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 text-xs gap-1.5 h-8 flex-1 md:flex-initial transition-all duration-200"
          >
            <Crosshair className="size-3 text-emerald-500" />
            <span className="text-slate-700 dark:text-slate-300">Centrar en Mí</span>
          </Button>

          <Button
            onClick={() => setShowNearbyClinics((prev) => !prev)}
            variant="outline"
            size="sm"
            className={cn(
              'rounded-xl border-slate-200 dark:border-white/10 text-xs gap-1.5 h-8 flex-1 md:flex-initial transition-all duration-200',
              showNearbyClinics ? 'bg-teal-500/15 border-teal-500/30 text-teal-600 dark:text-teal-400 hover:bg-teal-500/20' : 'hover:bg-slate-50 dark:hover:bg-white/5 text-slate-500 dark:text-zinc-400'
            )}
          >
            <Clock className="size-3" />
            {showNearbyClinics ? 'Clínicas Activas' : 'Ocultar Clínicas'}
          </Button>
        </div>
      </motion.div>

      {/* Prescription Context Banner */}
      {prescription && (
        <motion.div {...fadeInUp}>
          <div className="rounded-2xl bg-teal-500/10 border border-teal-500/20 p-3">
            <p className="text-sm text-teal-700 dark:text-teal-300">
              <span className="font-medium">Receta de {prescription.doctor?.name || 'Médico'}:</span>{' '}
              {prescription.lines?.map((l) => getMedicineName(l.medicine_id)).join(', ')}
            </p>
          </div>
        </motion.div>
      )}

      {/* Advanced Nominatim Search Box */}
      <div className="relative">
        <MapSearchBox
          onSelectLocation={handleSearchSelect}
          placeholder="Buscar barrio, farmacia o dirección en Nicaragua (ej: Masaya, Bello Horizonte...)"
        />
      </div>

      {/* Bento Grid Layout */}
      <div className="bento-grid">
        {/* Map View */}
        {viewMode === 'map' && (
          <GlassCard className="col-span-12 lg:col-span-8 !p-3 min-h-[420px] flex flex-col relative overflow-hidden">
            <div className="flex-1 relative rounded-2xl overflow-hidden border border-white/5">
              <MapView
                markers={markers}
                center={mapCenter}
                height="400px"
                zoom={14}
                showUserLocation
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
              <div className="absolute top-6 left-6 z-10 px-3 py-1.5 rounded-full bg-white/85 dark:bg-zinc-950/80 backdrop-blur-md border border-slate-200 dark:border-white/10 flex items-center gap-2 transition-all duration-300">
                <RefreshCw className="size-3 text-teal-600 dark:text-teal-500 animate-spin" />
                <span className="text-[9px] font-black text-slate-800 dark:text-white uppercase tracking-[0.2em]">
                  Buscando en Red Oasis...
                </span>
              </div>
            )}
          </GlassCard>
        )}

        {/* Pharmacy sidebar / list */}
        <div className={viewMode === 'map' ? 'col-span-12 lg:col-span-4' : 'col-span-12'}>
          <GlassCard className={viewMode === 'list' ? '' : '!p-3 min-h-[420px] flex flex-col justify-between'}>
            <div>
              {/* Header Title */}
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-foreground">
                  {viewMode === 'list'
                    ? `${pharmacies.length} farmacia${pharmacies.length !== 1 ? 's' : ''} registrada${pharmacies.length !== 1 ? 's' : ''}`
                    : 'Farmacias en Zona'}
                </h3>
                {nearbyPlaces.length > 0 && (
                  <span className="text-[10px] font-bold bg-teal-500/10 border border-teal-500/30 text-teal-400 px-2 py-0.5 rounded-full">
                    {nearbyPlaces.length} locales cerca
                  </span>
                )}
              </div>

              {/* Animate details panel if a nearby Oasis Place is clicked on the map */}
              <AnimatePresence mode="wait">
                {selectedNearbyPlace ? (
                  <motion.div
                    key="nearby-detail"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-4 p-3 rounded-2xl bg-teal-500/10 border border-teal-500/20 text-xs relative transition-colors duration-300"
                  >
                    <button
                      onClick={() => setSelectedNearbyPlace(null)}
                      className="absolute top-2 right-2 text-slate-400 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-white font-bold"
                    >
                      ×
                    </button>
                    <p className="text-[10px] font-black text-teal-600 dark:text-teal-400 uppercase tracking-widest mb-1">
                      {selectedNearbyPlace.type === 'clinic' ? 'Clínica Oasis' : 'Farmacia Oasis'}
                    </p>
                    <h4 className="font-bold text-slate-800 dark:text-white text-sm mb-1">
                      {selectedNearbyPlace.display_name}
                    </h4>
                    <p className="text-slate-600 dark:text-zinc-300 mb-2 leading-relaxed">
                      {selectedNearbyPlace.address?.road || 'Nicaragua'}
                    </p>
                    <div className="space-y-1 text-[11px] text-slate-500 dark:text-zinc-400">
                      <p className="flex items-center gap-1.5">
                        <Clock className="size-3 text-teal-500" />
                        Horario: Lunes a Sábado - 8am a 6pm
                      </p>
                      <p className="flex items-center gap-1.5">
                        <Phone className="size-3 text-teal-500" />
                        Contacto disponible en Oasis
                      </p>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => setSelectedNearbyPlace(null)}
                        className="btn-secondary !py-1 text-xs rounded-xl"
                      >
                        Cerrar
                      </button>
                      {selectedNearbyPlace.type === 'pharmacy' ? (
                        <button
                          onClick={() => navigate('delivery-request', selectedNearbyPlace.place_id)}
                          className="btn-primary !py-1 text-xs rounded-xl flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                        >
                          <Truck className="size-3" />
                          Pedir Domicilio
                        </button>
                      ) : (
                        <button
                          onClick={() => navigate('appointment-list')}
                          className="btn-primary !py-1 text-xs rounded-xl flex items-center justify-center gap-1 bg-teal-600 hover:bg-teal-500 text-white font-bold"
                        >
                          <Clock className="size-3" />
                          Agendar Cita
                        </button>
                      )}
                    </div>
                  </motion.div>
                ) : null}

                {selectedPharmacy ? (
                  <motion.div
                    key="db-detail"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-4 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs relative transition-colors duration-300"
                  >
                    <button
                      onClick={() => setSelectedPharmacy(null)}
                      className="absolute top-2 right-2 text-slate-400 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-white font-bold"
                    >
                      ×
                    </button>
                    <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1">
                      Farmacia Seleccionada
                    </p>
                    <h4 className="font-bold text-slate-800 dark:text-white text-sm mb-1">
                      {selectedPharmacy.name}
                    </h4>
                    <p className="text-slate-600 dark:text-zinc-300 mb-2 leading-relaxed">
                      {selectedPharmacy.address}
                    </p>
                    <div className="space-y-1 text-[11px] text-slate-500 dark:text-zinc-400">
                      {selectedPharmacy.phone && (
                        <p className="flex items-center gap-1.5">
                          <Phone className="size-3 text-emerald-500" />
                          Teléfono: {selectedPharmacy.phone}
                        </p>
                      )}
                      {selectedPharmacy.distance_in_meters != null && (
                        <p className="flex items-center gap-1.5">
                          <Navigation className="size-3 text-emerald-500" />
                          Distancia: {formatDistance(selectedPharmacy.distance_in_meters)}
                        </p>
                      )}
                    </div>
                    
                    {prescription && (
                      <div className="mt-2">
                        {(() => {
                          const matchedCount = selectedPharmacy.matchedMedicinesCount || 0;
                          const totalNeeded = medicineIds?.length || 0;
                          const isFullMatch = matchedCount === totalNeeded && totalNeeded > 0;
                          return (
                            <div className={cn(
                              "inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider",
                              isFullMatch ? "bg-teal-500/10 text-teal-400 border border-teal-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            )}>
                              {isFullMatch ? "Stock Completo" : `Stock Parcial: ${matchedCount}/${totalNeeded}`}
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => setSelectedPharmacy(null)}
                        className="btn-secondary !py-1 text-xs rounded-xl"
                      >
                        Cerrar
                      </button>
                      <button
                        onClick={() => navigate('delivery-request', selectedPharmacy.id)}
                        className="btn-primary !py-1 text-xs rounded-xl flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
                      >
                        <Truck className="size-3" />
                        Pedir Domicilio
                      </button>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>

              {/* Sidebar list items */}
              {pharmacies.length === 0 ? (
                <div className="flex flex-col items-center py-10 text-center">
                  <MapPin className="size-10 text-muted-foreground/30 mb-3 animate-bounce" />
                  <h3 className="text-base font-semibold text-foreground mb-1">Sin farmacias</h3>
                  <p className="text-sm text-muted-foreground">
                    No se encontraron farmacias registradas en esta zona. Prueba buscando otra zona en el buscador.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                  {pharmacies.map((pharmacy, index) => (
                    <motion.div
                      key={pharmacy.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <div
                        className={cn(
                          "rounded-2xl p-3 hover:bg-slate-50 dark:hover:bg-white/5 border border-slate-100 dark:border-transparent hover:border-slate-200 dark:hover:border-white/5 cursor-pointer transition-all bg-slate-50/50 dark:bg-zinc-950/20",
                          selectedPharmacy?.id === pharmacy.id && "border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-500/5"
                        )}
                        onClick={() => {
                          setSelectedPharmacy(pharmacy);
                          setSelectedNearbyPlace(null);
                          setMapCenter([pharmacy.latitude, pharmacy.longitude]);
                        }}
                      >
                        <div className="flex items-start gap-3">
                          {/* Pharmacy icon */}
                          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 border border-teal-500/20">
                            <MapPin className="size-4 text-teal-600 dark:text-teal-500" />
                          </div>

                          <div className="flex-1 min-w-0">
                            {/* Name & distance */}
                            <div className="flex items-start justify-between gap-2">
                              <p className="text-xs font-bold text-slate-800 dark:text-white truncate">
                                {pharmacy.name}
                              </p>
                              {pharmacy.distance_in_meters != null && (
                                <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full shrink-0">
                                  <Navigation className="size-2.5" />
                                  {formatDistance(pharmacy.distance_in_meters)}
                                </span>
                              )}
                            </div>

                            {/* Address */}
                            <p className="mt-0.5 text-[11px] text-slate-500 dark:text-zinc-400 truncate">
                              {pharmacy.address}
                            </p>

                            {/* Phone */}
                            {pharmacy.phone && (
                              <p className="mt-0.5 flex items-center gap-1 text-[10px] text-zinc-500">
                                <Phone className="size-3 text-teal-600 shrink-0" />
                                {pharmacy.phone}
                              </p>
                            )}

                            {/* Smart Stock Indicators */}
                            {prescription && (
                              <div className="mt-2 space-y-2">
                                {(() => {
                                  const matchedCount = pharmacy.matchedMedicinesCount || 0;
                                  const totalNeeded = medicineIds?.length || 0;
                                  const isFullMatch = matchedCount === totalNeeded && totalNeeded > 0;

                                  return (
                                    <>
                                      <div
                                        className={cn(
                                          'flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[9px] font-black uppercase tracking-wider',
                                          isFullMatch
                                            ? 'bg-teal-500/10 text-teal-400 border-teal-500/20'
                                            : matchedCount > 0
                                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                            : 'bg-red-500/10 text-red-400 border-red-500/20'
                                        )}
                                      >
                                        {isFullMatch ? (
                                          <CheckCircle2 className="size-3" />
                                        ) : (
                                          <AlertCircle className="size-3" />
                                        )}
                                        {isFullMatch
                                          ? 'STOCK COMPLETO'
                                          : matchedCount > 0
                                          ? `STOCK PARCIAL: ${matchedCount}/${totalNeeded}`
                                          : 'SIN STOCK'}
                                      </div>

                                      {matchedCount > 0 && matchedCount < totalNeeded && (
                                        <p className="text-[9px] text-amber-400/80 italic leading-snug">
                                          Tip: Divide tu receta si ninguna farmacia tiene stock completo.
                                        </p>
                                      )}
                                    </>
                                  );
                                })()}
                              </div>
                            )}

                            {/* Available medicines list */}
                            {pharmacy.available_medicines && pharmacy.available_medicines.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
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
                              className="mt-2.5 glass-btn-primary rounded-xl h-8 text-[11px] font-bold gap-1.5 px-3 flex items-center bg-emerald-600 text-white hover:bg-emerald-500 transition-colors"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate('delivery-request', pharmacy.id);
                              }}
                            >
                              <Truck className="size-3.5" />
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
            <div className="mt-4 pt-3 border-t border-white/5 text-[10px] text-zinc-500 space-y-1">
              <p>💡 Tip: Los marcadores verdes representan farmacias afiliadas.</p>
              <p>📍 Los marcadores azules representan clínicas afiliadas a la red Oasis Nicaragua.</p>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
