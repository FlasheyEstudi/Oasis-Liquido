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
  type: 'sale' | 'prescription' | 'patient' | 'pharmacy' | 'doctor' | 'delivery';
  id: string;
  [key: string]: any;
}

function parseAllergies(allergies: any): string[] {
  if (!allergies) return [];
  if (Array.isArray(allergies)) return allergies;
  if (typeof allergies === 'string') {
    const trimmed = allergies.trim();
    if (!trimmed || trimmed.toLowerCase() === 'ninguna' || trimmed.toLowerCase() === 'ninguno') return [];
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    if (trimmed.includes(',')) {
      return trimmed.split(',').map(s => s.trim()).filter(Boolean);
    }
    return [trimmed];
  }
  return [];
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
          setError(
            typeof json.error === 'object' && json.error?.message 
              ? json.error.message 
              : typeof json.error === 'string' 
                ? json.error 
                : 'No se encontró la información'
          );
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

      {(data.type === 'patient' || data.type === 'pharmacy' || data.type === 'doctor' || data.type === 'delivery') && (
        <div className="space-y-8 max-w-lg mx-auto">
          {/* Título de Credencial según el Rol de Usuario */}
          <div className="text-center">
            <h4 className="text-xs font-black uppercase tracking-widest text-teal-500 font-mono mb-2">
              {data.type === 'pharmacy' && 'Credencial Farmacéutica de Oasis'}
              {data.type === 'doctor' && 'Credencial Médica Homologada'}
              {data.type === 'delivery' && 'Acreditación Logística Certificada'}
              {data.type === 'patient' && 'Identidad Digital de Salud'}
            </h4>
          </div>

          {/* Tarjeta de Identidad Digital Interactiva (Efecto Tarjeta Física Premium) */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 100, damping: 15 }}
            className={cn(
              "relative w-full aspect-[1.586/1] rounded-[1.8rem] overflow-hidden text-white shadow-[0_30px_70px_rgba(0,0,0,0.7)] border group backdrop-blur-md bg-zinc-950/40",
              data.type === 'pharmacy' && "border-emerald-500/20",
              data.type === 'doctor' && "border-sky-500/20",
              data.type === 'delivery' && "border-amber-500/20",
              data.type === 'patient' && "border-teal-500/20"
            )}
          >
            {/* Fondo Base con Gradiente Satinado y Profundo según rol */}
            {data.type === 'pharmacy' && <div className="absolute inset-0 bg-gradient-to-tr from-zinc-950 via-emerald-950/60 to-zinc-950" />}
            {data.type === 'doctor' && <div className="absolute inset-0 bg-gradient-to-tr from-zinc-950 via-sky-950/60 to-zinc-950" />}
            {data.type === 'delivery' && <div className="absolute inset-0 bg-gradient-to-tr from-zinc-950 via-amber-950/60 to-zinc-950" />}
            {data.type === 'patient' && <div className="absolute inset-0 bg-gradient-to-tr from-zinc-950 via-teal-950/70 to-zinc-950" />}

            {/* Capa de Brillo Holográfico y Destellos Reactivos */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(20,184,166,0.15),transparent)] pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/5 via-purple-500/5 to-emerald-500/5 opacity-40 mix-blend-overlay pointer-events-none" />
            
            {data.type === 'pharmacy' && <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />}
            {data.type === 'doctor' && <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-sky-500/30 to-transparent" />}
            {data.type === 'delivery' && <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />}
            {data.type === 'patient' && <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-teal-500/30 to-transparent" />}

            {/* Marca de Agua Texturizada MINSA en el fondo */}
            <div className="absolute -right-16 -bottom-16 size-56 rounded-full border border-white/[0.02] bg-white/[0.002] flex items-center justify-center rotate-12 pointer-events-none select-none">
              <span className="text-[8px] font-black text-white/[0.04] tracking-[0.3em] uppercase text-center leading-normal">
                REPÚBLICA DE NICARAGUA<br/>MINISTERIO DE SALUD
              </span>
            </div>

            {/* Contenido Principal de la Tarjeta */}
            <div className="absolute inset-0 p-5 sm:p-7 md:p-8 flex flex-col justify-between z-10 select-none">
              {/* Header: Oasis Logo y Acreditación Oficial */}
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <div className="flex items-center gap-3">
                  {/* Chip Inteligente Simulado */}
                  <div className="w-8 h-6 sm:w-10 sm:h-7 bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-600 rounded-[4px] border border-amber-400/30 relative shadow-md overflow-hidden flex flex-col justify-between p-0.5 opacity-95 shrink-0">
                    <div className="grid grid-cols-3 gap-[1px] h-full w-full opacity-60">
                      <div className="border-r border-amber-950/20 border-b" />
                      <div className="border-r border-amber-950/20 border-b" />
                      <div className="border-b" />
                      <div className="border-r border-amber-950/20" />
                      <div className="border-r border-amber-950/20" />
                      <div className="border-none" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg md:text-xl font-black tracking-[0.15em] text-teal-300 uppercase flex items-center gap-1.5 leading-none">
                      OASIS LÍQUIDA
                    </h3>
                    <p className="text-[6px] sm:text-[7px] text-teal-400/60 font-mono tracking-widest uppercase mt-1">
                      {data.type === 'pharmacy' && 'FARMACIA CONVENIADA'}
                      {data.type === 'doctor' && 'MÉDICO COLEGIADO'}
                      {data.type === 'delivery' && 'LOGÍSTICA / LOGISTICS'}
                      {data.type === 'patient' && 'PASAPORTE DIGITAL DE SALUD'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[7px] sm:text-[8px] font-black tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase shadow-[0_0_15px_rgba(16,185,129,0.05)]">
                    {data.type === 'pharmacy' && 'MINSA AUTORIZADO'}
                    {data.type === 'doctor' && 'MINSA CERTIFICADO'}
                    {data.type === 'delivery' && 'MINSA AUTORIZADO'}
                    {data.type === 'patient' && 'MINSA ACREDITADO'}
                  </span>
                </div>
              </div>

              {/* Centro de la Tarjeta: Layout Realista de Carnet */}
              <div className="grid grid-cols-12 gap-4 items-center my-auto py-2">
                {/* Columna Izquierda: Foto de Perfil */}
                <div className="col-span-3 flex justify-start">
                  <div className="relative size-16 sm:size-20 md:size-24 rounded-2xl bg-zinc-950/90 border border-teal-500/30 flex items-center justify-center overflow-hidden shadow-[0_0_30px_rgba(20,184,166,0.15)] group-hover:border-teal-400/50 transition-colors">
                    {data.type === 'pharmacy' ? (
                      <Building2 className="size-8 sm:size-10 md:size-12 text-emerald-400/30" />
                    ) : (
                      <User className="size-8 sm:size-10 md:size-12 text-teal-400/30" />
                    )}
                    <div className="absolute left-0 top-0 w-full h-[1px] bg-gradient-to-r from-transparent via-teal-400/70 to-transparent shadow-[0_0_8px_#2dd4bf] animate-scan pointer-events-none" />
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(18,24,38,0)_95%,rgba(20,184,166,0.1)_95%)] bg-[size:100%_4px] pointer-events-none mix-blend-overlay" />
                  </div>
                </div>

                {/* Columna Derecha: Datos Clave */}
                <div className="col-span-9 space-y-2 sm:space-y-3.5 pl-3 sm:pl-6">
                  {data.type === 'pharmacy' ? (
                    <>
                      <div>
                        <p className="text-[6px] sm:text-[7px] text-emerald-400/50 font-bold tracking-[0.2em] uppercase font-mono">ESTABLECIMIENTO / PHARMACY</p>
                        <p className="text-sm sm:text-base md:text-lg font-black text-white uppercase tracking-wide leading-none mt-1 truncate max-w-[280px]">{data.pharmacyName}</p>
                      </div>

                      <div className="grid grid-cols-12 gap-2 sm:gap-4">
                        <div className="col-span-7">
                          <p className="text-[6px] sm:text-[7px] text-emerald-400/50 font-bold tracking-[0.2em] uppercase font-mono">ID ESTABLECIMIENTO</p>
                          <p className="text-[10px] sm:text-xs font-black font-mono text-zinc-200 uppercase tracking-wider mt-1">{data.id.slice(0, 10).toUpperCase()}</p>
                        </div>
                        <div className="col-span-5">
                          <p className="text-[6px] sm:text-[7px] text-emerald-400/50 font-bold tracking-[0.2em] uppercase font-mono">REGENTE</p>
                          <span className="inline-block text-[10px] sm:text-xs font-black text-emerald-400 uppercase tracking-widest mt-1 truncate max-w-[120px]">
                            {data.name}
                          </span>
                        </div>
                      </div>
                    </>
                  ) : data.type === 'doctor' ? (
                    <>
                      <div>
                        <p className="text-[6px] sm:text-[7px] text-sky-400/50 font-bold tracking-[0.2em] uppercase font-mono">PROFESIONAL DE SALUD</p>
                        <p className="text-sm sm:text-base md:text-lg font-black text-white uppercase tracking-wide leading-none mt-1 truncate max-w-[280px]">{data.name}</p>
                      </div>

                      <div className="grid grid-cols-12 gap-2 sm:gap-4">
                        <div className="col-span-7">
                          <p className="text-[6px] sm:text-[7px] text-sky-400/50 font-bold tracking-[0.2em] uppercase font-mono">REGISTRO MINSA</p>
                          <p className="text-[10px] sm:text-xs font-black font-mono text-zinc-200 uppercase tracking-wider mt-1">{data.licenseNumber}</p>
                        </div>
                        <div className="col-span-5">
                          <p className="text-[6px] sm:text-[7px] text-sky-400/50 font-bold tracking-[0.2em] uppercase font-mono">ESPECIALIDAD</p>
                          <span className="inline-block text-[10px] sm:text-xs font-black text-sky-400 uppercase tracking-widest mt-1 truncate max-w-[120px]">
                            {data.specialty}
                          </span>
                        </div>
                      </div>
                    </>
                  ) : data.type === 'delivery' ? (
                    <>
                      <div>
                        <p className="text-[6px] sm:text-[7px] text-amber-400/50 font-bold tracking-[0.2em] uppercase font-mono">REPARTIDOR AUTORIZADO</p>
                        <p className="text-sm sm:text-base md:text-lg font-black text-white uppercase tracking-wide leading-none mt-1 truncate max-w-[280px]">{data.name}</p>
                      </div>

                      <div className="grid grid-cols-12 gap-2 sm:gap-4">
                        <div className="col-span-7">
                          <p className="text-[6px] sm:text-[7px] text-amber-400/50 font-bold tracking-[0.2em] uppercase font-mono">ID DE LICENCIA</p>
                          <p className="text-[10px] sm:text-xs font-black font-mono text-zinc-200 uppercase tracking-wider mt-1">{data.id.slice(0, 10).toUpperCase()}</p>
                        </div>
                        <div className="col-span-5">
                          <p className="text-[6px] sm:text-[7px] text-amber-400/50 font-bold tracking-[0.2em] uppercase font-mono">TRANSPORTE</p>
                          <span className="inline-block text-[10px] sm:text-xs font-black text-amber-400 uppercase tracking-widest mt-1 truncate max-w-[120px]">
                            {data.vehicleType}
                          </span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <p className="text-[6px] sm:text-[7px] text-teal-400/50 font-bold tracking-[0.2em] uppercase font-mono">TITULAR / CITIZEN</p>
                        <p className="text-sm sm:text-base md:text-lg font-black text-white uppercase tracking-wide leading-none mt-1 truncate max-w-[280px]">{data.name}</p>
                      </div>

                      <div className="grid grid-cols-12 gap-2 sm:gap-4">
                        <div className="col-span-7">
                          <p className="text-[6px] sm:text-[7px] text-teal-400/50 font-bold tracking-[0.2em] uppercase font-mono">EXPEDIENTE ID</p>
                          <p className="text-[10px] sm:text-xs font-black font-mono text-zinc-200 uppercase tracking-wider mt-1">{data.id.slice(0, 10).toUpperCase()}</p>
                        </div>
                        <div className="col-span-5">
                          <p className="text-[6px] sm:text-[7px] text-teal-400/50 font-bold tracking-[0.2em] uppercase font-mono">TIPO SANGRE</p>
                          <span className="inline-block text-[11px] sm:text-xs md:text-sm font-black text-red-400 uppercase tracking-widest mt-1 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20 leading-none">
                            {data.bloodType || 'O+'}
                          </span>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Fila inferior de Datos (Común) */}
                  <div className="grid grid-cols-12 gap-2 sm:gap-4">
                    <div className="col-span-7">
                      <p className="text-[6px] sm:text-[7px] text-teal-400/50 font-bold tracking-[0.2em] uppercase font-mono">
                        {data.type === 'pharmacy' && 'DIRECCIÓN'}
                        {data.type === 'doctor' && 'CENTRO MÉDICO'}
                        {data.type === 'delivery' && 'CENTRO ASOCIADO'}
                        {data.type === 'patient' && 'EMISIÓN / EMITTED'}
                      </p>
                      <p className="text-[9px] sm:text-[10px] font-semibold text-zinc-300 truncate max-w-[160px] mt-1">
                        {data.type === 'pharmacy' && data.pharmacyAddress}
                        {data.type === 'doctor' && data.clinicName}
                        {data.type === 'delivery' && data.pharmacyName}
                        {data.type === 'patient' && formatDate(data.date, 'dd/MM/yyyy')}
                      </p>
                    </div>
                    <div className="col-span-5">
                      <p className="text-[6px] sm:text-[7px] text-teal-400/50 font-bold tracking-[0.2em] uppercase font-mono">
                        {data.type === 'delivery' && 'PLACA'}
                        {data.type !== 'delivery' && 'PAÍS / COUNTRY'}
                      </p>
                      <p className="text-[10px] sm:text-xs font-black text-zinc-200 uppercase mt-1 font-mono">
                        {data.type === 'delivery' ? data.licensePlate : 'NICARAGUA'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer de la Tarjeta */}
              <div className="flex justify-between items-end border-t border-white/5 pt-3">
                <div className="font-mono text-[6px] sm:text-[7px] text-zinc-500 tracking-wider">
                  {data.type === 'pharmacy' && `EST-HASH: ${data.id.slice(0, 24).toUpperCase()}`}
                  {data.type === 'doctor' && `DOC-HASH: ${data.id.slice(0, 24).toUpperCase()}`}
                  {data.type === 'delivery' && `DEL-HASH: ${data.id.slice(0, 24).toUpperCase()}`}
                  {data.type === 'patient' && `PAC-HASH: ${data.id.slice(0, 24).toUpperCase()}`}
                </div>
                <div className="h-4 sm:h-5 w-28 sm:w-36 bg-white/5 rounded-[2px] flex items-center justify-between p-0.5 gap-[1.5px] overflow-hidden opacity-30 shrink-0">
                  {Array(26).fill(0).map((_, i) => (
                    <div 
                      key={i} 
                      className="h-full bg-white rounded-[0.5px]" 
                      style={{ width: `${(i % 3 === 0 ? 3 : i % 2 === 0 ? 1 : 2)}px` }} 
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Panel Informativo / Clínico Detallado en Verificación */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            {data.type === 'pharmacy' ? (
              <>
                <GlassCard className="p-6 border-t-4 border-emerald-500/40 relative overflow-hidden bg-zinc-900/40 text-left">
                  <div className="flex items-center gap-3 mb-4 border-b border-zinc-100 dark:border-zinc-800 pb-3">
                    <div className="size-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                      <Building2 className="size-4" />
                    </div>
                    <h4 className="text-sm font-black uppercase text-foreground tracking-widest">Acreditación Sanitaria</h4>
                  </div>
                  <div className="space-y-4">
                    <div className="flex gap-3 bg-zinc-50/50 dark:bg-zinc-900/30 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                      <CheckCircle2 className="size-5 text-emerald-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[10px] font-black text-foreground uppercase tracking-wide">Licencia Operativa Vigente</p>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-normal">
                          Establecimiento farmacéutico oficialmente acreditado por el Ministerio de Salud (MINSA) de Nicaragua.
                        </p>
                      </div>
                    </div>
                  </div>
                </GlassCard>

                <GlassCard className="p-6 border-t-4 border-teal-500/40 relative overflow-hidden bg-zinc-900/40 text-left">
                  <div className="flex items-center gap-3 mb-4 border-b border-zinc-100 dark:border-zinc-800 pb-3">
                    <div className="size-8 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-500 border border-teal-500/20">
                      <MapPin className="size-4" />
                    </div>
                    <h4 className="text-sm font-black uppercase text-foreground tracking-widest">Contacto Comercial</h4>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">Teléfono de Enlace</p>
                      <p className="text-xs text-teal-600 dark:text-teal-400 mt-1 font-mono font-bold">{data.pharmacyPhone}</p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">Dirección Registrada</p>
                      <p className="text-xs text-foreground mt-1 leading-relaxed truncate">{data.pharmacyAddress}</p>
                    </div>
                  </div>
                </GlassCard>
              </>
            ) : data.type === 'doctor' ? (
              <>
                <GlassCard className="p-6 border-t-4 border-sky-500/40 relative overflow-hidden bg-zinc-900/40 text-left">
                  <div className="flex items-center gap-3 mb-4 border-b border-zinc-100 dark:border-zinc-800 pb-3">
                    <div className="size-8 rounded-full bg-sky-500/10 flex items-center justify-center text-sky-500 border border-sky-500/20">
                      <ShieldCheck className="size-4" />
                    </div>
                    <h4 className="text-sm font-black uppercase text-foreground tracking-widest">Acreditación Médica</h4>
                  </div>
                  <div className="space-y-4">
                    <div className="flex gap-3 bg-zinc-50/50 dark:bg-zinc-900/30 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                      <CheckCircle2 className="size-5 text-sky-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[10px] font-black text-foreground uppercase tracking-wide">Colegiado Activo</p>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-normal">
                          Profesional médico inscrito en el registro nacional con facultades plenas para emitir prescripciones electrónicas.
                        </p>
                      </div>
                    </div>
                  </div>
                </GlassCard>

                <GlassCard className="p-6 border-t-4 border-teal-500/40 relative overflow-hidden bg-zinc-900/40 text-left">
                  <div className="flex items-center gap-3 mb-4 border-b border-zinc-100 dark:border-zinc-800 pb-3">
                    <div className="size-8 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-500 border border-teal-500/20">
                      <Building2 className="size-4" />
                    </div>
                    <h4 className="text-sm font-black uppercase text-foreground tracking-widest">Consultorio Principal</h4>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">Clínica / Hospital</p>
                      <p className="text-xs text-foreground mt-1 font-bold">{data.clinicName}</p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">Especialidad Clínica</p>
                      <p className="text-xs text-teal-600 dark:text-teal-400 mt-1 font-bold">{data.specialty}</p>
                    </div>
                  </div>
                </GlassCard>
              </>
            ) : data.type === 'delivery' ? (
              <>
                <GlassCard className="p-6 border-t-4 border-amber-500/40 relative overflow-hidden bg-zinc-900/40 text-left">
                  <div className="flex items-center gap-3 mb-4 border-b border-zinc-100 dark:border-zinc-800 pb-3">
                    <div className="size-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20">
                      <ShieldCheck className="size-4" />
                    </div>
                    <h4 className="text-sm font-black uppercase text-foreground tracking-widest">Logística de Oasis</h4>
                  </div>
                  <div className="space-y-4">
                    <div className="flex gap-3 bg-zinc-50/50 dark:bg-zinc-900/30 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                      <CheckCircle2 className="size-5 text-amber-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[10px] font-black text-foreground uppercase tracking-wide">Repartidor Oficial</p>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-normal">
                          Autorizado para retirar y transportar pedidos de medicamentos sensibles o controlados.
                        </p>
                      </div>
                    </div>
                  </div>
                </GlassCard>

                <GlassCard className="p-6 border-t-4 border-teal-500/40 relative overflow-hidden bg-zinc-900/40 text-left">
                  <div className="flex items-center gap-3 mb-4 border-b border-zinc-100 dark:border-zinc-800 pb-3">
                    <div className="size-8 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-500 border border-teal-500/20">
                      <Building2 className="size-4" />
                    </div>
                    <h4 className="text-sm font-black uppercase text-foreground tracking-widest">Farmacia de Despacho</h4>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">Establecimiento Asignado</p>
                      <p className="text-xs text-foreground mt-1 font-bold">{data.pharmacyName}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">Vehículo</p>
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 font-bold uppercase">{data.vehicleType}</p>
                      </div>
                      <div>
                        <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">Placa N°</p>
                        <p className="text-xs text-foreground mt-1 font-mono font-bold uppercase">{data.licensePlate}</p>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </>
            ) : (
              <>
                <GlassCard className="p-6 border-t-4 border-red-500/40 relative overflow-hidden bg-zinc-900/40 text-left">
                  <div className="flex items-center gap-3 mb-4 border-b border-zinc-100 dark:border-zinc-800 pb-3">
                    <div className="size-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20">
                      <AlertCircle className="size-4" />
                    </div>
                    <h4 className="text-sm font-black uppercase text-foreground tracking-widest">Información Crítica Médica</h4>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">Alergias Conocidas</p>
                      {parseAllergies(data.allergies).length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {parseAllergies(data.allergies).map((allergy: string, i: number) => (
                            <span key={i} className="text-[9px] font-extrabold bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 px-2.5 py-1 rounded-full border border-amber-500/20 uppercase tracking-wider shadow-sm">
                              {allergy}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground italic mt-1 bg-zinc-50 dark:bg-zinc-900 p-3 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800">
                          Ninguna alergia reportada en el historial
                        </p>
                      )}
                    </div>

                    <div>
                      <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider">Tipo de Sangre</p>
                      <div className="mt-1 flex items-center gap-3 bg-red-500/5 p-3 rounded-2xl border border-red-500/10">
                        <span className="size-10 rounded-xl bg-red-500 flex items-center justify-center font-black text-lg text-white shadow-lg shadow-red-500/25 select-none">
                          {data.bloodType || 'O+'}
                        </span>
                        <div>
                          <p className="text-xs font-black text-foreground">Factor Crítico Confirmado</p>
                          <p className="text-[10px] text-muted-foreground font-medium mt-0.5">Válido para transfusiones en clínicas MINSA</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </GlassCard>

                <GlassCard className="p-6 border-t-4 border-teal-500/40 relative overflow-hidden bg-zinc-900/40 text-left">
                  <div className="flex items-center gap-3 mb-4 border-b border-zinc-100 dark:border-zinc-800 pb-3">
                    <div className="size-8 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-600 border border-teal-500/20">
                      <ShieldCheck className="size-4" />
                    </div>
                    <h4 className="text-sm font-black uppercase text-foreground tracking-widest">Acreditación Legal y Licencias</h4>
                  </div>
                  <div className="space-y-4">
                    <div className="flex gap-3 bg-zinc-50/50 dark:bg-zinc-900/30 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                      <CheckCircle2 className="size-5 text-emerald-500 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[10px] font-black text-foreground uppercase tracking-wide">Estatus Homologado Activo</p>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-normal">
                          Este carnet cumple con las normativas vigentes del Ministerio de Salud (MINSA) para identificación y trazabilidad de pacientes crónicos.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3 bg-zinc-50/50 dark:bg-zinc-900/30 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-800">
                      <ShieldCheck className="size-5 text-teal-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[10px] font-black text-foreground uppercase tracking-wide">Firma Criptográfica Segura</p>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-normal font-mono text-[9px] truncate">
                          SEC-HASH-PAC-{data.id.toUpperCase()}
                        </p>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </>
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
