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

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

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
      state: patient.state || patient.region,
      district: patient.district,
      locality: patient.locality || null,
      abha_id: patient.abhaId || null,
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
      patient_id: screening.patientDbId || null,
      status: screening.status || 'completed',
      questionnaire_score: screening.questionnaire_score,
      questionnaire_category: screening.questionnaire_category,
      movement_category: screening.movement_category,
      movement_confidence: screening.movement_confidence,
      sagittal_deficit_deg: screening.sagittalDeficit,
      walking_velocity: screening.walkingVelocity,
      cadence: screening.cadence,
      gait_metrics: screening.gait_metrics,
      video_url: screening.videoUrl || null,
      xray_grade: screening.xray_grade,
      xray_confidence: screening.xray_confidence,
      xray_image_url: screening.xrayImageUrl || null,
      gradcam_image_url: screening.gradcamImageUrl || null,
      radiological_findings: screening.radiologicalFindings || null,
      combined_result: screening.combined_result,
      composite_risk_score: screening.compositeRiskScore || null,
      recommendation: screening.recommendation,
      data_source: 'supabase_cloud',
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
      patient_id: questionnaire.patient_id || null,
      pain_vas: questionnaire.pain ?? 0,
      stiffness_minutes: questionnaire.stiffness ?? 0,
      walking_difficulty: questionnaire.walking_difficulty ?? 0,
      stairs_difficulty: questionnaire.stairs_difficulty ?? 0,
      squat_difficulty: questionnaire.squat_difficulty ?? 0,
      raw_score: questionnaire.raw_score ?? 0,
      category: questionnaire.category || 'moderate',
      contributing_factors: questionnaire.contributing_factors || [],
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

