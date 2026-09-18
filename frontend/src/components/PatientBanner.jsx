import React from 'react';
import { getPatientClinicalProfile } from '../utils/clinicalProfiles';

export default function PatientBanner({ activePatient, onSwitchPatient, onOpenEnrollModal, surveyResult, gaitResult }) {
  if (!activePatient) return null;
  const profile = getPatientClinicalProfile(activePatient);

  return (
    <div className="w-full bg-surface-container-lowest shadow-[0_1px_3px_rgba(0,0,0,0.04)] border-b border-surface-container/80 px-4 sm:px-6 lg:px-8 py-2">
      <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-2.5">
        {/* Patient Demographics */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary shrink-0"></span>
            <span className="font-headline-sm text-sm sm:text-base text-on-surface font-bold tracking-tight">
              {activePatient.name}
            </span>
            <span className="font-data-mono text-[10px] px-1.5 py-0.5 bg-surface-container rounded text-on-surface-variant font-medium">
              {activePatient.id}
            </span>
            {activePatient.abhaId && (
              <span className="font-data-mono text-[10px] px-1.5 py-0.5 bg-primary/10 rounded text-primary font-bold hidden md:inline">
                ABHA {activePatient.abhaId}
              </span>
            )}
          </div>

          <div className="hidden lg:flex items-center gap-2 text-on-surface-variant font-body-sm text-[12px]">
            <span className="text-outline-variant">·</span>
            <span>{activePatient.age}y, {activePatient.gender}</span>
            <span className="text-outline-variant">·</span>
            <span>{activePatient.occupation || 'Agronomist'}</span>
            <span className="text-outline-variant">·</span>
            <span className="text-on-surface font-medium">{activePatient.region}</span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={onSwitchPatient}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface font-label-sm text-[11px] font-medium transition-colors border border-outline-variant/30"
              type="button"
              title="Switch to next active patient profile"
            >
              <span className="material-symbols-outlined text-[14px] text-secondary">swap_horiz</span>
              <span>Switch</span>
            </button>
            <button
              onClick={onOpenEnrollModal}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-sm text-[11px] font-semibold transition-colors shadow-xs"
              type="button"
              title="Register new patient into PHC registry"
            >
              <span className="material-symbols-outlined text-[14px] text-on-primary">person_add</span>
              <span>+ Enroll</span>
            </button>
          </div>
        </div>

        {/* Status Chips */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Vitals BMI Chip */}
          <div className="hidden md:flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container/60 text-on-surface text-[11px] font-medium border border-outline-variant/20">
            <span className="material-symbols-outlined text-[13px] text-tertiary">monitor_weight</span>
            <span>BMI {profile.vitals.bmi}</span>
          </div>

          {/* Survey Chip */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container/60 text-on-surface text-[11px] font-medium border border-outline-variant/20">
            <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
            <span>
              {surveyResult
                ? `Survey: ${surveyResult.raw_score}/40 (${surveyResult.category.toUpperCase()})`
                : (activePatient.surveyScore ? `Survey: ${activePatient.surveyScore}` : `Survey: ${profile.survey.score}/40 (${profile.survey.category})`)}
            </span>
          </div>

          {/* Gait Chip */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container/60 text-on-surface text-[11px] font-semibold border border-outline-variant/20">
            <span className={`w-1.5 h-1.5 rounded-full ${gaitResult || profile.gait.tested ? 'bg-error' : 'bg-tertiary animate-pulse'}`}></span>
            <span>
              {gaitResult ? `Gait: ${gaitResult.risk || 'Analyzed'}` : (activePatient.gaitRisk ? `Gait: ${activePatient.gaitRisk}` : profile.gait.risk)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
