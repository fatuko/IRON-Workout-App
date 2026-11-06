from app.services.frequency import muscles_below_min_frequency


def test_muscle_trained_twice_is_not_flagged():
    split = [["chest"], ["back"], ["chest"]]
    assert muscles_below_min_frequency(split, ["chest"]) == {}


def test_muscle_trained_once_is_flagged_with_count():
    split = [["chest"], ["back"]]
    assert muscles_below_min_frequency(split, ["chest"]) == {"chest": 1}


def test_muscle_never_trained_is_flagged_with_zero():
    split = [["chest"], ["back"]]
    assert muscles_below_min_frequency(split, ["legs"]) == {"legs": 0}


def test_muscle_repeated_within_one_day_counts_once():
    split = [["chest", "chest"]]
    assert muscles_below_min_frequency(split, ["chest"]) == {"chest": 1}


def test_muscle_trained_three_times_is_not_flagged():
    split = [["chest"], ["chest"], ["chest"]]
    assert muscles_below_min_frequency(split, ["chest"]) == {}


def test_muscles_not_in_check_list_are_ignored():
    split = [["chest"], ["back"]]
    assert muscles_below_min_frequency(split, ["chest"]) == {"chest": 1}


def test_only_under_trained_muscles_are_returned():
    split = [["chest", "back"], ["chest"], ["back", "legs"]]
    result = muscles_below_min_frequency(split, ["chest", "back", "legs"])
    assert result == {"legs": 1}


def test_empty_split_flags_every_checked_muscle():
    result = muscles_below_min_frequency([], ["chest", "back"])
    assert result == {"chest": 0, "back": 0}


def test_empty_check_list_returns_empty_dict():
    assert muscles_below_min_frequency([["chest"]], []) == {}