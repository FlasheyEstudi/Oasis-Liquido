'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  MapPin,
  Users,
  Activity,
  Calendar,
  AlertTriangle,
  Clock,
  Sparkles,
  TrendingDown,
  Navigation,
  CheckCircle2,
  DollarSign,
  Package,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSankeyData, useNetworkData, useHeatmapData, useRadarData } from '@/hooks/use-api';
import { formatCurrency } from '@/utils/helpers';

// ==========================================
// 👑 1. GRÁFICAS DE SUPER ADMIN
// ==========================================

/**
 * 1.1 Calendario de Ingresos (Mapa de Calor)
 * Muestra los ingresos diarios con bloques de vidrio codificados por color en español.
 * Adaptativo para modo claro y oscuro.
 */
export function RevenueHeatmapCalendar() {
  const [hoveredDay, setHoveredDay] = useState<{ date: string; amount: number; transactions: number } | null>(null);
  
  // Real database fetch via React Query
  const { data: realHeatmap } = useHeatmapData();

  // Generar 28 días de datos reales/simulados
  const generatedFallback = Array.from({ length: 28 }, (_, i) => {
    const dayNum = i + 1;
    const amount = Math.floor(Math.sin(dayNum * 0.5) * 1500) + 2500 + Math.floor(Math.random() * 500);
    const tx = Math.floor(amount / 350) + 1;
    return {
      date: `2026-05-${dayNum.toString().padStart(2, '0')}`,
      revenue: amount,
      transactions: tx,
    };
  });

  const days = realHeatmap?.calendar?.length ? realHeatmap.calendar.map((item: any) => ({
    date: item.date,
    amount: item.revenue,
    transactions: item.transactions || Math.floor(item.revenue / 350) + 1,
  })) : generatedFallback;

  const getColorClass = (revenue: number) => {
    if (revenue > 10000) return "bg-emerald-700 dark:bg-emerald-800 text-white shadow-[0_0_12px_rgba(4,120,87,0.4)]";
    if (revenue > 5000) return "bg-emerald-500 dark:bg-emerald-600 text-white shadow-[0_0_10px_rgba(16,185,129,0.3)]";
    if (revenue > 2000) return "bg-emerald-300 dark:bg-emerald-400 text-emerald-950";
    if (revenue > 0) return "bg-emerald-100 dark:bg-teal-900/60 text-emerald-850 dark:text-emerald-200";
    return "bg-slate-100 dark:bg-teal-950/20 text-slate-400 dark:text-slate-600";
  };

  return (
    <div className="relative glass border border-slate-200/50 dark:border-teal-500/10 p-5 rounded-[24px] bg-white/60 dark:bg-slate-900/40 text-slate-800 dark:text-white overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="text-sm font-bold text-teal-600 dark:text-teal-300 flex items-center gap-1.5">
            <Calendar className="size-4 animate-pulse" /> Calendario de Ingresos (Mapa de Calor)
          </h4>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">Ingresos diarios en las últimas 4 semanas {realHeatmap?.calendar?.length ? '(Datos Reales)' : '(Simulado)'}</p>
        </div>
        <div className="flex gap-2 text-[9px] text-slate-600 dark:text-slate-350">
          <span className="flex items-center gap-1"><span className="size-2 rounded bg-slate-100 dark:bg-teal-950/20" /> C$0</span>
          <span className="flex items-center gap-1"><span className="size-2 rounded bg-emerald-100 dark:bg-teal-900/60" /> &lt;2K</span>
          <span className="flex items-center gap-1"><span className="size-2 rounded bg-emerald-300" /> &lt;5K</span>
          <span className="flex items-center gap-1"><span className="size-2 rounded bg-emerald-500" /> &lt;10K</span>
          <span className="flex items-center gap-1"><span className="size-2 rounded bg-emerald-700" /> 10K+</span>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 relative z-10">
        {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day, i) => (
          <div key={i} className="text-center text-[10px] font-bold text-slate-400 dark:text-slate-500 py-1">{day}</div>
        ))}
        {days.map((day: any, i: number) => {
          const bgClass = getColorClass(day.amount);

          return (
            <motion.div
              key={i}
              whileHover={{ scale: 1.15, zIndex: 20 }}
              onMouseEnter={() => setHoveredDay(day)}
              onMouseLeave={() => setHoveredDay(null)}
              className={cn('h-10 rounded-xl cursor-pointer transition-all duration-300 flex items-center justify-center text-xs font-semibold border border-transparent hover:border-white/40', bgClass)}
            >
              {i + 1}
            </motion.div>
          );
        })}
      </div>

      {/* Tooltip flotante */}
      <AnimatePresence>
        {hoveredDay && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute bottom-3 left-3 right-3 glass-strong border border-slate-350 dark:border-white/20 p-3 rounded-2xl flex items-center justify-between z-30 bg-white/95 dark:bg-slate-900/95 shadow-xl"
          >
            <div className="text-[11px]">
              <p className="text-slate-500 dark:text-slate-400 font-bold">Fecha: {hoveredDay.date}</p>
              <p className="text-slate-450 dark:text-slate-400 font-medium">Transacciones: {hoveredDay.transactions}</p>
              <p className="text-emerald-600 dark:text-emerald-400 font-extrabold text-sm mt-0.5">{formatCurrency(hoveredDay.amount)}</p>
            </div>
            <TrendingUp className="size-5 text-emerald-500 animate-bounce" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function GeographicBubbleMap() {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [mapInstance, setMapInstance] = useState<any>(null);

  const salesByRegion = [
    { region: "Managua", sales: 125000, growth: 15.2, lat: 12.1364, lng: -86.2511 },
    { region: "León", sales: 45000, growth: 8.5, lat: 12.4358, lng: -86.8781 },
    { region: "Masaya", sales: 32000, growth: 12.1, lat: 11.9744, lng: -86.0941 },
    { region: "Granada", sales: 28000, growth: -3.2, lat: 11.9299, lng: -85.956 },
    { region: "Matagalpa", sales: 22000, growth: 10.5, lat: 12.9256, lng: -85.917 },
    { region: "Estelí", sales: 19000, growth: 14.0, lat: 13.0919, lng: -86.3538 },
    { region: "Chinandega", sales: 15000, growth: 6.2, lat: 12.6294, lng: -87.1292 },
    { region: "Rivas", sales: 12000, growth: 9.1, lat: 11.4372, lng: -85.8263 },
    { region: "Juigalpa", sales: 10000, growth: -1.5, lat: 12.1063, lng: -85.3645 },
    { region: "Jinotega", sales: 9500, growth: 4.8, lat: 13.0906, lng: -86.0022 },
    { region: "Bluefields", sales: 8000, growth: 11.2, lat: 12.0137, lng: -83.7635 },
    { region: "Puerto Cabezas", sales: 6500, growth: 5.0, lat: 14.0298, lng: -83.3888 },
  ];

  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current) return;

    // Dynamically import Leaflet to be completely SSR-safe
    import('leaflet').then((L) => {
      import('leaflet/dist/leaflet.css');

      // Check if map is already initialized on this container
      const container = mapRef.current;
      if (!container || (container as any)._leaflet_id) return;

      const isDark = document.documentElement.classList.contains('dark');
      const tileUrl = isDark
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

      const map = L.map(container, { 
        zoomControl: false, 
        attributionControl: false 
      }).setView([12.6, -85.6], 7);

      L.tileLayer(tileUrl, {
        maxZoom: 18,
      }).addTo(map);

      // Add circle markers for sales
      salesByRegion.forEach((item) => {
        const color = item.growth >= 0 ? '#10b981' : '#ef4444';
        const circle = L.circle([item.lat, item.lng], {
          color: color,
          fillColor: color,
          fillOpacity: 0.35,
          radius: Math.sqrt(item.sales) * 160,
          weight: 1.5,
        }).addTo(map);

        circle.bindPopup(`
          <div style="font-family: sans-serif; padding: 4px; min-width: 120px;">
            <h5 style="margin: 0 0 4px 0; font-size: 11px; font-weight: 800; text-transform: uppercase; color: #14b8a6">${item.region}</h5>
            <p style="margin: 0 0 2px 0; font-size: 13px; font-weight: 900; color: ${color}">C$ ${item.sales.toLocaleString()}</p>
            <p style="margin: 0; font-size: 10px; font-weight: 600; color: #6b7280">Crecimiento: ${item.growth >= 0 ? '+' : ''}${item.growth}%</p>
          </div>
        `);
      });

      setMapInstance(map);
    });

    return () => {
      if (mapInstance) {
        mapInstance.remove();
      }
    };
  }, []);

  return (
    <div className="relative glass border border-slate-200/50 dark:border-sky-500/10 p-5 rounded-[24px] bg-white/60 dark:bg-slate-900/40 text-slate-800 dark:text-white overflow-hidden h-72 flex flex-col">
      <div className="mb-2">
        <h4 className="text-sm font-bold text-sky-600 dark:text-sky-300 flex items-center gap-1.5">
          <MapPin className="size-4 animate-pulse" /> Distribución Geográfica de Ventas
        </h4>
        <p className="text-[10px] text-slate-500 dark:text-slate-400">Distribución interactiva de ventas a nivel nacional</p>
      </div>

      <div className="relative flex-1 bg-slate-50/50 dark:bg-teal-950/20 border border-slate-200 dark:border-teal-900/30 rounded-2xl overflow-hidden">
        <div ref={mapRef} className="w-full h-full rounded-2xl" id="nicaragua-leaflet-map" />
      </div>
    </div>
  );
}

