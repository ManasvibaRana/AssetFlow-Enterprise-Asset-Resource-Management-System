from app.modules.assets.router import AllocateIn


def test_allocation_requires_exactly_one_holder():
    assert AllocateIn(holder_emp_id="employee-id").holder_emp_id == "employee-id"
    for values in ({}, {"holder_emp_id": "employee-id", "holder_dept_id": "department-id"}):
        try: AllocateIn(**values)
        except ValueError: pass
        else: raise AssertionError("invalid holder combination accepted")
