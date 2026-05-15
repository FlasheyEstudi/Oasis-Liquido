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
// Patient
import { PatientHome } from '@/components/patient/patient-home';
import { AppointmentList } from '@/components/patient/appointment-list';
import { NewAppointment } from '@/components/patient/new-appointment';
import { PrescriptionList } from '@/components/patient/prescription-list';
import { PrescriptionDetail } from '@/components/patient/prescription-detail';
import { PharmacyMap } from '@/components/patient/pharmacy-map';
import { DeliveryRequest } from '@/components/patient/delivery-request';
import { OrderTracking } from '@/components/patient/order-tracking';
// Doctor
import { DoctorDashboard } from '@/components/doctor/doctor-dashboard';
import { Consultation } from '@/components/doctor/consultation';
// Admin
import { AdminHome } from '@/components/admin/admin-home';
import { ManageClinics } from '@/components/admin/manage-clinics';
import { ManagePharmacies } from '@/components/admin/manage-pharmacies';
import { ManageUsers } from '@/components/admin/manage-users';
import { AuditLogs } from '@/components/admin/audit-logs';
// Pharmacy Manager
import { PharmacyDashboard } from '@/components/pharmacy/pharmacy-dashboard';
import { Inventory } from '@/components/pharmacy/inventory';
import { Fulfillment } from '@/components/pharmacy/fulfillment';
import { OrderManagement } from '@/components/pharmacy/order-management';
import { PharmacyPOS } from '@/components/pharmacy/pos';
// Receptionist
import { ReceptionistDashboard } from '@/components/receptionist/receptionist-dashboard';
// Delivery Driver
import { DriverHome } from '@/components/delivery/driver-home';
import { DeliveryDetail } from '@/components/delivery/delivery-detail';
// Profile
import { ProfileScreen } from '@/components/profile/profile-screen';

export default function Home() {
  const currentPage = useAuthStore((s) => s.currentPage);
  const user = useAuthStore((s) => s.user);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const hydrate = useAuthStore((s) => s.hydrate);
  const navigate = useAuthStore((s) => s.navigate);

  const [showSplash, setShowSplash] = useState(true);

  // Sync URL hash with currentPage
  useEffect(() => {
    if (currentPage === 'landing' || currentPage === 'login' || currentPage === 'register') {
      if (window.location.hash) window.history.pushState(null, '', window.location.pathname);
      return;
    }
    window.location.hash = currentPage;
  }, [currentPage]);

  // Read hash on mount/hashchange
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && hash !== currentPage) {
        navigate(hash as any);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    // Handle initial hash
    const initialHash = window.location.hash.replace('#', '');
    if (initialHash) navigate(initialHash as any);

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [navigate]);

  // Hydrate auth state from localStorage on mount
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Hide splash after hydration + minimum time
  useEffect(() => {
    if (isHydrated) {
      const timer = setTimeout(() => {
        setShowSplash(false);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isHydrated]);

  // Show loading screen during initial load
  if (!isHydrated || showSplash) {
    return <LoadingScreen isVisible={true} />;
  }

  // Landing page
  if (currentPage === 'landing') return <OasisLandingPage />;

  // Auth pages
  if (currentPage === 'login') return <LoginForm />;
  if (currentPage === 'register') return <RegisterForm />;
  if (currentPage === 'forgot-password') return <ForgotPasswordForm />;
  if (currentPage === 'reset-password') return <ResetPasswordForm />;

  // App pages
  const renderPage = () => {
    switch (currentPage) {
      // Home — dashboard per role
      case 'home': {
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
        return <AppointmentList />;
      case 'appointment-detail':
        return <AppointmentList />;
      case 'new-appointment':
        return <NewAppointment />;
      case 'prescriptions':
        return <PrescriptionList />;
      case 'prescription-detail':
        return <PrescriptionDetail />;
      case 'pharmacy-map':
        return <PharmacyMap />;
      case 'pharmacy-detail':
        return <PharmacyMap />;
      case 'delivery-request':
        return <DeliveryRequest />;
      case 'order-tracking':
        return <OrderTracking />;

      // Doctor
      case 'consultation':
        return <Consultation />;

      // Admin
      case 'manage-clinics':
        return <ManageClinics />;
      case 'manage-pharmacies':
        return <ManagePharmacies />;
      case 'manage-users':
        return <ManageUsers />;
      case 'audit-logs':
        return <AuditLogs />;

      // Pharmacy
      case 'inventory':
        return <Inventory />;
      case 'fulfillment':
        return <Fulfillment />;
      case 'order-management':
        return <OrderManagement />;
      case 'pos':
        const pId = user?.pharmacy_manager_profile?.pharmacy_id || (user as any)?.pharmacyManagerProfile?.pharmacyId || '';
        return <PharmacyPOS pharmacyId={pId} />;

      // Driver
      case 'driver-home':
        return <DriverHome />;
      case 'delivery-detail':
        return <DeliveryDetail />;

      // Profile
      case 'profile':
        return <ProfileScreen />;

      default:
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
  };

  return <AppLayout>{renderPage()}</AppLayout>;
}
