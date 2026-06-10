'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Search,
  Download,
  Printer,
  ShieldCheck,
  ShieldAlert,
  AlertOctagon,
  Calendar,
  User,
  Activity,
  FileSpreadsheet,
  RefreshCw,
  Loader2,
  Stethoscope
} from 'lucide-react';
import { get, getErrorMessage } from '@/api/client';
import { GlassCard } from '@/components/oasis/glass-card';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';

interface MinsaReportProps {
  facilityId: string;
  type: 'clinic' | 'pharmacy';
}

interface MinsaRecord {
  id: string;
  date: string;
  patientName: string;
  patientPhone: string;
  doctorName?: string;
  doctorLicense?: string;
  clinicName?: string;
  hasPrescription?: boolean;
  prescriptionId?: string | null;
  digitalSignature?: string;
  qrVerified?: boolean;
  status?: string;
  fulfilledPharmacyName?: string;
  items: Array<{
    medicineId: string;
    name: string;
    genericName: string;
    controlType: 'CONTROLLED_PSYCHOTROPIC' | 'CONTROLLED_NARCOTIC' | string;
    concentration: string;
    quantity?: number;
    quantityPrescribed?: number;
    quantityFulfilled?: number;
    unitPrice?: number;
    totalPrice?: number;
    dosageInstructions?: string;
  }>;
}

interface MinsaTotals {
  totalDispensations?: number;
  totalPrescriptionsIssued?: number;
  psychotropicsCount: number;
  narcoticsCount: number;
  withoutPrescriptionViolations?: number;
  fulfilledCount?: number;
  pendingCount?: number;
}

