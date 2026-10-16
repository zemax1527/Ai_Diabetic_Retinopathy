// PatientDashboard re-export wrapper
// Delegates full UI & direct AI screening flow to PatientDashboard.jsx
import PatientDashboardComponent from './PatientDashboard.jsx';

export default function PatientDashboard() {
  return <PatientDashboardComponent />;
}
