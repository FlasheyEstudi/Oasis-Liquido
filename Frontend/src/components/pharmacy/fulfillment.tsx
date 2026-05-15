'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import {
  useValidatePrescription,
  useFulfillPrescription,
  useInventory,
} from '@/hooks/use-api';
import type { Prescription, InventoryItem } from '@/types';
import { formatDate, formatCurrency } from '@/utils/helpers';
import { PRESCRIPTION_STATUS_CONFIG } from '@/utils/constants';
import { GlassCard } from '@/components/oasis/glass-card';
import { QrScanner } from '@/components/common/qr-scanner';
import { StatusBadge } from '@/components/common/status-badge';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import {
  QrCode as QrCodeIcon,
  ScanLine,
  CheckCircle2,
  AlertCircle,
  Package,
  User,
  Stethoscope,
  Calendar,
  Clock,
  Loader2,
  Pill,
} from 'lucide-react';

interface FulfillLine {
  lineId: string;
  medicineName: string;
  prescribed: number;
  toFulfill: number;
  checked: boolean;
  available: number;
}

type FulfillmentState = 'scanning' | 'validating' | 'showing_prescription' | 'fulfilling' | 'success';

export function Fulfillment() {
  const { user, setNotification } = useAuthStore();
  const pharmacyId = 
    user?.pharmacy_manager_profile?.pharmacy_id || 
    (user as any)?.pharmacyManagerProfile?.pharmacyId || 
    'demo-pharmacy-1';

  // State machine
  const [fulfillmentState, setFulfillmentState] = useState<FulfillmentState>('scanning');
  const [qrData, setQrData] = useState('');
  const [scannerActive, setScannerActive] = useState(true);

  // Prescription state after validation
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [fulfillLines, setFulfillLines] = useState<FulfillLine[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);

  // React Query hooks
  const validatePrescription = useValidatePrescription();
  const fulfillPrescription = useFulfillPrescription();

  const {
    data: inventoryResult,
  } = useInventory(pharmacyId, undefined, !!pharmacyId);

  const inventory = inventoryResult?.data ?? [];
  const isFulfilling = fulfillPrescription.isPending;

  const handleQrScan = (data: string) => {
    setQrData(data);
    setScannerActive(false);
    handleValidate(data);
  };

  const handleQrError = (error: string) => {
    setValidationError(error);
  };

  const handleValidate = async (qrText?: string) => {
    const data = qrText || qrData;
    if (!data.trim()) {
      setNotification({ type: 'error', message: 'Ingresa los datos del QR' });
      return;
    }

    setFulfillmentState('validating');
    setPrescription(null);
    setFulfillLines([]);
    setValidationError(null);

    validatePrescription.mutate(
      { qr_data: data.trim() },
      {
        onSuccess: (presc) => {
          setPrescription(presc);

          // Build inventory map from cached data
          const invMap: Record<string, number> = {};
          inventory.forEach((item: InventoryItem) => {
            invMap[item.medicine.id] = item.stock_quantity;
          });

          // Build fulfill lines
          const lines: FulfillLine[] = (presc.lines || []).map((line) => ({
            lineId: line.id,
            medicineName: line.medicine?.name || 'Medicamento',
            prescribed: line.quantity,
            toFulfill: line.quantity - line.quantity_fulfilled,
            checked: true,
            available: invMap[line.medicine_id] ?? 0,
          }));
          setFulfillLines(lines);
          setFulfillmentState('showing_prescription');
        },
        onError: () => {
          setValidationError('Receta inválida, expirada o ya surtida');
          setFulfillmentState('scanning');
          setNotification({ type: 'error', message: 'Receta inválida o expirada' });
        },
      }
    );
  };

  const handleFulfillLineChange = (index: number, field: 'toFulfill' | 'checked', value: number | boolean) => {
    setFulfillLines((prev) =>
      prev.map((line, i) => (i === index ? { ...line, [field]: value } : line))
    );
  };

  const handleDispense = () => {
    if (!prescription) return;

    const checkedLines = fulfillLines.filter((l) => l.checked && l.toFulfill > 0);
    if (checkedLines.length === 0) {
      setNotification({ type: 'warning', message: 'Selecciona al menos un medicamento para dispensar' });
      return;
    }

    setFulfillmentState('fulfilling');

    fulfillPrescription.mutate(
      {
        id: prescription.id,
        data: {
          pharmacy_id: pharmacyId,
          items: checkedLines.map((l) => ({
            prescription_line_id: l.lineId,
            quantity_fulfilled: l.toFulfill,
          })),
        },
      },
      {
        onSuccess: () => {
          setFulfillmentState('success');
          setNotification({ type: 'success', message: 'Receta dispensada correctamente' });
        },
        onError: () => {
          setFulfillmentState('showing_prescription');
          setNotification({ type: 'error', message: 'Error al dispensar receta' });
        },
      }
    );
  };

  const handleReset = () => {
    setQrData('');
    setPrescription(null);
    setFulfillLines([]);
    setFulfillmentState('scanning');
    setValidationError(null);
    setScannerActive(true);
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto p-4 md:p-6">
      <AnimatePresence mode="wait">
        {/* QR Scanner Section */}
        {fulfillmentState === 'scanning' && (
          <motion.div
            key="scanning"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="space-y-6"
          >
            <GlassCard>
              <div className="flex items-center gap-2 mb-4">
                <ScanLine className="size-5 text-teal-600 dark:text-teal-400" />
                <h3 className="text-base font-semibold text-foreground">Validar Receta por QR</h3>
              </div>

              {/* Camera QR Scanner */}
              <QrScanner
                onScan={handleQrScan}
                onError={handleQrError}
                isActive={scannerActive}
              />

              {/* Divider */}
              <div className="flex items-center gap-3 my-5">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">o ingresa manualmente</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Manual input fallback */}
              <div className="flex gap-2">
                <input
                  placeholder="Pega los datos del QR aquí..."
                  value={qrData}
                  onChange={(e) => setQrData(e.target.value)}
                  className="glass-input rounded-full flex-1 px-4 py-2.5 text-sm font-mono"
                />
                <button
                  onClick={() => handleValidate()}
                  disabled={!qrData.trim() || validatePrescription.isPending}
                  className="glass-btn-primary rounded-full px-5 py-2.5 text-sm font-medium flex items-center gap-2 shrink-0 disabled:opacity-50"
                >
                  {validatePrescription.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    'Validar'
                  )}
                </button>
              </div>

              {/* Validation error */}
              {validationError && (
                <div className="flex items-center gap-2 p-3 rounded-2xl bg-red-500/5 border border-red-500/10 mt-4">
                  <AlertCircle className="size-4 text-red-500 shrink-0" />
                  <p className="text-sm text-red-600 dark:text-red-400">{validationError}</p>
                </div>
              )}
            </GlassCard>
          </motion.div>
        )}

        {/* Validating state */}
        {fulfillmentState === 'validating' && (
          <motion.div
            key="validating"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
          >
            <GlassCard className="flex flex-col items-center justify-center py-16">
              <Loader2 className="size-10 text-teal-600 dark:text-teal-400 animate-spin mb-4" />
              <p className="text-sm text-muted-foreground font-medium">Validando receta...</p>
            </GlassCard>
          </motion.div>
        )}

        {/* Prescription Details after validation */}
        {(fulfillmentState === 'showing_prescription' || fulfillmentState === 'fulfilling') && prescription && (
          <motion.div
            key="prescription"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="space-y-6"
          >
            {/* Prescription Info */}
            <GlassCard>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <QrCodeIcon className="size-5 text-teal-600 dark:text-teal-400" />
                  <h3 className="text-base font-semibold text-foreground">Detalle de Receta</h3>
                </div>
                <StatusBadge status={prescription.status} type="prescription" />
              </div>

              {/* Patient & Doctor Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div className="flex items-start gap-3">
                  <div className="flex size-9 items-center justify-center rounded-full bg-emerald-500/10 shrink-0">
                    <User className="size-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Paciente</p>
                    <p className="text-sm font-semibold text-foreground">{prescription.patient?.name || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="flex size-9 items-center justify-center rounded-full bg-teal-500/10 shrink-0">
                    <Stethoscope className="size-4 text-teal-600 dark:text-teal-400" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Médico</p>
                    <p className="text-sm font-semibold text-foreground">{prescription.doctor?.name || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="size-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Emisión</p>
                    <p className="text-sm font-medium text-foreground">
                      {formatDate(prescription.issue_date, 'dd/MM/yyyy')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="size-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Vencimiento</p>
                    <p className="text-sm font-medium text-foreground">
                      {formatDate(prescription.expiration_date, 'dd/MM/yyyy')}
                    </p>
                  </div>
                </div>
              </div>

              {prescription.notes && (
                <div className="p-3 rounded-2xl glass mt-4">
                  <p className="text-xs text-muted-foreground mb-1">Notas</p>
                  <p className="text-sm text-foreground">{prescription.notes}</p>
                </div>
              )}
            </GlassCard>

            {/* Medicine Items to Dispense */}
            <GlassCard>
              <h3 className="text-base font-semibold text-foreground mb-4">Medicamentos a Dispensar</h3>
              <div className="space-y-3">
                {fulfillLines.map((line, index) => {
                  const hasStock = line.available >= line.toFulfill;
                  return (
                    <div
                      key={line.lineId}
                      className="p-4 rounded-2xl glass"
                    >
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => handleFulfillLineChange(index, 'checked', !line.checked)}
                          className={cn(
                            'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border transition-all',
                            line.checked
                              ? 'bg-teal-600 border-teal-600 text-white'
                              : 'border-muted-foreground/30 bg-transparent'
                          )}
                        >
                          {line.checked && <CheckCircle2 className="size-3.5" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Pill className="size-4 text-teal-600 dark:text-teal-400 shrink-0" />
                            <p className="text-sm font-semibold text-foreground">{line.medicineName}</p>
                            {!hasStock && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full border border-red-500/20 text-red-600 dark:text-red-400 bg-red-500/10 font-medium">
                                Stock insuficiente
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                            <span>Recetado: {line.prescribed}</span>
                            <span>Disponible: <span className={hasStock ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-red-600 dark:text-red-400 font-medium'}>{line.available}</span></span>
                          </div>
                          <div className="flex items-center gap-3">
                            <label className="text-xs text-muted-foreground whitespace-nowrap">
                              Cantidad a dispensar:
                            </label>
                            <input
                              type="number"
                              min={0}
                              max={Math.min(line.prescribed, line.available)}
                              value={line.toFulfill}
                              onChange={(e) =>
                                handleFulfillLineChange(
                                  index,
                                  'toFulfill',
                                  parseInt(e.target.value) || 0
                                )
                              }
                              disabled={!line.checked}
                              className="glass-input rounded-xl w-24 px-3 py-1.5 text-sm text-center disabled:opacity-50"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </GlassCard>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleDispense}
                disabled={isFulfilling}
                className="glass-btn-primary rounded-full flex-1 h-12 text-base font-medium flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isFulfilling ? (
                  <>
                    <Loader2 className="size-5 animate-spin" />
                    Dispensando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="size-5" />
                    Dispensar Receta
                  </>
                )}
              </button>
              <button
                onClick={handleReset}
                disabled={isFulfilling}
                className="glass-btn-secondary rounded-full px-5 py-2.5 text-sm font-medium disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
          </motion.div>
        )}

        {/* Success State */}
        {fulfillmentState === 'success' && prescription && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <GlassCard className="text-center py-10">
              <div className="flex size-16 items-center justify-center rounded-full bg-emerald-500/10 mx-auto mb-4">
                <CheckCircle2 className="size-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">
                Receta dispensada exitosamente
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                La receta de {prescription.patient?.name} ha sido dispensada correctamente.
              </p>
              <div className="flex items-center justify-center gap-3">
                <button onClick={handleReset} className="glass-btn-primary rounded-full px-5 py-2.5 text-sm font-medium flex items-center gap-2">
                  <ScanLine className="size-4" />
                  Escanear otra receta
                </button>
                <button onClick={handleReset} className="glass-btn-secondary rounded-full px-5 py-2.5 text-sm font-medium">
                  Volver
                </button>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
