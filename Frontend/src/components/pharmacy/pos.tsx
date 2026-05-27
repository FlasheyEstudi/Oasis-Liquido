'use client';

import { useState, useEffect } from 'react';
import { 
  Search, 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  QrCode, 
  Receipt, 
  User, 
  Package,
  AlertCircle,
  CheckCircle2,
  Loader2,
  X,
  Wifi,
  WifiOff,
  RefreshCw
} from 'lucide-react';
import { GlassCard } from '@/components/oasis/glass-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useInventory, useCreateSale, useValidatePrescription, getHookErrorMessage } from '@/hooks/use-api';
import { formatCurrency } from '@/utils/helpers';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { ReceiptModal } from './receipt-modal';
import { 
  cacheInventory, 
  getCachedInventory, 
  queueOfflineSale,
  getPendingSalesCount
} from '@/lib/offline-store';
import { syncManager } from '@/lib/sync-manager';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  stock: number;
}

export function PharmacyPOS({ pharmacyId }: { pharmacyId: string }) {
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [qrMode, setQrMode] = useState(false);
  const [qrValue, setQrValue] = useState('');
  const [isPrescriptionApplied, setIsPrescriptionApplied] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [lastSale, setLastSale] = useState<any>(null);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [paymentsList, setPaymentsList] = useState<Array<{ method: string; amount: number; transaction_id?: string }>>([]);

  const [isOnline, setIsOnline] = useState(true);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [offlineInventory, setOfflineInventory] = useState<any[]>([]);

  const createSale = useCreateSale();
  const validatePrescription = useValidatePrescription();

  // Fetch inventory
  const { data: inventoryData, isLoading: isLoadingInventory, refetch: refetchInventory } = useInventory(
    pharmacyId,
    { search: '' }, // Fetch all initially to match prescription items
    !!pharmacyId
  );

  const inventory = inventoryData?.data || [];

  // Connectivity and background synchronization
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
      
      const handleOnline = () => {
        setIsOnline(true);
        toast.success('📶 Conexión restablecida. Sincronizando ventas...');
        syncManager.syncPendingSales();
      };
      
      const handleOffline = () => {
        setIsOnline(false);
        toast.warning('📶 Conexión perdida. Cambiado a modo offline.');
      };

      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      const unsubscribe = syncManager.subscribe((event) => {
        if (event.type === 'status-changed') {
          setPendingSyncCount(event.pendingCount);
        } else if (event.type === 'sale-synced') {
          toast.success(`✅ Venta offline sincronizada con éxito`);
        } else if (event.type === 'sale-failed') {
          toast.error(`❌ Error al sincronizar venta offline: ${event.error}`);
        } else if (event.type === 'sync-finished') {
          if (event.totalSynced > 0) {
            toast.success(`🎉 Sincronización completada: ${event.totalSynced} ventas procesadas.`);
            refetchInventory();
          }
        }
      });

      // Load cached inventory on initial load (fallback)
      getCachedInventory(pharmacyId).then(cached => {
        if (cached) {
          setOfflineInventory(cached);
        }
      });

      // Trigger automatic sync if online on mount
      if (navigator.onLine) {
        syncManager.syncPendingSales();
      }

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        unsubscribe();
      };
    }
  }, [pharmacyId, refetchInventory]);

  // Save new inventory catalog to local IndexedDB whenever retrieved online
  useEffect(() => {
    if (inventoryData?.data && isOnline) {
      cacheInventory(pharmacyId, inventoryData.data);
      setOfflineInventory(inventoryData.data);
    }
  }, [inventoryData, pharmacyId, isOnline]);

  const activeInventory = isOnline ? inventory : offlineInventory;

  // Locally filter inventory to enable instant offline search capability
  const filteredInventory = activeInventory.filter((item: any) => {
    const medicineName = (item.medicine?.name || item.name || '').toLowerCase();
    const genericName = (item.medicine?.genericName || item.genericName || '').toLowerCase();
    const query = search.toLowerCase();
    return medicineName.includes(query) || genericName.includes(query);
  });

  const addToCart = (item: any) => {
    // Standardize field names from inventory mapping
    const medicineId = item.medicineId || item.medicine_id || item.id;
    const medicineName = item.medicine?.name || item.name;
    const unitPrice = item.unitPrice || item.price || 0;
    const stock = item.quantity || item.stock || 0;

    const existing = cart.find(i => i.id === medicineId);
    if (existing) {
      if (existing.quantity >= stock) {
        toast.error('Stock máximo alcanzado');
        return;
      }
      setCart(cart.map(i => i.id === medicineId ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setCart([...cart, { 
        id: medicineId, 
        name: medicineName, 
        price: unitPrice, 
        quantity: 1, 
        stock: stock 
      }]);
    }
    toast.success(`${medicineName} añadido`);
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(i => i.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, Math.min(item.stock, item.quantity + delta));
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const handleCheckout = async (finalPayments: typeof paymentsList) => {
    if (cart.length === 0) return;
    
    setIsProcessing(true);
    const salePayload = {
      items: cart.map((item) => ({ 
        medicine_id: item.id, 
        quantity: item.quantity,
        unit_price: item.price
      })),
      prescription_id: isPrescriptionApplied ? qrValue : undefined,
      is_delivery: false,
      notes: guestName ? `Cliente: ${guestName}` : undefined,
      payments: finalPayments,
    };

    if (!isOnline) {
      try {
        await queueOfflineSale(pharmacyId, salePayload);
        toast.success('📶 Venta guardada localmente (Modo Offline). Se sincronizará automáticamente al recuperar la conexión.');
        
        // Reset POS fields
        setCart([]);
        setGuestName('');
        setQrValue('');
        setIsPrescriptionApplied(false);
        setCheckoutModalOpen(false);
        
        // Deduct quantity locally so inventory levels reflect the offline sale immediately
        const updatedOfflineInv = offlineInventory.map((invItem: any) => {
          const cartItem = cart.find(c => c.id === (invItem.medicineId || invItem.medicine_id || invItem.id));
          if (cartItem) {
            return {
              ...invItem,
              quantity: Math.max(0, invItem.quantity - cartItem.quantity)
            };
          }
          return invItem;
        });
        
        setOfflineInventory(updatedOfflineInv);
        await cacheInventory(pharmacyId, updatedOfflineInv);
        
        const count = await getPendingSalesCount();
        setPendingSyncCount(count);
      } catch (err) {
        toast.error('Error al registrar la venta offline');
        console.error('Offline Checkout Error:', err);
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    try {
      const result = await createSale.mutateAsync({
        pharmacyId: pharmacyId,
        data: salePayload,
      });

      if (result) {
        setLastSale(result);
        setReceiptOpen(true);
        toast.success('Venta completada con éxito');
        setCart([]);
        setGuestName('');
        setQrValue('');
        setIsPrescriptionApplied(false);
        setCheckoutModalOpen(false);
        refetchInventory();
      }
    } catch (error: any) {
      const msg = getHookErrorMessage(error);
      toast.error(msg || 'Error al procesar la venta');
      console.error('Checkout Error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const applyPrescription = async () => {
    if (!qrValue.trim()) {
      toast.error('Ingresa un código de receta');
      return;
    }

    try {
      const prescription = await validatePrescription.mutateAsync({ qr_data: qrValue.trim() });
      
      if (prescription) {
        setIsPrescriptionApplied(true);
        setQrMode(false);
        setQrValue(prescription.id); // Guardar el ID limpio de la receta en lugar de la URL escaneada
        
        // Auto-fill cart with items from prescription
        const newCartItems: CartItem[] = [];
        
        for (const line of prescription.lines || []) {
          // Find item in inventory
          const invItem = activeInventory.find((inv: any) => inv.medicineId === line.medicine_id);
          
          if (invItem) {
            newCartItems.push({
              id: line.medicine_id,
              name: line.medicine?.name || 'Medicamento',
              price: invItem.unitPrice,
              quantity: line.quantity - (line.quantity_fulfilled || 0),
              stock: invItem.quantity
            });
          } else {
            toast.warning(`Medicamento ${line.medicine?.name} no está disponible en esta farmacia`);
          }
        }

        if (newCartItems.length > 0) {
          setCart(newCartItems);
          toast.success(`Receta vinculada: ${newCartItems.length} medicamentos añadidos`);
        } else {
          toast.info('Receta vinculada, pero no hay medicamentos disponibles');
        }
        
        // Set guest name to patient name
        if (prescription.patient?.name) {
          setGuestName(prescription.patient.name);
        }
      }
    } catch (err) {
      toast.error('Receta no encontrada o inválida');
    }
  };

  return (
    <div className="grid grid-cols-12 gap-6 h-[calc(100vh-12rem)]">
      {/* Left: Inventory Search */}
      <div className="col-span-12 lg:col-span-8 flex flex-col gap-4">
        <GlassCard className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
              <Input 
                placeholder="Buscar medicamento en inventario..." 
                className="pl-10 h-12 text-lg bg-white/50 dark:bg-black/20"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            {/* Connection Status Badge */}
            <div className="flex items-center gap-2">
              {!isOnline ? (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 px-4 py-2 rounded-2xl text-red-500 text-xs font-bold shadow-lg animate-pulse">
                  <WifiOff className="size-4" />
                  <span>Modo Offline ({pendingSyncCount} pendientes)</span>
                </div>
              ) : pendingSyncCount > 0 ? (
                <button 
                  onClick={() => syncManager.syncPendingSales()}
                  className="flex items-center gap-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-4 py-2 rounded-2xl text-amber-500 text-xs font-bold shadow-lg transition-all"
                >
                  <RefreshCw className="size-4 animate-spin" />
                  <span>Sincronizando {pendingSyncCount} ventas...</span>
                </button>
              ) : (
                <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-4 py-2 rounded-2xl text-emerald-500 text-xs font-bold shadow-lg">
                  <Wifi className="size-4" />
                  <span>En Línea</span>
                </div>
              )}
            </div>
          </div>
        </GlassCard>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isLoadingInventory && isOnline ? (
              Array(6).fill(0).map((_, i) => (
                <GlassCard key={i} className="p-4 animate-pulse h-32">
                  <div className="h-full w-full bg-gray-200/20 rounded-xl" />
                </GlassCard>
              ))
            ) : filteredInventory.length > 0 ? (
              filteredInventory.map((item: any, index: number) => (
                <motion.div
                  key={item.id || `inv-${index}`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <GlassCard className="p-4 flex justify-between items-start cursor-pointer hover:border-emerald-500/50 transition-colors" onClick={() => addToCart(item)}>
                    <div className="flex gap-4">
                      <div className="size-12 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600">
                        <Package className="size-6" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white">{item.medicine.name}</h4>
                        <p className="text-sm text-gray-500">{item.medicine.genericName}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <span className={cn(
                            "text-xs px-2 py-0.5 rounded-full",
                            item.quantity > 10 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                          )}>
                            Stock: {item.quantity}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-emerald-600">{formatCurrency(item.unitPrice)}</p>
                      <Button size="icon" variant="ghost" className="mt-2 rounded-full hover:bg-emerald-500 hover:text-white">
                        <Plus className="size-5" />
                      </Button>
                    </div>
                  </GlassCard>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full py-20 text-center">
                <Package className="size-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">No se encontraron productos</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right: Cart & Checkout */}
      <div className="col-span-12 lg:col-span-4 flex flex-col gap-4">
        <GlassCard className="flex-1 flex flex-col p-6 overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <ShoppingCart className="size-6 text-emerald-600" />
              <h3 className="text-xl font-bold">Carrito</h3>
            </div>
            <span className="text-sm font-medium bg-gray-100 px-3 py-1 rounded-full">
              {cart.length} productos
            </span>
          </div>

          <div className="mb-4">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 block">Nombre del Cliente (Opcional)</label>
            <Input 
              placeholder="Ej: Juan Pérez (Cliente Físico)" 
              className="h-9 text-xs rounded-xl"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
            />
          </div>

          <div className="flex-1 overflow-y-auto mb-6 pr-2 custom-scrollbar">
            <AnimatePresence initial={false}>
              {cart.map((item, index) => (
                <motion.div
                  key={item.id || `cart-${index}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex items-center justify-between py-4 border-b border-gray-100 dark:border-white/5 last:border-0"
                >
                  <div className="flex-1">
                    <h5 className="font-medium text-sm">{item.name}</h5>
                    <p className="text-xs text-gray-500">{formatCurrency(item.price)} c/u</p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex items-center bg-gray-100 dark:bg-white/5 rounded-lg px-2">
                      <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:text-emerald-600">
                        <Minus className="size-3" />
                      </button>
                      <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:text-emerald-600">
                        <Plus className="size-3" />
                      </button>
                    </div>
                    <button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-600">
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {cart.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center opacity-50 py-10">
                <ShoppingCart className="size-12 mb-2" />
                <p className="text-sm">Carrito vacío</p>
              </div>
            )}
          </div>

          <div className="space-y-4 pt-6 border-t dark:border-white/10">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Subtotal</span>
              <span>{formatCurrency(total)}</span>
            </div>
            
            {/* Prescription Button */}
            <Button 
              variant="outline" 
              className={cn(
                "w-full gap-2 border-dashed",
                isPrescriptionApplied && "bg-blue-50 border-blue-500 text-blue-700"
              )}
              onClick={() => setQrMode(true)}
            >
              {isPrescriptionApplied ? <CheckCircle2 className="size-4" /> : <QrCode className="size-4" />}
              {isPrescriptionApplied ? "Receta Vinculada" : "Vincular Receta QR"}
            </Button>

            <div className="flex items-center justify-between text-2xl font-bold text-emerald-600 pt-2">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>

            <Button 
              className="w-full h-14 text-lg font-bold bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-500/20"
              disabled={cart.length === 0 || isProcessing}
              onClick={() => {
                setPaymentsList([{ method: 'cash', amount: total }]);
                setCheckoutModalOpen(true);
              }}
            >
              {isProcessing ? <Loader2 className="size-6 animate-spin" /> : <Receipt className="size-6 mr-2" />}
              PROCESAR VENTA
            </Button>
          </div>
        </GlassCard>
      </div>

      {/* QR Modal */}
      <AnimatePresence>
        {qrMode && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              key="qr-modal-overlay"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-900 rounded-3xl p-8 max-w-sm w-full shadow-2xl"
            >
              <div className="text-center mb-6">
                <div className="size-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600 mx-auto mb-4">
                  <QrCode className="size-10" />
                </div>
                <h3 className="text-xl font-bold">Vincular Receta</h3>
                <p className="text-sm text-gray-500 mt-2">Ingresa el código de la receta o escanea el QR del paciente.</p>
              </div>

              <Input 
                placeholder="Código de receta (OASIS-XXXX)" 
                className="text-center text-lg h-12 mb-4"
                value={qrValue}
                onChange={(e) => setQrValue(e.target.value)}
              />

              <div className="flex gap-3">
                <Button variant="ghost" className="flex-1" onClick={() => setQrMode(false)}>Cancelar</Button>
                <Button className="flex-1 bg-blue-600 hover:bg-blue-700" onClick={applyPrescription}>Vincular</Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Checkout Split Payment Modal */}
      <AnimatePresence>
        {checkoutModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-6 max-w-lg w-full shadow-2xl relative overflow-hidden"
            >
              {/* Decorative Glow */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
              
              <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <Receipt className="size-6 text-emerald-500" />
                  <h3 className="text-xl font-bold tracking-tight">Cobro y Métodos de Pago</h3>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="rounded-full size-8 text-gray-400 hover:text-white hover:bg-white/10" 
                  onClick={() => setCheckoutModalOpen(false)}
                >
                  <X className="size-4" />
                </Button>
              </div>

              {/* Summary */}
              <div className="grid grid-cols-2 gap-4 mb-6 bg-white/5 border border-white/10 rounded-2xl p-4">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total a Pagar</p>
                  <p className="text-2xl font-black text-emerald-400">{formatCurrency(total)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Registrado</p>
                  <p className="text-2xl font-black text-white">
                    {formatCurrency(paymentsList.reduce((acc, p) => acc + p.amount, 0))}
                  </p>
                </div>
              </div>

              {/* Payments List */}
              <div className="space-y-4 max-h-[220px] overflow-y-auto pr-1 mb-6 custom-scrollbar">
                {paymentsList.map((pay, idx) => (
                  <div key={idx} className="flex flex-col gap-2 p-3 bg-white/5 border border-white/5 rounded-xl">
                    <div className="flex items-center gap-2">
                      <select
                        value={pay.method}
                        onChange={(e) => {
                          const newList = [...paymentsList];
                          newList[idx].method = e.target.value;
                          setPaymentsList(newList);
                        }}
                        className="bg-slate-800 border border-slate-700 text-white rounded-lg text-xs px-2 py-1.5 font-bold focus:outline-none cursor-pointer flex-1"
                      >
                        <option value="cash">Efectivo (NIO)</option>
                        <option value="card">Tarjeta de Crédito/Débito</option>
                        <option value="bank_transfer">Transferencia Bancaria</option>
                        <option value="wallet">Sinpe / Billetera Digital</option>
                      </select>

                      <Input
                        type="number"
                        placeholder="Monto"
                        value={pay.amount || ''}
                        onChange={(e) => {
                          const newList = [...paymentsList];
                          newList[idx].amount = parseFloat(e.target.value) || 0;
                          setPaymentsList(newList);
                        }}
                        className="w-28 h-8 text-right bg-slate-850 border-slate-700 text-xs font-bold"
                      />

                      {paymentsList.length > 1 && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="size-8 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-500/10"
                          onClick={() => setPaymentsList(paymentsList.filter((_, i) => i !== idx))}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      )}
                    </div>

                    {pay.method !== 'cash' && (
                      <Input
                        placeholder="ID de Transacción / Referencia (Opcional)"
                        value={pay.transaction_id || ''}
                        onChange={(e) => {
                          const newList = [...paymentsList];
                          newList[idx].transaction_id = e.target.value;
                          setPaymentsList(newList);
                        }}
                        className="h-7 text-[10px] bg-slate-850 border-slate-700"
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Actions & Real-Time Remaining Balance */}
              <div className="flex items-center justify-between mb-6">
                {(() => {
                  const paid = paymentsList.reduce((acc, p) => acc + p.amount, 0);
                  const diff = total - paid;
                  
                  if (diff > 0) {
                    return (
                      <>
                        <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                          <AlertCircle className="size-4 animate-pulse" />
                          Falta: {formatCurrency(diff)}
                        </span>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 text-[10px] font-black border-dashed border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                          onClick={() => setPaymentsList([...paymentsList, { method: 'cash', amount: diff }])}
                        >
                          + Añadir Pago
                        </Button>
                      </>
                    );
                  } else {
                    return (
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="size-4" />
                        {diff < 0 ? `Cambio (vuelto): ${formatCurrency(Math.abs(diff))}` : 'Monto cubierto'}
                      </span>
                    );
                  }
                })()}
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="ghost" 
                  className="flex-1 text-gray-400 hover:text-white" 
                  onClick={() => setCheckoutModalOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 font-bold"
                  disabled={paymentsList.reduce((acc, p) => acc + p.amount, 0) < total || isProcessing}
                  onClick={() => handleCheckout(paymentsList)}
                >
                  {isProcessing ? <Loader2 className="size-4 animate-spin mr-1" /> : null}
                  Confirmar Cobro
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Receipt Modal */}
      <ReceiptModal 
        isOpen={receiptOpen} 
        onClose={() => setReceiptOpen(false)} 
        sale={lastSale} 
      />
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
