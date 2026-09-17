import React, { useState } from 'react';
import CameraViewport from '../components/CameraViewport';

export default function OverviewView({
  activePatient,
  onNavigate,
  surveyResult,
  gaitResult,
  xrayResult,
  onOpenTeleconsult,
  camera
}) {
  const [painValue, setPainValue] = useState(surveyResult?.pain ?? 7);
  const [stiffnessValue, setStiffnessValue] = useState(surveyResult?.stiffness ?? 35);
  const [activeCamSource, setActiveCamSource] = useState('webcam');

  return (
    <div className="flex flex-col w-full gap-lg animate-fade-in">
      {/* SOP-09 Triage Session Banner */}
      <section className="w-full bg-surface-container-lowest rounded-xl shadow-md p-card-padding border-l-4 border-primary">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-md pb-md border-b border-surface-container">
          <div className="flex items-center gap-md">
            <div className="w-12 h-12 rounded-xl bg-primary-container text-on-primary flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-[26px]">assignment_ind</span>
            </div>
            <div>
              <div className="flex items-center gap-xs">
                <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                  Standard Frontline Triage Session
                </h2>
                <span className="px-xs py-2xs rounded bg-surface-container-high text-primary font-data-mono text-data-mono font-bold">
                  ICMR-NER-SOP-09
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Screener Station: PHC-Karbi-A2 · Patient: {activePatient?.name || 'Boron Boruah'} ({activePatient?.age || 52}y {activePatient?.gender || 'M'}, ID: #{activePatient?.id || '0892'})
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-xs">
            <span className="px-sm py-xs rounded-full bg-surface-container text-on-surface font-label-sm text-label-sm font-semibold flex items-center gap-2xs">
              <span className="material-symbols-outlined text-[16px] text-tertiary">cloud_sync</span>
              Sync Node: Active (LAN)
            </span>
            <span className="px-sm py-xs rounded-full bg-error-container text-on-error-container font-label-sm text-label-sm font-semibold flex items-center gap-2xs">
              <span className="w-2 h-2 rounded-full bg-error animate-ping"></span>
              Stage 3 Gait Req.
            </span>
          </div>
        </div>

        {/* 4-Step SOP Flow */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-sm pt-md">
          {/* Step 1 */}
          <div className="p-sm rounded-lg bg-surface-container-low flex items-center gap-sm border border-outline-variant/20">
            <div className="w-7 h-7 rounded-full bg-tertiary text-on-tertiary flex items-center justify-center font-bold font-data-mono text-[12px] shrink-0">
              ✓
            </div>
            <div className="min-w-0">
              <p className="font-label-sm text-[10px] text-on-surface-variant uppercase font-semibold">
                Step 1 · Vitals
              </p>
              <p className="font-body-sm text-[12px] text-tertiary font-bold truncate">
                BMI 27.4 · Complete
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <button
            onClick={() => onNavigate('survey')}
            className="p-sm rounded-lg bg-surface-container-low hover:bg-surface-container flex items-center gap-sm border border-outline-variant/20 text-left transition cursor-pointer"
            type="button"
          >
            <div className="w-7 h-7 rounded-full bg-tertiary text-on-tertiary flex items-center justify-center font-bold font-data-mono text-[12px] shrink-0">
              ✓
            </div>
            <div className="min-w-0 grow">
              <p className="font-label-sm text-[10px] text-on-surface-variant uppercase font-semibold">
                Step 2 · KOOS Survey
              </p>
              <p className="font-body-sm text-[12px] text-tertiary font-bold truncate">
                {surveyResult ? `${surveyResult.raw_score}/40 (${surveyResult.category.toUpperCase()})` : '24/40 (Mod. Risk)'}
              </p>
            </div>
            <span className="material-symbols-outlined text-[15px] text-on-surface-variant">arrow_forward</span>
          </button>

          {/* Step 3 */}
          <button
            onClick={() => onNavigate('gait')}
            className="p-sm rounded-lg bg-primary text-on-primary shadow-sm flex items-center gap-sm text-left transition hover:bg-primary-container cursor-pointer"
            type="button"
          >
            <div className="w-7 h-7 rounded-full bg-on-primary text-primary flex items-center justify-center font-bold font-data-mono text-[12px] animate-pulse shrink-0">
              3
            </div>
            <div className="min-w-0 grow">
              <p className="font-label-sm text-[10px] text-primary-fixed uppercase font-semibold">
                Step 3 · Gait HUD
              </p>
              <p className="font-headline-sm text-[12px] font-bold truncate">
                8s Walk Capture
              </p>
            </div>
            <span className="px-1.5 py-0.5 rounded bg-on-primary/20 text-on-primary font-data-mono text-[9px] font-bold">
              LAUNCH
            </span>
          </button>

          {/* Step 4: X-Ray & Decision Staging */}
          <button
            onClick={() => onNavigate('report')}
            className={`p-sm rounded-lg flex items-center gap-sm text-left transition cursor-pointer border ${
              xrayResult
                ? 'bg-surface-container-low hover:bg-surface-container border-emerald-500/40'
                : 'bg-surface-container-low hover:bg-surface-container border-tertiary/40'
            }`}
            type="button"
          >
            <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold font-data-mono text-[12px] shrink-0 ${
              xrayResult ? 'bg-emerald-600 text-white' : 'bg-tertiary-container text-on-tertiary'
            }`}>
              {xrayResult ? '✓' : '4'}
            </div>
            <div className="min-w-0 grow">
              <p className="font-label-sm text-[10px] text-tertiary uppercase font-semibold">
                Step 4 · X-Ray & Triage
              </p>
              <p className="font-body-sm text-[12px] text-on-surface font-bold truncate">
                {xrayResult ? `KL-${xrayResult.kl_grade} (Grad-CAM Ready)` : 'Upload & Grad-CAM'}
              </p>
            </div>
            <span className={`material-symbols-outlined text-[15px] ${xrayResult ? 'text-emerald-600' : 'text-tertiary'}`}>
              radiology
            </span>
          </button>
        </div>
      </section>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg items-start">
        {/* Left Column: Clinical Matrix & Telemetry (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-lg">
          {/* Clinical & Agro-Workload Matrix */}
          <section className="w-full bg-surface-container-lowest rounded-xl shadow-md p-card-padding border border-surface-container">
            <div className="flex items-center justify-between pb-sm border-b border-outline-variant/30 mb-sm">
              <div className="flex items-center gap-xs">
                <span className="material-symbols-outlined text-[20px] text-primary">clinical_notes</span>
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                  Clinical & Agro-Workload Matrix
                </h3>
              </div>
              <span className="px-xs py-2xs rounded bg-surface-container font-data-mono text-[10px] text-on-surface-variant">
                NER Field Protocol
              </span>
            </div>

            <div className="space-y-sm">
              {/* Pain Slider */}
              <div className="p-sm rounded-lg bg-surface-container-low">
                <div className="flex items-center justify-between mb-2xs">
                  <span className="font-label-sm text-label-sm text-on-surface font-semibold">
                    Self-Reported Knee Pain (VAS)
                  </span>
                  <span className="font-data-metric text-[18px] text-error font-bold">
                    {painValue} / 10
                  </span>
                </div>
                <input
                  className="w-full accent-primary h-2 bg-surface-variant rounded-lg cursor-pointer"
                  max="10"
                  min="0"
                  type="range"
                  value={painValue}
                  onChange={(e) => setPainValue(Number(e.target.value))}
                />
                <div className="flex justify-between font-label-sm text-[11px] text-on-surface-variant mt-2xs">
                  <span>0 (None)</span>
                  <span>5 (Moderate)</span>
                  <span>10 (Severe)</span>
                </div>
              </div>

              {/* Stiffness Slider */}
              <div className="p-sm rounded-lg bg-surface-container-low">
                <div className="flex items-center justify-between mb-2xs">
                  <span className="font-label-sm text-label-sm text-on-surface font-semibold">
                    Morning Joint Stiffness Duration
                  </span>
                  <span className="font-data-metric text-[18px] text-primary font-bold">
                    {stiffnessValue} mins
                  </span>
                </div>
                <input
                  className="w-full accent-primary h-2 bg-surface-variant rounded-lg cursor-pointer"
                  max="90"
                  min="0"
                  step="5"
                  type="range"
                  value={stiffnessValue}
                  onChange={(e) => setStiffnessValue(Number(e.target.value))}
                />
                <div className="flex justify-between font-label-sm text-[11px] text-on-surface-variant mt-2xs">
                  <span>&lt;10m Normal</span>
                  <span>30m (OA Cutoff)</span>
                  <span>&gt;60m (Severe)</span>
                </div>
              </div>

              {/* Occupational Hazards */}
              <div>
                <span className="font-label-sm text-[11px] text-on-surface font-semibold block mb-2xs uppercase tracking-wide">
                  NER Occupational Hazards (Tea & Agro Sector)
                </span>
                <div className="flex flex-wrap gap-2xs">
                  <span className="px-xs py-1 rounded-full bg-error-container text-on-error-container font-label-sm text-[11px] font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px]">terrain</span>
                    Tea Plucking (&gt;8h/d)
                  </span>
                  <span className="px-xs py-1 rounded-full bg-error-container text-on-error-container font-label-sm text-[11px] font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px]">airline_seat_recline_extra</span>
                    Deep Squatting (&gt;4h)
                  </span>
                  <span className="px-xs py-1 rounded-full bg-surface-container-high text-on-surface font-label-sm text-[11px] flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px]">backpack</span>
                    Heavy Basket (&gt;15kg)
                  </span>
                  <span className="px-xs py-1 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-[11px]">
                    Hilly Incline
                  </span>
                </div>
              </div>

              {/* Cumulative WOMAC */}
              <div className="pt-2xs flex items-center justify-between p-sm rounded-lg bg-surface-container">
                <div>
                  <span className="font-label-sm text-[10px] text-on-surface-variant uppercase font-semibold block">
                    Cumulative Risk Assessment
                  </span>
                  <span className="font-headline-sm text-headline-sm text-on-surface font-bold">
                    24 / 40 (WOMAC)
                  </span>
                </div>
                <button
                  onClick={() => onNavigate('survey')}
                  className="px-xs py-1 rounded-full bg-surface-container-highest text-primary font-label-sm text-[11px] font-bold hover:underline"
                  type="button"
                >
                  Edit Survey →
                </button>
              </div>
            </div>
          </section>

          {/* Live Telemetry & Kinematics */}
          <section className="w-full bg-surface-container-lowest rounded-xl shadow-md p-card-padding border border-surface-container">
            <div className="flex items-center justify-between pb-sm border-b border-outline-variant/30 mb-sm">
              <div className="flex items-center gap-xs">
                <span className="material-symbols-outlined text-[20px] text-tertiary">speed</span>
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                  Live Telemetry & Kinematics
                </h3>
              </div>
              <span className="px-xs py-2xs rounded bg-tertiary-fixed text-on-tertiary-fixed font-data-mono text-[10px] font-bold">
                Live Synced
              </span>
            </div>

            <div className="grid grid-cols-2 gap-sm mb-sm">
              <div className="p-sm rounded-xl bg-surface-container-low flex flex-col justify-between">
                <span className="font-label-sm text-[11px] text-on-surface-variant uppercase font-semibold">Cadence</span>
                <div className="flex items-baseline gap-2xs my-xs">
                  <span className="font-display-lg text-[28px] font-bold text-on-surface">94</span>
                  <span className="font-body-sm text-[11px] text-on-surface-variant">steps/min</span>
                </div>
                <span className="px-2xs py-none rounded bg-surface-container-high text-on-surface font-data-mono text-[10px]">
                  -16% vs Normal
                </span>
              </div>

              <div className="p-sm rounded-xl bg-surface-container-low flex flex-col justify-between">
                <span className="font-label-sm text-[11px] text-on-surface-variant uppercase font-semibold">Gait Speed</span>
                <div className="flex items-baseline gap-2xs my-xs">
                  <span className="font-display-lg text-[28px] font-bold text-on-surface">0.86</span>
                  <span className="font-body-sm text-[11px] text-on-surface-variant">m/sec</span>
                </div>
                <span className="px-2xs py-none rounded bg-error-container text-on-error-container font-data-mono text-[10px]">
                  Antalgic Cutoff
                </span>
              </div>
            </div>

            {/* Extension Deficit */}
            <div className="p-sm rounded-xl bg-surface-container-low mb-sm">
              <div className="flex items-center justify-between mb-xs">
                <span className="font-label-sm text-label-sm text-on-surface font-semibold">Extension Deficit</span>
                <span className="px-xs py-none rounded bg-error-container text-on-error-container font-data-mono text-[10px] font-bold">
                  10° High Asymmetry
                </span>
              </div>
              <div className="space-y-xs">
                <div className="flex items-center justify-between font-body-sm text-[11px]">
                  <span className="text-on-surface-variant">Left Knee (Unimpaired)</span>
                  <span className="font-data-mono font-bold text-on-surface">4° Deficit</span>
                </div>
                <div className="w-full bg-surface-variant h-1.5 rounded-full overflow-hidden">
                  <div className="bg-tertiary h-full rounded-full" style={{ width: '25%' }}></div>
                </div>
                <div className="flex items-center justify-between font-body-sm text-[11px] pt-xs">
                  <span className="text-error font-semibold">Right Knee (Affected)</span>
                  <span className="font-data-mono font-bold text-error">14° Deficit</span>
                </div>
                <div className="w-full bg-surface-variant h-1.5 rounded-full overflow-hidden">
                  <div className="bg-error h-full rounded-full" style={{ width: '78%' }}></div>
                </div>
              </div>
            </div>

            <div className="p-sm rounded-lg bg-surface-container flex items-center justify-between">
              <div className="flex items-center gap-xs">
                <span className="material-symbols-outlined text-[18px] text-primary">swap_driving_apps_wheel</span>
                <div>
                  <span className="font-label-sm text-[11px] text-on-surface font-semibold block">Dynamic Coronal Axis Offset</span>
                  <span className="font-body-sm text-[10px] text-on-surface-variant">Varus Thrust Medialization</span>
                </div>
              </div>
              <span className="font-data-mono text-data-mono font-bold text-primary px-xs py-1 bg-surface-container-lowest rounded shadow-xs">
                +3.8° Varus
              </span>
            </div>
          </section>
        </div>

        {/* Right Column: Biomechanical Feed Preview & Quick Actions (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-lg">
          <section className="w-full bg-surface-container-lowest rounded-xl shadow-md p-card-padding border border-surface-container">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-sm pb-sm border-b border-outline-variant/30 mb-sm">
              <div>
                <div className="flex items-center gap-xs">
                  <h3 className="font-headline-lg text-headline-lg text-on-surface font-bold">
                    Sagittal Biomechanical Optical Feed
                  </h3>
                  <span className="px-xs py-2xs rounded bg-surface-container-high text-primary font-data-mono text-data-mono font-semibold">
                    HUD v2.4
                  </span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  Unilateral sagittal knee flexion kinematics at 90° lateral perspective
                </p>
              </div>

              {/* Source Switcher */}
              <div className="flex flex-wrap items-center gap-2xs bg-surface-container p-2xs rounded-lg">
                {[
                  { id: 'webcam', label: 'Laptop HD', icon: 'videocam' },
                  { id: 'sample', label: 'Clinical Sample', icon: 'smart_display' },
                  { id: 'esp32', label: 'ESP32-CAM', icon: 'sensors' }
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setActiveCamSource(s.id);
                      if (s.id === 'sample') {
                        camera?.switchToSampleVideo?.();
                      } else if (s.id === 'webcam') {
                        camera?.startCamera?.();
                      }
                    }}
                    className={`px-xs py-1 rounded font-label-sm text-[11px] font-semibold flex items-center gap-1 transition ${
                      (s.id === 'sample' ? camera?.sourceMode === 'sample' : (s.id === 'webcam' ? (camera?.isWebcamActive || activeCamSource === 'webcam') : activeCamSource === s.id))
                        ? 'bg-primary text-on-primary shadow-xs'
                        : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[14px]">{s.icon}</span>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Live Camera Viewport */}
            <CameraViewport
              camera={camera}
              onEnterFullHud={() => onNavigate('gait')}
            />

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center justify-between gap-sm pt-md">
              <div className="flex flex-wrap items-center gap-xs">
                <button
                  onClick={() => onNavigate('gait')}
                  className="px-md py-2 rounded-lg bg-error hover:bg-error/90 text-on-error font-label-md text-label-md font-bold shadow-md transition flex items-center gap-xs"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px] animate-pulse">radio_button_checked</span>
                  Start 8s Walking Test
                </button>
                <button
                  onClick={() => onNavigate('report')}
                  className="px-md py-2 rounded-lg bg-surface-container-high hover:bg-surface-variant text-on-surface font-label-md text-label-md font-semibold transition flex items-center gap-xs"
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">radiology</span>
                  View Screening Report
                </button>
              </div>

              <button
                onClick={onOpenTeleconsult}
                className="px-md py-2 rounded-lg bg-tertiary-container hover:bg-tertiary text-on-tertiary font-label-md text-label-md font-bold shadow-md transition flex items-center gap-xs"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">cell_tower</span>
                Refer to Specialist
              </button>
            </div>

            {/* Calibration Checklist */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-sm pt-md border-t border-surface-container mt-md">
              <div className="p-sm rounded-xl bg-surface-container-low flex flex-col justify-between">
                <div className="flex items-center gap-xs mb-xs">
                  <span className="material-symbols-outlined text-[16px] text-primary">straighten</span>
                  <span className="font-headline-sm text-[13px] text-on-surface font-bold">1. Distance</span>
                </div>
                <p className="font-body-sm text-[11px] text-on-surface-variant">1.0m elevation, 2.5m perpendicular.</p>
                <span className="mt-xs font-data-mono text-[10px] text-primary font-bold">Tolerance: ±0.15m</span>
              </div>
              <div className="p-sm rounded-xl bg-surface-container-low flex flex-col justify-between">
                <div className="flex items-center gap-xs mb-xs">
                  <span className="material-symbols-outlined text-[16px] text-tertiary">light_mode</span>
                  <span className="font-headline-sm text-[13px] text-on-surface font-bold">2. Illumination</span>
                </div>
                <p className="font-body-sm text-[11px] text-on-surface-variant">Min 300 lux diffuse lighting.</p>
                <span className="mt-xs font-data-mono text-[10px] text-tertiary font-bold">410 Lux (Pass)</span>
              </div>
              <div className="p-sm rounded-xl bg-surface-container-low flex flex-col justify-between">
                <div className="flex items-center gap-xs mb-xs">
                  <span className="material-symbols-outlined text-[16px] text-secondary">directions_walk</span>
                  <span className="font-headline-sm text-[13px] text-on-surface font-bold">3. Cadence</span>
                </div>
                <p className="font-body-sm text-[11px] text-on-surface-variant">Continuous straight line walk.</p>
                <span className="mt-xs font-data-mono text-[10px] text-secondary font-bold">Min 4 Strides</span>
              </div>
            </div>
          </section>

          {/* Statutory ICMR Notice */}
          <section className="w-full rounded-xl bg-surface-container-low p-card-padding shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-md border border-outline-variant/30">
            <div className="flex items-start gap-sm">
              <div className="w-9 h-9 rounded-xl bg-surface-container-highest text-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[20px]">policy</span>
              </div>
              <div>
                <div className="flex items-center gap-xs">
                  <span className="font-headline-sm text-[13px] text-on-surface font-bold">
                    Statutory ICMR-NER AI Screening Protocol
                  </span>
                  <span className="px-xs py-none rounded bg-surface-container-highest font-data-mono text-[10px] text-primary font-semibold">
                    REG-2024-NER-OA
                  </span>
                </div>
                <p className="font-body-sm text-[11px] text-on-surface-variant mt-2xs">
                  Frontline risk-stratification aid for CHCs and PHCs across Assam, Meghalaya, and Arunachal Pradesh. Screening tool only — not a clinical diagnosis.
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('report')}
              className="px-sm py-1.5 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-sm text-label-sm font-semibold transition shrink-0"
              type="button"
            >
              Review Dossier
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
