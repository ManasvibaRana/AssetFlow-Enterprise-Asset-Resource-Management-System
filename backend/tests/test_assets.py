from app.modules.assets.router import AllocateIn


def test_allocation_requires_exactly_one_holder():
    assert AllocateIn(holder_emp_id=7).holder_emp_id == 7
    for values in ({}, {"holder_emp_id": 1, "holder_dept_id": 2}):
        try: AllocateIn(**values)
        except ValueError: pass
        else: raise AssertionError("invalid holder combination accepted")
