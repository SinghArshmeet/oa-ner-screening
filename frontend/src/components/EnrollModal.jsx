import React, { useState } from 'react';

export default function EnrollModal({ isOpen, onClose, onEnroll }) {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'Female',
    occupation: 'Tea Leaf Plucker',
    region: 'Diphu, Karbi Anglong, Assam',
    consent: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.age) return;
    setIsSubmitting(true);
    await onEnroll({
      ...formData,
      age: parseInt(formData.age, 10),
      id: `NER-OA-2024-${Math.floor(1000 + Math.random() * 9000)}`
    });
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-md bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-surface-container-lowest rounded-2xl shadow-2xl border border-outline-variant/30 overflow-hidden">
        {/* Header */}
        <div className="px-lg py-md bg-inverse-surface text-surface flex items-center justify-between">
          <div className="flex items-center gap-xs">
            <span className="material-symbols-outlined text-[22px] text-primary-fixed">person_add</span>
            <div>
              <h2 className="font-headline-sm text-surface font-bold">Enroll Rural Clinic Patient</h2>
              <p className="font-label-sm text-surface-dim text-[11px]">ICMR-NER Osteoarthritis Screening Protocol</p>
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-lg flex flex-col gap-md">
          <div>
            <label className="font-label-sm text-[11px] text-on-surface-variant uppercase font-semibold block mb-1">
              Patient Full Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Boron Boruah / Anjali Gogoi"
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
                placeholder="52"
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

          <div>
            <label className="font-label-sm text-[11px] text-on-surface-variant uppercase font-semibold block mb-1">
              Primary Occupation / Agro-Exposure
            </label>
            <select
              value={formData.occupation}
              onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
              className="w-full px-md py-2 text-body-md text-on-surface bg-surface-container-low border border-outline-variant/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="Tea Leaf Plucker">Tea Leaf Plucker (&gt;8h/day carry)</option>
              <option value="Tea Garden Agronomist">Tea Garden Agronomist</option>
              <option value="Hillside Paddy Farmer">Hillside Paddy Farmer (Terrace/Slopes)</option>
              <option value="Handloom Artisan">Handloom Artisan (Prolonged Sitting)</option>
              <option value="Forestry & Firewood Collector">Forestry & Firewood Collector</option>
              <option value="General Rural Resident">General Rural Resident</option>
            </select>
          </div>

          <div>
            <label className="font-label-sm text-[11px] text-on-surface-variant uppercase font-semibold block mb-1">
              Screening PHC / District Clinic
            </label>
            <input
              type="text"
              value={formData.region}
              onChange={(e) => setFormData({ ...formData, region: e.target.value })}
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
              Patient informed consent recorded (ICMR SOP-09 screening registry)
            </span>
          </label>

          <div className="flex items-center justify-end gap-xs pt-xs border-t border-outline-variant/20">
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
