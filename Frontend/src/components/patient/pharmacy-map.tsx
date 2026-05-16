'use client';

import { useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { MapView } from '@/components/common/map-view';
import type { MapMarker } from '@/components/common/map-view';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Search,
  MapPin,
  Truck,
  Phone,
  Pill,
  Navigation,
  LayoutList,
  Map,
  AlertCircle,
} from 'lucide-react';

const fadeInUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

export function PharmacyMap() {
  const { selectedItemId, navigate } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');

  // Load prescription context if available
  const prescriptionQuery = usePrescription(selectedItemId ?? '', !!selectedItemId);
  const medicineIds = prescriptionQuery.data?.lines?.map((l) => l.medicine_id);

  // Load pharmacies
  const pharmaciesQuery = usePharmacies({
    lat: DEFAULT_LAT,
    lng: DEFAULT_LNG,
    medicine_ids: medicineIds && medicineIds.length > 0 ? medicineIds : undefined,
    search: searchQuery || undefined,
  });

  // Load medicines for name lookups
  const medicinesQuery = useMedicines();

  const pharmacies = pharmaciesQuery.data?.data ?? [];
  const medicines = medicinesQuery.data?.data ?? [];

  const filteredPharmacies = pharmacies;

  // Map markers
  const markers: MapMarker[] = filteredPharmacies.map((p) => ({
    id: p.id,
    lat: p.latitude,
    lng: p.longitude,
    type: 'pharmacy',
    label: p.name,
  }));

  // Helper: get medicine name by ID
  const getMedicineName = (id: string) => {
    return medicines.find((m) => m.id === id)?.name || 'Medicamento';
  };

  const isLoading = pharmaciesQuery.isLoading || (selectedItemId ? prescriptionQuery.isLoading : false);
  const prescription = prescriptionQuery.data;

  if (isLoading) {
    return (
      <div className="bento-grid">
        <div className="col-span-8"><div className="shimmer rounded-3xl h-64" /></div>
        <div className="col-span-4"><div className="shimmer rounded-3xl h-64" /></div>
        <div className="col-span-6"><div className="shimmer rounded-3xl h-24" /></div>
        <div className="col-span-6"><div className="shimmer rounded-3xl h-24" /></div>
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
            className="text-lg font-bold text-foreground truncate"
          >
            Farmacias Cercanas
          </motion.h2>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            className={cn(
              'flex size-8 items-center justify-center rounded-full transition-all',
              viewMode === 'map' ? 'glass-btn-primary text-white' : 'glass text-muted-foreground'
            )}
            onClick={() => setViewMode('map')}
          >
            <Map className="size-3.5" />
          </button>
          <button
            className={cn(
              'flex size-8 items-center justify-center rounded-full transition-all',
              viewMode === 'list' ? 'glass-btn-primary text-white' : 'glass text-muted-foreground'
            )}
            onClick={() => setViewMode('list')}
          >
            <LayoutList className="size-3.5" />
          </button>
        </div>
      </div>

      {/* Prescription context banner */}
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

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Buscar farmacia o medicamento..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 rounded-full glass-input"
        />
      </div>

      {/* Bento Grid Layout */}
      <div className="bento-grid">
        {/* Map View */}
        {viewMode === 'map' && (
          <GlassCard className="col-span-8 !p-3">
            <MapView
              markers={markers}
              center={[DEFAULT_LAT, DEFAULT_LNG]}
              height="380px"
              zoom={14}
              showUserLocation
              onMarkerClick={(marker) => {
                if (marker.id) {
                  navigate('delivery-request', marker.id);
                }
              }}
            />
          </GlassCard>
        )}

        {/* Pharmacy sidebar / list */}
        <div className={viewMode === 'map' ? 'col-span-4' : 'col-span-12'}>
          <GlassCard className={viewMode === 'list' ? '' : '!p-3'}>
            {viewMode === 'list' && (
              <h3 className="text-sm font-semibold text-foreground mb-3">
                {filteredPharmacies.length} farmacia{filteredPharmacies.length !== 1 ? 's' : ''} encontrada{filteredPharmacies.length !== 1 ? 's' : ''}
              </h3>
            )}
            {filteredPharmacies.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-center">
                <MapPin className="size-10 text-muted-foreground/30 mb-3" />
                <h3 className="text-base font-semibold text-foreground mb-1">Sin farmacias</h3>
                <p className="text-sm text-muted-foreground">
                  No se encontraron farmacias con los criterios de búsqueda
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[380px] overflow-y-auto custom-scrollbar pr-1">
                {filteredPharmacies.map((pharmacy, index) => (
                  <motion.div
                    key={pharmacy.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div
                      className="rounded-2xl p-3 hover:bg-muted/30 cursor-pointer transition-all"
                      onClick={() => navigate('delivery-request', pharmacy.id)}
                    >
                      <div className="flex items-start gap-3">
                        {/* Pharmacy icon */}
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-teal-500/10">
                          <MapPin className="size-4 text-teal-600 dark:text-teal-400" />
                        </div>

                        <div className="flex-1 min-w-0">
                          {/* Name & distance */}
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-semibold text-foreground truncate">
                              {pharmacy.name}
                            </p>
                            {pharmacy.distance_in_meters != null && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                                <Navigation className="size-3" />
                                {formatDistance(pharmacy.distance_in_meters)}
                              </span>
                            )}
                          </div>

                          {/* Address */}
                          <p className="mt-0.5 text-xs text-muted-foreground truncate">
                            {pharmacy.address}
                          </p>

                          {/* Phone */}
                          {pharmacy.phone && (
                            <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                              <Phone className="size-3" />
                              {pharmacy.phone}
                            </p>
                          )}

                          {/* Available medicines */}
                          {pharmacy.available_medicines && pharmacy.available_medicines.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {pharmacy.available_medicines.map((med) => (
                                <span
                                  key={med.medicine_id}
                                  className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-teal-500/10 text-teal-700 dark:text-teal-300 border border-teal-500/20"
                                >
                                  {getMedicineName(med.medicine_id)} · Stock: {med.stock} · {formatCurrency(med.price)}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Delivery button */}
                          <button
                            className="mt-2 glass-btn-primary rounded-full h-7 text-xs gap-1.5 px-3 flex items-center"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate('delivery-request', pharmacy.id);
                            }}
                          >
                            <Truck className="size-3" />
                            Pedir domicilio
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
