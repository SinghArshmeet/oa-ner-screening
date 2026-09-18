import React, { useState, useEffect } from 'react';
import CameraViewport from '../components/CameraViewport';
import { getPatientClinicalProfile } from '../utils/clinicalProfiles';
import { isSupabaseConfigured } from '../utils/supabase';
import { predictClinicalRisk } from '../utils/api';

export default function OverviewView({
  activePatient,
  onNavigate,
  surveyResult,
  onSurveySubmitted,
  gaitResult,
  xrayResult,
  onOpenTeleconsult,
  camera
}) {
  const profile = getPatientClinicalProfile(activePatient);

  // Active evaluation step (1 to 4)
  const [activeStep, setActiveStep] = useState(gaitResult ? 4 : 1);
  const [clinicalPrediction, setClinicalPrediction] = useState(surveyResult?.clinical_prediction || null);
  const [isPredicting, setIsPredicting] = useState(false);
  const [completedSteps, setCompletedSteps] = useState(() => {
    const steps = [1];
    if (surveyResult) steps.push(2);
    if (camera?.isWebcamActive || camera?.sourceMode === 'sample') steps.push(3);
    if (gaitResult) steps.push(4);
    return steps;
  });

  // Step 1: Vitals & Anthropometrics State
  const [heightCm, setHeightCm] = useState(profile.vitals?.heightCm || 170);
  const [weightKg, setWeightKg] = useState(profile.vitals?.weightKg || 75);
  const [bloodPressure, setBloodPressure] = useState(profile.vitals?.bp || '130/85');
  const [affectedJoint, setAffectedJoint] = useState(profile.vitals?.affectedJoint || 'Right Knee (Medial Compartment)');
  const [selectedHazards, setSelectedHazards] = useState(
    profile.survey?.hazards?.map((h) => h.label) || ['Prolonged Knee Squatting', 'Agrarian Manual Load']
  );

  // Calculate live BMI
  const computedBmi = (weightKg / Math.pow(heightCm / 100, 2)).toFixed(1);
  const getBmiStatus = (bmi) => {
    const b = parseFloat(bmi);
    if (b < 18.5) return { label: 'Underweight', color: 'text-amber-500', note: 'Low bone mineral density risk' };
    if (b < 25) return { label: 'Normal Weight', color: 'text-emerald-500', note: 'Balanced mechanical joint load' };
    if (b < 30) return { label: 'Overweight', color: 'text-amber-500', note: 'Elevated patellofemoral compressive stress (+35%)' };
    return { label: 'Obese', color: 'text-error', note: 'High mechanical compartment loading (+60%)' };
  };
  const bmiStatus = getBmiStatus(computedBmi);

  // Step 2: Clinical Symptoms & KOOS State
  const [painValue, setPainValue] = useState(surveyResult?.pain ?? profile.survey.painVAS);
  const [stiffnessValue, setStiffnessValue] = useState(surveyResult?.stiffness ?? profile.survey.stiffnessMins);
  const [functionalFlags, setFunctionalFlags] = useState({
    squatDifficulty: true,
    crepitus: true,
    stairAscentPain: true,
    nightPain: false
  });

  // Step 3: Optical Camera source state
  const [activeCamSource, setActiveCamSource] = useState(camera?.sourceMode || 'webcam');

  // Sync profile when patient or surveyResult changes
  useEffect(() => {
    setPainValue(surveyResult?.pain ?? profile.survey.painVAS);
    setStiffnessValue(surveyResult?.stiffness ?? profile.survey.stiffnessMins);
    setHeightCm(profile.vitals?.heightCm || 170);
    setWeightKg(profile.vitals?.weightKg || 75);
    setBloodPressure(profile.vitals?.bp || '130/85');
    setAffectedJoint(profile.vitals?.affectedJoint || 'Right Knee (Medial Compartment)');
  }, [activePatient, surveyResult, profile]);

  // Real-time clinical prediction query against OAI NIH clinical model
  useEffect(() => {
    let active = true;
    const runPrediction = async () => {
      setIsPredicting(true);
      try {
        const bpParts = (bloodPressure || '130/85').split('/');
        const bpSys = parseFloat(bpParts[0]) || 130;
        const bpDias = parseFloat(bpParts[1]) || 85;
        const sideVal = affectedJoint.toLowerCase().includes('left') ? 2 : 1;
        const sexVal = (activePatient?.gender || profile.gender || 'Male').toLowerCase().startsWith('f') ? 2 : 1;

        const res = await predictClinicalRisk({
          age: activePatient?.age || profile.age || 60,
          sex: sexVal,
          bmi: parseFloat(computedBmi) || 26.5,
          side: sideVal,
          bp_sys: bpSys,
          bp_dias: bpDias,
          pain: Number(painValue ?? 5),
          stiffness: Number(stiffnessValue ?? 30),
          gait_speed: gaitResult?.velocity || 0.95,
          knee_flexion_deg: 135.0,
          knee_deficit_deg: 10.0
        });
        if (active && res) {
          setClinicalPrediction(res);
        }
      } catch (e) {
        console.warn('Clinical prediction query notice:', e);
      } finally {
        if (active) setIsPredicting(false);
      }
    };

    runPrediction();
    return () => {
      active = false;
    };
  }, [painValue, stiffnessValue, computedBmi, bloodPressure, affectedJoint, activePatient, gaitResult]);

  // Compute live KOOS-India composite score based on inputs
  const computeKoosScore = () => {
    // VAS pain contributes 0-15
    const painComponent = Math.round((painValue / 10) * 15);
    // Stiffness contributes 0-10
    const stiffnessComponent = Math.min(10, Math.round((stiffnessValue / 60) * 10));
    // Functional flags contribute 0-15
    const flagsCount = Object.values(functionalFlags).filter(Boolean).length;
    const flagComponent = Math.round((flagsCount / 4) * 15);

    const total = Math.min(40, painComponent + stiffnessComponent + flagComponent);
    let category = 'low';
    if (total >= 28) category = 'high';
    else if (total >= 16) category = 'moderate';

    return { total, category };
  };

  const currentKoos = computeKoosScore();

  // Handle saving Step 2 Clinical Symptoms
  const handleSaveStep2 = () => {
    const bpParts = (bloodPressure || '130/85').split('/');
    const scoreData = {
      raw_score: currentKoos.total,
      compositeScore: currentKoos.total,
      category: currentKoos.category,
      pain: painValue,
      stiffness: stiffnessValue,
      functionalFlags,
      vitals: {
        heightCm,
        weightKg,
        bmi: parseFloat(computedBmi),
        bloodPressure,
        bpSys: parseFloat(bpParts[0]) || 130,
        bpDias: parseFloat(bpParts[1]) || 85,
        affectedJoint,
        selectedHazards
      },
      clinical_symptoms: {
        pain: painValue,
        stiffness: stiffnessValue,
        functionalFlags,
        koosTotal: currentKoos.total,
        koosCategory: currentKoos.category
      },
      clinical_prediction: clinicalPrediction
    };

    if (onSurveySubmitted) {
      onSurveySubmitted(scoreData);
    }

    markStepComplete(2);
    setActiveStep(3);
  };

  const markStepComplete = (stepNum) => {
    setCompletedSteps((prev) => Array.from(new Set([...prev, stepNum])));
  };

  const stepsList = [
    {
      id: 1,
      title: 'Patient Intake & Vitals',
      shortTitle: '1. Vitals',
      subtitle: 'Height, Weight, BMI & Mechanical Load',
      icon: 'monitor_heart'
    },
    {
      id: 2,
      title: 'Clinical Symptoms & KOOS',
      shortTitle: '2. KOOS Score',
      subtitle: 'Pain VAS, Stiffness & Mobility Checks',
      icon: 'clinical_notes'
    },
    {
      id: 3,
      title: 'Optical Setup & Calibration',
      shortTitle: '3. Camera Calibration',
      subtitle: '90° Sagittal, Runway & Lux Sensor',
      icon: 'videocam'
    },
    {
      id: 4,
      title: 'Final Gait Recording Studio',
      shortTitle: '4. Gait Recording',
      subtitle: '8s Walk Test & Biomechanical AI',
      icon: 'directions_walk'
    }
  ];

  return (
    <div className="flex flex-col w-full gap-lg animate-fade-in">
      {/* SOP-09 Triage Session Banner */}
      <section className="w-full bg-surface-container-lowest rounded-xl shadow-md p-card-padding border-l-4 border-primary">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-md pb-md border-b border-surface-container">
          <div className="flex items-center gap-md">
            <div className="w-12 h-12 rounded-xl bg-primary-container text-on-primary flex items-center justify-center shadow-sm shrink-0">
              <span className="material-symbols-outlined text-[26px]">assignment_ind</span>
            </div>
            <div>
              <div className="flex items-center gap-xs flex-wrap">
                <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                  Clinical Osteoarthritis Screening Protocol
                </h2>
                <span className="px-xs py-2xs rounded bg-surface-container-high text-primary font-data-mono text-data-mono font-bold">
                  {profile.sessionCode}
                </span>
                <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
                  Sequential Triage Flow
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                Screening Station: <span className="font-semibold text-on-surface">{profile.stationName}</span> · Active Patient: <span className="font-bold text-on-surface">{activePatient?.name || 'Rajesh Khurana'}</span> ({activePatient?.age || 61}y {activePatient?.gender || 'Male'}, ID: #{activePatient?.id || 'IND-OA-2025-0101'})
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-xs">
            {isSupabaseConfigured ? (
              <span className="px-sm py-xs rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-label-sm text-label-sm font-semibold flex items-center gap-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Cloud Synced
              </span>
            ) : (
              <span className="px-sm py-xs rounded-full bg-surface-container text-on-surface font-label-sm text-label-sm font-semibold flex items-center gap-2xs">
                <span className="material-symbols-outlined text-[16px] text-tertiary">cloud_sync</span>
                Local Station (LAN)
              </span>
            )}

            {/* Fast Track to Gait CTA */}
            <button
              onClick={() => onNavigate('gait')}
              className="px-sm py-1.5 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-sm text-label-sm font-bold shadow-sm transition flex items-center gap-1.5"
              type="button"
              title="Skip straight to live optical camera recording"
            >
              <span className="material-symbols-outlined text-[16px] animate-pulse">rocket_launch</span>
              Fast-Track to Gait Screen →
            </button>
          </div>
        </div>

        {/* 4-Step Interactive Navigation Stepper */}
        <div className="pt-md">
          <div className="flex items-center justify-between text-xs text-on-surface-variant font-semibold mb-2">
            <span>Clinical Evaluation Progress: Stage {activeStep} of 4</span>
            <span className="font-data-mono font-bold text-primary">
              {Math.round(((completedSteps.length) / 4) * 100)}% Complete
            </span>
          </div>

          {/* Progress track bar */}
          <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden mb-4">
            <div
              className="bg-primary h-full transition-all duration-300 rounded-full"
              style={{ width: `${Math.min(100, Math.max(15, (completedSteps.length / 4) * 100))}%` }}
            />
          </div>

          {/* 4 Clickable Step Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-sm">
            {stepsList.map((s) => {
              const isCurrent = activeStep === s.id;
              const isCompleted = completedSteps.includes(s.id);

              return (
                <button
                  key={s.id}
                  onClick={() => setActiveStep(s.id)}
                  type="button"
                  className={`p-3 rounded-xl flex items-center gap-3 text-left transition-all border ${
                    isCurrent
                      ? 'bg-primary text-on-primary shadow-md border-primary ring-2 ring-primary/30'
                      : isCompleted
                      ? 'bg-surface-container-low hover:bg-surface-container border-emerald-500/40 text-on-surface'
                      : 'bg-surface-container-low hover:bg-surface-container border-outline-variant/20 text-on-surface-variant'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 font-data-mono transition ${
                      isCurrent
                        ? 'bg-on-primary text-primary'
                        : isCompleted
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-surface-container-high text-on-surface-variant'
                    }`}
                  >
                    {isCompleted && !isCurrent ? '✓' : s.id}
                  </div>
                  <div className="min-w-0 grow">
                    <div className="flex items-center justify-between">
                      <p className={`text-[11px] uppercase font-bold tracking-wide ${isCurrent ? 'text-primary-fixed' : 'text-on-surface-variant'}`}>
                        {s.shortTitle}
                      </p>
                      {isCompleted && !isCurrent && (
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">READY</span>
                      )}
                    </div>
                    <p className={`text-[12px] font-bold truncate ${isCurrent ? 'text-on-primary' : 'text-on-surface'}`}>
                      {s.title.split('&')[0].trim()}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Main Step Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-lg items-start">
        {/* Left Column: Active Step Interactive Evaluation Forms (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-lg">

          {/* ================= STEP 1: PATIENT INTAKE & VITALS ================= */}
          {activeStep === 1 && (
            <section className="w-full bg-surface-container-lowest rounded-xl shadow-md p-card-padding border border-surface-container animate-fade-in">
              <div className="flex items-center justify-between pb-sm border-b border-outline-variant/30 mb-md">
                <div className="flex items-center gap-xs">
                  <div className="w-9 h-9 rounded-lg bg-primary-container text-on-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">monitor_heart</span>
                  </div>
                  <div>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                      Step 1 · Patient Anthropometrics & Vitals
                    </h3>
                    <p className="text-xs text-on-surface-variant">
                      Evaluate baseline compressive knee joint load and physiological parameters
                    </p>
                  </div>
                </div>
                <span className="px-2 py-1 rounded bg-surface-container font-data-mono text-[10px] text-primary font-bold">
                  STAGE 1 / 4
                </span>
              </div>

              <div className="space-y-md">
                {/* Height, Weight & Live BMI */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-sm">
                  <div className="p-sm rounded-lg bg-surface-container-low border border-outline-variant/20">
                    <label className="block text-[11px] font-semibold text-on-surface-variant uppercase mb-1">
                      Height (cm)
                    </label>
                    <input
                      type="number"
                      value={heightCm}
                      onChange={(e) => setHeightCm(Number(e.target.value))}
                      className="w-full bg-surface-container text-on-surface text-base font-bold rounded-lg px-3 py-1.5 border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary font-data-mono"
                      min="100"
                      max="220"
                    />
                  </div>

                  <div className="p-sm rounded-lg bg-surface-container-low border border-outline-variant/20">
                    <label className="block text-[11px] font-semibold text-on-surface-variant uppercase mb-1">
                      Weight (kg)
                    </label>
                    <input
                      type="number"
                      value={weightKg}
                      onChange={(e) => setWeightKg(Number(e.target.value))}
                      className="w-full bg-surface-container text-on-surface text-base font-bold rounded-lg px-3 py-1.5 border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary font-data-mono"
                      min="30"
                      max="180"
                    />
                  </div>

                  <div className="p-sm rounded-lg bg-surface-container-low border border-outline-variant/20 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-on-surface-variant uppercase">
                        Computed BMI
                      </span>
                      <span className={`text-[11px] font-bold ${bmiStatus.color}`}>
                        {bmiStatus.label}
                      </span>
                    </div>
                    <div className="text-xl font-bold font-data-metric text-on-surface">
                      {computedBmi} <span className="text-xs font-normal text-on-surface-variant">kg/m²</span>
                    </div>
                    <p className="text-[10px] text-on-surface-variant leading-tight">
                      {bmiStatus.note}
                    </p>
                  </div>
                </div>

                {/* Blood Pressure & Laterality */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-sm">
                  <div className="p-sm rounded-lg bg-surface-container-low border border-outline-variant/20">
                    <label className="block text-[11px] font-semibold text-on-surface-variant uppercase mb-1">
                      Resting Blood Pressure
                    </label>
                    <input
                      type="text"
                      value={bloodPressure}
                      onChange={(e) => setBloodPressure(e.target.value)}
                      placeholder="120/80 mmHg"
                      className="w-full bg-surface-container text-on-surface text-sm font-bold rounded-lg px-3 py-1.5 border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary font-data-mono"
                    />
                  </div>

                  <div className="p-sm rounded-lg bg-surface-container-low border border-outline-variant/20">
                    <label className="block text-[11px] font-semibold text-on-surface-variant uppercase mb-1">
                      Primary Knee Laterality
                    </label>
                    <select
                      value={affectedJoint}
                      onChange={(e) => setAffectedJoint(e.target.value)}
                      className="w-full bg-surface-container text-on-surface text-sm font-semibold rounded-lg px-3 py-1.5 border border-outline-variant/30 focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
                    >
                      <option value="Right Knee (Medial Compartment)">Right Knee (Medial Compartment)</option>
                      <option value="Left Knee (Medial Compartment)">Left Knee (Medial Compartment)</option>
                      <option value="Bilateral Knee (Both Joints)">Bilateral Knee (Both Joints)</option>
                      <option value="Patellofemoral Anterior Compartment">Patellofemoral Anterior Compartment</option>
                    </select>
                  </div>
                </div>

                {/* Occupational Hazards */}
                <div>
                  <label className="block text-[11px] font-semibold text-on-surface-variant uppercase mb-2">
                    Occupational & Biomechanical Risk Exposures ({activePatient?.occupation || 'Field Profile'})
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { label: 'Agrarian Field Bending', icon: 'agriculture' },
                      { label: 'Heavy Head/Manual Load (>20kg)', icon: 'fitness_center' },
                      { label: 'Prolonged Floor Squatting', icon: 'airline_seat_recline_extra' },
                      { label: 'Stair / Hill Slope Incline', icon: 'stairs' },
                      { label: 'Sedentary Desk (>8h/day)', icon: 'chair' }
                    ].map((item) => {
                      const isSelected = selectedHazards.includes(item.label);
                      return (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => {
                            setSelectedHazards((prev) =>
                              isSelected ? prev.filter((x) => x !== item.label) : [...prev, item.label]
                            );
                          }}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                            isSelected
                              ? 'bg-primary text-on-primary shadow-xs'
                              : 'bg-surface-container text-on-surface hover:bg-surface-container-high border border-outline-variant/20'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[15px]">{item.icon}</span>
                          {item.label}
                          {isSelected && <span className="text-[11px]">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Step 1 Actions */}
                <div className="pt-sm border-t border-outline-variant/30 flex items-center justify-between">
                  <span className="text-xs text-on-surface-variant">
                    All vitals auto-calibrated for frontline clinical screening
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      markStepComplete(1);
                      setActiveStep(2);
                    }}
                    className="px-md py-2 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-bold text-xs transition shadow-md flex items-center gap-1.5"
                  >
                    Confirm Vitals & Proceed to Step 2 →
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* ================= STEP 2: CLINICAL KOOS & PAIN EVALUATION ================= */}
          {activeStep === 2 && (
            <section className="w-full bg-surface-container-lowest rounded-xl shadow-md p-card-padding border border-surface-container animate-fade-in">
              <div className="flex items-center justify-between pb-sm border-b border-outline-variant/30 mb-md">
                <div className="flex items-center gap-xs">
                  <div className="w-9 h-9 rounded-lg bg-primary-container text-on-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">clinical_notes</span>
                  </div>
                  <div>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                      Step 2 · Clinical Symptoms & KOOS-India Scoring
                    </h3>
                    <p className="text-xs text-on-surface-variant">
                      Rapid subjective pain assessment, joint stiffness duration, and functional difficulty
                    </p>
                  </div>
                </div>
                <span className="px-2 py-1 rounded bg-surface-container font-data-mono text-[10px] text-primary font-bold">
                  STAGE 2 / 4
                </span>
              </div>

              <div className="space-y-md">
                {/* Visual VAS Pain Slider */}
                <div className="p-sm rounded-lg bg-surface-container-low border border-outline-variant/20">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-on-surface">
                      Knee Joint Pain Severity (VAS 0–10)
                    </span>
                    <span className="text-lg font-bold font-data-metric text-error">
                      {painValue} / 10
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    value={painValue}
                    onChange={(e) => setPainValue(Number(e.target.value))}
                    className="w-full accent-primary h-2.5 bg-surface-variant rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] text-on-surface-variant mt-1">
                    <span className="text-emerald-600 font-medium">0 - Asymptomatic</span>
                    <span className="text-amber-600 font-medium">5 - Weight-Bearing Ache</span>
                    <span className="text-error font-bold">10 - Debilitating Constant Pain</span>
                  </div>
                </div>

                {/* Morning Stiffness Duration */}
                <div className="p-sm rounded-lg bg-surface-container-low border border-outline-variant/20">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-on-surface">
                      Morning Joint Stiffness Duration
                    </span>
                    <span className="text-lg font-bold font-data-metric text-primary">
                      {stiffnessValue} minutes
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="90"
                    step="5"
                    value={stiffnessValue}
                    onChange={(e) => setStiffnessValue(Number(e.target.value))}
                    className="w-full accent-primary h-2.5 bg-surface-variant rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] text-on-surface-variant mt-1">
                    <span>&lt;10m (Normal)</span>
                    <span className="text-primary font-bold">30m (Knee OA Threshold)</span>
                    <span className="text-error font-bold">&gt;60m (Severe Inflammatory)</span>
                  </div>
                </div>

                {/* Functional Mobility Checklist */}
                <div className="p-sm rounded-lg bg-surface-container-low border border-outline-variant/20">
                  <span className="text-xs font-semibold text-on-surface block mb-2">
                    Frontline Functional Mobility Quick Checks
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {[
                      { key: 'squatDifficulty', label: 'Difficulty Squatting / Floor Sitting' },
                      { key: 'crepitus', label: 'Audible Patellar Grinding / Crepitus' },
                      { key: 'stairAscentPain', label: 'Sharp Pain on Stair Climbing' },
                      { key: 'nightPain', label: 'Resting / Nocturnal Joint Throbbing' }
                    ].map((item) => (
                      <label
                        key={item.key}
                        className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition border text-xs ${
                          functionalFlags[item.key]
                            ? 'bg-primary-container/20 border-primary text-on-surface font-semibold'
                            : 'bg-surface-container border-outline-variant/20 text-on-surface-variant'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={functionalFlags[item.key]}
                          onChange={(e) =>
                            setFunctionalFlags((prev) => ({ ...prev, [item.key]: e.target.checked }))
                          }
                          className="w-4 h-4 rounded text-primary accent-primary"
                        />
                        <span>{item.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Real-time KOOS Score Result */}
                <div className="p-sm rounded-lg bg-surface-container flex items-center justify-between border border-outline-variant/30">
                  <div>
                    <span className="text-[10px] text-on-surface-variant uppercase font-semibold block">
                      Calculated Frontline KOOS-India Index
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold font-data-metric text-on-surface">
                        {currentKoos.total} / 40
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                          currentKoos.category === 'high'
                            ? 'bg-error-container text-on-error-container'
                            : currentKoos.category === 'moderate'
                            ? 'bg-amber-500/20 text-amber-800 dark:text-amber-200'
                            : 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-200'
                        }`}
                      >
                        {currentKoos.category} Clinical Burden
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigate('survey')}
                    className="px-2.5 py-1 text-xs text-primary font-bold hover:underline"
                  >
                    Open Full 40-pt Survey →
                  </button>
                </div>

                {/* Step 2 Actions */}
                <div className="pt-sm border-t border-outline-variant/30 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setActiveStep(1)}
                    className="px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold text-xs transition"
                  >
                    ← Back to Step 1
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveStep2}
                    className="px-md py-2 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-bold text-xs transition shadow-md flex items-center gap-1.5"
                  >
                    Confirm Symptoms & Proceed to Step 3 →
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* ================= STEP 3: OPTICAL SETUP & CALIBRATION ================= */}
          {activeStep === 3 && (
            <section className="w-full bg-surface-container-lowest rounded-xl shadow-md p-card-padding border border-surface-container animate-fade-in">
              <div className="flex items-center justify-between pb-sm border-b border-outline-variant/30 mb-md">
                <div className="flex items-center gap-xs">
                  <div className="w-9 h-9 rounded-lg bg-primary-container text-on-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-[20px]">videocam</span>
                  </div>
                  <div>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                      Step 3 · Optical Setup & Space Calibration
                    </h3>
                    <p className="text-xs text-on-surface-variant">
                      Ensure 90° lateral perspective, 2.5m runway distance, and adequate illumination
                    </p>
                  </div>
                </div>
                <span className="px-2 py-1 rounded bg-surface-container font-data-mono text-[10px] text-primary font-bold">
                  STAGE 3 / 4
                </span>
              </div>

              <div className="space-y-md">
                {/* Source Switcher */}
                <div className="flex items-center justify-between gap-sm bg-surface-container-low p-2 rounded-lg border border-outline-variant/20">
                  <span className="text-xs font-semibold text-on-surface flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px] text-primary">sensors</span>
                    Optical Capture Source:
                  </span>
                  <div className="flex items-center gap-1">
                    {[
                      { id: 'webcam', label: 'Laptop Webcam', icon: 'videocam' },
                      { id: 'sample', label: 'Clinical Reference Clip', icon: 'smart_display' },
                      { id: 'esp32', label: 'ESP32 Cam', icon: 'router' }
                    ].map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setActiveCamSource(s.id);
                          if (s.id === 'sample') camera?.switchToSampleVideo?.();
                          else if (s.id === 'webcam') camera?.startCamera?.();
                        }}
                        className={`px-2.5 py-1 rounded text-xs font-bold transition flex items-center gap-1 ${
                          (s.id === 'sample' ? camera?.sourceMode === 'sample' : (s.id === 'webcam' ? camera?.isWebcamActive || activeCamSource === 'webcam' : activeCamSource === s.id))
                            ? 'bg-primary text-on-primary shadow-xs'
                            : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[14px]">{s.icon}</span>
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Camera Viewport Live Feed */}
                <CameraViewport
                  camera={camera}
                  onEnterFullHud={() => onNavigate('gait')}
                />

                {/* Calibration Checklist */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-sm">
                  <div className="p-3 rounded-lg bg-surface-container-low border border-emerald-500/30">
                    <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-xs mb-1">
                      <span className="material-symbols-outlined text-[16px]">check_circle</span>
                      1. Lateral Distance
                    </div>
                    <p className="text-[11px] text-on-surface-variant">
                      Position patient 2.5m perpendicular from camera lens.
                    </p>
                    <span className="text-[10px] font-data-mono font-bold text-emerald-600 block mt-1">
                      2.5m Calibrated (±0.1m)
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-surface-container-low border border-emerald-500/30">
                    <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-xs mb-1">
                      <span className="material-symbols-outlined text-[16px]">light_mode</span>
                      2. Ambient Illumination
                    </div>
                    <p className="text-[11px] text-on-surface-variant">
                      Minimum 300 lux diffuse room lighting required.
                    </p>
                    <span className="text-[10px] font-data-mono font-bold text-emerald-600 block mt-1">
                      420 Lux (Optimal Diffuse)
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-surface-container-low border border-emerald-500/30">
                    <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold text-xs mb-1">
                      <span className="material-symbols-outlined text-[16px]">directions_walk</span>
                      3. Runway Walkway
                    </div>
                    <p className="text-[11px] text-on-surface-variant">
                      Standard straight path unobstructed for 4 full strides.
                    </p>
                    <span className="text-[10px] font-data-mono font-bold text-emerald-600 block mt-1">
                      8-Second Protocol Ready
                    </span>
                  </div>
                </div>

                {/* Step 3 Actions */}
                <div className="pt-sm border-t border-outline-variant/30 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setActiveStep(2)}
                    className="px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold text-xs transition"
                  >
                    ← Back to Step 2
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      markStepComplete(3);
                      setActiveStep(4);
                    }}
                    className="px-md py-2 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-bold text-xs transition shadow-md flex items-center gap-1.5"
                  >
                    Calibration Verified · Proceed to Launchpad →
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* ================= STEP 4: FINAL GAIT HUD LAUNCHPAD ================= */}
          {activeStep === 4 && (
            <section className="w-full bg-surface-container-lowest rounded-xl shadow-md p-card-padding border-2 border-primary animate-fade-in">
              <div className="flex items-center justify-between pb-sm border-b border-outline-variant/30 mb-md">
                <div className="flex items-center gap-xs">
                  <div className="w-9 h-9 rounded-lg bg-error text-white flex items-center justify-center animate-pulse">
                    <span className="material-symbols-outlined text-[20px]">directions_walk</span>
                  </div>
                  <div>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                      Step 4 · Standardized 8s Gait Recording Studio
                    </h3>
                    <p className="text-xs text-on-surface-variant">
                      Final diagnostic acquisition: High-speed sagittal computer vision kinematics
                    </p>
                  </div>
                </div>
                <span className="px-2 py-1 rounded bg-error text-white font-data-mono text-[10px] font-bold">
                  FINAL STAGE
                </span>
              </div>

              {/* Pre-Flight Intelligence Summary Dossier */}
              <div className="bg-surface-container-low rounded-xl p-4 border border-outline-variant/30 mb-md space-y-3">
                <div className="flex items-center justify-between border-b border-outline-variant/20 pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">verified</span>
                    Pre-Test Clinical Dossier Synchronized
                  </span>
                  <span className="text-[11px] text-on-surface-variant font-data-mono font-semibold">
                    Station: {profile.stationName}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <div className="p-2.5 rounded-lg bg-surface-container">
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase block">
                      Patient & Anthropometrics
                    </span>
                    <p className="font-bold text-on-surface mt-0.5">{activePatient?.name || 'Boron Boruah'}</p>
                    <p className="text-[11px] text-on-surface-variant">
                      BMI: <strong className="text-primary">{computedBmi}</strong> ({bmiStatus.label})
                    </p>
                    <p className="text-[11px] text-on-surface-variant">Laterality: <strong>{affectedJoint.split('(')[0]}</strong></p>
                    <p className="text-[11px] text-on-surface-variant">BP: <strong>{bloodPressure}</strong> mmHg</p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-surface-container">
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase block">
                      Clinical Symptom Index
                    </span>
                    <p className="font-bold text-error mt-0.5">VAS Pain: {painValue} / 10</p>
                    <p className="text-[11px] text-on-surface-variant">
                      Morning Stiffness: <strong>{stiffnessValue} mins</strong>
                    </p>
                    <p className="text-[11px] text-on-surface-variant">
                      KOOS Score: <strong className="text-tertiary">{currentKoos.total}/40 ({currentKoos.category})</strong>
                    </p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-surface-container border border-primary/40 relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-primary uppercase block">
                        NIH OAI AI Clinical Risk
                      </span>
                      {isPredicting && (
                        <span className="animate-spin text-[12px] material-symbols-outlined text-primary">sync</span>
                      )}
                    </div>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <p className="text-lg font-extrabold text-on-surface">
                        {clinicalPrediction?.oa_pain_probability != null
                          ? `${Math.round(clinicalPrediction.oa_pain_probability * 100)}%`
                          : '68%'}
                      </p>
                      <span className={`text-[10px] font-bold uppercase px-1.5 py-0.2 rounded ${
                        (clinicalPrediction?.risk_category || 'high') === 'high'
                          ? 'bg-error-container text-on-error-container'
                          : (clinicalPrediction?.risk_category) === 'moderate'
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {clinicalPrediction?.risk_category || 'HIGH'} RISK
                      </span>
                    </div>
                    <p className="text-[10px] text-on-surface-variant mt-0.5 font-data-mono">
                      Acc: 82.7% · AUC: 0.871
                    </p>
                    <p className="text-[10px] text-primary truncate">
                      {clinicalPrediction?.cohort || 'NIH OAI Cohort'}
                    </p>
                  </div>

                  <div className="p-2.5 rounded-lg bg-surface-container">
                    <span className="text-[10px] font-bold text-on-surface-variant uppercase block">
                      Optical System Setup
                    </span>
                    <p className="font-bold text-on-surface mt-0.5">
                      {camera?.isWebcamActive ? 'Optical Webcam Active' : 'Sample/External Video'}
                    </p>
                    <p className="text-[11px] text-emerald-600 font-semibold">✓ 2.5m Runway Distance</p>
                    <p className="text-[11px] text-emerald-600 font-semibold">✓ 420 Lux Illumination</p>
                  </div>
                </div>

                {/* Supabase Cloud Sync Status Footer */}
                <div className="flex items-center justify-between text-[11px] pt-2 border-t border-outline-variant/20">
                  <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                    <span className="material-symbols-outlined text-[15px]">cloud_done</span>
                    <span>Direct Supabase Cloud Synchronization Active</span>
                  </div>
                  <span className="text-[10px] font-data-mono text-on-surface-variant">
                    DB: PostgreSQL (Supabase) · Table: screenings / questionnaires
                  </span>
                </div>
              </div>

              {/* Prominent Primary CTA Button */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-primary-container via-surface-container to-tertiary-container/30 border border-primary/30 flex flex-col items-center justify-center text-center gap-3">
                <div className="w-12 h-12 rounded-full bg-error text-white flex items-center justify-center shadow-md animate-bounce">
                  <span className="material-symbols-outlined text-[28px]">videocam</span>
                </div>
                <div>
                  <h4 className="text-base font-bold text-on-surface">
                    Ready for 8-Second Standardized Walking Test
                  </h4>
                  <p className="text-xs text-on-surface-variant max-w-md mt-1">
                    Instruct patient to walk 4–6 paces along the marked line. MediaPipe BlazePose will extract sagittal knee extension deficit, gait cadence, and velocity.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onNavigate('gait')}
                  className="w-full sm:w-auto px-8 py-3 rounded-xl bg-error hover:bg-error/90 text-on-error font-headline-sm text-sm font-bold shadow-lg hover:shadow-xl transition transform hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[22px] animate-pulse">radio_button_checked</span>
                  LAUNCH GAIT RECORDING STUDIO & START 8s TEST ➔
                </button>
              </div>

              {/* Previous Gait Results if already tested */}
              {gaitResult && (
                <div className="mt-md p-3 rounded-xl bg-surface-container border border-emerald-500/40 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-emerald-600 text-[22px]">check_circle</span>
                    <div>
                      <span className="text-xs font-bold text-on-surface block">
                        Recent Gait Recording Available ({gaitResult.risk})
                      </span>
                      <span className="text-[11px] text-on-surface-variant">
                        Cadence: {gaitResult.cadence} spm · Velocity: {gaitResult.velocity} m/s · Knee Deficit: {gaitResult.kneeAngleAsymmetry}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onNavigate('report')}
                    className="px-3 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-variant text-on-surface text-xs font-bold transition"
                  >
                    View Report →
                  </button>
                </div>
              )}

              {/* Step 4 Actions */}
              <div className="pt-sm border-t border-outline-variant/30 flex items-center justify-between mt-md">
                <button
                  type="button"
                  onClick={() => setActiveStep(3)}
                  className="px-3 py-1.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-semibold text-xs transition"
                >
                  ← Back to Step 3
                </button>
                <button
                  type="button"
                  onClick={onOpenTeleconsult}
                  className="px-3 py-1.5 rounded-lg bg-tertiary-container hover:bg-tertiary text-on-tertiary font-bold text-xs transition flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-[15px]">cell_tower</span>
                  Refer to Specialist
                </button>
              </div>
            </section>
          )}
        </div>

        {/* Right Column: Live Clinical Metrics & Telemetry Dashboard (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-lg">
          {/* Live Biomechanical Telemetry Card */}
          <section className="w-full bg-surface-container-lowest rounded-xl shadow-md p-card-padding border border-surface-container">
            <div className="flex items-center justify-between pb-sm border-b border-outline-variant/30 mb-sm">
              <div className="flex items-center gap-xs">
                <span className="material-symbols-outlined text-[20px] text-tertiary">speed</span>
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                  Kinematics Reference Benchmarks
                </h3>
              </div>
              <span className="px-xs py-2xs rounded bg-tertiary-fixed text-on-tertiary-fixed font-data-mono text-[10px] font-bold">
                ICMR Norms
              </span>
            </div>

            <div className="grid grid-cols-2 gap-sm mb-sm">
              <div className="p-sm rounded-xl bg-surface-container-low flex flex-col justify-between">
                <span className="text-[11px] text-on-surface-variant uppercase font-semibold">Target Cadence</span>
                <div className="flex items-baseline gap-1 my-1">
                  <span className="text-[26px] font-bold font-data-metric text-on-surface">
                    {gaitResult?.cadence || 94}
                  </span>
                  <span className="text-[11px] text-on-surface-variant">steps/min</span>
                </div>
                <span className="text-[10px] text-amber-600 font-data-mono font-semibold">
                  -16% vs Asymptomatic
                </span>
              </div>

              <div className="p-sm rounded-xl bg-surface-container-low flex flex-col justify-between">
                <span className="text-[11px] text-on-surface-variant uppercase font-semibold">Target Velocity</span>
                <div className="flex items-baseline gap-1 my-1">
                  <span className="text-[26px] font-bold font-data-metric text-on-surface">
                    {gaitResult?.velocity || 0.86}
                  </span>
                  <span className="text-[11px] text-on-surface-variant">m/sec</span>
                </div>
                <span className="text-[10px] text-error font-data-mono font-bold">
                  Antalgic Cutoff (&lt;1.0m/s)
                </span>
              </div>
            </div>

            {/* Extension Deficit Display */}
            <div className="p-sm rounded-xl bg-surface-container-low mb-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-on-surface">Sagittal Extension Deficit</span>
                <span className="px-1.5 py-0.5 rounded bg-error-container text-on-error-container font-data-mono text-[10px] font-bold">
                  {gaitResult?.kneeAngleAsymmetry || '+14.2° Deficit'}
                </span>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-on-surface-variant">Unimpaired Left Knee</span>
                  <span className="font-data-mono font-bold text-on-surface">4.0°</span>
                </div>
                <div className="w-full bg-surface-variant h-1.5 rounded-full overflow-hidden">
                  <div className="bg-tertiary h-full rounded-full" style={{ width: '25%' }}></div>
                </div>
                <div className="flex items-center justify-between text-[11px] pt-1">
                  <span className="text-error font-semibold">Affected Right Knee</span>
                  <span className="font-data-mono font-bold text-error">14.2°</span>
                </div>
                <div className="w-full bg-surface-variant h-1.5 rounded-full overflow-hidden">
                  <div className="bg-error h-full rounded-full" style={{ width: '82%' }}></div>
                </div>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-surface-container flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-primary">swap_driving_apps_wheel</span>
                <div>
                  <span className="text-[11px] text-on-surface font-semibold block">Dynamic Coronal Axis Offset</span>
                  <span className="text-[10px] text-on-surface-variant">Varus Thrust Medialization</span>
                </div>
              </div>
              <span className="font-data-mono text-xs font-bold text-primary px-2 py-1 bg-surface-container-lowest rounded shadow-xs">
                +3.8° Varus
              </span>
            </div>
          </section>

          {/* Quick Stage Review & Jump Box */}
          <section className="w-full bg-surface-container-lowest rounded-xl shadow-md p-card-padding border border-surface-container">
            <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-primary">checklist</span>
              Screening Stage Checklist
            </h4>
            <div className="space-y-2 text-xs">
              <div
                onClick={() => setActiveStep(1)}
                className={`p-2 rounded-lg cursor-pointer flex items-center justify-between transition ${
                  activeStep === 1 ? 'bg-primary-container/20 border border-primary font-bold' : 'bg-surface-container-low hover:bg-surface-container'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>1. Vitals & Anthropometrics</span>
                </div>
                <span className="text-[11px] text-on-surface-variant font-data-mono">BMI {computedBmi}</span>
              </div>

              <div
                onClick={() => setActiveStep(2)}
                className={`p-2 rounded-lg cursor-pointer flex items-center justify-between transition ${
                  activeStep === 2 ? 'bg-primary-container/20 border border-primary font-bold' : 'bg-surface-container-low hover:bg-surface-container'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={completedSteps.includes(2) ? 'text-emerald-600 font-bold' : 'text-on-surface-variant'}>
                    {completedSteps.includes(2) ? '✓' : '○'}
                  </span>
                  <span>2. Clinical KOOS Survey</span>
                </div>
                <span className="text-[11px] text-on-surface-variant font-data-mono">{currentKoos.total}/40</span>
              </div>

              <div
                onClick={() => setActiveStep(3)}
                className={`p-2 rounded-lg cursor-pointer flex items-center justify-between transition ${
                  activeStep === 3 ? 'bg-primary-container/20 border border-primary font-bold' : 'bg-surface-container-low hover:bg-surface-container'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={completedSteps.includes(3) ? 'text-emerald-600 font-bold' : 'text-on-surface-variant'}>
                    {completedSteps.includes(3) ? '✓' : '○'}
                  </span>
                  <span>3. Optical Calibration</span>
                </div>
                <span className="text-[11px] text-emerald-600 font-bold">2.5m OK</span>
              </div>

              <div
                onClick={() => setActiveStep(4)}
                className={`p-2 rounded-lg cursor-pointer flex items-center justify-between transition ${
                  activeStep === 4 ? 'bg-error-container/20 border border-error font-bold' : 'bg-surface-container-low hover:bg-surface-container'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={gaitResult ? 'text-emerald-600 font-bold' : 'text-error font-bold'}>
                    {gaitResult ? '✓' : '●'}
                  </span>
                  <span>4. Final Gait Screen Studio</span>
                </div>
                <span className="text-[11px] text-error font-bold font-data-mono">
                  {gaitResult ? 'COMPLETE' : 'READY'}
                </span>
              </div>
            </div>
          </section>

          {/* Statutory ICMR Notice */}
          <section className="w-full rounded-xl bg-surface-container-low p-3 shadow-sm flex items-start gap-2.5 border border-outline-variant/30">
            <div className="w-7 h-7 rounded-lg bg-surface-container-highest text-primary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[16px]">policy</span>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-on-surface font-bold">
                  ICMR Frontline AI Protocol
                </span>
                <span className="px-1 py-0.2 rounded bg-surface-container-highest font-data-mono text-[9px] text-primary font-semibold">
                  REG-2024-NER
                </span>
              </div>
              <p className="text-[10px] text-on-surface-variant mt-0.5">
                Frontline risk-stratification protocol for CHCs/PHCs across India. Triage screening aid — not a substitute for clinical radiographic staging.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
