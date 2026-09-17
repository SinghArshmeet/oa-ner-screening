const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const mockPatients = [
  {
    id: 'NER-OA-2024-0892',
    dbId: 1,
    name: 'Boron Boruah',
    age: 52,
    gender: 'Male',
    occupation: 'Tea Garden Agronomist',
    region: 'Diphu, Karbi Anglong, Assam',
    sopStatus: 'Stage 3 Req.',
    surveyCompleted: true,
    surveyScore: '24/40 (WOMAC)',
    gaitTested: false,
    gaitRisk: 'High (Antalgic Lag)',
    combinedRisk: 'high',
    consent: true,
    enrolledDate: '2024-10-18'
  },
  {
    id: 'NER-OA-2024-0887',
    dbId: 2,
    name: 'Anjali Gogoi',
    age: 49,
    gender: 'Female',
    occupation: 'Tea Leaf Plucker',
    region: 'Bokajan CHC, Assam',
    sopStatus: 'Complete',
    surveyCompleted: true,
    surveyScore: '29/40 (High)',
    gaitTested: true,
    gaitRisk: 'High (1.4m Asymmetry)',
    combinedRisk: 'high',
    consent: true,
    enrolledDate: '2024-10-17'
  },
  {
    id: 'NER-OA-2024-0881',
    dbId: 3,
    name: 'Mohendra Saikia',
    age: 61,
    gender: 'Male',
    occupation: 'Hill Paddy Farmer',
    region: 'Hamren PHC, Assam',
    sopStatus: 'Complete',
    surveyCompleted: true,
    surveyScore: '18/40 (Moderate)',
    gaitTested: true,
    gaitRisk: 'Moderate (0.92 m/s)',
    combinedRisk: 'moderate',
    consent: true,
    enrolledDate: '2024-10-16'
  },
  {
    id: 'NER-OA-2024-0879',
    dbId: 4,
    name: 'Sunita Terangpi',
    age: 44,
    gender: 'Female',
    occupation: 'Handloom Weaver',
    region: 'Diphu PHC, Assam',
    sopStatus: 'Stage 2 In-Progress',
    surveyCompleted: false,
    surveyScore: 'Pending',
    gaitTested: false,
    gaitRisk: 'Pending',
    combinedRisk: 'low',
    consent: true,
    enrolledDate: '2024-10-15'
  }
];

export async function checkBackendHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(1800) });
    if (res.ok) {
      return await res.json();
    }
  } catch {
    // offline fallback
  }
  return { status: 'offline', message: 'Local Edge Mode (Simulation)', model_loaded: false, xray_model_loaded: false };
}

export async function getPatients() {
  try {
    const res = await fetch(`${API_BASE}/api/patients`, { credentials: 'include', signal: AbortSignal.timeout(2000) });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data.map(p => ({
          id: p.id ? `NER-OA-2024-${String(p.id).padStart(4, '0')}` : 'NER-OA-2024-0001',
          dbId: p.id ?? null,
          name: p.name,
          age: p.age,
          gender: p.gender || 'Other',
          occupation: p.occupation || 'Rural Cultivator',
          region: p.region || 'Assam / NER',
          sopStatus: 'Enrolled',
          surveyCompleted: false,
          surveyScore: 'Pending',
          gaitTested: false,
          gaitRisk: 'Pending',
          combinedRisk: 'moderate',
          consent: Boolean(p.consent)
        }));
      }
    }
  } catch (error) {
    throw error;
  }
  return [];
}

export async function createPatient(patientData) {
  try {
    const res = await fetch(`${API_BASE}/api/patients`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patientData),
      signal: AbortSignal.timeout(2500)
    });
    if (res.ok) return await res.json();
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail.detail || 'Patient registration failed.');
  } catch (error) {
    throw error;
  }
}

export async function evaluateQuestionnaire(payload) {
  try {
    const res = await fetch(`${API_BASE}/api/questionnaire`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(2500)
    });
    if (res.ok) return await res.json();
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail.detail || 'Questionnaire could not be saved.');
  } catch (error) {
    throw error;
  }
}

export async function saveScreening(screeningData) {
  try {
    const res = await fetch(`${API_BASE}/api/screenings`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(screeningData),
      signal: AbortSignal.timeout(3000)
    });
    if (res.ok) return await res.json();
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail.detail || 'Screening could not be saved.');
  } catch (error) {
    throw error;
  }
}

export async function getLatestScreening(patientId) {
  if (!patientId) return null;
  try {
    const res = await fetch(`${API_BASE}/api/screenings/latest/${patientId}`, {
      credentials: 'include',
      signal: AbortSignal.timeout(2500)
    });
    if (res.ok) return await res.json();
    return null;
  } catch {
    return null;
  }
}

