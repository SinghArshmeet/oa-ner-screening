import React, { useState, useEffect, useRef } from 'react';
import { translations } from '../utils/i18n';
import { evaluateQuestionnaire } from '../utils/api';

export default function QuestionnaireView({
  activePatient,
  onSurveySubmitted,
  onOpenTeleconsult,
  onNavigate
}) {
  const [lang, setLang] = useState('en');
  const t = translations[lang] || translations.en;

  // Active section memory: 'A' (Pain/Stiffness), 'B' (Workload), 'C' (Mobility), 'all' (Full View)
  const [activeSection, setActiveSection] = useState('A');
  const [restoredDraft, setRestoredDraft] = useState(null);

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

  const draftKey = `orthonex_survey_draft_${activePatient?.id || 'default'}`;
  const isInitialLoad = useRef(true);

  // 1. Restore last accessed section & draft state on mount or patient switch
  useEffect(() => {
    isInitialLoad.current = true;
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.activeSection) setActiveSection(parsed.activeSection);
        if (typeof parsed.pain === 'number') setPain(parsed.pain);
        if (parsed.painPeak) setPainPeak(parsed.painPeak);
        if (typeof parsed.stiffness === 'number') setStiffness(parsed.stiffness);
        if (parsed.workloadMatrix) setWorkloadMatrix(parsed.workloadMatrix);
        if (typeof parsed.walkDiff === 'number') setWalkDiff(parsed.walkDiff);
        if (typeof parsed.stairsDiff === 'number') setStairsDiff(parsed.stairsDiff);
        if (typeof parsed.squatDiff === 'number') setSquatDiff(parsed.squatDiff);
        if (typeof parsed.priorInjury === 'boolean') setPriorInjury(parsed.priorInjury);
        if (parsed.lang) setLang(parsed.lang);

        const minutesAgo = parsed.timestamp ? Math.round((Date.now() - parsed.timestamp) / 60000) : 0;
        setRestoredDraft({
          section: parsed.activeSection || 'A',
          timeStr: minutesAgo <= 1 ? 'just now' : `${minutesAgo}m ago`
        });
      } else {
        setRestoredDraft(null);
        setActiveSection('A');
      }
    } catch {}
    isInitialLoad.current = false;
  }, [draftKey]);

  // 2. Persist state and section position on every change
  useEffect(() => {
    if (isInitialLoad.current) return;
    try {
      const payload = {
        activeSection,
        pain,
        painPeak,
        stiffness,
        workloadMatrix,
        walkDiff,
        stairsDiff,
        squatDiff,
        priorInjury,
        lang,
        timestamp: Date.now()
      };
      localStorage.setItem(draftKey, JSON.stringify(payload));
    } catch {}
  }, [activeSection, pain, painPeak, stiffness, workloadMatrix, walkDiff, stairsDiff, squatDiff, priorInjury, lang, draftKey]);

  const handleResetForm = () => {
    setPain(0);
    setPainPeak('morning');
    setStiffness(10);
    setWorkloadMatrix({
      teaPlucking: false,
      heavyLoads: false,
      deepSquatting: false,
      slopeWalking: false,
      coldDamp: false
    });
    setWalkDiff(0);
    setStairsDiff(0);
    setSquatDiff(0);
    setPriorInjury(false);
    setActiveSection('A');
    setRestoredDraft(null);
    try {
      localStorage.removeItem(draftKey);
    } catch {}
  };

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

  const sectionTabs = [
    { id: 'A', num: '1', label: 'Pain & Stiffness', desc: 'VAS & Triggers' },
    { id: 'B', num: '2', label: 'Workload Matrix', desc: 'Occupational Stress' },
    { id: 'C', num: '3', label: 'Mobility & Function', desc: 'Daily Impairments' },
    { id: 'all', num: '✦', label: 'All Sections', desc: 'Continuous View' }
  ];

  return (
    <div className="flex flex-col w-full gap-5 animate-fade-in">
      {/* Top Breadcrumb & Draft Restored Indicator */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => (onNavigate ? onNavigate('overview') : window.history.back())}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-secondary hover:text-primary transition-colors py-1 px-2 -ml-2 rounded-lg hover:bg-surface-container"
          type="button"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          <span>Back to Overview</span>
        </button>

        {/* Draft Restored Indicator */}
        {restoredDraft && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[11px] text-primary">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
            <span>
              Resumed draft from <strong>{restoredDraft.timeStr}</strong>
            </span>
            <button
              onClick={handleResetForm}
              className="underline text-primary hover:text-primary-container font-semibold ml-1"
              type="button"
            >
              Reset
            </button>
          </div>
        )}
      </div>

      {/* Header Banner with Clean Language Switcher & Quick Presets */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-surface-container-lowest p-5 rounded-2xl shadow-xs border border-surface-container/80">
        <div className="flex flex-col gap-1.5 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-data-mono text-[10px] uppercase font-bold">
              KOOS-India v2.4
            </span>
            <span className="text-secondary text-[11px] font-medium">
              Validated Multi-Lingual Clinical Survey
            </span>
          </div>
          <h1 className="font-headline-lg text-xl sm:text-2xl text-on-surface font-bold tracking-tight">
            {t.title}
          </h1>
          <p className="text-secondary text-xs sm:text-sm leading-relaxed">
            {t.subtitle}
          </p>

          {/* Quick Presets */}
          <div className="flex items-center gap-2 pt-1.5 flex-wrap">
            <span className="text-[10px] text-secondary uppercase font-bold tracking-wider">
              Fast Presets:
            </span>
            <button
              type="button"
              onClick={() => applySurveyPreset('severe')}
              className="px-2.5 py-1 rounded-lg bg-error/10 hover:bg-error/20 text-error text-[11px] font-semibold border border-error/30 transition active:scale-95"
            >
              Severe OA (Field Labor)
            </button>
            <button
              type="button"
              onClick={() => applySurveyPreset('moderate')}
              className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[11px] font-semibold border border-amber-500/30 transition active:scale-95"
            >
              Moderate Early OA
            </button>
            <button
              type="button"
              onClick={() => applySurveyPreset('mild')}
              className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold border border-emerald-500/30 transition active:scale-95"
            >
              Mild / Control
            </button>
          </div>
        </div>

        {/* Clean Language Selector */}
        <div className="flex flex-col gap-1.5 shrink-0">
          <span className="text-[10px] text-secondary uppercase font-bold tracking-wider">
            Interview Language
          </span>
          <div className="inline-flex flex-wrap rounded-xl p-1 bg-surface-container gap-1 border border-outline-variant/30">
            {[
              { id: 'en', label: 'English' },
              { id: 'hi', label: 'हिन्दी' },
              { id: 'bn', label: 'বাংলা' },
              { id: 'ta', label: 'தமிழ்' },
              { id: 'te', label: 'తెలుగు' },
              { id: 'mr', label: 'मराठी' },
              { id: 'as', label: 'অসমীয়া' }
            ].map((l) => (
              <button
                key={l.id}
                onClick={() => setLang(l.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
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
      </div>

      {/* Progressive Section Switcher Tabs */}
      <div className="flex items-center gap-1.5 bg-surface-container/70 p-1.5 rounded-2xl border border-surface-container max-w-full overflow-x-auto">
        {sectionTabs.map((tab) => {
          const isActive = activeSection === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id)}
              type="button"
              className={`flex-1 min-w-[140px] px-3 py-2 rounded-xl text-left transition-all flex items-center gap-2.5 ${
                isActive
                  ? 'bg-surface-container-lowest text-on-surface font-bold shadow-xs border border-outline-variant/30'
                  : 'text-secondary hover:text-on-surface hover:bg-surface-container-lowest/60'
              }`}
            >
              <span
                className={`w-6 h-6 rounded-lg flex items-center justify-center font-data-mono text-xs font-bold shrink-0 ${
                  isActive ? 'bg-primary text-white' : 'bg-surface-container-high text-secondary'
                }`}
              >
                {tab.num}
              </span>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold truncate leading-tight">{tab.label}</span>
                <span className="text-[10px] text-secondary font-normal truncate">{tab.desc}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        {/* Left Column: Questionnaire Sections (8 Cols) */}
        <div className="xl:col-span-8 flex flex-col gap-5">
          {/* SECTION A: Pain & Stiffness VAS */}
          {(activeSection === 'A' || activeSection === 'all') && (
            <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-xs border border-surface-container/80 flex flex-col gap-4 animate-fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-surface-container">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs font-data-mono">
                    A
                  </span>
                  <div>
                    <h2 className="text-sm sm:text-base text-on-surface font-bold">
                      {t.secA}
                    </h2>
                    <p className="text-secondary text-xs">
                      {t.secADesc}
                    </p>
                  </div>
                </div>
                <span className="font-data-mono text-[11px] text-secondary font-medium">Weight: 40%</span>
              </div>

              {/* Pain Slider */}
              <div className="flex flex-col gap-2.5 bg-surface-container-low/70 p-4 rounded-xl border border-surface-container">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-xs sm:text-sm text-on-surface font-semibold" htmlFor="pain-slider">
                    {t.painLabel}
                  </label>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-error-container/40 text-on-error-container text-xs font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-error"></span>
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
                  className="w-full h-2 bg-outline-variant/50 rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-secondary font-data-mono text-[10px] px-1">
                  <span>0 (Asymptomatic)</span>
                  <span>2 (Mild)</span>
                  <span>5 (Moderate)</span>
                  <span className="text-error font-bold">{pain} (Current)</span>
                  <span>10 (Debilitating)</span>
                </div>

                {/* Peak Triggers */}
                <div className="flex flex-col gap-1.5 pt-2 border-t border-outline-variant/20 mt-1">
                  <span className="text-[10px] text-secondary uppercase font-bold tracking-wider">
                    {t.peakLabel}
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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
                        className={`px-3 py-1.5 rounded-lg text-xs text-center transition font-medium border ${
                          painPeak === btn.id
                            ? 'bg-primary text-white border-primary shadow-xs font-bold'
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
              <div className="flex flex-col gap-2.5 bg-surface-container-low/70 p-4 rounded-xl border border-surface-container">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-xs sm:text-sm text-on-surface font-semibold" htmlFor="stiff-slider">
                    {t.stiffnessLabel}
                  </label>
                  <span className="font-data-mono text-sm text-primary font-bold">
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
                  className="w-full h-2 bg-outline-variant/50 rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-secondary font-data-mono text-[10px] px-1">
                  <span>&lt; 10m (Physiologic)</span>
                  <span className="text-primary font-bold">30m (OA Benchmark Cutoff)</span>
                  <span>&gt; 60m (Severe Inflammatory)</span>
                </div>
              </div>

              {/* Step Navigation Button */}
              {activeSection === 'A' && (
                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setActiveSection('B')}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary-container text-white text-xs font-semibold transition-all shadow-xs"
                    type="button"
                  >
                    <span>Continue to Section 2 (Workload Matrix)</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* SECTION B: Regional Agro-Workload Matrix */}
          {(activeSection === 'B' || activeSection === 'all') && (
            <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-xs border border-surface-container/80 flex flex-col gap-4 animate-fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-surface-container">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-xl bg-tertiary/10 text-tertiary flex items-center justify-center font-bold text-xs font-data-mono">
                    B
                  </span>
                  <div>
                    <h2 className="text-sm sm:text-base text-on-surface font-bold">
                      {t.secB}
                    </h2>
                    <p className="text-secondary text-xs">
                      {t.secBDesc}
                    </p>
                  </div>
                </div>
                <span className="font-data-mono text-[11px] text-secondary font-medium">Weight: 35%</span>
              </div>

              <div className="space-y-2">
                {[
                  { key: 'teaPlucking', label: t.teaPlucking, note: 'Repetitive knee micro-trauma' },
                  { key: 'heavyLoads', label: t.heavyLoads, note: 'Axial tibiofemoral joint overload (>15kg)' },
                  { key: 'deepSquatting', label: t.deepSquatting, note: 'Extreme patellofemoral compressive force' },
                  { key: 'slopeWalking', label: t.slopeWalking, note: 'Eccentric quadriceps joint shear on terrain' },
                  { key: 'coldDamp', label: t.coldDamp, note: 'Synovial fluid viscosity exacerbation' }
                ].map((item) => (
                  <label
                    key={item.key}
                    className={`p-3 rounded-xl flex items-center justify-between cursor-pointer transition border ${
                      workloadMatrix[item.key]
                        ? 'bg-primary/5 border-primary/30'
                        : 'bg-surface-container-low/50 border-outline-variant/20 hover:bg-surface-container'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={workloadMatrix[item.key]}
                        onChange={(e) => setWorkloadMatrix({ ...workloadMatrix, [item.key]: e.target.checked })}
                        className="w-4 h-4 accent-primary rounded cursor-pointer"
                      />
                      <div>
                        <span className="text-xs sm:text-sm text-on-surface font-semibold block">
                          {item.label}
                        </span>
                        <span className="text-[11px] text-secondary">
                          {item.note}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`font-data-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        workloadMatrix[item.key]
                          ? 'bg-error-container text-on-error-container'
                          : 'bg-surface-container text-secondary'
                      }`}
                    >
                      {workloadMatrix[item.key] ? 'EXPOSED' : 'NONE'}
                    </span>
                  </label>
                ))}
              </div>

              {/* Step Navigation Buttons */}
              {activeSection === 'B' && (
                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => setActiveSection('A')}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-secondary hover:text-on-surface text-xs font-semibold transition"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                    <span>Back to Section 1</span>
                  </button>
                  <button
                    onClick={() => setActiveSection('C')}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary-container text-white text-xs font-semibold transition-all shadow-xs"
                    type="button"
                  >
                    <span>Continue to Section 3 (Mobility)</span>
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* SECTION C: Functional Interference & Mobility */}
          {(activeSection === 'C' || activeSection === 'all') && (
            <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-xs border border-surface-container/80 flex flex-col gap-4 animate-fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-surface-container">
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center font-bold text-xs font-data-mono">
                    C
                  </span>
                  <div>
                    <h2 className="text-sm sm:text-base text-on-surface font-bold">
                      {t.secC}
                    </h2>
                    <p className="text-secondary text-xs">
                      {t.secCDesc}
                    </p>
                  </div>
                </div>
                <span className="font-data-mono text-[11px] text-secondary font-medium">Weight: 25%</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Walking Difficulty */}
                <div className="p-3.5 rounded-xl bg-surface-container-low/70 border border-surface-container">
                  <label className="text-[11px] text-secondary uppercase font-bold tracking-wider block mb-1.5">
                    {t.walkDiff}
                  </label>
                  <select
                    value={walkDiff}
                    onChange={(e) => setWalkDiff(Number(e.target.value))}
                    className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg p-2 text-xs sm:text-sm text-on-surface font-medium focus:ring-1 focus:ring-primary outline-none"
                  >
                    <option value={0}>None (0 - Fully Ambulatory)</option>
                    <option value={1}>Mild (1 - Slight limp after 1km)</option>
                    <option value={2}>Moderate (2 - Requires rest every 300m)</option>
                    <option value={3}>Severe (3 - Requires walking stick / support)</option>
                  </select>
                </div>

                {/* Stairs Difficulty */}
                <div className="p-3.5 rounded-xl bg-surface-container-low/70 border border-surface-container">
                  <label className="text-[11px] text-secondary uppercase font-bold tracking-wider block mb-1.5">
                    {t.stairsDiff}
                  </label>
                  <select
                    value={stairsDiff}
                    onChange={(e) => setStairsDiff(Number(e.target.value))}
                    className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-lg p-2 text-xs sm:text-sm text-on-surface font-medium focus:ring-1 focus:ring-primary outline-none"
                  >
                    <option value={0}>None (0 - Normal ascent & descent)</option>
                    <option value={1}>Mild (1 - Slight pain descending)</option>
                    <option value={2}>Moderate (2 - Step-by-step with handrail)</option>
                    <option value={3}>Severe (3 - Unable to negotiate slopes/stairs)</option>
                  </select>
                </div>
              </div>

              {/* Injury History */}
              <label className="flex items-center gap-3 p-3.5 rounded-xl bg-surface-container-low/70 border border-surface-container cursor-pointer">
                <input
                  type="checkbox"
                  checked={priorInjury}
                  onChange={(e) => setPriorInjury(e.target.checked)}
                  className="w-4 h-4 accent-primary rounded cursor-pointer"
                />
                <span className="text-xs sm:text-sm text-on-surface font-semibold">
                  {t.injuryHist}
                </span>
              </label>

              {/* Step Navigation Buttons */}
              {activeSection === 'C' && (
                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => setActiveSection('B')}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-secondary hover:text-on-surface text-xs font-semibold transition"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                    <span>Back to Section 2</span>
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={isSaving}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary-container text-white text-xs font-semibold transition-all shadow-xs disabled:opacity-50"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                    <span>{isSaving ? 'Calculating...' : 'Review & Calculate Score'}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Live Composite Score Card (4 Cols) */}
        <div className="xl:col-span-4 flex flex-col gap-4 sticky top-24">
          <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-surface-container/80 flex flex-col gap-4">
            <div className="flex items-center justify-between pb-2 border-b border-surface-container">
              <span className="text-sm font-bold text-on-surface">
                {t.compositeScore}
              </span>
              <span className="font-data-mono text-[10px] px-2 py-0.5 rounded bg-surface-container text-on-surface-variant font-bold">
                WOMAC/KOOS
              </span>
            </div>

            {/* Score Big Readout */}
            <div className="flex flex-col items-center justify-center p-5 bg-surface-container-low/70 rounded-xl text-center border border-surface-container">
              <span className="text-[10px] text-secondary uppercase font-bold tracking-wider">
                Current Symptom Index
              </span>
              <div className="flex items-baseline gap-1 my-1">
                <span
                  className={`font-display-lg text-4xl font-extrabold ${
                    compositeScore >= 25 ? 'text-red-600' : compositeScore > 20 ? 'text-amber-500' : 'text-emerald-600'
                  }`}
                >
                  {compositeScore}
                </span>
                <span className="text-secondary font-headline-sm text-sm">/ 40</span>
              </div>
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide border ${
                  compositeScore >= 25
                    ? 'bg-red-50 text-red-700 border-red-200'
                    : compositeScore > 20
                    ? 'bg-amber-50 text-amber-800 border-amber-300'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    compositeScore >= 25 ? 'bg-red-600' : compositeScore > 20 ? 'bg-amber-500' : 'bg-emerald-600'
                  }`}
                ></span>
                {riskTier}
              </div>
            </div>

            {/* Factor Distribution Breakdown */}
            <div className="space-y-2.5">
              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-secondary">Symptom Intensity</span>
                  <span className="font-data-mono font-semibold">{Math.round((pain / 10) * 100)}%</span>
                </div>
                <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                  <div className="bg-error h-full rounded-full" style={{ width: `${(pain / 10) * 100}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-secondary">Workload Overload</span>
                  <span className="font-data-mono font-semibold">
                    {Object.values(workloadMatrix).filter(Boolean).length * 20}%
                  </span>
                </div>
                <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full"
                    style={{ width: `${Object.values(workloadMatrix).filter(Boolean).length * 20}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium mb-1">
                  <span className="text-secondary">Functional Restriction</span>
                  <span className="font-data-mono font-semibold">
                    {Math.round(((walkDiff + stairsDiff) / 6) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-tertiary h-full rounded-full"
                    style={{ width: `${((walkDiff + stairsDiff) / 6) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 pt-2 border-t border-surface-container">
              <button
                onClick={handleSubmit}
                disabled={isSaving}
                className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary-container text-white text-xs font-bold shadow-sm transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                type="button"
              >
                <span className="material-symbols-outlined text-[16px]">save</span>
                <span>{isSaving ? 'Calculating...' : t.calcScore}</span>
              </button>

              <button
                onClick={handleResetForm}
                className="w-full py-1.5 rounded-xl bg-surface-container-low hover:bg-surface-container text-secondary text-xs transition border border-outline-variant/30"
                type="button"
              >
                {t.reset}
              </button>
            </div>

            {/* Submitted Alert */}
            {surveyOutcome && (
              <div className="p-3 rounded-xl bg-primary/10 border border-primary/30 text-xs flex flex-col gap-1">
                <span className="font-bold text-primary flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  Survey Synced with Record!
                </span>
                <p className="text-secondary leading-relaxed">{surveyOutcome.recommendation}</p>
              </div>
            )}
            {submissionError && (
              <div role="alert" className="p-3 rounded-xl bg-error-container/30 border border-error/40 text-xs text-on-error-container">
                {submissionError}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
