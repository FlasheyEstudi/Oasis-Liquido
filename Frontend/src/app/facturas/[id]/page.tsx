'use client';

import { useState, useEffect, use } from 'react';
import { getApiUrl } from '@/api/client';
import { GlassCard } from '@/components/oasis/glass-card';
import { Button } from '@/components/ui/button';
import { formatDate, formatCurrency } from '@/utils/helpers';
import { 
  CheckCircle2, 
  User, 
  Building2, 
  MapPin, 
  AlertCircle,
  Loader2,
  ShieldCheck,
  ArrowLeft,
  Stethoscope,
  Receipt,
  Download,
  Calendar,
  CreditCard,
  Truck,
  Printer,
  ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';

interface InvoiceItem {
  name: string;
  quantity: number;
  price: number;
}

interface InvoiceData {
  type: string;
  id: string;
  date: string;
  total: number;
  customerName: string;
  pharmacyName: string;
  attendant: string;
  items: InvoiceItem[];
  prescription: {
    doctor: string;
    clinic: string;
    date: string;
  } | null;
  deliveryOrder: {
    status: string;
    driverName: string;
    deliveredAt: string | null;
    address: string;
  } | null;
  [key: string]: any;
}

export default function FacturaPublicaPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const [data, setData] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch(`${getApiUrl()}/public/verify/sale/${id}`);
        const json = await response.json();
        if (json.success) {
          setData(json.data);
        } else {
          setError(
            typeof json.error === 'object' && json.error?.message 
              ? json.error.message 
              : typeof json.error === 'string' 
                ? json.error 
                : 'No se encontró la factura especificada'
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

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch(`${getApiUrl()}/sales/${id}/receipt`);
      if (!response.ok) throw new Error('No autorizado o error al generar el PDF');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `factura-${id.slice(-6)}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      // If endpoint requires token, fallback to printing
      handlePrint();
    } finally {
      setIsDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-white font-sans">
        <Loader2 className="size-14 text-teal-500 animate-spin mb-4" />
        <p className="text-zinc-400 font-mono tracking-widest text-xs animate-pulse uppercase">Recuperando detalles de la factura...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-950 text-white px-6 text-center font-sans">
        <div className="size-20 bg-red-500/10 border border-red-500/30 rounded-full flex items-center justify-center text-red-500 mb-6">
          <AlertCircle className="size-10" />
        </div>
        <h2 className="text-2xl font-black mb-2 tracking-tight">Factura No Válida</h2>
        <p className="text-zinc-400 max-w-sm text-sm mb-8 leading-relaxed">{error}</p>
        <Button onClick={() => window.location.href = '/'} className="rounded-full bg-teal-600 hover:bg-teal-700 font-bold px-6 h-12 shadow-lg shadow-teal-500/25">
          <ArrowLeft className="size-4 mr-2" /> Volver al Inicio
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white font-sans py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden select-none">
      {/* Dynamic Background Gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-teal-900/10 blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-sky-900/10 blur-[150px] pointer-events-none" />

      {/* SEO Title Tag and Semantic Structure */}
      <header className="max-w-2xl mx-auto mb-10 text-center relative z-10">
        <div className="size-16 bg-teal-500/10 border border-teal-500/30 rounded-3xl flex items-center justify-center text-teal-400 mx-auto mb-4 shadow-[0_8px_30px_rgba(20,184,166,0.15)]">
          <ShieldCheck className="size-8" />
        </div>
        <h1 className="text-3xl font-black tracking-tight text-white mb-2 sm:text-4xl">
          Factura Digital Verificada
        </h1>
        <p className="text-zinc-400 text-sm max-w-md mx-auto">
          Este documento de venta es una copia oficial firmada digitalmente en el ecosistema de salud Oasis Aura Nicaragua.
        </p>
      </header>

      <main className="max-w-2xl mx-auto space-y-8 relative z-10 print:max-w-full print:p-0">
        {/* Ticket receipt layout */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 15 }}
          className="relative rounded-[2.5rem] overflow-hidden bg-zinc-900/40 border border-zinc-800 backdrop-blur-md shadow-2xl p-6 sm:p-10 print:border-none print:bg-white print:text-zinc-900"
        >
          {/* Top colored stripe */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-teal-500 via-sky-500 to-emerald-500 print:hidden" />

          {/* Sello de verificación watermark background */}
          <div className="absolute right-4 top-24 size-40 rounded-full border border-teal-500/[0.03] bg-teal-500/[0.005] flex items-center justify-center rotate-12 pointer-events-none select-none print:hidden">
            <span className="text-[8px] font-black text-teal-400/[0.08] tracking-[0.25em] uppercase text-center leading-relaxed">
              TRANSACCIÓN VÁLIDA<br/>OASIS NICARAGUA<br/>MINSA CERTIFIED
            </span>
          </div>

          {/* Ticket Header */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 pb-8 border-b border-zinc-800/80 print:border-zinc-200">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-extrabold uppercase bg-emerald-950/40 text-emerald-400 border border-emerald-500/20 shadow-inner print:bg-emerald-50 print:text-emerald-700 print:border-emerald-200">
                  <CheckCircle2 className="size-3" /> Transacción Exitosa
                </span>
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight leading-none print:text-zinc-900">
                Oasis Aura
              </h2>
              <p className="text-[10px] text-teal-400 font-bold uppercase tracking-widest mt-1">
                {data.pharmacyName}
              </p>
            </div>
            
            <div className="text-left sm:text-right">
              <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Código de Transacción</p>
              <p className="text-lg font-mono font-bold text-white print:text-zinc-900">
                #{data.id.slice(-8).toUpperCase()}
              </p>
            </div>
          </div>

          {/* Meta Information Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-8 bg-zinc-950/40 p-5 rounded-3xl border border-zinc-800/50 print:bg-zinc-50 print:border-zinc-200">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="size-8 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-400 shrink-0 border border-teal-500/20 print:bg-teal-50 print:text-teal-700 print:border-teal-200">
                  <User className="size-4" />
                </div>
                <div>
                  <p className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider leading-none">Cliente / Paciente</p>
                  <p className="text-sm font-semibold mt-1 text-zinc-200 print:text-zinc-900">{data.customerName}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="size-8 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-400 shrink-0 border border-teal-500/20 print:bg-teal-50 print:text-teal-700 print:border-teal-200">
                  <Building2 className="size-4" />
                </div>
                <div>
                  <p className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider leading-none">Establecimiento</p>
                  <p className="text-sm font-semibold mt-1 text-zinc-200 print:text-zinc-900">{data.pharmacyName}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="size-8 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-400 shrink-0 border border-teal-500/20 print:bg-teal-50 print:text-teal-700 print:border-teal-200">
                  <Calendar className="size-4" />
                </div>
                <div>
                  <p className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider leading-none">Fecha de Emisión</p>
                  <p className="text-sm font-semibold mt-1 text-zinc-200 print:text-zinc-900">{formatDate(data.date, 'dd/MM/yyyy HH:mm')}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="size-8 rounded-full bg-teal-500/10 flex items-center justify-center text-teal-400 shrink-0 border border-teal-500/20 print:bg-teal-50 print:text-teal-700 print:border-teal-200">
                  <User className="size-4" />
                </div>
                <div>
                  <p className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider leading-none">Atendido por</p>
                  <p className="text-sm font-semibold mt-1 text-zinc-200 print:text-zinc-900">{data.attendant}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Section (if delivery order is present) */}
          {data.deliveryOrder && (
            <div className="mb-8 p-5 rounded-3xl bg-zinc-900/80 border border-teal-500/20 relative overflow-hidden print:bg-zinc-50 print:border-zinc-200">
              <div className="absolute right-0 top-0 h-full w-1.5 bg-teal-500 print:hidden" />
              <div className="flex items-start gap-3.5">
                <div className="size-10 bg-teal-500/10 rounded-2xl flex items-center justify-center text-teal-400 border border-teal-500/20 shrink-0">
                  <Truck className="size-5" />
                </div>
                <div className="space-y-1.5 min-w-0">
                  <h3 className="text-xs font-black uppercase text-teal-400 tracking-widest print:text-zinc-900">
                    Despacho de Última Milla (Delivery)
                  </h3>
                  <p className="text-sm font-bold text-zinc-100 print:text-zinc-900">
                    Entregado por {data.deliveryOrder.driverName}
                  </p>
                  <p className="text-xs text-zinc-400 leading-relaxed print:text-zinc-650">
                    <strong className="text-zinc-350 print:text-zinc-800">Dirección: </strong> {data.deliveryOrder.address}
                  </p>
                  {data.deliveryOrder.deliveredAt && (
                    <p className="text-[10px] text-zinc-500 font-medium">
                      <strong>Completado: </strong> {formatDate(data.deliveryOrder.deliveredAt, 'dd/MM/yyyy HH:mm')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Items Table */}
          <div className="border-t border-dashed border-zinc-800 py-6 print:border-zinc-200">
            <h3 className="text-xs font-black uppercase text-zinc-500 tracking-widest mb-4 print:text-zinc-700">
              Productos Surtidos
            </h3>
            
            <div className="space-y-4">
              {data.items.map((item, index) => (
                <div key={index} className="flex justify-between items-baseline gap-4 py-2 border-b border-zinc-900/50 print:border-zinc-100">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-zinc-100 text-sm truncate print:text-zinc-900">
                      {item.name}
                    </p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {item.quantity} unidades × {formatCurrency(item.price)}
                    </p>
                  </div>
                  <span className="font-mono font-bold text-white text-sm shrink-0 print:text-zinc-900">
                    {formatCurrency(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Payment breakdown and totals */}
          <div className="border-t-2 border-zinc-800 pt-6 space-y-4 print:border-zinc-200">
            <div className="flex justify-between items-center">
              <span className="text-xs font-black uppercase tracking-widest text-zinc-400">Método de Pago</span>
              <span className="text-xs font-extrabold uppercase tracking-wide text-zinc-300 flex items-center gap-1.5 print:text-zinc-950">
                <CreditCard className="size-3.5" /> Pago Completo (Caja)
              </span>
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-base font-black uppercase tracking-widest text-zinc-200 print:text-zinc-900">Total Facturado</span>
              <span className="text-3xl font-black text-teal-400 print:text-teal-600">
                {formatCurrency(data.total)}
              </span>
            </div>
          </div>

          {/* Barcode/Guilloche decoration at bottom */}
          <div className="mt-8 pt-6 border-t border-dashed border-zinc-800 flex flex-col items-center gap-2 select-none print:border-zinc-200">
            <div className="h-6 w-52 bg-white/5 rounded-[4px] flex items-center justify-between p-1 gap-[2px] overflow-hidden opacity-30 shrink-0 print:hidden">
              {Array(36).fill(0).map((_, i) => (
                <div 
                  key={i} 
                  className="h-full bg-white rounded-[0.5px]" 
                  style={{ width: `${(i % 3 === 0 ? 3 : i % 2 === 0 ? 1 : 2.5)}px` }} 
                />
              ))}
            </div>
            <p className="text-[8px] text-zinc-600 font-bold uppercase tracking-[0.25em]">
              OASIS DIGITAL VERIFIED
            </p>
          </div>
        </motion.div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center print:hidden">
          <Button 
            onClick={handleDownloadPDF} 
            disabled={isDownloading}
            className="w-full sm:w-auto h-12 px-8 rounded-full bg-teal-600 hover:bg-teal-700 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-teal-500/15"
          >
            {isDownloading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Download className="size-4" />
            )}
            Descargar Recibo Oficial
          </Button>

          <Button 
            onClick={handlePrint}
            variant="outline" 
            className="w-full sm:w-auto h-12 px-8 rounded-full border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800/80 text-zinc-300 hover:text-white font-bold flex items-center justify-center gap-2"
          >
            <Printer className="size-4" />
            Imprimir Factura
          </Button>
        </div>

        {/* Prescription Link Card (if applicable) */}
        {data.prescription && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-3xl p-6 bg-sky-950/20 border border-sky-500/25 backdrop-blur-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
          >
            <div className="flex items-start gap-3.5">
              <div className="size-11 bg-sky-500/15 rounded-2xl flex items-center justify-center text-sky-400 border border-sky-500/20 shrink-0">
                <Stethoscope className="size-5" />
              </div>
              <div>
                <h4 className="font-bold text-sky-300 text-sm leading-snug">Factura vinculada a Receta Médica</h4>
                <p className="text-xs text-zinc-400 mt-1">
                  Emitida por {data.prescription.doctor} en {data.prescription.clinic}
                </p>
              </div>
            </div>
            
            <Button 
              onClick={() => window.location.href = `/verificar-receta-${id}`}
              className="clay-btn-primary h-10 px-5 text-xs font-bold shrink-0 self-end sm:self-center"
            >
              Ver Receta <ChevronRight className="size-3.5 ml-1" />
            </Button>
          </motion.div>
        )}
      </main>

      <footer className="mt-12 text-center text-[10px] text-zinc-600 font-medium tracking-wide uppercase select-none print:hidden">
        &copy; {new Date().getFullYear()} Oasis Aura. Todos los derechos reservados.
      </footer>
    </div>
  );
}
