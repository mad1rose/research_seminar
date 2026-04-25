"""Unit tests: profile JSON validation (used by the Flask save-profile API)."""

from __future__ import annotations

import pytest

from src.profile_validation import (
    MIDI_HIGH,
    MIDI_LOW,
    parse_profile_payload,
)


def test_parse_profile_valid_soloish_range() -> None:
    prof, err = parse_profile_payload(
        {
            'min_midi': 60,
            'max_midi': 72,
            'favorite_midis': [64],
            'avoid_midis': [],
            'alpha': 0.25,
        },
    )
    assert err is None
    assert prof is not None
    assert prof['min_midi'] == 60
    assert prof['max_midi'] == 72
    assert prof['favorite_midis'] == [64]
    assert prof['avoid_midis'] == []
    assert prof['alpha'] == 0.25


def test_parse_profile_rejects_non_object() -> None:
    prof, err = parse_profile_payload('not a dict')
    assert prof is None
    assert err is not None


def test_parse_profile_rejects_range_below_midi_window() -> None:
    prof, err = parse_profile_payload(
        {
            'min_midi': 10,
            'max_midi': 20,
            'favorite_midis': [],
            'avoid_midis': [],
        },
    )
    assert prof is None
    assert err is not None
    assert str(MIDI_LOW) in err
    assert str(MIDI_HIGH) in err


def test_parse_profile_rejects_favorite_outside_range() -> None:
    prof, err = parse_profile_payload(
        {
            'min_midi': 60,
            'max_midi': 63,
            'favorite_midis': [72],
            'avoid_midis': [],
        },
    )
    assert prof is None
    assert 'favorite' in (err or '').lower()


def test_parse_profile_rejects_malformed_alpha() -> None:
    prof, err = parse_profile_payload(
        {
            'min_midi': 60,
            'max_midi': 70,
            'favorite_midis': [],
            'avoid_midis': [],
            'alpha': 'not a float',
        },
    )
    assert prof is None
    assert 'alpha' in (err or '').lower()


@pytest.mark.parametrize('alpha,expected', [(1.5, 1.0), (-0.1, 0.0), (0.0, 0.0)])
def test_parse_profile_alpha_clamp(alpha: float, expected: float) -> None:
    prof, err = parse_profile_payload(
        {
            'min_midi': 60,
            'max_midi': 70,
            'favorite_midis': [],
            'avoid_midis': [],
            'alpha': alpha,
        },
    )
    assert err is None
    assert prof is not None
    assert prof['alpha'] == expected
