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

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(true);
  const [isEnabled, setIsEnabled] = useState(false);

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
    if (!isSupported) return;
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
  }, [isSupported]);

  // Escuchar mensajes en primer plano
  useEffect(() => {
    if (!messaging) return;
    
    const unsubscribe = onForegroundMessage((payload) => {
      // Mostrar notificación personalizada en primer plano
      if (payload.notification) {
        console.log('📨 Notification:', payload.notification.title, payload.notification.body);
        // Custom window alerts or toast can be fired here
      }
    });
    
    return () => unsubscribe();
  }, []);

  // Solicitar permiso manualmente
  const requestPermission = async () => {
    if (!isSupported) {
      console.warn('⚠️ Notifications not supported');
      return false;
    }
    
    if (!hasValidConfig) {
      console.warn('⚠️ Firebase not configured');
      return false;
    }
    
    try {
      const registration = await registerServiceWorker();
      if (!registration) return false;
      
      const token = await requestFirebaseToken(registration);
      if (token) {
        await post('/notifications/register-token', {
          token,
          deviceInfo: navigator.userAgent,
        });
        setPermission('granted');
        setIsEnabled(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Error requesting permission:', error);
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
