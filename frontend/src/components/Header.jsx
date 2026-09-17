import React, { useState, useRef, useEffect } from 'react';
import { ROLES, getAccountsForRole } from '../utils/auth';

export default function Header({
  activeTab,
  setActiveTab,
  onOpenTeleconsult,
  backendOnline,
  camera,
  currentUser,
  onSwitchAccount,
  onLogout
}) {
  const [showStatusPopover, setShowStatusPopover] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showRoleSelector, setShowRoleSelector] = useState(false);
  const statusPopoverRef = useRef(null);
  const accountMenuRef = useRef(null);

  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const mobileMenuRef = useRef(null);

  // Close status popover and account menu on click outside or Escape
  useEffect(() => {
    function handleClickOutside(event) {
      if (statusPopoverRef.current && !statusPopoverRef.current.contains(event.target)) {
        setShowStatusPopover(false);
      }
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target)) {
        setShowAccountMenu(false);
        setShowRoleSelector(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setShowMobileMenu(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setShowStatusPopover(false);
        setShowAccountMenu(false);
        setShowRoleSelector(false);
        setShowMobileMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const currentRoleId = currentUser?.roleId || (currentUser?.role?.toLowerCase().includes('officer') ? 'officer' : currentUser?.role?.toLowerCase().includes('admin') ? 'admin' : 'screener');
  const roleAccounts = getAccountsForRole(currentRoleId);

  const navTabs = [
    { id: 'overview', label: 'Overview', icon: 'dashboard', fullTitle: 'Overview & Screen' },
    { id: 'gait', label: 'Gait', icon: 'directions_walk', fullTitle: 'Gait Biomechanics HUD' },
    { id: 'survey', label: 'Questionnaire', icon: 'assignment', fullTitle: 'Clinical Questionnaire (WOMAC/KOOS)' },
    { id: 'report', label: 'Report & X-Ray', icon: 'radiology', fullTitle: 'Multimodal Diagnostic Report & X-Ray Staging' },
    { id: 'cohort', label: 'Patients', icon: 'groups', fullTitle: 'Cohort & Patients' },
    { id: 'hardware', label: 'Hardware', icon: 'router', fullTitle: 'ESP32 Hardware Fleet' },
  ];

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-inverse-surface text-surface shadow-[0_2px_12px_rgba(0,0,0,0.18)]">
      <div className="h-header-height w-full px-3 sm:px-6 lg:px-8 flex items-center justify-between gap-2 border-b border-white/10">
        {/* Brand Identity & Mobile Menu Toggle */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Main Navigation Hamburger / Menu Button */}
          <div className="relative" ref={mobileMenuRef}>
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              aria-label="Toggle Application Menu"
              aria-expanded={showMobileMenu}
              type="button"
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-surface-container-lowest transition-colors flex items-center justify-center"
              title="Navigation Menu"
            >
              <span className="material-symbols-outlined text-[20px]">
                {showMobileMenu ? 'close' : 'menu'}
              </span>
            </button>

            {/* Quick Navigation Dropdown Modal */}
            {showMobileMenu && (
              <div className="absolute left-0 mt-2 w-64 p-2 rounded-xl bg-inverse-surface border border-white/15 shadow-2xl z-50 text-left text-xs backdrop-blur-md animate-in fade-in zoom-in-95 duration-150">
                <div className="px-2 py-1.5 border-b border-white/10 mb-1 flex items-center justify-between">
                  <span className="font-bold text-surface-container-lowest text-[11px] uppercase tracking-wider">Clinical Modules</span>
                  <span className="text-[10px] text-tertiary font-data-mono">Triage Phase 2</span>
                </div>
                <div className="space-y-0.5">
                  {navTabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setActiveTab(tab.id);
                          setShowMobileMenu(false);
                        }}
                        className={`w-full px-2.5 py-2 rounded-lg flex items-center gap-2.5 transition-all text-left ${
                          isActive
                            ? 'bg-primary-container text-on-primary-container font-bold shadow-xs'
                            : 'text-surface-dim hover:text-white hover:bg-white/10'
                        }`}
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                        <div className="flex flex-col">
                          <span className="text-xs">{tab.fullTitle}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-black/40 border border-white/20 p-1 flex items-center justify-center shadow-md overflow-hidden shrink-0">
            <img src="/logo.png" alt="OrthoNex Logo" className="w-full h-full object-contain" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-headline-sm text-surface-container-lowest font-extrabold tracking-tight text-sm sm:text-base">
                OrthoNex
              </span>
              <span
                className="px-1.5 py-0.5 rounded bg-primary-container/80 text-on-primary font-data-mono text-[9px] uppercase font-semibold tracking-wide"
                title="Indian Council of Medical Research · North Eastern Region Screening Protocol"
              >
                ICMR/NER
              </span>
            </div>
            <span className="font-label-sm text-surface-dim/80 text-[11px] font-normal hidden xs:inline">
              Multimodal AI Orthopedic Triage
            </span>
          </div>
        </div>

        {/* Global Desktop Navigation Tabs */}
        <nav className="hidden lg:flex items-center gap-1 px-1.5 py-1 rounded-xl bg-surface-container-highest/10 border border-white/5">
          {navTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                title={tab.fullTitle}
                aria-label={tab.fullTitle}
                className={`px-3 py-1.5 font-label-md text-xs font-medium rounded-lg transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-primary-container text-on-primary-container font-semibold shadow-sm ring-1 ring-white/20'
                    : 'text-surface-dim hover:text-surface-container-lowest hover:bg-white/5'
                }`}
                type="button"
              >
                <span className="material-symbols-outlined text-[15px]">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Status Actions & Clinician Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* AI Status Pill with Popover for Technical Details */}
          <div className="relative" ref={statusPopoverRef}>
            <button
              onClick={() => setShowStatusPopover(!showStatusPopover)}
              aria-label="AI screening system status details"
              aria-expanded={showStatusPopover}
              type="button"
              title="Click to view AI system details"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-container-highest/10 border border-white/10 hover:bg-white/10 transition-colors"
            >
              <span className={`w-2 h-2 rounded-full shrink-0 ${backendOnline ? 'bg-tertiary-fixed-dim animate-pulse' : 'bg-amber-400'}`}></span>
              <span className="font-data-mono text-[11px] text-tertiary-fixed font-medium whitespace-nowrap">
                {backendOnline ? 'AI Online' : 'AI Offline'}
              </span>
              <span className="material-symbols-outlined text-[13px] text-surface-dim hidden sm:inline">
                {showStatusPopover ? 'expand_less' : 'expand_more'}
              </span>
            </button>

            {/* Technical details popover */}
            {showStatusPopover && (
              <div className="absolute right-0 mt-2 w-64 p-3 rounded-xl bg-inverse-surface border border-white/15 shadow-2xl z-50 text-left text-xs backdrop-blur-md animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-2">
                  <span className="font-semibold text-white">System Status</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-data-mono ${backendOnline ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
                    {backendOnline ? 'Operational' : 'Fallback Mode'}
                  </span>
                </div>
                <div className="space-y-1.5 text-surface-dim text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-white/60">Inference Core:</span>
                    <span className="font-data-mono text-white/90">MediaPipe v2.4</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Backend Service:</span>
                    <span className="font-data-mono text-white/90">{backendOnline ? 'FastAPI :8000' : 'Local Mock'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Biomechanical Model:</span>
                    <span className="font-data-mono text-white/90">RandomForest (Baseline Acc 74.4%)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Protocol:</span>
                    <span className="font-data-mono text-white/90">ICMR/NER Clinical v1.2</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Regional PHC Tag (Compact) */}
          <div
            className="hidden md:flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container-highest/10 text-surface-dim border border-white/5"
            title="Location: Diphu Primary Health Centre, Karbi Anglong, Assam"
          >
            <span className="material-symbols-outlined text-[15px] text-tertiary-fixed-dim">location_on</span>
            <span className="font-label-sm text-[11px] whitespace-nowrap">Diphu PHC</span>
          </div>

          {/* Live Camera Quick Trigger */}
          <button
            onClick={camera?.isWebcamActive ? camera.stopCamera : () => camera?.startCamera()}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-label-sm text-[11px] font-semibold transition-all active:scale-95 border ${
              camera?.isWebcamActive
                ? 'bg-emerald-600/30 text-emerald-300 border-emerald-400/40 hover:bg-emerald-600/40'
                : 'bg-white/5 text-surface-dim border-white/10 hover:bg-white/10 hover:text-white'
            }`}
            title={camera?.isWebcamActive ? 'Camera Ready (Click to stop)' : 'Optical Camera Offline (Click to connect)'}
            aria-label={camera?.isWebcamActive ? 'Camera Ready' : 'Camera'}
            type="button"
          >
            <span className="material-symbols-outlined text-[16px]">
              {camera?.isWebcamActive ? 'videocam' : 'videocam_off'}
            </span>
            <span className="hidden sm:inline">
              {camera?.isWebcamActive ? 'Camera Ready' : 'Camera'}
            </span>
          </button>

          {/* Teleconsult Floater Quick Trigger */}
          <button
            onClick={onOpenTeleconsult}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-tertiary-container/30 hover:bg-tertiary-container/50 text-tertiary-fixed font-label-sm text-[11px] font-semibold border border-tertiary/30 transition-all active:scale-95"
            title="Open Teleconsult & Referral Desk"
            aria-label="Open Teleconsult & Referral Desk"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px]">medical_services</span>
            <span className="hidden sm:inline">Consult</span>
          </button>

          {/* Clinician Profile & Accounts Menu Trigger */}
          <div className="relative flex items-center border-l border-white/10 pl-1.5 sm:pl-2" ref={accountMenuRef}>
            <button
              onClick={() => {
                setShowAccountMenu(!showAccountMenu);
                setShowRoleSelector(false);
              }}
              aria-label="Clinician account settings and profile menu"
              aria-expanded={showAccountMenu}
              aria-haspopup="true"
              type="button"
              className="flex items-center gap-1.5 sm:gap-2 p-1 rounded-xl hover:bg-white/5 transition-all text-left group focus:outline-none focus:ring-1 focus:ring-primary-fixed"
            >
              <div className="text-right hidden lg:block max-w-[120px] xl:max-w-[160px]">
                <p className="font-label-md text-[11px] text-surface-container-lowest font-semibold leading-tight flex items-center justify-end gap-1 truncate">
                  <span className="truncate">{currentUser?.name || 'Dr. R. Sharma, MO'}</span>
                  {currentUser?.isDemo && (
                    <span className="px-1 py-0.2 rounded bg-tertiary-container/40 text-tertiary-fixed font-data-mono text-[9px] font-bold shrink-0">
                      Simulated
                    </span>
                  )}
                </p>
                <p className="font-label-sm text-[10px] text-surface-dim truncate">
                  {currentUser?.role || 'Clinical Screener'}
                </p>
              </div>

              <div
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary flex items-center justify-center shrink-0 shadow-sm ring-1 ring-white/20 group-hover:ring-white/40 transition-all"
                title={`${currentUser?.name || 'Dr. R. Sharma'} (${currentUser?.role || 'Clinical Screener'})`}
              >
                <span className="material-symbols-outlined text-on-primary text-[16px] sm:text-[18px]">
                  person
                </span>
              </div>

              <span className="material-symbols-outlined text-[14px] text-surface-dim hidden sm:inline transition-transform duration-200">
                {showAccountMenu ? 'expand_less' : 'expand_more'}
              </span>
            </button>

            {/* Accessible Accounts Menu Dropdown */}
            {showAccountMenu && (
              <div
                role="menu"
                aria-label="User Account Menu"
                className="absolute right-0 top-full mt-2 w-72 sm:w-80 p-3 rounded-2xl bg-inverse-surface border border-white/15 shadow-2xl z-50 text-left backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150"
              >
                {/* Header: Current Active Account Overview */}
                <div className="pb-3 border-b border-white/10 mb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-white text-sm truncate">
                          {currentUser?.name || 'Staff User'}
                        </span>
                        {currentUser?.isDemo && (
                          <span
                            className="px-1.5 py-0.5 rounded bg-tertiary-container/40 text-tertiary-fixed font-data-mono text-[9px] font-bold uppercase tracking-wider"
                            title="Offline Simulation Mode"
                          >
                            {currentUser?.demoStatus || 'Demo'}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-surface-dim truncate mt-0.5 font-data-mono">
                        {currentUser?.email || 'screener@phc.assam.gov.in'}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-primary/40 text-primary-fixed text-[10px] font-semibold shrink-0">
                      {currentUser?.role || 'Clinical Screener'}
                    </span>
                  </div>

                  {/* Metadata Chips: Staff ID & Station */}
                  <div className="mt-2.5 pt-2 border-t border-white/5 grid grid-cols-2 gap-2 text-[10px] text-surface-dim">
                    <div className="bg-black/30 p-1.5 rounded-lg border border-white/5">
                      <span className="block text-white/50 font-data-mono uppercase text-[8px]">Staff / Node ID</span>
                      <span className="font-data-mono text-white font-medium truncate block">
                        {currentUser?.id || 'NER-STAFF-0892'}
                      </span>
                    </div>
                    <div className="bg-black/30 p-1.5 rounded-lg border border-white/5">
                      <span className="block text-white/50 font-data-mono uppercase text-[8px]">Current Station</span>
                      <span className="text-white font-medium truncate block">
                        {currentUser?.station || 'Diphu PHC'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Section: Switch Account within Current Role */}
                <div className="mb-3">
                  <div className="flex items-center justify-between pb-1.5">
                    <span className="text-[11px] font-semibold text-white/90">
                      Switch Account ({currentUser?.role || 'Clinical Screener'})
                    </span>
                    <button
                      onClick={() => setShowRoleSelector(!showRoleSelector)}
                      type="button"
                      className="text-[10px] text-tertiary-fixed hover:underline"
                    >
                      {showRoleSelector ? 'Cancel' : 'Change Role'}
                    </button>
                  </div>

                  {/* Intra-role account list */}
                  {!showRoleSelector ? (
                    <div className="space-y-1 max-h-36 overflow-y-auto pr-0.5">
                      {roleAccounts.map((acc) => {
                        const isCurrent = acc.email === currentUser?.email || acc.staffId === currentUser?.id;
                        return (
                          <button
                            key={acc.id}
                            type="button"
                            role="menuitem"
                            disabled={isCurrent}
                            onClick={() => {
                              if (onSwitchAccount) {
                                onSwitchAccount(acc);
                              }
                              setShowAccountMenu(false);
                            }}
                            className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-all ${
                              isCurrent
                                ? 'bg-primary-container/30 border border-primary/40 text-white cursor-default'
                                : 'hover:bg-white/10 text-surface-dim hover:text-white border border-transparent'
                            }`}
                          >
                            <div className="min-w-0 pr-2">
                              <p className="font-medium text-[11px] truncate text-white">
                                {acc.name}
                              </p>
                              <p className="text-[10px] text-surface-dim/80 truncate">
                                {acc.station}
                              </p>
                            </div>
                            {isCurrent ? (
                              <span className="material-symbols-outlined text-[16px] text-tertiary-fixed shrink-0">
                                check_circle
                              </span>
                            ) : (
                              <span className="text-[10px] text-tertiary-fixed font-data-mono shrink-0">
                                Switch
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    /* Optional Role Selector to switch role explicitly */
                    <div className="p-2 rounded-xl bg-black/40 border border-white/10 space-y-1.5">
                      <p className="text-[10px] text-surface-dim">Select new clinical discipline:</p>
                      {Object.values(ROLES).map((role) => (
                        <button
                          key={role.id}
                          type="button"
                          onClick={() => {
                            const accounts = getAccountsForRole(role.id);
                            if (accounts.length > 0 && onSwitchAccount) {
                              onSwitchAccount(accounts[0]);
                            }
                            setShowRoleSelector(false);
                            setShowAccountMenu(false);
                          }}
                          className={`w-full flex items-center justify-between p-1.5 rounded-lg text-xs text-left ${
                            currentRoleId === role.id ? 'bg-white/10 text-tertiary-fixed font-semibold' : 'text-surface-dim hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          <span>{role.label}</span>
                          <span className="text-[10px] font-data-mono text-white/50">
                            {getAccountsForRole(role.id).length} accounts
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Footer Actions: Sign Out */}
                <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      setShowAccountMenu(false);
                      if (onLogout) onLogout();
                    }}
                    type="button"
                    role="menuitem"
                    className="w-full py-1.5 px-3 rounded-xl bg-error/15 hover:bg-error/25 text-error-container hover:text-white border border-error/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95"
                  >
                    <span className="material-symbols-outlined text-[16px]">logout</span>
                    Sign out of station
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile/Tablet Horizontal Scroll Nav (Shortened labels) */}
      <div className="xl:hidden w-full bg-inverse-surface/95 border-t border-white/10 px-3 sm:px-4 py-1.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {navTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              title={tab.fullTitle}
              aria-label={tab.fullTitle}
              className={`px-3 py-1 text-xs whitespace-nowrap rounded-lg transition-all ${
                isActive
                  ? 'bg-primary-container text-on-primary-container font-semibold shadow-sm'
                  : 'text-surface-dim hover:text-white hover:bg-white/5'
              }`}
              type="button"
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </header>
  );
}

