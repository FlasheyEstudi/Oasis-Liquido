'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { LoadingScreen } from '@/components/oasis/loading-screen';
// Landing
import { OasisLandingPage } from '@/components/oasis/landing-page';
// Layout
import { AppLayout } from '@/components/layout/app-layout';
// Auth
import { LoginForm } from '@/components/auth/login-form';
import { RegisterForm } from '@/components/auth/register-form';
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';
import { ResetPasswordForm } from '@/components/auth/reset-password-form';
import dynamic from 'next/dynamic';

// Heavy roles (Dynamic imports to reduce APK size)
const AdminHome = dynamic(() => import('@/components/admin/admin-home').then(m => m.AdminHome));
const ManageClinics = dynamic(() => import('@/components/admin/manage-clinics').then(m => m.ManageClinics));
const ManagePharmacies = dynamic(() => import('@/components/admin/manage-pharmacies').then(m => m.ManagePharmacies));
const ManageUsers = dynamic(() => import('@/components/admin/manage-users').then(m => m.ManageUsers));
const AuditLogs = dynamic(() => import('@/components/admin/audit-logs').then(m => m.AuditLogs));

const DoctorDashboard = dynamic(() => import('@/components/doctor/doctor-dashboard').then(m => m.DoctorDashboard));
const Consultation = dynamic(() => import('@/components/doctor/consultation').then(m => m.Consultation));

const PharmacyDashboard = dynamic(() => import('@/components/pharmacy/pharmacy-dashboard').then(m => m.PharmacyDashboard));
const Inventory = dynamic(() => import('@/components/pharmacy/inventory').then(m => m.Inventory));
const Fulfillment = dynamic(() => import('@/components/pharmacy/fulfillment').then(m => m.Fulfillment));
const OrderManagement = dynamic(() => import('@/components/pharmacy/order-management').then(m => m.OrderManagement));
const PharmacyPOS = dynamic(() => import('@/components/pharmacy/pos').then(m => m.PharmacyPOS));

const ReceptionistDashboard = dynamic(() => import('@/components/receptionist/receptionist-dashboard').then(m => m.ReceptionistDashboard));

// Mobile Core Roles (Standard imports for instant load)
import { PatientHome } from '@/components/patient/patient-home';
import { AppointmentList } from '@/components/patient/appointment-list';
import { NewAppointment } from '@/components/patient/new-appointment';
import { PrescriptionList } from '@/components/patient/prescription-list';
import { PrescriptionDetail } from '@/components/patient/prescription-detail';
import { PharmacyMap } from '@/components/patient/pharmacy-map';
import { DeliveryRequest } from '@/components/patient/delivery-request';
import { OrderTracking } from '@/components/patient/order-tracking';
import { DriverHome } from '@/components/delivery/driver-home';
import { DeliveryDetail } from '@/components/delivery/delivery-detail';
// Profile
import { ProfileScreen } from '@/components/profile/profile-screen';
// Verification
import { VerificationScreen } from '@/components/common/verification-screen';
import { ShieldCheck } from 'lucide-react';


