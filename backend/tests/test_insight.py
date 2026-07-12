from datetime import date

from pydantic import ValidationError

from app.modules.insight.router import CycleIn


def test_audit_date_range():
    assert CycleIn(name="Q3", start_date=date(2026, 7, 1), end_date=date(2026, 7, 31)).name == "Q3"
    try:
        CycleIn(name="Bad", start_date=date(2026, 8, 1), end_date=date(2026, 7, 1))
    except ValidationError:
        pass
    else:
        raise AssertionError("reverse date range accepted")
