import React, { useState } from 'react';

export const INDIAN_STATES_UTS = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi NCR',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry'
];

export const PAN_INDIA_OCCUPATIONS = [
  'Paddy / Wheat Agro-Cultivator (Squatting & Heavy Lift)',
  'Tea Plantation / Mountain Slope Worker',
  'Construction Worker / Heavy Manual Labor',
  'Handloom Weaver / Artisan (Floor Cross-Legged)',
  'Domestic / Anganwadi / Housekeeping Worker',
  'Desk Executive / Sedentary Urban Worker',
  'Senior Citizen / Retired Resident',
  'General Rural / Semi-Urban Resident'
];

export default function EnrollModal({ isOpen, onClose, onEnroll }) {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'Female',
    occupation: 'Paddy / Wheat Agro-Cultivator (Squatting & Heavy Lift)',
    state: 'Punjab',
    region: 'CHC Ludhiana West, Punjab',
    abhaId: '',
    consent: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const PRESETS = [
    {
      label: '🏙️ Delhi Executive (61M, Safdarjung)',
      name: 'Rajesh Khurana',
      age: '61',
      gender: 'Male',
      occupation: 'Desk Executive / Sedentary Urban Worker',
      state: 'Delhi NCR',
      region: 'Safdarjung Enclave OPD, South Delhi',
      abhaId: '91-1120-8849-0123'
    },
    {
      label: '🏢 Noida IT Lead (52F, Sec 62)',
      name: 'Sunita Sharma',
      age: '52',
      gender: 'Female',
      occupation: 'Desk Executive / Sedentary Urban Worker',
      state: 'Uttar Pradesh',
      region: 'Sector 62 Health Center, Noida',
      abhaId: '91-8843-1029-7712'
    },
    {
      label: '🚜 Gr. Noida Cultivator (64M, Kasna)',
      name: 'Vikramaditya Bhati',
      age: '64',
      gender: 'Male',
      occupation: 'Paddy / Wheat Agro-Cultivator (Squatting & Heavy Lift)',
      state: 'Uttar Pradesh',
      region: 'CHC Kasna, Greater Noida',
      abhaId: '91-9034-6612-8823'
    },
    {
      label: '🏫 Delhi Teacher (56F, Karol Bagh)',
      name: 'Meenakshi Verma',
      age: '56',
      gender: 'Female',
      occupation: 'General Rural / Semi-Urban Resident',
      state: 'Delhi NCR',
      region: 'Karol Bagh Health Post, Central Delhi',
      abhaId: '91-2290-7711-4450'
    },
    {
      label: '🛵 Noida Delivery Partner (37M)',
      name: 'Amit Tyagi',
      age: '37',
      gender: 'Male',
      occupation: 'Construction Worker / Heavy Manual Labor',
      state: 'Uttar Pradesh',
      region: 'District Hospital Sector 39, Noida',
      abhaId: '91-7719-2045-6610'
    },
    {
      label: '🌾 Punjab Cultivator (58M)',
      name: 'Gurpreet Singh',
      age: '58',
      gender: 'Male',
      occupation: 'Paddy / Wheat Agro-Cultivator (Squatting & Heavy Lift)',
      state: 'Punjab',
      region: 'CHC Ludhiana West, Punjab',
      abhaId: '91-4452-8921-3310'
    },
    {
      label: '🧵 Tamil Nadu Weaver (54F)',
      name: 'Lakshmi Soundararajan',
      age: '54',
      gender: 'Female',
      occupation: 'Handloom Weaver / Artisan (Floor Cross-Legged)',
      state: 'Tamil Nadu',
      region: 'PHC Kanchipuram, Tamil Nadu',
      abhaId: '91-3829-1940-5521'
    }
  ];

  const applyPreset = (p) => {
    setFormData((prev) => ({
      ...prev,
      name: p.name,
      age: p.age,
      gender: p.gender,
      occupation: p.occupation,
      state: p.state,
      region: p.region,
      abhaId: p.abhaId
    }));
  };

  const generateRandomAbha = () => {
    const part1 = Math.floor(1000 + Math.random() * 9000);
    const part2 = Math.floor(1000 + Math.random() * 9000);
    const part3 = Math.floor(1000 + Math.random() * 9000);
    setFormData((prev) => ({ ...prev, abhaId: `91-${part1}-${part2}-${part3}` }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.age) return;
    setIsSubmitting(true);
    await onEnroll({
      ...formData,
      age: parseInt(formData.age, 10),
      id: `IND-OA-2025-${Math.floor(1000 + Math.random() * 9000)}`
    });
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-md bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-xl bg-surface-container-lowest rounded-2xl shadow-2xl border border-outline-variant/30 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-lg py-md bg-inverse-surface text-surface flex items-center justify-between shrink-0">
          <div className="flex items-center gap-xs">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-[20px]">person_add</span>
            </div>
            <div>
              <h2 className="font-headline-sm text-surface font-bold text-base sm:text-lg">
                Enroll Patient (Pan-India Registry)
              </h2>
              <p className="font-label-sm text-surface-dim text-[11px]">
                ICMR National Musculoskeletal Tele-Triage & ABDM Protocol
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-surface-dim hover:text-white hover:bg-white/10 transition"
            type="button"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* 1-Click Fast Presets Bar */}
        <div className="px-lg pt-3 pb-2 bg-surface-container-low border-b border-surface-container shrink-0">
          <div className="flex items-center justify-between mb-1">
            <span className="font-label-sm text-[10px] text-secondary uppercase font-bold tracking-wider">
              1-Click Pan-India Cohort Presets:
            </span>
            <span className="font-data-mono text-[9px] text-primary font-bold">Pan-India Demographics</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => applyPreset(p)}
                className="px-2 py-1 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-[11px] font-semibold border border-outline-variant/30 transition active:scale-95 flex items-center gap-1"
                title={`Quick fill ${p.name}`}
              >
                <span>{p.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Form Body (Scrollable) */}
        <form onSubmit={handleSubmit} className="p-lg flex flex-col gap-md overflow-y-auto">
          <div>
            <label className="font-label-sm text-[11px] text-on-surface-variant uppercase font-semibold block mb-1">
              Patient Full Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Gurpreet Singh / Lakshmi Soundararajan"
              className="w-full px-md py-2 text-body-md text-on-surface bg-surface-container-low border border-outline-variant/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-md">
            <div>
              <label className="font-label-sm text-[11px] text-on-surface-variant uppercase font-semibold block mb-1">
                Age (Years) *
              </label>
              <input
                type="number"
                min="18"
                max="110"
                required
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                placeholder="54"
                className="w-full px-md py-2 text-body-md text-on-surface bg-surface-container-low border border-outline-variant/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="font-label-sm text-[11px] text-on-surface-variant uppercase font-semibold block mb-1">
                Gender
              </label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-md py-2 text-body-md text-on-surface bg-surface-container-low border border-outline-variant/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* State / UT Selection & ABHA ID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
            <div>
              <label className="font-label-sm text-[11px] text-on-surface-variant uppercase font-semibold block mb-1">
                State / Union Territory *
              </label>
              <select
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-md py-2 text-body-md text-on-surface bg-surface-container-low border border-outline-variant/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {INDIAN_STATES_UTS.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-label-sm text-[11px] text-on-surface-variant uppercase font-semibold block">
                  ABHA ID (Ayushman Bharat)
                </label>
                <button
                  type="button"
                  onClick={generateRandomAbha}
                  className="text-[10px] text-primary hover:underline font-data-mono font-bold"
                >
                  Generate ID
                </button>
              </div>
              <input
                type="text"
                value={formData.abhaId}
                onChange={(e) => setFormData({ ...formData, abhaId: e.target.value })}
                placeholder="91-XXXX-XXXX-XXXX"
                className="w-full px-md py-2 text-body-md font-data-mono text-on-surface bg-surface-container-low border border-outline-variant/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="font-label-sm text-[11px] text-on-surface-variant uppercase font-semibold block mb-1">
              Primary Occupation / Physical Exposure
            </label>
            <select
              value={formData.occupation}
              onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
              className="w-full px-md py-2 text-body-md text-on-surface bg-surface-container-low border border-outline-variant/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {PAN_INDIA_OCCUPATIONS.map((occ) => (
                <option key={occ} value={occ}>
                  {occ}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-label-sm text-[11px] text-on-surface-variant uppercase font-semibold block mb-1">
              Screening PHC / CHC / District Health Center
            </label>
            <input
              type="text"
              value={formData.region}
              onChange={(e) => setFormData({ ...formData, region: e.target.value })}
              placeholder="e.g. CHC Ludhiana West / PHC Kanchipuram"
              className="w-full px-md py-2 text-body-md text-on-surface bg-surface-container-low border border-outline-variant/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <label className="flex items-center gap-xs cursor-pointer p-sm rounded-lg bg-surface-container-low border border-outline-variant/20">
            <input
              type="checkbox"
              checked={formData.consent}
              onChange={(e) => setFormData({ ...formData, consent: e.target.checked })}
              className="w-4 h-4 accent-primary"
            />
            <span className="font-body-sm text-[12px] text-on-surface">
              Patient informed consent recorded (ICMR National Tele-Screening Registry & ABDM)
            </span>
          </label>

          <div className="flex items-center justify-end gap-xs pt-xs border-t border-outline-variant/20 shrink-0">
            <button
              onClick={onClose}
              type="button"
              className="px-md py-2 rounded-lg bg-surface-container text-on-surface hover:bg-surface-container-high font-label-md text-label-md transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.consent}
              className="px-lg py-2 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md font-bold shadow-md transition disabled:opacity-50"
            >
              {isSubmitting ? 'Enrolling...' : 'Confirm Enrollment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
