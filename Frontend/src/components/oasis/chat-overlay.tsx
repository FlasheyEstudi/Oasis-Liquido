'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { 
  useAppointments, 
  useDeliveryOrders, 
  useChatMessages, 
  useSendMessage,
  useChatSessions,
  useCreateChatSession
} from '@/hooks/use-api';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from './glass-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageCircle, X, Send, User, Truck, Stethoscope, Store, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDate } from '@/utils/helpers';

export function ChatOverlay() {
  const { user } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Poll for context-based chat opportunities
  const appointmentsQuery = useAppointments({ status: 'scheduled' });
  const deliveriesQuery = useDeliveryOrders({ status: 'in_transit' });

  const activeAppointments = appointmentsQuery.data?.data || [];
  const activeDeliveries = deliveriesQuery.data?.data || [];

  const hasContext = activeAppointments.length > 0 || activeDeliveries.length > 0;

  // For demo: automatically pick first context
  const currentContext = activeDeliveries[0] 
    ? { id: activeDeliveries[0].id, type: 'delivery', name: activeDeliveries[0].driver?.name || 'Repartidor', icon: Truck, isAvailable: true }
    : activeAppointments[0]
    ? { 
        id: activeAppointments[0].id, 
        type: 'appointment', 
        name: activeAppointments[0].doctor?.name || 'Médico', 
        icon: Stethoscope,
        isAvailable: new Date().getHours() >= 9 && new Date().getHours() < 18
      }
    : null;

  const messagesQuery = useChatMessages(activeSessionId || '');
  const sendMessageMutation = useSendMessage();
  const { data: sessionsData } = useChatSessions();
  const createSessionMutation = useCreateChatSession();

  // Manage session lifecycle
  useEffect(() => {
    if (!currentContext || !sessionsData?.data) return;

    // Find existing session for this context
    const existing = sessionsData.data.find((s: any) => s.targetId === currentContext.id);
    
    if (existing) {
      setActiveSessionId(existing.id);
    } else if (isOpen && !createSessionMutation.isPending) {
      // Create session only when user opens chat to avoid unnecessary entries
      createSessionMutation.mutate({
        type: currentContext.type,
        targetId: currentContext.id,
        participantIds: [] // Backend adds current user
      }, {
        onSuccess: (newSession) => {
          setActiveSessionId(newSession.data.id);
        }
      });
    }
  }, [currentContext, sessionsData, isOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messagesQuery.data, isOpen]);

  const handleSend = async () => {
    if (!message.trim() || !activeSessionId) return;
    await sendMessageMutation.mutateAsync({ sessionId: activeSessionId, content: message });
    setMessage('');
  };

  if (!user || !hasContext) return null;

  return (
    <div className="fixed bottom-24 right-6 z-[50] flex flex-col items-end gap-4 pointer-events-none">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="pointer-events-auto"
          >
            <GlassCard className="w-80 h-[450px] flex flex-col p-0 overflow-hidden shadow-2xl border-white/20 bg-background/80 backdrop-blur-2xl">
              {/* Chat Header */}
              <div className="p-4 bg-gradient-to-r from-teal-500/20 to-sky-500/20 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-teal-500/20 flex items-center justify-center text-teal-600">
                    {currentContext?.icon && <currentContext.icon className="size-5" />}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{currentContext?.name}</p>
                    <div className={cn(
                      "flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider",
                      currentContext?.isAvailable ? "text-emerald-500" : "text-amber-500"
                    )}>
                      <div className={cn(
                        "size-1.5 rounded-full animate-pulse",
                        currentContext?.isAvailable ? "bg-emerald-500" : "bg-amber-500"
                      )} />
                      {currentContext?.isAvailable ? "En Línea" : "Fuera de Horario"}
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="rounded-full size-8" onClick={() => setIsOpen(false)}>
                  <X className="size-4" />
                </Button>
              </div>

              {/* Messages Area */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {messagesQuery.isLoading ? (
                  <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
                    <Clock className="size-6 animate-spin-slow" />
                    <p className="text-xs">Cargando mensajes...</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-[10px] text-center text-muted-foreground uppercase tracking-widest py-2">Hoy</p>
                    {messagesQuery.data?.data?.length === 0 ? (
                      <div className="py-12 text-center">
                        <MessageCircle className="size-8 text-muted-foreground/20 mx-auto mb-2" />
                        <p className="text-xs text-muted-foreground">Inicia una conversación</p>
                      </div>
                    ) : (
                      messagesQuery.data?.data?.map((msg: any) => {
                        const isMe = msg.senderId === user.id;
                        return (
                          <div key={msg.id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                            <div className={cn(
                              "max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm",
                              isMe 
                                ? "rounded-tr-none bg-teal-500 text-white" 
                                : "rounded-tl-none bg-muted border border-border/50 text-foreground"
                            )}>
                              {msg.content}
                              <p className={cn("text-[9px] mt-1 opacity-70", isMe ? "text-right" : "text-left")}>
                                {formatDate(msg.createdAt, 'HH:mm')}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {/* Input Area */}
              <div className="p-3 border-t border-white/10 bg-muted/30">
                <form 
                  onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                  className="flex items-center gap-2"
                >
                  <Input 
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Escribe un mensaje..."
                    className="rounded-full bg-background/50 border-white/10 text-xs h-10"
                  />
                  <Button 
                    type="submit" 
                    size="icon" 
                    disabled={!message.trim()}
                    className="size-10 rounded-full bg-teal-500 hover:bg-teal-600 text-white shrink-0 shadow-lg shadow-teal-500/20"
                  >
                    <Send className="size-4" />
                  </Button>
                </form>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="pointer-events-auto relative size-14 rounded-full bg-gradient-to-br from-teal-500 to-sky-600 text-white flex items-center justify-center shadow-2xl shadow-teal-500/40 ring-4 ring-white/10"
      >
        <MessageCircle className={cn("size-7 transition-transform duration-500", isOpen ? "rotate-90 scale-0" : "scale-100")} />
        <X className={cn("size-7 absolute transition-transform duration-500", isOpen ? "scale-100" : "scale-0 -rotate-90")} />
        
        {/* Notification Badge */}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 size-5 rounded-full bg-red-500 border-2 border-white flex items-center justify-center text-[10px] font-black">
            1
          </span>
        )}
      </motion.button>
    </div>
  );
}
