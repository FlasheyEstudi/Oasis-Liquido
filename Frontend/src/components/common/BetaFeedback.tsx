'use client';

import React, { useState } from 'react';
import { Sparkles, MessageSquare, Send, X, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { useSubmitBetaFeedback } from '@/hooks/use-api';
import { useEffect } from 'react';

export function BetaFeedback() {
  const [isOpen, setIsOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [type, setType] = useState<'bug' | 'suggestion' | 'general'>('suggestion');

  const { mutateAsync: submitFeedback } = useSubmitBetaFeedback();

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-beta-feedback', handleOpen);
    return () => window.removeEventListener('open-beta-feedback', handleOpen);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim()) return;

    try {
      await submitFeedback({
        type,
        content: feedback,
      });
      setSubmitted(true);
      setTimeout(() => {
        setIsOpen(false);
        setSubmitted(false);
        setFeedback('');
      }, 2500);
    } catch (error) {
      console.error('Error submitting beta feedback:', error);
    }
  };

  return (
    <>

      {/* Slide-in Sidebar Panel */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm">
            {/* Modal Overlay */}
            <div className="absolute inset-0" onClick={() => setIsOpen(false)} />

            {/* Panel Card */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative z-10 w-full max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800/80 p-6 flex flex-col justify-between shadow-2xl h-full"
            >
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/50 mb-6">
                  <div className="flex items-center gap-2">
                    <div className="size-8 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-500 flex items-center justify-center">
                      <Sparkles className="size-4 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">Oasis Nicaragua Beta</h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">Canal directo con el equipo de soporte técnico</p>
                    </div>
                  </div>
                  <button onClick={() => setIsOpen(false)} className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition text-slate-400">
                    <X className="size-4" />
                  </button>
                </div>

                <AnimatePresence mode="wait">
                  {submitted ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-12 space-y-4"
                    >
                      <div className="inline-flex items-center justify-center size-12 rounded-full bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/25 text-emerald-500">
                        <CheckCircle2 className="size-6 animate-pulse" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-black text-slate-900 dark:text-white">¡Feedback Enviado!</h4>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">Gracias por ayudarnos a perfeccionar Oasis Nicaragua.</p>
                      </div>
                    </motion.div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      {/* Selection tabs */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tipo de Comentario</label>
                        <div className="grid grid-cols-3 gap-2">
                          {(['suggestion', 'bug', 'general'] as const).map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => setType(t)}
                              className={`py-1.5 rounded-xl border font-bold text-[10px] capitalize transition-all ${
                                type === t
                                  ? 'bg-teal-500/10 border-teal-500/40 text-teal-600 dark:text-teal-300 shadow-[0_0_8px_rgba(20,184,166,0.15)]'
                                  : 'bg-transparent border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/30'
                              }`}
                            >
                              {t === 'bug' ? '🐛 Bug' : t === 'suggestion' ? '💡 Idea' : '💬 General'}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Text Input */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Detalles del Reporte</label>
                        <textarea
                          rows={6}
                          value={feedback}
                          onChange={(e) => setFeedback(e.target.value)}
                          placeholder={
                            type === 'bug'
                              ? 'Describe el error, los pasos para reproducirlo y lo que esperabas que pasara...'
                              : 'Cuéntanos tu sugerencia o idea para mejorar la plataforma de Oasis...'
                          }
                          className="w-full rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/20 p-3 text-xs text-slate-800 dark:text-white placeholder-slate-450 focus:outline-none focus:border-teal-500/50 resize-none transition-all"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={!feedback.trim()}
                        className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white font-extrabold text-xs transition-all shadow-[0_4px_16px_rgba(20,184,166,0.25)] cursor-pointer"
                      >
                        <Send className="size-3.5" /> Enviar Reporte del Beta
                      </button>
                    </form>
                  )}
                </AnimatePresence>
              </div>

              <div className="text-center text-[9px] text-slate-400 dark:text-slate-500 pt-4 border-t border-slate-100 dark:border-slate-800/40">
                Oasis Nicaragua v1.0.0-Beta01 • Desarrollado por Advanced Agentic Coding
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
