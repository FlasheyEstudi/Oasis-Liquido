'use client';

import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface QrCodeProps {
  value: string;
  size?: number;
  label?: string;
  className?: string;
  showValue?: boolean;
}

export function QrCode({ value, size = 150, label = 'Código QR', className, showValue = true }: QrCodeProps) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}&bgcolor=ffffff`;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn('inline-flex flex-col items-center gap-4 p-4', className)}
    >
      <div className="relative group perspective-1000">
        {/* Animated Holographic Border */}
        <div className="absolute -inset-[2px] rounded-[1.8rem] bg-gradient-to-tr from-teal-500 via-sky-400 to-indigo-500 animate-gradient-xy opacity-40 group-hover:opacity-100 transition-opacity" />
        
        {/* Background Aura */}
        <div className="absolute -inset-4 bg-teal-500/20 rounded-[2.5rem] blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-700" />
        
        <div className="relative rounded-[1.6rem] bg-white/90 dark:bg-black/80 backdrop-blur-xl p-4 shadow-2xl overflow-hidden border border-white/20">
          {/* Scanline Animation */}
          <motion.div 
            animate={{ top: ['-100%', '200%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="absolute left-0 right-0 h-10 bg-gradient-to-b from-transparent via-teal-500/10 to-transparent z-10 pointer-events-none"
          />
          
          <div 
            className="relative flex items-center justify-center bg-white rounded-xl overflow-hidden"
            style={{ width: size, height: size }}
          >
            <img 
              src={qrUrl} 
              alt="QR Code" 
              className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal"
              onLoad={(e) => (e.currentTarget.style.opacity = '1')}
              style={{ opacity: 0, transition: 'opacity 0.5s ease-in-out' }}
            />
            
            {/* Corner Accents */}
            <div className="absolute top-0 left-0 size-4 border-t-2 border-l-2 border-teal-500/50 rounded-tl-lg" />
            <div className="absolute top-0 right-0 size-4 border-t-2 border-r-2 border-teal-500/50 rounded-tr-lg" />
            <div className="absolute bottom-0 left-0 size-4 border-b-2 border-l-2 border-teal-500/50 rounded-bl-lg" />
            <div className="absolute bottom-0 right-0 size-4 border-b-2 border-r-2 border-teal-500/50 rounded-br-lg" />
          </div>
        </div>
      </div>
      
      <div className="text-center">
        <motion.p 
          animate={{ 
            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
            opacity: [0.8, 1, 0.8]
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="text-[10px] font-black uppercase tracking-[0.4em] bg-gradient-to-r from-teal-600 via-sky-400 to-teal-600 bg-[length:200%_auto] bg-clip-text text-transparent mb-1"
        >
          {label}
        </motion.p>
        {showValue && (
          <p className="text-[9px] font-mono text-zinc-500/60 max-w-[150px] truncate" title={value}>
            {value}
          </p>
        )}
      </div>
    </motion.div>
  );
}
