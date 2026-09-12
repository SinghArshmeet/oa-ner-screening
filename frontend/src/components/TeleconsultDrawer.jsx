import React, { useState } from 'react';

export default function TeleconsultDrawer({ isOpen, onClose, activePatient, screeningData }) {
  const [filter, setFilter] = useState('All');
  const [sentCenter, setSentCenter] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const centers = [
    {
      id: 'gmch',
      name: 'Dr. B. K. Sarma, MS Ortho',
      hospital: 'GMCH Guwahati · Knee Joint Specialist',
      dist: '185 km',
      specialty: 'Arthroplasty',
      status: 'Online for Tele-Triage',
      statusColor: 'text-tertiary',
      dotColor: 'bg-tertiary',
      actionLabel: 'Send Dossier',
      actionType: 'primary'
    },
    {
      id: 'diphu',
      name: 'Diphu Civil Hospital Ortho Unit',
      hospital: 'Dr. P. Rongphar · Secondary Referral Center',
      dist: '12 km',
      specialty: 'Rehab & PT',
      status: 'Available in 10 mins',
      statusColor: 'text-tertiary',
      dotColor: 'bg-tertiary',
      actionLabel: 'Instant Tele-Review',
      actionType: 'tertiary'
    },
    {
      id: 'amch',
      name: 'Assam Medical College (AMCH)',
      hospital: 'Dibrugarh · Dept of Physical Medicine',
      dist: '310 km',
      specialty: 'Radiology',
      status: 'Scheduled tele-clinic: 2:30 PM',
      statusColor: 'text-on-surface-variant',
      dotColor: 'bg-secondary',
      actionLabel: 'Queue Referral',
      actionType: 'secondary'
    }
  ];

  const handleSendDossier = (centerId) => {
    setSentCenter(centerId);
    setTimeout(() => {
      setSentCenter(null);
    }, 4000);
  };

  const filteredCenters = centers.filter(c => {
    if (filter !== 'All' && c.specialty !== filter) return false;
    if (searchQuery && !c.name.toLowerCase().includes(searchQuery.toLowerCase()) && !c.hospital.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <aside aria-label="Teleconsult & Referral Network Desk" className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-2rem)] bg-surface-container-lowest rounded-xl shadow-2xl border border-outline-variant/40 flex flex-col overflow-hidden transition-all duration-300">
      {/* Top Banner */}
      <div className="bg-inverse-surface text-inverse-on-surface px-md py-sm flex items-center justify-between">
        <div className="flex items-center gap-xs">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-on-primary">
            <span className="material-symbols-outlined text-[16px]">medical_services</span>
          </div>
          <div>
            <span className="font-headline-sm text-[13px] font-bold block leading-tight text-surface-container-lowest">
              Nearby Specialist & Referral Network
            </span>
            <span className="font-label-sm text-[10px] text-tertiary-fixed block">
              Assam & NER Tele-Consult Desk
            </span>
          </div>
        </div>
        <div className="flex items-center gap-xs">
          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-surface-container-highest/20">
            <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse"></span>
            <span className="font-data-mono text-[10px] text-surface-dim">3 Online</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-surface-dim hover:text-white transition"
            type="button"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      </div>

      {/* Patient Dossier Chip */}
      {activePatient && (
        <div className="px-sm py-1.5 bg-primary-fixed/20 border-b border-outline-variant/20 flex items-center justify-between text-[11px]">
          <span className="text-on-primary-fixed font-medium truncate">
            Payload: {activePatient.name} ({activePatient.id})
          </span>
          <span className="font-data-mono font-bold text-primary text-[10px] uppercase">
            {screeningData?.category ? `${screeningData.category} Risk` : 'Ready to Send'}
          </span>
        </div>
      )}

      {/* Search & Distance Bar */}
      <div className="p-sm bg-surface-container-low border-b border-outline-variant/20 flex flex-col gap-xs">
        <div className="flex items-center justify-between gap-xs">
          <div className="relative grow">
            <span className="material-symbols-outlined absolute left-2 top-2 text-[14px] text-on-surface-variant">
              search
            </span>
            <input
              className="w-full bg-surface-container-lowest text-on-surface rounded text-[11px] pl-6 pr-2 py-1.5 border border-outline-variant/30 focus:ring-1 focus:ring-primary focus:outline-none"
              placeholder="Search specialists or hospital..."
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-1 shrink-0 text-on-surface-variant">
            <span className="material-symbols-outlined text-[14px]">tune</span>
            <span className="font-label-sm text-[10px] font-semibold">&lt; 350km</span>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-1">
          {['All', 'Arthroplasty', 'Rehab & PT', 'Radiology'].map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-xs py-1 rounded-full font-label-sm text-[10px] font-semibold transition shrink-0 ${
                filter === t
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
              }`}
              type="button"
            >
              {t === 'All' ? 'All Specialties' : t}
            </button>
          ))}
        </div>
      </div>

      {/* Centers List */}
      <div className="p-sm space-y-xs max-h-72 overflow-y-auto">
        {filteredCenters.map((c) => {
          const isSent = sentCenter === c.id;
          return (
            <div
              key={c.id}
              className="p-2.5 rounded-lg bg-surface-container-lowest border border-outline-variant/30 flex flex-col gap-xs hover:border-primary transition-colors shadow-xs"
            >
              <div className="flex items-start justify-between gap-xs">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${c.dotColor}`}></span>
                    <span className="font-label-sm text-[12px] text-on-surface font-bold">
                      {c.name}
                    </span>
                  </div>
                  <span className="font-body-sm text-[11px] text-on-surface-variant block mt-0.5">
                    {c.hospital}
                  </span>
                </div>
                <span className="px-xs py-0.5 rounded bg-surface-container-high text-primary font-data-mono text-[10px] font-bold shrink-0">
                  {c.dist}
                </span>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-outline-variant/10">
                <span className={`font-label-sm text-[10px] ${c.statusColor} font-semibold flex items-center gap-1`}>
                  <span className="material-symbols-outlined text-[12px]">schedule</span>
                  {c.status}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleSendDossier(c.id)}
                    disabled={isSent}
                    className={`px-2 py-1 rounded font-label-sm text-[10px] font-semibold flex items-center gap-1 transition-colors ${
                      isSent
                        ? 'bg-tertiary-fixed text-on-tertiary-fixed font-bold'
                        : c.actionType === 'primary'
                        ? 'bg-primary text-on-primary hover:bg-primary-container'
                        : 'bg-tertiary text-on-tertiary hover:bg-tertiary-container'
                    }`}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[12px]">
                      {isSent ? 'check_circle' : 'send'}
                    </span>
                    {isSent ? 'Dossier Transmitted!' : c.actionLabel}
                  </button>
                  <a
                    href="tel:104"
                    className="p-1 rounded bg-surface-container text-on-surface hover:bg-surface-container-high transition"
                    title="Call Referral Line"
                  >
                    <span className="material-symbols-outlined text-[14px]">call</span>
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-xs px-sm bg-surface-container-low border-t border-outline-variant/20 flex items-center justify-between">
        <span className="font-label-sm text-[10px] text-on-surface-variant">
          Emergency Helpline: 104 / NER-TeleMed
        </span>
        <span className="font-label-sm text-[10px] text-primary font-bold">
          ICMR SOP-09 Network
        </span>
      </div>
    </aside>
  );
}
