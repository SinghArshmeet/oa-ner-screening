import React, { useState } from 'react';
import { ROLES, DEMO_ACCOUNTS, loginUser, loginAsDemo } from '../utils/auth';

export default function LoginView({ onLogin }) {
  const [selectedRole, setSelectedRole] = useState('screener');
  const [identifier, setIdentifier] = useState('screener@phc.assam.gov.in');
  const [password, setPassword] = useState('demo123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);

  // Switch role and update default demo credential suggestion
  const handleRoleSelect = (roleId) => {
    setSelectedRole(roleId);
    setErrorMessage('');
    const demo = DEMO_ACCOUNTS.find((d) => d.role === roleId);
    if (demo) {
      setIdentifier(demo.email);
      setPassword(demo.password);
    }
  };

  // Quick fill active demo credentials
  const handleQuickFill = () => {
    const demo = DEMO_ACCOUNTS.find((d) => d.role === selectedRole);
    if (demo) {
      setIdentifier(demo.email);
      setPassword(demo.password);
      setErrorMessage('');
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!identifier.trim()) {
      setErrorMessage('Please enter your Staff ID or registered PHC email address.');
      return;
    }

    if (!password.trim()) {
      setErrorMessage('Please enter your station access password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await loginUser({
        identifier,
        password,
        roleId: selectedRole,
        rememberDevice
      });
      setIsSubmitting(false);
      onLogin(user);
    } catch (err) {
      setIsSubmitting(false);
      setErrorMessage(err.message || 'Authentication failed. Please verify credentials.');
    }
  };

  const [googleAuthConfigured, setGoogleAuthConfigured] = useState(false);
  const [googleNotice, setGoogleNotice] = useState('');

  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

  // Check if backend has Google credentials configured
  React.useEffect(() => {
    let active = true;
    fetch(`${API_BASE}/auth/status`, {
      headers: { Accept: 'application/json' },
    })
      .then((res) => res.json())
      .then((data) => {
        if (active && data) {
          setGoogleAuthConfigured(Boolean(data.google_configured));
        }
      })
      .catch(() => {
        // backend offline / edge mode
      });
    return () => {
      active = false;
    };
  }, []);

  const handleDemoBypass = () => {
    const user = loginAsDemo(selectedRole);
    onLogin(user);
  };

  const handleGoogleLogin = () => {
    setGoogleNotice('');
    setErrorMessage('');
    if (!googleAuthConfigured) {
      setGoogleNotice(
        'Google authentication is not configured. For development and field testing, please use Station Credentials or continue in Offline Simulation / Demo Mode.'
      );
      return;
    }
    // Secure backend-managed OAuth 2.0 PKCE flow (Redirects to backend -> Google -> callback -> frontend)
    window.location.href = `${API_BASE}/auth/google/login?role=${encodeURIComponent(selectedRole)}`;
  };

  const currentRoleConfig = ROLES[selectedRole] || ROLES.screener;

  return (
    <div className="min-h-screen bg-[#070d18] text-surface font-body-md flex flex-col justify-between selection:bg-primary-fixed selection:text-on-primary-fixed relative overflow-hidden">
      {/* Dynamic Animated Background Mesh Grid */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-cyan-600/15 blur-[120px] animate-pulse"></div>
        <div className="absolute top-1/2 -right-40 w-[550px] h-[550px] rounded-full bg-blue-600/15 blur-[140px] animate-pulse" style={{ animationDelay: '1.5s' }}></div>
        <div className="absolute -bottom-40 left-1/3 w-[500px] h-[500px] rounded-full bg-emerald-600/10 blur-[130px] animate-pulse" style={{ animationDelay: '3s' }}></div>
        <svg className="w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="login-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#38bdf8" strokeWidth="0.5" strokeDasharray="3 3"></path>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#login-grid)"></rect>
        </svg>
      </div>

      {/* Top Clinical Agency Bar */}
      <header className="relative z-10 w-full bg-black/40 backdrop-blur-md text-surface py-2.5 px-lg border-b border-white/10 flex items-center justify-between text-xs">
        <div className="flex items-center gap-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-data-mono text-tertiary-fixed font-semibold uppercase tracking-wider">
            OrthoNex Frontline Triage Network
          </span>
          <span className="text-white/20 hidden sm:inline">|</span>
          <span className="text-surface-dim hidden sm:inline">Station: PHC-DIPHU-NODE-01</span>
        </div>
        <div className="flex items-center gap-sm">
          <span className="font-label-sm text-[11px] text-surface-dim flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px] text-tertiary">location_on</span>
            Karbi Anglong, Assam
          </span>
          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-data-mono text-[10px] border border-emerald-500/30">
            Node Online
          </span>
        </div>
      </header>

      {/* Main Two-Column Portal Container */}
      <main className="relative z-10 flex-1 max-w-[1400px] w-full mx-auto px-md sm:px-lg py-lg lg:py-xl flex items-center justify-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-xl lg:gap-2xl items-stretch">
          
          {/* LEFT COLUMN: Animated OrthoNex Biomechanical Telemetry Card */}
          <section
            aria-label="OrthoNex Clinical Overview"
            className="lg:col-span-6 xl:col-span-7 flex flex-col justify-between p-lg sm:p-xl rounded-2xl bg-[#0f172a]/80 backdrop-blur-xl border border-white/10 shadow-2xl relative overflow-hidden"
          >
            <div>
              {/* Institution & App Header */}
              <div className="flex items-center gap-md mb-md">
                <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 p-0.5 shadow-lg shadow-cyan-500/30 flex items-center justify-center shrink-0 group">
                  <div className="w-full h-full bg-[#090e17] rounded-2xl flex items-center justify-center overflow-hidden">
                    <img
                      src="/logo.png"
                      alt="OrthoNex Logo"
                      className="w-10 h-10 object-contain drop-shadow-md group-hover:scale-110 transition duration-300"
                    />
                  </div>
                  <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-cyan-500"></span>
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-xs flex-wrap">
                    <h1 className="font-headline-lg text-[28px] sm:text-[32px] text-white font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-cyan-300 bg-clip-text text-transparent">
                      OrthoNex
                    </h1>
                    <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-data-mono text-[10px] uppercase font-bold tracking-wider">
                      ICMR/NER-SOP-09
                    </span>
                  </div>
                  <p className="font-label-sm text-body-sm text-slate-300 font-medium">
                    Multimodal AI Musculoskeletal Screening & Tele-Triage
                  </p>
                </div>
              </div>

              {/* Station Deployment Badge */}
              <div className="inline-flex items-center gap-xs px-sm py-1.5 rounded-full bg-white/5 text-slate-200 font-label-sm text-[12px] font-semibold mb-lg border border-white/10 backdrop-blur-sm">
                <span className="material-symbols-outlined text-[16px] text-cyan-400">local_hospital</span>
                <span>Frontline Field Station: Diphu CHC & Sub-Centers, Assam Hub</span>
              </div>

              {/* Animated Biomechanical Scan Banner */}
              <div className="relative rounded-xl bg-[#060b13] border border-cyan-500/30 p-md mb-lg overflow-hidden shadow-inner">
                {/* Visual Laser Scanning Line */}
                <div className="absolute top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-cyan-400 to-transparent animate-[pulse_2s_ease-in-out_infinite] shadow-[0_0_15px_#22d3ee]"></div>

                <div className="flex items-center justify-between gap-md relative z-10">
                  <div className="flex items-center gap-sm">
                    <div className="w-10 h-10 rounded-xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-400 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[24px]">radiology</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-headline-sm text-xs font-bold text-white uppercase tracking-wider">
                          Tri-Modal Neural Fusion Active
                        </span>
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-data-mono text-[9px] font-bold">
                          READY
                        </span>
                      </div>
                      <p className="font-body-sm text-slate-400 text-[11px] mt-0.5">
                        Optical Gait Kinematics (MediaPipe) · KOOS-NER Burden · Grad-CAM Radiographs
                      </p>
                    </div>
                  </div>

                  <div className="hidden sm:flex flex-col items-end text-right font-data-mono">
                    <span className="text-cyan-400 font-bold text-xs">ROC-AUC 74.4%</span>
                    <span className="text-slate-400 text-[10px]">Model v3.4.2</span>
                  </div>
                </div>
              </div>

              {/* Core Operational Capabilities Matrix */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-sm mb-lg">
                <div className="p-md rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/30 transition flex flex-col justify-between">
                  <div className="flex items-center gap-xs mb-1">
                    <span className="material-symbols-outlined text-cyan-400 text-[20px]">directions_walk</span>
                    <h3 className="font-headline-sm text-sm font-bold text-white">
                      Gait Biomechanics HUD
                    </h3>
                  </div>
                  <p className="font-body-sm text-slate-300 text-xs leading-relaxed">
                    MediaPipe 33-point sagittal skeleton tracking at 30 FPS. Evaluates knee flexion asymmetry in 8-second walking tests.
                  </p>
                </div>

                <div className="p-md rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/30 transition flex flex-col justify-between">
                  <div className="flex items-center gap-xs mb-1">
                    <span className="material-symbols-outlined text-emerald-400 text-[20px]">checklist</span>
                    <h3 className="font-headline-sm text-sm font-bold text-white">
                      KOOS-NER Clinical Survey
                    </h3>
                  </div>
                  <p className="font-body-sm text-slate-300 text-xs leading-relaxed">
                    Visual Analog Scales (VAS) & regional tea plantation workload matrix in Assamese, Bengali, and Hindi.
                  </p>
                </div>

                <div className="p-md rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/30 transition flex flex-col justify-between">
                  <div className="flex items-center gap-xs mb-1">
                    <span className="material-symbols-outlined text-amber-400 text-[20px]">heat_map</span>
                    <h3 className="font-headline-sm text-sm font-bold text-white">
                      X-Ray & Grad-CAM Heatmap
                    </h3>
                  </div>
                  <p className="font-body-sm text-slate-300 text-xs leading-relaxed">
                    Kellgren-Lawrence (KL 0-4) grading with real-time articular joint space attention maps.
                  </p>
                </div>

                <div className="p-md rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/30 transition flex flex-col justify-between">
                  <div className="flex items-center gap-xs mb-1">
                    <span className="material-symbols-outlined text-indigo-400 text-[20px]">cell_tower</span>
                    <h3 className="font-headline-sm text-sm font-bold text-white">
                      Rural Specialist Mesh
                    </h3>
                  </div>
                  <p className="font-body-sm text-slate-300 text-xs leading-relaxed">
                    Instant 1-click clinical dossier transfer to orthopedic specialists at GMCH Guwahati and Diphu Civil Hospital.
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Status Card */}
            <div className="p-md rounded-xl bg-black/40 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-md">
              <div className="flex items-center gap-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></span>
                <span className="font-body-sm text-xs text-slate-300">
                  Frontline Edge Screening Station Active · Hardware Fleet Synced
                </span>
              </div>
              <span className="font-data-mono text-cyan-300 text-[11px] font-semibold">
                v3.4.2-LTS
              </span>
            </div>
          </section>

          {/* RIGHT COLUMN: Focused Clinical Login Terminal */}
          <section
            aria-label="Clinical Sign In Form"
            className="lg:col-span-6 xl:col-span-5 flex flex-col justify-center"
          >
            <div className="w-full bg-[#0f172a]/90 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/15 p-lg sm:p-xl text-slate-100">
              
              {/* Form Header */}
              <div className="mb-md pb-sm border-b border-white/10">
                <div className="flex items-center justify-between gap-xs mb-1">
                  <span className="font-headline-sm text-lg font-bold text-white">
                    Station Terminal Sign In
                  </span>
                  <span className="px-xs py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-data-mono text-[10px] font-bold uppercase border border-cyan-500/30">
                    NER-SOP-09
                  </span>
                </div>
                <p className="font-body-sm text-slate-400 text-xs">
                  Authorize your PHC screening session to access patient triage, gait camera feeds, and diagnostic reports.
                </p>
              </div>

              {/* 1. Accessible Role Segmented Selector */}
              <div className="mb-md">
                <label className="block font-label-sm text-[11px] text-slate-300 font-bold uppercase tracking-wider mb-1.5">
                  Select Screener Operational Role
                </label>
                <div
                  role="radiogroup"
                  aria-label="Select Station Role"
                  className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-black/40 border border-white/10"
                >
                  {Object.values(ROLES).map((role) => {
                    const isSelected = selectedRole === role.id;
                    return (
                      <button
                        key={role.id}
                        role="radio"
                        aria-checked={isSelected}
                        onClick={() => handleRoleSelect(role.id)}
                        className={`flex flex-col items-center justify-center p-2 rounded-lg text-center transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-cyan-600 text-white shadow-md font-semibold ring-1 ring-cyan-400'
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                        }`}
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[18px] mb-0.5">{role.icon}</span>
                        <span className="font-label-sm text-[11px] leading-tight block">
                          {role.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p className="font-body-sm text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px] text-cyan-400">info</span>
                  <span>{currentRoleConfig.description}</span>
                </p>
              </div>

              {/* Error Notification Alert */}
              {errorMessage && (
                <div
                  role="alert"
                  className="mb-md p-sm rounded-xl bg-rose-950/40 border border-rose-500/50 text-rose-200 flex items-start gap-xs animate-fade-in"
                >
                  <span className="material-symbols-outlined text-rose-400 text-[20px] shrink-0 mt-0.5">
                    error
                  </span>
                  <div className="flex-1">
                    <span className="font-label-md text-xs font-bold text-rose-400 block">
                      Authentication Alert
                    </span>
                    <p className="font-body-sm text-xs text-rose-200 mt-0.5">
                      {errorMessage}
                    </p>
                  </div>
                </div>
              )}

              {/* 2. Authentication Form */}
              <form onSubmit={handleFormSubmit} noValidate className="space-y-md">
                {/* Staff ID or Email Input */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label
                      htmlFor="identifier-input"
                      className="font-label-sm text-xs font-bold text-slate-200 uppercase tracking-wide"
                    >
                      Staff ID or PHC Email *
                    </label>
                    <span className="text-[10px] text-slate-400 font-data-mono">
                      e.g., {currentRoleConfig.defaultEmail}
                    </span>
                  </div>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-3 text-slate-400 text-[18px] pointer-events-none">
                      badge
                    </span>
                    <input
                      id="identifier-input"
                      type="text"
                      required
                      autoComplete="username"
                      value={identifier}
                      onChange={(e) => {
                        setIdentifier(e.target.value);
                        if (errorMessage) setErrorMessage('');
                      }}
                      placeholder="e.g., screener@phc.assam.gov.in"
                      className="w-full bg-black/40 text-white placeholder:text-slate-500 text-xs rounded-xl pl-10 pr-3 py-2.5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
                    />
                  </div>
                </div>

                {/* Password Input with Show/Hide Toggle */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label
                      htmlFor="password-input"
                      className="font-label-sm text-xs font-bold text-slate-200 uppercase tracking-wide"
                    >
                      Station Access Password *
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(true)}
                      className="font-label-sm text-[11px] text-cyan-400 hover:underline"
                    >
                      Forgot access?
                    </button>
                  </div>
                  <div className="relative flex items-center">
                    <span className="material-symbols-outlined absolute left-3 text-slate-400 text-[18px] pointer-events-none">
                      lock
                    </span>
                    <input
                      id="password-input"
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errorMessage) setErrorMessage('');
                      }}
                      placeholder="Enter station password"
                      className="w-full bg-black/40 text-white placeholder:text-slate-500 text-xs rounded-xl pl-10 pr-10 py-2.5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-3 text-slate-400 hover:text-white transition p-1"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Remember Device Checkbox & Quickfill helper */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberDevice}
                      onChange={(e) => setRememberDevice(e.target.checked)}
                      className="w-4 h-4 accent-cyan-500 rounded cursor-pointer"
                    />
                    <span className="font-label-sm text-xs text-slate-300">
                      Remember this station terminal
                    </span>
                  </label>

                  <button
                    type="button"
                    onClick={handleQuickFill}
                    className="font-label-sm text-[11px] text-cyan-400 hover:text-cyan-300 font-semibold underline flex items-center gap-0.5"
                    title="Populate recommended demo credentials for selected role"
                  >
                    <span className="material-symbols-outlined text-[13px]">magic_button</span>
                    Fill Demo Key
                  </button>
                </div>

                {/* Submit Action Button */}
                <div className="pt-xs space-y-xs">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full py-2.5 px-md rounded-xl font-label-md text-sm font-bold text-white bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-lg shadow-cyan-600/30 transition-all flex items-center justify-center gap-2 ${
                      isSubmitting ? 'opacity-70 cursor-not-allowed' : 'active:scale-95'
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
                        <span>Verifying Station Credentials...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[18px]">login</span>
                        <span>Sign In to Station</span>
                      </>
                    )}
                  </button>

                  {/* Google Authentication Flow */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={handleGoogleLogin}
                      className="w-full py-2.5 px-md rounded-xl font-label-md text-xs font-semibold text-white bg-white/5 hover:bg-white/10 border border-white/15 shadow-xs transition-all flex items-center justify-center gap-2.5 active:scale-95"
                    >
                      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                      <span>Continue with Google</span>
                    </button>

                    {googleNotice && (
                      <div className="mt-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-200 text-[11px] flex items-start gap-1.5">
                        <span className="material-symbols-outlined text-[15px] text-amber-400 shrink-0 mt-0.5">info</span>
                        <span>{googleNotice}</span>
                      </div>
                    )}
                  </div>

                  {/* 1-Click Local Demo Mode Action */}
                  <div className="pt-2">
                    <div className="relative flex items-center justify-center my-2">
                      <div className="border-t border-white/10 w-full"></div>
                      <span className="bg-[#0f172a] px-2 font-label-sm text-[10px] uppercase text-slate-400 font-bold tracking-wider absolute">
                        Instant Evaluation
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleDemoBypass}
                      className="w-full py-2 px-md rounded-xl font-label-md text-xs font-semibold text-white bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-500/30 shadow-xs transition-all flex items-center justify-center gap-2 active:scale-95"
                    >
                      <span className="material-symbols-outlined text-[16px] text-cyan-400">bolt</span>
                      <span>Launch OrthoNex Demo</span>
                      <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-data-mono text-[9px] font-bold">
                        Offline Ready
                      </span>
                    </button>
                  </div>
                </div>
              </form>

              {/* Demo Credentials Cheat-Sheet Card */}
              <div className="mt-md p-xs px-sm rounded-xl bg-black/40 border border-white/10 text-[11px] text-slate-400">
                <span className="font-semibold text-slate-200 block mb-0.5">
                  Evaluation Credentials:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 font-data-mono text-[10px]">
                  <div>
                    <span className="text-cyan-400 font-bold">Screener:</span> demo123
                  </div>
                  <div>
                    <span className="text-emerald-400 font-bold">MO:</span> demo123
                  </div>
                  <div>
                    <span className="text-slate-200 font-bold">Admin:</span> admin123
                  </div>
                </div>
              </div>
            </div>
          </section>

        </div>
      </main>

      {/* Institutional Clinical Footer */}
      <footer className="relative z-10 w-full bg-black/40 backdrop-blur-md border-t border-white/10 py-sm mt-auto">
        <div className="max-w-[1400px] mx-auto px-lg flex flex-wrap items-center justify-between gap-sm text-slate-400 font-body-sm text-[11px]">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white">OrthoNex AI Musculoskeletal Platform</span>
            <span>·</span>
            <span>ICMR-RMRC North East Joint Tele-Screening Initiative</span>
          </div>
          <div className="flex items-center gap-md">
            <span className="italic text-slate-400 font-normal">
              Research prototype — not for standalone diagnosis
            </span>
            <span className="text-white/20">|</span>
            <span className="font-data-mono font-medium text-cyan-400">v3.4.2-clinical-lts</span>
          </div>
        </div>
      </footer>

      {/* Forgot Password / Station Help Modal */}
      {showForgotModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-md bg-black/80 backdrop-blur-md animate-fade-in"
        >
          <div className="w-full max-w-md bg-[#0f172a] rounded-2xl shadow-2xl border border-white/20 overflow-hidden text-slate-200">
            <div className="px-lg py-md bg-black/40 text-surface flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-xs">
                <span className="material-symbols-outlined text-[20px] text-cyan-400">help</span>
                <h3 className="font-headline-sm text-sm font-bold text-white">
                  Station Access Recovery SOP
                </h3>
              </div>
              <button
                onClick={() => setShowForgotModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
                type="button"
                aria-label="Close recovery dialog"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="p-lg space-y-sm text-xs text-slate-300">
              <p className="text-white font-medium">
                Under the <strong>ICMR-NER-SOP-09</strong> clinical protocol, station passwords cannot be reset over public unencrypted SMS or email.
              </p>
              <div className="p-sm rounded-lg bg-black/40 border border-white/10 space-y-1">
                <div className="font-semibold text-cyan-400">Station IT Desk (Karbi Anglong Hub):</div>
                <div className="font-data-mono text-[11px]">Phone / Intercom: Ext. 204 (03671-272210)</div>
                <div className="font-data-mono text-[11px]">Station Admin: admin.diphu@icmr.gov.in</div>
                <div className="text-[10px] text-slate-400">Hours: 08:00 - 18:00 IST (Mon-Sat)</div>
              </div>
              <p className="text-[11px]">
                For instant trial and testing on this device, use default credential <strong>demo123</strong> or click <strong>Launch OrthoNex Demo</strong>.
              </p>
            </div>

            <div className="px-lg py-sm bg-black/40 border-t border-white/10 flex justify-end">
              <button
                onClick={() => setShowForgotModal(false)}
                className="px-md py-1.5 rounded-lg bg-cyan-600 text-white font-label-md text-xs font-bold shadow-xs hover:bg-cyan-500 transition"
                type="button"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
