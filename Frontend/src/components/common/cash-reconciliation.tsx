// OASIS - Cash Reconciliation drawer component
// Interactive visual dashboard for daily cash settlements, balances, and discrepancies

'use client';

import { useState } from 'react';
import { 
  useReconciliationSummary, 
  useCreateReconciliation, 
  useReconciliationHistory,
  getHookErrorMessage
} from '@/hooks/use-api';
import { GlassCard } from '@/components/oasis/glass-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatDate, formatCurrency } from '@/utils/helpers';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { 
  Scale, 
  TrendingUp, 
  Coins, 
  CreditCard, 
  ArrowRightLeft, 
  Clock, 
  User, 
  AlertTriangle, 
  CheckCircle,
  FileSpreadsheet,
  Plus,
  X
} from 'lucide-react';

interface CashReconciliationProps {
  entityId: string;
  type: 'clinics' | 'pharmacies';
}

export function CashReconciliation({ entityId, type }: CashReconciliationProps) {
  const [openingBalance, setOpeningBalance] = useState('1000'); // Default base/change drawer
  const [actualCash, setActualCash] = useState('');
  const [actualCard, setActualCard] = useState('');
  const [notes, setNotes] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);

  // React Query hooks
  const { 
    data: summaryResult, 
    isLoading: summaryLoading, 
    refetch: refetchSummary 
  } = useReconciliationSummary(entityId, type);

  const { 
    data: historyResult, 
    isLoading: historyLoading, 
    refetch: refetchHistory 
  } = useReconciliationHistory(entityId, type);

  const createReconciliation = useCreateReconciliation();

  const summary = summaryResult ?? { expectedCash: 0, expectedCard: 0, expectedTotal: 0, salesCount: 0 };
  const history = historyResult ?? [];

  // Compute live calculations
  const parsedOpening = parseFloat(openingBalance) || 0;
  const parsedCash = parseFloat(actualCash) || 0;
  const parsedCard = parseFloat(actualCard) || 0;
  
  const expectedTotalCash = parsedOpening + summary.expectedCash;
  const discrepancyCash = parsedCash - expectedTotalCash;
  const discrepancyCard = parsedCard - summary.expectedCard;
  const totalDiscrepancy = discrepancyCash + discrepancyCard;

  const handleSettle = () => {
    if (actualCash === '' || actualCard === '') {
      toast.warning('Por favor ingrese el total de efectivo y de tarjetas declarados en caja');
      return;
    }

    createReconciliation.mutate({
      entityId,
      type,
      data: {
        openingBalance: parsedOpening,
        actualCash: parsedCash,
        actualCard: parsedCard,
        notes: notes.trim(),
      }
    }, {
      onSuccess: () => {
        toast.success('Arqueo de caja realizado y sellado con éxito');
        setActualCash('');
        setActualCard('');
        setNotes('');
        setIsFormOpen(false);
        refetchSummary();
        refetchHistory();
      },
      onError: (err: any) => {
        toast.error(err.message || 'Error al guardar el arqueo de caja');
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* Header quick stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <GlassCard className="p-5 flex items-center gap-4 border border-teal-500/10 hover:border-teal-500/20 transition-all">
          <div className="size-12 bg-sky-500/10 rounded-2xl flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0">
            <TrendingUp className="size-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Ventas Hoy</span>
            <span className="text-xl font-bold text-foreground">{formatCurrency(summary.expectedTotal)}</span>
            <span className="text-xs text-muted-foreground block">{summary.salesCount} transacciones</span>
          </div>
        </GlassCard>

        <GlassCard className="p-5 flex items-center gap-4 border border-teal-500/10 hover:border-teal-500/20 transition-all">
          <div className="size-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <Coins className="size-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Efectivo Sistema</span>
            <span className="text-xl font-bold text-foreground">{formatCurrency(summary.expectedCash)}</span>
          </div>
        </GlassCard>

        <GlassCard className="p-5 flex items-center gap-4 border border-teal-500/10 hover:border-teal-500/20 transition-all">
          <div className="size-12 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
            <CreditCard className="size-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Tarjeta Sistema</span>
            <span className="text-xl font-bold text-foreground">{formatCurrency(summary.expectedCard)}</span>
          </div>
        </GlassCard>

        <GlassCard className="p-5 flex items-center gap-4 border border-teal-500/10 hover:border-teal-500/20 transition-all">
          <div className="size-12 bg-teal-500/10 rounded-2xl flex items-center justify-center text-teal-600 dark:text-teal-400 shrink-0">
            <Scale className="size-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Último Cierre</span>
            <span className="text-sm font-bold text-foreground">
              {history.length > 0 ? formatDate(history[0].createdAt, 'dd/MM/yyyy HH:mm') : 'Sin cierres hoy'}
            </span>
            <span className="text-xs text-muted-foreground block">Registros inmutables</span>
          </div>
        </GlassCard>
      </div>

      {/* Main panel - new settlement & historical settlements */}
      <div className="grid gap-6 lg:grid-cols-12">
        
        {/* Settle Drawer form */}
        <div className={cn("transition-all duration-300", isFormOpen ? "lg:col-span-5" : "lg:col-span-12")}>
          {!isFormOpen ? (
            <GlassCard className="flex flex-col items-center justify-center py-10 text-center border-dashed border-2 border-border/80">
              <Scale className="size-16 text-teal-500/30 mb-4 animate-pulse" />
              <h3 className="text-xl font-bold mb-2">Reconciliación y Arqueo Diario</h3>
              <p className="text-sm text-muted-foreground max-w-md mb-6">
                Cuadra la caja al final del día. Compara el efectivo físico real de la gaveta contra los registros del sistema de OASIS.
              </p>
              <Button onClick={() => setIsFormOpen(true)} className="glass-btn-primary rounded-full px-8 py-2 font-semibold flex items-center gap-2">
                <Plus className="size-5" />
                Iniciar Nuevo Arqueo de Caja
              </Button>
            </GlassCard>
          ) : (
            <GlassCard className="p-6 relative">
              <button onClick={() => setIsFormOpen(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
                <X className="size-5" />
              </button>
              
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <Scale className="size-5 text-teal-500" />
                Cuadre de Turno / Caja
              </h3>

              <div className="space-y-6">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block ml-1">Fondo de Apertura (Cambio)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input 
                      type="number" 
                      value={openingBalance} 
                      onChange={(e) => setOpeningBalance(e.target.value)} 
                      className="pl-8 h-12 rounded-xl text-base font-bold"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block ml-1">Efectivo Físico Contado</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <Input 
                        type="number" 
                        placeholder="Monto en gaveta"
                        value={actualCash} 
                        onChange={(e) => setActualCash(e.target.value)} 
                        className="pl-8 h-12 rounded-xl text-base font-bold border-teal-500/20 focus:border-teal-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block ml-1">Tarjetas Declarado (Vouchers)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <Input 
                        type="number" 
                        placeholder="Total vouchers"
                        value={actualCard} 
                        onChange={(e) => setActualCard(e.target.value)} 
                        className="pl-8 h-12 rounded-xl text-base font-bold border-teal-500/20 focus:border-teal-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Real-time Math Summary Card */}
                <div className="p-5 rounded-2xl bg-muted/30 border border-border/50 space-y-3">
                  <div className="flex justify-between text-xs text-muted-foreground font-semibold">
                    <span>Efectivo Esperado (Base + Ventas):</span>
                    <span>{formatCurrency(expectedTotalCash)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground font-semibold">
                    <span>Tarjetas Esperado:</span>
                    <span>{formatCurrency(summary.expectedCard)}</span>
                  </div>
                  <div className="border-t border-border/30 pt-3 flex justify-between items-center">
                    <span className="text-sm font-bold">Discrepancia Total:</span>
                    <span className={cn(
                      "text-base font-extrabold px-3 py-1 rounded-full",
                      totalDiscrepancy === 0 && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                      totalDiscrepancy > 0 && "bg-amber-500/10 text-amber-600 dark:text-amber-400",
                      totalDiscrepancy < 0 && "bg-red-500/10 text-red-600 dark:text-red-400"
                    )}>
                      {totalDiscrepancy > 0 ? '+' : ''}{formatCurrency(totalDiscrepancy)}
                    </span>
                  </div>
                  
                  {/* Micro-insights alerts */}
                  {totalDiscrepancy < -2 && (
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-500/5 border border-red-500/10 text-red-600 dark:text-red-400 text-xs">
                      <AlertTriangle className="size-4 shrink-0" />
                      <span>Faltante detectado. Por favor, especifique el motivo en las notas de abajo.</span>
                    </div>
                  )}
                  {totalDiscrepancy > 2 && (
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/10 text-amber-600 dark:text-amber-400 text-xs">
                      <AlertTriangle className="size-4 shrink-0" />
                      <span>Sobrante en caja. Verifique si hay pagos sin registrar en el sistema.</span>
                    </div>
                  )}
                  {Math.abs(totalDiscrepancy) <= 2 && (
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs">
                      <CheckCircle className="size-4 shrink-0" />
                      <span>Caja cuadrada perfectamente con el sistema. Excelente gestión.</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase mb-2 block ml-1">Observaciones / Notas</label>
                  <textarea 
                    value={notes} 
                    onChange={(e) => setNotes(e.target.value)} 
                    placeholder="Notas aclaratorias sobre discrepancias o estado de la gaveta..."
                    className="w-full min-h-[90px] rounded-xl border border-border bg-transparent p-3 text-sm focus:outline-none focus:border-teal-500 resize-none"
                  />
                </div>

                <Button 
                  onClick={handleSettle} 
                  disabled={createReconciliation.isPending}
                  className="w-full h-12 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-base shadow-lg shadow-teal-600/10"
                >
                  {createReconciliation.isPending ? 'Sellar Cierre...' : 'Sellar y Registrar Arqueo'}
                </Button>
              </div>
            </GlassCard>
          )}
        </div>

        {/* History table */}
        <div className={cn("transition-all duration-300", isFormOpen ? "lg:col-span-7" : "lg:col-span-12")}>
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Clock className="size-5 text-sky-500" />
                Historial de Arqueos de Caja
              </h3>
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-semibold">
                <FileSpreadsheet className="size-4 text-emerald-600" />
                Bitácora Digital de Auditoría
              </div>
            </div>

            {historyLoading ? (
              <div className="space-y-3 py-6">
                <div className="shimmer h-12 rounded-xl" />
                <div className="shimmer h-12 rounded-xl" />
                <div className="shimmer h-12 rounded-xl" />
              </div>
            ) : history.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Scale className="size-12 text-muted-foreground/30 mb-3" />
                <h4 className="text-base font-semibold mb-1">Sin arqueos</h4>
                <p className="text-sm text-muted-foreground max-w-xs">No se han registrado arqueos de caja en este local todavía.</p>
              </div>
            ) : (
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-border/40 text-xs font-bold uppercase text-muted-foreground">
                      <th className="py-3 px-2">Fecha y Hora</th>
                      <th className="py-3 px-2">Cajero/Usuario</th>
                      <th className="py-3 px-2 text-right">Inicial</th>
                      <th className="py-3 px-2 text-right">Declarado</th>
                      <th className="py-3 px-2 text-right">Discrepancia</th>
                      <th className="py-3 px-2 text-center">Resultado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((record) => {
                      const disc = record.discrepancies?.total ?? 0;
                      return (
                        <tr key={record.auditId || record.id} className="border-b border-border/20 hover:bg-muted/10 transition-colors">
                          <td className="py-3 px-2 font-medium whitespace-nowrap">
                            <span className="block text-foreground">{formatDate(record.createdAt, 'dd/MM/yyyy')}</span>
                            <span className="text-[10px] text-muted-foreground font-mono">{formatDate(record.createdAt, 'HH:mm:ss')}</span>
                          </td>
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-2">
                              <div className="size-7 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center text-xs font-bold">
                                <User className="size-3.5" />
                              </div>
                              <span className="font-semibold block truncate max-w-[120px]">{record.user?.name || 'Sistema'}</span>
                            </div>
                          </td>
                          <td className="py-3 px-2 text-right font-mono text-xs">{formatCurrency(record.openingBalance || 0)}</td>
                          <td className="py-3 px-2 text-right font-mono text-xs font-semibold text-foreground">
                            {formatCurrency(record.actualDeclared?.total || 0)}
                          </td>
                          <td className="py-3 px-2 text-right">
                            <span className={cn(
                              "font-mono text-xs font-bold",
                              disc === 0 && "text-emerald-500",
                              disc > 0 && "text-amber-500",
                              disc < 0 && "text-red-500"
                            )}>
                              {disc > 0 ? '+' : ''}{formatCurrency(disc)}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-center">
                            <span className={cn(
                              "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                              record.status === 'conciliated' && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                              record.status === 'surplus' && "bg-amber-500/10 text-amber-600 dark:text-amber-400",
                              record.status === 'deficit' && "bg-red-500/10 text-red-600 dark:text-red-400"
                            )}>
                              {record.status === 'conciliated' ? 'Cuadrado' : record.status === 'surplus' ? 'Sobrante' : 'Faltante'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </GlassCard>
        </div>

      </div>
    </div>
  );
}