export function SalesByEntityChart() {
  const { data: realNetwork } = useNetworkData();

  const defaultData = [
    { name: "Clínica Santa Lucía", sales: 45000, type: 'clinic' },
    { name: "Farmacia Central", sales: 38000, type: 'pharmacy' },
    { name: "Clínica Metropolitana", sales: 29000, type: 'clinic' },
    { name: "Farmacia El Pueblo", sales: 22000, type: 'pharmacy' },
  ];

  const maxVal = Math.max(...defaultData.map(d => d.sales), 1);

  return (
    <div className="relative glass border border-slate-200/50 dark:border-amber-500/10 p-5 rounded-[24px] bg-white/60 dark:bg-slate-900/40 text-slate-800 dark:text-white overflow-hidden h-72 flex flex-col justify-between">
      <div>
        <h4 className="text-sm font-bold text-amber-600 dark:text-amber-300 flex items-center gap-1.5">
          <Activity className="size-4 animate-pulse" /> Ventas por Entidad
        </h4>
        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Ranking de ventas por clínica y farmacia</p>
      </div>

      <div className="space-y-3.5 my-auto">
        {defaultData.map((entity, i) => {
          const percent = (entity.sales / maxVal) * 100;
          const barColor = entity.type === 'clinic' 
            ? 'bg-gradient-to-r from-teal-400 to-emerald-500' 
            : 'bg-gradient-to-r from-sky-400 to-indigo-500';

          return (
            <div key={i} className="space-y-1">
              <div className="flex justify-between items-center text-[10px] font-bold">
                <span className="text-slate-700 dark:text-slate-250 truncate max-w-[170px]">{entity.name}</span>
                <span className="text-slate-900 dark:text-white font-extrabold">{formatCurrency(entity.sales)}</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800/80 overflow-hidden border border-slate-200/30 dark:border-slate-700/30">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percent}%` }}
                  transition={{ duration: 1.2, ease: 'easeOut', delay: i * 0.1 }}
                  className={cn('h-full rounded-full', barColor)}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function PredictiveKPIGauges() {
  const percentage = 88.4;

  return (
    <div className="relative glass border border-slate-200/50 dark:border-teal-500/10 p-5 rounded-[24px] bg-white/60 dark:bg-slate-900/40 text-slate-800 dark:text-white flex flex-col justify-between h-52">
      <div>
        <h4 className="text-sm font-bold text-teal-600 dark:text-teal-300 flex items-center gap-1.5">
          <Sparkles className="size-4 animate-spin" /> KPIs Principales
        </h4>
        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Cumplimiento de meta y análisis predictivo</p>
      </div>

      <div className="space-y-3.5 my-auto">
        {/* Meta mensual progress bar */}
        <div>
          <div className="flex justify-between items-center text-[10px] font-bold mb-1">
            <span className="text-slate-500 dark:text-slate-400 font-bold">Meta Mensual</span>
            <span className="text-teal-600 dark:text-teal-400 font-extrabold">{percentage}%</span>
          </div>
          <div className="h-3 w-full rounded-full bg-slate-100 dark:bg-slate-800/80 overflow-hidden border border-slate-200/30 dark:border-slate-700/30 relative">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              className="h-full rounded-full bg-gradient-to-r from-teal-400 to-emerald-500 shadow-[0_0_8px_rgba(20,184,166,0.3)]"
            />
          </div>
        </div>

        {/* Dynamic metrics grid */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-emerald-500/10 dark:bg-emerald-950/20 border border-emerald-500/20 px-2 py-1.5 rounded-xl text-center">
            <p className="text-[8px] text-emerald-600 dark:text-emerald-400 font-bold uppercase truncate">Crecimiento</p>
            <p className="text-xs font-black text-slate-850 dark:text-white mt-0.5">+14.2%</p>
          </div>
          <div className="bg-sky-500/10 dark:bg-sky-950/20 border border-sky-500/20 px-2 py-1.5 rounded-xl text-center">
            <p className="text-[8px] text-sky-600 dark:text-sky-400 font-bold uppercase truncate">Ahorro Log.</p>
            <p className="text-xs font-black text-slate-850 dark:text-white mt-0.5">-8.5%</p>
          </div>
          <div className="bg-violet-500/10 dark:bg-violet-950/20 border border-violet-500/20 px-2 py-1.5 rounded-xl text-center">
            <p className="text-[8px] text-violet-600 dark:text-violet-400 font-bold uppercase truncate">Conversión</p>
            <p className="text-xs font-black text-slate-850 dark:text-white mt-0.5">69%</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 1.5 Diagrama de Flujo Transaccional (Sankey)
 * Muestra el flujo de conversión desde la consulta médica hasta la entrega del medicamento.
 * Adaptativo para modo claro y oscuro.
 */
export function SankeyFlowDiagram() {
  const { data: realSankey } = useSankeyData();

  // Baseline values or API response values
  const links = realSankey?.links || [];
  const cVal = links.find((l: any) => l.source === 0 && l.target === 1)?.value ?? 1240;
  const pVal = links.find((l: any) => l.source === 1 && l.target === 2)?.value ?? 980;
  const sVal = links.find((l: any) => l.source === 2 && l.target === 3)?.value ?? 680;
  const dVal = links.find((l: any) => l.source === 3 && l.target === 4)?.value ?? 590;

  return (
    <div className="relative glass border border-slate-200/50 dark:border-teal-500/10 p-5 rounded-[24px] bg-white/60 dark:bg-slate-900/40 text-slate-800 dark:text-white overflow-hidden h-72 flex flex-col">
      <div className="mb-4">
        <h4 className="text-sm font-bold text-teal-600 dark:text-teal-300 flex items-center gap-1.5">
          <TrendingUp className="size-4" /> Diagrama de Flujo Transaccional (Sankey)
        </h4>
        <p className="text-[10px] text-slate-500 dark:text-slate-400">Embudo de conversión de la receta médica al delivery {realSankey?.links?.length ? '(Datos Reales)' : '(Simulado)'}</p>
      </div>

      <div className="relative flex-1 flex flex-col justify-between py-2 px-1">
        {/* Líneas de flujo animadas */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
          <path d="M60 25 C100 25, 120 40, 160 40" stroke="url(#streamTeal)" strokeWidth="16" fill="none" opacity="0.35" />
          <path d="M160 40 C200 40, 220 55, 260 55" stroke="url(#streamEmerald)" strokeWidth="12" fill="none" opacity="0.35" />
          <path d="M260 55 C300 55, 310 70, 350 70" stroke="url(#streamSky)" strokeWidth="8" fill="none" opacity="0.35" />

          <defs>
            <linearGradient id="streamTeal" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#14b8a6" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
            <linearGradient id="streamEmerald" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#0ea5e9" />
            </linearGradient>
            <linearGradient id="streamSky" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#0ea5e9" />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>
          </defs>
        </svg>

        {/* Nodos de flujo */}
        <div className="flex justify-between items-center h-full relative z-10 text-[9px] font-bold">
          {/* Nodo 1 */}
          <div className="bg-teal-500/10 dark:bg-teal-500/20 border border-teal-500/30 dark:border-teal-500/40 p-2 rounded-xl text-center shadow-sm w-20">
            <p className="text-teal-600 dark:text-teal-300">Consulta</p>
            <p className="text-slate-800 dark:text-white text-[11px] font-black">{cVal.toLocaleString()}</p>
          </div>
          {/* Nodo 2 */}
          <div className="bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 dark:border-emerald-500/40 p-2 rounded-xl text-center shadow-sm w-20">
            <p className="text-emerald-600 dark:text-emerald-300">Recetas</p>
            <p className="text-slate-800 dark:text-white text-[11px] font-black">{pVal.toLocaleString()}</p>
          </div>
          {/* Nodo 3 */}
          <div className="bg-sky-500/10 dark:bg-sky-500/20 border border-sky-500/30 dark:border-sky-500/40 p-2 rounded-xl text-center shadow-sm w-20">
            <p className="text-sky-600 dark:text-sky-300">POS Surtido</p>
            <p className="text-slate-800 dark:text-white text-[11px] font-black">{sVal.toLocaleString()}</p>
          </div>
          {/* Nodo 4 */}
          <div className="bg-indigo-500/10 dark:bg-indigo-500/20 border border-indigo-500/30 dark:border-indigo-500/40 p-2 rounded-xl text-center shadow-sm w-20">
            <p className="text-indigo-600 dark:text-indigo-300">Entregados</p>
            <p className="text-slate-800 dark:text-white text-[11px] font-black">{dVal.toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 1.6 Monitoreo de Oasis en Vivo (Llenado del espacio vacío del panel de control)
 * Muestra el estado activo de microservicios y bases de datos.
 * Adaptativo para modo claro y oscuro.
 */
export function RealTimeSystemStatus() {
  return (
    <div className="relative glass border border-slate-200/50 dark:border-teal-500/10 p-5 rounded-[24px] bg-white/60 dark:bg-slate-900/40 text-slate-800 dark:text-white flex flex-col justify-between h-44 overflow-hidden">
      <div>
        <h4 className="text-xs font-bold text-teal-600 dark:text-teal-300 flex items-center gap-1.5">
          <Activity className="size-3.5 animate-pulse" /> Monitoreo de Oasis en Vivo
        </h4>
        <p className="text-[9px] text-slate-500 dark:text-slate-400">Estado de microservicios y sincronización local</p>
      </div>

      <div className="grid grid-cols-2 gap-2 my-2 text-[9px] font-bold">
        <div className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800/50">
          <span className="size-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          <span className="text-slate-700 dark:text-slate-300">Base de Datos</span>
        </div>
        <div className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800/50">
          <span className="size-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          <span className="text-slate-700 dark:text-slate-300">FCM Push</span>
        </div>
        <div className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800/50">
          <span className="size-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          <span className="text-slate-700 dark:text-slate-300">Firma HSM</span>
        </div>
        <div className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800/50">
          <span className="size-2 rounded-full bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
          <span className="text-slate-700 dark:text-slate-300">Servidor GIS</span>
        </div>
      </div>

      <div className="flex justify-between items-center text-[8px] text-slate-500 dark:text-slate-400 pt-1.5 border-t border-slate-100 dark:border-slate-800/50">
        <span>Ping global: <span className="text-emerald-500 font-extrabold">12ms</span></span>
        <span>Sede Activa: <span className="text-teal-500 font-extrabold">Nicaragua-01</span></span>
      </div>
    </div>
  );
}


// ==========================================
// 🏥 2. GRÁFICAS DE DUEÑO DE CLÍNICA
// ==========================================

/**
 * 2.1 Radar de Desempeño Circular
 * Gráfico interactivo para comparar las dimensiones de rendimiento de los médicos.
 * Adaptativo para modo claro y oscuro.
 */
export function CircularPerformanceRadar() {
  const [activeDimension, setActiveDimension] = useState<string | null>(null);

  const { data: realRadar } = useRadarData();

  const doctor = realRadar?.doctors?.[0];
  const metrics = doctor?.metrics;

  const dimensions = [
    { label: 'Puntualidad', val: metrics?.puntualidad ?? 92, angle: 0 },
    { label: 'Pacientes Satisfechos', val: metrics?.satisfaccion ?? 96, angle: 72 },
    { label: 'Efectividad Receta', val: 85, angle: 144 },
    { label: 'Rapidez Consulta', val: 78, angle: 216 },
    { label: 'Historial Clínico', val: 90, angle: 288 },
  ];

  return (
    <div className="relative glass border border-slate-200/50 dark:border-teal-500/10 p-5 rounded-[24px] bg-white/60 dark:bg-slate-900/40 text-slate-800 dark:text-white overflow-hidden h-72 flex flex-col">
      <div className="mb-2">
        <h4 className="text-sm font-bold text-teal-600 dark:text-teal-300 flex items-center gap-1.5">
          <Users className="size-4" /> Radar de Desempeño Circular
        </h4>
        <p className="text-[10px] text-slate-500 dark:text-slate-400">Rendimiento promedio de {doctor?.name || 'médicos'} en 5 dimensiones {realRadar?.doctors?.length ? '(Datos Reales)' : '(Simulado)'}</p>
      </div>

      <div className="relative flex-1 flex items-center justify-center">
        <svg className="size-36" viewBox="0 0 100 100">
          {/* Guías circulares */}
          <circle cx="50" cy="50" r="40" className="stroke-slate-200 dark:stroke-slate-800" strokeWidth="0.5" fill="none" />
          <circle cx="50" cy="50" r="25" className="stroke-slate-200 dark:stroke-slate-800" strokeWidth="0.5" fill="none" />
          <circle cx="50" cy="50" r="10" className="stroke-slate-200 dark:stroke-slate-800" strokeWidth="0.5" fill="none" />

          {/* Área del radar */}
          <polygon
            points={dimensions.map(d => {
              const rad = (d.angle * Math.PI) / 180;
              const r = (d.val / 100) * 40;
              const x = 50 + r * Math.sin(rad);
              const y = 50 - r * Math.cos(rad);
              return `${x},${y}`;
            }).join(' ')}
            fill="rgba(20, 184, 166, 0.25)"
            stroke="#14b8a6"
            strokeWidth="1.5"
          />

          {/* Puntos interactivos */}
          {dimensions.map((d, idx) => {
            const rad = (d.angle * Math.PI) / 180;
            const r = (d.val / 100) * 40;
            const x = 50 + r * Math.sin(rad);
            const y = 50 - r * Math.cos(rad);

            return (
              <circle
                key={idx}
                cx={x}
                cy={y}
                r="3"
                fill="#34d399"
                className="cursor-pointer hover:r-4 transition-all"
                onClick={() => setActiveDimension(d.label === activeDimension ? null : `${d.label}: ${d.val}%`)}
              />
            );
          })}
        </svg>

        <AnimatePresence>
          {activeDimension && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-2 bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 dark:border-emerald-500/40 px-3 py-1 rounded-xl text-[9px] text-emerald-600 dark:text-emerald-300 font-bold bg-white dark:bg-slate-900 shadow-md"
            >
              {activeDimension}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/**
 * 2.2 Onda de Citas (Carga de Trabajo)
 * Curva interactiva para ver la carga de trabajo de citas por hora.
 * Adaptativo para modo claro y oscuro.
 */
export function AppointmentWaveform() {
  return (
    <div className="relative glass border border-slate-200/50 dark:border-teal-500/10 p-5 rounded-[24px] bg-white/60 dark:bg-slate-900/40 text-slate-800 dark:text-white overflow-hidden h-72 flex flex-col justify-between">
      <div>
        <h4 className="text-sm font-bold text-teal-600 dark:text-teal-300 flex items-center gap-1.5">
          <Activity className="size-4 animate-pulse" /> Onda de Citas (Carga de Trabajo)
        </h4>
        <p className="text-[10px] text-slate-500 dark:text-slate-400">Distribución de carga de citas por horas</p>
      </div>

      <div className="relative flex-1 flex items-center justify-center">
        <svg className="w-full h-24" viewBox="0 0 200 60" preserveAspectRatio="none">
          <path
            d="M0 30 Q30 5, 60 40 T120 20 T180 45 T200 30 L200 60 L0 60 Z"
            fill="url(#waveGradient)"
            opacity="0.3"
          />
          <path
            d="M0 30 Q30 5, 60 40 T120 20 T180 45 T200 30"
            stroke="#14b8a6"
            strokeWidth="2.5"
            fill="none"
          />
          <defs>
            <linearGradient id="waveGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#14b8a6" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>
          </defs>
        </svg>

        <div className="absolute top-12 left-16 bg-white/90 dark:bg-slate-900/80 border border-slate-200 dark:border-teal-500/20 px-2 py-1 rounded-xl text-[9px] text-center shadow-md">
          <p className="text-teal-600 dark:text-teal-400 font-extrabold">Pico de Demanda</p>
          <p className="text-slate-800 dark:text-white font-bold">10:00 AM - 12:00 PM</p>
        </div>
      </div>

      <div className="flex justify-between text-[9px] text-slate-400 dark:text-slate-500 font-bold px-1">
        <span>08 AM</span>
        <span>10 AM</span>
        <span>12 PM</span>
        <span>02 PM</span>
        <span>04 PM</span>
        <span>06 PM</span>
      </div>
    </div>
  );
}

/**
 * 2.3 Línea de Tiempo del Paciente Crónico
 * Hitos clínicos de los pacientes en tratamiento activo.
 * Adaptativo para modo claro y oscuro.
 */
export function PatientJourneyTimeline() {
  const journeys = [
    { label: 'E. Rosales (Cardio)', milestones: ['Diagnóstico', 'Medicación A', 'Chequeo SLA', 'Estable'], color: 'bg-emerald-500' },
    { label: 'M. Zelaya (Diabetes)', milestones: ['Monitoreo', 'Ajuste Dosis', 'Insulina', 'Controlado'], color: 'bg-sky-500' },
  ];

  return (
    <div className="relative glass border border-slate-200/50 dark:border-teal-500/10 p-5 rounded-[24px] bg-white/60 dark:bg-slate-900/40 text-slate-800 dark:text-white flex flex-col justify-between h-48">
      <div>
        <h4 className="text-sm font-bold text-teal-600 dark:text-teal-300 flex items-center gap-1.5">
          <Clock className="size-4 animate-spin" /> Línea de Tiempo del Paciente Crónico
        </h4>
        <p className="text-[10px] text-slate-500 dark:text-slate-400">Seguimiento cronológico de hitos en pacientes</p>
      </div>

      <div className="space-y-4 py-1">
        {journeys.map((j, i) => (
          <div key={i} className="space-y-1.5">
            <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300">{j.label}</p>
            <div className="flex items-center justify-between relative px-2">
              <div className="absolute left-2 right-2 h-1 bg-slate-200 dark:bg-slate-800 rounded z-0" />
              {j.milestones.map((m, idx) => (
                <div key={idx} className="relative z-10 flex flex-col items-center">
                  <div className={cn('size-3 rounded-full shadow-[0_0_8px_rgba(20,184,166,0.4)]', j.color)} />
                  <span className="text-[8px] text-slate-450 dark:text-slate-400 mt-1 font-semibold">{m}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 2.4 Medidor de Predicción de Inasistencias
 * Estimador de tasa y probabilidad de inasistencias en citas.
 * Adaptativo para modo claro y oscuro.
 */
export function NoShowPredictionGauge() {
  return (
    <div className="relative glass border border-slate-200/50 dark:border-teal-500/10 p-5 rounded-[24px] bg-white/60 dark:bg-slate-900/40 text-slate-800 dark:text-white flex flex-col justify-between h-48">
      <div>
        <h4 className="text-sm font-bold text-rose-600 dark:text-rose-300 flex items-center gap-1.5">
          <AlertTriangle className="size-4 text-rose-500 dark:text-rose-400 animate-bounce" /> Medidor de Inasistencias (No-Show)
        </h4>
        <p className="text-[10px] text-slate-500 dark:text-slate-400">Riesgo estimado de inasistencias de pacientes</p>
      </div>

      <div className="flex items-center gap-4 py-2">
        <div className="bg-rose-500/10 border border-rose-500/20 px-3 py-2 rounded-2xl flex-1 text-center">
          <p className="text-[9px] text-rose-650 dark:text-rose-400 font-bold uppercase tracking-wider">Riesgo Promedio</p>
          <p className="text-xl font-extrabold text-rose-600 dark:text-rose-500">12.4%</p>
        </div>
        <div className="text-left text-[9px] space-y-1 text-slate-500 dark:text-slate-400">
          <p>• Día de mayor riesgo: <span className="text-slate-800 dark:text-white font-bold">Viernes</span></p>
          <p>• Factor principal: <span className="text-slate-800 dark:text-white font-bold">Clima/Lluvia</span></p>
          <p>• Horario crítico: <span className="text-slate-800 dark:text-white font-bold">18:00 hrs</span></p>
        </div>
      </div>
    </div>
  );
}


// ==========================================
// 💊 3. GRÁFICAS DE DUEÑO DE FARMACIA
// ==========================================

/**
 * 3.1 Gráfico de Velocidad de Inventario
 * Muestra la rapidez con la que rotan los productos en stock.
 * Adaptativo para modo claro y oscuro.
 */
export function InventoryVelocityChart() {
  const items = [
    { name: 'Ibuprofeno 400mg', rate: 94, color: 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.3)]' },
    { name: 'Paracetamol 500mg', rate: 82, color: 'bg-teal-500 shadow-[0_0_10px_rgba(20,184,166,0.3)]' },
    { name: 'Amoxicilina 500mg', rate: 65, color: 'bg-sky-500 shadow-[0_0_10px_rgba(14,165,233,0.3)]' },
  ];

  return (
    <div className="relative glass border border-slate-200/50 dark:border-sky-500/10 p-5 rounded-[24px] bg-white/60 dark:bg-slate-900/40 text-slate-800 dark:text-white flex flex-col justify-between">
      <div>
        <h4 className="text-sm font-bold text-sky-600 dark:text-sky-300 flex items-center gap-1.5">
          <Package className="size-4" /> Gráfico de Velocidad de Inventario
        </h4>
        <p className="text-[10px] text-slate-500 dark:text-slate-400">Velocidad de rotación y demanda del catálogo</p>
      </div>

      <div className="space-y-3 py-2">
        {items.map((item, i) => (
          <div key={i} className="space-y-1">
            <div className="flex justify-between text-[9px] font-bold">
              <span className="text-slate-600 dark:text-slate-300">{item.name}</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">{item.rate}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${item.rate}%` }}
                transition={{ duration: 1.2, ease: 'easeOut', delay: i * 0.1 }}
                className={cn('h-full rounded-full', item.color)}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 3.2 Línea de Tiempo de Vencimiento de Stock
 * Registro cronológico de advertencias de medicamentos por expirar.
 * Adaptativo para modo claro y oscuro.
 */
export function StockExpiryTimeline() {
  const alerts = [
    { name: 'Insulina Glargina', expiry: 'En 15 días', risk: 'Crítico', icon: AlertTriangle, color: 'text-red-600 dark:text-red-500 bg-red-500/10 border-red-500/20' },
    { name: 'Vitamina C Forte', expiry: 'En 28 días', risk: 'Medio', icon: AlertTriangle, color: 'text-amber-600 dark:text-amber-500 bg-amber-500/10 border-amber-500/20' },
  ];

  return (
    <div className="relative glass border border-slate-200/50 dark:border-sky-500/10 p-5 rounded-[24px] bg-white/60 dark:bg-slate-900/40 text-slate-800 dark:text-white flex flex-col justify-between h-48">
      <div>
        <h4 className="text-sm font-bold text-rose-600 dark:text-rose-300 flex items-center gap-1.5">
          <AlertTriangle className="size-4 animate-bounce text-rose-500 dark:text-rose-400" /> Vencimiento de Stock
        </h4>
        <p className="text-[10px] text-slate-500 dark:text-slate-400">Control preventivo de fechas de caducidad</p>
      </div>

      <div className="space-y-2 py-1">
        {alerts.map((item, idx) => (
          <div key={idx} className={cn('flex items-center justify-between p-2 rounded-xl border text-[9px]', item.color)}>
            <div className="flex items-center gap-2">
              <item.icon className="size-4 shrink-0" />
              <div>
                <p className="font-bold text-slate-900 dark:text-white">{item.name}</p>
                <p className="text-slate-650 dark:text-slate-400 font-medium">{item.expiry}</p>
              </div>
            </div>
            <span className="font-black uppercase tracking-wider text-[8px]">{item.risk}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 3.3 Mini-gráficos de Pronóstico de Demanda
 * Visualización compacta de proyecciones futuras de demanda.
 * Adaptativo para modo claro y oscuro.
 */
export function DemandForecastSparklines() {
  return (
    <div className="relative glass border border-slate-200/50 dark:border-sky-500/10 p-5 rounded-[24px] bg-white/60 dark:bg-slate-900/40 text-slate-800 dark:text-white flex flex-col justify-between">
      <div>
        <h4 className="text-sm font-bold text-sky-600 dark:text-sky-300 flex items-center gap-1.5">
          <TrendingUp className="size-4 animate-pulse" /> Pronósticos de Demanda (Sparklines)
        </h4>
        <p className="text-[10px] text-slate-500 dark:text-slate-400">Tendencias futuras de compra estimadas</p>
      </div>

      <div className="flex items-center justify-between py-2 gap-4">
        <div className="space-y-1.5 flex-1">
          <div className="flex justify-between items-center text-[9px]">
            <span className="font-bold text-slate-600 dark:text-slate-300">Antihistamínicos</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">+18.4%</span>
          </div>
          <svg className="w-full h-8" viewBox="0 0 100 20" preserveAspectRatio="none">
            <path d="M0 15 L20 10 L40 18 L60 8 L80 12 L100 2" stroke="#10b981" strokeWidth="2" fill="none" />
          </svg>
        </div>

        <div className="space-y-1.5 flex-1">
          <div className="flex justify-between items-center text-[9px]">
            <span className="font-bold text-slate-600 dark:text-slate-300">Analgésicos</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">+12.1%</span>
          </div>
          <svg className="w-full h-8" viewBox="0 0 100 20" preserveAspectRatio="none">
            <path d="M0 12 L20 16 L40 8 L60 14 L80 6 L100 3" stroke="#38bdf8" strokeWidth="2" fill="none" />
          </svg>
        </div>
      </div>
    </div>
  );
}

/**
 * 3.4 Burbuja de Eficiencia de Repartidores
 * Calificación de desempeño de delivery activo por valoración y velocidad.
 * Adaptativo para modo claro y oscuro.
 */
export function DriverEfficiencyBubble() {
  const drivers = [
    { name: 'C. Jarquín', speed: 92, rating: 4.9, color: 'bg-emerald-450 dark:bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.4)]' },
    { name: 'O. Blandón', speed: 85, rating: 4.7, color: 'bg-teal-500 shadow-[0_0_8px_rgba(20,184,166,0.4)]' },
    { name: 'J. Zelaya', speed: 78, rating: 4.5, color: 'bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.4)]' },
  ];

  return (
    <div className="relative glass border border-slate-200/50 dark:border-sky-500/10 p-5 rounded-[24px] bg-white/60 dark:bg-slate-900/40 text-slate-800 dark:text-white overflow-hidden h-72 flex flex-col justify-between">
      <div>
        <h4 className="text-sm font-bold text-sky-600 dark:text-sky-300 flex items-center gap-1.5">
          <Navigation className="size-4 animate-spin" /> Burbuja de Eficiencia de Repartidores
        </h4>
        <p className="text-[10px] text-slate-500 dark:text-slate-400">Eficiencia y valoración de repartidores de delivery</p>
      </div>

      <div className="relative flex-1 bg-slate-50/50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-900/50 rounded-2xl p-4 flex items-center justify-around">
        {drivers.map((d, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <motion.div
              whileHover={{ scale: 1.15 }}
              className={cn('size-10 rounded-full flex items-center justify-center text-xs font-black text-slate-900 dark:text-slate-900', d.color)}
            >
              {d.rating}
            </motion.div>
            <p className="text-[9px] font-bold text-slate-700 dark:text-slate-200">{d.name}</p>
            <span className="text-[8px] text-slate-450 dark:text-slate-500 font-bold">Eficiencia: {d.speed}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 3.5 Tarjeta de Ventas en Vivo
 * Panel interactivo con contador automático de ventas en vivo.
 * Adaptativo para modo claro y oscuro.
 */
export function SalesMicroAnimationCards() {
  const [salesVal, setSalesVal] = useState(1420);

  // Simulación incremental automatizada
  useEffect(() => {
    const timer = setInterval(() => {
      setSalesVal(prev => prev + Math.floor(Math.random() * 15) + 5);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative glass border border-emerald-500/10 p-5 rounded-[24px] bg-white/60 dark:bg-slate-900/40 text-slate-800 dark:text-white overflow-hidden flex flex-col justify-between">
      <div className="flex justify-between items-center">
        <div>
          <h4 className="text-sm font-bold text-emerald-600 dark:text-emerald-300 flex items-center gap-1.5">
            <DollarSign className="size-4 animate-bounce" /> Transacciones en Vivo
          </h4>
          <p className="text-[10px] text-slate-500 dark:text-slate-400">Ventas procesadas hoy (Actualizado en vivo)</p>
        </div>
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="size-2 rounded-full bg-emerald-500 dark:bg-emerald-400 shadow-[0_0_8px_#34d399]"
        />
      </div>

      <div className="py-4 text-center">
        <motion.h2
          key={salesVal}
          initial={{ opacity: 0.7, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-500 dark:from-emerald-400 dark:to-teal-300 font-mono tracking-tight"
        >
          C$ {salesVal.toLocaleString()}
        </motion.h2>
        <span className="text-[8px] tracking-widest text-slate-400 dark:text-slate-500 font-black uppercase mt-1 block">
          INCLUYE IMPUESTOS
        </span>
      </div>

      <div className="flex justify-between text-[9px] text-slate-500 dark:text-slate-400 font-bold bg-slate-50 dark:bg-slate-950/20 p-2 rounded-xl border border-slate-200 dark:border-slate-900/50">
        <span>Pedidos de hoy: <span className="text-slate-800 dark:text-white">48</span></span>
        <span>Ticket promedio: <span className="text-emerald-600 dark:text-emerald-400">C$ 29.5</span></span>
      </div>
    </div>
  );
}
