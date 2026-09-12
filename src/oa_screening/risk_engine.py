from __future__ import annotations

from dataclasses import dataclass


CATEGORY_ORDER = {"low": 0, "moderate": 1, "high": 2}


@dataclass(frozen=True)
class ScreeningOutcome:
    movement_category: str
    questionnaire_category: str
    combined_category: str
    recommendation: str
    explanation: str


def normalize_category(value: str) -> str:
    """Normalize a category label to one of the prototype categories."""
    cleaned = str(value).strip().lower()
    if cleaned in {"low", "moderate", "high"}:
        return cleaned
    if cleaned in {"early", "moderate", "severe"}:
        return {"early": "moderate", "severe": "high"}[cleaned]
    raise ValueError(f"Unsupported category: {value!r}")


def category_from_score(score: float, *, low_threshold: float = 3.0, high_threshold: float = 7.0) -> str:
    """Translate a numeric score to the screening categories used by the app."""
    if score <= low_threshold:
        return "low"
    if score >= high_threshold:
        return "high"
    return "moderate"


def recommendation_for(category: str) -> str:
    """Return the screening recommendation associated with each category."""
    category = normalize_category(category)
    if category == "low":
        return "Continue monitoring and consider preventive guidance."
    if category == "moderate":
        return "Preventive guidance and non-urgent clinical follow-up are recommended."
    return "Clinical evaluation recommended."


def combine_screening(
    movement_category: str,
    questionnaire_category: str,
    *,
    movement_score: float | None = None,
    questionnaire_score: float | None = None,
) -> ScreeningOutcome:
    """Combine movement and questionnaire indications with a conservative rule.

    This mirrors the project philosophy: keep module results visible and use a
    transparent late-fusion rule that avoids hiding a high-risk signal from either
    side.
    """
    movement = normalize_category(movement_category)
    questionnaire = normalize_category(questionnaire_category)

    if movement == "high" or questionnaire == "high":
        combined = "high"
        explanation = "At least one module indicated a high risk, so the combined screening result is high risk."
    elif movement == "low" and questionnaire == "low":
        combined = "low"
        explanation = "Both movement and questionnaire results were low risk."
    else:
        combined = "moderate"
        explanation = "The modules disagree or are mixed, so the combined screening result is moderate risk."

    return ScreeningOutcome(
        movement_category=movement,
        questionnaire_category=questionnaire,
        combined_category=combined,
        recommendation=recommendation_for(combined),
        explanation=explanation,
    )
