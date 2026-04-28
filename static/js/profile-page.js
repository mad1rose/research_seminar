(function () {
  'use strict';

  function readNav() {
    const w = window.__profileNav;
    if (!w || !w.saveProfileUrl || !w.navBackUrl || !w.navNextUrl) {
      throw new Error('Profile page navigation config missing');
    }
    return w;
  }

  function init() {
    const { saveProfileUrl, navBackUrl, navNextUrl } = readNav();
    const alphaSlider = document.getElementById('alpha-slider');
    const alphaValue = document.getElementById('alpha-value');
    const saveErrorEl = document.getElementById('profile-save-error');
    const btnBack = document.getElementById('btn-back');
    const btnNext = document.getElementById('btn-next');

    if (!alphaSlider || !alphaValue || !btnBack || !btnNext) return;

    function showSaveError(message) {
      if (!saveErrorEl) return;
      saveErrorEl.textContent = message;
      saveErrorEl.hidden = false;
      saveErrorEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    function clearSaveError() {
      if (!saveErrorEl) return;
      saveErrorEl.textContent = '';
      saveErrorEl.hidden = true;
    }

    alphaSlider.addEventListener('input', () => {
      alphaValue.textContent = parseFloat(alphaSlider.value).toFixed(2);
      clearSaveError();
    });

    function gatherProfileData() {
      return {
        min_midi: pianoState.rangeStart,
        max_midi: pianoState.rangeEnd,
        favorite_midis: Array.from(pianoState.favorites).sort((a, b) => a - b),
        avoid_midis: Array.from(pianoState.avoids).sort((a, b) => a - b),
        alpha: parseFloat(alphaSlider.value),
      };
    }

    async function saveAndNavigate(url) {
      clearSaveError();
      const needsSave =
        pianoState.rangeStart !== null && pianoState.rangeEnd !== null;
      if (needsSave) {
        btnBack.disabled = true;
        btnNext.disabled = true;
        try {
          const data = gatherProfileData();
          const res = await fetch(saveProfileUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });
          let msg = 'Could not save your profile. Please try again.';
          try {
            const body = await res.json();
            if (body && body.error) msg = body.error;
          } catch (_) {
            /* ignore */
          }
          if (!res.ok) {
            showSaveError(msg);
            btnBack.disabled = false;
            updateNextButton();
            return;
          }
        } catch (_) {
          showSaveError(
            'Network error while saving. Check your connection and try again.',
          );
          btnBack.disabled = false;
          updateNextButton();
          return;
        }
      }
      window.location.href = url;
    }

    btnBack.addEventListener('click', () => {
      saveAndNavigate(navBackUrl);
    });

    btnNext.addEventListener('click', () => {
      saveAndNavigate(navNextUrl);
    });

    function updateNextButton() {
      btnNext.disabled =
        pianoState.rangeStart === null || pianoState.rangeEnd === null;
    }

    window.updateNextButton = updateNextButton;
  }

  function initInputTabs() {
    const tabPiano = document.getElementById('tab-piano');
    const tabStaff = document.getElementById('tab-staff');
    const panelPiano = document.getElementById('input-piano');
    const panelStaff = document.getElementById('input-staff');
    if (!tabPiano || !tabStaff || !panelPiano || !panelStaff) return;

    function selectPiano() {
      tabPiano.classList.add('active');
      tabStaff.classList.remove('active');
      tabPiano.setAttribute('aria-selected', 'true');
      tabStaff.setAttribute('aria-selected', 'false');
      panelPiano.hidden = false;
      panelStaff.hidden = true;
      requestAnimationFrame(() => {
        if (typeof scrollPianoToRangeCenter === 'function') scrollPianoToRangeCenter();
      });
    }

    function selectStaff() {
      tabStaff.classList.add('active');
      tabPiano.classList.remove('active');
      tabStaff.setAttribute('aria-selected', 'true');
      tabPiano.setAttribute('aria-selected', 'false');
      panelStaff.hidden = false;
      panelPiano.hidden = true;
      if (typeof buildStaff === 'function') buildStaff();
      if (typeof refreshStaffNotes === 'function') refreshStaffNotes();
    }

    tabPiano.addEventListener('click', selectPiano);
    tabStaff.addEventListener('click', selectStaff);
  }

  /* Run synchronously after piano.js so window.updateNextButton exists before
     piano.js's DOMContentLoaded handler (buildPiano / loadExisting) runs. */
  init();
  initInputTabs();
})();

