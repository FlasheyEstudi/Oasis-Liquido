import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateReceiptPDF } from '@/lib/utils/pdf-generator';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';

export const GET = withAuth(
  async (req: AuthenticatedRequest, context: { params: Promise<any> }) => {
    try {
      console.log("[RECEIPT] Starting request...");
      const { id } = await context.params;
      
      console.log(`[RECEIPT] Fetching sale ${id} from DB...`);
      const sale = await db.sale.findUnique({
        where: { id },
        include: {
          saleItems: { include: { medicine: true } },
          pharmacy: true,
        },
      });

      if (!sale) {
        console.error(`[RECEIPT] Sale ${id} not found`);
        return NextResponse.json({ success: false, error: "Venta no encontrada" }, { status: 404 });
      }

      console.log(`[RECEIPT] Generating PDF for sale ${id}...`);
      
      let pdfBuffer: Buffer;
      try {
        pdfBuffer = await generateReceiptPDF({
          id: sale.id,
          date: sale.createdAt,
          pharmacyName: sale.pharmacy?.name || 'Oasis',
          pharmacyAddress: sale.pharmacy?.address || 'Oasis Address',
          items: sale.saleItems.map(item => ({
            name: item.medicine?.name || 'Medicamento',
            quantity: item.quantity,
            unitPrice: item.unitPrice
          })),
          totalAmount: sale.totalAmount,
          isDelivery: sale.isDelivery,
          deliveryFee: sale.pharmacy?.deliveryFee || 0
        });
      } catch (pdfErr: any) {
        console.error("[RECEIPT] PDF Generation crashed:", pdfErr);
        return NextResponse.json({ success: false, error: `Error en generador PDF: ${pdfErr.message}` }, { status: 500 });
      }

      console.log(`[RECEIPT] PDF success. Size: ${pdfBuffer.length} bytes`);

      const response = new NextResponse(new Uint8Array(pdfBuffer));
      response.headers.set('Content-Type', 'application/pdf');
      response.headers.set('Content-Disposition', 'inline');
      
      return response;
    } catch (error: any) {
      console.error('[RECEIPT] Global failure:', error);
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
      }, { status: 500 });
    }
  }
);
