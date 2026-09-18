from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


RiskCategory = Literal["low", "moderate", "high"]


class PatientCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=160)
    age: int | None = Field(default=None, ge=0, le=130)
    gender: str | None = Field(default=None, max_length=40)
    occupation: str | None = Field(default=None, max_length=160)
    region: str | None = Field(default=None, max_length=160)
    state: str | None = Field(default=None, max_length=120)
    district: str | None = Field(default=None, max_length=120)
    abha_id: str | None = Field(default=None, max_length=60)
    height_cm: float | None = Field(default=None, ge=50, le=250)
    weight_kg: float | None = Field(default=None, ge=20, le=300)
    bmi: float | None = Field(default=None, ge=10, le=80)
    consent: bool = False


class PatientVitalsUpdate(BaseModel):
    height_cm: float | None = Field(default=None, ge=50, le=250)
    weight_kg: float | None = Field(default=None, ge=20, le=300)
    bmi: float | None = Field(default=None, ge=10, le=80)
    blood_pressure: str | None = Field(default=None, max_length=30)
    affected_joint: str | None = Field(default=None, max_length=120)


class QuestionnairePayload(BaseModel):
    patient_id: int | None = Field(default=None, ge=1)
    age: int = Field(..., ge=18, le=120)
    pain: int = Field(..., ge=0, le=10)
    stiffness: int = Field(..., ge=0, le=90)
    walking_difficulty: int = Field(..., ge=0, le=3)
    stairs_difficulty: int = Field(..., ge=0, le=3)
    squat_difficulty: int = Field(default=0, ge=0, le=3)
    previous_knee_injury: bool = False
    symptom_duration_weeks: int = Field(..., ge=0, le=520)
    workload: Literal["low", "moderate", "high"] = "low"
    tea_plucking: bool = False
    heavy_loads: bool = False
    deep_squatting: bool = False
    slope_walking: bool = False
    cold_damp: bool = False


class AnalysisRequest(BaseModel):
    patient_id: int | None = Field(default=None, ge=1)
    movement_category: RiskCategory
    questionnaire_category: RiskCategory


class DeviceConfig(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    device_type: str = Field(default="esp32-cam", max_length=60)
    ip: str | None = Field(default=None, max_length=255)
    status: str = Field(default="disconnected", max_length=40)
    config_json: str | None = Field(default=None, max_length=20_000)


class ScreeningCreate(BaseModel):
    patient_id: int | None = Field(default=None, ge=1)
    status: Literal["draft", "completed"] = "completed"
    questionnaire_score: int | None = Field(default=None, ge=0, le=40)
    questionnaire_category: str | None = Field(default=None, max_length=60)
    movement_category: str | None = Field(default=None, max_length=60)
    movement_confidence: float | None = Field(default=None, ge=0.0, le=1.0)
    gait_metrics: dict | None = None
    vitals: dict | None = None
    clinical_symptoms: dict | None = None
    clinical_prediction: dict | None = None
    clinical_risk_category: str | None = Field(default=None, max_length=60)
    clinical_probability: float | None = Field(default=None, ge=0.0, le=1.0)
    xray_grade: str | None = Field(default=None, max_length=60)
    combined_result: str | None = Field(default=None, max_length=100)
    recommendation: str | None = Field(default=None, max_length=2_000)
    data_source: str | None = Field(default="backend_model", max_length=60)
    simulation_status: str | None = Field(default="real", max_length=60)
    movement_result: str | None = Field(default=None, max_length=20_000)
    questionnaire_result: str | None = Field(default=None, max_length=20_000)


class ClinicalPredictRequest(BaseModel):
    age: float = 60.0
    sex: int = 1  # 1=Male, 2=Female
    bmi: float = 26.5
    side: int = 1  # 1=Right, 2=Left
    bp_sys: float = 130.0
    bp_dias: float = 85.0
    pain: float = 5.0  # VAS 0-10
    stiffness: float = 30.0  # Mins
    gait_speed: float | None = 0.95  # m/s
    knee_flexion_deg: float | None = 135.0
    knee_deficit_deg: float | None = 10.0

