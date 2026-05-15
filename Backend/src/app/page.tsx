'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { motion, useInView } from 'framer-motion'
import {
  Package, ShieldCheck, Truck, BarChart3, Building2, Bell,
  ArrowRight, ChevronDown, Github, Twitter, Linkedin,
  Activity, Zap, TrendingUp, Heart
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from 'recharts'

/* ─────────────────────────────────────────────
   CUSTOM HOOKS
   ───────────────────────────────────────────── */

function useCounter(end: number, duration: number = 2000) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  useEffect(() => {
    if (!isInView) return
    let startTime: number | null = null
    let rafId: number

    const step = (now: number) => {
      if (!startTime) startTime = now
      const progress = Math.min((now - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // easeOutCubic
      setCount(Math.floor(eased * end))
      if (progress < 1) rafId = requestAnimationFrame(step)
      else setCount(end)
    }

    rafId = requestAnimationFrame(step)
    return () => cancelAnimationFrame(rafId)
  }, [isInView, end, duration])

  return { count, ref }
}

function useTypingEffect(
  texts: string[],
  typeSpeed = 60,
  deleteSpeed = 35,
  pause = 2200,
) {
  const [display, setDisplay] = useState('')
  const [idx, setIdx] = useState(0)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const current = texts[idx]
    let timeout: ReturnType<typeof setTimeout>

    if (!deleting && display === current) {
      timeout = setTimeout(() => setDeleting(true), pause)
    } else if (deleting && display === '') {
      timeout = setTimeout(() => {
        setDeleting(false)
        setIdx((i) => (i + 1) % texts.length)
      }, 0)
    } else {
      timeout = setTimeout(
        () =>
          setDisplay(
            deleting
              ? current.slice(0, display.length - 1)
              : current.slice(0, display.length + 1),
          ),
        deleting ? deleteSpeed : typeSpeed,
      )
    }
    return () => clearTimeout(timeout)
  }, [display, deleting, idx, texts, typeSpeed, deleteSpeed, pause])

  return display
}

/* ─────────────────────────────────────────────
   DATA
   ───────────────────────────────────────────── */

const STATS = [
  { label: 'Medications Managed', value: 2847, suffix: '', prefix: '', format: 'comma' },
  { label: 'Partner Pharmacies', value: 156, suffix: '', prefix: '', format: 'plain' },
  { label: 'Patients Served', value: 124, suffix: 'K', prefix: '', format: 'decimal' },
  { label: 'System Uptime', value: 999, suffix: '%', prefix: '', format: 'percent' },
] as const

const FEATURES = [
  { icon: Package, title: 'Smart Inventory', desc: 'AI-powered stock predictions and automated reorder points to prevent shortages before they happen.' },
  { icon: ShieldCheck, title: 'Prescription Validation', desc: 'Real-time drug interaction checks and dosage verification against clinical databases.' },
  { icon: Truck, title: 'Delivery Tracking', desc: 'End-to-end visibility on every delivery with live GPS tracking and ETA predictions.' },
  { icon: BarChart3, title: 'Clinical Analytics', desc: 'Deep insights into prescribing patterns, patient outcomes, and operational efficiency.' },
  { icon: Building2, title: 'Multi-Pharmacy', desc: 'Unified dashboard for managing multiple locations with centralized control and reporting.' },
  { icon: Bell, title: 'Real-time Alerts', desc: 'Instant notifications for critical events: low stock, expiring items, and compliance deadlines.' },
] as const

const PRESCRIPTION_DATA = [
  { month: 'Jan', prescriptions: 1200 },
  { month: 'Feb', prescriptions: 1380 },
  { month: 'Mar', prescriptions: 1590 },
  { month: 'Apr', prescriptions: 1420 },
  { month: 'May', prescriptions: 1890 },
  { month: 'Jun', prescriptions: 2100 },
  { month: 'Jul', prescriptions: 2340 },
  { month: 'Aug', prescriptions: 2280 },
  { month: 'Sep', prescriptions: 2560 },
  { month: 'Oct', prescriptions: 2890 },
  { month: 'Nov', prescriptions: 3100 },
  { month: 'Dec', prescriptions: 2847 },
]

