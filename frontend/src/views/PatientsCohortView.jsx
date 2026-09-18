import React, { useState } from 'react';
import { getRoleConfig } from '../utils/auth';

export default function PatientsCohortView({
  patients,
  activePatient,
  onSelectPatient,
  onOpenEnrollModal,
  onNavigate,
  currentUser
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');

  const roleId = currentUser?.roleId || 'screener';
  const roleConfig = getRoleConfig(roleId);
  const isScreener = roleId === 'screener';
  const isOfficer = roleId === 'officer';
  const isAdmin = roleId === 'admin';

  const filteredPatients = patients.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.region && p.region.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;
    if (filter === 'all') return true;
    if (filter === 'high') return p.combinedRisk === 'high';
    if (filter === 'moderate') return p.combinedRisk === 'moderate';
    if (filter === 'low') return p.combinedRisk === 'low';
    return true;
  });

  return (
    <div className="flex flex-col w-full gap-lg animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-md p-card-padding rounded-xl bg-surface-container-lowest shadow-sm border border-surface-container">
        <div>
          <div className="flex items-center gap-xs mb-1">
            <span className="px-xs py-2xs rounded bg-surface-container-high text-primary font-data-mono text-[11px] font-bold uppercase">
              {roleConfig.rosterTitle}
            </span>
            <span className="font-label-sm text-secondary text-xs">
              · {currentUser?.station || 'Assam Frontline Health Network'}
            </span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface font-bold">
            {isScreener
              ? 'Station Triage & Screening Queue'
              : isOfficer
              ? 'Clinical Review & Specialist Referral Roster'
              : 'ABDM Telemetry & Node Audit Registry'}
          </h1>
          <p className="font-body-md text-secondary text-sm">
            {roleConfig.rosterSubtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-xs self-start lg:self-center">
          <button
            onClick={() => {
              if (!patients || patients.length === 0) return;
              const headers = ['Patient ID', 'Name', 'Age', 'Gender', 'Occupation', 'Region', 'Survey Score', 'Combined Risk', 'Enrolled Date'];
              const rows = patients.map(p => [
                p.id || '',
                `"${p.name || ''}"`,
                p.age || '',
                p.gender || '',
                `"${p.occupation || ''}"`,
                `"${p.region || ''}"`,
                `"${p.surveyScore || '24/40'}"`,
                p.combinedRisk || 'moderate',
                p.enrolledDate || '2025-02-18'
              ]);
              const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
              const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.setAttribute('href', url);
              link.setAttribute('download', `OrthoNex_India_Patient_Registry_${new Date().toISOString().slice(0,10)}.csv`);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            className="px-md py-2.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-sm font-semibold transition flex items-center gap-1.5 border border-outline-variant/30"
            type="button"
            title="Download CSV report of cohort registry"
          >
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export Registry CSV
          </button>
          <button
            onClick={onOpenEnrollModal}
            className="px-lg py-2.5 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-md text-sm font-bold shadow-md transition flex items-center gap-1.5"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            + Enroll New Patient
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-card-padding rounded-xl bg-surface-container-lowest shadow-sm border border-surface-container flex flex-col md:flex-row items-center justify-between gap-md">
        <div className="relative w-full md:w-96">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-[18px]">
            search
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by patient name, ID, or village..."
            className="w-full pl-10 pr-4 py-2 bg-surface-container-low border border-outline-variant/30 rounded-lg text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-xs overflow-x-auto no-scrollbar w-full md:w-auto">
          {[
            { id: 'all', label: 'All Cohort' },
            { id: 'high', label: 'High Risk Tier-2' },
            { id: 'moderate', label: 'Moderate' },
            { id: 'low', label: 'Low / In-Range' }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-sm py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                filter === f.id
                  ? 'bg-primary text-on-primary shadow-xs font-bold'
                  : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
              }`}
              type="button"
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Patient Cards Roster */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-md">
        {filteredPatients.map((patient) => {
          const isActive = activePatient?.id === patient.id;
          const isHigh = patient.combinedRisk === 'high';
          const isMod = patient.combinedRisk === 'moderate';

          return (
            <div
              key={patient.id}
              className={`p-card-padding rounded-xl bg-surface-container-lowest border transition-all flex flex-col justify-between gap-md shadow-sm ${
                isActive
                  ? 'border-primary ring-2 ring-primary/20 bg-primary-fixed/5'
                  : 'border-surface-container hover:border-outline-variant/50'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-xs mb-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-headline-sm text-base text-on-surface font-bold">
                        {patient.name}
                      </h3>
                      {isActive && (
                        <span className="px-1.5 py-0.5 rounded bg-primary text-on-primary font-data-mono text-[9px] font-bold">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <span className="font-data-mono text-[11px] text-secondary">
                      ID: {patient.id}
                    </span>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-full font-label-sm text-[10px] font-bold uppercase ${
                      isHigh
                        ? 'bg-error-container text-on-error-container'
                        : isMod
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'bg-tertiary-fixed text-on-tertiary-fixed'
                    }`}
                  >
                    {patient.combinedRisk || 'Moderate'}
                  </span>
                </div>

                <div className="space-y-1 text-xs text-on-surface-variant border-t border-surface-container pt-2">
                  <div className="flex justify-between">
                    <span className="text-secondary">Demographics</span>
                    <span className="font-medium text-on-surface">
                      {patient.age}y, {patient.gender}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary">Occupation</span>
                    <span className="font-medium text-on-surface truncate max-w-[160px]">
                      {patient.occupation}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary">Location</span>
                    <span className="font-medium text-on-surface truncate max-w-[160px]">
                      {patient.region}
                    </span>
                  </div>
                  {isScreener && (
                    <div className="flex justify-between">
                      <span className="text-secondary">Station Queue</span>
                      <span className="font-medium text-cyan-700 truncate max-w-[160px]">
                        {patient.assignedStation || 'Diphu PHC'}
                      </span>
                    </div>
                  )}
                  {isOfficer && (
                    <div className="flex justify-between">
                      <span className="text-secondary">Referral / Care</span>
                      <span className="font-medium text-primary truncate max-w-[160px]">
                        {patient.sopStatus || 'Clinical Review Req.'}
                      </span>
                    </div>
                  )}
                  {isAdmin && (
                    <div className="flex justify-between">
                      <span className="text-secondary">Edge Mesh State</span>
                      <span className="font-data-mono text-[11px] text-emerald-600 truncate max-w-[160px]">
                        {patient.meshSyncStatus || 'Synchronized'}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-secondary">Survey Result</span>
                    <span className="font-data-mono font-semibold text-primary">
                      {patient.surveyScore || '24/40 (WOMAC)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Role-Specific Action Buttons */}
              <div className="flex items-center gap-xs pt-xs border-t border-surface-container">
                <button
                  onClick={() => onSelectPatient(patient)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${
                    isActive
                      ? 'bg-surface-container text-on-surface-variant cursor-default'
                      : 'bg-primary text-on-primary hover:bg-primary-container shadow-xs'
                  }`}
                  type="button"
                >
                  {isActive
                    ? 'Active Session'
                    : isScreener
                    ? 'Load for Triage'
                    : isOfficer
                    ? 'Review Patient'
                    : 'Audit Record'}
                </button>

                {isScreener && (
                  <button
                    onClick={() => {
                      onSelectPatient(patient);
                      onNavigate(patient.surveyCompleted ? 'gait' : 'survey');
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-variant text-on-surface text-xs font-semibold transition flex items-center gap-1"
                    type="button"
                    title={patient.surveyCompleted ? 'Capture 8s Gait Video' : 'Conduct WOMAC/KOOS Questionnaire'}
                  >
                    <span className="material-symbols-outlined text-[16px] text-primary">
                      {patient.surveyCompleted ? 'directions_walk' : 'assignment'}
                    </span>
                    <span className="text-[11px]">{patient.surveyCompleted ? 'Gait' : 'Survey'}</span>
                  </button>
                )}

                {isOfficer && (
                  <button
                    onClick={() => {
                      onSelectPatient(patient);
                      onNavigate('report');
                    }}
                    className="px-2.5 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-variant text-on-surface text-xs font-semibold transition flex items-center gap-1"
                    type="button"
                    title="Open Multimodal Diagnostic Report & X-Ray Staging"
                  >
                    <span className="material-symbols-outlined text-[16px] text-primary">radiology</span>
                    <span className="text-[11px]">Report</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
