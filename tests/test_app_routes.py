"""Flask app route tests: library loading and save-profile contract."""

from __future__ import annotations

import json
from pathlib import Path

import pytest

import app as app_mod


def _write_minimal_library(p: Path) -> None:
    p.parent.mkdir(parents=True, exist_ok=True)
    lib = {
        'songs': [
            {
                'composer': 'Test',
                'title': 'Piece',
                'filename': 'test.mxl',
                'tessituragram': [
                    {
                        'part_id': '0',
                        'part_name': 'S',
                        'tessituragram_data': {'60': 1.0},
                        'statistics': {'foo': 1},
                    }
                ],
            }
        ],
    }
    p.write_text(json.dumps(lib, indent=2), encoding='utf-8')


def test_get_index_503_when_library_missing(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
) -> None:
    missing = tmp_path / 'nope' / 'all_tessituragrams.json'
    monkeypatch.setattr(app_mod, 'get_library_path', lambda: missing)

    client = app_mod.app.test_client()
    r = client.get('/')
    assert r.status_code == 503
    data = r.data.decode('utf-8').lower()
    assert 'library' in data or 'not found' in data or 'unavailable' in data


def test_get_index_200_with_minimal_library(
    monkeypatch: pytest.MonkeyPatch,
    tmp_path: Path,
) -> None:
    lib = tmp_path / 'all_tessituragrams.json'
    _write_minimal_library(lib)
    monkeypatch.setattr(app_mod, 'get_library_path', lambda: lib)

    client = app_mod.app.test_client()
    r = client.get('/')
    assert r.status_code == 200
    data = r.data.decode('utf-8')
    assert 'Solo' in data or 'duet' in data or 'Tessituragram' in data


def test_post_save_profile_invalid_midi_range_returns_400() -> None:
    client = app_mod.app.test_client()
    with client.session_transaction() as sess:  # type: ignore[union-attr]
        sess['num_parts'] = 1
    r = client.post(
        '/api/save-profile/0',
        data=json.dumps(
            {
                'min_midi': 0,
                'max_midi': 10,
                'favorite_midis': [],
                'avoid_midis': [],
                'alpha': 0.0,
            },
        ),
        content_type='application/json',
    )
    assert r.status_code == 400
    body = r.get_json()
    assert body is not None
    assert body.get('ok') is False
    assert 'error' in body


def test_post_save_profile_invalid_type_returns_400() -> None:
    client = app_mod.app.test_client()
    with client.session_transaction() as sess:  # type: ignore[union-attr]
        sess['num_parts'] = 1
    r = client.post(
        '/api/save-profile/0',
        data='""',
        content_type='application/json',
    )
    assert r.status_code == 400
    j = r.get_json()
    assert j is not None
    assert j.get('ok') is False
    assert 'error' in j
