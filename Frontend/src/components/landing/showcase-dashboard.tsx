'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Truck, Users, Sparkles, Heart, QrCode, RefreshCw, Navigation, Play, UserCheck, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ShowcaseDashboard() {
  const [activeTab, setActiveTab] = useState<'prescription' | 'tracking' | 'family'>('prescription');
  
  // Tab 1 States: Prescription Verification
  const [isScanning, setIsScanning] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  // Tab 2 States: GPS Tracker simulation
  const [deliveryProgress, setDeliveryProgress] = useState(0);
  const [eta, setEta] = useState(7);
  const [distance, setDistance] = useState(2.4);

  // Tab 3 States: Family Pin Generative
  const [familyCode, setFamilyCode] = useState('294857');
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Auto animate GPS progress
  useEffect(() => {
    if (activeTab !== 'tracking') return;
    const interval = setInterval(() => {
      setDeliveryProgress((prev) => {
        if (prev >= 100) {
          setEta(7);
          setDistance(2.4);
          return 0;
        }
        const next = prev + 5;
        const newDistance = Math.max(0.1, (2.4 * (100 - next)) / 100);
        const newEta = Math.max(1, Math.ceil((7 * (100 - next)) / 100));
        setDistance(Number(newDistance.toFixed(1)));
        setEta(newEta);
        return next;
      });
    }, 800);
    return () => clearInterval(interval);
  }, [activeTab]);

  const handleVerify = () => {
    if (isScanning) return;
    setIsScanning(true);
    setIsVerified(false);
    setTimeout(() => {
      setIsScanning(false);
      setIsVerified(true);
    }, 1800);
  };

  const handleGeneratePin = () => {
    if (isRegenerating) return;
    setIsRegenerating(true);
    setTimeout(() => {
      const randomPin = Math.floor(100000 + Math.random() * 900000).toString();
      setFamilyCode(randomPin);
      setIsRegenerating(false);
    }, 600);
  };

  return (
    <div className="relative w-full max-w-[500px] rounded-[2.5rem] bg-white/40 dark:bg-zinc-950/40 border border-slate-200/50 dark:border-zinc-800/30 backdrop-blur-3xl p-6 shadow-[0_32px_64px_rgba(0,0,0,0.1),inset_1px_1px_4px_rgba(255,255,255,0.15)] flex flex-col gap-5 overflow-hidden transition-all duration-300">
      
      {/* Floating Holographic Glow */}
      <div className="absolute top-[-20%] right-[-10%] size-60 rounded-full bg-teal-500/10 dark:bg-teal-500/5 blur-[50px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] size-60 rounded-full bg-cyan-500/10 dark:bg-cyan-500/5 blur-[50px] pointer-events-none" />

      {/* Showcase Tab Selector header */}
      <div className="flex items-center justify-between gap-1 p-1 rounded-2xl bg-slate-100/60 dark:bg-zinc-900/60 border border-slate-200/40 dark:border-zinc-800/40 relative z-10">
        {[
          { id: 'prescription', label: 'Receta QR', icon: <QrCode className="size-3.5" /> },
          { id: 'tracking', label: 'Rastreo GPS', icon: <Truck className="size-3.5" /> },
          { id: 'family', label: 'Núcleo', icon: <Users className="size-3.5" /> },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-[10px] font-black tracking-wider uppercase transition-all duration-300 relative cursor-pointer",
              activeTab === tab.id
                ? "bg-white dark:bg-zinc-800 text-teal-600 dark:text-teal-400 shadow-sm border border-slate-200/40 dark:border-zinc-700/30"
                : "text-slate-500 dark:text-zinc-500 hover:text-slate-800 dark:hover:text-zinc-300"
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Tab Screen Panel */}
      <div className="relative min-h-[280px] flex flex-col justify-between z-10">
        <AnimatePresence mode="wait">
          
          {/* TAB 1: Prescription QR Simulator */}
          {activeTab === 'prescription' && (
            <motion.div
              key="prescription"
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -10 }}
              className="flex flex-col gap-4 flex-grow justify-between"
            >
              <div className="rounded-2xl p-4 bg-white/60 dark:bg-zinc-900/40 border border-slate-200/50 dark:border-zinc-800/40 shadow-sm flex items-center gap-4 relative overflow-hidden">
                {/* Laser scan glowing bar */}
                {isScanning && (
                  <motion.div
                    animate={{ y: ['-10%', '110%', '-10%'] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-teal-400 to-transparent shadow-[0_0_8px_#2dd4bf] z-20 pointer-events-none"
                  />
                )}

                {/* QR Block container */}
                <div className="relative size-20 rounded-2xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 flex items-center justify-center p-2 shadow-sm flex-shrink-0 group overflow-hidden">
                  <QrCode className="size-full text-slate-800 dark:text-white" />
                  <div className="absolute inset-0 bg-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                <div className="flex-grow space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                      Médica Certificada
                    </span>
                    <span className="text-[8px] text-slate-400 dark:text-zinc-500 font-bold font-mono">
                      ID: #QA-9285
                    </span>
                  </div>
                  <h4 className="text-xs font-black text-slate-800 dark:text-zinc-200">Amoxicilina 500mg</h4>
                  <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-snug font-light">
                    Surtido: 3 tabletas diarias • Paciente: María G.
                  </p>
                </div>
              </div>

              {/* Action and verification Status */}
              <div className="space-y-3">
                <AnimatePresence mode="wait">
                  {isVerified ? (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 flex items-center gap-3 text-xs text-emerald-700 dark:text-emerald-400 font-bold"
                    >
                      <ShieldCheck className="size-5 text-emerald-500 flex-shrink-0" />
                      <div className="flex-grow">
                        <p className="text-[11px] font-extrabold leading-tight">Receta Verificada Correctamente</p>
                        <p className="text-[9px] font-medium opacity-80 mt-0.5 leading-none font-mono">Firma HMAC: SHA256-VALIDA • Respaldo MINSA</p>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="rounded-2xl border border-slate-200/50 dark:border-zinc-800/40 bg-slate-50/50 dark:bg-zinc-900/30 px-4 py-3 flex items-center gap-3 text-xs text-slate-600 dark:text-zinc-400 font-bold"
                    >
                      <Heart className="size-5 text-teal-500 animate-pulse flex-shrink-0" />
                      <div className="flex-grow">
                        <p className="text-[11px] font-extrabold leading-tight">Verificación Holográfica 2026</p>
                        <p className="text-[9px] font-medium opacity-80 mt-0.5 leading-none">Haz click abajo para verificar la integridad</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  type="button"
                  onClick={handleVerify}
                  disabled={isScanning}
                  className="clay-btn-primary w-full h-11 rounded-xl text-xs font-black uppercase flex items-center justify-center gap-2 relative transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isScanning ? (
                    <>
                      <RefreshCw className="size-4 animate-spin" />
                      Escaneando Criptografía...
                    </>
                  ) : (
                    <>
                      Simular Escaneo QR
                      <Sparkles className="size-4" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

          {/* TAB 2: GPS Telemetry Simulator */}
          {activeTab === 'tracking' && (
            <motion.div
              key="tracking"
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -10 }}
              className="flex flex-col gap-4 flex-grow justify-between"
            >
              {/* Fake satellite map grid */}
              <div className="rounded-2xl h-36 bg-slate-100 dark:bg-zinc-900/80 border border-slate-200/50 dark:border-zinc-800/50 relative overflow-hidden flex items-center justify-center shadow-sm">
                
                {/* Tech HUD Grid lines */}
                <div className="absolute inset-0 bg-[radial-gradient(#2dd4bf_1px,transparent_1px)] [background-size:16px_16px] opacity-15" />
                <div className="absolute inset-x-0 h-px bg-slate-200/50 dark:bg-zinc-800/50 top-1/2" />
                <div className="absolute inset-y-0 w-px bg-slate-200/50 dark:bg-zinc-800/50 left-1/2" />

                {/* Simulated delivery route path line */}
                <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M 50,100 Q 150,30 250,110 T 400,40"
                    fill="none"
                    stroke="rgba(20,184,166,0.25)"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 50,100 Q 150,30 250,110 T 400,40"
                    fill="none"
                    stroke="#2dd4bf"
                    strokeWidth="4"
                    strokeDasharray="8 6"
                    strokeLinecap="round"
                  />
                </svg>

                {/* Driver dot moving on route */}
                <motion.div
                  className="absolute size-7 bg-teal-500 rounded-full border border-white dark:border-zinc-900 shadow-md flex items-center justify-center z-10"
                  style={{
                    left: `${Math.min(92, Math.max(5, deliveryProgress))}%`,
                    top: `${48 + Math.sin(deliveryProgress / 10) * 20}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <Navigation className="size-3.5 text-white rotate-45 animate-pulse" />
                </motion.div>

                {/* Location markers */}
                <div className="absolute top-[80px] left-[50px] flex flex-col items-center">
                  <div className="size-2 rounded-full bg-teal-500 ring-4 ring-teal-500/25" />
                  <span className="text-[7px] font-black uppercase text-slate-500 dark:text-zinc-400 bg-white/80 dark:bg-zinc-950/80 px-1 py-0.5 rounded border border-slate-200/40 mt-1 shadow-sm font-mono">FAR-SUD</span>
                </div>

                <div className="absolute top-[20px] right-[50px] flex flex-col items-center">
                  <div className="size-2 rounded-full bg-rose-500 ring-4 ring-rose-500/25" />
                  <span className="text-[7px] font-black uppercase text-slate-500 dark:text-zinc-400 bg-white/80 dark:bg-zinc-950/80 px-1 py-0.5 rounded border border-slate-200/40 mt-1 shadow-sm font-mono">TÚ</span>
                </div>
              </div>

              {/* Satelital Live Stats */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl p-2 bg-slate-50/50 dark:bg-zinc-900/30 border border-slate-200/40 dark:border-zinc-800/40 shadow-sm">
                  <p className="text-[8px] uppercase tracking-wider font-extrabold text-slate-400 dark:text-zinc-500">Distancia</p>
                  <p className="text-xs font-black text-slate-800 dark:text-zinc-200 mt-0.5 font-mono">{distance} km</p>
                </div>
                <div className="rounded-xl p-2 bg-slate-50/50 dark:bg-zinc-900/30 border border-slate-200/40 dark:border-zinc-800/40 shadow-sm">
                  <p className="text-[8px] uppercase tracking-wider font-extrabold text-slate-400 dark:text-zinc-500">Tiempo</p>
                  <p className="text-xs font-black text-slate-800 dark:text-zinc-200 mt-0.5 font-mono">{eta} min</p>
                </div>
                <div className="rounded-xl p-2 bg-slate-50/50 dark:bg-zinc-900/30 border border-slate-200/40 dark:border-zinc-800/40 shadow-sm">
                  <p className="text-[8px] uppercase tracking-wider font-extrabold text-slate-400 dark:text-zinc-500">Repartidor</p>
                  <p className="text-xs font-black text-teal-600 dark:text-teal-400 mt-0.5 font-bold">Oscar M.</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 3: Family Pin Sync Simulator */}
          {activeTab === 'family' && (
            <motion.div
              key="family"
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -10 }}
              className="flex flex-col gap-4 flex-grow justify-between"
            >
              <div className="rounded-2xl p-4 bg-white/60 dark:bg-zinc-900/40 border border-slate-200/50 dark:border-zinc-800/40 shadow-sm space-y-4">
                <div className="flex items-center gap-3">
                  <div className="size-9 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-500 border border-teal-500/20">
                    <UserCheck className="size-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-800 dark:text-zinc-200">Vincular Dependiente</h4>
                    <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-light leading-none mt-1">Genera un PIN de seguridad en su teléfono</p>
                  </div>
                </div>

                {/* 6 Digit display blocks */}
                <div className="flex justify-center gap-2">
                  {familyCode.split('').map((char, index) => (
                    <motion.div
                      key={index}
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 260, damping: 20, delay: index * 0.05 }}
                      className="size-9 rounded-xl bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 flex items-center justify-center text-sm font-black text-slate-800 dark:text-white shadow-sm font-mono"
                    >
                      {isRegenerating ? '•' : char}
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Pin instructions */}
              <div className="space-y-3">
                <div className="rounded-xl px-4 py-2.5 bg-slate-50/50 dark:bg-zinc-900/30 border border-slate-200/40 dark:border-zinc-800/40 text-[10px] text-slate-500 dark:text-zinc-400 font-medium leading-relaxed">
                  Ingresa este PIN en el portal de tutor para consolidar el historial clínico familiar de forma automática y segura.
                </div>

                <button
                  type="button"
                  onClick={handleGeneratePin}
                  disabled={isRegenerating}
                  className="clay-btn-primary w-full h-11 rounded-xl text-xs font-black uppercase flex items-center justify-center gap-2 relative transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                >
                  {isRegenerating ? (
                    <>
                      <RefreshCw className="size-4 animate-spin" />
                      Cifrando PIN...
                    </>
                  ) : (
                    <>
                      Regenerar PIN Seguro
                      <RefreshCw className="size-4" />
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
