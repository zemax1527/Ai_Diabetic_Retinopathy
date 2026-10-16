import React, { useState } from 'react';
import { Calendar, Stethoscope, MapPin, Clock, PlusCircle, CheckCircle2, AlertCircle } from 'lucide-react';
import { INITIAL_APPOINTMENTS } from '../data/patientMockData';
import Button from '../common/Button';
import Modal from '../common/Modal';

export default function AppointmentsView() {
  const [appointments, setAppointments] = useState(INITIAL_APPOINTMENTS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [doctorSelected, setDoctorSelected] = useState('Dr. Shalini Sharma (Retina Specialist)');
  const [preferredDate, setPreferredDate] = useState('');
  const [notes, setNotes] = useState('');
  const [successToast, setSuccessToast] = useState(false);

  const upcomingAppts = appointments.filter((a) => a.status !== 'Completed');
  const pastAppts = appointments.filter((a) => a.status === 'Completed');

  const handleRequestSubmit = (e) => {
    e.preventDefault();
    const newAppt = {
      id: `APT-${Math.floor(100 + Math.random() * 900)}`,
      doctor: doctorSelected,
      role: 'Ophthalmologist',
      facility: 'Pune Regional Eye Institute',
      date: preferredDate || 'Upcoming',
      time: '11:00 AM',
      status: 'Pending Review',
      purpose: notes || 'Retinal Screening Follow-up',
    };
    setAppointments([newAppt, ...appointments]);
    setIsModalOpen(false);
    setSuccessToast(true);
    setTimeout(() => setSuccessToast(false), 4000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#0F172A]">Appointments</h2>
          <p className="text-xs sm:text-sm text-[#64748B]">
            Manage doctor reviews and retinal clinic visits
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setIsModalOpen(true)}
          icon={PlusCircle}
        >
          Request Appointment
        </Button>
      </div>

      {successToast && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs sm:text-sm font-semibold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Appointment request recorded. The clinic will confirm your visit time.</span>
        </div>
      )}

      {/* Upcoming Appointments */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-[#0D1B3E]">Upcoming Appointments</h3>

        {upcomingAppts.length > 0 ? (
          upcomingAppts.map((appt) => (
            <div
              key={appt.id}
              className="bg-white rounded-2xl border border-[rgba(14,47,118,0.08)] p-5 shadow-2xs space-y-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0E2F76] flex items-center justify-center">
                    <Stethoscope className="w-4 h-4 text-[#2563EB]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#0D1B3E]">{appt.doctor}</h4>
                    <span className="text-xs text-[#718096]">{appt.role || 'Eye Care Specialist'}</span>
                  </div>
                </div>

                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-[#0E2F76] border border-blue-200">
                  {appt.status}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>{appt.date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>{appt.time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span className="truncate">{appt.facility}</span>
                </div>
              </div>

              {appt.purpose && (
                <div className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <strong className="text-slate-700">Purpose:</strong> {appt.purpose}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center text-xs text-slate-500">
            No upcoming appointments scheduled. Click "Request Appointment" above to book a doctor consultation.
          </div>
        )}
      </div>

      {/* Past Appointments */}
      <div className="space-y-4 pt-4">
        <h3 className="text-base font-bold text-[#0D1B3E]">Past Appointments</h3>

        {pastAppts.map((appt) => (
          <div
            key={appt.id}
            className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 opacity-80"
          >
            <div>
              <h4 className="text-sm font-bold text-[#0D1B3E]">{appt.doctor}</h4>
              <p className="text-xs text-slate-500 mt-0.5">{appt.facility} • {appt.date}</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 self-start sm:self-auto">
              Completed
            </span>
          </div>
        ))}
      </div>

      {/* Request Appointment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Request Doctor Review Appointment"
        subtitle="Schedule a consultation with an ophthalmologist"
      >
        <form onSubmit={handleRequestSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              Select Specialist / Facility
            </label>
            <select
              value={doctorSelected}
              onChange={(e) => setDoctorSelected(e.target.value)}
              className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium"
            >
              <option value="Dr. Shalini Sharma (Retina Specialist)">
                Dr. Shalini Sharma (Retina Specialist, Apollo Eye Institute)
              </option>
              <option value="Dr. Arvind Rao (Senior Ophthalmologist)">
                Dr. Arvind Rao (Senior Ophthalmologist, Pune Regional Eye Hospital)
              </option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              Preferred Date
            </label>
            <input
              type="date"
              value={preferredDate}
              onChange={(e) => setPreferredDate(e.target.value)}
              className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-200 bg-slate-50"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              Reason / Symptoms
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. AI screening suggested mild changes, routine checkup..."
              className="w-full text-xs sm:text-sm p-2.5 rounded-xl border border-slate-200 bg-slate-50"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Submit Request
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
