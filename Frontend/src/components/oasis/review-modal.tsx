'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, MessageSquare, X, Send, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { GlassCard } from './glass-card';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetName: string;
  targetType: 'doctor' | 'pharmacy' | 'delivery';
  onSubmit: (rating: number, comment: string) => void;
}

export function ReviewModal({ isOpen, onClose, targetName, targetType, onSubmit }: ReviewModalProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = () => {
    if (rating === 0) {
      toast.error('Por favor, selecciona una calificación');
      return;
    }
    onSubmit(rating, comment);
    setIsSubmitted(true);
    setTimeout(() => {
      onClose();
      setIsSubmitted(false);
      setRating(0);
      setComment('');
    }, 2000);
  };

  const getLabel = () => {
    switch (targetType) {
      case 'doctor': return 'Tu experiencia con el Dr.';
      case 'pharmacy': return 'Tu experiencia con la farmacia';
      case 'delivery': return 'Tu experiencia con el reparto';
      default: return 'Tu experiencia';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md z-10"
          >
            <GlassCard className="p-6 overflow-hidden border-white/20 shadow-2xl">
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-muted-foreground transition-colors"
              >
                <X className="size-5" />
              </button>

              {!isSubmitted ? (
                <div className="space-y-6">
                  <div className="text-center space-y-2">
                    <div className="mx-auto size-16 rounded-3xl bg-teal-500/10 flex items-center justify-center text-teal-500 mb-2">
                      <Star className="size-8 fill-current" />
                    </div>
                    <h3 className="text-xl font-black text-foreground">Tu opinión nos importa</h3>
                    <p className="text-sm text-muted-foreground">
                      {getLabel()} <span className="font-bold text-foreground">{targetName}</span>
                    </p>
                  </div>

                  {/* Star Rating */}
                  <div className="flex justify-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <motion.button
                        key={star}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        onMouseEnter={() => setHoveredRating(star)}
                        onMouseLeave={() => setHoveredRating(0)}
                        onClick={() => setRating(star)}
                        className="p-1"
                      >
                        <Star 
                          className={cn(
                            "size-10 transition-colors duration-200",
                            (hoveredRating || rating) >= star 
                              ? "fill-amber-400 text-amber-400" 
                              : "text-muted-foreground/30"
                          )}
                        />
                      </motion.button>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground px-1">Comentario (opcional)</label>
                    <Textarea 
                      placeholder="Cuéntanos más sobre tu experiencia..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="min-h-[100px] rounded-2xl bg-white/5 border-white/10 focus:ring-teal-500/30 text-sm"
                    />
                  </div>

                  <Button 
                    onClick={handleSubmit}
                    className="w-full h-12 rounded-full bg-gradient-to-r from-teal-500 to-sky-600 text-white font-bold shadow-lg shadow-teal-500/20"
                  >
                    Enviar Reseña
                    <Send className="size-4 ml-2" />
                  </Button>
                </div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-12 text-center space-y-4"
                >
                  <div className="mx-auto size-20 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-xl shadow-emerald-500/30">
                    <Heart className="size-10 fill-current" />
                  </div>
                  <h3 className="text-2xl font-black text-foreground">¡Gracias!</h3>
                  <p className="text-muted-foreground">Tu reseña ayuda a mejorar nuestro oasis.</p>
                </motion.div>
              )}
            </GlassCard>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
