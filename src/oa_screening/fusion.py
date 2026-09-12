from __future__ import annotations


def fuse_screening(movement_category: str, questionnaire_category: str) -> tuple[str, str]:
    """Conservative, explainable late fusion for the prototype."""
    categories = {movement_category, questionnaire_category}
    if "high" in categories:
        return "high", "Clinical evaluation recommended."
    if categories == {"low"}:
        return "low", "Continue monitoring and consider preventive guidance."
    return "moderate", "Preventive guidance and non-urgent clinical follow-up are recommended."
