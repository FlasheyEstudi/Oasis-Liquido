'use client';

import { useState, useEffect, use } from 'react';
import { getApiUrl } from '@/api/client';
import { GlassCard } from '@/components/oasis/glass-card';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/utils/helpers';
import { 
  CheckCircle2, 
  User, 
  Building2, 
  MapPin, 
  AlertCircle,
  Loader2,
  ShieldCheck,
  ArrowLeft
} from 'lucide-react';
import { motion } from 'framer-motion';

interface PatientData {
  id: string;
  name: string;
  bloodType?: string;
  allergies?: any;
  date: string;
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


export default function PasaportePublicoPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const [data, setData] = useState<PatientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch(`${getApiUrl()}/public/verify/patient/${id}`);
        const json = await response.json();
        if (json.success) {
          setData(json.data);
        } else {
          setError(
            typeof json.error === 'object' && json.error?.message 
              ? json.error.message 
              : typeof json.error === 'string' 
                ? json.error 
                : 'No se encontró el Pasaporte de Salud'
          );
        }
      } catch (err) {
        setError('Error de conexión con la red de salud Oasis');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-white">
        <Loader2 className="size-14 text-teal-500 animate-spin mb-4" />
        <p className="text-zinc-400 font-mono tracking-widest text-xs animate-pulse uppercase">Conectando con Servidor Oasis...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-white px-6 text-center">
        <div className="size-20 bg-red-500/10 border border-red-500/30 rounded-full flex items-center justify-center text-red-500 mb-6">
          <AlertCircle className="size-10" />
        </div>
        <h2 className="text-2xl font-black mb-2 tracking-tight">Pasaporte de Salud No Válido</h2>
        <p className="text-zinc-400 max-w-sm text-sm mb-8 leading-relaxed">{error}</p>
        <Button onClick={() => window.location.href = '/'} className="rounded-full bg-teal-600 hover:bg-teal-700 font-bold px-6">
          <ArrowLeft className="size-4 mr-2" /> Volver al Inicio
        </Button>
      </div>
    );
  }

  const renderCard = () => {
    if (!data) return null;

    if (data.type === 'pharmacy') {
      return (
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 15 }}
          className="relative w-full aspect-[1.586/1] rounded-[1.8rem] md:rounded-[2.2rem] overflow-hidden text-white shadow-[0_30px_70px_rgba(0,0,0,0.7)] border border-emerald-500/20 group backdrop-blur-md bg-zinc-950/40"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-zinc-950 via-emerald-950/60 to-zinc-950" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(16,185,129,0.15),transparent)] pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/5 via-cyan-500/5 to-amber-500/5 opacity-40 mix-blend-overlay pointer-events-none" />
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />

          <div className="absolute -right-16 -bottom-16 size-56 rounded-full border border-emerald-500/[0.03] bg-emerald-500/[0.005] flex items-center justify-center rotate-12 pointer-events-none select-none">
            <span className="text-[8px] font-black text-emerald-400/[0.06] tracking-[0.3em] uppercase text-center leading-normal">
              REPÚBLICA DE NICARAGUA<br/>MINISTERIO DE SALUD
            </span>
          </div>

          <div className="absolute inset-0 p-5 sm:p-7 md:p-8 flex flex-col justify-between z-10 select-none">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-6 sm:w-10 sm:h-7 bg-gradient-to-br from-emerald-400 via-teal-500 to-emerald-700 rounded-[4px] border border-emerald-400/30 relative shadow-md overflow-hidden flex flex-col justify-between p-0.5 opacity-95 shrink-0">
                  <div className="grid grid-cols-3 gap-[1px] h-full w-full opacity-60">
                    <div className="border-r border-emerald-950/20 border-b" />
                    <div className="border-r border-emerald-950/20 border-b" />
                    <div className="border-b" />
                    <div className="border-r border-emerald-950/20" />
                    <div className="border-r border-emerald-950/20" />
                    <div className="border-none" />
                  </div>
                </div>
                <div>
                  <h3 className="text-base sm:text-lg md:text-xl font-black tracking-[0.15em] text-emerald-300 uppercase flex items-center gap-1.5 leading-none">
                    OASIS LÍQUIDA
                  </h3>
                  <p className="text-[6px] sm:text-[7px] text-emerald-400/60 font-mono tracking-widest uppercase mt-1">FARMACIA CONVENIADA</p>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[7px] sm:text-[8px] font-black tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase shadow-[0_0_15px_rgba(16,185,129,0.05)]">
                  MINSA AUTORIZADO
                </span>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-4 items-center my-auto py-2">
              <div className="col-span-3 flex justify-start">
                <div className="relative size-16 sm:size-20 md:size-24 rounded-2xl bg-zinc-950/90 border border-emerald-500/30 flex items-center justify-center overflow-hidden shadow-[0_0_30px_rgba(16,185,129,0.15)] group-hover:border-emerald-400/50 transition-colors">
                  <Building2 className="size-8 sm:size-10 md:size-12 text-emerald-400/30" />
                  <div className="absolute left-0 top-0 w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-400/70 to-transparent shadow-[0_0_8px_#10b981] animate-scan pointer-events-none" />
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(18,24,38,0)_95%,rgba(16,185,129,0.1)_95%)] bg-[size:100%_4px] pointer-events-none mix-blend-overlay" />
                </div>
              </div>

              <div className="col-span-9 space-y-2 sm:space-y-3.5 pl-3 sm:pl-6">
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

                <div className="grid grid-cols-12 gap-2 sm:gap-4">
                  <div className="col-span-7">
                    <p className="text-[6px] sm:text-[7px] text-emerald-400/50 font-bold tracking-[0.2em] uppercase font-mono">DIRECCIÓN / ADDRESS</p>
                    <p className="text-[9px] sm:text-[10px] font-semibold text-zinc-300 truncate max-w-[160px] mt-1">{data.pharmacyAddress}</p>
                  </div>
                  <div className="col-span-5">
                    <p className="text-[6px] sm:text-[7px] text-emerald-400/50 font-bold tracking-[0.2em] uppercase font-mono">PAÍS / COUNTRY</p>
                    <p className="text-[10px] sm:text-xs font-black text-zinc-200 uppercase mt-1 font-mono">NICARAGUA</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-end border-t border-white/5 pt-3">
              <div className="font-mono text-[6px] sm:text-[7px] text-zinc-500 tracking-wider">
                EST-HASH: {data.id.slice(0, 24).toUpperCase()}
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
      );
    }

    if (data.type === 'doctor') {
      return (
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 15 }}
          className="relative w-full aspect-[1.586/1] rounded-[1.8rem] md:rounded-[2.2rem] overflow-hidden text-white shadow-[0_30px_70px_rgba(0,0,0,0.7)] border border-sky-500/20 group backdrop-blur-md bg-zinc-950/40"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-zinc-950 via-sky-950/60 to-zinc-950" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(14,165,233,0.15),transparent)] pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-tr from-sky-500/5 via-indigo-500/5 to-cyan-500/5 opacity-40 mix-blend-overlay pointer-events-none" />
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-sky-500/30 to-transparent" />

          <div className="absolute -right-16 -bottom-16 size-56 rounded-full border border-sky-500/[0.03] bg-sky-500/[0.005] flex items-center justify-center rotate-12 pointer-events-none select-none">
            <span className="text-[8px] font-black text-sky-400/[0.06] tracking-[0.3em] uppercase text-center leading-normal">
              REPÚBLICA DE NICARAGUA<br/>MINISTERIO DE SALUD
            </span>
          </div>

          <div className="absolute inset-0 p-5 sm:p-7 md:p-8 flex flex-col justify-between z-10 select-none">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-6 sm:w-10 sm:h-7 bg-gradient-to-br from-sky-400 via-indigo-500 to-sky-700 rounded-[4px] border border-sky-400/30 relative shadow-md overflow-hidden flex flex-col justify-between p-0.5 opacity-95 shrink-0">
                  <div className="grid grid-cols-3 gap-[1px] h-full w-full opacity-60">
                    <div className="border-r border-sky-950/20 border-b" />
                    <div className="border-r border-sky-950/20 border-b" />
                    <div className="border-b" />
                    <div className="border-r border-sky-950/20" />
                    <div className="border-r border-sky-950/20" />
                    <div className="border-none" />
                  </div>
                </div>
                <div>
                  <h3 className="text-base sm:text-lg md:text-xl font-black tracking-[0.15em] text-sky-300 uppercase flex items-center gap-1.5 leading-none">
                    OASIS LÍQUIDA
                  </h3>
                  <p className="text-[6px] sm:text-[7px] text-sky-400/60 font-mono tracking-widest uppercase mt-1">MÉDICO COLEGIADO</p>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[7px] sm:text-[8px] font-black tracking-widest bg-sky-500/10 text-sky-400 border border-sky-500/20 uppercase shadow-[0_0_15px_rgba(14,165,233,0.05)]">
                  MINSA CERTIFICADO
                </span>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-4 items-center my-auto py-2">
              <div className="col-span-3 flex justify-start">
                <div className="relative size-16 sm:size-20 md:size-24 rounded-2xl bg-zinc-950/90 border border-sky-500/30 flex items-center justify-center overflow-hidden shadow-[0_0_30px_rgba(14,165,233,0.15)] group-hover:border-sky-400/50 transition-colors">
                  <User className="size-8 sm:size-10 md:size-12 text-sky-400/30" />
                  <div className="absolute left-0 top-0 w-full h-[1px] bg-gradient-to-r from-transparent via-sky-400/70 to-transparent shadow-[0_0_8px_#38bdf8] animate-scan pointer-events-none" />
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(18,24,38,0)_95%,rgba(14,165,233,0.1)_95%)] bg-[size:100%_4px] pointer-events-none mix-blend-overlay" />
                </div>
              </div>

              <div className="col-span-9 space-y-2 sm:space-y-3.5 pl-3 sm:pl-6">
                <div>
                  <p className="text-[6px] sm:text-[7px] text-sky-400/50 font-bold tracking-[0.2em] uppercase font-mono">PROFESIONAL DE SALUD</p>
                  <p className="text-sm sm:text-base md:text-lg font-black text-white uppercase tracking-wide leading-none mt-1 truncate max-w-[280px]">{data.name}</p>
                </div>

                <div className="grid grid-cols-12 gap-2 sm:gap-4">
                  <div className="col-span-7">
                    <p className="text-[6px] sm:text-[7px] text-sky-400/50 font-bold tracking-[0.2em] uppercase font-mono">REGISTRO MINSA / CÉDULA</p>
                    <p className="text-[10px] sm:text-xs font-black font-mono text-zinc-200 uppercase tracking-wider mt-1">{data.licenseNumber}</p>
                  </div>
                  <div className="col-span-5">
                    <p className="text-[6px] sm:text-[7px] text-sky-400/50 font-bold tracking-[0.2em] uppercase font-mono">ESPECIALIDAD</p>
                    <span className="inline-block text-[10px] sm:text-xs font-black text-sky-400 uppercase tracking-widest mt-1 truncate max-w-[120px]">
                      {data.specialty}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-2 sm:gap-4">
                  <div className="col-span-7">
                    <p className="text-[6px] sm:text-[7px] text-sky-400/50 font-bold tracking-[0.2em] uppercase font-mono">CENTRO MÉDICO / CLINIC</p>
                    <p className="text-[10px] sm:text-xs font-semibold text-zinc-300 truncate max-w-[160px] mt-1">{data.clinicName}</p>
                  </div>
                  <div className="col-span-5">
                    <p className="text-[6px] sm:text-[7px] text-sky-400/50 font-bold tracking-[0.2em] uppercase font-mono">ESTATUS</p>
                    <p className="text-[10px] sm:text-xs font-black text-emerald-400 uppercase mt-1 font-mono">ACTIVO</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-end border-t border-white/5 pt-3">
              <div className="font-mono text-[6px] sm:text-[7px] text-zinc-500 tracking-wider">
                DOC-HASH: {data.id.slice(0, 24).toUpperCase()}
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
      );
    }

    if (data.type === 'delivery') {
      return (
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 15 }}
          className="relative w-full aspect-[1.586/1] rounded-[1.8rem] md:rounded-[2.2rem] overflow-hidden text-white shadow-[0_30px_70px_rgba(0,0,0,0.7)] border border-amber-500/20 group backdrop-blur-md bg-zinc-950/40"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-zinc-950 via-amber-950/60 to-zinc-950" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(245,158,11,0.15),transparent)] pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/5 via-orange-500/5 to-yellow-500/5 opacity-40 mix-blend-overlay pointer-events-none" />
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />

          <div className="absolute -right-16 -bottom-16 size-56 rounded-full border border-amber-500/[0.03] bg-amber-500/[0.005] flex items-center justify-center rotate-12 pointer-events-none select-none">
            <span className="text-[8px] font-black text-amber-400/[0.06] tracking-[0.3em] uppercase text-center leading-normal">
              REPÚBLICA DE NICARAGUA<br/>MINISTERIO DE SALUD
            </span>
          </div>

          <div className="absolute inset-0 p-5 sm:p-7 md:p-8 flex flex-col justify-between z-10 select-none">
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-6 sm:w-10 sm:h-7 bg-gradient-to-br from-amber-400 via-orange-500 to-amber-700 rounded-[4px] border border-amber-400/30 relative shadow-md overflow-hidden flex flex-col justify-between p-0.5 opacity-95 shrink-0">
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
                  <h3 className="text-base sm:text-lg md:text-xl font-black tracking-[0.15em] text-amber-300 uppercase flex items-center gap-1.5 leading-none">
                    OASIS LÍQUIDA
                  </h3>
                  <p className="text-[6px] sm:text-[7px] text-amber-400/60 font-mono tracking-widest uppercase mt-1">LOGÍSTICA / LOGISTICS</p>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[7px] sm:text-[8px] font-black tracking-widest bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase shadow-[0_0_15px_rgba(245,158,11,0.05)]">
                  MINSA AUTORIZADO
                </span>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-4 items-center my-auto py-2">
              <div className="col-span-3 flex justify-start">
                <div className="relative size-16 sm:size-20 md:size-24 rounded-2xl bg-zinc-950/90 border border-amber-500/30 flex items-center justify-center overflow-hidden shadow-[0_0_30px_rgba(245,158,11,0.15)] group-hover:border-amber-400/50 transition-colors">
                  <User className="size-8 sm:size-10 md:size-12 text-amber-400/30" />
                  <div className="absolute left-0 top-0 w-full h-[1px] bg-gradient-to-r from-transparent via-amber-400/70 to-transparent shadow-[0_0_8px_#f59e0b] animate-scan pointer-events-none" />
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(18,24,38,0)_95%,rgba(245,158,11,0.1)_95%)] bg-[size:100%_4px] pointer-events-none mix-blend-overlay" />
                </div>
              </div>

              <div className="col-span-9 space-y-2 sm:space-y-3.5 pl-3 sm:pl-6">
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

                <div className="grid grid-cols-12 gap-2 sm:gap-4">
                  <div className="col-span-7">
                    <p className="text-[6px] sm:text-[7px] text-amber-400/50 font-bold tracking-[0.2em] uppercase font-mono">CENTRO ASOCIADO</p>
                    <p className="text-[10px] sm:text-xs font-semibold text-zinc-300 truncate max-w-[160px] mt-1">{data.pharmacyName}</p>
                  </div>
                  <div className="col-span-5">
                    <p className="text-[6px] sm:text-[7px] text-amber-400/50 font-bold tracking-[0.2em] uppercase font-mono">PLACA</p>
                    <p className="text-[10px] sm:text-xs font-black text-zinc-200 uppercase mt-1 font-mono">{data.licensePlate}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-end border-t border-white/5 pt-3">
              <div className="font-mono text-[6px] sm:text-[7px] text-zinc-500 tracking-wider">
                DEL-HASH: {data.id.slice(0, 24).toUpperCase()}
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
      );
    }

    // Default: patient
    return (
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 15 }}
        className="relative w-full aspect-[1.586/1] rounded-[1.8rem] md:rounded-[2.2rem] overflow-hidden text-white shadow-[0_30px_70px_rgba(0,0,0,0.7)] border border-teal-500/20 group backdrop-blur-md bg-zinc-950/40"
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-zinc-950 via-teal-950/70 to-zinc-950" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(20,184,166,0.18),transparent)] pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/5 via-purple-500/5 to-emerald-500/5 opacity-40 mix-blend-overlay pointer-events-none" />
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-teal-500/30 to-transparent" />

        <div className="absolute -right-16 -bottom-16 size-56 rounded-full border border-teal-500/[0.03] bg-teal-500/[0.005] flex items-center justify-center rotate-12 pointer-events-none select-none">
          <span className="text-[8px] font-black text-teal-400/[0.06] tracking-[0.3em] uppercase text-center leading-normal">
            REPÚBLICA DE NICARAGUA<br/>MINISTERIO DE SALUD
          </span>
        </div>

        <div className="absolute inset-0 p-5 sm:p-7 md:p-8 flex flex-col justify-between z-10 select-none">
          <div className="flex justify-between items-center border-b border-white/5 pb-3">
            <div className="flex items-center gap-3">
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
                <p className="text-[6px] sm:text-[7px] text-teal-400/60 font-mono tracking-widest uppercase mt-1">PASAPORTE DIGITAL DE SALUD</p>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[7px] sm:text-[8px] font-black tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase shadow-[0_0_15px_rgba(16,185,129,0.05)]">
                MINSA ACREDITADO
              </span>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-4 items-center my-auto py-2">
            <div className="col-span-3 flex justify-start">
              <div className="relative size-16 sm:size-20 md:size-24 rounded-2xl bg-zinc-950/90 border border-teal-500/30 flex items-center justify-center overflow-hidden shadow-[0_0_30px_rgba(20,184,166,0.15)] group-hover:border-teal-400/50 transition-colors">
                <User className="size-8 sm:size-10 md:size-12 text-teal-400/30" />
                <div className="absolute left-0 top-0 w-full h-[1px] bg-gradient-to-r from-transparent via-teal-400/70 to-transparent shadow-[0_0_8px_#2dd4bf] animate-scan pointer-events-none" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,24,38,0)_95%,rgba(20,184,166,0.1)_95%)] bg-[size:100%_4px] pointer-events-none mix-blend-overlay" />
              </div>
            </div>

            <div className="col-span-9 space-y-2 sm:space-y-3.5 pl-3 sm:pl-6">
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

              <div className="grid grid-cols-12 gap-2 sm:gap-4">
                <div className="col-span-7">
                  <p className="text-[6px] sm:text-[7px] text-teal-400/50 font-bold tracking-[0.2em] uppercase font-mono">EMISIÓN / EMITTED</p>
                  <p className="text-[10px] sm:text-xs font-semibold text-zinc-300 font-mono mt-1">{formatDate(data.date, 'dd/MM/yyyy')}</p>
                </div>
                <div className="col-span-5">
                  <p className="text-[6px] sm:text-[7px] text-teal-400/50 font-bold tracking-[0.2em] uppercase font-mono">PAÍS / COUNTRY</p>
                  <p className="text-[10px] sm:text-xs font-black text-zinc-200 uppercase mt-1 font-mono">NICARAGUA</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-end border-t border-white/5 pt-3">
            <div className="font-mono text-[6px] sm:text-[7px] text-zinc-500 tracking-wider">
              PAC-HASH: {data.id.slice(0, 24).toUpperCase()}
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
    );
  };

  const renderInfoPanels = () => {
    if (!data) return null;

    if (data.type === 'pharmacy') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <GlassCard className="p-6 border-t-4 border-emerald-500/40 relative overflow-hidden bg-zinc-900/40">
            <div className="flex items-center gap-3 mb-4 border-b border-zinc-800 pb-3">
              <div className="size-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                <Building2 className="size-4" />
              </div>
              <h4 className="text-sm font-black uppercase text-white tracking-widest">Acreditación MINSA Farmacéutica</h4>
            </div>
            <div className="space-y-4">
              <div className="flex gap-3 bg-zinc-950 p-4 rounded-2xl border border-zinc-800">
                <CheckCircle2 className="size-5 text-emerald-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] font-black text-white uppercase tracking-wide">Estatus Operativo Activo</p>
                  <p className="text-xs text-zinc-400 mt-0.5 leading-normal">
                    Este establecimiento cuenta con licencia sanitaria vigente emitida por el MINSA para la dispensación de medicamentos controlados y generales de Oasis Líquida.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 bg-zinc-950 p-4 rounded-2xl border border-zinc-800">
                <ShieldCheck className="size-5 text-emerald-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] font-black text-white uppercase tracking-wide">Firma de Transacciones Digitales</p>
                  <p className="text-xs text-zinc-400 mt-0.5 leading-normal font-mono text-[9px] truncate">
                    SEC-PHARM-{data.id.toUpperCase()}
                  </p>
                </div>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6 border-t-4 border-teal-500/40 relative overflow-hidden bg-zinc-900/40">
            <div className="flex items-center gap-3 mb-4 border-b border-zinc-800 pb-3">
              <div className="size-8 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-500 border border-teal-500/20">
                <MapPin className="size-4" />
              </div>
              <h4 className="text-sm font-black uppercase text-white tracking-widest">Información de Contacto</h4>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider">Dirección Física Registrada</p>
                <p className="text-xs text-zinc-200 mt-1 font-medium leading-relaxed bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                  {data.pharmacyAddress}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider">Teléfono Enlace</p>
                  <p className="text-xs text-teal-400 mt-1 font-mono font-bold bg-zinc-950 px-3 py-2 rounded-xl border border-zinc-800">
                    {data.pharmacyPhone}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider">Regente Sanitario</p>
                  <p className="text-xs text-zinc-200 mt-1 font-bold bg-zinc-950 px-3 py-2 rounded-xl border border-zinc-800 truncate">
                    {data.name}
                  </p>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      );
    }

    if (data.type === 'doctor') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <GlassCard className="p-6 border-t-4 border-sky-500/40 relative overflow-hidden bg-zinc-900/40">
            <div className="flex items-center gap-3 mb-4 border-b border-zinc-800 pb-3">
              <div className="size-8 rounded-full bg-sky-500/10 flex items-center justify-center text-sky-500 border border-sky-500/20">
                <User className="size-4" />
              </div>
              <h4 className="text-sm font-black uppercase text-white tracking-widest">Registro Médico Oficial</h4>
            </div>
            <div className="space-y-4">
              <div className="flex gap-3 bg-zinc-950 p-4 rounded-2xl border border-zinc-800">
                <CheckCircle2 className="size-5 text-sky-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] font-black text-white uppercase tracking-wide">Licencia MINSA Homologada</p>
                  <p className="text-xs text-zinc-400 mt-0.5 leading-normal">
                    Profesional médico debidamente inscrito y autorizado por el Ministerio de Salud para emitir recetas digitales y dar seguimiento a pacientes en Oasis.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 bg-zinc-950 p-4 rounded-2xl border border-zinc-800">
                <ShieldCheck className="size-5 text-sky-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] font-black text-white uppercase tracking-wide">Firma Criptográfica Médica</p>
                  <p className="text-xs text-zinc-400 mt-0.5 leading-normal font-mono text-[9px] truncate">
                    SEC-DOC-{data.id.toUpperCase()}
                  </p>
                </div>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6 border-t-4 border-teal-500/40 relative overflow-hidden bg-zinc-900/40">
            <div className="flex items-center gap-3 mb-4 border-b border-zinc-800 pb-3">
              <div className="size-8 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-500 border border-teal-500/20">
                <Building2 className="size-4" />
              </div>
              <h4 className="text-sm font-black uppercase text-white tracking-widest">Establecimiento y Consultorio</h4>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider">Centro de Práctica Principal</p>
                <p className="text-xs text-zinc-200 mt-1 font-medium leading-relaxed bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                  {data.clinicName}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider">Especialidad</p>
                  <p className="text-xs text-teal-400 mt-1 font-bold bg-zinc-950 px-3 py-2 rounded-xl border border-zinc-800">
                    {data.specialty}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider">Licencia N°</p>
                  <p className="text-xs text-zinc-200 mt-1 font-mono font-bold bg-zinc-950 px-3 py-2 rounded-xl border border-zinc-800">
                    {data.licenseNumber}
                  </p>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      );
    }

    if (data.type === 'delivery') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <GlassCard className="p-6 border-t-4 border-amber-500/40 relative overflow-hidden bg-zinc-900/40">
            <div className="flex items-center gap-3 mb-4 border-b border-zinc-800 pb-3">
              <div className="size-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20">
                <User className="size-4" />
              </div>
              <h4 className="text-sm font-black uppercase text-white tracking-widest">Acreditación de Reparto</h4>
            </div>
            <div className="space-y-4">
              <div className="flex gap-3 bg-zinc-950 p-4 rounded-2xl border border-zinc-800">
                <CheckCircle2 className="size-5 text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] font-black text-white uppercase tracking-wide">Licencia Operativa Logistics</p>
                  <p className="text-xs text-zinc-400 mt-0.5 leading-normal">
                    Repartidor debidamente autorizado por Oasis y el MINSA para el traslado seguro y confidencial de medicamentos con receta médica.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 bg-zinc-950 p-4 rounded-2xl border border-zinc-800">
                <ShieldCheck className="size-5 text-amber-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[10px] font-black text-white uppercase tracking-wide">Firma de Despacho Segura</p>
                  <p className="text-xs text-zinc-400 mt-0.5 leading-normal font-mono text-[9px] truncate">
                    SEC-DRIV-{data.id.toUpperCase()}
                  </p>
                </div>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6 border-t-4 border-teal-500/40 relative overflow-hidden bg-zinc-900/40">
            <div className="flex items-center gap-3 mb-4 border-b border-zinc-800 pb-3">
              <div className="size-8 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-500 border border-teal-500/20">
                <Building2 className="size-4" />
              </div>
              <h4 className="text-sm font-black uppercase text-white tracking-widest">Base de Operaciones</h4>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider">Centro de Distribución Asociado</p>
                <p className="text-xs text-zinc-200 mt-1 font-medium leading-relaxed bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                  {data.pharmacyName}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider">Vehículo Autorizado</p>
                  <p className="text-xs text-amber-400 mt-1 font-bold bg-zinc-950 px-3 py-2 rounded-xl border border-zinc-800 uppercase">
                    {data.vehicleType}
                  </p>
                </div>
                <div>
                  <p className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider">Placa N°</p>
                  <p className="text-xs text-zinc-200 mt-1 font-mono font-bold bg-zinc-950 px-3 py-2 rounded-xl border border-zinc-800 uppercase">
                    {data.licensePlate}
                  </p>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      );
    }

    // Default: patient
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GlassCard className="p-6 border-t-4 border-red-500/40 relative overflow-hidden bg-zinc-900/40">
          <div className="flex items-center gap-3 mb-4 border-b border-zinc-800 pb-3">
            <div className="size-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20">
              <AlertCircle className="size-4" />
            </div>
            <h4 className="text-sm font-black uppercase text-white tracking-widest">Información Crítica Médica</h4>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider">Alergias Conocidas</p>
              {parseAllergies(data.allergies).length > 0 ? (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {parseAllergies(data.allergies).map((allergy: string, i: number) => (
                    <span key={i} className="text-[9px] font-extrabold bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded-full border border-amber-500/20 uppercase tracking-wider shadow-sm">
                      {allergy}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-zinc-400 italic mt-1 bg-zinc-950 p-3 rounded-2xl border border-dashed border-zinc-800">
                  Ninguna alergia reportada en el historial
                </p>
              )}
            </div>

            <div>
              <p className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider">Tipo de Sangre</p>
              <div className="mt-1 flex items-center gap-3 bg-red-500/5 p-3 rounded-2xl border border-red-500/10">
                <span className="size-10 rounded-xl bg-red-500 flex items-center justify-center font-black text-lg text-white shadow-lg shadow-red-500/25 select-none">
                  {data.bloodType || 'O+'}
                </span>
                <div>
                  <p className="text-xs font-black text-white">Factor Crítico Confirmado</p>
                  <p className="text-[10px] text-zinc-400 font-medium mt-0.5">Válido para transfusiones en clínicas MINSA</p>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6 border-t-4 border-teal-500/40 relative overflow-hidden bg-zinc-900/40">
          <div className="flex items-center gap-3 mb-4 border-b border-zinc-800 pb-3">
            <div className="size-8 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-600 border border-teal-500/20">
              <ShieldCheck className="size-4" />
            </div>
            <h4 className="text-sm font-black uppercase text-white tracking-widest">Acreditación Legal y Licencias</h4>
          </div>
          <div className="space-y-4">
            <div className="flex gap-3 bg-zinc-950 p-4 rounded-2xl border border-zinc-800">
              <CheckCircle2 className="size-5 text-emerald-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] font-black text-white uppercase tracking-wide">Estatus Homologado Activo</p>
                <p className="text-xs text-zinc-400 mt-0.5 leading-normal">
                  Este carnet cumple con las normativas vigentes del Ministerio de Salud (MINSA) para identificación y trazabilidad de pacientes crónicos.
                </p>
              </div>
            </div>

            <div className="flex gap-3 bg-zinc-950 p-4 rounded-2xl border border-zinc-800">
              <ShieldCheck className="size-5 text-teal-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] font-black text-white uppercase tracking-wide">Firma Criptográfica Segura</p>
                <p className="text-xs text-zinc-400 mt-0.5 leading-normal font-mono text-[9px] truncate">
                  SEC-HASH-PAC-{data.id.toUpperCase()}
                </p>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white py-12 px-4 selection:bg-teal-500 selection:text-black">
      {/* Decorative background glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-screen pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] rounded-full bg-teal-500/[0.03] blur-[120px]" />
        <div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] rounded-full bg-sky-500/[0.02] blur-[100px]" />
      </div>

      <div className="max-w-2xl mx-auto space-y-8 relative z-10">
        {/* Banner de Verificación Flotante */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.1)] mb-4">
            <CheckCircle2 className="size-4" /> Certificación MINSA Válida
          </div>
          <h1 className="text-3xl font-black tracking-tight uppercase">
            {data.type === 'pharmacy' && 'Credencial Farmacéutica'}
            {data.type === 'doctor' && 'Credencial Médica'}
            {data.type === 'delivery' && 'Acreditación de Reparto'}
            {(!data.type || data.type === 'patient') && 'Pasaporte de Salud'}
          </h1>
          <p className="text-xs text-zinc-400 font-mono tracking-widest uppercase mt-1">SISTEMA INTEGRADO DE IDENTIDAD CLÍNICA</p>
        </motion.div>

        {/* Tarjeta de Identidad Digital Interactiva (Efecto Tarjeta Física Premium) */}
        {renderCard()}

        {/* Panel Clínico Detallado de Emergencia */}
        {renderInfoPanels()}

        <div className="pt-8 text-center border-t border-zinc-900">
          <Button 
            variant="ghost" 
            onClick={() => window.location.href = '/'}
            className="text-xs font-bold text-zinc-500 hover:text-teal-400"
          >
            OASIS AURA HEALTH ECOSYSTEM © 2026
          </Button>
        </div>
      </div>
    </div>
  );
}
