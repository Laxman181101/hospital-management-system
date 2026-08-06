import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';
import RoleRoute from './components/shared/RoleRoute';

// Public & Auth Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import OnboardHospital from './pages/OnboardHospital';
import PendingApproval from './pages/PendingApproval';
import HospitalDirectory from './pages/public/HospitalDirectory';
import HospitalDetail from './pages/public/HospitalDetail';
import PatientAuth from './pages/PatientAuth';
import StaffLogin from './pages/StaffLogin';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

import DashboardLayout from './components/layouts/DashboardLayout';
import SuperAdminDashboard from './pages/super-admin/Dashboard';
import SuperAdminApprovals from './pages/super-admin/Approvals';
import SuperAdminHospitals from './pages/super-admin/Hospitals';
import SuperAdminStaff from './pages/super-admin/StaffDirectory';
import SuperAdminAnalytics from './pages/super-admin/Analytics';
import SuperAdminAnnouncements from './pages/super-admin/Announcements';
import SuperAdminSettings from './pages/super-admin/Settings';

import HospitalAdminDashboard from './pages/hospital-admin/Dashboard';
import HospitalProfile from './pages/hospital-admin/HospitalProfile';
import StaffManagement from './pages/hospital-admin/StaffManagement';
import Attendance from './pages/hospital-admin/Attendance';
import StaffLeave from './pages/hospital-admin/StaffLeave';
import Pharmacy from './pages/hospital-admin/Pharmacy';
import Laboratory from './pages/hospital-admin/Laboratory';
import Inventory from './pages/hospital-admin/Inventory';
import Finance from './pages/hospital-admin/Finance';
import Billing from './pages/hospital-admin/Billing';
import Ambulance from './pages/hospital-admin/Ambulance';
import StaffDashboard from './pages/staff/Dashboard';

import DoctorDashboard from './pages/doctor/Dashboard';
import DoctorAppointments from './pages/doctor/Appointments';
import DoctorConsultations from './pages/doctor/Consultations';
import DoctorPrescriptions from './pages/doctor/Prescriptions';
import DoctorAdmissions from './pages/doctor/Admissions';
import DoctorProfile from './pages/doctor/Profile';
import DoctorSurgeries from './pages/doctor/Surgeries';

import PatientDashboard from './pages/patient/Dashboard';
import PatientAppointments from './pages/patient/Appointments';
import BookAppointment from './pages/patient/BookAppointment';
import MedicalRecords from './pages/patient/MedicalRecords';
import PatientPrescriptions from './pages/patient/Prescriptions';
import PatientConsultations from './pages/patient/Consultations';
import PatientPayments from './pages/patient/Payments';
import PatientProfile from './pages/patient/Profile';

// Staff (Receptionist) Pages
import ReceptionistAppointments from './pages/staff/ReceptionistAppointments';
import ManualRegistration from './pages/staff/ManualRegistration';
import OTScheduling from './pages/staff/OTScheduling';
import StaffBilling from './pages/staff/StaffBilling';
import StaffWardManagement from './pages/staff/WardManagement';
import StaffDoctorSchedules from './pages/staff/DoctorSchedules';
import TestCatalog from './pages/staff/lab/TestCatalog';
import TestRequests from './pages/staff/lab/TestRequests';
import PatientsList from './pages/staff/PatientsList';

// Pharmacist Pages
import PharmacistDashboard from './pages/pharmacist/Dashboard';
import PharmacistInventory from './pages/pharmacist/PharmacistInventory';
import PharmacistOrders from './pages/pharmacist/PharmacistOrders';

