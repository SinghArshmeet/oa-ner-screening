"""Transparent questionnaire scoring for the research prototype.

This is a temporary, explainable fallback while a clinician-labelled
questionnaire dataset is collected. It is not a diagnostic or validated
clinical score.
"""
from __future__ import annotations

from dataclasses import asdict, dataclass


@dataclass(frozen=True)
class QuestionnaireResponse:
    age: int
    pain_0_to_10: int
    stiffness_0_to_10: int
    walking_difficulty: int  # 0 none, 1 mild, 2 moderate, 3 severe
    stairs_difficulty: int   # 0 none, 1 mild, 2 moderate, 3 severe
    previous_knee_injury: bool
    symptoms_weeks: int
    physical_workload: str  # low, moderate, high


@dataclass(frozen=True)
class QuestionnaireResult:
    score: int
    category: str
    contributing_factors: list[str]
    response: QuestionnaireResponse

    def to_dict(self) -> dict:
        return {"score": self.score, "category": self.category, "contributing_factors": self.contributing_factors, **asdict(self.response)}


def score_questionnaire(response: QuestionnaireResponse) -> QuestionnaireResult:
    """Return an explainable prototype risk indication, not a medical result."""
    score = 0
    factors: list[str] = []
    if response.age >= 65:
        score += 3
        factors.append("age 65 or above")
    elif response.age >= 55:
        score += 2
        factors.append("age 55–64")
    elif response.age >= 45:
        score += 1
        factors.append("age 45–54")

    if response.pain_0_to_10 >= 7:
        score += 3
        factors.append("high reported knee pain")
    elif response.pain_0_to_10 >= 4:
        score += 2
        factors.append("moderate reported knee pain")
    elif response.pain_0_to_10 >= 1:
        score += 1

    if response.stiffness_0_to_10 >= 7:
        score += 2
        factors.append("high reported stiffness")
    elif response.stiffness_0_to_10 >= 4:
        score += 1
        factors.append("reported stiffness")

    score += response.walking_difficulty
    score += response.stairs_difficulty
    if response.walking_difficulty >= 2:
        factors.append("moderate or severe walking difficulty")
    if response.stairs_difficulty >= 2:
        factors.append("moderate or severe difficulty using stairs")

    if response.previous_knee_injury:
        score += 2
        factors.append("previous knee injury")
    if response.symptoms_weeks >= 12:
        score += 2
        factors.append("symptoms reported for 12 weeks or more")
    elif response.symptoms_weeks >= 4:
        score += 1
        factors.append("symptoms reported for 4 weeks or more")
    if response.physical_workload == "high":
        score += 1
        factors.append("high physical workload")

    category = "high" if score >= 11 else "moderate" if score >= 6 else "low"
    return QuestionnaireResult(score=score, category=category, contributing_factors=factors, response=response)
