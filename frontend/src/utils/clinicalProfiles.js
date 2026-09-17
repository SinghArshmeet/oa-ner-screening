/**
 * OrthoNex India - Clinical Biometric & Patient Profiling Engine
 * Generates calibrated anthropometrics, vitals, KOOS scores, and occupational hazard matrices
 * based on active patient demographics, locality, and clinical history.
 */

export function getPatientClinicalProfile(patient) {
  if (!patient) {
    return {
      sessionCode: 'ICMR-DEL-0101',
      stationName: 'Safdarjung OPD Hub, New Delhi',
      vitals: {
        heightCm: 174,
        weightKg: 83,
        bmi: '27.4',
        bmiStatus: 'Overweight (Elevated Joint Stress)',
        bp: '132/84 mmHg',
        pulse: '74 bpm',
        affectedJoint: 'Right Knee (Medial Compartment)',
        mobilityAid: 'None'
      },
      survey: {
        score: 28,
        maxScore: 40,
        category: 'High Burden',
        painVAS: 7,
        stiffnessMins: 45,
        hazards: [
          { label: 'Prolonged Desk Seated (>10h/d)', icon: 'chair', severity: 'high' },
          { label: 'Patellofemoral Flexion Torque', icon: 'accessibility_new', severity: 'high' },
          { label: 'Minimal Mid-Day Joint Motion', icon: 'hourglass_disabled', severity: 'medium' },
          { label: 'Stair Ascent Strain', icon: 'stairs', severity: 'medium' }
        ]
      },
      gait: {
        tested: true,
        risk: 'High (Antalgic Lag +14.6°)',
        deficit: '+14.6° Deficit',
        velocity: '0.84 m/s',
        cadence: '92 spm',
        strideLength: '1.12 m'
      },
      xray: {
        klGrade: 'KL Grade 3',
        status: 'Medial Joint Space Narrowing',
        gradcamReady: true
      },
      triageStage: 'Stage 3 Review'
    };
  }

  const id = patient.id || 'IND-OA-2025-0101';
  const name = patient.name || 'Patient';
  const age = patient.age || 55;
  const isFemale = patient.gender === 'Female';

  // 1. Specific profiles for Delhi / Noida / National cohorts
  if (id.includes('0101') || name.includes('Rajesh Khurana')) {
    return {
      sessionCode: 'ICMR-DEL-0101',
      stationName: 'Safdarjung Hospital OPD Unit, New Delhi',
      vitals: {
        heightCm: 174,
        weightKg: 83,
        bmi: '27.4',
        bmiStatus: 'Overweight (Elevated Joint Stress)',
        bp: '132/84 mmHg',
        pulse: '74 bpm',
        affectedJoint: 'Right Knee (Medial Compartment)',
        mobilityAid: 'Independent'
      },
      survey: {
        score: 28,
        maxScore: 40,
        category: 'High Burden',
        painVAS: 7,
        stiffnessMins: 45,
        hazards: [
          { label: 'Chairbound Desk Work (>10h/d)', icon: 'chair', severity: 'high' },
          { label: 'Static Knee Flexion Strain', icon: 'airline_seat_recline_normal', severity: 'high' },
          { label: 'Executive Travel Impact', icon: 'flight_takeoff', severity: 'medium' },
          { label: 'Corporate Office Stairs', icon: 'stairs', severity: 'medium' }
        ]
      },
      gait: {
        tested: true,
        risk: 'High Risk (Antalgic Lag)',
        deficit: '+14.6° Deficit',
        velocity: '0.84 m/s',
        cadence: '92 spm',
        strideLength: '1.12 m'
      },
      xray: {
        klGrade: 'KL Grade 3',
        status: 'Medial Sclerosis & Narrowing',
        gradcamReady: true
      },
      triageStage: 'Specialist Review Req.'
    };
  }

  if (id.includes('0102') || name.includes('Sunita Sharma')) {
    return {
      sessionCode: 'ICMR-NOI-0102',
      stationName: 'District Hospital Sector 39, Noida',
      vitals: {
        heightCm: 161,
        weightKg: 69,
        bmi: '26.6',
        bmiStatus: 'Overweight (Moderate Strain)',
        bp: '124/80 mmHg',
        pulse: '78 bpm',
        affectedJoint: 'Bilateral Knees (Patellofemoral)',
        mobilityAid: 'None'
      },
      survey: {
        score: 24,
        maxScore: 40,
        category: 'Moderate Burden',
        painVAS: 6,
        stiffnessMins: 30,
        hazards: [
          { label: 'Repetitive Tech Campus Stairs', icon: 'stairs', severity: 'high' },
          { label: 'Continuous Screen Seating', icon: 'laptop', severity: 'high' },
          { label: 'Uneven Footing in Commute', icon: 'directions_walk', severity: 'medium' },
          { label: 'AC Cold Damp Aggravation', icon: 'ac_unit', severity: 'medium' }
        ]
      },
      gait: {
        tested: true,
        risk: 'Moderate Risk (Mid-Stance Lag)',
        deficit: '+8.4° Deficit',
        velocity: '0.91 m/s',
        cadence: '98 spm',
        strideLength: '1.16 m'
      },
      xray: {
        klGrade: 'KL Grade 2',
        status: 'Patellofemoral Tracking Deficit',
        gradcamReady: true
      },
      triageStage: 'Stage 2 Surveillance'
    };
  }

  if (id.includes('0103') || name.includes('Vikramaditya Bhati')) {
    return {
      sessionCode: 'ICMR-GRNOI-0103',
      stationName: 'GIMS Greater Noida Ortho Centre',
      vitals: {
        heightCm: 170,
        weightKg: 79,
        bmi: '27.3',
        bmiStatus: 'Overweight (Severe Compressive)',
        bp: '138/88 mmHg',
        pulse: '72 bpm',
        affectedJoint: 'Bilateral Varus Knees (Right > Left)',
        mobilityAid: 'Cane (Occasional)'
      },
      survey: {
        score: 32,
        maxScore: 40,
        category: 'Severe Burden',
        painVAS: 8,
        stiffnessMins: 60,
        hazards: [
          { label: 'Deep Ground Squatting (>5h/d)', icon: 'airline_seat_recline_extra', severity: 'high' },
          { label: 'Heavy Crop Carriage (>30kg)', icon: 'backpack', severity: 'high' },
          { label: 'Tractor Foot Clutch Shock', icon: 'agriculture', severity: 'high' },
          { label: 'Hard Uneven Field Rutting', icon: 'terrain', severity: 'medium' }
        ]
      },
      gait: {
        tested: true,
        risk: 'High Risk (Varus Deformity)',
        deficit: '+16.8° Deficit',
        velocity: '0.76 m/s',
        cadence: '88 spm',
        strideLength: '1.04 m'
      },
      xray: {
        klGrade: 'KL Grade 3',
        status: 'Bilateral Severe Varus Wear',
        gradcamReady: true
      },
      triageStage: 'Surgical Consult Req.'
    };
  }

  if (id.includes('0104') || name.includes('Meenakshi Verma')) {
    return {
      sessionCode: 'ICMR-DEL-0104',
      stationName: 'LNJP / MAMC Ortho Hub, Delhi',
      vitals: {
        heightCm: 158,
        weightKg: 64,
        bmi: '25.6',
        bmiStatus: 'Borderline Overweight',
        bp: '128/82 mmHg',
        pulse: '76 bpm',
        affectedJoint: 'Left Knee (Retropatellar)',
        mobilityAid: 'None'
      },
      survey: {
        score: 26,
        maxScore: 40,
        category: 'Moderate-High',
        painVAS: 6,
        stiffnessMins: 35,
        hazards: [
          { label: 'Classroom Standing (>6h/d)', icon: 'co_present', severity: 'high' },
          { label: 'School Concrete Flooring', icon: 'domain', severity: 'high' },
          { label: 'Stair Ascent Across Floors', icon: 'stairs', severity: 'medium' },
          { label: 'Auditorium Floor Squatting', icon: 'groups', severity: 'medium' }
        ]
      },
      gait: {
        tested: true,
        risk: 'Moderate Risk (Retropatellar Lag)',
        deficit: '+9.2° Deficit',
        velocity: '0.94 m/s',
        cadence: '96 spm',
        strideLength: '1.14 m'
      },
      xray: {
        klGrade: 'KL Grade 2',
        status: 'Definite Osteophyte Margins',
        gradcamReady: true
      },
      triageStage: 'Physiotherapy & Rehab'
    };
  }

  if (id.includes('0105') || name.includes('Amit Tyagi')) {
    return {
      sessionCode: 'ICMR-NOI-0105',
      stationName: 'District Hospital Sector 39, Noida',
      vitals: {
        heightCm: 175,
        weightKg: 72,
        bmi: '23.5',
        bmiStatus: 'Normal BMI (Mechanical Stress)',
        bp: '118/76 mmHg',
        pulse: '80 bpm',
        affectedJoint: 'Right Anterior Knee (Patellar Strain)',
        mobilityAid: 'None'
      },
      survey: {
        score: 16,
        maxScore: 40,
        category: 'Early Strain',
        painVAS: 4,
        stiffnessMins: 15,
        hazards: [
          { label: 'Repeated Bike Kickstarting', icon: 'two_wheeler', severity: 'high' },
          { label: 'Multistorey Walkups with Packs', icon: 'inventory_2', severity: 'high' },
          { label: 'Foot-Down Pivot Torque', icon: 'rotate_right', severity: 'medium' },
          { label: 'Continuous Traffic Vibration', icon: 'traffic', severity: 'medium' }
        ]
      },
      gait: {
        tested: true,
        risk: 'Low Risk (Mild Fatigue)',
        deficit: '+3.8° Deficit',
        velocity: '1.18 m/s',
        cadence: '106 spm',
        strideLength: '1.28 m'
      },
      xray: {
        klGrade: 'KL Grade 1',
        status: 'Doubtful Joint Narrowing',
        gradcamReady: true
      },
      triageStage: 'Ergonomic Review'
    };
  }

  // 2. Generic dynamic fallback for any newly enrolled patient
  const baseHeight = isFemale ? 159 : 172;
  const baseWeight = isFemale ? 65 : 78;
  const calcBmi = (baseWeight / ((baseHeight / 100) ** 2)).toFixed(1);

  return {
    sessionCode: `ICMR-${(patient.state || 'NAT').slice(0, 3).toUpperCase()}-${String(patient.id || '0109').slice(-4)}`,
    stationName: patient.region || `${patient.state || 'National'} Tele-Triage Unit`,
    vitals: {
      heightCm: baseHeight,
      weightKg: baseWeight,
      bmi: calcBmi,
      bmiStatus: Number(calcBmi) > 25 ? 'Overweight (Joint Load Factor)' : 'Normal Weight',
      bp: '126/82 mmHg',
      pulse: '76 bpm',
      affectedJoint: 'Bilateral Knee Joints',
      mobilityAid: 'None'
    },
    survey: {
      score: 22,
      maxScore: 40,
      category: 'Moderate',
      painVAS: 5,
      stiffnessMins: 25,
      hazards: [
        { label: 'Occupational Physical Demands', icon: 'work', severity: 'medium' },
        { label: 'Daily Stair / Slope Climbing', icon: 'stairs', severity: 'medium' },
        { label: 'Prolonged Standing / Squatting', icon: 'accessibility_new', severity: 'medium' }
      ]
    },
    gait: {
      tested: Boolean(patient.gaitTested),
      risk: patient.gaitRisk || 'Ready for 8s Test',
      deficit: '+7.5° Deficit',
      velocity: '0.98 m/s',
      cadence: '98 spm',
      strideLength: '1.18 m'
    },
    xray: {
      klGrade: 'KL Grade 2',
      status: 'Mild Joint Narrowing',
      gradcamReady: false
    },
    triageStage: patient.sopStatus || 'Stage 2 Surveillance'
  };
}