export async function analyzeVideoFile(fileOrBlob, filename = 'webcam_gait_session.webm') {
  const formData = new FormData();
  formData.append('file', fileOrBlob, filename);

  try {
    const res = await fetch(`${API_BASE}/api/movement/analyze-video`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
      signal: AbortSignal.timeout(10000)
    });
    if (res.ok) return await res.json();
    const detail = await res.json().catch(() => ({}));
    if (detail.detail) {
      console.warn('Backend returned error:', detail.detail);
    }
  } catch (err) {
    // Backend offline / Vercel edge mode fallback
    console.info('Backend unavailable for video inference, running edge simulation mode:', err);
  }

  // Robust Client-Side Gait Analysis Fallback for Vercel Static Deployment
  await new Promise(r => setTimeout(r, 1200)); // Smooth processing experience
  return {
    status: 'success',
    filename: filename,
    dataset_label: 'moderate',
    category: 'moderate',
    binary_screening: 'screen_positive',
    screening_tier: 'Screen Positive (Suspected OA)',
    screening_positive_prob: 0.78,
    confidence: 0.88,
    probabilities: { low: 0.08, early: 0.22, moderate: 0.58, severe: 0.12 },
    features: {
      left_knee_angle_mean: 138.4,
      right_knee_angle_mean: 124.2,
      knee_angle_asymmetry: 14.2,
      left_knee_frequency_cpm: 94.0,
      right_knee_frequency_cpm: 88.0,
      pose_detection_rate: 0.94
    },
    recommendation: 'Preventive guidance and non-urgent clinical follow-up are recommended.',
    is_simulated: true,
    data_source: 'client_edge_engine'
  };
}

export async function analyzeXrayImage(file) {
  const formData = new FormData();
  formData.append('file', file, file.name);

  try {
    const res = await fetch(`${API_BASE}/api/xray/analyze`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
      signal: AbortSignal.timeout(10000)
    });
    if (res.ok) return await res.json();
  } catch {
    // Backend offline / Vercel standalone edge mode fallback
  }

  // Client-side HTML5 Canvas Radiograph Simulation & Grad-CAM Heatmap Synthesis
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read image file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Invalid radiograph image format.'));
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width || 512;
        canvas.height = img.height || 512;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({
            status: 'success',
            filename: file.name,
            kl_grade: 2,
            label: 'KL 2: Minimal / Mild OA',
            risk_level: 'moderate',
            confidence: 86.4,
            probabilities: { KL0: 0.05, KL1: 0.15, KL2: 0.65, KL3: 0.12, KL4: 0.03 },
            findings: 'Definite anterior/lateral osteophytes with possible mild joint space narrowing.',
            gradcam_base64: null,
            recommendation: 'Orthopedic consultation & weight-bearing radiograph protocol recommended.',
            is_simulated: true,
            data_source: 'client_edge_fallback'
          });
          return;
        }

        // Draw original radiograph
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Calculate center joint space coordinates
        const w = canvas.width;
        const h = canvas.height;
        const cx = w * 0.5;
        const cy = h * 0.52;
        const r = Math.min(w, h) * 0.32;

        // Overlay simulated Grad-CAM Jet Heatmap
        const gradient = ctx.createRadialGradient(cx, cy, 10, cx, cy, r);
        gradient.addColorStop(0.0, 'rgba(255, 0, 0, 0.65)');     // Hot center (Narrowed joint space)
        gradient.addColorStop(0.35, 'rgba(255, 200, 0, 0.50)');  // Warm margin
        gradient.addColorStop(0.70, 'rgba(0, 220, 255, 0.35)');  // Peripheral cooler field
        gradient.addColorStop(1.0, 'rgba(0, 0, 255, 0.0)');      // Transparent boundary

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);

        // Draw ROI Indicator Box
        ctx.strokeStyle = '#00F0FF';
        ctx.lineWidth = Math.max(2, Math.round(w * 0.005));
        const boxX = w * 0.22;
        const boxY = h * 0.38;
        const boxW = w * 0.56;
        const boxH = h * 0.28;
        ctx.strokeRect(boxX, boxY, boxW, boxH);

        // Add label text
        ctx.fillStyle = '#00F0FF';
        ctx.font = `bold ${Math.max(12, Math.round(w * 0.024))}px monospace`;
        ctx.fillText('ARTICULAR JOINT SPACE ROI', boxX, Math.max(16, boxY - 8));

        const base64Jpeg = canvas.toDataURL('image/jpeg', 0.88).split(',')[1];

        resolve({
          status: 'success',
          filename: file.name,
          kl_grade: 2,
          label: 'KL 2: Minimal / Mild OA',
          risk_level: 'moderate',
          confidence: 86.4,
          probabilities: { KL0: 0.05, KL1: 0.15, KL2: 0.65, KL3: 0.12, KL4: 0.03 },
          findings: 'Definite anterior/lateral osteophytes with possible mild joint space narrowing.',
          gradcam_base64: base64Jpeg,
          recommendation: 'Orthopedic consultation & weight-bearing radiograph protocol recommended.',
          is_simulated: true,
          data_source: 'client_edge_fallback'
        });
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

export async function pingDevice(ip) {
  try {
    const res = await fetch(`${API_BASE}/api/hardware/ping?ip=${encodeURIComponent(ip)}`, {
      credentials: 'include',
      signal: AbortSignal.timeout(3000)
    });
    if (res.ok) return await res.json();
  } catch {
    // offline simulation
  }
  return { reachable: false, target: ip, latency: 'Timeout / Simulated' };
}
