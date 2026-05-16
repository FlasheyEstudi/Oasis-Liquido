import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface PDFReceiptData {
  id: string;
  date: Date;
  pharmacyName: string;
  pharmacyAddress: string;
  items: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
  }>;
  totalAmount: number;
  isDelivery: boolean;
  deliveryFee?: number;
}

export async function generateReceiptPDF(data: PDFReceiptData): Promise<Buffer> {
  // Thermal format: 80mm width, dynamic height
  const doc = new jsPDF({
    unit: 'mm',
    format: [80, 160]
  });

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('OASIS AURA', 40, 12, { align: 'center' });
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text((data.pharmacyName || 'Farmacia').toUpperCase(), 40, 18, { align: 'center' });
  
  doc.setFontSize(7);
  doc.text(`Comprobante: #${(data.id || '').slice(-8).toUpperCase()}`, 10, 28);
  doc.text(`Fecha: ${data.date ? new Date(data.date).toLocaleString('es-MX') : 'N/A'}`, 10, 32);

  // Table
  const tableData = data.items.map(item => [
    item.name.slice(0, 20),
    item.quantity.toString(),
    `$${(item.unitPrice * item.quantity).toFixed(2)}`
  ]);

  autoTable(doc, {
    startY: 38,
    margin: { left: 5, right: 5 },
    body: tableData,
    head: [['Item', 'Cant', 'Total']],
    theme: 'plain',
    styles: { fontSize: 7, cellPadding: 1, font: 'helvetica' },
    headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 35 },
      1: { cellWidth: 10, halign: 'center' },
      2: { cellWidth: 20, halign: 'right' }
    }
  });

  const finalTableY = (doc as any).lastAutoTable.finalY || 50;

  // Total Section
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.line(10, finalTableY + 2, 70, finalTableY + 2);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL', 10, finalTableY + 8);
  doc.text(`$${data.totalAmount.toFixed(2)}`, 70, finalTableY + 8, { align: 'right' });

  // QR Code Generation (Using API to avoid heavy local dependencies)
  try {
    // Point to the verification page
    const verifyUrl = `https://oasis-aura.com/%23verify-sale-${data.id}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(verifyUrl)}`;
    const qrResponse = await fetch(qrUrl);
    if (qrResponse.ok) {
      const qrArrayBuffer = await qrResponse.arrayBuffer();
      const qrUint8 = new Uint8Array(qrArrayBuffer);
      doc.addImage(qrUint8, 'PNG', 30, finalTableY + 12, 20, 20);
    }
  } catch (err) {
    console.error("QR Code generation failed:", err);
  }

  // Footer
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('¡Gracias por confiar en Oasis Aura!', 40, finalTableY + 38, { align: 'center' });
  doc.text('www.oasisaura.com', 40, finalTableY + 42, { align: 'center' });

  // ArrayBuffer to Buffer
  const arrayBuffer = doc.output('arraybuffer');
  return Buffer.from(arrayBuffer);
}
