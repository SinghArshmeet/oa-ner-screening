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
      signal: AbortSignal.timeout(60000)
    });
    if (res.ok) return await res.json();
    const detail = await res.json().catch(() => ({}));
    throw new Error(detail.detail || 'Movement analysis could not be completed.');
  } catch (err) {
    console.warn('Backend video analysis error:', err);
    throw err;
  }
}

export async function analyzeXrayImage(file) {
  const formData = new FormData();
  formData.append('file', file, file.name);

  try {
    const res = await fetch(`${API_BASE}/api/xray/analyze`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
      signal: AbortSignal.timeout(20000)
    });
    if (res.ok) return await res.json();
    const detail = await res.json().catch(() => ({}));
    if (res.status === 501) {
      return {
        assessed: false,
        message: detail.detail || 'X-ray: Not assessed (model checkpoint not available)',
        is_simulated: false
      };
    }
    throw new Error(detail.detail || 'X-ray analysis could not be completed.');
  } catch (err) {
    if (err.message?.includes('Not assessed') || err.message?.includes('not trained')) {
      return { assessed: false, message: err.message, is_simulated: false };
    }
    throw err;
  }
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
