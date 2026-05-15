'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import {
  usePharmacy,
  useInventory,
  useMedicines,
  useCreateSale,
  getHookErrorMessage,
} from '@/hooks/use-api';
import { formatCurrency } from '@/utils/helpers';
import { DEFAULT_LAT, DEFAULT_LNG } from '@/utils/constants';
import { GlassCard } from '@/components/oasis/glass-card';
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
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
};

export function DeliveryRequest() {
  const { selectedItemId, navigate, user, setNotification } = useAuthStore();
  const pharmacyId = selectedItemId;

  // Fetch pharmacy data
  const pharmacyQuery = usePharmacy(pharmacyId ?? '', !!pharmacyId);

  // Fetch inventory for the pharmacy
  const inventoryQuery = useInventory(pharmacyId ?? '', undefined, !!pharmacyId);
  const inventoryItems = inventoryQuery.data?.data ?? [];

  // Fetch medicines catalog for search
  const [medicineSearch, setMedicineSearch] = useState('');
  const medicinesQuery = useMedicines(
    medicineSearch.trim() ? { search: medicineSearch } : undefined
  );

  // Order state
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryLat, setDeliveryLat] = useState(DEFAULT_LAT);
  const [deliveryLng, setDeliveryLng] = useState(DEFAULT_LNG);
  const [notes, setNotes] = useState('');
  const [showMedicineSearch, setShowMedicineSearch] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(false);

  // Create sale mutation
  const createSaleMutation = useCreateSale();

  if (!pharmacyId) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          className="rounded-full gap-2 text-muted-foreground"
          onClick={() => navigate('pharmacy-map')}
        >
          <ArrowLeft className="size-4" />
          Volver
        </Button>
        <GlassCard>
          <div className="flex flex-col items-center py-8 text-center">
            <AlertCircle className="size-10 text-red-500/50 mb-3" />
            <p className="text-sm text-muted-foreground">No se especificó una farmacia</p>
          </div>
        </GlassCard>
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
          unit_price: inventoryItem.price,
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
          unit_price: invItem?.price ?? 0,
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
          is_delivery: true,
          delivery_address: deliveryAddress,
          delivery_lat: deliveryLat,
          delivery_lng: deliveryLng,
          notes: notes || undefined,
        },
      });
      setNotification({ type: 'success', message: 'Pedido realizado con éxito' });
      setOrderConfirmed(true);
    } catch {
      setNotification({ type: 'error', message: 'No se pudo realizar el pedido. Intenta de nuevo.' });
    }
  };

  // Map markers for delivery address selection
  const mapMarkers: MapMarker[] = deliveryAddress.trim()
    ? [{ id: 'destination', lat: deliveryLat, lng: deliveryLng, type: 'destination' as const, label: 'Dirección de entrega' }]
    : [];

  if (pharmacyQuery.isLoading) {
    return (
      <div className="bento-grid">
        <div className="col-span-8"><div className="shimmer rounded-3xl h-48" /></div>
        <div className="col-span-4"><div className="shimmer rounded-3xl h-48" /></div>
        <div className="col-span-12"><div className="shimmer rounded-3xl h-32" /></div>
      </div>
    );
  }

  if (pharmacyQuery.isError || !pharmacy) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          className="rounded-full gap-2 text-muted-foreground"
          onClick={() => navigate('pharmacy-map')}
        >
          <ArrowLeft className="size-4" />
          Volver
        </Button>
        <GlassCard>
          <div className="flex flex-col items-center py-8 text-center">
            <AlertCircle className="size-10 text-red-500 mb-3" />
            <p className="text-sm text-muted-foreground mb-4">
              {pharmacyQuery.isError ? getHookErrorMessage(pharmacyQuery.error) : 'Farmacia no encontrada'}
            </p>
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => pharmacyQuery.refetch()}
            >
              Reintentar
            </Button>
          </div>
        </GlassCard>
      </div>
    );
  }

  // Order confirmation screen
  if (orderConfirmed) {
    return (
      <GlassCard className="max-w-md mx-auto text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-emerald-500/10 mx-auto mb-4">
          <CheckCircle2 className="size-8 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">Pedido Confirmado</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Tu pedido ha sido registrado exitosamente. Puedes rastrear su estado en la sección de pedidos.
        </p>
        <div className="flex gap-3 justify-center">
          <Button
            variant="outline"
            className="rounded-full"
            onClick={() => navigate('pharmacy-map')}
          >
            Volver a farmacias
          </Button>
          <Button
            className="glass-btn-primary rounded-full"
            onClick={() => navigate('order-tracking')}
          >
            Ver mis pedidos
          </Button>
        </div>
      </GlassCard>
    );
  }

  // Search results for medicines
  const searchMedicines = medicinesQuery.data?.data ?? [];
  const filteredSearchMedicines = medicineSearch.trim()
    ? searchMedicines.filter(
        (m) =>
          m.name.toLowerCase().includes(medicineSearch.toLowerCase()) ||
          m.active_ingredient?.toLowerCase().includes(medicineSearch.toLowerCase())
      )
    : searchMedicines;

  return (
    <div className="space-y-4">
      {/* Back button */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="rounded-full gap-1.5 text-muted-foreground"
          onClick={() => navigate('pharmacy-map')}
        >
          <ArrowLeft className="size-4" />
          Volver
        </Button>
        <motion.h2
          {...fadeInUp}
          className="text-lg font-bold text-foreground"
        >
          Pedir Domicilio
        </motion.h2>
      </div>

      <div className="bento-grid">
        {/* Pharmacy info + Delivery Address + Map */}
        <div className="col-span-6 space-y-4">
          {/* Pharmacy info */}
          <GlassCard>
            <div className="flex items-center gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-teal-500/10">
                <MapPin className="size-5 text-teal-600 dark:text-teal-400" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{pharmacy.name}</p>
                <p className="text-xs text-muted-foreground truncate">{pharmacy.address}</p>
              </div>
            </div>
          </GlassCard>

          {/* Delivery Address */}
          <GlassCard>
            <div className="flex items-center gap-2 mb-3">
              <Truck className="size-4 text-teal-600 dark:text-teal-400" />
              <h3 className="text-sm font-semibold text-foreground">Dirección de Entrega</h3>
            </div>
            <Input
              placeholder="Ingresa tu dirección completa..."
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              className="rounded-full glass-input mb-3"
            />
            <div className="rounded-2xl overflow-hidden">
              <MapView
                markers={mapMarkers}
                center={[deliveryLat, deliveryLng]}
                height="180px"
                showUserLocation
              />
            </div>
          </GlassCard>

          {/* Notes */}
          <GlassCard>
            <div className="flex items-center gap-2 mb-3">
              <StickyNote className="size-4 text-amber-600 dark:text-amber-400" />
              <h3 className="text-sm font-semibold text-foreground">Notas del Pedido</h3>
            </div>
            <Textarea
              placeholder="Instrucciones especiales para la entrega..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="glass-input rounded-2xl resize-none"
            />
          </GlassCard>
        </div>

        {/* Product list + Summary */}
        <div className="col-span-6 space-y-4">
          {/* Product List */}
          <GlassCard>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Package className="size-4 text-sky-600 dark:text-sky-400" />
                <h3 className="text-sm font-semibold text-foreground">Productos</h3>
              </div>
              <button
                className="glass-btn-secondary rounded-full h-7 text-xs gap-1 px-3 flex items-center"
                onClick={() => setShowMedicineSearch(!showMedicineSearch)}
              >
                <Plus className="size-3" />
                Agregar
              </button>
            </div>

            {/* Medicine search */}
            <AnimatePresence>
              {showMedicineSearch && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-2 pb-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar medicamento..."
                        value={medicineSearch}
                        onChange={(e) => setMedicineSearch(e.target.value)}
                        className="pl-9 rounded-full glass-input"
                      />
                    </div>

                    <div className="max-h-40 overflow-y-auto rounded-2xl glass-input custom-scrollbar">
                      {(medicineSearch.trim() ? filteredSearchMedicines.map((med) => ({
                        id: med.id,
                        name: med.name,
                        dosage_form: med.dosage_form,
                        strength: med.strength,
                        price: inventoryItems.find((inv) => inv.medicine.id === med.id)?.price ?? 0,
                        stock: inventoryItems.find((inv) => inv.medicine.id === med.id)?.stock_quantity ?? 0,
                      })) : inventoryItems.map((inv) => ({
                        id: inv.medicine.id,
                        name: inv.medicine.name,
                        dosage_form: inv.medicine.dosage_form,
                        strength: inv.medicine.strength,
                        price: inv.price,
                        stock: inv.stock_quantity,
                      }))).slice(0, 10).map((item) => {
                        const alreadyAdded = orderItems.some((i) => i.medicine_id === item.id);
                        return (
                          <button
                            key={item.id}
                            className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-teal-500/5 transition-colors disabled:opacity-50"
                            onClick={() => {
                              if (!alreadyAdded) {
                                addMedicineFromSearch({ id: item.id, name: item.name });
                              }
                            }}
                            disabled={alreadyAdded}
                          >
                            <div>
                              <p className="text-sm font-medium text-foreground">{item.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {item.dosage_form && `${item.dosage_form} · `}
                                {item.strength && `${item.strength} · `}
                                {item.price > 0 ? formatCurrency(item.price) : 'Precio no disponible'}
                              </p>
                            </div>
                            {alreadyAdded ? (
                              <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-teal-500/10 text-teal-700 dark:text-teal-300">
                                Agregado
                              </span>
                            ) : (
                              <Plus className="size-4 text-teal-600 dark:text-teal-400" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Order items */}
            {orderItems.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground text-center">
                Agrega medicamentos a tu pedido
              </p>
            ) : (
              <div className="space-y-0">
                {orderItems.map((item, index) => (
                  <motion.div
                    key={item.medicine_id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.03 }}
                    className={cn('py-3', index > 0 && 'border-t border-border')}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(item.unit_price)} c/u
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          className="flex size-7 items-center justify-center rounded-full glass text-muted-foreground hover:text-foreground transition-colors"
                          onClick={() => updateQuantity(item.medicine_id, -1)}
                        >
                          <Minus className="size-3" />
                        </button>
                        <span className="w-8 text-center text-sm font-medium text-foreground">
                          {item.quantity}
                        </span>
                        <button
                          className="flex size-7 items-center justify-center rounded-full glass text-muted-foreground hover:text-foreground transition-colors"
                          onClick={() => updateQuantity(item.medicine_id, 1)}
                        >
                          <Plus className="size-3" />
                        </button>
                        <button
                          className="flex size-7 items-center justify-center rounded-full text-red-500 hover:bg-red-500/10 transition-colors"
                          onClick={() => removeItem(item.medicine_id)}
                        >
                          <Trash2 className="size-3" />
                        </button>
                      </div>
                    </div>
                    <p className="mt-1 text-right text-sm font-semibold text-teal-700 dark:text-teal-400">
                      {formatCurrency(item.quantity * item.unit_price)}
                    </p>
                  </motion.div>
                ))}
              </div>
            )}
          </GlassCard>

          {/* Order Summary */}
          <GlassCard className="border-teal-500/20">
            <div className="flex items-center gap-2 mb-3">
              <ShoppingCart className="size-4 text-teal-600 dark:text-teal-400" />
              <h3 className="text-sm font-semibold text-foreground">Resumen del Pedido</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal ({orderItems.length} producto{orderItems.length !== 1 ? 's' : ''})</span>
                <span className="font-medium text-foreground">{formatCurrency(totalPrice)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Envío a domicilio</span>
                <span className="font-medium text-foreground">{formatCurrency(29.90)}</span>
              </div>
              <div className="border-t border-border pt-2">
                <div className="flex justify-between text-base font-bold">
                  <span className="text-foreground">Total</span>
                  <span className="text-teal-600 dark:text-teal-400">{formatCurrency(totalPrice + 29.90)}</span>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Submit Button */}
          <Button
            className="w-full glass-btn-primary rounded-full gap-2 h-12 text-base"
            onClick={handleSubmit}
            disabled={createSaleMutation.isPending || orderItems.length === 0 || !deliveryAddress.trim()}
          >
            {createSaleMutation.isPending ? (
              <>
                <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Procesando...
              </>
            ) : (
              <>
                <Truck className="size-5" />
                Confirmar pedido
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
