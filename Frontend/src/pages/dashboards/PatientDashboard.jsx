import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import PatientLayout from '../../components/patient/layout/PatientLayout';
import OverviewView from '../../components/patient/views/OverviewView';
import PatientScreeningFlow from '../../components/patient/screening/PatientScreeningFlow';
import ScreeningResult from '../../components/patient/screening/ScreeningResult';
import ScreeningHistory from '../../components/patient/screening/ScreeningHistory';
import AppointmentsView from '../../components/patient/views/AppointmentsView';
import EducationView from '../../components/patient/views/EducationView';
import NotificationsView from '../../components/patient/views/NotificationsView';
import ProfileView from '../../components/patient/views/ProfileView';
import SettingsView from '../../components/patient/views/SettingsView';
import LoadingState from '../../components/patient/common/LoadingState';
import { INITIAL_NOTIFICATIONS } from '../../components/patient/data/patientMockData';
import { fetchPatientProfile } from '../../api/patient';
import { fetchMyScreenings, syncScreeningToBackend } from '../../api/screenings';
import { adaptMongoScreening } from '../../services/screeningAdapter';

export default function PatientDashboard() {
  const { user, logout } = useAuth();

  // Active navigation tab
  const [activeTab, setActiveTab] = useState('overview');

  // Profile data
  const [patientProfile, setPatientProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Screenings list (populated from backend database)
  const [screenings, setScreenings] = useState([]);

  // Dedicated result being viewed
  const [activeResultDetail, setActiveResultDetail] = useState(null);

  // Notifications
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);

  // Fetch real patient profile and screening history from backend
  useEffect(() => {
    async function loadData() {
      try {
        const [profileRes, screeningsRes] = await Promise.allSettled([
          fetchPatientProfile(),
          fetchMyScreenings()
        ]);

        if (profileRes.status === 'fulfilled') {
          const data = profileRes.value?.data || profileRes.value;
          setPatientProfile({
            ...data,
            id: user?.id || user?._id || user?.loginId || data?.id || 'DR-PAT-2026',
            fullName: user?.name || data?.fullName || 'Patient',
            email: user?.email || data?.email || '',
          });
        } else {
          setPatientProfile({
            id: user?.id || user?._id || user?.loginId || 'DR-PAT-2026',
            fullName: user?.name || 'Patient',
            email: user?.email || '',
          });
        }

        if (screeningsRes.status === 'fulfilled') {
          const rawScreenings = screeningsRes.value?.data || [];
          if (Array.isArray(rawScreenings)) {
            setScreenings(rawScreenings.map(adaptMongoScreening));
          }
        }
      } catch {
        setPatientProfile({
          id: user?.id || user?._id || user?.loginId || 'DR-PAT-2026',
          fullName: user?.name || 'Patient',
          email: user?.email || '',
        });
      } finally {
        setLoadingProfile(false);
      }
    }

    loadData();
  }, [user]);

  // When AI screening completes via direct API call:
  const handleScreeningCompleted = async (newScreeningResult) => {
    setScreenings((prev) => [newScreeningResult, ...prev]);
    setActiveResultDetail(newScreeningResult);

    // Persist to MongoDB backend
    try {
      await syncScreeningToBackend(newScreeningResult);
    } catch (err) {
      console.error('Failed to sync screening result to backend:', err);
    }

    // Also add a notification
    const newNotif = {
      id: `notif-${Date.now()}`,
      title: 'Screening Result Ready',
      message: `Your retinal screening report #${newScreeningResult.id} is available with verified AI findings.`,
      type: 'result',
      time: 'Just now',
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  // When an outreach field patient record is claimed:
  const handleRecordClaimed = async (claimedProfile) => {
    try {
      const [profileRes, screeningsRes] = await Promise.allSettled([
        fetchPatientProfile(),
        fetchMyScreenings()
      ]);

      if (profileRes.status === 'fulfilled') {
        const data = profileRes.value?.data || profileRes.value;
        const displayName = typeof data?.fullName === 'object'
          ? `${data.fullName.firstName || ''} ${data.fullName.lastName || ''}`.trim()
          : (data?.fullName || user?.name || 'Patient');

        setPatientProfile({
          ...data,
          id: data?.patientId || user?.loginId || user?.id || 'DR-PAT-2026',
          fullName: displayName,
          email: user?.email || data?.email || '',
        });
      } else if (claimedProfile) {
        setPatientProfile((prev) => ({
          ...prev,
          ...claimedProfile,
          id: claimedProfile.patientId || prev?.id,
        }));
      }

      if (screeningsRes.status === 'fulfilled') {
        const rawScreenings = screeningsRes.value?.data || [];
        if (Array.isArray(rawScreenings)) {
          setScreenings(rawScreenings.map(adaptMongoScreening));
        }
      }

      // Add a notification for the newly linked record
      const newNotif = {
        id: `notif-${Date.now()}`,
        title: 'Patient Record Linked',
        message: `Your outreach record #${claimedProfile?.patientId || 'PAT'} and historical screening reports are now linked to your account.`,
        type: 'result',
        time: 'Just now',
        read: false,
      };
      setNotifications((prev) => [newNotif, ...prev]);
    } catch (err) {
      console.error('Failed to reload patient data after claim:', err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
        <LoadingState message="Loading your retinal health dashboard..." />
      </div>
    );
  }

  return (
    <PatientLayout
      patient={patientProfile}
      activeTab={activeTab}
      onNavigate={(tab) => {
        setActiveResultDetail(null);
        setActiveTab(tab);
      }}
      onLogout={logout}
      unreadCount={unreadCount}
      notifications={notifications}
    >
      {/* ── 1. Result Detail View (if patient clicked View Result) ─ */}
      {activeResultDetail ? (
        <ScreeningResult
          resultData={activeResultDetail}
          onStartNewScreening={() => {
            setActiveResultDetail(null);
            setActiveTab('screening');
          }}
          onBackToDashboard={() => {
            setActiveResultDetail(null);
            setActiveTab('overview');
          }}
          onRequestDoctorReview={() => {
            setActiveResultDetail(null);
            setActiveTab('appointments');
          }}
        />
      ) : activeTab === 'overview' ? (
        /* ── 2. Dashboard Overview ────────────────────────────── */
        <OverviewView
          patient={patientProfile}
          screenings={screenings}
          onStartScreening={() => setActiveTab('screening')}
          onViewScreeningResult={(scr) => setActiveResultDetail(scr)}
          onViewAllHistory={() => setActiveTab('history')}
          onRequestAppointment={() => setActiveTab('appointments')}
          onNavigateEducation={() => setActiveTab('education')}
          onLinkRecord={() => setActiveTab('profile')}
        />
      ) : activeTab === 'screening' ? (
        /* ── 3. Start New Screening Flow (Direct AI API) ─────── */
        <PatientScreeningFlow
          currentUser={user}
          onScreeningCompleted={handleScreeningCompleted}
          onBackToDashboard={() => setActiveTab('overview')}
          onRequestDoctorReview={() => setActiveTab('appointments')}
        />
      ) : activeTab === 'history' ? (
        /* ── 4. Screening History ────────────────────────────── */
        <ScreeningHistory
          screenings={screenings}
          onViewDetails={(scr) => setActiveResultDetail(scr)}
          onStartNewScreening={() => setActiveTab('screening')}
        />
      ) : activeTab === 'appointments' ? (
        /* ── 5. Appointments ─────────────────────────────────── */
        <AppointmentsView />
      ) : activeTab === 'education' ? (
        /* ── 6. Eye Health Education ─────────────────────────── */
        <EducationView />
      ) : activeTab === 'notifications' ? (
        /* ── 7. Notification Center ──────────────────────────── */
        <NotificationsView
          notifications={notifications}
          onMarkAsRead={handleMarkAsRead}
          onMarkAllAsRead={handleMarkAllAsRead}
          onSelectNotification={(n) => {
            handleMarkAsRead(n.id);
            if (n.type === 'result' && screenings.length > 0) {
              setActiveResultDetail(screenings[0]);
            }
          }}
        />
      ) : activeTab === 'profile' ? (
        /* ── 8. Profile ──────────────────────────────────────── */
        <ProfileView
          patient={patientProfile}
          onProfileUpdated={(updated) => setPatientProfile(updated)}
          onRecordClaimed={handleRecordClaimed}
        />
      ) : activeTab === 'settings' ? (
        /* ── 9. Settings ─────────────────────────────────────── */
        <SettingsView onLogout={logout} />
      ) : null}
    </PatientLayout>
  );
}
