from __future__ import annotations

import sqlite3
from pathlib import Path


DB_PATH = Path(__file__).resolve().parent / "screening.db"


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, timeout=10)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    conn.execute("PRAGMA journal_mode = WAL")
    return conn


def init_db() -> None:
    conn = get_connection()
    conn.executescript(
        """
        CREATE TABLE IF NOT EXISTS patients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL CHECK(length(trim(name)) BETWEEN 1 AND 160),
            age INTEGER CHECK(age IS NULL OR age BETWEEN 0 AND 130),
            gender TEXT,
            occupation TEXT,
            region TEXT,
            state TEXT,
            district TEXT,
            abha_id TEXT,
            height_cm REAL,
            weight_kg REAL,
            bmi REAL,
            consent INTEGER NOT NULL DEFAULT 0 CHECK(consent IN (0, 1)),
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS questionnaires (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id INTEGER,
            raw_score INTEGER NOT NULL CHECK(raw_score BETWEEN 0 AND 40),
            category TEXT NOT NULL CHECK(category IN ('low', 'moderate', 'high')),
            payload_json TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE SET NULL
        );
        CREATE TABLE IF NOT EXISTS screenings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            patient_id INTEGER,
            status TEXT NOT NULL CHECK(status IN ('draft', 'completed')),
            questionnaire_score INTEGER,
            questionnaire_category TEXT,
            movement_category TEXT,
            movement_confidence REAL,
            gait_metrics_json TEXT,
            xray_grade TEXT,
            combined_result TEXT,
            recommendation TEXT,
            data_source TEXT,
            simulation_status TEXT,
            movement_result TEXT,
            questionnaire_result TEXT,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE SET NULL
        );
        CREATE TABLE IF NOT EXISTS devices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL CHECK(length(trim(name)) BETWEEN 1 AND 120),
            device_type TEXT NOT NULL,
            ip TEXT,
            status TEXT NOT NULL DEFAULT 'disconnected',
            config_json TEXT,
            last_connected TEXT
        );
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL UNIQUE,
            name TEXT NOT NULL,
            picture TEXT,
            sub TEXT UNIQUE,
            role TEXT NOT NULL DEFAULT 'Clinical Screener',
            role_id TEXT NOT NULL DEFAULT 'screener',
            role_badge TEXT NOT NULL DEFAULT 'Station Screener',
            station TEXT NOT NULL DEFAULT 'Diphu PHC, Assam',
            staff_id TEXT,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS sessions (
            session_token TEXT PRIMARY KEY,
            user_id INTEGER NOT NULL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            expires_at INTEGER NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_sessions_expiry ON sessions(expires_at);
        CREATE INDEX IF NOT EXISTS idx_screenings_patient ON screenings(patient_id);
        CREATE INDEX IF NOT EXISTS idx_questionnaires_patient ON questionnaires(patient_id);
        """
    )

    # Safe migration: check if new columns exist in 'patients'
    patient_columns = [row[1] for row in conn.execute("PRAGMA table_info(patients)").fetchall()]
    new_patient_cols = {
        "occupation": "TEXT",
        "state": "TEXT",
        "district": "TEXT",
        "abha_id": "TEXT",
        "height_cm": "REAL",
        "weight_kg": "REAL",
        "bmi": "REAL",
        "assigned_station": "TEXT",
        "triage_status": "TEXT",
        "referral_status": "TEXT",
    }
    for col, col_type in new_patient_cols.items():
        if col not in patient_columns:
            conn.execute(f"ALTER TABLE patients ADD COLUMN {col} {col_type}")

    # Safe migration: check if new columns exist in 'screenings'
    screening_columns = [row[1] for row in conn.execute("PRAGMA table_info(screenings)").fetchall()]
    new_screening_cols = {
        "questionnaire_score": "INTEGER",
        "questionnaire_category": "TEXT",
        "movement_category": "TEXT",
        "movement_confidence": "REAL",
        "gait_metrics_json": "TEXT",
        "xray_grade": "TEXT",
        "data_source": "TEXT",
        "simulation_status": "TEXT",
        "clinical_risk_category": "TEXT",
        "clinical_probability": "REAL",
        "vitals_json": "TEXT",
        "clinical_metrics_json": "TEXT",
    }
    for col, col_type in new_screening_cols.items():
        if col not in screening_columns:
            conn.execute(f"ALTER TABLE screenings ADD COLUMN {col} {col_type}")

    conn.commit()
    conn.close()
