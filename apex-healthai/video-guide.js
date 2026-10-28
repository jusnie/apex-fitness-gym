/**
 * APEX Workout — exercise demo video guides.
 *
 * Reads the baked offline index (video-index.json) produced by
 * scripts/sync-exercise-videos.mjs, so no request ever hits the free API from the
 * client (it is capped at 4 requests per IP in demo mode).
 *
 * Source data: Free Exercise DB — MIT licensed.
 */
(() => {
  'use strict';

  const INDEX_URL = 'video-index.json';

  // Some template movements are generic ("Cable or band row"). Map them to the
  // closest catalogued variation so every workout exercise resolves to a demo.
  const NAME_OVERRIDES = {
    'goblet squat': 'Dumbbell Goblet Squat',
    'dumbbell bench press': 'Dumbbell Incline Bench Press',
    'cable or band row': 'Seated Cable Row (V-Grip)',
    'romanian deadlift': 'Dumbbell Stiff Leg Deadlift',
    'lat pulldown': 'Wide Grip Cable Lat Pulldown',
    'seated shoulder press': 'Seated Dumbbell Shoulder Press',
    'cable row': 'Seated Cable Row (V-Grip)',
    'reverse lunge': 'Dumbbell Lunge',
    'standing calf raise': 'Dumbbell Standing Calf Raise',
    'triceps pressdown': 'Cable Triceps Pushdown',
    'dumbbell curl': 'Dumbbell Biceps Curl',
    'tempo squat': 'Squat',
    'push up': 'Push-Up',
    'backpack row': 'Dumbbell Bent-Over Row',
    'hip bridge': 'Glute Bridge',
    'incline push-up': 'Incline Push-Up',
    'face pull': 'Cable Rear Delt Row (with rope)',
    'accessory movement': 'Squat',
  };

  const normalize = (value) => String(value).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const words = (value) => normalize(value).split(' ').filter(Boolean);

  let indexPath = null;
  let loadPromise = null;
  let byName = new Map();
  let byId = new Map();
  let active = null;

  function buildLookup(index) {
    byName = new Map();
    byId = new Map();
    (index.exercises || []).forEach((exercise) => {
      byName.set(normalize(exercise.name), exercise);
      (exercise.aliases || []).forEach((alias) => {
        const key = normalize(alias);
        if (key && !byName.has(key)) byName.set(key, exercise);
      });
      byId.set(String(exercise.id), exercise);
    });
  }

  function loadIndex() {
    if (loadPromise) return loadPromise;
    loadPromise = fetch(INDEX_URL, { cache: 'force-cache' })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then((index) => {
        indexPath = index;
        buildLookup(index);
        return index;
      })
      .catch((error) => {
        loadPromise = null;
        throw error;
      });
    return loadPromise;
  }

  /** Resolve an exercise name (free text) to a catalogued demo entry. */
  function resolve(exerciseName) {
    if (!byName.size) return null;
    const target = normalize(exerciseName);
    const override = NAME_OVERRIDES[target];
    if (override && byName.has(normalize(override))) return byName.get(normalize(override));

    const direct = byName.get(target);
    if (direct) return direct;

    const targetWords = new Set(words(exerciseName));
    if (!targetWords.size) return null;
    let best = null;
    let bestScore = 0;
    for (const exercise of byId.values()) {
      const candidateWords = new Set(words([exercise.name, ...(exercise.aliases || [])].join(' ')));
      const shared = [...targetWords].filter((word) => candidateWords.has(word)).length;
      const score = shared / targetWords.size;
      if (score > bestScore) {
        bestScore = score;
        best = exercise;
      }
    }
    return bestScore >= 0.75 ? best : null;
  }

  function preferredClip(entry, preference) {
    const order = preference === 'female' ? ['female', 'male'] : ['male', 'female'];
    for (const key of order) {
      if (entry.videos?.[key]) return { url: entry.videos[key], variant: key };
    }
    return null;
  }

  function defaultPreference() {
    try {
      const stored = localStorage.getItem('apex.workout.video-variant.v1');
      if (stored === 'male' || stored === 'female') return stored;
    } catch (_) {}
    return 'male';
  }

  function savePreference(variant) {
    try { localStorage.setItem('apex.workout.video-variant.v1', variant); } catch (_) {}
  }

  function ensureModal() {
    let modal = document.getElementById('video-guide-modal');
    if (modal) return modal;
    modal = document.createElement('section');
    modal.id = 'video-guide-modal';
    modal.className = 'screen-modal video-guide is-hidden';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', 'Exercise demo video');
    modal.innerHTML = `
      <header class="video-guide__header">
        <button class="modal-back" type="button" data-video-close aria-label="Close exercise demo">
          <i class="ph ph-caret-left" aria-hidden="true"></i>
        </button>
        <div><p class="eyebrow">EXERCISE DEMO</p><strong data-video-heading>Movement</strong></div>
        <div class="video-guide__variants" data-video-variants hidden></div>
      </header>
      <div class="video-guide__body">
        <div class="video-guide__frame">
          <video data-video-player playsinline controls loop preload="metadata" poster=""></video>
          <div class="video-guide__skeleton" data-video-skeleton><i class="ph ph-play-circle" aria-hidden="true"></i><span>LOADING DEMO</span></div>
        </div>
        <div class="video-guide__meta">
          <h1 data-video-title>Movement</h1>
          <p data-video-subtitle></p>
          <div class="video-guide__chips" data-video-chips></div>
        </div>
        <section class="video-guide__notes" data-video-notes hidden>
          <p class="eyebrow">FORM CUES</p>
          <ul data-video-cues></ul>
        </section>
        <p class="video-guide__credit">Demo clips: Free Exercise DB (MIT). Streamed on demand.</p>
      </div>`;
    document.body.appendChild(modal);
    return modal;
  }

  function close() {
    const modal = document.getElementById('video-guide-modal');
    if (!modal || !active) return;
    const video = modal.querySelector('[data-video-player]');
    if (video) { video.pause(); video.removeAttribute('src'); video.load(); }
    modal.classList.add('is-hidden');
    document.body.classList.remove('modal-open');
    active = null;
  }

  function setVariant(entry, variant) {
    const modal = ensureModal();
    const video = modal.querySelector('[data-video-player]');
    const clip = preferredClip(entry, variant);
    const skeleton = modal.querySelector('[data-video-skeleton]');
    if (!clip) {
      video.removeAttribute('src');
      if (skeleton) { skeleton.hidden = false; skeleton.querySelector('span').textContent = 'DEMO COMING SOON'; }
      return;
    }
    if (skeleton) skeleton.hidden = true;
    if (video.dataset.current !== clip.url) {
      video.dataset.current = clip.url;
      video.poster = entry.thumbnails?.[clip.variant] || '';
      video.src = clip.url;
      video.load();
      const play = video.play();
      if (play && typeof play.catch === 'function') play.catch(() => {});
    }
    savePreference(clip.variant);
  }

  /** Open the demo sheet for an exercise name. Returns a promise for testing. */
  async function open(exerciseName) {
    const modal = ensureModal();
    modal.querySelector('[data-video-heading]').textContent = exerciseName;
    modal.querySelector('[data-video-title]').textContent = exerciseName;
    modal.querySelector('[data-video-subtitle]').textContent = 'Looking up demo…';
    modal.querySelector('[data-video-chips]').innerHTML = '';
    const notes = modal.querySelector('[data-video-notes]');
    notes.hidden = true;
    const skeleton = modal.querySelector('[data-video-skeleton]');
    if (skeleton) { skeleton.hidden = false; skeleton.querySelector('span').textContent = 'LOADING DEMO'; }
    modal.classList.remove('is-hidden');
    document.body.classList.add('modal-open');
    active = { name: exerciseName };

    try {
      await loadIndex();
    } catch (error) {
      modal.querySelector('[data-video-subtitle]').textContent = 'The offline demo index could not be loaded.';
      if (skeleton) skeleton.querySelector('span').textContent = 'DEMO UNAVAILABLE';
      console.error('[apex] video index failed', error);
      return null;
    }

    const entry = resolve(exerciseName) || resolve(NAME_OVERRIDES[normalize(exerciseName)] || '');
    if (!entry) {
      modal.querySelector('[data-video-subtitle]').textContent =
        'No catalogued demo matches this movement yet.';
      if (skeleton) skeleton.querySelector('span').textContent = 'DEMO COMING SOON';
      modal.querySelector('[data-video-variants]').hidden = true;
      return null;
    }

    modal.querySelector('[data-video-title]').textContent = entry.name;
    modal.querySelector('[data-video-subtitle]').textContent = [
      entry.target ? `${entry.target}` : null,
      entry.equipment ? `${entry.equipment}` : null,
      entry.difficulty ? `${entry.difficulty}` : null,
    ].filter(Boolean).join(' · ');

    modal.querySelector('[data-video-chips]').innerHTML = [
      entry.bodyPart ? `<span class="video-chip">${entry.bodyPart.toUpperCase()}</span>` : '',
      entry.target ? `<span class="video-chip">${entry.target.toUpperCase()}</span>` : '',
    ].filter(Boolean).join('');

    const variants = modal.querySelector('[data-video-variants]');
    const available = ['male', 'female'].filter((key) => entry.videos?.[key]);
    variants.hidden = available.length < 2;
    variants.innerHTML = available
      .map((key) => `<button type="button" class="video-variant${preferredClip(entry, defaultPreference())?.variant === key ? ' is-active' : ''}" data-video-variant="${key}">${key === 'male' ? 'HIM' : 'HER'}</button>`)
      .join('');

    setVariant(entry, defaultPreference());

    const cues = findGuideCues(entry.name);
    if (cues.length) {
      notes.hidden = false;
      modal.querySelector('[data-video-cues]').innerHTML =
        cues.map((cue) => `<li>${cue}</li>`).join('');
    }
    return entry;
  }

  /** Pull form cues from the bundled guide catalog when it is available. */
  function findGuideCues(name) {
    const guides = window.APEX_GUIDES;
    if (!Array.isArray(guides)) return [];
    const target = normalize(name);
    const guide = guides.find((item) => normalize(item.name) === target);
    return (guide?.formCues || []).slice(0, 4);
  }

  function handleClick(event) {
    const closer = event.target.closest('[data-video-close]');
    const variantButton = event.target.closest('[data-video-variant]');
    if (variantButton && active) {
      loadIndex().then(() => {
        const entry = resolve(active.name);
        if (entry) {
          setVariant(entry, variantButton.dataset.videoVariant);
          document.querySelectorAll('[data-video-variant]').forEach((button) =>
            button.classList.toggle('is-active', button === variantButton));
        }
      });
      return;
    }
    if (closer) close();
  }

  document.addEventListener('click', handleClick);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && active) close();
  });

  window.APEXVideoGuide = {
    open,
    close,
    resolve,
    get loaded() { return Boolean(indexPath); },
    get count() { return indexPath?.count ?? 0; },
  };
})();
