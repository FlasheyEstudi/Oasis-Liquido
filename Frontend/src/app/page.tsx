'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { LoadingScreen } from '@/components/oasis/loading-screen';
import { useActivePharmacyId } from '@/hooks/use-active-pharmacy';
// Landing
import { OasisLandingPage } from '@/components/oasis/landing-page';
// Layout
import { AppLayout } from '@/components/layout/app-layout';
// Auth
import { LoginForm } from '@/components/auth/login-form';
import { RegisterForm } from '@/components/auth/register-form';
import { ForgotPasswordForm } from '@/components/auth/forgot-password-form';
import { ResetPasswordForm } from '@/components/auth/reset-password-form';
import { AcceptInvitationForm } from '@/components/auth/accept-invitation-form';
import dynamic from 'next/dynamic';

// Heavy roles (Dynamic imports to reduce APK size)
const AdminHome = dynamic(() => import('@/components/admin/admin-home').then(m => m.AdminHome));
const ManageClinics = dynamic(() => import('@/components/admin/manage-clinics').then(m => m.ManageClinics));
const ManagePharmacies = dynamic(() => import('@/components/admin/manage-pharmacies').then(m => m.ManagePharmacies));
const ManageUsers = dynamic(() => import('@/components/admin/manage-users').then(m => m.ManageUsers));
const AuditLogs = dynamic(() => import('@/components/admin/audit-logs').then(m => m.AuditLogs));
const ManageFeedback = dynamic(() => import('@/components/admin/manage-feedback').then(m => m.ManageFeedback));
const PendingDocumentsPanel = dynamic(() => import('@/components/admin/pending-documents').then(m => m.PendingDocumentsPanel));
const GlobalSettingsPanel = dynamic(() => import('@/components/admin/global-settings').then(m => m.GlobalSettingsPanel));

const DoctorDashboard = dynamic(() => import('@/components/doctor/doctor-dashboard').then(m => m.DoctorDashboard));
const Consultation = dynamic(() => import('@/components/doctor/consultation').then(m => m.Consultation));

const PharmacyDashboard = dynamic(() => import('@/components/pharmacy/pharmacy-dashboard').then(m => m.PharmacyDashboard));
const Inventory = dynamic(() => import('@/components/pharmacy/inventory').then(m => m.Inventory));
const Fulfillment = dynamic(() => import('@/components/pharmacy/fulfillment').then(m => m.Fulfillment));
const OrderManagement = dynamic(() => import('@/components/pharmacy/order-management').then(m => m.OrderManagement));
const PharmacyPOS = dynamic(() => import('@/components/pharmacy/pos').then(m => m.PharmacyPOS));

const ReceptionistDashboard = dynamic(() => import('@/components/receptionist/receptionist-dashboard').then(m => m.ReceptionistDashboard));

// Mobile Core Roles (Dynamic imports to prevent hydration mismatches and minimize bundle size)
const PatientHome = dynamic(() => import('@/components/patient/patient-home').then(m => m.PatientHome), { ssr: false });
const AppointmentList = dynamic(() => import('@/components/patient/appointment-list').then(m => m.AppointmentList), { ssr: false });
const NewAppointment = dynamic(() => import('@/components/patient/new-appointment').then(m => m.NewAppointment), { ssr: false });
const PrescriptionList = dynamic(() => import('@/components/patient/prescription-list').then(m => m.PrescriptionList), { ssr: false });
const PrescriptionDetail = dynamic(() => import('@/components/patient/prescription-detail').then(m => m.PrescriptionDetail), { ssr: false });
const PharmacyMap = dynamic(() => import('@/components/patient/pharmacy-map').then(m => m.PharmacyMap), { ssr: false });
const DeliveryRequest = dynamic(() => import('@/components/patient/delivery-request').then(m => m.DeliveryRequest), { ssr: false });
const OrderTracking = dynamic(() => import('@/components/patient/order-tracking').then(m => m.OrderTracking), { ssr: false });
const DriverHome = dynamic(() => import('@/components/delivery/driver-home').then(m => m.DriverHome), { ssr: false });
const DeliveryDetail = dynamic(() => import('@/components/delivery/delivery-detail').then(m => m.DeliveryDetail), { ssr: false });
const DriverDashboard = dynamic(() => import('@/components/delivery/driver-dashboard').then(m => m.DriverDashboard), { ssr: false });

// Profile
const ProfileScreen = dynamic(() => import('@/components/profile/profile-screen').then(m => m.ProfileScreen), { ssr: false });

// Verification
import { VerificationScreen } from '@/components/common/verification-screen';
import { ShieldCheck } from 'lucide-react';


export default function Home() {
  const currentPage = useAuthStore((s) => s.currentPage);
  const user = useAuthStore((s) => s.user);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const hydrate = useAuthStore((s) => s.hydrate);
  const navigate = useAuthStore((s) => s.navigate);
  const activePharmacyId = useActivePharmacyId();


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

  // Show loading screen during hydration, except on landing page which has its own immersive splash
  if (!isHydrated && currentPage !== 'bienvenida') {
    return <LoadingScreen isVisible={true} />;
  }

  // Landing page
  if (currentPage === 'bienvenida') return <OasisLandingPage />;

  // Auth pages
  if (currentPage === 'entrar' || currentPage === 'login') return <LoginForm />;
  if (currentPage === 'registro') return <RegisterForm />;
  if (currentPage === 'recuperar-cuenta') return <ForgotPasswordForm />;
  if (currentPage === 'cambiar-clave') return <ResetPasswordForm />;
  if (currentPage === 'aceptar-invitacion') return <AcceptInvitationForm />;

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
          case 'cashier':
            return <PharmacyDashboard />;
          case 'clinic_admin':
            return <ManageClinics />;
          case 'pharmacy_admin':
            return <ManagePharmacies />;
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

      // Admin & Owners
      case 'manage-clinics':
      case 'gestionar-clinicas':
      case 'clinic-staff':
      case 'clinic-finances':
      case 'clinic-analytics':
        return <ManageClinics />;
      case 'manage-pharmacies':
      case 'gestionar-farmacias':
      case 'pharmacy-staff':
      case 'pharmacy-finances':
      case 'pharmacy-analytics':
        return <ManagePharmacies />;
      case 'manage-users':
      case 'gestionar-usuarios':
        return <ManageUsers />;
      case 'manage-documents':
      case 'gestionar-documentos':
        return <PendingDocumentsPanel />;
      case 'audit-logs':
      case 'auditoria':
        return <AuditLogs />;
      case 'manage-feedback':
      case 'gestionar-feedback':
        return <ManageFeedback />;
      case 'manage-settings':
      case 'gestionar-configuracion':
        return <GlobalSettingsPanel />;

      // Pharmacy
      case 'inventory':
      case 'inventario':
        return <Inventory />;
      case 'fulfillment':
      case 'surtimiento':
        return <Fulfillment />;
      case 'order-management':
      case 'gestion-pedidos':
        return user?.role === 'patient' ? <OrderTracking /> : <OrderManagement />;
      case 'pos':
      case 'venta':
        return <PharmacyPOS pharmacyId={activePharmacyId} />;

      // Driver
      case 'driver-home':
      case 'inicio-repartidor':
        return <DriverHome />;
      case 'driver-dashboard':
        return <DriverDashboard />;
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
        if (page.startsWith('verificar-paciente-')) {
          const id = page.replace('verificar-paciente-', '');
          return <VerificationScreen type="patient" id={id} />;
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
