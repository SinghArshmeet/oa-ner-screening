import React, { useState, useRef } from 'react';
import { analyzeXrayImage } from '../utils/api';

export default function DiagnosticReportView({ activePatient, surveyResult, gaitResult, onOpenTeleconsult }) {
  const [signedOff, setSignedOff] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [xrayData, setXrayData] = useState(null);
  const [xrayLoading, setXrayLoading] = useState(false);
  const [xrayError, setXrayError] = useState('');
  const xrayInputRef = useRef(null);

  const handleXrayUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setXrayLoading(true);
    setXrayError('');
    try {
      const res = await analyzeXrayImage(file);
      if (res.status === 'success' || res.kl_grade !== undefined) {
        setXrayData(res);
      }
    } catch (err) {
      setXrayError(err.message || 'Radiograph analysis could not be processed.');
    } finally {
      setXrayLoading(false);
      e.target.value = '';
    }
  };

  // Dynamic gait metrics
  const gaitCadence = gaitResult?.cadence || 94;
  const gaitVelocity = gaitResult?.velocity || 0.86;
  const gaitAsymmetryStr = gaitResult?.kneeAngleAsymmetry || '+14.2°';
  const gaitRiskTier = gaitResult?.risk?.includes('High') ? 'HIGH RISK' : gaitResult?.risk?.includes('Moderate') ? 'MODERATE RISK' : 'LOW RISK';

  // Dynamic survey metrics
  const painScore = surveyResult?.pain ?? (activePatient?.surveyScore?.includes('29') ? 8 : 7);
  const stiffnessMins = surveyResult?.stiffness ?? 35;
  const surveyScoreDisplay = surveyResult?.compositeScore ? `${surveyResult.compositeScore}/40` : (surveyResult?.raw_score ? `${surveyResult.raw_score}/40` : (activePatient?.surveyScore || '24/40'));
  const surveyRiskTier = (surveyResult?.category === 'high' || activePatient?.combinedRisk === 'high') ? 'HIGH BURDEN' : (surveyResult?.category === 'low' ? 'MILD BURDEN' : 'MODERATE BURDEN');

  // Combined Risk Fusion
  // When X-ray is unassessed, calculate multimodal index dynamically from available modules
  const gaitConfidence = gaitResult ? (gaitResult.confidence || 85) / 100 : 0.85;
  const surveyFactor = surveyResult ? (surveyResult.compositeScore ? surveyResult.compositeScore / 40 : (surveyResult.raw_score ? surveyResult.raw_score / 40 : 0.65)) : 0.70;
  
  // X-ray status: Check if an assessed result exists
  const isXrayAssessed = Boolean(activePatient?.xrayResult && activePatient?.xrayResult !== 'Not assessed');
  const xrayFactor = isXrayAssessed ? 0.75 : 0;
  
  const combinedRiskIndex = isXrayAssessed
    ? +( (gaitConfidence * 0.45 + surveyFactor * 0.35 + xrayFactor * 0.20) * 100 ).toFixed(1)
    : +( (gaitConfidence * 0.55 + surveyFactor * 0.45) * 100 ).toFixed(1);

  const isHighRisk = combinedRiskIndex >= 70;
  const isModerateRisk = combinedRiskIndex >= 45 && combinedRiskIndex < 70;
  const strokeDashoffset = +(263.89 - (263.89 * (combinedRiskIndex / 100))).toFixed(1);

  const handlePrintDossier = () => {
    window.print();
  };

  return (
    <div className="flex flex-col w-full gap-lg animate-fade-in print:p-0">
      {/* Patient Context Strip */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-md p-card-padding rounded-xl bg-surface-container-lowest shadow-sm border border-surface-container">
        <div className="flex flex-wrap items-center gap-md">
          <div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-primary text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              radiology
            </span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-xs">
              <h2 className="font-headline-md text-headline-md text-on-surface font-bold">
                Diagnostic Decision Support
              </h2>
              <span className="px-xs py-2xs rounded bg-surface-container-high text-on-surface-variant font-data-mono text-data-mono">
                Triage Phase 2
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              Multimodal Gait Sensor Fusion & Algorithmic Referral Assessment
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-lg text-on-surface-variant font-body-sm text-body-sm">
          <div className="flex flex-col">
            <span className="font-label-sm text-[10px] text-outline uppercase font-semibold">Protocol Timestamp</span>
            <span className="font-data-mono text-[12px] text-on-surface font-medium">18 Oct 2024 · 11:42 IST</span>
          </div>
          <div className="w-px h-8 bg-surface-container hidden sm:block"></div>
          <div className="flex flex-col">
            <span className="font-label-sm text-[10px] text-outline uppercase font-semibold">Screening Hub</span>
            <span className="font-body-md text-on-surface font-medium">Diphu CHC · Assam (NER)</span>
          </div>
          <div className="w-px h-8 bg-surface-container hidden sm:block"></div>
          <div className="flex flex-col">
            <span className="font-label-sm text-[10px] text-outline uppercase font-semibold">Registry Token</span>
            <span className="font-data-mono text-[12px] text-primary font-bold">{activePatient?.id || 'NER-OA-2024-0892'}</span>
          </div>
        </div>
      </div>

      {/* Hero Multimodal Screening Result Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-inverse-surface text-inverse-on-surface p-xl shadow-2xl border border-white/10">
        <div className="absolute -right-24 -top-24 w-96 h-96 rounded-full bg-error/15 blur-3xl pointer-events-none"></div>
        <div className="absolute left-1/3 -bottom-20 w-80 h-80 rounded-full bg-tertiary-container/15 blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col xl:flex-row items-stretch justify-between gap-xl">
          {/* Risk Status Left */}
          <div className="flex flex-col justify-between max-w-xl">
            <div className="flex flex-col gap-sm">
              <div className="flex flex-wrap items-center gap-xs">
                <div className={`inline-flex items-center gap-xs px-sm py-1 rounded-full w-fit border ${
                  isHighRisk
                    ? 'bg-error-container/20 text-error-container border-error/30'
                    : isModerateRisk
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                }`}>
                  <span className={`w-2.5 h-2.5 rounded-full ${isHighRisk ? 'bg-error animate-ping' : isModerateRisk ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
                  <span className="font-label-sm text-xs uppercase font-bold tracking-wider">
                    {isHighRisk ? 'Urgent Tier-2 Stratification' : isModerateRisk ? 'Tier-1 Clinical Follow-Up' : 'Routine Preventive Monitoring'}
                  </span>
                </div>
                <div className={`inline-flex items-center gap-xs px-2.5 py-0.5 rounded-full text-xs font-bold uppercase border ${
                  (gaitResult?.binaryScreening === 'screen_positive' || isHighRisk || isModerateRisk)
                    ? 'bg-red-500/30 text-red-200 border-red-500/50'
                    : 'bg-emerald-500/30 text-emerald-200 border-emerald-500/50'
                }`}>
                  <span className="material-symbols-outlined text-[14px]">
                    {(gaitResult?.binaryScreening === 'screen_positive' || isHighRisk || isModerateRisk) ? 'notification_important' : 'check_circle'}
                  </span>
                  <span>
                    {(gaitResult?.binaryScreening === 'screen_positive' || isHighRisk || isModerateRisk)
                      ? 'Screen Positive (Suspected OA)'
                      : 'Screen Negative (Low Risk)'}
                  </span>
                </div>
              </div>
              <h1 className="font-headline-lg text-headline-lg text-surface-container-lowest font-bold leading-tight">
                {isHighRisk ? 'High Risk for Clinical Osteoarthritis' : isModerateRisk ? 'Moderate Risk for Early Osteoarthritis' : 'Low Risk (Normal Biomechanics)'}
              </h1>
              <p className="font-body-md text-surface-dim leading-relaxed text-sm">
                Multimodal algorithmic convergence indicates {isHighRisk ? 'marked uncompensated mechanical unloading and high-severity clinical symptom loading consistent with moderate-to-severe degenerative joint disease' : isModerateRisk ? 'early sagittal compensation and intermittent weight-bearing symptoms requiring proactive joint-sparing therapy' : 'normal joint symmetry and low symptom severity'}{' '}
                in {activePatient?.name || 'the patient'}.
              </p>
            </div>

            <div className="mt-md pt-sm flex flex-wrap items-center gap-sm">
              <span className="px-sm py-1 rounded bg-surface-container-highest/10 text-tertiary-fixed-dim font-data-mono text-[11px] border border-white/5">
                Dominant Axis: {gaitResult?.affectedLimb || 'Right Limb (Sagittal Deficit)'}
              </span>
              <span className="px-sm py-1 rounded bg-surface-container-highest/10 text-surface-dim font-data-mono text-[11px] border border-white/5">
                Model Confidence: {Math.round(gaitConfidence * 100)}% (RandomForest Baseline)
              </span>
            </div>
          </div>

          {/* Center Telemetry Metric Dial */}
          <div className="flex flex-col sm:flex-row items-center gap-lg bg-surface-container-highest/10 p-lg rounded-xl backdrop-blur-md justify-around min-w-[340px] border border-white/10">
            <div className="flex flex-col items-center text-center">
              <div className="relative flex items-center justify-center w-28 h-28 mb-xs">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    className="text-surface-container-highest/20"
                    cx="50"
                    cy="50"
                    fill="transparent"
                    r="42"
                    stroke="currentColor"
                    strokeWidth="8"
                  ></circle>
                  <circle
                    className={isHighRisk ? 'text-error' : isModerateRisk ? 'text-amber-400' : 'text-emerald-400'}
                    cx="50"
                    cy="50"
                    fill="transparent"
                    r="42"
                    stroke="currentColor"
                    strokeDasharray="263.89"
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    strokeWidth="8"
                  ></circle>
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="font-data-metric text-[26px] font-extrabold text-surface-container-lowest">
                    {combinedRiskIndex}<span className="text-error text-lg">%</span>
                  </span>
                </div>
              </div>
              <span className="font-label-sm text-[11px] text-surface-dim uppercase font-semibold">
                Combined Risk Index
              </span>
              <span className="font-data-mono text-[10px] text-surface-dim mt-0.5">
                Fusion Model Prob.
              </span>
            </div>

            <div className="w-px h-24 bg-surface-container-highest/20 hidden sm:block"></div>

            <div className="flex flex-col gap-sm text-left">
              <div>
                <div className="flex items-center justify-between gap-md mb-1">
                  <span className="font-label-sm text-xs text-surface-dim">Baseline ROC AUC</span>
                  <span className="font-data-mono text-xs text-surface-container-lowest font-bold">74.4%</span>
                </div>
                <div className="w-36 bg-surface-container-highest/20 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-primary-fixed h-full rounded-full" style={{ width: '74.4%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between gap-md mb-1">
                  <span className="font-label-sm text-xs text-surface-dim">Gait Asymmetry</span>
                  <span className="font-data-mono text-xs text-error font-bold">{gaitAsymmetryStr}</span>
                </div>
                <div className="w-36 bg-surface-container-highest/20 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-error h-full rounded-full" style={{ width: `${Math.min(100, Math.round(gaitConfidence * 100))}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between gap-md mb-1">
                  <span className="font-label-sm text-xs text-surface-dim">Symptom Severity</span>
                  <span className="font-data-mono text-xs text-tertiary-fixed font-bold">{surveyScoreDisplay}</span>
                </div>
                <div className="w-36 bg-surface-container-highest/20 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-tertiary-fixed h-full rounded-full" style={{ width: `${Math.min(100, Math.round(surveyFactor * 100))}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tri-Modal Component Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
        {/* Module 1: Gait */}
        <div className="bg-surface-container-lowest p-card-padding rounded-xl shadow-sm border border-surface-container flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-xs border-b border-surface-container mb-xs">
              <span className="font-label-sm text-[11px] uppercase font-semibold text-secondary">
                Module 01 · Movement Analysis
              </span>
              <span className={`px-2 py-0.5 rounded-full font-data-mono text-[10px] font-bold ${
                gaitRiskTier === 'HIGH RISK' ? 'bg-error-container text-on-error-container' : 'bg-amber-100 text-amber-900'
              }`}>
                {gaitRiskTier}
              </span>
            </div>
            <h3 className="font-headline-sm text-on-surface font-bold mb-1">
              Sagittal Kinematic Stance
            </h3>
            <p className="font-body-sm text-secondary text-xs mb-sm">
              MediaPipe BlazePose 33-point sagittal tracking during 8s walking test.
            </p>
            <div className="space-y-xs text-xs">
              <div className="flex justify-between py-1 border-b border-surface-container">
                <span className="text-secondary">Cadence</span>
                <span className="font-data-mono font-bold text-on-surface">{gaitCadence} cpm</span>
              </div>
              <div className="flex justify-between py-1 border-b border-surface-container">
                <span className="text-secondary">Gait Velocity</span>
                <span className="font-data-mono font-bold text-error">{gaitVelocity} m/s</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-secondary">Extension Deficit</span>
                <span className="font-data-mono font-bold text-error">{gaitAsymmetryStr} Asymmetry</span>
              </div>
            </div>
          </div>
        </div>

        {/* Module 2: Questionnaire */}
        <div className="bg-surface-container-lowest p-card-padding rounded-xl shadow-sm border border-surface-container flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-xs border-b border-surface-container mb-xs">
              <span className="font-label-sm text-[11px] uppercase font-semibold text-secondary">
                Module 02 · Patient Inputs
              </span>
              <span className={`px-2 py-0.5 rounded-full font-data-mono text-[10px] font-bold ${
                surveyRiskTier === 'HIGH BURDEN' ? 'bg-error-container text-on-error-container' : 'bg-amber-100 text-amber-900'
              }`}>
                {surveyRiskTier}
              </span>
            </div>
            <h3 className="font-headline-sm text-on-surface font-bold mb-1">
              KOOS-NER Clinical Survey
            </h3>
            <p className="font-body-sm text-secondary text-xs mb-sm">
              Visual Analog Scale (VAS) & regional tea plantation workload matrix.
            </p>
            <div className="space-y-xs text-xs">
              <div className="flex justify-between py-1 border-b border-surface-container">
                <span className="text-secondary">Self-Reported Pain</span>
                <span className="font-data-mono font-bold text-error">{painScore} / 10 (VAS)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-surface-container">
                <span className="text-secondary">Morning Stiffness</span>
                <span className="font-data-mono font-bold text-primary">{stiffnessMins} mins</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-secondary">Composite Burden</span>
                <span className="font-data-mono font-bold text-on-surface">{surveyScoreDisplay}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Module 3: X-Ray */}
        <div className="bg-surface-container-lowest p-card-padding rounded-xl shadow-sm border border-surface-container flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-xs border-b border-surface-container mb-xs">
              <span className="font-label-sm text-[11px] uppercase font-semibold text-secondary">
                Module 03 · Radiographic Staging
              </span>
              <span className={`px-2 py-0.5 rounded-full font-data-mono text-[10px] font-bold ${
                xrayData ? (xrayData.kl_grade >= 3 ? 'bg-error-container text-on-error-container' : xrayData.kl_grade >= 2 ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900') : 'bg-surface-container-high text-on-surface'
              }`}>
                {xrayData ? `KL GRADE ${xrayData.kl_grade}` : (isXrayAssessed ? activePatient?.xrayResult : 'NOT ASSESSED')}
              </span>
            </div>
            <h3 className="font-headline-sm text-on-surface font-bold mb-1">
              {xrayData ? xrayData.label : (isXrayAssessed ? activePatient?.xrayResult : 'X-ray: Not assessed')}
            </h3>
            <p className="font-body-sm text-secondary text-xs mb-sm">
              {xrayData
                ? xrayData.findings
                : isXrayAssessed
                ? `Radiological report: ${activePatient?.xrayResult}`
                : 'Frontline optical and survey triage complete. Weight-bearing radiograph can be uploaded for instant KL-grade & Grad-CAM analysis.'}
            </p>

            {xrayData && xrayData.gradcam_base64 && (
              <div className="mb-sm p-2 rounded-lg bg-surface-container-high/40 border border-surface-container flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-[11px] font-bold text-on-surface">
                  <span>Grad-CAM Attention Map</span>
                  <span className="font-data-mono text-[10px] text-tertiary">Confidence: {xrayData.confidence}%</span>
                </div>
                <img
                  src={`data:image/jpeg;base64,${xrayData.gradcam_base64}`}
                  alt="Grad-CAM Articular Joint Space ROI"
                  className="w-full h-36 object-contain rounded bg-black/80"
                />
              </div>
            )}

            <div className="space-y-xs text-xs mb-sm">
              <div className="flex justify-between py-1 border-b border-surface-container">
                <span className="text-secondary">Joint Space Width</span>
                <span className="font-data-mono font-bold text-on-surface">
                  {xrayData ? (xrayData.kl_grade >= 3 ? 'Marked Narrowing' : xrayData.kl_grade >= 2 ? 'Mild Reduction' : 'Preserved') : (isXrayAssessed ? 'Assessed' : 'Pending Referral')}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-surface-container">
                <span className="text-secondary">Osteophyte Likelihood</span>
                <span className="font-data-mono font-bold text-secondary">
                  {xrayData ? (xrayData.kl_grade >= 3 ? 'Definite / Moderate' : xrayData.kl_grade >= 2 ? 'Definite / Minimal' : 'Absent / Doubtful') : (isXrayAssessed ? 'Recorded' : 'Pending Referral')}
                </span>
              </div>
            </div>

            <div className="pt-xs">
              <input
                type="file"
                ref={xrayInputRef}
                onChange={handleXrayUpload}
                accept="image/png,image/jpeg,image/jpg"
                className="hidden"
              />
              <button
                onClick={() => xrayInputRef.current?.click()}
                disabled={xrayLoading}
                className="w-full py-1.5 px-sm rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-sm text-xs font-semibold border border-outline-variant/30 flex items-center justify-center gap-1.5 transition"
                type="button"
              >
                <span className={`material-symbols-outlined text-[16px] ${xrayLoading ? 'animate-spin' : 'text-primary'}`}>
                  {xrayLoading ? 'refresh' : 'upload_file'}
                </span>
                <span>{xrayLoading ? 'Analyzing Radiograph...' : xrayData ? 'Re-upload Radiograph' : 'Upload Knee X-Ray (Grad-CAM)'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Statutory Referral & Action Bar */}
      <div className="bg-surface-container-lowest p-card-padding rounded-xl shadow-sm border border-surface-container flex flex-col lg:flex-row items-start lg:items-center justify-between gap-md">
        <div>
          <h4 className="font-headline-sm text-on-surface font-bold mb-1">
            Clinical Recommendation & Statutory Protocol
          </h4>
          <p className="font-body-sm text-secondary text-xs max-w-3xl">
            In accordance with ICMR-NER-SOP-09, patient qualifies for <strong>Tier-2 Orthopedic Clinical Consultation</strong>. Schedule radiological AP weight-bearing radiograph and bilateral physical therapy evaluation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-xs shrink-0">
          <button
            onClick={handlePrintDossier}
            className="px-md py-2.5 rounded-lg bg-surface-container-high hover:bg-surface-variant text-on-surface font-label-md text-sm font-semibold transition flex items-center gap-1.5"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">print</span>
            Print Clinical Dossier
          </button>

          <button
            onClick={() => setSignedOff(true)}
            disabled={signedOff}
            className={`px-md py-2.5 rounded-lg font-label-md text-sm font-semibold transition flex items-center gap-1.5 ${
              signedOff
                ? 'bg-tertiary-fixed text-on-tertiary-fixed font-bold'
                : 'bg-primary text-on-primary hover:bg-primary-container shadow-sm'
            }`}
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">
              {signedOff ? 'verified' : 'draw'}
            </span>
            {signedOff ? 'Dossier Signed-Off' : 'Sign-Off Screener'}
          </button>

          <button
            onClick={onOpenTeleconsult}
            className="px-lg py-2.5 rounded-lg bg-error hover:bg-error/90 text-on-error font-label-md text-sm font-bold shadow-md transition flex items-center gap-1.5"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">cell_tower</span>
            Dispatch Referral
          </button>
        </div>
      </div>
    </div>
  );
}
