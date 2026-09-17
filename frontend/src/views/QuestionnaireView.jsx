import React, { useState } from 'react';
import { translations } from '../utils/i18n';
import { evaluateQuestionnaire } from '../utils/api';

export default function QuestionnaireView({ activePatient, onSurveySubmitted, onOpenTeleconsult }) {
  const [lang, setLang] = useState('en');
  const t = translations[lang] || translations.en;

  // Form State
  const [pain, setPain] = useState(7);
  const [painPeak, setPainPeak] = useState('walking');
  const [stiffness, setStiffness] = useState(35);
  const [workloadMatrix, setWorkloadMatrix] = useState({
    teaPlucking: true,
    heavyLoads: true,
    deepSquatting: true,
    slopeWalking: false,
    coldDamp: true
  });
  const [walkDiff, setWalkDiff] = useState(2); // 0 none, 1 mild, 2 mod, 3 severe
  const [stairsDiff, setStairsDiff] = useState(2);
  const [squatDiff, setSquatDiff] = useState(3);
  const [priorInjury, setPriorInjury] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [surveyOutcome, setSurveyOutcome] = useState(null);
  const [submissionError, setSubmissionError] = useState('');

  const getPainChipText = (val) => {
    if (val === 0) return '0/10 - Asymptomatic';
    if (val <= 3) return `${val}/10 - Mild aching, tolerable with rest`;
    if (val <= 6) return `${val}/10 - Moderate aching, interferes with field work`;
    if (val <= 8) return `${val}/10 - Frequent sharp aching, worse on weight bearing`;
    return `${val}/10 - Severe incapacitating pain, unable to walk`;
  };

  // Calculate live preview score aligning strictly with backend _questionnaire_result
  const calculateCompositeScore = () => {
    let score = pain * 1.5;

    // Age factor
    const age = activePatient?.age || 52;
    if (age >= 65) score += 3.0;
    else if (age >= 55) score += 2.0;
    else if (age >= 45) score += 1.0;

    // Morning stiffness
    if (stiffness >= 30) score += 2.0;
    else if (stiffness >= 15) score += 1.0;
    score += Math.min(10.0, stiffness / 5.0);

    // Functional difficulties
    score += 2.0 * (walkDiff + stairsDiff + squatDiff);

    // Previous knee injury
    if (priorInjury) score += 4.0;

    // Persistent symptoms
    score += 2.0; // Standard baseline 14 weeks

    // Occupational tea plantation and terrain loading
    if (workloadMatrix.teaPlucking) score += 4.0;
    if (workloadMatrix.heavyLoads) score += 3.0;
    if (workloadMatrix.deepSquatting) score += 3.0;
    if (workloadMatrix.slopeWalking) score += 2.0;

    return Math.min(40, Math.round(score));
  };

  const compositeScore = calculateCompositeScore();
  const riskTier = compositeScore >= 25 ? 'High Risk' : compositeScore > 20 ? 'Moderate Risk' : 'Low Risk';

  const handleSubmit = async () => {
    setIsSaving(true);
    setSubmissionError('');
    const payload = {
      patient_id: activePatient?.dbId || null,
      age: activePatient?.age || 52,
      pain,
      stiffness,
      walking_difficulty: walkDiff,
      stairs_difficulty: stairsDiff,
      previous_knee_injury: priorInjury,
      tea_plucking: workloadMatrix.teaPlucking,
      symptom_duration_weeks: 14,
      workload: workloadMatrix.teaPlucking ? 'high' : 'low',
      heavy_loads: workloadMatrix.heavyLoads,
      deep_squatting: workloadMatrix.deepSquatting,
      slope_walking: workloadMatrix.slopeWalking,
      cold_damp: workloadMatrix.coldDamp,
      squat_difficulty: squatDiff
    };
    try {
      const res = await evaluateQuestionnaire(payload);
      const enrichedRes = { ...res, pain, stiffness, compositeScore };
      setSurveyOutcome(enrichedRes);
      if (onSurveySubmitted) onSurveySubmitted(enrichedRes);
    } catch (error) {
      setSubmissionError(error.message || 'Questionnaire could not be saved.');
    } finally {
      setIsSaving(false);
    }
  };

  const applySurveyPreset = (presetType) => {
    if (presetType === 'severe') {
      setPain(8);
      setPainPeak('walking');
      setStiffness(45);
      setWorkloadMatrix({ teaPlucking: true, heavyLoads: true, deepSquatting: true, slopeWalking: true, coldDamp: true });
      setWalkDiff(3);
      setStairsDiff(3);
      setSquatDiff(3);
      setPriorInjury(true);
    } else if (presetType === 'moderate') {
      setPain(5);
      setPainPeak('standing');
      setStiffness(25);
      setWorkloadMatrix({ teaPlucking: true, heavyLoads: false, deepSquatting: true, slopeWalking: false, coldDamp: true });
      setWalkDiff(2);
      setStairsDiff(2);
      setSquatDiff(2);
      setPriorInjury(false);
    } else {
      setPain(1);
      setPainPeak('morning');
      setStiffness(5);
      setWorkloadMatrix({ teaPlucking: false, heavyLoads: false, deepSquatting: false, slopeWalking: false, coldDamp: false });
      setWalkDiff(0);
      setStairsDiff(0);
      setSquatDiff(0);
      setPriorInjury(false);
    }
  };

  return (
    <div className="flex flex-col w-full gap-lg animate-fade-in">
      {/* Header Banner with Language Switcher */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-lg bg-surface-container-lowest p-card-padding rounded-xl shadow-sm border border-surface-container">
        <div className="flex flex-col gap-xs max-w-4xl">
          <div className="flex flex-wrap items-center gap-xs">
            <span className="px-xs py-2xs rounded bg-tertiary text-on-tertiary font-data-mono text-[11px] uppercase font-semibold">
              Validated Tool
            </span>
            <span className="px-xs py-2xs rounded bg-surface-container-high text-on-surface-variant font-data-mono text-[11px]">
              KOOS-NER Form v2.1
            </span>
            <span className="text-secondary font-label-sm text-[11px]">
              · Revised for Rural Assam Hill & Valley Cohorts
            </span>
          </div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface font-bold tracking-tight">
            {t.title}
          </h1>
          <p className="font-body-md text-body-md text-secondary">
            {t.subtitle}
          </p>

          {/* Quick Survey Presets */}
          <div className="flex items-center gap-2 pt-1 flex-wrap">
            <span className="font-label-sm text-[10px] text-secondary uppercase font-bold tracking-wider">
              1-Click Fast Presets:
            </span>
            <button
              type="button"
              onClick={() => applySurveyPreset('severe')}
              className="px-2 py-0.5 rounded-md bg-error/10 hover:bg-error/20 text-error text-[11px] font-semibold border border-error/30 transition active:scale-95 flex items-center gap-1"
            >
              <span>🚨 Severe OA (Tea Worker)</span>
            </button>
            <button
              type="button"
              onClick={() => applySurveyPreset('moderate')}
              className="px-2 py-0.5 rounded-md bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[11px] font-semibold border border-amber-500/30 transition active:scale-95 flex items-center gap-1"
            >
              <span>⚠️ Moderate Early OA</span>
            </button>
            <button
              type="button"
              onClick={() => applySurveyPreset('mild')}
              className="px-2 py-0.5 rounded-md bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold border border-emerald-500/30 transition active:scale-95 flex items-center gap-1"
            >
              <span>✅ Healthy / Mild Control</span>
            </button>
          </div>
        </div>

        {/* Language Picker */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-md shrink-0">
          <div className="flex flex-col gap-1">
            <span className="font-label-sm text-[11px] text-secondary uppercase font-semibold">
              Interview Language
            </span>
            <div className="inline-flex rounded-lg p-1 bg-surface-container gap-1 border border-outline-variant/30">
              {[
                { id: 'en', label: 'English' },
                { id: 'as', label: 'অসমীয়া' },
                { id: 'bn', label: 'বাংলা' },
                { id: 'hi', label: 'हिन्दी' }
              ].map((l) => (
                <button
                  key={l.id}
                  onClick={() => setLang(l.id)}
                  className={`px-sm py-1 rounded text-xs font-semibold transition ${
                    lang === l.id
                      ? 'bg-surface-container-lowest text-primary shadow-xs font-bold'
                      : 'text-secondary hover:text-on-surface'
                  }`}
                  type="button"
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          <div className="hidden sm:flex flex-col text-right pl-md border-l border-surface-container">
            <span className="font-label-sm text-[11px] text-secondary">Target Articulation</span>
            <span className="font-headline-sm text-primary font-bold">Left Knee Medial</span>
            <span className="font-data-mono text-[10px] text-secondary">Primary Complaint</span>
          </div>
        </div>
      </div>

      {/* Two-Column Form Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-lg items-start">
        {/* Left Column: Form Controls (8 Cols) */}
        <div className="xl:col-span-8 flex flex-col gap-lg">
          {/* Section A: Pain & Stiffness VAS */}
          <div className="bg-surface-container-lowest p-card-padding rounded-xl shadow-sm border border-surface-container flex flex-col gap-md">
            <div className="flex items-center justify-between pb-xs border-b border-surface-container">
              <div className="flex items-center gap-xs">
                <span className="w-7 h-7 rounded-full bg-primary-fixed text-primary flex items-center justify-center font-bold text-label-md">
                  A
                </span>
                <div>
                  <h2 className="font-headline-md text-headline-md text-on-surface font-bold">
                    {t.secA}
                  </h2>
                  <p className="font-body-sm text-body-sm text-secondary">
                    {t.secADesc}
                  </p>
                </div>
              </div>
              <span className="font-data-mono text-data-mono text-secondary">Weight: 40% composite</span>
            </div>

            {/* Pain Slider */}
            <div className="flex flex-col gap-sm bg-surface-container-low p-card-padding rounded-lg">
              <div className="flex flex-wrap items-center justify-between gap-xs">
                <label className="font-label-lg text-label-lg text-on-surface font-semibold" htmlFor="pain-slider">
                  {t.painLabel}
                </label>
                <div className="inline-flex items-center gap-1.5 px-sm py-1 rounded-full bg-error-container text-on-error-container font-label-md text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-error"></span>
                  <span>{getPainChipText(pain)}</span>
                </div>
              </div>
              <input
                id="pain-slider"
                type="range"
                min="0"
                max="10"
                value={pain}
                onChange={(e) => setPain(Number(e.target.value))}
                className="w-full h-2 bg-outline-variant rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-secondary font-data-mono text-[11px] px-1">
                <span>0 (Asymptomatic)</span>
                <span>2 (Mild)</span>
                <span>5 (Moderate)</span>
                <span className="text-error font-bold">{pain} (Current)</span>
                <span>10 (Debilitating)</span>
              </div>

              {/* Peak Triggers */}
              <div className="flex flex-col gap-xs pt-xs border-t border-outline-variant/20 mt-xs">
                <span className="font-label-sm text-[11px] text-secondary uppercase font-semibold">
                  {t.peakLabel}
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-xs">
                  {[
                    { id: 'rest', label: t.rest },
                    { id: 'walking', label: t.walking },
                    { id: 'squatting', label: t.squatting },
                    { id: 'stairs', label: t.stairs }
                  ].map((btn) => (
                    <button
                      key={btn.id}
                      type="button"
                      onClick={() => setPainPeak(btn.id)}
                      className={`px-sm py-2 rounded text-xs text-center transition font-medium border ${
                        painPeak === btn.id
                          ? 'bg-primary text-on-primary border-primary shadow-xs font-bold'
                          : 'bg-surface-container-lowest text-on-surface border-outline-variant/30 hover:bg-surface-container'
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Stiffness Slider */}
            <div className="flex flex-col gap-sm bg-surface-container-low p-card-padding rounded-lg">
              <div className="flex flex-wrap items-center justify-between gap-xs">
                <label className="font-label-lg text-label-lg text-on-surface font-semibold" htmlFor="stiff-slider">
                  {t.stiffnessLabel}
                </label>
                <span className="font-data-metric text-[16px] text-primary font-bold">
                  {stiffness} minutes
                </span>
              </div>
              <input
                id="stiff-slider"
                type="range"
                min="0"
                max="90"
                step="5"
                value={stiffness}
                onChange={(e) => setStiffness(Number(e.target.value))}
                className="w-full h-2 bg-outline-variant rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-secondary font-data-mono text-[11px] px-1">
                <span>&lt; 10m (Physiologic)</span>
                <span className="text-primary font-bold">30m (OA Benchmark Cutoff)</span>
                <span>&gt; 60m (Severe Inflammatory)</span>
              </div>
            </div>
          </div>

          {/* Section B: Regional Agro-Workload Matrix */}
          <div className="bg-surface-container-lowest p-card-padding rounded-xl shadow-sm border border-surface-container flex flex-col gap-md">
            <div className="flex items-center justify-between pb-xs border-b border-surface-container">
              <div className="flex items-center gap-xs">
                <span className="w-7 h-7 rounded-full bg-tertiary-fixed text-tertiary flex items-center justify-center font-bold text-label-md">
                  B
                </span>
                <div>
                  <h2 className="font-headline-md text-headline-md text-on-surface font-bold">
                    {t.secB}
                  </h2>
                  <p className="font-body-sm text-body-sm text-secondary">
                    {t.secBDesc}
                  </p>
                </div>
              </div>
              <span className="font-data-mono text-data-mono text-secondary">Weight: 35% composite</span>
            </div>

            <div className="space-y-xs">
              {[
                { key: 'teaPlucking', label: t.teaPlucking, note: 'Repetitive knee micro-trauma' },
                { key: 'heavyLoads', label: t.heavyLoads, note: 'Axial tibiofemoral joint overload' },
                { key: 'deepSquatting', label: t.deepSquatting, note: 'Extreme patellofemoral compressive force' },
                { key: 'slopeWalking', label: t.slopeWalking, note: 'Eccentric quadriceps joint shear' },
                { key: 'coldDamp', label: t.coldDamp, note: 'Synovial fluid viscosity exacerbation' }
              ].map((item) => (
                <label
                  key={item.key}
                  className={`p-sm rounded-lg flex items-center justify-between cursor-pointer transition border ${
                    workloadMatrix[item.key]
                      ? 'bg-primary-fixed/20 border-primary/40'
                      : 'bg-surface-container-low border-outline-variant/20 hover:bg-surface-container'
                  }`}
                >
                  <div className="flex items-center gap-sm">
                    <input
                      type="checkbox"
                      checked={workloadMatrix[item.key]}
                      onChange={(e) => setWorkloadMatrix({ ...workloadMatrix, [item.key]: e.target.checked })}
                      className="w-4 h-4 accent-primary"
                    />
                    <div>
                      <span className="font-label-md text-on-surface font-semibold block">
                        {item.label}
                      </span>
                      <span className="font-body-sm text-[11px] text-secondary">
                        {item.note}
                      </span>
                    </div>
                  </div>
                  <span className={`font-data-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                    workloadMatrix[item.key] ? 'bg-error-container text-on-error-container' : 'bg-surface-container text-secondary'
                  }`}>
                    {workloadMatrix[item.key] ? 'EXPOSED' : 'NONE'}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Section C: Functional Interference */}
          <div className="bg-surface-container-lowest p-card-padding rounded-xl shadow-sm border border-surface-container flex flex-col gap-md">
            <div className="flex items-center justify-between pb-xs border-b border-surface-container">
              <div className="flex items-center gap-xs">
                <span className="w-7 h-7 rounded-full bg-secondary-fixed text-secondary flex items-center justify-center font-bold text-label-md">
                  C
                </span>
                <div>
                  <h2 className="font-headline-md text-headline-md text-on-surface font-bold">
                    {t.secC}
                  </h2>
                  <p className="font-body-sm text-body-sm text-secondary">
                    {t.secCDesc}
                  </p>
                </div>
              </div>
              <span className="font-data-mono text-data-mono text-secondary">Weight: 25% composite</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
              {/* Walking Difficulty */}
              <div className="p-sm rounded-lg bg-surface-container-low">
                <label className="font-label-sm text-[11px] text-secondary uppercase font-semibold block mb-1">
                  {t.walkDiff}
                </label>
                <select
                  value={walkDiff}
                  onChange={(e) => setWalkDiff(Number(e.target.value))}
                  className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded p-2 text-sm text-on-surface font-medium"
                >
                  <option value={0}>None (0 - Fully Ambulatory)</option>
                  <option value={1}>Mild (1 - Slight limp after 1km)</option>
                  <option value={2}>Moderate (2 - Requires rest every 300m)</option>
                  <option value={3}>Severe (3 - Requires walking stick / support)</option>
                </select>
              </div>

              {/* Stairs Difficulty */}
              <div className="p-sm rounded-lg bg-surface-container-low">
                <label className="font-label-sm text-[11px] text-secondary uppercase font-semibold block mb-1">
                  {t.stairsDiff}
                </label>
                <select
                  value={stairsDiff}
                  onChange={(e) => setStairsDiff(Number(e.target.value))}
                  className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded p-2 text-sm text-on-surface font-medium"
                >
                  <option value={0}>None (0 - Normal ascent & descent)</option>
                  <option value={1}>Mild (1 - Slight pain descending)</option>
                  <option value={2}>Moderate (2 - Step-by-step with handrail)</option>
                  <option value={3}>Severe (3 - Unable to negotiate slopes/stairs)</option>
                </select>
              </div>
            </div>

            {/* Injury History */}
            <label className="flex items-center gap-sm p-sm rounded-lg bg-surface-container-low border border-outline-variant/20 cursor-pointer">
              <input
                type="checkbox"
                checked={priorInjury}
                onChange={(e) => setPriorInjury(e.target.checked)}
                className="w-4 h-4 accent-primary"
              />
              <span className="font-label-md text-on-surface font-semibold">
                {t.injuryHist}
              </span>
            </label>
          </div>
        </div>

        {/* Right Column: Live Composite Score Card (4 Cols) */}
        <div className="xl:col-span-4 flex flex-col gap-lg sticky top-24">
          <div className="bg-surface-container-lowest p-card-padding rounded-xl shadow-md border border-surface-container flex flex-col gap-md">
            <div className="flex items-center justify-between pb-xs border-b border-surface-container">
              <span className="font-headline-sm text-on-surface font-bold">
                {t.compositeScore}
              </span>
              <span className="font-data-mono text-[11px] px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-bold">
                WOMAC/KOOS
              </span>
            </div>

            {/* Score Big Readout */}
            <div className="flex flex-col items-center justify-center p-lg bg-surface-container-low rounded-xl text-center">
              <span className="font-label-sm text-secondary uppercase font-semibold tracking-wider">
                Current Symptom Index
              </span>
              <div className="flex items-baseline gap-1 my-xs">
                <span className={`font-display-lg text-[44px] font-extrabold ${
                  compositeScore >= 25 ? 'text-red-600' : compositeScore > 20 ? 'text-amber-500' : 'text-emerald-600'
                }`}>
                  {compositeScore}
                </span>
                <span className="text-secondary font-headline-sm">/ 40</span>
              </div>
              <div className={`inline-flex items-center gap-1 px-md py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${
                compositeScore >= 25
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : compositeScore > 20
                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}>
                <span className={`w-2 h-2 rounded-full ${compositeScore >= 25 ? 'bg-red-600' : compositeScore > 20 ? 'bg-amber-500' : 'bg-emerald-600'}`}></span>
                {riskTier}
              </div>
            </div>

            {/* Factor Bars */}
            <div className="space-y-sm">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>Symptom Intensity</span>
                  <span>{Math.round((pain / 10) * 100)}%</span>
                </div>
                <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                  <div className="bg-error h-full rounded-full" style={{ width: `${(pain / 10) * 100}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>Agro-Workload Overload</span>
                  <span>{Object.values(workloadMatrix).filter(Boolean).length * 20}%</span>
                </div>
                <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full"
                    style={{ width: `${Object.values(workloadMatrix).filter(Boolean).length * 20}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>Functional Restriction</span>
                  <span>{Math.round(((walkDiff + stairsDiff) / 6) * 100)}%</span>
                </div>
                <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-tertiary h-full rounded-full"
                    style={{ width: `${((walkDiff + stairsDiff) / 6) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-xs pt-xs border-t border-surface-container">
              <button
                onClick={handleSubmit}
                disabled={isSaving}
                className="w-full py-3 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md font-bold shadow-md transition flex items-center justify-center gap-xs disabled:opacity-50"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">save</span>
                {isSaving ? 'Calculating...' : t.calcScore}
              </button>

              <button
                onClick={() => {
                  setPain(0);
                  setStiffness(10);
                  setWorkloadMatrix({ teaPlucking: false, heavyLoads: false, deepSquatting: false, slopeWalking: false, coldDamp: false });
                  setWalkDiff(0);
                  setStairsDiff(0);
                }}
                className="w-full py-2 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-sm text-xs transition"
                type="button"
              >
                {t.reset}
              </button>
            </div>

            {/* Submitted Alert */}
            {surveyOutcome && (
              <div className="p-sm rounded-lg bg-primary-fixed/30 border border-primary/40 text-xs flex flex-col gap-1">
                <span className="font-bold text-primary flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  Survey Synced with Record!
                </span>
                <p className="text-secondary">{surveyOutcome.recommendation}</p>
              </div>
            )}
            {submissionError && (
              <div role="alert" className="p-sm rounded-lg bg-error-container/30 border border-error/40 text-xs text-on-error-container">
                {submissionError}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
