'use client';

import { useEffect, useState } from 'react';
import { 
  registerServiceWorker, 
  requestFirebaseToken, 
  onForegroundMessage,
  hasValidConfig,
  messaging
} from '@/lib/firebase-config';
import { post } from '@/api/client';
import { useAuthStore } from '@/store/auth-store';

import { toast } from 'sonner';

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(true);
  const [isEnabled, setIsEnabled] = useState(false);
  const { isAuthenticated } = useAuthStore();

  // Detectar si las notificaciones están soportadas
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    if (!('Notification' in window)) {
      setIsSupported(false);
      console.warn('⚠️ Notifications not supported in this browser');
      return;
    }
    
    setPermission(Notification.permission);
  }, []);

  // Registrar SW y token al montar
  useEffect(() => {
    if (!isSupported || !isAuthenticated) return;
    // Guard directamente en caso de race condition donde isSupported aún no se actualizó
    if (typeof window === 'undefined' || typeof Notification === 'undefined') return;
    if (!hasValidConfig) {
      console.warn('⚠️ Firebase not configured. Notifications disabled.');
      return;
    }
    
    const init = async () => {
      try {
        // Registrar Service Worker
        const registration = await registerServiceWorker();
        if (!registration) return;
        
        // Si ya tiene permiso, obtener token
        if (Notification.permission === 'granted') {
          const token = await requestFirebaseToken(registration);
          if (token) {
            // Enviar token al backend
            await post('/notifications/register-token', {
              token,
              deviceInfo: `${navigator.userAgent} - ${window.innerWidth}x${window.innerHeight}`,
            });
            setIsEnabled(true);
          }
        }
      } catch (error) {
        console.error('❌ Error initializing notifications:', error);
      }
    };
    
    init();
  }, [isSupported, isAuthenticated]);

  // Escuchar mensajes en primer plano
  useEffect(() => {
    if (!messaging) return;
    
    const unsubscribe = onForegroundMessage((payload) => {
      // Mostrar notificación personalizada en primer plano
      if (payload.notification) {
        console.log('📨 Notification:', payload.notification.title, payload.notification.body);
        // Custom window alerts or toast can be fired here
        toast.info(
          `🔔 ${payload.notification.title || 'Mensaje de Oasis'}\n${payload.notification.body || ''}`
        );
      }
    });
    
    return () => unsubscribe();
  }, []);

  // Solicitar permiso manualmente
  const requestPermission = async () => {
    if (!isSupported) {
      toast.error('Este navegador no soporta notificaciones de inserción.');
      return false;
    }
    
    if (!hasValidConfig) {
      toast.error('Firebase no está configurado en producción (Faltan variables de entorno).');
      return false;
    }
    
    const loadingToast = toast.loading('Solicitando permisos de notificaciones...');
    
    try {
      const registration = await registerServiceWorker();
      if (!registration) {
        toast.dismiss(loadingToast);
        toast.error('No se pudo registrar el Service Worker de notificaciones.');
        return false;
      }
      
      const token = await requestFirebaseToken(registration);
      if (token) {
        await post('/notifications/register-token', {
          token,
          deviceInfo: navigator.userAgent,
        });
        setPermission('granted');
        setIsEnabled(true);
        toast.dismiss(loadingToast);
        toast.success('🎉 ¡Notificaciones activadas con éxito!');
        return true;
      } else {
        toast.dismiss(loadingToast);
        // Analizar qué podría fallar de manera específica
        const checkPermission = Notification.permission;
        if (checkPermission === 'denied') {
          toast.error('Permiso bloqueado por el navegador. Habilítalo en los ajustes del sitio.');
        } else {
          toast.error('No se recibió la clave VAPID de Firebase. Verifica tus variables de entorno.');
        }
        return false;
      }
    } catch (error: any) {
      toast.dismiss(loadingToast);
      console.error('❌ Error requesting permission:', error);
      toast.error(`Error al activar notificaciones: ${error?.message || 'Error desconocido'}`);
      return false;
    }
  };

  return {
    isSupported,
    permission,
    isEnabled,
    requestPermission,
  };
}