export default function Home() {
  const currentPage = useAuthStore((s) => s.currentPage);
  const user = useAuthStore((s) => s.user);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const hydrate = useAuthStore((s) => s.hydrate);
  const navigate = useAuthStore((s) => s.navigate);


  // Sync URL pathname with currentPage
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const path = currentPage === 'bienvenida' ? '/' : `/${currentPage}`;
    if (window.location.pathname !== path) {
      window.history.pushState(null, '', path);
    }
  }, [currentPage]);

  // Read pathname on mount/popstate
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.replace('/', '');
      const targetPage = path || 'bienvenida';
      if (targetPage !== currentPage) {
        navigate(targetPage as any);
      }
    };

    window.addEventListener('popstate', handlePopState);
    // Handle initial path
    const initialPath = window.location.pathname.replace('/', '');
    if (initialPath) navigate(initialPath as any);

    return () => window.removeEventListener('popstate', handlePopState);
  }, [navigate, currentPage]);

  // Hydrate auth state from localStorage on mount
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Show loading screen during hydration
  if (!isHydrated) {
    return <LoadingScreen isVisible={true} />;
  }

  // Landing page
  if (currentPage === 'bienvenida') return <OasisLandingPage />;

  // Auth pages
  if (currentPage === 'entrar') return <LoginForm />;
  if (currentPage === 'registro') return <RegisterForm />;
  if (currentPage === 'recuperar-cuenta') return <ForgotPasswordForm />;
  if (currentPage === 'cambiar-clave') return <ResetPasswordForm />;

  // App pages
  const renderPage = () => {
    switch (currentPage) {
      // Home — dashboard per role
      case 'home':
      case 'inicio': {

        switch (user?.role) {
          case 'admin':
            return <AdminHome />;
          case 'doctor':
            return <DoctorDashboard />;
          case 'receptionist':
            return <ReceptionistDashboard />;
          case 'pharmacy_manager':
            return <PharmacyDashboard />;
          case 'delivery_driver':
            return <DriverHome />;
          case 'patient':
          default:
            return <PatientHome />;
        }
      }

      // Patient
      case 'appointments':
      case 'citas':
        return <AppointmentList />;
      case 'appointment-detail':
      case 'detalle-cita':
        return <AppointmentList />;
      case 'new-appointment':
      case 'nueva-cita':
        return <NewAppointment />;
      case 'prescriptions':
      case 'recetas':
        return <PrescriptionList />;
      case 'prescription-detail':
      case 'detalle-receta':
        return <PrescriptionDetail />;
      case 'pharmacy-map':
      case 'mapa-farmacias':
        return <PharmacyMap />;
      case 'pharmacy-detail':
      case 'detalle-farmacia':
        return <PharmacyMap />;
      case 'delivery-request':
      case 'solicitud-envio':
        return <DeliveryRequest />;
      case 'order-tracking':
      case 'seguimiento':
        return <OrderTracking />;

      // Doctor
      case 'consultation':
      case 'consulta':
        return <Consultation />;

      // Admin
      case 'manage-clinics':
      case 'gestionar-clinicas':
        return <ManageClinics />;
      case 'manage-pharmacies':
      case 'gestionar-farmacias':
        return <ManagePharmacies />;
      case 'manage-users':
      case 'gestionar-usuarios':
        return <ManageUsers />;
      case 'audit-logs':
      case 'auditoria':
        return <AuditLogs />;

      // Pharmacy
      case 'inventory':
      case 'inventario':
        return <Inventory />;
      case 'fulfillment':
      case 'surtimiento':
        return <Fulfillment />;
      case 'order-management':
      case 'gestion-pedidos':
        return <OrderManagement />;
      case 'pos':
      case 'venta':
        const pId = user?.pharmacy_manager_profile?.pharmacy_id || (user as any)?.pharmacyManagerProfile?.pharmacyId || '';
        return <PharmacyPOS pharmacyId={pId} />;

      // Driver
      case 'driver-home':
      case 'inicio-repartidor':
        return <DriverHome />;
      case 'delivery-detail':
      case 'detalle-envio':
        return <DeliveryDetail />;

      // Profile
      case 'profile':
      case 'perfil':
        return <ProfileScreen />;

      // Verification (Public)
      default: {
        const page = currentPage as string;
        if (page.startsWith('verificar-venta-')) {
          const id = page.replace('verificar-venta-', '');
          return <VerificationScreen type="sale" id={id} />;
        }
        if (page.startsWith('verificar-receta-')) {
          const id = page.replace('verificar-receta-', '');
          return <VerificationScreen type="prescription" id={id} />;
        }
        
        return (
          <div className="flex min-h-[50vh] items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-teal-700 dark:text-teal-400">OASIS</h1>
              <p className="text-muted-foreground mt-2">Página: {currentPage}</p>
              <p className="text-sm text-slate-400 mt-1">Próximamente disponible</p>
            </div>
          </div>
        );
      }
    }
  };

  return <AppLayout>{renderPage()}</AppLayout>;
}
