import React from 'react';
import { getPatientClinicalProfile } from '../utils/clinicalProfiles';

export default function PatientBanner({ activePatient, onSwitchPatient, onOpenEnrollModal, surveyResult, gaitResult }) {
  if (!activePatient) return null;
  const profile = getPatientClinicalProfile(activePatient);

  return (
    <div className="w-full bg-surface-container-lowest shadow-[0_1px_4px_rgba(0,0,0,0.05)] border-b border-surface-container px-lg py-2.5">
      <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-sm">
        {/* Patient Demographics */}
        <div className="flex flex-wrap items-center gap-md">
          <div className="flex items-center gap-xs">
            <span className="font-label-sm text-[11px] text-on-surface-variant uppercase font-semibold">
              Active Patient
            </span>
            <span className="font-headline-sm text-[16px] text-on-surface font-bold">
              {activePatient.name}
            </span>
            <span className="font-data-mono text-[11px] px-xs py-2xs bg-surface-container rounded text-on-surface-variant font-medium">
              ID: {activePatient.id}
            </span>
            {activePatient.abhaId && (
              <span className="font-data-mono text-[10px] px-xs py-2xs bg-primary/10 rounded text-primary font-bold hidden sm:inline">
                ABHA: {activePatient.abhaId}
              </span>
            )}
          </div>

          <div className="hidden lg:flex items-center gap-xs text-on-surface-variant font-body-sm text-[12px]">
            <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
            <span>{activePatient.age}y, {activePatient.gender}</span>
            <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
            <span>{activePatient.occupation || 'Rural Agronomist'}</span>
            <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
            <span className="text-on-surface font-medium">{activePatient.region}</span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-xs">
            <button
              onClick={onSwitchPatient}
              className="flex items-center gap-2xs px-sm py-1.5 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface font-label-sm text-[12px] transition-colors border border-outline-variant/30"
              type="button"
            >
              <span className="material-symbols-outlined text-[15px] text-secondary">swap_horiz</span>
              Switch Patient
            </button>
            <button
              onClick={onOpenEnrollModal}
              className="flex items-center gap-2xs px-sm py-1.5 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-sm text-[12px] transition-colors font-semibold shadow-sm"
              type="button"
            >
              <span className="material-symbols-outlined text-[15px] text-on-primary">person_add</span>
              + Enroll Patient
            </button>
          </div>
        </div>

        {/* Status Chips */}
        <div className="flex items-center gap-xs">
          {/* Vitals BMI Chip */}
          <div className="hidden md:flex items-center gap-xs px-sm py-1.5 rounded-full bg-surface-container text-on-surface">
            <span className="material-symbols-outlined text-[14px] text-tertiary">monitor_weight</span>
            <span className="font-label-sm text-[11px] font-semibold">
              BMI {profile.vitals.bmi}
            </span>
          </div>

          {/* Survey Chip */}
          <div className="flex items-center gap-xs px-sm py-1.5 rounded-full bg-surface-container text-on-surface">
            <span className="w-2 h-2 rounded-full bg-primary"></span>
            <span className="font-label-sm text-[11px] font-medium">
              {surveyResult
                ? `Survey: ${surveyResult.raw_score}/40 (${surveyResult.category.toUpperCase()})`
                : (activePatient.surveyScore ? `Survey: ${activePatient.surveyScore}` : `Survey: ${profile.survey.score}/40 (${profile.survey.category})`)}
            </span>
          </div>

          {/* Gait Chip */}
          <div className="flex items-center gap-xs px-sm py-1.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed">
            <span className={`w-2 h-2 rounded-full ${gaitResult || profile.gait.tested ? 'bg-error' : 'bg-tertiary animate-pulse'}`}></span>
            <span className="font-label-sm text-[11px] font-semibold">
              {gaitResult ? `Gait: ${gaitResult.risk || 'Analyzed'}` : (activePatient.gaitRisk ? `Gait: ${activePatient.gaitRisk}` : profile.gait.risk)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