const CATEGORY_DATA = [
  { name: 'Antibiotics', value: 420 },
  { name: 'Pain Relief', value: 380 },
  { name: 'Cardiac', value: 290 },
  { name: 'Diabetes', value: 340 },
  { name: 'Respiratory', value: 250 },
  { name: 'Dermatology', value: 190 },
]

const TAGLINES = [
  'Revolutionizing pharmacy operations with AI',
  'One platform. Every pharmacy. Zero friction.',
  'The future of healthcare management is here.',
]

const PARTICLES = [
  { id: 0, size: 22, x: 12, y: 18, duration: 18, delay: 0, opacity: 0.15 },
  { id: 1, size: 14, x: 78, y: 8, duration: 22, delay: 2, opacity: 0.1 },
  { id: 2, size: 8, x: 45, y: 65, duration: 15, delay: 4, opacity: 0.2 },
  { id: 3, size: 28, x: 88, y: 42, duration: 20, delay: 1, opacity: 0.08 },
  { id: 4, size: 12, x: 32, y: 80, duration: 16, delay: 6, opacity: 0.18 },
  { id: 5, size: 18, x: 65, y: 25, duration: 19, delay: 3, opacity: 0.12 },
  { id: 6, size: 10, x: 5, y: 55, duration: 14, delay: 7, opacity: 0.15 },
  { id: 7, size: 24, x: 52, y: 90, duration: 21, delay: 5, opacity: 0.06 },
  { id: 8, size: 16, x: 95, y: 70, duration: 17, delay: 2, opacity: 0.1 },
  { id: 9, size: 30, x: 20, y: 35, duration: 23, delay: 8, opacity: 0.08 },
]

/* ─────────────────────────────────────────────
   HELPER COMPONENTS
   ───────────────────────────────────────────── */

function formatStat(value: number, format: string) {
  switch (format) {
    case 'comma':
      return value.toLocaleString()
    case 'decimal':
      return (value / 10).toFixed(1)
    case 'percent':
      return (value / 10).toFixed(1)
    default:
      return value.toString()
  }
}

function StatCard({ label, value, suffix, prefix, format }: {
  label: string; value: number; suffix: string; prefix: string; format: string
}) {
  const { count, ref } = useCounter(value, 2200)
  const iconMap = [Activity, TrendingUp, Heart, Zap]
  const Icon = iconMap[STATS.findIndex((s) => s.label === label) % iconMap.length]

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -4, transition: { type: 'spring', stiffness: 300, damping: 20 } }}
      className="group relative bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-2xl p-6 md:p-8 text-center overflow-hidden transition-colors duration-500 hover:border-emerald-500/30 hover:bg-white/[0.05]"
    >
      {/* glow on hover */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-br from-emerald-500/[0.06] via-transparent to-teal-500/[0.06]" />
      <div className="absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-br from-emerald-500/20 via-transparent to-teal-500/20 blur-sm" />

      <div className="relative z-10">
        <div className="mx-auto mb-4 w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors duration-300">
          <Icon className="w-5 h-5 text-emerald-400" />
        </div>
        <p className="text-3xl md:text-4xl font-bold text-white font-mono tracking-tight">
          {prefix}{formatStat(count, format)}{suffix}
        </p>
        <p className="mt-2 text-sm text-white/50 font-medium">{label}</p>
      </div>
    </motion.div>
  )
}

