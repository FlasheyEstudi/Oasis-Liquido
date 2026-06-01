'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { getSocket, joinChatRoom } from '@/lib/socket';
import { useQueryClient } from '@tanstack/react-query';
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
  const { user, representedUser } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const isChatAllowed = user && ['patient', 'doctor', 'delivery_driver'].includes(user.role);
  const activePatientId = representedUser?.id || user?.id;

  // Poll for context-based chat opportunities matching the active profile
  const appointmentsQuery = useAppointments({ 
    patient_id: user?.role === 'patient' ? activePatientId : undefined,
    doctor_id: user?.role === 'doctor' ? user?.id : undefined,
  }, isChatAllowed === true);

  const deliveriesQuery = useDeliveryOrders({ 
    patient_id: user?.role === 'patient' ? activePatientId : undefined,
    delivery_driver_id: user?.role === 'delivery_driver' ? user?.id : undefined,
  }, isChatAllowed === true);

  const activeAppointments = (appointmentsQuery.data?.data || []).filter((appt: any) => {
    if (!user) return false;
    const isActiveStatus = ['scheduled', 'in_progress'].includes(appt.status);
    if (!isActiveStatus) return false;
    if (user.role === 'patient') return appt.patient_id === activePatientId;
    if (user.role === 'doctor') return appt.doctor_id === user.id;
    return false;
  });

  const activeDeliveries = (deliveriesQuery.data?.data || []).filter((del: any) => {
    if (!user) return false;
    const isActiveStatus = ['assigned', 'picked_up', 'in_transit'].includes(del.status);
    if (!isActiveStatus) return false;
    if (user.role === 'patient') return del.patient_id === activePatientId;
    if (user.role === 'delivery_driver') return del.delivery_driver_id === user.id;
    return false;
  });

  const hasContext = activeAppointments.length > 0 || activeDeliveries.length > 0;

  // For demo: automatically pick first context
  const currentContext = activeDeliveries[0] 
    ? { 
        id: activeDeliveries[0].id, 
        type: 'delivery', 
        name: user?.role === 'patient' 
          ? (activeDeliveries[0].driver?.name || 'Repartidor') 
          : (activeDeliveries[0].patient?.name || 'Paciente'), 
        icon: Truck, 
        isAvailable: true,
        participantIds: [activeDeliveries[0].patient_id, activeDeliveries[0].delivery_driver_id].filter(Boolean) as string[]
      }
    : activeAppointments[0]
    ? { 
        id: activeAppointments[0].id, 
        type: 'appointment', 
        name: user?.role === 'patient' 
          ? (activeAppointments[0].doctor?.name || 'Médico') 
          : (activeAppointments[0].patient?.name || 'Paciente'), 
        icon: Stethoscope,
        isAvailable: new Date().getHours() >= 9 && new Date().getHours() < 18,
        participantIds: [activeAppointments[0].patient_id, activeAppointments[0].doctor_id].filter(Boolean) as string[]
      }
    : null;

  const messagesQuery = useChatMessages(activeSessionId || '');
  const sendMessageMutation = useSendMessage();
  const { data: sessionsData } = useChatSessions();
  const createSessionMutation = useCreateChatSession();

  // Reset state when user context changes (logout, switch of user, etc.)
  useEffect(() => {
    setIsOpen(false);
    setActiveSessionId(null);
    setMessage('');
  }, [user?.id, representedUser?.id]);

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
        participantIds: (currentContext as any).participantIds || []
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

  // Real-time Chat Socket listener
  useEffect(() => {
    if (activeSessionId) {
      joinChatRoom(activeSessionId);
      const socket = getSocket();

      const handleNewMessage = (newMessage: any) => {
        // Update React Query cache immediately
        queryClient.setQueryData(['chats', 'messages', activeSessionId], (old: any) => {
          if (!old) return { data: [newMessage] };
          
          // Avoid duplicates
          const exists = old.data.some((m: any) => m.id === newMessage.id);
          if (exists) return old;

          return {
            ...old,
            data: [...old.data, newMessage]
          };
        });
      };

      socket.on('chat:message', handleNewMessage);
      
      return () => {
        socket.off('chat:message', handleNewMessage);
      };
    }
  }, [activeSessionId, queryClient]);

  const handleSend = async () => {
    if (!message.trim() || !activeSessionId) return;
    await sendMessageMutation.mutateAsync({ sessionId: activeSessionId, content: message });
    setMessage('');
  };

  if (!user || !isChatAllowed || !hasContext) return null;

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
            <GlassCard variant="strong" className="w-80 h-[450px] flex flex-col p-0 overflow-hidden shadow-2xl bg-white/98 dark:bg-zinc-950/98 backdrop-blur-2xl border border-slate-200/40 dark:border-white/5">
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
                                ? "rounded-tr-none bg-gradient-to-br from-teal-500 to-teal-600 text-white font-medium shadow-[inset_-1px_-1px_3px_rgba(0,0,0,0.15),inset_1px_1px_3px_rgba(255,255,255,0.25)] border border-teal-400/20" 
                                : "rounded-tl-none bg-muted border border-border/50 text-foreground shadow-[inset_1px_1px_2px_rgba(255,255,255,0.05)]"
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
                    className="size-10 rounded-full clay-btn-primary flex items-center justify-center shrink-0 shadow-lg text-black font-extrabold"
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
        className="pointer-events-auto relative size-14 rounded-full clay-btn-primary flex items-center justify-center shadow-2xl shadow-teal-500/30 text-black"
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
