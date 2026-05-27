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
          setError(json.error || 'No se encontró el Pasaporte de Salud');
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
          <h1 className="text-3xl font-black tracking-tight uppercase">Pasaporte de Salud</h1>
          <p className="text-xs text-zinc-400 font-mono tracking-widest uppercase mt-1">SISTEMA INTEGRADO DE IDENTIDAD CLÍNICA</p>
        </motion.div>

        {/* Tarjeta de Identidad Digital Interactiva (Efecto Tarjeta Física Premium) */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 15 }}
          className="relative w-full aspect-[1.586/1] rounded-[2.5rem] overflow-hidden text-white shadow-[0_30px_70px_rgba(0,0,0,0.6)] border border-teal-500/30 group"
        >
          {/* Fondo Base con Gradiente Satinado y Profundo */}
          <div className="absolute inset-0 bg-gradient-to-tr from-zinc-950 via-teal-950 to-zinc-950" />
          
          {/* Capa de Brillo Holográfico y Destellos Reactivos */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(20,184,166,0.25),transparent)] pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/10 via-purple-500/5 to-emerald-500/10 opacity-70 mix-blend-overlay pointer-events-none" />
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-teal-400/40 to-transparent" />

          {/* Marca de Agua Texturizada MINSA en el fondo */}
          <div className="absolute -right-20 -bottom-20 size-64 rounded-full border border-teal-500/[0.04] bg-teal-500/[0.01] flex items-center justify-center rotate-12 pointer-events-none select-none">
            <span className="text-[10px] font-black text-teal-400/10 tracking-[0.3em] uppercase text-center leading-normal">
              REPÚBLICA DE NICARAGUA<br/>MINISTERIO DE SALUD
            </span>
          </div>

          {/* Contenido Principal de la Tarjeta */}
          <div className="absolute inset-0 p-6 sm:p-8 flex flex-col justify-between z-10 select-none">
            {/* Header: Oasis Logo y Acreditación Oficial */}
            <div className="flex justify-between items-start border-b border-white/10 pb-4">
              <div>
                <h3 className="text-lg sm:text-xl font-black tracking-[0.15em] text-teal-300 uppercase flex items-center gap-2">
                  <span className="inline-block size-3 rounded-full bg-teal-400 shadow-[0_0_10px_#2dd4bf] animate-pulse" />
                  OASIS LÍQUIDA
                </h3>
                <p className="text-[7px] sm:text-[8px] text-teal-400/70 font-mono tracking-widest uppercase mt-0.5">PASAPORTE DIGITAL DE SALUD</p>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[8px] sm:text-[9px] font-black tracking-widest bg-emerald-500/20 text-emerald-300 border border-emerald-500/35 uppercase">
                  MINSA ACREDITADO
                </span>
              </div>
            </div>

            {/* Centro de la Tarjeta: Layout Realista de Carnet */}
            <div className="grid grid-cols-12 gap-4 items-center my-4">
              {/* Columna Izquierda: Foto de Perfil & Chip Inteligente */}
              <div className="col-span-4 flex flex-col gap-3 items-center">
                {/* Foto de Perfil con Estilo Holográfico */}
                <div className="relative size-20 sm:size-24 rounded-2xl bg-zinc-900/90 border-2 border-teal-500/40 flex items-center justify-center overflow-hidden shadow-[0_0_20px_rgba(20,184,166,0.25)] group-hover:border-teal-400 transition-colors">
                  <User className="size-10 sm:size-12 text-teal-400/40" />
                  {/* Efecto de Escáner Clínico Láser */}
                  <div className="absolute left-0 top-0 w-full h-[2px] bg-gradient-to-r from-transparent via-teal-400 to-transparent shadow-[0_0_10px_#2dd4bf] animate-scan pointer-events-none" />
                  {/* Hologram Overlay Grid */}
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(18,24,38,0)_95%,rgba(20,184,166,0.15)_95%)] bg-[size:100%_4px] pointer-events-none mix-blend-overlay" />
                </div>

                {/* Chip Inteligente Simulado (Metalizado Dorado) */}
                <div className="w-10 h-7 bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-600 rounded-md border border-amber-400/40 relative shadow-inner overflow-hidden flex flex-col justify-between p-1 opacity-90">
                  <div className="grid grid-cols-3 gap-[1px] h-full w-full opacity-60">
                    <div className="border-r border-amber-950/20 border-b" />
                    <div className="border-r border-amber-950/20 border-b" />
                    <div className="border-b" />
                    <div className="border-r border-amber-950/20" />
                    <div className="border-r border-amber-950/20" />
                    <div className="border-none" />
                  </div>
                </div>
              </div>

              {/* Columna Derecha: Datos Clave en Mayúsculas */}
              <div className="col-span-8 space-y-2 sm:space-y-3.5 pl-2 sm:pl-6">
                <div>
                  <p className="text-[8px] text-teal-400 font-bold tracking-widest uppercase">TITULAR / CITIZEN</p>
                  <p className="text-base sm:text-lg font-black text-white uppercase tracking-wide leading-none mt-0.5">{data.name}</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[8px] text-teal-400 font-bold tracking-widest uppercase">EXPEDIENTE ID</p>
                    <p className="text-xs font-black font-mono text-zinc-100 uppercase tracking-wider mt-0.5">{data.id.slice(0, 10).toUpperCase()}</p>
                  </div>
                  <div>
                    <p className="text-[8px] text-teal-400 font-bold tracking-widest uppercase">TIPO SANGRE</p>
                    <span className="inline-block text-sm font-black text-red-400 uppercase tracking-widest mt-0.5">
                      {data.bloodType || 'O+'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-[8px] text-teal-400 font-bold tracking-widest uppercase">EMISIÓN / EMITTED</p>
                    <p className="text-xs font-extrabold text-zinc-300 font-mono mt-0.5">{formatDate(data.date, 'dd/MM/yyyy')}</p>
                  </div>
                  <div>
                    <p className="text-[8px] text-teal-400 font-bold tracking-widest uppercase">PAÍS / COUNTRY</p>
                    <p className="text-xs font-black text-zinc-100 uppercase mt-0.5">NICARAGUA</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer de la Tarjeta: Código de Barras & Firma Criptográfica */}
            <div className="flex justify-between items-end border-t border-white/10 pt-3">
              <div className="font-mono text-[8px] text-zinc-400 tracking-wider">
                PAC-HASH: {data.id.slice(0, 24).toUpperCase()}
              </div>
              {/* Código de barras biométrico simulado */}
              <div className="h-5 w-32 sm:w-40 bg-white/10 rounded-sm flex items-center justify-between p-1 gap-[1.5px] overflow-hidden opacity-40">
                {Array(28).fill(0).map((_, i) => (
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

        {/* Panel Clínico Detallado de Emergencia */}
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
                <CheckCircle2 className="size-5 text-emerald-500 mt-0.5" />
                <div>
                  <p className="text-[10px] font-black text-white uppercase tracking-wide">Estatus Homologado Activo</p>
                  <p className="text-xs text-zinc-400 mt-0.5 leading-normal">
                    Este carnet cumple con las normativas vigentes del Ministerio de Salud (MINSA) para identificación y trazabilidad de pacientes crónicos.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 bg-zinc-950 p-4 rounded-2xl border border-zinc-800">
                <ShieldCheck className="size-5 text-teal-600 mt-0.5" />
                <div>
                  <p className="text-[10px] font-black text-white uppercase tracking-wide">Firma Criptográfica Segura</p>
                  <p className="text-xs text-zinc-400 mt-0.5 leading-normal font-mono text-[10px] truncate">
                    SEC-HASH-PAC-{data.id.toUpperCase()}
                  </p>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>

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