export function MinsaComplianceReport({ facilityId, type }: MinsaReportProps) {
  const { setNotification } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{ totals: MinsaTotals; records: MinsaRecord[] } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [controlTypeFilter, setControlTypeFilter] = useState<'ALL' | 'CONTROLLED_PSYCHOTROPIC' | 'CONTROLLED_NARCOTIC'>('ALL');
  const [prescriptionFilter, setPrescriptionFilter] = useState<'ALL' | 'WITH_PRESCRIPTION' | 'WITHOUT_PRESCRIPTION'>('ALL');

  const fetchReport = async () => {
    setLoading(true);
    try {
      const endpoint = type === 'clinic' 
        ? `/clinics/${facilityId}/reports`
        : `/pharmacies/${facilityId}/reports`;
      
      const res = await get<any>(endpoint, { type: 'minsa_compliance' });
      if (res.success) {
        setData(res.data);
      } else {
        throw new Error('No se pudo cargar el reporte');
      }
    } catch (err) {
      console.error(err);
      setNotification({
        type: 'error',
        message: getErrorMessage(err) || 'Error al obtener reporte de cumplimiento MINSA'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (facilityId) {
      fetchReport();
    }
  }, [facilityId, type]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 className="size-10 text-teal-500 animate-spin" />
        <p className="text-sm text-muted-foreground animate-pulse">Generando libro de control MINSA...</p>
      </div>
    );
  }

  // Filter records
  const filteredRecords = data?.records.filter(record => {
    // 1. Search term match
    const matchesSearch = 
      record.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (record.doctorName && record.doctorName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (record.doctorLicense && record.doctorLicense.toLowerCase().includes(searchTerm.toLowerCase())) ||
      record.items.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()) || item.genericName.toLowerCase().includes(searchTerm.toLowerCase()));

    // 2. Control type filter match
    const matchesControlType = controlTypeFilter === 'ALL' || record.items.some(item => item.controlType === controlTypeFilter);

    // 3. Prescription filter match
    let matchesPrescription = true;
    if (type === 'pharmacy') {
      if (prescriptionFilter === 'WITH_PRESCRIPTION') {
        matchesPrescription = !!record.hasPrescription;
      } else if (prescriptionFilter === 'WITHOUT_PRESCRIPTION') {
        matchesPrescription = !record.hasPrescription;
      }
    }

    return matchesSearch && matchesControlType && matchesPrescription;
  }) || [];

  // Count active violations in the current filtered records list
  const filteredViolationsCount = type === 'pharmacy' 
    ? filteredRecords.filter(r => !r.hasPrescription).length 
    : 0;

  // Export to CSV
  const exportToCSV = () => {
    if (!filteredRecords.length) return;

    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Headers
    const headers = type === 'clinic'
      ? ["ID Prescripcion", "Fecha Emision", "Paciente", "Telefono", "Medico", "Licencia MINSA", "Firma Digital", "Estado", "Medicamentos"]
      : ["ID Venta", "Fecha Venta", "Paciente", "Telefono", "Receta Validada", "Medico Prescriptor", "Licencia Medico", "Clinica Emisora", "Firma Digital", "Medicamentos"];
    
    csvContent += headers.join(",") + "\n";

    // Rows
    filteredRecords.forEach(r => {
      const itemsStr = r.items.map(i => `${i.name} (${i.quantity || i.quantityPrescribed} uds)`).join(" | ");
      const row = type === 'clinic'
        ? [
            r.id,
            r.date.split('T')[0],
            `"${r.patientName}"`,
            `"${r.patientPhone}"`,
            `"${r.doctorName}"`,
            `"${r.doctorLicense}"`,
            r.digitalSignature,
            r.status,
            `"${itemsStr}"`
          ]
        : [
            r.id,
            r.date.split('T')[0],
            `"${r.patientName}"`,
            `"${r.patientPhone}"`,
            r.hasPrescription ? "SI" : "NO - VIOLACION",
            `"${r.doctorName}"`,
            `"${r.doctorLicense}"`,
            `"${r.clinicName}"`,
            r.digitalSignature,
            `"${itemsStr}"`
          ];
      csvContent += row.join(",") + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Libro_Control_MINSA_${type}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setNotification({
      type: 'success',
      message: 'Exportación CSV completada para auditoría sanitaria.'
    });
  };

  // Trigger browser print
  const triggerPrint = () => {
    window.print();
  };

  const totals = data?.totals;

  return (
    <div className="space-y-6">
      {/* Printable audit header - hidden in normal screen view */}
      <div className="hidden print:block text-slate-900 bg-white p-6 border-b-2 border-slate-900 mb-6 font-mono text-xs">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-lg font-black uppercase tracking-wider">Libro Oficial de Control de Sustancias Controladas</h1>
            <p className="text-xs font-bold text-slate-600 mt-1">Autoridad Reguladora: Ministerio de Salud (MINSA) - Nicaragua</p>
            <p className="mt-2">Establecimiento ID: {facilityId} | Tipo: {type === 'clinic' ? 'Clínica / Policlínico' : 'Farmacia / Dispensario'}</p>
          </div>
          <div className="text-right">
            <p className="font-bold">Fecha de Impresión: {new Date().toLocaleDateString()}</p>
            <p>Estado de Auditoría: Sincronizado Supabase Local</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-4 print:hidden">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <GlassCard className="p-5 flex flex-col justify-between h-32 border border-teal-500/10 shadow-lg hover:border-teal-500/20 transition-all duration-300">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {type === 'clinic' ? 'Recetas Emitidas' : 'Dispensaciones'}
              </span>
              <FileText className="size-5 text-teal-500" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-850 dark:text-white mt-1">
                {type === 'clinic' ? totals?.totalPrescriptionsIssued : totals?.totalDispensations}
              </h3>
              <p className="text-[10px] text-teal-600 dark:text-teal-400 font-semibold mt-1">Total acumulado de sustancias controladas</p>
            </div>
          </GlassCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
        >
          <GlassCard className="p-5 flex flex-col justify-between h-32 border border-sky-500/10 shadow-lg hover:border-sky-500/20 transition-all duration-300">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Psicotrópicos</span>
              <Activity className="size-5 text-sky-500" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-850 dark:text-white mt-1">{totals?.psychotropicsCount}</h3>
              <p className="text-[10px] text-sky-600 dark:text-sky-400 font-semibold mt-1">Sustancias de Lista II, III y IV (MINSA)</p>
            </div>
          </GlassCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <GlassCard className="p-5 flex flex-col justify-between h-32 border border-indigo-500/10 shadow-lg hover:border-indigo-500/20 transition-all duration-300">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Estupefacientes</span>
              <FileSpreadsheet className="size-5 text-indigo-500" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-slate-850 dark:text-white mt-1">{totals?.narcoticsCount}</h3>
              <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold mt-1">Narcóticos estrictamente controlados (Lista I)</p>
            </div>
          </GlassCard>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
        >
          {type === 'pharmacy' ? (
            <GlassCard className={cn(
              "p-5 flex flex-col justify-between h-32 border transition-all duration-300 shadow-lg",
              totals?.withoutPrescriptionViolations && totals.withoutPrescriptionViolations > 0 
                ? "border-red-500/25 bg-red-500/5 dark:bg-red-500/10 hover:border-red-500/40 shadow-red-500/5 animate-pulse"
                : "border-emerald-500/10 hover:border-emerald-500/20"
            )}>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Violaciones (Sin Receta)</span>
                {totals?.withoutPrescriptionViolations && totals.withoutPrescriptionViolations > 0 ? (
                  <ShieldAlert className="size-5 text-red-500 animate-bounce" />
                ) : (
                  <ShieldCheck className="size-5 text-emerald-500" />
                )}
              </div>
              <div>
                <h3 className={cn(
                  "text-2xl font-black mt-1",
                  totals?.withoutPrescriptionViolations && totals.withoutPrescriptionViolations > 0
                    ? "text-red-600 dark:text-red-400"
                    : "text-emerald-600 dark:text-emerald-400"
                )}>
                  {totals?.withoutPrescriptionViolations}
                </h3>
                <p className="text-[10px] font-semibold mt-1 text-slate-500 dark:text-slate-400">
                  {totals?.withoutPrescriptionViolations && totals.withoutPrescriptionViolations > 0 
                    ? "Alerta Crítica: Ventas de controlados sin receta médica"
                    : "Ninguna violación detectada"}
                </p>
              </div>
            </GlassCard>
          ) : (
            <GlassCard className="p-5 flex flex-col justify-between h-32 border border-emerald-500/10 shadow-lg hover:border-emerald-500/20 transition-all duration-300">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Entregas de Recetas</span>
                <ShieldCheck className="size-5 text-emerald-500" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-850 dark:text-white mt-1">{totals?.fulfilledCount}</h3>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">Recetas ya entregadas por farmacias registradas</p>
              </div>
            </GlassCard>
          )}
        </motion.div>
      </div>

      {/* Warning Alert if Pharmacy has violations */}
      {type === 'pharmacy' && totals?.withoutPrescriptionViolations && totals.withoutPrescriptionViolations > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 rounded-2xl border border-red-500/20 bg-red-500/10 text-red-800 dark:text-red-400 flex items-start gap-3 print:hidden"
        >
          <AlertOctagon className="size-5 shrink-0 mt-0.5 animate-pulse" />
          <div className="text-xs">
            <h4 className="font-bold uppercase tracking-wider">Advertencia de Cumplimiento MINSA</h4>
            <p className="mt-1 leading-relaxed text-slate-700 dark:text-slate-300">
              Se han detectado {totals.withoutPrescriptionViolations} transacciones de medicamentos controlados sin una receta médica digital vinculada en el sistema. Bajo la Ley General de Salud de Nicaragua (Ley 423), esto califica como una infracción grave que podría acarrear la suspensión de la licencia del establecimiento. Por favor, regularice estas transacciones o asocie las firmas correspondientes.
            </p>
          </div>
        </motion.div>
      )}

      {/* Filters and Search Bar */}
      <GlassCard className="p-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between print:hidden">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por paciente, médico, medicamento o licencia..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="glass-input pl-10 pr-4 py-2 w-full text-xs rounded-full"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Control Type Filter */}
          <select
            value={controlTypeFilter}
            onChange={(e) => setControlTypeFilter(e.target.value as any)}
            className="glass-input rounded-full text-xs px-4 py-2 border border-border bg-background max-w-[200px]"
          >
            <option value="ALL">Clasificación: Todos</option>
            <option value="CONTROLLED_PSYCHOTROPIC">Psicotrópicos</option>
            <option value="CONTROLLED_NARCOTIC">Estupefacientes</option>
          </select>

          {/* Prescription presence filter (Pharmacy only) */}
          {type === 'pharmacy' && (
            <select
              value={prescriptionFilter}
              onChange={(e) => setPrescriptionFilter(e.target.value as any)}
              className="glass-input rounded-full text-xs px-4 py-2 border border-border bg-background max-w-[200px]"
            >
              <option value="ALL">Receta: Todos</option>
              <option value="WITH_PRESCRIPTION">Con Receta Digital</option>
              <option value="WITHOUT_PRESCRIPTION">Sin Receta (Incumplimientos)</option>
            </select>
          )}

          {/* Sync Button */}
          <button
            onClick={fetchReport}
            className="glass-btn-secondary p-2 rounded-full border border-border flex items-center justify-center shrink-0"
            title="Refrescar datos"
          >
            <RefreshCw className="size-4 text-slate-500" />
          </button>

          {/* Export Buttons */}
          <button
            onClick={exportToCSV}
            disabled={!filteredRecords.length}
            className="glass-btn-secondary rounded-full text-xs px-4 py-2 font-bold flex items-center gap-1.5 shrink-0 bg-teal-500/10 border border-teal-500/20 text-teal-700 dark:text-teal-400 hover:bg-teal-500/20 active:scale-95 transition"
          >
            <Download className="size-3.5" />
            CSV
          </button>

          <button
            onClick={triggerPrint}
            disabled={!filteredRecords.length}
            className="glass-btn-primary rounded-full text-xs px-4 py-2 font-bold flex items-center gap-1.5 shrink-0 hover:shadow-lg transition active:scale-95"
          >
            <Printer className="size-3.5" />
            Imprimir Libro
          </button>
        </div>
      </GlassCard>

      {/* Main Records Table */}
      <GlassCard className="overflow-hidden !p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-mono text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-muted-foreground uppercase text-[10px] tracking-wider">
                <th className="p-4 font-bold">Fecha</th>
                <th className="p-4 font-bold">Paciente</th>
                <th className="p-4 font-bold">{type === 'clinic' ? 'Médico Prescriptor' : 'Receta / Prescriptor'}</th>
                <th className="p-4 font-bold">Medicamentos</th>
                <th className="p-4 font-bold text-center">Firma Digital</th>
                {type === 'pharmacy' && <th className="p-4 font-bold text-right">Monto</th>}
                {type === 'clinic' && <th className="p-4 font-bold text-right">Entrega</th>}
              </tr>
            </thead>
            <tbody>
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={type === 'clinic' ? 6 : 6} className="p-8 text-center text-muted-foreground">
                    No se encontraron registros de sustancias controladas.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => {
                  const isViolation = type === 'pharmacy' && !r.hasPrescription;

                  return (
                    <tr 
                      key={r.id} 
                      className={cn(
                        "border-b border-border/40 hover:bg-muted/30 transition-colors",
                        isViolation && "bg-red-500/[0.02] border-l-2 border-l-red-500"
                      )}
                    >
                      {/* Date */}
                      <td className="p-4 align-top whitespace-nowrap text-slate-800 dark:text-slate-200">
                        <div className="flex items-center gap-2">
                          <Calendar className="size-3.5 text-slate-400 shrink-0" />
                          <span>{r.date.split('T')[0]}</span>
                        </div>
                      </td>

                      {/* Patient */}
                      <td className="p-4 align-top">
                        <div className="space-y-1">
                          <div className="font-bold text-foreground flex items-center gap-1">
                            <User className="size-3 text-slate-400" />
                            {r.patientName}
                          </div>
                          <div className="text-[10px] text-muted-foreground">{r.patientPhone}</div>
                        </div>
                      </td>

                      {/* Prescribing Doctor & Clinic details */}
                      <td className="p-4 align-top">
                        {type === 'clinic' ? (
                          <div className="space-y-1">
                            <div className="font-bold text-foreground flex items-center gap-1">
                              <Stethoscope className="size-3 text-slate-400" />
                              {r.doctorName}
                            </div>
                            <div className="text-[10px] text-muted-foreground">Lic: {r.doctorLicense}</div>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            {r.hasPrescription ? (
                              <>
                                <div className="font-semibold text-foreground">{r.doctorName}</div>
                                <div className="text-[10px] text-muted-foreground flex flex-col gap-0.5">
                                  <span>Lic: {r.doctorLicense}</span>
                                  <span className="italic text-teal-600 dark:text-teal-400">{r.clinicName}</span>
                                </div>
                              </>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded bg-red-500/10 px-1.5 py-0.5 text-[9px] font-bold text-red-500 uppercase tracking-widest border border-red-500/20">
                                Sin Receta Médica
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Medicines List */}
                      <td className="p-4 align-top">
                        <div className="space-y-2 max-w-xs">
                          {r.items.map((item, index) => (
                            <div key={index} className="flex flex-col gap-0.5 bg-white/[0.01] border border-white/5 rounded-lg p-1.5">
                              <div className="font-bold text-foreground text-[11px]">{item.name}</div>
                              <div className="text-[9px] text-slate-500 dark:text-slate-400 italic">Genérico: {item.genericName} | Conc: {item.concentration}</div>
                              <div className="flex items-center justify-between mt-1 text-[9px]">
                                <span className={cn(
                                  "font-bold uppercase px-1 rounded",
                                  item.controlType === 'CONTROLLED_NARCOTIC' 
                                    ? "bg-indigo-500/10 text-indigo-500" 
                                    : "bg-sky-500/10 text-sky-500"
                                )}>
                                  {item.controlType === 'CONTROLLED_NARCOTIC' ? 'Estupefaciente' : 'Psicotrópico'}
                                </span>
                                <span className="font-extrabold text-foreground bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                                  Cant: {item.quantity ?? item.quantityPrescribed}
                                </span>
                              </div>
                              {item.dosageInstructions && (
                                <p className="text-[9px] text-muted-foreground italic mt-1 border-t border-border/10 pt-1">
                                  Instr: {item.dosageInstructions}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* Digital Signature */}
                      <td className="p-4 align-top text-center">
                        <div className="flex flex-col items-center gap-1">
                          {r.digitalSignature === 'Firmada Digitalmente' ? (
                            <>
                              <ShieldCheck className="size-5 text-emerald-500 shrink-0" />
                              <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400">FIRMA HSM</span>
                              <span className="text-[8px] text-slate-450 dark:text-slate-500 italic truncate max-w-[80px]" title={r.id}>
                                Hash: {r.id.slice(0, 8)}
                              </span>
                            </>
                          ) : (
                            <>
                              <ShieldAlert className={cn(
                                "size-5 shrink-0",
                                isViolation ? "text-red-500 animate-pulse" : "text-amber-500"
                              )} />
                              <span className={cn(
                                "text-[9px] font-bold",
                                isViolation ? "text-red-500" : "text-amber-500"
                              )}>
                                {isViolation ? 'FALTA FIRMA' : 'Firma Física'}
                              </span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Right column details: Monto or Delivery status */}
                      <td className="p-4 align-top text-right whitespace-nowrap text-slate-800 dark:text-slate-200">
                        {type === 'pharmacy' ? (
                          <span className="font-bold">
                            C$ {r.items.reduce((sum, item) => sum + (item.totalPrice || 0), 0).toFixed(2)}
                          </span>
                        ) : (
                          <span className={cn(
                            "rounded px-2 py-0.5 text-[9px] font-black uppercase tracking-wider",
                            r.status === 'fulfilled' && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
                            r.status === 'partially_fulfilled' && "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
                            r.status === 'active' && "bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20"
                          )}>
                            {r.status === 'fulfilled' ? 'Entregada' : r.status === 'partially_fulfilled' ? 'Parcial' : 'Pendiente'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
