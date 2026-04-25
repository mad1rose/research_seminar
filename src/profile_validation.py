"""Profile JSON validation (shared by Flask and tests; matches piano / API contract)."""

from __future__ import annotations

MIDI_LOW = 21
MIDI_HIGH = 108


def parse_profile_payload(data: object) -> tuple[dict | None, str | None]:
    """Validate JSON body for save-profile. Returns (profile_dict, error_message)."""
    if not isinstance(data, dict):
        return None, 'Expected a JSON object'

    try:
        lo = int(data['min_midi'])
        hi = int(data['max_midi'])
    except (KeyError, TypeError, ValueError):
        return None, 'min_midi and max_midi must be integers'

    if not (MIDI_LOW <= lo <= hi <= MIDI_HIGH):
        return None, f'Range must satisfy {MIDI_LOW} <= min_midi <= max_midi <= {MIDI_HIGH}'

    raw_fav = data.get('favorite_midis', [])
    raw_avoid = data.get('avoid_midis', [])
    if not isinstance(raw_fav, list) or not isinstance(raw_avoid, list):
        return None, 'favorite_midis and avoid_midis must be arrays'

    fav: list[int] = []
    avoid: list[int] = []
    for label, arr, out_list in (
        ('favorite_midis', raw_fav, fav),
        ('avoid_midis', raw_avoid, avoid),
    ):
        for x in arr:
            try:
                m = int(x)
            except (TypeError, ValueError):
                return None, f'{label} must contain only integers'
            if not (MIDI_LOW <= m <= MIDI_HIGH):
                return None, f'{label} MIDI values must be between {MIDI_LOW} and {MIDI_HIGH}'
            if not (lo <= m <= hi):
                return None, f'{label} notes must lie within the vocal range'
            out_list.append(m)

    try:
        alpha = float(data.get('alpha', 0.0))
    except (TypeError, ValueError):
        return None, 'alpha must be a number'
    alpha = max(0.0, min(1.0, alpha))

    return {
        'min_midi': lo,
        'max_midi': hi,
        'favorite_midis': fav,
        'avoid_midis': avoid,
        'alpha': alpha,
    }, None
