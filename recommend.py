"""Rule-based personalised recommendations.

Each scheme has structured fields (target_group, age range, income ceiling,
gender, state). We score the match with the user's optional profile and attach
a plain-language reason. This never says a user IS eligible, only that a
scheme "may be relevant".
"""
INCOME_UPPER_LAKH = {"below_1": 1, "1_3": 3, "3_6": 6, "6_9": 9, "9_12": 12, "above_12": 999}
AGE_MID = {"under_18": 12, "18_25": 22, "26_40": 33, "41_59": 50, "60_plus": 65}
# profile category -> scheme target_group values that match it
CATEGORY_MATCH = {
    "farmer": {"farmer", "rural_household", "low_income_family"},
    "student": {"student"},
    "senior_citizen": {"senior_citizen"},
    "employee": {"unorganised_worker"},
    "business_owner": {"entrepreneur", "unorganised_worker"},
    "unemployed": {"rural_household", "unorganised_worker"},
    "woman": {"girl_child"},
    "homemaker": {"low_income_family", "urban_household"},
}
OCCUPATION_KEYWORDS = {"farmer": "farmer", "student": "student", "labour": "unorganised_worker",
                       "worker": "unorganised_worker", "self-employed": "unorganised_worker"}


def recommend(profile: dict, schemes: list[dict], limit: int = 8) -> list[dict]:
    results = []
    cat = (profile.get("category") or "").lower()
    occ = (profile.get("occupation") or "").lower()
    state = (profile.get("state") or "").strip().lower()
    age = AGE_MID.get(profile.get("age_group") or "")
    income_cap = INCOME_UPPER_LAKH.get(profile.get("income_range") or "")
    gender = (profile.get("gender") or "").lower()

    wanted_groups = set(CATEGORY_MATCH.get(cat, set()))
    for keyword, group in OCCUPATION_KEYWORDS.items():
        if keyword in occ:
            wanted_groups.add(group)

    for s in schemes:
        score, reasons = 0, []
        if s.get("target_group") in wanted_groups:
            score += 3
            reasons.append(f"it is aimed at the group '{s['target_group'].replace('_', ' ')}', which matches your profile")
        if age is not None:
            lo, hi = s.get("min_age"), s.get("max_age")
            if (lo is not None or hi is not None):
                if (lo is None or age >= lo) and (hi is None or age <= hi):
                    score += 1
                    reasons.append("your age group falls within the stated age range")
                else:
                    score -= 2
        if income_cap is not None and s.get("income_max_lakh") is not None:
            if income_cap <= s["income_max_lakh"]:
                score += 2
                reasons.append(f"your income range is within the stated ceiling of about Rs {s['income_max_lakh']} lakh")
            else:
                score -= 2
        if s.get("gender") == "female":
            if gender in ("female", "woman"):
                score += 2
                reasons.append("it is meant for girls and women")
            elif gender:
                score -= 3
        if state and s.get("state") and "all india" not in s["state"].lower():
            if state in s["state"].lower():
                score += 1
                reasons.append("it applies in your state")
        if score > 0:
            results.append({**s, "match_score": score,
                            "reason": "This scheme may be relevant because " + "; and ".join(reasons) + "."})
    results.sort(key=lambda r: r["match_score"], reverse=True)
    return results[:limit]
