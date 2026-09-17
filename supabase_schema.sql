-- ==============================================================================
-- OrthoNex India: Comprehensive Supabase PostgreSQL Schema & Storage Setup
-- Run this in your Supabase Project: Dashboard -> SQL Editor -> "New query" -> Run
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PRACTITIONER PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'screener' CHECK (role IN ('screener', 'officer', 'admin')),
    role_badge TEXT DEFAULT 'Station Screener',
    station TEXT DEFAULT 'Safdarjung Hospital OPD Unit, New Delhi',
    staff_id TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read of profiles" ON public.profiles;
CREATE POLICY "Allow public read of profiles" ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow users to update their own profile" ON public.profiles;
CREATE POLICY "Allow users to update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 2. PATIENTS TABLE (Pan-India Cohort with ABHA ID)
CREATE TABLE IF NOT EXISTS public.patients (
    id BIGSERIAL PRIMARY KEY,
    patient_uuid UUID DEFAULT uuid_generate_v4() UNIQUE,
    patient_id_code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    age INTEGER CHECK (age >= 0 AND age <= 130),
    gender TEXT CHECK (gender IN ('Male', 'Female', 'Other')),
    occupation TEXT,
    state TEXT,
    district TEXT,
    locality TEXT,
    abha_id TEXT,
    consent BOOLEAN DEFAULT true,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patients_code ON public.patients(patient_id_code);
CREATE INDEX IF NOT EXISTS idx_patients_abha ON public.patients(abha_id);
CREATE INDEX IF NOT EXISTS idx_patients_state ON public.patients(state);

ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read on patients" ON public.patients;
CREATE POLICY "Allow read on patients" ON public.patients FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow insert on patients" ON public.patients;
CREATE POLICY "Allow insert on patients" ON public.patients FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow update on patients" ON public.patients;
CREATE POLICY "Allow update on patients" ON public.patients FOR UPDATE USING (true);

-- 3. QUESTIONNAIRES TABLE (KOOS-India Surveys)
CREATE TABLE IF NOT EXISTS public.questionnaires (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT REFERENCES public.patients(id) ON DELETE CASCADE,
    pain_vas INTEGER CHECK (pain_vas BETWEEN 0 AND 10),
    stiffness_minutes INTEGER CHECK (stiffness_minutes BETWEEN 0 AND 180),
    walking_difficulty INTEGER CHECK (walking_difficulty BETWEEN 0 AND 3),
    stairs_difficulty INTEGER CHECK (stairs_difficulty BETWEEN 0 AND 3),
    squat_difficulty INTEGER CHECK (squat_difficulty BETWEEN 0 AND 3),
    raw_score INTEGER CHECK (raw_score BETWEEN 0 AND 40),
    category TEXT CHECK (category IN ('low', 'moderate', 'high')),
    contributing_factors TEXT[],
    payload_json JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_questionnaires_patient ON public.questionnaires(patient_id);

ALTER TABLE public.questionnaires ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all read on questionnaires" ON public.questionnaires;
CREATE POLICY "Allow all read on questionnaires" ON public.questionnaires FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow all insert on questionnaires" ON public.questionnaires;
CREATE POLICY "Allow all insert on questionnaires" ON public.questionnaires FOR INSERT WITH CHECK (true);

-- 4. SCREENINGS TABLE (Multimodal Fusion, Gait & X-Ray AI)
CREATE TABLE IF NOT EXISTS public.screenings (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT REFERENCES public.patients(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'completed' CHECK (status IN ('draft', 'completed', 'referred')),
    
    questionnaire_score INTEGER,
    questionnaire_category TEXT,
    
    movement_category TEXT,
    movement_confidence REAL,
    sagittal_deficit_deg REAL,
    walking_velocity REAL,
    cadence REAL,
    gait_metrics JSONB,
    video_url TEXT,
    
    xray_grade TEXT,
    xray_confidence REAL,
    xray_image_url TEXT,
    gradcam_image_url TEXT,
    radiological_findings TEXT,
    
    combined_result TEXT,
    composite_risk_score REAL,
    recommendation TEXT,
    
    data_source TEXT DEFAULT 'supabase_cloud',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_screenings_patient ON public.screenings(patient_id);
CREATE INDEX IF NOT EXISTS idx_screenings_created ON public.screenings(created_at DESC);

ALTER TABLE public.screenings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all read on screenings" ON public.screenings;
CREATE POLICY "Allow all read on screenings" ON public.screenings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow all insert on screenings" ON public.screenings;
CREATE POLICY "Allow all insert on screenings" ON public.screenings FOR INSERT WITH CHECK (true);

-- 5. TELECONSULT REFERRALS TABLE (25-Hospital Tele-Triage Queue)
CREATE TABLE IF NOT EXISTS public.teleconsult_referrals (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT REFERENCES public.patients(id) ON DELETE CASCADE,
    screening_id BIGINT REFERENCES public.screenings(id) ON DELETE SET NULL,
    target_hospital TEXT NOT NULL,
    priority TEXT DEFAULT 'Routine' CHECK (priority IN ('Routine', 'Urgent', 'Emergency', 'Surgical Evaluation')),
    status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Under Review', 'Teleconsult Scheduled', 'Dispatched', 'Completed')),
    clinical_notes TEXT,
    referring_practitioner TEXT,
    scheduled_slot TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referrals_hospital ON public.teleconsult_referrals(target_hospital);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON public.teleconsult_referrals(status);

ALTER TABLE public.teleconsult_referrals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all read on referrals" ON public.teleconsult_referrals;
CREATE POLICY "Allow all read on referrals" ON public.teleconsult_referrals FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow all insert on referrals" ON public.teleconsult_referrals;
CREATE POLICY "Allow all insert on referrals" ON public.teleconsult_referrals FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all update on referrals" ON public.teleconsult_referrals;
CREATE POLICY "Allow all update on referrals" ON public.teleconsult_referrals FOR UPDATE USING (true);

-- 6. STORAGE BUCKETS (Knee X-Rays, Grad-CAM, Gait Videos, Dossiers)
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('knee-xrays', 'knee-xrays', true),
    ('gradcam-overlays', 'gradcam-overlays', true),
    ('gait-videos', 'gait-videos', true),
    ('referral-dossiers', 'referral-dossiers', true)
ON CONFLICT (id) DO NOTHING;

-- 7. SEED INITIAL SAMPLE DATA (Delhi & Noida Patients)
INSERT INTO public.patients (patient_id_code, name, age, gender, occupation, state, district, locality, abha_id, consent)
VALUES
    ('IND-OA-2025-0101', 'Rajesh Khurana', 61, 'Male', 'Corporate Executive', 'Delhi', 'South Delhi', 'Safdarjung Enclave', '91-4821-9034-1182', true),
    ('IND-OA-2025-0102', 'Sunita Sharma', 52, 'Female', 'IT Project Lead', 'Uttar Pradesh', 'Gautam Buddha Nagar', 'Sector 62, Noida', '91-7712-4091-8823', true),
    ('IND-OA-2025-0103', 'Vikramaditya Bhati', 64, 'Male', 'Agrarian Cultivator', 'Uttar Pradesh', 'Gautam Buddha Nagar', 'Kasna, Greater Noida', '91-3398-1245-6671', true),
    ('IND-OA-2025-0104', 'Meenakshi Verma', 56, 'Female', 'Senior Secondary Teacher', 'Delhi', 'Central Delhi', 'Karol Bagh', '91-8842-6190-2345', true),
    ('IND-OA-2025-0105', 'Amit Tyagi', 37, 'Male', 'E-commerce Delivery Fleet Captain', 'Uttar Pradesh', 'Gautam Buddha Nagar', 'Sector 18, Noida', '91-5510-7823-9901', true)
ON CONFLICT (patient_id_code) DO NOTHING;
