/**
 * OrthoNex India - Supabase Client & Cloud Storage Integration Layer
 * 
 * Provides transparent cloud persistence for:
 * 1. Patients (Demographics, ABHA Health IDs, Pan-India Cohorts)
 * 2. Multimodal Screenings (Biomechanical Gait & Radiographic KL Grades)
 * 3. Questionnaires (KOOS-India Surveys)
 * 4. Storage Buckets (Knee X-rays, Grad-CAM overlays, 8s walk videos)
 * 5. Teleconsultation Referrals (25-Hospital Directory Queue)
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  'https://bpyophwxcxuowlzqbsto.supabase.co';
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJweW9waHd4Y3h1b3dsenFic3RvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2NjE1ODcsImV4cCI6MjEwNTIzNzU4N30.9kjtUFVVP5hs1a28QDgV0rKhpnNLoyf9aVjK9l9bcLw';

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL &&
  SUPABASE_ANON_KEY &&
  SUPABASE_URL.startsWith('https://') &&
  !SUPABASE_URL.includes('your-project-id')
);

export const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

/**
 * Fetch all patients from Supabase, or return null if not configured
 */
export async function fetchPatientsFromSupabase() {
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .order('id', { ascending: false });

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Supabase fetchPatients error:', err);
    return null;
  }
}

/**
 * Insert or register a new patient to Supabase
 */
export async function insertPatientToSupabase(patient) {
  if (!isSupabaseConfigured) return null;
  try {
    const payload = {
      patient_id_code: patient.id || `IND-OA-2025-${Math.floor(1000 + Math.random() * 9000)}`,
      name: patient.name,
      age: parseInt(patient.age, 10) || null,
      gender: patient.gender,
      occupation: patient.occupation,
      state: patient.state || patient.region || 'Delhi NCR',
      district: patient.district || null,
      locality: patient.locality || patient.region || null,
      abha_id: patient.abhaId || patient.abha_id || null,
      consent: patient.consent ?? true,
    };

    const { data, error } = await supabase
      .from('patients')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Supabase insertPatient error:', err);
    return null;
  }
}

/**
 * Save a multimodal screening outcome to Supabase
 */
export async function saveScreeningToSupabase(screening) {
  if (!isSupabaseConfigured) return null;
  try {
    const payload = {
      patient_id: screening.patient_id || screening.patientDbId || null,
      status: screening.status || 'completed',
      questionnaire_score: screening.questionnaire_score ?? screening.survey_score ?? null,
      questionnaire_category: screening.questionnaire_category || null,
      movement_category: screening.movement_category || null,
      movement_confidence: screening.movement_confidence != null ? Number(screening.movement_confidence) : null,
      sagittal_deficit_deg: screening.sagittalDeficit || screening.sagittal_deficit_deg || null,
      walking_velocity: screening.walkingVelocity || screening.walking_velocity || null,
      cadence: screening.cadence != null ? Number(screening.cadence) : null,
      gait_metrics: screening.gait_metrics || (screening.gait_metrics_json ? JSON.parse(screening.gait_metrics_json) : null),
      video_url: screening.videoUrl || screening.video_url || null,
      xray_grade: screening.xray_grade || null,
      xray_confidence: screening.xray_confidence != null ? Number(screening.xray_confidence) : null,
      xray_image_url: screening.xrayImageUrl || screening.xray_image_url || null,
      gradcam_image_url: screening.gradcamImageUrl || screening.gradcam_image_url || null,
      radiological_findings: screening.radiologicalFindings || screening.radiological_findings || null,
      combined_result: screening.combined_result || screening.combined_risk || null,
      composite_risk_score: screening.compositeRiskScore || screening.composite_risk_score || null,
      recommendation: screening.recommendation || 'Standard clinical review protocol',
      data_source: screening.data_source || 'supabase_cloud',
    };

    const { data, error } = await supabase
      .from('screenings')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Supabase saveScreening error:', err);
    return null;
  }
}

/**
 * Save a KOOS-India clinical survey response to Supabase
 */
export async function saveQuestionnaireToSupabase(questionnaire) {
  if (!isSupabaseConfigured) return null;
  try {
    const payload = {
      patient_id: questionnaire.patient_id || questionnaire.patientDbId || null,
      pain_vas: Math.min(10, Math.max(0, parseInt(questionnaire.pain ?? questionnaire.pain_vas ?? 0, 10))),
      stiffness_minutes: Math.min(180, Math.max(0, parseInt(questionnaire.stiffness ?? questionnaire.stiffness_minutes ?? 0, 10))),
      walking_difficulty: Math.min(3, Math.max(0, parseInt(questionnaire.walking_difficulty ?? 0, 10))),
      stairs_difficulty: Math.min(3, Math.max(0, parseInt(questionnaire.stairs_difficulty ?? 0, 10))),
      squat_difficulty: Math.min(3, Math.max(0, parseInt(questionnaire.squat_difficulty ?? 0, 10))),
      raw_score: Math.min(40, Math.max(0, parseInt(questionnaire.raw_score ?? questionnaire.compositeScore ?? 0, 10))),
      category: ['low', 'moderate', 'high'].includes(questionnaire.category) ? questionnaire.category : 'moderate',
      contributing_factors: Array.isArray(questionnaire.contributing_factors) ? questionnaire.contributing_factors : [],
      payload_json: questionnaire,
    };

    const { data, error } = await supabase
      .from('questionnaires')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Supabase saveQuestionnaire error:', err);
    return null;
  }
}

/**
 * Upload a media asset (X-ray, Gait Video, or Clinical Dossier PDF) to a Supabase bucket
 */
export async function uploadMediaToSupabase(bucketName, file, filePath) {
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (error) throw error;

    // Retrieve public URL
    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  } catch (err) {
    console.error(`Supabase upload to ${bucketName} error:`, err);
    return null;
  }
}

/**
 * Dispatch a hospital teleconsult referral to Supabase queue
 */
export async function createReferralInSupabase(referral) {
  if (!isSupabaseConfigured) return null;
  try {
    const payload = {
      patient_id: referral.patientDbId || null,
      screening_id: referral.screeningDbId || null,
      target_hospital: referral.targetHospital,
      priority: referral.priority || 'Routine',
      status: 'Pending',
      clinical_notes: referral.notes || null,
      referring_practitioner: referral.doctorName || 'Station Screener',
    };

    const { data, error } = await supabase
      .from('teleconsult_referrals')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Supabase createReferral error:', err);
    return null;
  }
}

/**
 * Fetch the latest screening record for a patient from Supabase
 */
export async function fetchLatestScreeningFromSupabase(patientId) {
  if (!isSupabaseConfigured || !patientId) return null;
  try {
    const { data, error } = await supabase
      .from('screenings')
      .select('*')
      .eq('patient_id', patientId)
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Supabase fetchLatestScreening error:', err);
    return null;
  }
}

