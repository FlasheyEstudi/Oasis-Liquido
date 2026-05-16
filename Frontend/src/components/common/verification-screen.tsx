'use client';

import { useState, useEffect } from 'react';
import { getApiUrl } from '@/api/client';
import { GlassCard } from '@/components/oasis/glass-card';
import { Button } from '@/components/ui/button';
import { formatCurrency, formatDate } from '@/utils/helpers';
import { 
  CheckCircle2, 
  Clock, 
  User, 
  Building2, 
  Pill, 
  Receipt, 
  Stethoscope, 
  MapPin, 
  AlertCircle,
  Loader2,
  ArrowRight
} from 'lucide-react';
import { motion } from 'framer-motion';

interface VerificationData {
  type: 'sale' | 'prescription';
  id: string;
  [key: string]: any;
}

export function VerificationScreen({ type, id }: { type: 'sale' | 'prescription'; id: string }) {
  const [data, setData] = useState<VerificationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch(`${getApiUrl()}/public/verify/${type}/${id}`);
        const json = await response.json();
        if (json.success) {
          setData(json.data);
        } else {
          setError(json.error || 'No se encontró la información');
        }
      } catch (err) {
        setError('Error al conectar con el servidor');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [type, id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="size-12 text-teal-600 animate-spin mb-4" />
        <p className="text-muted-foreground animate-pulse">Verificando autenticidad...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
        <div className="size-20 bg-red-100 rounded-full flex items-center justify-center text-red-600 mb-6">
          <AlertCircle className="size-10" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Error de Verificación</h2>
        <p className="text-muted-foreground mb-8">{error}</p>
        <Button onClick={() => window.location.href = '/'} className="rounded-full">
          Volver al inicio
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="size-20 bg-teal-500/10 rounded-3xl flex items-center justify-center text-teal-600 mx-auto mb-4 border border-teal-500/20">
          <CheckCircle2 className="size-10" />
        </div>
        <h2 className="text-3xl font-black text-foreground">Documento Verificado</h2>
        <p className="text-sm text-muted-foreground mt-2 font-medium">Este es un documento oficial emitido por Oasis Aura</p>
      </motion.div>

      {data.type === 'sale' ? (
        <div className="space-y-6">
          <GlassCard className="p-8 border-t-4 border-teal-500">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="text-xl font-bold">Resumen de Venta</h3>
                <p className="text-xs text-muted-foreground font-mono">ID: #{data.id.toUpperCase()}</p>
              </div>
              <Receipt className="size-8 text-teal-600/50" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <User className="size-5 text-teal-600" />
                  <div>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Cliente</p>
                    <p className="text-sm font-semibold">{data.customerName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Building2 className="size-5 text-teal-600" />
                  <div>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Establecimiento</p>
                    <p className="text-sm font-semibold">{data.pharmacyName}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Clock className="size-5 text-teal-600" />
                  <div>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Fecha y Hora</p>
                    <p className="text-sm font-semibold">{formatDate(data.date, 'dd/MM/yyyy HH:mm')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <User className="size-5 text-teal-600" />
                  <div>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Atendido por</p>
                    <p className="text-sm font-semibold">{data.attendant}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-dashed border-zinc-200 dark:border-zinc-800 py-6">
              <p className="text-xs font-bold uppercase text-muted-foreground mb-4">Productos</p>
              <div className="space-y-3">
                {data.items.map((item: any, i: number) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span>{item.name} <span className="text-muted-foreground font-normal">x{item.quantity}</span></span>
                    <span className="font-mono font-bold">{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t-2 border-zinc-900 dark:border-white pt-6 flex justify-between items-center">
              <span className="text-lg font-bold">TOTAL PAGADO</span>
              <span className="text-3xl font-black text-teal-600">{formatCurrency(data.total)}</span>
            </div>
          </GlassCard>

          {data.prescription && (
            <GlassCard className="p-8 bg-sky-500/5 border-l-4 border-sky-500">
              <div className="flex items-center gap-3 mb-4">
                <Stethoscope className="size-6 text-sky-600" />
                <h3 className="text-lg font-bold">Información de Receta</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">Médico</p>
                  <p className="font-semibold">{data.prescription.doctor}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">Clínica</p>
                  <p className="font-semibold">{data.prescription.clinic}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">Fecha de Emisión</p>
                  <p className="font-semibold">{formatDate(data.prescription.date, 'dd/MM/yyyy')}</p>
                </div>
              </div>
            </GlassCard>
          )}
        </div>
      ) : (
        /* Prescription Verification View */
        <div className="space-y-6">
          <GlassCard className="p-8 border-t-4 border-sky-500">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="text-xl font-bold">Receta Digital</h3>
                <p className="text-xs text-muted-foreground font-mono">ID: #{data.id.toUpperCase()}</p>
              </div>
              <Stethoscope className="size-8 text-sky-600/50" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 border-b border-dashed border-zinc-200 dark:border-zinc-800 pb-8">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <User className="size-5 text-sky-600" />
                  <div>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Paciente</p>
                    <p className="text-sm font-semibold">{data.patientName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Stethoscope className="size-5 text-sky-600" />
                  <div>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Médico Emisor</p>
                    <p className="text-sm font-semibold">{data.doctorName}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Building2 className="size-5 text-sky-600" />
                  <div>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Clínica</p>
                    <p className="text-sm font-semibold">{data.clinicName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="size-5 text-sky-600" />
                  <div>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Fecha Emisión</p>
                    <p className="text-sm font-semibold">{formatDate(data.date, 'dd/MM/yyyy')}</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs font-bold uppercase text-muted-foreground mb-4">Medicamentos Recetados</p>
              <div className="space-y-4">
                {data.items.map((item: any, i: number) => (
                  <div key={i} className="flex gap-4 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    <div className="size-10 bg-sky-100 dark:bg-sky-900/30 rounded-xl flex items-center justify-center text-sky-600">
                      <Pill className="size-6" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold">{item.name} <span className="text-muted-foreground font-normal">({item.quantity} uds)</span></p>
                      <p className="text-xs text-muted-foreground mt-1">{item.instructions}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>

          <div className="space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2 px-2">
              <MapPin className="size-5 text-teal-600" />
              Farmacias con Disponibilidad
            </h3>
            {data.pharmacies.length > 0 ? (
              data.pharmacies.map((pharm: any) => (
                <GlassCard key={pharm.id} className="p-6 hover:border-teal-500/50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-teal-600">{pharm.name}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{pharm.address}</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {data.items.map((item: any) => {
                          const stock = pharm.stock.find((s: any) => s.medicineId === item.medicineId)?.quantity || 0;
                          return (
                            <span key={item.medicineId} className={cn(
                              "text-[10px] px-2 py-1 rounded-full font-bold uppercase",
                              stock >= item.quantity ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                            )}>
                              {item.name}: {stock >= item.quantity ? 'DISPONIBLE' : `SOLO ${stock} UDS`}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="rounded-full gap-2 text-[10px] font-bold">
                      VER EN MAPA <ArrowRight className="size-3" />
                    </Button>
                  </div>
                </GlassCard>
              ))
            ) : (
              <GlassCard className="p-8 text-center text-muted-foreground">
                <AlertCircle className="size-8 mx-auto mb-2 opacity-30" />
                No se encontraron farmacias con stock en este momento.
              </GlassCard>
            )}
          </div>
        </div>
      )}
      
      <div className="pt-8 text-center">
        <Button 
          variant="ghost" 
          onClick={() => window.location.href = '/'}
          className="text-xs font-bold text-muted-foreground hover:text-teal-600"
        >
          OASIS AURA HEALTH ECOSYSTEM © 2026
        </Button>
      </div>
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
