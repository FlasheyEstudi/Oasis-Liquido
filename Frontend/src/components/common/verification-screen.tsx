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
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { motion } from 'framer-motion';

interface VerificationData {
  type: 'sale' | 'prescription' | 'patient';
  id: string;
  [key: string]: any;
}

export function VerificationScreen({ type, id }: { type: 'sale' | 'prescription' | 'patient'; id: string }) {
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

      {data.type === 'sale' && (
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
      )}

      {data.type === 'prescription' && (
        <div className="space-y-6">
          <GlassCard className="p-6 sm:p-8 border-t-4 border-sky-500 shadow-2xl relative overflow-hidden">
            {/* Watermark/Holographic Seal in Background */}
            <div className="absolute -right-16 -top-16 size-48 rounded-full bg-sky-500/[0.04] border border-sky-500/10 flex items-center justify-center rotate-12 pointer-events-none select-none">
              <span className="text-[10px] font-black text-sky-500/20 tracking-[0.2em] uppercase text-center">
                Oasis Aura<br/>MINSA
              </span>
            </div>

            <div className="flex justify-between items-start mb-6 pb-6 border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 mb-2 border border-emerald-500/20">
                  <CheckCircle2 className="size-3" /> Receta Válida
                </span>
                <h3 className="text-2xl font-black tracking-tight">Receta Médica Digital</h3>
                <p className="text-[10px] text-muted-foreground font-mono mt-1">UUID: {data.id.toUpperCase()}</p>
              </div>
              <div className="size-12 bg-sky-500/10 rounded-2xl flex items-center justify-center text-sky-600 border border-sky-500/20 shrink-0">
                <Stethoscope className="size-6" />
              </div>
            </div>

            {/* Clinician & Clinic Header (Membrete Médico) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8 bg-zinc-50/50 dark:bg-zinc-900/30 p-5 rounded-3xl border border-zinc-100 dark:border-zinc-800">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="size-8 rounded-full bg-sky-500/10 flex items-center justify-center text-sky-600 mt-0.5 border border-sky-500/20">
                    <User className="size-4" />
                  </div>
                  <div>
                    <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">Médico Emisor</p>
                    <p className="text-sm font-extrabold text-foreground">{data.doctorName}</p>
                    <p className="text-[10px] text-sky-600 dark:text-sky-400 font-bold mt-0.5">Medicina General y Familiar</p>
                    <p className="text-[9px] text-muted-foreground font-mono mt-0.5">Lic. MINSA: Reg-#{data.id.slice(0, 5).toUpperCase()}-NI</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="size-8 rounded-full bg-sky-500/10 flex items-center justify-center text-sky-600 mt-0.5 border border-sky-500/20">
                    <User className="size-4" />
                  </div>
                  <div>
                    <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">Paciente</p>
                    <p className="text-sm font-semibold">{data.patientName}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="size-8 rounded-full bg-sky-500/10 flex items-center justify-center text-sky-600 mt-0.5 border border-sky-500/20">
                    <Building2 className="size-4" />
                  </div>
                  <div>
                    <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">Centro de Salud / Clínica</p>
                    <p className="text-sm font-extrabold">{data.clinicName}</p>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                      <MapPin className="size-3 text-red-500/80" /> Managua, Nicaragua
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="size-8 rounded-full bg-sky-500/10 flex items-center justify-center text-sky-600 mt-0.5 border border-sky-500/20">
                    <Clock className="size-4" />
                  </div>
                  <div>
                    <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">Expedición y Validez</p>
                    <p className="text-sm font-semibold">{formatDate(data.date, 'dd/MM/yyyy')}</p>
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">Vence: {formatDate(new Date(new Date(data.date).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(), 'dd/MM/yyyy')}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Prescribed Medicines (Medicamentos Recetados) */}
            <div className="mb-8">
              <p className="text-xs font-black uppercase text-muted-foreground tracking-widest mb-4 px-1 flex items-center gap-1.5">
                <Pill className="size-4 text-sky-500" /> Prescripción Farmacéutica
              </p>
              <div className="space-y-3">
                {data.items.map((item: any, i: number) => (
                  <div key={i} className="flex gap-4 p-4 rounded-3xl bg-zinc-50/80 dark:bg-zinc-900/60 border border-zinc-150 dark:border-zinc-800 transition-all hover:translate-x-1 duration-200">
                    <div className="size-11 bg-sky-500/10 dark:bg-sky-950/30 rounded-2xl flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0 border border-sky-500/20">
                      <Pill className="size-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline gap-2">
                        <p className="text-sm font-black text-foreground truncate">{item.name}</p>
                        <span className="text-[10px] font-extrabold bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 px-2 py-0.5 rounded-full shrink-0">
                          {item.quantity} Uds
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1.5 italic font-medium leading-relaxed">
                        &ldquo;{item.instructions}&rdquo;
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Official Stamps and Digital Signatures (Sello y Firma Digital) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-dashed border-zinc-200 dark:border-zinc-800">
              {/* Sello Holográfico */}
              <div className="flex flex-col items-center justify-center p-5 border border-zinc-200 dark:border-zinc-800 rounded-3xl bg-zinc-50/20 dark:bg-zinc-900/20 text-center relative overflow-hidden select-none">
                <div className="size-16 rounded-full border-4 border-double border-emerald-500/30 dark:border-emerald-400/30 flex items-center justify-center text-emerald-500 dark:text-emerald-400 animate-spin-slow mb-2">
                  <CheckCircle2 className="size-8" />
                </div>
                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                  MINSA NICARAGUA
                </span>
                <span className="text-[8px] text-muted-foreground font-mono mt-1">
                  SELLO ELECTRÓNICO REGISTRADO
                </span>
              </div>

              {/* Firma caligráfica certificada */}
              <div className="flex flex-col justify-center p-5 border border-zinc-200 dark:border-zinc-800 rounded-3xl bg-zinc-50/20 dark:bg-zinc-900/20 text-center relative">
                <p className="text-[8px] uppercase font-bold text-muted-foreground tracking-widest absolute top-3 left-0 right-0 mx-auto">
                  Firma Electrónica Autorizada
                </p>
                <div className="my-3 font-serif italic text-xl text-zinc-700 dark:text-zinc-300 select-none tracking-wider py-2">
                  {data.doctorName}
                </div>
                <div className="h-0.5 w-2/3 bg-zinc-300 dark:bg-zinc-700 mx-auto mb-1" />
                <span className="text-[7px] text-muted-foreground font-mono uppercase tracking-widest">
                  HASH: {data.id.slice(0, 16)}...
                </span>
              </div>
            </div>
          </GlassCard>

          {/* Pharmacies Availability Panel */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2 px-2">
              <MapPin className="size-5 text-teal-600" />
              Surtimiento en Farmacias Oasis Nicaragua
            </h3>
            {data.pharmacies.length > 0 ? (
              data.pharmacies.map((pharm: any) => (
                <GlassCard key={pharm.id} className="p-5 hover:border-teal-500/50 transition-colors">
                  <div className="flex justify-between items-start gap-4">
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-teal-600 text-sm truncate">{pharm.name}</h4>
                      <p className="text-xs text-muted-foreground mt-1 truncate">{pharm.address}</p>
                      <div className="mt-4 flex flex-wrap gap-1.5">
                        {data.items.map((item: any) => {
                          const stock = pharm.stock.find((s: any) => s.medicineId === item.medicineId)?.quantity || 0;
                          return (
                            <span key={item.medicineId} className={cn(
                              "text-[8px] sm:text-[9px] px-2 py-0.5 rounded-full font-extrabold uppercase border",
                              stock >= item.quantity 
                                ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" 
                                : "bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border-red-500/20"
                            )}>
                              {item.name}: {stock >= item.quantity ? 'DISPONIBLE' : `SOLO ${stock} UDS`}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="rounded-full gap-2 text-[9px] font-black shrink-0 border-teal-500/20 text-teal-600 hover:bg-teal-500/5">
                      MAPA <ArrowRight className="size-3" />
                    </Button>
                  </div>
                </GlassCard>
              ))
            ) : (
              <GlassCard className="p-8 text-center text-muted-foreground border-dashed border-2">
                <AlertCircle className="size-8 mx-auto mb-2 opacity-30 animate-pulse text-red-500" />
                No se encontraron farmacias con stock en este momento.
              </GlassCard>
            )}
          </div>
        </div>
      )}

      {data.type === 'patient' && (
        <div className="space-y-6">
          <GlassCard className="p-8 border-t-4 border-teal-500 overflow-hidden relative">
            {/* Watermark */}
            <div className="absolute -right-16 -top-16 size-44 rounded-full bg-teal-500/[0.02] border border-teal-500/10 flex items-center justify-center rotate-12 pointer-events-none select-none">
              <span className="text-[8px] font-black text-teal-500/20 tracking-[0.2em] uppercase text-center leading-normal">
                Pasaporte<br/>Digital
              </span>
            </div>

            <div className="flex justify-between items-start mb-8 pb-4 border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <h3 className="text-xl font-black text-foreground uppercase tracking-tight">Expediente Clínico Verificado</h3>
                <p className="text-xs text-muted-foreground font-mono mt-1">ID Único: #{data.id.toUpperCase()}</p>
              </div>
              <ShieldCheck className="size-8 text-teal-600/50" />
            </div>

            {/* Grid de Información del Paciente */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-2xl bg-teal-500/10 flex items-center justify-center text-teal-600 border border-teal-500/20 shrink-0">
                    <User className="size-5" />
                  </div>
                  <div>
                    <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">Nombre Completo</p>
                    <p className="text-sm font-black text-foreground">{data.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-2xl bg-sky-500/10 flex items-center justify-center text-sky-600 border border-sky-500/20 shrink-0">
                    <Clock className="size-5" />
                  </div>
                  <div>
                    <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">Miembro Desde</p>
                    <p className="text-sm font-semibold text-foreground">{formatDate(data.date, 'dd/MM/yyyy')}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 border border-emerald-500/20 shrink-0">
                    <CheckCircle2 className="size-5" />
                  </div>
                  <div>
                    <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">Estatus del Carnet</p>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 mt-1">
                      ACTIVO / HOMOLOGADO
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-2xl bg-teal-500/10 flex items-center justify-center text-teal-600 border border-teal-500/20 shrink-0">
                    <ShieldCheck className="size-5" />
                  </div>
                  <div>
                    <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">Acreditación Legal</p>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-teal-100 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 border border-teal-500/20 mt-1">
                      VERIFICACIÓN MINSA APROBADA
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Detalles Médicos Cruciales para Emergencias */}
            <div className="border-t border-dashed border-zinc-200 dark:border-zinc-800 py-6 space-y-6">
              <div>
                <p className="text-xs font-black uppercase text-muted-foreground tracking-widest mb-3">Información de Emergencia</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Tipo de Sangre */}
                  <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800">
                    <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">Tipo de Sangre</p>
                    <p className="text-lg font-black text-red-600 dark:text-red-400 mt-1">{data.bloodType}</p>
                  </div>

                  {/* Alergias Registradas */}
                  <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800">
                    <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider mb-1">Alergias Conocidas</p>
                    {data.allergies && data.allergies.length > 0 ? (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {data.allergies.map((allergy: string, i: number) => (
                          <span key={i} className="text-[9px] font-extrabold bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/25 uppercase">
                            {allergy}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic mt-2">Ninguna alergia reportada</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Sello y Firmas del Carnet Digital */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-dashed border-zinc-200 dark:border-zinc-800">
              {/* Sello Holográfico */}
              <div className="flex flex-col items-center justify-center p-5 border border-zinc-200 dark:border-zinc-800 rounded-3xl bg-zinc-50/20 dark:bg-zinc-900/20 text-center relative overflow-hidden select-none">
                <div className="size-16 rounded-full border-4 border-double border-emerald-500/30 dark:border-emerald-400/30 flex items-center justify-center text-emerald-500 dark:text-emerald-400 mb-2 animate-pulse">
                  <ShieldCheck className="size-8" />
                </div>
                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                  OASIS AURA VERIFIED
                </span>
                <span className="text-[8px] text-muted-foreground font-mono mt-1">
                  CARNET HOMOLOGADO MINSA
                </span>
              </div>

              {/* Registro Criptográfico */}
              <div className="flex flex-col justify-center p-5 border border-zinc-200 dark:border-zinc-800 rounded-3xl bg-zinc-50/20 dark:bg-zinc-900/20 text-center relative">
                <p className="text-[8px] uppercase font-bold text-muted-foreground tracking-widest absolute top-3 left-0 right-0 mx-auto">
                  Certificado de Seguridad Digital
                </p>
                <div className="my-4 font-mono text-[10px] text-zinc-700 dark:text-zinc-300 py-2 break-all uppercase font-semibold">
                  SEC-HASH-PAC-{data.id.slice(0, 16)}
                </div>
                <div className="h-0.5 w-2/3 bg-zinc-300 dark:bg-zinc-700 mx-auto mb-1" />
                <span className="text-[7px] text-muted-foreground font-mono uppercase tracking-widest">
                  Validez Criptográfica Permanente
                </span>
              </div>
            </div>
          </GlassCard>
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
