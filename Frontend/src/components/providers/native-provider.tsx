'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

interface NativeBridgeContextType {
  isNativeAndroid: boolean;
  isWebView: boolean;
  triggerNativeVibration: (pattern: number[]) => void;
  startNativeQRScan: (onSuccess: (data: string) => void, onFailure?: (err: string) => void) => void;
  isNativeScanActive: boolean;
  toggleNativeLocationTracking: (active: boolean, orderId: string) => void;
}

const NativeBridgeContext = createContext<NativeBridgeContextType>({
  isNativeAndroid: false,
  isWebView: false,
  triggerNativeVibration: () => {},
  startNativeQRScan: () => {},
  isNativeScanActive: false,
  toggleNativeLocationTracking: () => {},
});

export function NativeProvider({ children }: { children: React.ReactNode }) {
  const [isNativeAndroid, setIsNativeAndroid] = useState(false);
  const [isWebView, setIsWebView] = useState(false);
  const [isNativeScanActive, setIsNativeScanActive] = useState(false);
  const [scanSuccessCallback, setScanSuccessCallback] = useState<((data: string) => void) | null>(null);
  const [scanFailureCallback, setScanFailureCallback] = useState<((err: string) => void) | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Detect WebView / Android User Agent
    const ua = navigator.userAgent || '';
    const isAndroid = /Android/i.test(ua);
    const isWV = isAndroid && (/Version\//i.test(ua) || /wv/i.test(ua) || 'OasisAndroidBridge' in window);

    setIsNativeAndroid(isAndroid);
    setIsWebView(!!isWV);

    // Register global listener for Native Android Scanner callback
    (window as any).onNativeQRScanned = (data: string) => {
      setIsNativeScanActive(false);
      if (scanSuccessCallback) {
        scanSuccessCallback(data);
      }
    };

    (window as any).onNativeQRFailed = (error: string) => {
      setIsNativeScanActive(false);
      if (scanFailureCallback) {
        scanFailureCallback(error);
      }
    };
  }, [scanSuccessCallback, scanFailureCallback]);

  const triggerNativeVibration = (pattern: number[]) => {
    if (typeof window !== 'undefined' && (window as any).OasisAndroidBridge?.vibrate) {
      // Call native Android bridge
      try {
        (window as any).OasisAndroidBridge.vibrate(JSON.stringify(pattern));
      } catch (e) {
        console.warn("Failed to call native vibration interface:", e);
      }
    } else if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      // Fallback to PWA / Web API
      navigator.vibrate(pattern);
    }
  };

  const startNativeQRScan = (onSuccess: (data: string) => void, onFailure?: (err: string) => void) => {
    if (typeof window !== 'undefined' && (window as any).OasisAndroidBridge?.scanQR) {
      setScanSuccessCallback(() => onSuccess);
      if (onFailure) setScanFailureCallback(() => onFailure);
      setIsNativeScanActive(true);
      try {
        (window as any).OasisAndroidBridge.scanQR();
      } catch (e) {
        setIsNativeScanActive(false);
        onFailure?.("Failed to invoke native scanner interface");
      }
    } else {
      // Fallback: indicate native scan isn't supported
      console.warn("Native QR scan requested but OasisAndroidBridge is not available.");
      onFailure?.("Bridge not found");
    }
  };

  const toggleNativeLocationTracking = (active: boolean, orderId: string) => {
    if (typeof window !== 'undefined' && (window as any).OasisAndroidBridge?.toggleTracking) {
      try {
        (window as any).OasisAndroidBridge.toggleTracking(active, orderId);
      } catch (e) {
        console.warn("Failed to toggle native tracking interface:", e);
      }
    } else {
      console.log(`[Web Geolocation fallback] Tracking active = ${active} for Order = ${orderId}`);
    }
  };

  return (
    <NativeBridgeContext.Provider
      value={{
        isNativeAndroid,
        isWebView,
        triggerNativeVibration,
        startNativeQRScan,
        isNativeScanActive,
        toggleNativeLocationTracking,
      }}
    >
      {children}
    </NativeBridgeContext.Provider>
  );
}

export const useNativeBridge = () => useContext(NativeBridgeContext);
