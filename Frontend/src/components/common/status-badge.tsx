'use client';

import { Badge } from '@/components/ui/badge';
import {
  APPOINTMENT_STATUS_CONFIG,
  PRESCRIPTION_STATUS_CONFIG,
  DELIVERY_STATUS_CONFIG,
} from '@/utils/constants';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  type: 'appointment' | 'prescription' | 'delivery';
}

const STATUS_CONFIG_MAP = {
  appointment: APPOINTMENT_STATUS_CONFIG,
  prescription: PRESCRIPTION_STATUS_CONFIG,
  delivery: DELIVERY_STATUS_CONFIG,
} as const;

export function StatusBadge({ status, type }: StatusBadgeProps) {
  const configMap = STATUS_CONFIG_MAP[type];
  const config = configMap[status];

  if (!config) {
    return (
      <Badge variant="outline" className="text-gray-600">
        {status}
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        'border-transparent font-medium',
        config.bgColor,
        config.color
      )}
    >
      {config.label}
    </Badge>
  );
}
