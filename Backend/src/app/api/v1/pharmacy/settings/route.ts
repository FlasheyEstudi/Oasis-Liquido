import { NextRequest } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/auth/middleware';
import { successResponse, errorResponse, ErrorCodes } from '@/lib/utils/api-response';
import { db } from '@/lib/db';

export const GET = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    let pharmacyId = req.user.pharmacyId;

    // Super admin can request for a specific pharmacy
    if (req.user.role === 'admin') {
      pharmacyId = searchParams.get('pharmacyId') || pharmacyId;
    }

    if (!pharmacyId) {
      // Find pharmacy by owner
      const pharmacy = await db.pharmacy.findFirst({
        where: { ownerId: req.user.userId },
      });
      pharmacyId = pharmacy?.id;
    }

    if (!pharmacyId) {
      return errorResponse(ErrorCodes.BAD_REQUEST, 'No se encontró farmacia asociada para este usuario', 400);
    }

    let settings = await db.pharmacySettings.findUnique({
      where: { pharmacyId },
    });

    if (!settings) {
      settings = await db.pharmacySettings.create({
        data: {
          pharmacyId,
          defaultVatRate: 0.15,
          ticketFooter: '¡Gracias por su compra!',
          invoiceSeries: 'A',
          minStockAlertThreshold: 10,
          expirationAlertDays: 90,
          deliveryFeePerKm: 15.0,
          deliveryCoverageRadiusKm: 10.0,
          defaultCashierRole: 'cashier',
          defaultDriverRole: 'delivery_driver',
          notificationPrefs: {
            lowStockAlertEnabled: true,
            allowCashOnDelivery: true,
            allowCardOnDelivery: true,
            autoReorderEnabled: false,
          },
        },
      });
    }

    const prefs = (settings.notificationPrefs as Record<string, any>) || {};

    return successResponse({
      id: settings.id,
      pharmacyId: settings.pharmacyId,
      lowStockAlertEnabled: prefs.lowStockAlertEnabled ?? true,
      minStockAlertThreshold: settings.minStockAlertThreshold,
      medicineNearExpiryDays: settings.expirationAlertDays,
      deliveryFeeDefault: settings.deliveryFeePerKm,
      allowCashOnDelivery: prefs.allowCashOnDelivery ?? true,
      allowCardOnDelivery: prefs.allowCardOnDelivery ?? true,
      autoReorderEnabled: prefs.autoReorderEnabled ?? false,
      // original fields
      defaultVatRate: settings.defaultVatRate,
      ticketFooter: settings.ticketFooter,
      invoiceSeries: settings.invoiceSeries,
      expirationAlertDays: settings.expirationAlertDays,
      deliveryFeePerKm: settings.deliveryFeePerKm,
      deliveryCoverageRadiusKm: settings.deliveryCoverageRadiusKm,
      defaultCashierRole: settings.defaultCashierRole,
      defaultDriverRole: settings.defaultDriverRole,
      notificationPrefs: settings.notificationPrefs,
    });
  } catch (error: any) {
    console.error('Error fetching pharmacy settings:', error);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Error al obtener la configuración de la farmacia', 500);
  }
}, { roles: ['pharmacy_admin', 'admin'] });

