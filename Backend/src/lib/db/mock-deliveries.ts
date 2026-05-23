export interface MockDeliveryOrder {
  id: string;
  saleId: string;
  pharmacyId: string;
  deliveryDriverId: string | null;
  patientId: string;
  pickupAddress: string;
  pickupLat: number;
  pickupLng: number;
  deliveryAddress: string;
  deliveryLat: number;
  deliveryLng: number;
  status: string;
  notes: string;
  deliveryFee: number;
  tip: number;
  cashOnDelivery: number;
  pickupCode: string;
  deliveryCode: string;
  createdAt: string;
  pharmacy: {
    name: string;
    address: string;
    phone: string;
  };
  patient: {
    name: string;
    phone: string;
  };
  items: Array<{ name: string; quantity: number }>;
}

export function getInMemoryDeliveries(): MockDeliveryOrder[] {
  if (!(global as any).inMemoryDeliveries) {
    (global as any).inMemoryDeliveries = [
      {
        id: 'del-mock-1',
        saleId: 'sale-1',
        pharmacyId: 'ph-1',
        deliveryDriverId: null,
        patientId: 'pat-1',
        pickupAddress: 'FarmaValue Altamira, Managua',
        pickupLat: 12.1285,
        pickupLng: -86.2514,
        deliveryAddress: 'Colonia Centroamérica, del Colegio 2c al lago, Managua',
        deliveryLat: 12.1154,
        deliveryLng: -86.2402,
        status: 'pending',
        notes: 'Entregar en el portón negro con timbre gris.',
        deliveryFee: 60,
        tip: 20,
        cashOnDelivery: 0, // Paid online
        pickupCode: 'PU-1049',
        deliveryCode: 'DL-9842',
        createdAt: new Date().toISOString(),
        pharmacy: {
          name: 'FarmaValue Altamira',
          address: 'Altamira, Managua',
          phone: '+505 2278-4000',
        },
        patient: {
          name: 'María L. Gutiérrez',
          phone: '+505 8899-7766',
        },
        items: [
          { name: 'Ibuprofeno 400mg', quantity: 2 },
          { name: 'Loratadina 10mg', quantity: 1 },
        ],
      },
      {
        id: 'del-mock-2',
        saleId: 'sale-2',
        pharmacyId: 'ph-2',
        deliveryDriverId: null,
        patientId: 'pat-2',
        pickupAddress: 'Farmacia Kielsa Los Robles, Managua',
        pickupLat: 12.1310,
        pickupLng: -86.2580,
        deliveryAddress: 'Bello Horizonte, Rotonda 1c al este, Managua',
        deliveryLat: 12.1450,
        deliveryLng: -86.2310,
        status: 'pending',
        notes: 'Pago contra entrega en efectivo. Llevar cambio de C$ 500.',
        deliveryFee: 75,
        tip: 15,
        cashOnDelivery: 380, // Cash on delivery
        pickupCode: 'PU-5542',
        deliveryCode: 'DL-2104',
        createdAt: new Date().toISOString(),
        pharmacy: {
          name: 'Farmacia Kielsa Los Robles',
          address: 'Los Robles, Managua',
          phone: '+505 2255-8000',
        },
        patient: {
          name: 'Juan Carlos M.',
          phone: '+505 7766-5544',
        },
        items: [
          { name: 'Amoxicilina 500mg', quantity: 3 },
          { name: 'Paracetamol 500mg', quantity: 1 },
        ],
      },
    ];
  }
  return (global as any).inMemoryDeliveries;
}
