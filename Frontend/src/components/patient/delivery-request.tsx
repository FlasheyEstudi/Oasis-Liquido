'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { useUserLocation } from '@/hooks/use-user-location';
import {
  usePharmacy,
  useInventory,
  useMedicines,
  useCreateSale,
  usePrescription,
  getHookErrorMessage,
} from '@/hooks/use-api';
import { formatCurrency } from '@/utils/helpers';
import { DEFAULT_LAT, DEFAULT_LNG } from '@/utils/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MapView } from '@/components/common/map-view';
import type { MapMarker } from '@/components/common/map-view';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  MapPin,
  Truck,
  Package,
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  StickyNote,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import type { InventoryItem } from '@/types';

interface OrderItem {
  medicine_id: string;
  name: string;
  quantity: number;
  unit_price: number;
}

const fadeInUp = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0, transition: { type: 'spring', damping: 25 } },
};

export function DeliveryRequest() {
  const { selectedItemId, prescriptionId, navigate, user, setNotification } = useAuthStore();
  const pharmacyId = selectedItemId;

  const userLoc = useUserLocation();

  const pharmacyQuery = usePharmacy(pharmacyId ?? '', !!pharmacyId);
  const inventoryQuery = useInventory(pharmacyId ?? '', undefined, !!pharmacyId);
  const inventoryItems = inventoryQuery.data?.data ?? [];

  const prescriptionQuery = usePrescription(prescriptionId ?? '', !!prescriptionId);

  const [medicineSearch, setMedicineSearch] = useState('');
  const medicinesQuery = useMedicines(
    medicineSearch.trim() ? { search: medicineSearch } : undefined
  );

  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryLat, setDeliveryLat] = useState(DEFAULT_LAT);
  const [deliveryLng, setDeliveryLng] = useState(DEFAULT_LNG);
  const [notes, setNotes] = useState('');
  const [showMedicineSearch, setShowMedicineSearch] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(false);

  const createSaleMutation = useCreateSale();

  useEffect(() => {
    if (!userLoc.loading && userLoc.address && !deliveryAddress) {
      setDeliveryAddress(userLoc.address);
      setDeliveryLat(userLoc.lat);
      setDeliveryLng(userLoc.lng);
    }
  }, [userLoc.loading, userLoc.address, userLoc.lat, userLoc.lng, deliveryAddress]);

  useEffect(() => {
    if (prescriptionQuery.data && orderItems.length === 0 && inventoryItems.length > 0) {
      const items: OrderItem[] = (prescriptionQuery.data.lines ?? [])
        .filter((line) => line.quantity > line.quantity_fulfilled)
        .map((line) => {
          const invItem = inventoryItems.find((inv) => inv.medicine.id === line.medicine_id);
          return {
            medicine_id: line.medicine_id,
            name: line.medicine?.name || 'Medicamento',
            quantity: line.quantity - line.quantity_fulfilled,
            unit_price: invItem?.unitPrice ?? 0,
          };
        });
      setOrderItems(items);
    }
  }, [prescriptionQuery.data, inventoryItems, orderItems.length]);

  if (!pharmacyId) {
    return (
      <div className="space-y-4 max-w-2xl mx-auto px-1">
        <Button
          variant="ghost"
          className="rounded-full gap-2 text-muted-foreground"
          onClick={() => navigate('pharmacy-map')}
        >
          <ArrowLeft className="size-4" /> Volver
        </Button>
        <div className="p-6 text-center text-slate-400">
          <AlertCircle className="size-10 text-red-500/50 mx-auto mb-3" />
          <p className="text-xs font-bold">No se especificó una farmacia destino</p>
        </div>
      </div>
    );
  }

  const pharmacy = pharmacyQuery.data;

  const addItem = (inventoryItem: InventoryItem) => {
    const existing = orderItems.find((i) => i.medicine_id === inventoryItem.medicine.id);
    if (existing) {
      setOrderItems(
        orderItems.map((i) =>
          i.medicine_id === inventoryItem.medicine.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        )
      );
    } else {
      setOrderItems([
        ...orderItems,
        {
          medicine_id: inventoryItem.medicine.id,
          name: inventoryItem.medicine.name,
          quantity: 1,
          unit_price: inventoryItem.unitPrice,
        },
      ]);
    }
  };

  const addMedicineFromSearch = (med: { id: string; name: string }) => {
    const existing = orderItems.find((i) => i.medicine_id === med.id);
    if (existing) {
      setOrderItems(
        orderItems.map((i) =>
          i.medicine_id === med.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        )
      );
    } else {
      const invItem = inventoryItems.find((inv) => inv.medicine.id === med.id);
      setOrderItems([
        ...orderItems,
        {
          medicine_id: med.id,
          name: med.name,
          quantity: 1,
          unit_price: invItem?.unitPrice ?? 0,
        },
      ]);
    }
    setShowMedicineSearch(false);
    setMedicineSearch('');
  };

  const updateQuantity = (medicineId: string, delta: number) => {
    setOrderItems(
      orderItems
        .map((i) =>
          i.medicine_id === medicineId
            ? { ...i, quantity: Math.max(0, i.quantity + delta) }
            : i
        )
        .filter((i) => i.quantity > 0)
    );
  };

  const removeItem = (medicineId: string) => {
    setOrderItems(orderItems.filter((i) => i.medicine_id !== medicineId));
  };

  const totalPrice = orderItems.reduce((sum, i) => sum + i.quantity * i.unit_price, 0);
  const deliveryFee = (pharmacy as any)?.deliveryFee ?? 29.90;

  const handleSubmit = async () => {
    if (orderItems.length === 0) {
      setNotification({ type: 'warning', message: 'Agrega al menos un medicamento al pedido' });
      return;
    }
    if (!deliveryAddress.trim()) {
      setNotification({ type: 'warning', message: 'Ingresa la dirección de entrega' });
      return;
    }

    try {
      await createSaleMutation.mutateAsync({
        pharmacyId,
        data: {
          items: orderItems.map((i) => ({
            medicine_id: i.medicine_id,
            quantity: i.quantity,
            unit_price: i.unit_price,
          })),
          patient_id: user?.id,
          prescription_id: prescriptionId || undefined,
          is_delivery: true,
          delivery_address: deliveryAddress,
          delivery_lat: deliveryLat,
          delivery_lng: deliveryLng,
          notes: notes || undefined,
          payments: [
            {
              amount: totalPrice + deliveryFee,
              method: 'cash',
            },
          ],
        },
      });
      setNotification({ type: 'success', message: 'Pedido realizado con éxito' });
      useAuthStore.getState().setPrescriptionId(null);
      setOrderConfirmed(true);
    } catch {
      setNotification({ type: 'error', message: 'No se pudo realizar el pedido. Intenta de nuevo.' });
    }
  };

  const mapMarkers: MapMarker[] = [];
  if (deliveryAddress.trim()) {
    mapMarkers.push({
      id: 'destination',
      lat: deliveryLat,
      lng: deliveryLng,
      type: 'destination' as const,
      label: 'Dirección de entrega',
    });
  }
  if (pharmacy) {
    mapMarkers.push({
      id: 'pharmacy',
      lat: pharmacy.latitude,
      lng: pharmacy.longitude,
      type: 'pharmacy' as const,
      label: pharmacy.name,
    });
  }

  const mapRoute = pharmacy && deliveryAddress.trim()
    ? {
        origin: `${deliveryLng},${deliveryLat}`,
        destination: `${pharmacy.longitude},${pharmacy.latitude}`,
      }
    : null;

  if (pharmacyQuery.isLoading) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto px-1">
        <div className="shimmer rounded-full h-10 w-28 opacity-70" />
        <div className="shimmer rounded-[40px_16px_40px_16px] h-64 opacity-70" />
      </div>
    );
  }

  if (pharmacyQuery.isError || !pharmacy) {
    return (
      <div className="space-y-4 max-w-2xl mx-auto px-1 text-center py-12">
        <Button
          variant="ghost"
          className="rounded-full gap-2 text-muted-foreground mx-auto"
          onClick={() => navigate('pharmacy-map')}
        >
          <ArrowLeft className="size-4" /> Volver
        </Button>
        <p className="text-xs font-bold text-slate-450 mt-4">Error al conectar con la farmacia.</p>
      </div>
    );
  }

  if (orderConfirmed) {
    return (
      <div className="max-w-md mx-auto text-center py-12 px-4 space-y-6">
        <div className="flex size-14 items-center justify-center rounded-full bg-emerald-500/10 mx-auto border border-emerald-500/20">
          <CheckCircle2 className="size-7 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h2 className="text-lg font-black text-slate-805 dark:text-white font-serif">¡Misión de Entrega Iniciada!</h2>
        <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed font-semibold">
          Tu pedido a domicilio se ha registrado en la central de Oasis. Pronto un repartidor de nuestro escuadrón tomará la ruta.
        </p>
        <div className="flex gap-3 justify-center">
          <Button
            variant="outline"
            className="rounded-full text-[10px] font-black uppercase tracking-widest px-5 h-10"
            onClick={() => navigate('pharmacy-map')}
          >
            Farmacias
          </Button>
          <Button
            className="bg-teal-600 hover:bg-teal-700 text-white rounded-full text-[10px] font-black uppercase tracking-widest px-5 h-10 border-none shadow-sm"
            onClick={() => navigate('order-tracking')}
          >
            Mis Pedidos
          </Button>
        </div>
      </div>
    );
  }

  const searchMedicines = medicinesQuery.data?.data ?? [];
  const filteredSearchMedicines = medicineSearch.trim()
    ? searchMedicines.filter(
        (m) =>
          m.name.toLowerCase().includes(medicineSearch.toLowerCase()) ||
          m.active_ingredient?.toLowerCase().includes(medicineSearch.toLowerCase())
      )
    : searchMedicines;

  return (
    <div className="space-y-6 pb-28 max-w-2xl mx-auto px-1 sm:px-0 relative overflow-visible">
      {/* Background ambient */}
      <div className="absolute top-[20%] left-[-10%] size-80 bg-gradient-to-br from-teal-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* Back navigation header action */}
      <div className="flex items-center justify-between pb-2">
        <Button
          variant="ghost"
          size="sm"
          className="rounded-full gap-1.5 text-slate-700 dark:text-zinc-350 bg-white/40 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 shadow-sm backdrop-blur-sm px-4 py-2 text-[8.5px] font-black uppercase tracking-widest cursor-pointer"
          onClick={() => navigate('pharmacy-map')}
        >
          <ArrowLeft className="size-3.5" />
          Volver
        </Button>

        <span className="px-3 py-1 rounded-full bg-teal-500/10 text-teal-605 dark:text-teal-400 text-[8.5px] font-black uppercase tracking-widest">
          Crear Pedido Domicilio
        </span>
      </div>

      {/* 1. Curved Top Pharmacy Visor — Cardless */}
      <div className="bg-teal-500/10 dark:bg-zinc-950/40 border-b border-dashed border-teal-500/20 rounded-b-[40px] py-6 px-5 -mx-4 relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/[0.03] rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center gap-3.5 relative z-10">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-teal-500/15 border border-teal-500/20 text-teal-600 dark:text-teal-400 shadow-inner">
            <MapPin className="size-5.5 shrink-0" />
          </div>
          <div className="min-w-0">
            <h3 className="text-base font-black text-slate-900 dark:text-white font-serif truncate">{pharmacy.name}</h3>
            <p className="text-[10px] text-slate-500 dark:text-zinc-400 font-bold truncate mt-0.5">{pharmacy.address}</p>
          </div>
        </div>
      </div>

      {/* 2. Seamless Address & Map configuration — Cardless Glass Panel */}
      <div className="bg-white/10 dark:bg-zinc-950/10 border border-slate-200/50 dark:border-white/5 rounded-[40px_16px_40px_16px] backdrop-blur-md p-5 shadow-xl space-y-4">
        <p className="text-[8.5px] font-black text-slate-450 dark:text-zinc-500 uppercase tracking-[0.2em] pb-2 border-b border-dashed border-slate-200 dark:divide-white/5">DIRECCIÓN Y COBERTURA</p>
        
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-[8.5px] font-black text-slate-500 dark:text-zinc-400 uppercase tracking-widest pl-1">Dirección de Entrega Completa</label>
            <Input
              placeholder="Ej. Frente a parque central, casa portón verde..."
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              className="rounded-xl glass-input h-11 text-xs font-bold border-slate-200 dark:border-white/5 bg-white/40 dark:bg-white/5 focus:border-teal-500"
            />
          </div>

          <div className="rounded-[28px_12px_20px_12px] overflow-hidden border border-slate-200/50 dark:border-white/5 shadow-inner h-44 bg-zinc-900">
            <MapView
              markers={mapMarkers}
              center={[deliveryLat, deliveryLng]}
              height="100%"
              showUserLocation
              route={mapRoute}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[8.5px] font-black text-slate-500 dark:text-zinc-400 uppercase tracking-widest pl-1">Notas especiales para el motorista</label>
            <Textarea
              placeholder="Instrucciones del domicilio, referencias del punto..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="glass-input rounded-xl text-xs font-bold border-slate-200 dark:border-white/5 bg-white/40 dark:bg-white/5 focus:border-teal-500 resize-none"
            />
          </div>
        </div>
      </div>

      {/* 3. Product Catalog Shopping manifest — Cardless list with inline search */}
      <div className="bg-white/10 dark:bg-zinc-950/10 border border-slate-200/50 dark:border-white/5 rounded-[40px_16px_40px_16px] backdrop-blur-md p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-dashed border-slate-200 dark:border-white/5">
          <p className="text-[8.5px] font-black text-slate-450 dark:text-zinc-500 uppercase tracking-[0.2em]">FÁRMACOS Y PRODUCTOS</p>
          <button
            className="bg-teal-500/10 text-teal-605 border border-teal-500/20 rounded-full h-8 text-[9px] font-black uppercase tracking-widest px-4 flex items-center gap-1 cursor-pointer"
            onClick={() => setShowMedicineSearch(!showMedicineSearch)}
          >
            <Plus className="size-3 stroke-[3]" />
            Agregar Medicamento
          </button>
        </div>

        {/* Searching Catalog inline overlay */}
        <AnimatePresence>
          {showMedicineSearch && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden space-y-3"
            >
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-450 dark:text-zinc-550" />
                <Input
                  placeholder="Buscar en farmacia..."
                  value={medicineSearch}
                  onChange={(e) => setMedicineSearch(e.target.value)}
                  className="pl-10 rounded-full h-10 text-xs font-bold border-slate-200 dark:border-white/5 bg-white/40 dark:bg-white/5 focus:border-teal-500"
                />
              </div>

              <div className="max-h-40 overflow-y-auto rounded-2xl border border-slate-200/50 dark:border-white/5 bg-white/30 dark:bg-zinc-950/40 p-1 divide-y divide-slate-100 dark:divide-white/[0.03] custom-scrollbar">
                {(medicineSearch.trim() ? filteredSearchMedicines.map((med) => ({
                  id: med.id,
                  name: med.name,
                  dosage_form: med.dosage_form,
                  strength: med.strength,
                  price: inventoryItems.find((inv) => inv.medicine.id === med.id)?.unitPrice ?? 0,
                  stock: inventoryItems.find((inv) => inv.medicine.id === med.id)?.quantity ?? 0,
                })) : inventoryItems.map((inv) => ({
                  id: inv.medicine.id,
                  name: inv.medicine.name,
                  dosage_form: inv.medicine.dosage_form,
                  strength: inv.medicine.strength,
                  price: inv.unitPrice,
                  stock: inv.quantity,
                }))).slice(0, 8).map((item) => {
                  const alreadyAdded = orderItems.some((i) => i.medicine_id === item.id);
                  return (
                    <button
                      key={item.id}
                      className="flex w-full items-center justify-between px-3.5 py-2.5 text-left hover:bg-teal-500/5 transition-colors disabled:opacity-50 border-none cursor-pointer"
                      onClick={() => {
                        if (!alreadyAdded) {
                          addMedicineFromSearch({ id: item.id, name: item.name });
                        }
                      }}
                      disabled={alreadyAdded}
                    >
                      <div>
                        <p className="text-xs font-black text-slate-805 dark:text-white font-serif">{item.name}</p>
                        <p className="text-[10px] text-slate-500 dark:text-zinc-450 font-bold mt-0.5">
                          {item.dosage_form && `${item.dosage_form} · `}
                          {item.strength && `${item.strength} · `}
                          {item.price > 0 ? formatCurrency(item.price) : 'Sin precio'}
                        </p>
                      </div>
                      {alreadyAdded ? (
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[8.5px] font-black bg-teal-500/10 text-teal-700 dark:text-teal-400">
                          Agregado
                        </span>
                      ) : (
                        <Plus className="size-4 text-teal-600 dark:text-teal-400 stroke-[3]" />
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Selected manifest rows */}
        <div className="divide-y divide-dashed divide-slate-200/60 dark:divide-white/5">
          {orderItems.length === 0 ? (
            <p className="py-6 text-xs text-slate-400 font-bold text-center">
              No has seleccionado medicamentos en este manifiesto.
            </p>
          ) : (
            orderItems.map((item, index) => (
              <div key={item.medicine_id} className="py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <h4 className="text-xs font-black text-slate-805 dark:text-white font-serif truncate">{item.name}</h4>
                  <p className="text-[10px] text-slate-500 dark:text-zinc-450 font-mono mt-0.5">
                    {formatCurrency(item.unit_price)} c/u
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center gap-1 bg-slate-500/[0.04] dark:bg-white/5 p-1 rounded-xl border border-slate-200/40 dark:border-white/5">
                    <button
                      className="size-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-800 dark:text-zinc-450 dark:hover:text-white cursor-pointer border-none bg-transparent"
                      onClick={() => updateQuantity(item.medicine_id, -1)}
                    >
                      <Minus className="size-3" />
                    </button>
                    <span className="w-6 text-center text-xs font-mono font-bold text-slate-805 dark:text-white">
                      {item.quantity}
                    </span>
                    <button
                      className="size-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-800 dark:text-zinc-450 dark:hover:text-white cursor-pointer border-none bg-transparent"
                      onClick={() => updateQuantity(item.medicine_id, 1)}
                    >
                      <Plus className="size-3" />
                    </button>
                  </div>
                  
                  <button
                    className="size-8 rounded-full flex items-center justify-center text-red-500 hover:bg-red-500/10 cursor-pointer border-none bg-transparent"
                    onClick={() => removeItem(item.medicine_id)}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 4. Resumen & Confirm action capsule */}
      <div className="bg-white/10 dark:bg-zinc-950/10 border border-slate-200/50 dark:border-white/5 rounded-[40px_16px_40px_16px] backdrop-blur-md p-5 shadow-xl space-y-4">
        <p className="text-[8.5px] font-black text-slate-450 dark:text-zinc-550 uppercase tracking-[0.2em] pb-2 border-b border-dashed border-slate-200 dark:border-white/5">RESUMEN LIQUIDACIÓN</p>
        
        <div className="space-y-2 text-xs font-bold">
          <div className="flex justify-between items-center text-slate-550 dark:text-zinc-400">
            <span>Fármacos ({orderItems.length})</span>
            <span className="font-mono">{formatCurrency(totalPrice)}</span>
          </div>
          <div className="flex justify-between items-center text-slate-550 dark:text-zinc-400">
            <span>Servicio Reparto</span>
            <span className="font-mono">{formatCurrency(deliveryFee)}</span>
          </div>
          <div className="pt-2.5 border-t border-dashed border-slate-200 dark:border-white/5 flex justify-between items-center">
            <span className="text-slate-800 dark:text-white font-serif uppercase tracking-wider text-[10px]">TOTAL LIQUIDAR</span>
            <span className="text-sm font-black text-teal-600 dark:text-teal-400 font-mono">{formatCurrency(totalPrice + deliveryFee)}</span>
          </div>
        </div>
      </div>

      {/* Confirmation Capsule Trigger */}
      <Button
        className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-650 hover:to-cyan-650 text-white font-black text-xs uppercase tracking-widest rounded-full shadow-lg shadow-teal-500/10 h-13 gap-2 flex items-center justify-center border-none disabled:opacity-50 cursor-pointer transition-all duration-300"
        onClick={handleSubmit}
        disabled={createSaleMutation.isPending || orderItems.length === 0 || !deliveryAddress.trim()}
      >
        {createSaleMutation.isPending ? (
          <>
            <Loader2 className="size-5 animate-spin" />
            PROCESANDO PEDIDO...
          </>
        ) : (
          <>
            <Truck className="size-5 shrink-0" />
            CONFIRMAR MISIÓN DOMICILIO
          </>
        )}
      </Button>
    </div>
  );
}