export const PUT = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(req.url);
    let pharmacyId = req.user.pharmacyId;

    if (req.user.role === 'admin') {
      pharmacyId = searchParams.get('pharmacyId') || pharmacyId;
    }

    if (!pharmacyId) {
      const pharmacy = await db.pharmacy.findFirst({
        where: { ownerId: req.user.userId },
      });
      pharmacyId = pharmacy?.id;
    }

    if (!pharmacyId) {
      return errorResponse(ErrorCodes.BAD_REQUEST, 'No se encontró farmacia asociada', 400);
    }

    const body = await req.json();
    const {
      lowStockAlertEnabled,
      minStockAlertThreshold,
      medicineNearExpiryDays,
      deliveryFeeDefault,
      allowCashOnDelivery,
      allowCardOnDelivery,
      autoReorderEnabled,
      defaultVatRate,
      ticketFooter,
      invoiceSeries,
      expirationAlertDays,
      deliveryFeePerKm,
      deliveryCoverageRadiusKm,
      defaultCashierRole,
      defaultDriverRole,
      notificationPrefs,
    } = body;

    // Load existing settings first to preserve other JSON properties
    let currentSettings = await db.pharmacySettings.findUnique({
      where: { pharmacyId },
    });

    const currentPrefs = (currentSettings?.notificationPrefs as Record<string, any>) || {};
    const updatedPrefs = {
      ...currentPrefs,
      ...(notificationPrefs || {}),
    };

    if (lowStockAlertEnabled !== undefined) updatedPrefs.lowStockAlertEnabled = lowStockAlertEnabled;
    if (allowCashOnDelivery !== undefined) updatedPrefs.allowCashOnDelivery = allowCashOnDelivery;
    if (allowCardOnDelivery !== undefined) updatedPrefs.allowCardOnDelivery = allowCardOnDelivery;
    if (autoReorderEnabled !== undefined) updatedPrefs.autoReorderEnabled = autoReorderEnabled;

    const minStock = minStockAlertThreshold !== undefined ? parseInt(minStockAlertThreshold, 10) : undefined;
    
    // Map medicineNearExpiryDays or expirationAlertDays
    const expDays = expirationAlertDays !== undefined 
      ? parseInt(expirationAlertDays, 10) 
      : (medicineNearExpiryDays !== undefined ? parseInt(medicineNearExpiryDays, 10) : undefined);

    // Map deliveryFeeDefault or deliveryFeePerKm
    const delFee = deliveryFeePerKm !== undefined 
      ? parseFloat(deliveryFeePerKm) 
      : (deliveryFeeDefault !== undefined ? parseFloat(deliveryFeeDefault) : undefined);

    const settings = await db.pharmacySettings.upsert({
      where: { pharmacyId },
      update: {
        defaultVatRate: defaultVatRate !== undefined ? parseFloat(defaultVatRate) : undefined,
        ticketFooter: ticketFooter !== undefined ? ticketFooter : undefined,
        invoiceSeries: invoiceSeries !== undefined ? invoiceSeries : undefined,
        minStockAlertThreshold: minStock,
        expirationAlertDays: expDays,
        deliveryFeePerKm: delFee,
        deliveryCoverageRadiusKm: deliveryCoverageRadiusKm !== undefined ? parseFloat(deliveryCoverageRadiusKm) : undefined,
        defaultCashierRole: defaultCashierRole !== undefined ? defaultCashierRole : undefined,
        defaultDriverRole: defaultDriverRole !== undefined ? defaultDriverRole : undefined,
        notificationPrefs: updatedPrefs,
      },
      create: {
        pharmacyId,
        defaultVatRate: defaultVatRate !== undefined ? parseFloat(defaultVatRate) : 0.15,
        ticketFooter: ticketFooter !== undefined ? ticketFooter : '¡Gracias por su compra!',
        invoiceSeries: invoiceSeries || 'A',
        minStockAlertThreshold: minStock !== undefined ? minStock : 10,
        expirationAlertDays: expDays !== undefined ? expDays : 90,
        deliveryFeePerKm: delFee !== undefined ? delFee : 15.0,
        deliveryCoverageRadiusKm: deliveryCoverageRadiusKm !== undefined ? parseFloat(deliveryCoverageRadiusKm) : 10.0,
        defaultCashierRole: defaultCashierRole || 'cashier',
        defaultDriverRole: defaultDriverRole || 'delivery_driver',
        notificationPrefs: updatedPrefs,
      },
    });

    return successResponse({
      id: settings.id,
      pharmacyId: settings.pharmacyId,
      lowStockAlertEnabled: updatedPrefs.lowStockAlertEnabled ?? true,
      minStockAlertThreshold: settings.minStockAlertThreshold,
      medicineNearExpiryDays: settings.expirationAlertDays,
      deliveryFeeDefault: settings.deliveryFeePerKm,
      allowCashOnDelivery: updatedPrefs.allowCashOnDelivery ?? true,
      allowCardOnDelivery: updatedPrefs.allowCardOnDelivery ?? true,
      autoReorderEnabled: updatedPrefs.autoReorderEnabled ?? false,
      defaultVatRate: settings.defaultVatRate,
      ticketFooter: settings.ticketFooter,
      invoiceSeries: settings.invoiceSeries,
      expirationAlertDays: settings.expirationAlertDays,
      deliveryFeePerKm: settings.deliveryFeePerKm,
      deliveryCoverageRadiusKm: settings.deliveryCoverageRadiusKm,
      defaultCashierRole: settings.defaultCashierRole,
      defaultDriverRole: settings.defaultDriverRole,
      notificationPrefs: settings.notificationPrefs,
    });
  } catch (error: any) {
    console.error('Error updating pharmacy settings:', error);
    return errorResponse(ErrorCodes.INTERNAL_ERROR, 'Error al actualizar la configuración de la farmacia', 500);
  }
}, { roles: ['pharmacy_admin', 'admin'] });