function FeatureCard({ icon: Icon, title, desc, index }: {
  icon: React.ElementType; title: string; desc: string; index: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{
        duration: 0.6,
        delay: index * 0.1,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={{ y: -6, transition: { type: 'spring', stiffness: 300, damping: 20 } }}
      className="group relative bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] rounded-2xl p-6 md:p-8 overflow-hidden transition-colors duration-500 hover:border-emerald-500/30 hover:bg-white/[0.05]"
    >
      {/* hover glow */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-br from-emerald-500/[0.06] via-transparent to-teal-500/[0.06]" />

      {/* icon ring */}
      <div className="relative z-10 mb-5 w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center group-hover:bg-emerald-500/20 group-hover:border-emerald-500/40 transition-all duration-300">
        <Icon className="w-5 h-5 text-emerald-400 group-hover:text-emerald-300 transition-colors duration-300" />
      </div>

      <h3 className="relative z-10 text-lg font-semibold text-white mb-2 group-hover:text-emerald-300 transition-colors duration-300">
        {title}
      </h3>
      <p className="relative z-10 text-sm text-white/45 leading-relaxed">
        {desc}
      </p>

      {/* bottom accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/0 to-transparent group-hover:via-emerald-500/40 transition-all duration-700" />
    </motion.div>
  )
}

/* ─────────────────────────────────────────────
   RECHARTS CUSTOM TOOLTIP
   ───────────────────────────────────────────── */

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-[#0d1320]/95 backdrop-blur-sm border border-emerald-500/20 rounded-lg px-4 py-3 shadow-2xl shadow-emerald-500/5">
      <p className="text-emerald-400/80 text-xs font-medium mb-1">{label}</p>
      <p className="text-white text-base font-bold font-mono">
        {payload[0].value.toLocaleString()}
      </p>
    </div>
  )
}

/* ─────────────────────────────────────────────
   SECTION HEADER
   ───────────────────────────────────────────── */

function SectionHeader({ badge, title, subtitle }: {
  badge: string; title: string; subtitle: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="text-center mb-16"
    >
      <span className="inline-block px-4 py-1.5 mb-6 text-xs font-semibold tracking-widest uppercase text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
        {badge}
      </span>
      <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 tracking-tight">
        {title}
      </h2>
      <p className="max-w-2xl mx-auto text-white/45 text-base md:text-lg leading-relaxed">
        {subtitle}
      </p>
    </motion.div>
  )
}

/* ─────────────────────────────────────────────
   MAIN PAGE COMPONENT
   ───────────────────────────────────────────── */

export default function Home() {
  const typed = useTypingEffect(TAGLINES)

  return (
    <div className="min-h-screen flex flex-col bg-[#0A0F1C] text-white overflow-x-hidden">

      {/* ═══════════════════════════════════════
          HERO SECTION
          ═══════════════════════════════════════ */}
      <section className="relative h-screen min-h-[700px] flex items-center justify-center overflow-hidden">
        {/* background image */}
        <Image
          src="/oasis-hero.png"
          alt="OASIS Hero"
          fill
          className="object-cover opacity-20"
          priority
        />

        {/* dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A0F1C] via-[#0A0F1C]/70 to-[#0A0F1C]" />

        {/* animated gradient orbs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="animate-gradient-shift-1 absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full bg-emerald-500/[0.08] blur-[120px]" />
          <div className="animate-gradient-shift-2 absolute top-1/3 -right-48 w-[500px] h-[500px] rounded-full bg-teal-500/[0.07] blur-[100px]" />
          <div className="animate-gradient-shift-3 absolute -bottom-32 left-1/4 w-[700px] h-[700px] rounded-full bg-cyan-500/[0.06] blur-[140px]" />
        </div>

        {/* floating particles */}
        {PARTICLES.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-full bg-emerald-400 animate-particle-drift pointer-events-none"
            style={{
              width: p.size,
              height: p.size,
              left: `${p.x}%`,
              top: `${p.y}%`,
              opacity: p.opacity,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
              filter: `blur(${p.size > 20 ? 2 : 0}px)`,
            }}
          />
        ))}

        {/* subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle, rgba(16,185,129,0.8) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />

        {/* hero content */}
        <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
          {/* OASIS title with letter animation */}
          <motion.h1
            className="text-7xl sm:text-8xl md:text-9xl lg:text-[10rem] font-black tracking-tighter leading-none"
            aria-label="OASIS"
          >
            {'OASIS'.split('').map((letter, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 60, scale: 0.5 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  delay: 0.3 + i * 0.1,
                  duration: 0.7,
                  type: 'spring',
                  stiffness: 120,
                  damping: 14,
                }}
                className="inline-block bg-gradient-to-b from-white via-white to-emerald-200 bg-clip-text text-transparent"
              >
                {letter}
              </motion.span>
            ))}
          </motion.h1>

          {/* subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.8 }}
            className="mt-4 md:mt-6 text-lg md:text-xl lg:text-2xl text-white/60 font-medium tracking-wide"
          >
            Intelligent Pharmacy Management System
          </motion.p>

          {/* typing tagline */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4, duration: 0.6 }}
            className="mt-4 h-8 flex items-center justify-center"
          >
            <span className="text-emerald-400/80 text-sm md:text-base font-mono">
              {typed}
            </span>
            <span className="ml-0.5 inline-block w-[2px] h-5 bg-emerald-400 animate-blink" />
          </motion.div>

          {/* CTA button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.7, duration: 0.7 }}
            className="mt-10"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-full bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 text-white font-semibold text-lg shadow-2xl shadow-emerald-500/25 animate-pulse-glow overflow-hidden"
            >
              {/* shimmer */}
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              <span className="relative z-10">Get Started</span>
              <ArrowRight className="relative z-10 w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
            </motion.button>
          </motion.div>
        </div>

        {/* scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.5, duration: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="text-xs text-white/30 tracking-widest uppercase">Scroll</span>
          <ChevronDown className="w-5 h-5 text-white/30 animate-scroll-bounce" />
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════
          STATS SECTION
          ═══════════════════════════════════════ */}
      <section className="relative py-20 md:py-28">
        {/* subtle bg accent */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/[0.02] to-transparent" />

        <div className="relative z-10 max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {STATS.map((stat) => (
              <StatCard key={stat.label} {...stat} />
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          FEATURES SECTION
          ═══════════════════════════════════════ */}
      <section className="relative py-20 md:py-28">
        <div className="relative z-10 max-w-6xl mx-auto px-6">
          <SectionHeader
            badge="Capabilities"
            title="Everything Your Pharmacy Needs"
            subtitle="From intelligent inventory to real-time clinical insights, OASIS delivers a complete ecosystem for modern pharmacy operations."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {FEATURES.map((feat, i) => (
              <FeatureCard key={feat.title} {...feat} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          DASHBOARD PREVIEW SECTION
          ═══════════════════════════════════════ */}
      <section className="relative py-20 md:py-28">
        <div className="relative z-10 max-w-6xl mx-auto px-6">
          <SectionHeader
            badge="Live Preview"
            title="See OASIS in Action"
            subtitle="Real-time dashboards that turn your pharmacy data into actionable intelligence."
          />

          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="relative bg-white/[0.02] backdrop-blur-xl border border-white/[0.06] rounded-2xl overflow-hidden"
          >
            {/* fake window bar */}
            <div className="flex items-center gap-2 px-5 py-3 border-b border-white/[0.06] bg-white/[0.02]">
              <div className="w-3 h-3 rounded-full bg-red-500/60" />
              <div className="w-3 h-3 rounded-full bg-amber-500/60" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
              <span className="ml-4 text-xs text-white/30 font-mono">dashboard.oasis.pharmacy</span>
            </div>

            {/* mini stat row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/[0.04]">
              {[
                { label: 'Today\'s Rx', value: '247', change: '+12%' },
                { label: 'Pending', value: '18', change: '-5%' },
                { label: 'Deliveries', value: '34', change: '+8%' },
                { label: 'Alerts', value: '3', change: '-2' },
              ].map((s) => (
                <div key={s.label} className="px-5 py-4 bg-[#0A0F1C]/80">
                  <p className="text-xs text-white/35 mb-1">{s.label}</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-bold text-white font-mono">{s.value}</span>
                    <span className={`text-xs font-medium ${s.change.startsWith('+') ? 'text-emerald-400' : s.change.startsWith('-') ? 'text-red-400/70' : 'text-white/40'}`}>
                      {s.change}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
              {/* area chart */}
              <div className="bg-white/[0.02] rounded-xl border border-white/[0.04] p-4">
                <h4 className="text-sm font-medium text-white/50 mb-4">Monthly Prescriptions</h4>
                <div className="h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={PRESCRIPTION_DATA}>
                      <defs>
                        <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10B981" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<ChartTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="prescriptions"
                        stroke="#10B981"
                        strokeWidth={2}
                        fill="url(#areaGradient)"
                        animationDuration={1800}
                        animationEasing="ease-out"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* bar chart */}
              <div className="bg-white/[0.02] rounded-xl border border-white/[0.04] p-4">
                <h4 className="text-sm font-medium text-white/50 mb-4">Medicine Categories</h4>
                <div className="h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={CATEGORY_DATA} barSize={32}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip content={<ChartTooltip />} />
                      <Bar
                        dataKey="value"
                        radius={[6, 6, 0, 0]}
                        animationDuration={1600}
                        animationEasing="ease-out"
                      >
                        {CATEGORY_DATA.map((_, i) => (
                          <Cell
                            key={i}
                            fill={i % 2 === 0 ? '#10B981' : '#14B8A6'}
                            fillOpacity={0.75}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          CTA SECTION
          ═══════════════════════════════════════ */}
      <section className="relative py-24 md:py-32 overflow-hidden">
        {/* gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/30 via-[#0A0F1C] to-teal-900/30" />

        {/* decorative orbs */}
        <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-emerald-500/[0.06] blur-[100px] animate-float" />
        <div className="absolute bottom-10 right-10 w-64 h-64 rounded-full bg-teal-500/[0.06] blur-[80px] animate-float" style={{ animationDelay: '3s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-cyan-500/[0.04] blur-[120px] animate-float" style={{ animationDelay: '6s' }} />

        {/* decorative ring */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border border-emerald-500/[0.06] animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full border border-teal-500/[0.04] animate-float" style={{ animationDelay: '5s' }} />

        <div className="relative z-10 text-center max-w-3xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight leading-tight">
              Ready to Transform{' '}
              <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                Your Pharmacy?
              </span>
            </h2>
            <p className="text-white/45 text-lg md:text-xl mb-10 max-w-xl mx-auto leading-relaxed">
              Join hundreds of pharmacies already using OASIS to streamline operations and deliver better patient outcomes.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-full bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 text-white font-semibold text-lg shadow-2xl shadow-emerald-500/25 animate-pulse-glow overflow-hidden"
            >
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              <span className="relative z-10">Get Started</span>
              <ArrowRight className="relative z-10 w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full border border-white/10 text-white/70 font-semibold text-lg hover:border-emerald-500/30 hover:text-white transition-all duration-300 hover:bg-white/[0.03]"
            >
              Learn More
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════
          FOOTER
          ═══════════════════════════════════════ */}
      <footer className="mt-auto border-t border-white/[0.06] bg-[#070B16]">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* logo / name */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <span className="text-white font-black text-sm">O</span>
              </div>
              <span className="text-white/60 text-sm font-medium">
                Powered by <span className="text-emerald-400 font-semibold">OASIS</span>
              </span>
            </div>

            {/* social icons */}
            <div className="flex items-center gap-4">
              {[
                { Icon: Github, label: 'GitHub' },
                { Icon: Twitter, label: 'Twitter' },
                { Icon: Linkedin, label: 'LinkedIn' },
              ].map(({ Icon, label }) => (
                <motion.a
                  key={label}
                  href="#"
                  aria-label={label}
                  whileHover={{ scale: 1.15, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-10 h-10 rounded-full border border-white/[0.08] flex items-center justify-center text-white/30 hover:text-emerald-400 hover:border-emerald-500/30 hover:bg-emerald-500/[0.06] transition-colors duration-300"
                >
                  <Icon className="w-4 h-4" />
                </motion.a>
              ))}
            </div>

            {/* copyright */}
            <p className="text-white/25 text-xs">
              &copy; {new Date().getFullYear()} OASIS. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
