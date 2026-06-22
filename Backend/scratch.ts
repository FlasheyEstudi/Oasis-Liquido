import { z } from 'zod';

const createSaleSchema = z.object({
  items: z.array(z.object({
    medicine_id: z.string().min(1, 'Medicamento requerido'),
    quantity: z.number().int().min(1, 'Cantidad mínima: 1'),
    unit_price: z.number().min(0).optional(),
  })).min(1, 'Al menos un item requerido'),
  prescription_id: z.string().optional(),
  patient_id: z.string().optional(),
  clinic_id: z.string().optional(),
  appointment_id: z.string().optional(),
  is_delivery: z.boolean().default(false),
  delivery_address: z.string().optional(),
  delivery_lat: z.number().optional(),
  delivery_lng: z.number().optional(),
  notes: z.string().optional(),
  payments: z.array(z.object({
    amount: z.number().min(0, 'El monto debe ser positivo'),
    method: z.enum(['cash', 'card', 'bank_transfer', 'wallet'], {
      error: 'Método de pago inválido',
    }),
    currency: z.string().optional(),
    transaction_id: z.string().optional(),
  })).min(1, 'Al menos un método de pago requerido'),
});

const salePayload = {
  items: [
    {
      medicine_id: "cmpn9bh1b000hlzpz6sfabpha",
      quantity: 1,
      unit_price: 150
    }
  ],
  prescription_id: undefined,
  is_delivery: false,
  notes: undefined,
  payments: [
    {
      method: "cash",
      amount: 150
    }
  ]
};

const res = createSaleSchema.safeParse(salePayload);
if(!res.success) {
  console.log(res.error.issues);
} else {
  console.log("Valid!");
}