const App = () => {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register-hospital" element={<OnboardHospital />} />
            <Route path="/hospitals" element={<HospitalDirectory />} />
            <Route path="/hospitals/:id" element={<HospitalDetail />} />
            <Route path="/patient/auth" element={<PatientAuth />} />
            <Route path="/staff/login" element={<StaffLogin />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Pending Approval Screen (only logged-in users, unblocked by role) */}
            <Route path="/pending-approval" element={<PendingApproval />} />

            {/* Super Admin Routes */}
            <Route element={<RoleRoute allowedRoles={['super_admin']} />}>
              <Route path="/super-admin" element={<DashboardLayout />}>
                <Route index element={<SuperAdminDashboard />} />
                <Route path="approvals" element={<SuperAdminApprovals />} />
                <Route path="hospitals" element={<SuperAdminHospitals />} />
                <Route path="staff" element={<SuperAdminStaff />} />
                <Route path="analytics" element={<SuperAdminAnalytics />} />
                <Route path="announcements" element={<SuperAdminAnnouncements />} />
                <Route path="settings" element={<SuperAdminSettings />} />
              </Route>
            </Route>

            {/* Hospital Admin Routes (Blocked if pending via RoleRoute logic) */}
            <Route element={<RoleRoute allowedRoles={['hospital_admin']} />}>
              <Route path="/hospital-admin" element={<DashboardLayout />}>
                <Route index element={<HospitalAdminDashboard />} />
                <Route path="profile" element={<HospitalProfile />} />
                <Route path="staff" element={<StaffManagement />} />
                <Route path="attendance" element={<Attendance />} />
                <Route path="staff-leave" element={<StaffLeave />} />
                <Route path="ward-management" element={<StaffWardManagement />} />
                <Route path="pharmacy" element={<Pharmacy />} />
                <Route path="laboratory" element={<Laboratory />} />
                <Route path="inventory" element={<Inventory />} />
                <Route path="finance" element={<Finance />} />
                <Route path="billing" element={<Billing />} />
                <Route path="ambulance" element={<Ambulance />} />
              </Route>
            </Route>

            {/* Staff Routes (Generic staff like receptionist) */}
            <Route element={<RoleRoute allowedRoles={['receptionist', 'lab_technician']} />}>
              <Route path="/staff" element={<DashboardLayout />}>
                <Route index element={<StaffDashboard />} />
                <Route path="appointments" element={<ReceptionistAppointments />} />
                <Route path="register" element={<ManualRegistration />} />
                <Route path="ot" element={<OTScheduling />} />
                <Route path="ward-management" element={<StaffWardManagement />} />
                <Route path="doctor-schedules" element={<StaffDoctorSchedules />} />
                <Route path="billing" element={<StaffBilling />} />
                <Route path="patients" element={<PatientsList />} />
                <Route path="lab/tests" element={<TestCatalog />} />
                <Route path="lab/requests" element={<TestRequests />} />
              </Route>
            </Route>

            {/* Pharmacist Routes */}
            <Route element={<RoleRoute allowedRoles={['pharmacist']} />}>
              <Route path="/pharmacist" element={<DashboardLayout />}>
                <Route index element={<PharmacistDashboard />} />
                <Route path="inventory" element={<PharmacistInventory />} />
                <Route path="orders" element={<PharmacistOrders />} />
              </Route>
            </Route>

            {/* Doctor Routes */}
            <Route element={<RoleRoute allowedRoles={['doctor']} />}>
              <Route path="/doctor" element={<DashboardLayout />}>
                <Route index element={<DoctorDashboard />} />
                <Route path="appointments" element={<DoctorAppointments />} />
                <Route path="consultations" element={<DoctorConsultations />} />
                <Route path="prescriptions" element={<DoctorPrescriptions />} />
                <Route path="admissions" element={<DoctorAdmissions />} />
                <Route path="profile" element={<DoctorProfile />} />
                <Route path="surgeries" element={<DoctorSurgeries />} />
              </Route>
            </Route>

            {/* Patient Routes */}
            <Route element={<RoleRoute allowedRoles={['patient']} />}>
              <Route path="/patient" element={<DashboardLayout />}>
                <Route index element={<PatientDashboard />} />
                <Route path="appointments" element={<PatientAppointments />} />
                <Route path="book-appointment" element={<BookAppointment />} />
                <Route path="records" element={<MedicalRecords />} />
                <Route path="prescriptions" element={<PatientPrescriptions />} />
                <Route path="consultations" element={<PatientConsultations />} />
                <Route path="payments" element={<PatientPayments />} />
                <Route path="profile" element={<PatientProfile />} />
              </Route>
            </Route>

            {/* Catch All */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
};

export default App;
