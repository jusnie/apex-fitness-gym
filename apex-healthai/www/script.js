(() => {
  'use strict';

  const INTRO_KEY = 'apex.workout.intro.completed.v1';
  const PROFILE_KEY = 'apex.workout.profile.v1';
  const SESSION_KEY = 'apex.workout.sessions.v1';
  const ACTIVE_WORKOUT_KEY = 'apex.workout.active-session.v1';
  const MEAL_KEY = 'apex.workout.meals.v1';
  const TOTAL_STEPS = 7;
  const defaultProfile = { name: '', photo: '', unit: 'kg', age: 26, height: 175, weight: 75, frequency: 4, location: 'gym', complete: false };
  const templateLibrary = {
    full: { title: 'Full Body Foundation', label: 'APEX FOUNDATION', description: 'A balanced strength session for the whole body.', icon: 'ph-barbell', exercises: [['Goblet squat', '3 x 8–10', 18], ['Dumbbell bench press', '3 x 8–10', 16], ['Cable or band row', '3 x 10–12', 20], ['Romanian deadlift', '3 x 8–10', 30]] },
    upper: { title: 'Upper Strength', label: 'UPPER BODY', description: 'Press, pull, and build a stronger upper body.', icon: 'ph-arrows-out-cardinal', exercises: [['Dumbbell bench press', '3 x 8–10', 16], ['Lat pulldown', '3 x 8–10', 28], ['Seated shoulder press', '3 x 10', 14], ['Cable row', '3 x 10–12', 24]] },
    lower: { title: 'Lower Strength', label: 'LOWER BODY', description: 'A focused lower-body session for strength and control.', icon: 'ph-activity', exercises: [['Goblet squat', '3 x 8–10', 18], ['Romanian deadlift', '3 x 8–10', 30], ['Reverse lunge', '3 x 10', 12], ['Standing calf raise', '3 x 12–15', 0]] },
    push: { title: 'Push Focus', label: 'UPPER BODY', description: 'A targeted chest, shoulder, and triceps session.', icon: 'ph-arrow-up-right', exercises: [['Dumbbell bench press', '4 x 8', 16], ['Seated shoulder press', '3 x 10', 14], ['Incline push-up', '3 x 10–12', 0], ['Triceps pressdown', '3 x 12', 16]] },
    pull: { title: 'Pull Focus', label: 'UPPER BODY', description: 'A back and biceps session built for quality reps.', icon: 'ph-arrow-down-left', exercises: [['Lat pulldown', '4 x 8', 28], ['Cable row', '3 x 10', 24], ['Dumbbell curl', '3 x 12', 8], ['Face pull', '3 x 12', 12]] },
    home: { title: 'Home Strength', label: 'HOME TRAINING', description: 'A simple session adapted to limited equipment.', icon: 'ph-house-line', exercises: [['Tempo squat', '3 x 12', 0], ['Push-up', '3 x 8–12', 0], ['Backpack row', '3 x 12', 10], ['Hip bridge', '3 x 15', 0]] },
  };

  let profile = loadProfile();
  let sessions = loadList(SESSION_KEY);
  let meals = loadList(MEAL_KEY);
  let activeWorkout = loadObject(ACTIVE_WORKOUT_KEY);
  let currentStep = 0;
  let activePage = 'home';
  let toastTimer;
  let workoutClock;
  let restTimer;
  let restRemaining = 90;

  function $(selector) { return document.querySelector(selector); }
  function $all(selector) { return Array.from(document.querySelectorAll(selector)); }
  function loadObject(key) { try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch (_) { return null; } }
  function loadList(key) { const value = loadObject(key); return Array.isArray(value) ? value : []; }
  function persist(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) { showToast('This device could not save the latest change.'); } }
  function loadProfile() { const stored = loadObject(PROFILE_KEY); return { ...defaultProfile, ...(stored || {}) }; }
  function saveProfile() { persist(PROFILE_KEY, profile); }
  function saveSessions() { persist(SESSION_KEY, sessions); }
  function saveMeals() { persist(MEAL_KEY, meals); }
  function saveActiveWorkout() { if (activeWorkout) persist(ACTIVE_WORKOUT_KEY, activeWorkout); else localStorage.removeItem(ACTIVE_WORKOUT_KEY); }
  function uid(prefix) { return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`; }
  function escapeHTML(value) { return String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character])); }
  function localDay(value = new Date()) { const date = new Date(value); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }
  function number(value) { return Number.isFinite(Number(value)) ? Number(value) : 0; }
  function unitLabel() { return profile.unit.toUpperCase(); }
  function toDisplayWeight(kg) { return profile.unit === 'lb' ? Math.round(kg * 2.20462) : Math.round(kg); }
  function toKg(weight, unit = profile.unit) { return unit === 'lb' ? Number(weight) / 2.20462 : Number(weight); }
  function formatNumber(value) { return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(Math.max(0, Math.round(value || 0))); }
  function formatVolume(valueKg) { const value = profile.unit === 'lb' ? valueKg * 2.20462 : valueKg; return `${formatNumber(value)} ${unitLabel()}`; }
  function formatDate(value) { return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(value)); }
  function showToast(message) { const toast = $('#toast'); toast.textContent = message; toast.classList.add('is-visible'); window.clearTimeout(toastTimer); toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 2600); }

  function completeIntro() {
    try { localStorage.setItem(INTRO_KEY, 'true'); } catch (_) {}
    const video = $('#intro-video');
    if (video) video.pause();
    document.documentElement.classList.add('intro-complete');
  }

  function showStep(index) {
    currentStep = Math.max(0, Math.min(TOTAL_STEPS - 1, index));
    $all('.onboarding-page').forEach((page) => page.classList.toggle('is-active', Number(page.dataset.step) === currentStep));
    $('#progress-fill').style.width = `${((currentStep + 1) / TOTAL_STEPS) * 100}%`;
    $('#onboarding-back').classList.toggle('is-visible', currentStep > 0);
    const next = $('#onboarding-next');
    next.querySelector('span').textContent = ['GET STARTED', 'CONTINUE', 'CONTINUE', 'CONTINUE', 'CONTINUE', 'CONTINUE', 'FINISH SETUP'][currentStep];
    next.querySelector('i').className = currentStep === TOTAL_STEPS - 1 ? 'ph ph-check' : 'ph ph-arrow-right';
    if (currentStep === 1) window.setTimeout(() => $('#profile-name').focus(), 120);
  }

  function advanceOnboarding() {
    if (currentStep === 1) {
      const name = $('#profile-name').value.trim();
      if (!name) { showToast('Add a name to continue.'); $('#profile-name').focus(); return; }
      profile.name = name;
    }
    if (currentStep < TOTAL_STEPS - 1) { showStep(currentStep + 1); return; }
    profile.complete = true;
    saveProfile();
    openApp();
  }

  function openApp() {
    $('#onboarding').classList.add('is-hidden');
    $('#bottom-nav').classList.remove('is-hidden');
    showPage(activePage);
    renderAll();
  }

  function editProfile() {
    $('#dashboard').classList.add('is-hidden');
    $all('.standard-page').forEach((page) => page.classList.add('is-hidden'));
    $('#bottom-nav').classList.add('is-hidden');
    $('#onboarding').classList.remove('is-hidden');
    $('#profile-name').value = profile.name;
    showStep(1);
  }

  function showPage(page) {
    activePage = page;
    $all('.app-page').forEach((element) => element.classList.toggle('is-hidden', element.dataset.page !== page));
    $all('.bottom-nav__item').forEach((button) => button.classList.toggle('is-active', button.dataset.nav === page));
    if (page === 'home') renderHome();
    if (page === 'plan') renderPlan();
    if (page === 'progress') renderProgress();
    if (page === 'profile') renderProfile();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function renderAll() { renderHome(); renderPlan(); renderProgress(); renderProfile(); }

  function locationTitle(location) { return { home: 'Home setup', gym: 'Commercial gym setup', studio: 'Private studio setup', hybrid: 'Hybrid setup' }[location] || 'Training setup'; }
  function dailyFuelTarget() { return Math.round(toKg(profile.weight) * 33 / 25) * 25; }
  function mealsForDay(day = localDay()) { return meals.filter((meal) => meal.day === day); }
  function caloriesForDay(day = localDay()) { return mealsForDay(day).reduce((sum, meal) => sum + number(meal.calories), 0); }
  function sessionsForDay(day = localDay()) { return sessions.filter((session) => localDay(session.finishedAt) === day); }
  function sessionVolumeKg(session) { return number(session.volumeKg); }
  function todayVolumeKg() { return sessionsForDay().reduce((sum, session) => sum + sessionVolumeKg(session), 0); }
  function plannedTemplateKeys() {
    const count = Math.max(2, Math.min(7, profile.frequency));
    if (profile.location === 'home') return Array(count).fill('home');
    if (count === 2) return ['full', 'full'];
    if (count === 3) return ['lower', 'upper', 'full'];
    if (count === 4) return ['upper', 'lower', 'push', 'pull'];
    if (count === 5) return ['upper', 'lower', 'push', 'pull', 'full'];
    return ['upper', 'lower', 'push', 'pull', 'full', 'upper', 'lower'].slice(0, count);
  }
  function recommendedTemplateKey() {
    const todayCount = sessionsForDay().length;
    const keys = plannedTemplateKeys();
    return keys[Math.min(todayCount, keys.length - 1)] || 'full';
  }

  function renderHome() {
    const name = profile.name || 'Athlete';
    const today = new Date();
    $('#today-date').textContent = new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).format(today);
    $('#dashboard-name').textContent = name;
    const template = templateLibrary[recommendedTemplateKey()];
    const done = sessionsForDay().length;
    $('#focus-title').innerHTML = done ? 'Session complete.<br>Recover with intent.' : `${escapeHTML(template.title).replace(' ', '<br>')}.`;
    $('#focus-copy').textContent = done ? 'Your work is logged locally. Review your next training day in the plan.' : template.description;
    $('#start-workout').querySelector('span').textContent = activeWorkout ? 'RESUME WORKOUT' : done ? 'START ANOTHER SESSION' : 'START WORKOUT';
    $('#metric-sessions').textContent = done;
    $('#metric-volume').textContent = formatNumber(profile.unit === 'lb' ? todayVolumeKg() * 2.20462 : todayVolumeKg());
    $('#metric-calories').textContent = formatNumber(caloriesForDay());
    const target = dailyFuelTarget();
    const calories = caloriesForDay();
    $('#fuel-progress').textContent = `${formatNumber(calories)} of ${formatNumber(target)} kcal`;
    $('#fuel-copy').textContent = calories ? `${formatNumber(Math.max(0, target - calories))} kcal left in your flexible daily guide.` : 'Keep the work supported.';
    $('#foundation-heading').textContent = `${profile.frequency} training days. ${locationTitle(profile.location)}.`;
    $('#foundation-copy').textContent = `Using ${profile.unit.toUpperCase()}, ${profile.height} cm, and ${profile.weight} ${profile.unit}. Everything remains on this device.`;
    const avatar = $('#dashboard-avatar');
    const avatarButton = $('#dashboard-profile');
    if (profile.photo) { avatar.src = profile.photo; avatar.alt = `${name}'s profile`; avatarButton.classList.add('has-photo'); } else { avatarButton.classList.remove('has-photo'); }
  }

  function renderPlan() {
    const keys = plannedTemplateKeys();
    const sessionsThisWeek = sessions.filter((session) => {
      const elapsed = Date.now() - new Date(session.finishedAt).getTime();
      return elapsed >= 0 && elapsed < 7 * 24 * 60 * 60 * 1000;
    });
    $('#plan-frequency').textContent = profile.frequency;
    $('#plan-session-count').textContent = `${sessionsThisWeek.length} / ${profile.frequency}`;
    const weekday = new Date().getDay();
    $('#week-dots').innerHTML = Array.from({ length: 7 }, (_, index) => `<span class="${index < profile.frequency ? 'is-training' : ''} ${index === weekday ? 'is-today' : ''}">${['S', 'M', 'T', 'W', 'T', 'F', 'S'][index]}</span>`).join('');
    $('#plan-list').innerHTML = keys.map((key, index) => {
      const template = templateLibrary[key];
      const label = index === 0 ? 'NEXT UP' : `SESSION ${index + 1}`;
      return `<article class="plan-card"><span class="plan-card__number">${String(index + 1).padStart(2, '0')}</span><div><p>${label}</p><strong>${escapeHTML(template.title)}</strong><small>${escapeHTML(template.exercises.map((exercise) => exercise[0]).slice(0, 2).join(' · '))}</small></div><button class="round-play" data-start-template="${key}" type="button" aria-label="Start ${escapeHTML(template.title)}"><i class="ph ph-play" aria-hidden="true"></i></button></article>`;
    }).join('');
    $('#template-grid').innerHTML = ['full', 'upper', 'lower', profile.location === 'home' ? 'home' : 'push'].map((key) => {
      const template = templateLibrary[key];
      return `<button class="template-card" data-start-template="${key}" type="button"><i class="ph ${template.icon}" aria-hidden="true"></i><span>${escapeHTML(template.title)}</span><small>${template.exercises.length} exercises</small></button>`;
    }).join('');
  }

  function renderProgress() {
    const totalKg = sessions.reduce((sum, session) => sum + sessionVolumeKg(session), 0);
    $('#progress-total-volume').innerHTML = `${formatNumber(profile.unit === 'lb' ? totalKg * 2.20462 : totalKg)} <small>${unitLabel()}</small>`;
    $('#progress-total-copy').textContent = sessions.length ? `${sessions.length} completed ${sessions.length === 1 ? 'session' : 'sessions'} stored on this device.` : 'Your logged volume will build here.';
    const days = Array.from({ length: 7 }, (_, index) => { const date = new Date(); date.setDate(date.getDate() - (6 - index)); return date; });
    const dayVolumes = days.map((date) => sessions.filter((session) => localDay(session.finishedAt) === localDay(date)).reduce((sum, session) => sum + sessionVolumeKg(session), 0));
    const maxVolume = Math.max(...dayVolumes, 1);
    $('#volume-chart').innerHTML = days.map((date, index) => `<div class="chart-day"><span class="chart-value">${dayVolumes[index] ? formatNumber(profile.unit === 'lb' ? dayVolumes[index] * 2.20462 : dayVolumes[index]) : ''}</span><i style="height:${Math.max(8, Math.round((dayVolumes[index] / maxVolume) * 100))}%"></i><small>${new Intl.DateTimeFormat(undefined, { weekday: 'narrow' }).format(date)}</small></div>`).join('');
    const thisWeek = sessions.filter((session) => Date.now() - new Date(session.finishedAt).getTime() < 7 * 24 * 60 * 60 * 1000);
    $('#progress-week-total').textContent = `${thisWeek.length} ${thisWeek.length === 1 ? 'SESSION' : 'SESSIONS'}`;
    const history = [...sessions].sort((a, b) => new Date(b.finishedAt) - new Date(a.finishedAt));
    $('#history-list').innerHTML = history.length ? history.slice(0, 12).map((session) => `<article class="history-card"><span class="history-card__icon"><i class="ph ph-check-circle" aria-hidden="true"></i></span><div><strong>${escapeHTML(session.title)}</strong><small>${formatDate(session.finishedAt)} · ${session.completedSets} completed sets</small></div><span>${formatVolume(session.volumeKg)}</span></article>`).join('') : '<div class="empty-state"><i class="ph ph-chart-line-up" aria-hidden="true"></i><strong>Your history starts with one set.</strong><span>Complete a session and your training volume will appear here.</span></div>';
  }

  function renderProfile() {
    const name = profile.name || 'Athlete';
    $('#profile-page-name').textContent = name;
    $('#profile-page-context').textContent = `${profile.frequency} days / ${locationTitle(profile.location).replace(' setup', '')}`;
    $('#profile-page-weight').textContent = `${profile.weight} ${unitLabel()}`;
    $('#profile-page-height').textContent = `${profile.height} CM`;
    $('#profile-page-age').textContent = profile.age;
    const photo = $('#profile-page-photo');
    const portrait = photo.parentElement;
    if (profile.photo) { photo.src = profile.photo; photo.alt = `${name}'s profile`; portrait.classList.add('has-photo'); } else { portrait.classList.remove('has-photo'); }
  }

  function selectUnit(unit) {
    const changed = profile.unit !== unit;
    if (changed && unit === 'lb') profile.weight = Math.round(profile.weight * 2.20462);
    if (changed && unit === 'kg') profile.weight = Math.round(profile.weight / 2.20462);
    profile.unit = unit;
    $('#weight-unit-label').textContent = unit.toUpperCase();
    $all('[data-unit]').forEach((button) => button.classList.toggle('is-selected', button.dataset.unit === unit));
    mountWheels();
  }

  function mountWheel(id, values, selected, onSelect) {
    const wheel = $(`#${id}`);
    wheel.replaceChildren();
    values.forEach((value) => {
      const item = document.createElement('button');
      item.type = 'button'; item.className = 'wheel__item'; item.dataset.value = value; item.textContent = value;
      item.addEventListener('click', () => { wheel.scrollTo({ top: values.indexOf(value) * 46, behavior: 'smooth' }); onSelect(value); refreshWheelSelection(wheel, value); });
      wheel.appendChild(item);
    });
    const initialIndex = Math.max(0, values.indexOf(selected));
    window.requestAnimationFrame(() => wheel.scrollTo({ top: initialIndex * 46, behavior: 'auto' }));
    refreshWheelSelection(wheel, selected);
    let settleTimer;
    wheel.addEventListener('scroll', () => { window.clearTimeout(settleTimer); settleTimer = window.setTimeout(() => { const index = Math.max(0, Math.min(values.length - 1, Math.round(wheel.scrollTop / 46))); const value = values[index]; onSelect(value); refreshWheelSelection(wheel, value); }, 90); }, { passive: true });
  }
  function refreshWheelSelection(wheel, value) { wheel.querySelectorAll('.wheel__item').forEach((item) => item.classList.toggle('is-selected', Number(item.dataset.value) === Number(value))); }
  function mountWheels() {
    mountWheel('wheel-age', Array.from({ length: 63 }, (_, i) => i + 18), profile.age, (value) => { profile.age = Number(value); });
    mountWheel('wheel-height', Array.from({ length: 91 }, (_, i) => i + 130), profile.height, (value) => { profile.height = Number(value); });
    const min = profile.unit === 'kg' ? 35 : 77; const max = profile.unit === 'kg' ? 180 : 397;
    mountWheel('wheel-weight', Array.from({ length: max - min + 1 }, (_, i) => i + min), profile.weight, (value) => { profile.weight = Number(value); });
  }

  function setPhoto(file) {
    if (!file || !file.type.startsWith('image/')) return;
    if (file.size > 2.5 * 1024 * 1024) { showToast('Choose an image smaller than 2.5 MB.'); return; }
    const reader = new FileReader();
    reader.addEventListener('load', () => { profile.photo = String(reader.result); const preview = $('#profile-photo-preview'); preview.src = profile.photo; preview.alt = 'Profile preview'; $('.avatar-picker').classList.add('has-photo'); });
    reader.readAsDataURL(file);
  }

  function newSet(defaultWeight, target) { const match = String(target).match(/x\s*(\d+)/i); return { id: uid('set'), weight: defaultWeight, reps: match ? Number(match[1]) : 10, complete: false }; }
  function createActiveWorkout(templateKey) {
    const template = templateLibrary[templateKey] || templateLibrary.full;
    activeWorkout = { id: uid('workout'), templateKey, title: template.title, label: template.label, startedAt: new Date().toISOString(), exercises: template.exercises.map(([name, target, weightKg]) => ({ id: uid('exercise'), name, target, sets: Array.from({ length: 3 }, () => newSet(toDisplayWeight(weightKg), target)) })) };
    saveActiveWorkout();
  }
  function openWorkout(templateKey) {
    if (!activeWorkout) createActiveWorkout(templateKey || recommendedTemplateKey());
    $('#workout-modal').classList.remove('is-hidden');
    document.body.classList.add('modal-open');
    renderActiveWorkout();
    startWorkoutClock();
  }
  function closeWorkout() { $('#workout-modal').classList.add('is-hidden'); document.body.classList.remove('modal-open'); window.clearInterval(workoutClock); window.clearInterval(restTimer); }
  function startWorkoutClock() {
    window.clearInterval(workoutClock);
    const update = () => { if (!activeWorkout) return; const seconds = Math.max(0, Math.floor((Date.now() - new Date(activeWorkout.startedAt).getTime()) / 1000)); $('#workout-elapsed').textContent = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`; };
    update(); workoutClock = window.setInterval(update, 1000);
  }
  function renderActiveWorkout() {
    if (!activeWorkout) return;
    $('#active-template-label').textContent = activeWorkout.label;
    $('#active-workout-title').textContent = activeWorkout.title;
    const setCount = activeWorkout.exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0);
    const completeCount = activeWorkout.exercises.reduce((sum, exercise) => sum + exercise.sets.filter((set) => set.complete).length, 0);
    $('#active-workout-meta').textContent = `${completeCount} of ${setCount} sets complete · ${unitLabel()} selected`;
    $('#active-exercises').innerHTML = activeWorkout.exercises.map((exercise, exerciseIndex) => `<article class="active-exercise"><header><span>${String(exerciseIndex + 1).padStart(2, '0')}</span><div><h2>${escapeHTML(exercise.name)}</h2><p>${escapeHTML(exercise.target)}</p></div><button class="exercise-remove" data-remove-exercise="${exercise.id}" type="button" aria-label="Remove ${escapeHTML(exercise.name)}"><i class="ph ph-x" aria-hidden="true"></i></button></header><div class="set-head"><span>SET</span><span>WEIGHT (${unitLabel()})</span><span>REPS</span><span>DONE</span></div><div class="set-list">${exercise.sets.map((set, setIndex) => `<div class="set-row ${set.complete ? 'is-complete' : ''}"><span>${setIndex + 1}</span><input data-set-field="weight" data-exercise-id="${exercise.id}" data-set-id="${set.id}" inputmode="decimal" type="number" min="0" step="0.5" value="${number(set.weight)}" aria-label="Weight for set ${setIndex + 1}"><input data-set-field="reps" data-exercise-id="${exercise.id}" data-set-id="${set.id}" inputmode="numeric" type="number" min="0" max="100" value="${number(set.reps)}" aria-label="Reps for set ${setIndex + 1}"><button class="set-check ${set.complete ? 'is-complete' : ''}" data-toggle-set="${exercise.id}:${set.id}" type="button" aria-label="Mark set ${setIndex + 1} complete"><i class="ph ph-check" aria-hidden="true"></i></button></div>`).join('')}</div><button class="add-set" data-add-set="${exercise.id}" type="button"><i class="ph ph-plus" aria-hidden="true"></i> ADD SET</button></article>`).join('');
  }
  function findSet(exerciseId, setId) { const exercise = activeWorkout?.exercises.find((item) => item.id === exerciseId); return { exercise, set: exercise?.sets.find((item) => item.id === setId) }; }
  function addExercise() {
    if (!activeWorkout) return;
    const used = new Set(activeWorkout.exercises.map((exercise) => exercise.name));
    const source = Object.values(templateLibrary).flatMap((template) => template.exercises).find((exercise) => !used.has(exercise[0])) || ['Accessory movement', '3 x 10', 0];
    activeWorkout.exercises.push({ id: uid('exercise'), name: source[0], target: source[1], sets: Array.from({ length: 3 }, () => newSet(toDisplayWeight(source[2]), source[1])) });
    saveActiveWorkout(); renderActiveWorkout();
  }
  function toggleSet(exerciseId, setId) { const { set } = findSet(exerciseId, setId); if (!set) return; set.complete = !set.complete; saveActiveWorkout(); renderActiveWorkout(); if (set.complete) showToast('Set logged. Strong work.'); }
  function finishWorkout() {
    if (!activeWorkout) return;
    const finishedAt = new Date().toISOString();
    const completed = activeWorkout.exercises.flatMap((exercise) => exercise.sets.filter((set) => set.complete));
    const volumeKg = completed.reduce((sum, set) => sum + (toKg(set.weight) * number(set.reps)), 0);
    sessions.push({ id: activeWorkout.id, title: activeWorkout.title, label: activeWorkout.label, startedAt: activeWorkout.startedAt, finishedAt, completedSets: completed.length, volumeKg });
    saveSessions(); activeWorkout = null; saveActiveWorkout(); closeWorkout(); renderAll(); showPage('home'); showToast(completed.length ? `Session saved — ${completed.length} completed sets.` : 'Session saved. Add more detail next time.');
  }
  function discardWorkout() { if (!activeWorkout) return; if (!window.confirm('Discard this unfinished workout?')) return; activeWorkout = null; saveActiveWorkout(); closeWorkout(); showToast('Unfinished workout discarded.'); }
  function startRestTimer() {
    window.clearInterval(restTimer);
    restRemaining = 90;
    const label = $('#rest-label');
    const tick = () => { const minutes = Math.floor(restRemaining / 60); const seconds = restRemaining % 60; label.textContent = `REST ${minutes}:${String(seconds).padStart(2, '0')}`; if (restRemaining <= 0) { window.clearInterval(restTimer); label.textContent = 'REST 90S'; showToast('Rest complete. Ready when you are.'); return; } restRemaining -= 1; };
    tick(); restTimer = window.setInterval(tick, 1000);
  }

  function openFuel() { $('#fuel-sheet').classList.remove('is-hidden'); document.body.classList.add('modal-open'); renderFuel(); window.setTimeout(() => $('#meal-name').focus(), 180); }
  function closeFuel() { $('#fuel-sheet').classList.add('is-hidden'); document.body.classList.remove('modal-open'); }
  function renderFuel() {
    const target = dailyFuelTarget(); const dayMeals = mealsForDay(); const total = caloriesForDay();
    $('#fuel-target-value').textContent = `${formatNumber(total)} / ${formatNumber(target)} kcal`;
    $('#fuel-target-detail').textContent = `${formatNumber(Math.max(0, target - total))} kcal remain in this flexible, local guide.`;
    $('#meal-log').innerHTML = dayMeals.length ? dayMeals.map((meal) => `<div class="meal-row"><span class="meal-row__icon"><i class="ph ph-bowl-food" aria-hidden="true"></i></span><span><strong>${escapeHTML(meal.name)}</strong><small>Added today</small></span><strong>${formatNumber(meal.calories)} <small>kcal</small></strong><button data-delete-meal="${meal.id}" type="button" aria-label="Remove ${escapeHTML(meal.name)}"><i class="ph ph-trash" aria-hidden="true"></i></button></div>`).join('') : '<div class="meal-empty"><i class="ph ph-fork-knife" aria-hidden="true"></i><span>Nothing logged yet. Add a meal or snack below.</span></div>';
  }
  function addMeal(event) {
    event.preventDefault(); const name = $('#meal-name').value.trim(); const calories = Math.round(number($('#meal-calories').value));
    if (!name || calories < 1) { showToast('Add a meal name and calorie estimate.'); return; }
    meals.push({ id: uid('meal'), name, calories, day: localDay(), addedAt: new Date().toISOString() }); saveMeals(); event.target.reset(); renderFuel(); renderHome(); showToast('Added to today’s fuel log.');
  }

  function setupEvents() {
    $('#intro-continue').addEventListener('click', completeIntro);
    $('#onboarding-next').addEventListener('click', advanceOnboarding);
    $('#onboarding-back').addEventListener('click', () => showStep(currentStep - 1));
    $('#profile-name').value = profile.name;
    $('#profile-photo').addEventListener('change', (event) => setPhoto(event.target.files[0]));
    $('#photo-skip').addEventListener('click', () => showStep(3));
    $all('[data-unit]').forEach((button) => button.addEventListener('click', () => selectUnit(button.dataset.unit)));
    $all('[data-frequency]').forEach((button) => button.addEventListener('click', () => { profile.frequency = Number(button.dataset.frequency); $all('[data-frequency]').forEach((item) => item.classList.toggle('is-selected', item === button)); }));
    $all('[data-location]').forEach((button) => button.addEventListener('click', () => { profile.location = button.dataset.location; $all('[data-location]').forEach((item) => item.classList.toggle('is-selected', item === button)); }));
    $('#start-workout').addEventListener('click', () => openWorkout(recommendedTemplateKey()));
    $('#plan-focus-start').addEventListener('click', () => openWorkout(recommendedTemplateKey()));
    $('#dashboard-profile').addEventListener('click', () => showPage('profile'));
    $('#edit-profile').addEventListener('click', editProfile);
    $('#profile-edit').addEventListener('click', editProfile);
    $('#profile-edit-top').addEventListener('click', editProfile);
    $('#open-fuel').addEventListener('click', openFuel); $('#open-fuel-link').addEventListener('click', openFuel); $('#open-fuel-card').addEventListener('click', openFuel);
    $('#close-workout').addEventListener('click', closeWorkout); $('#discard-workout').addEventListener('click', discardWorkout); $('#finish-workout').addEventListener('click', finishWorkout); $('#add-exercise').addEventListener('click', addExercise); $('#rest-control').addEventListener('click', startRestTimer);
    $('#meal-form').addEventListener('submit', addMeal);
    $('#clear-history').addEventListener('click', () => { if (!sessions.length || !window.confirm('Clear all completed workout history on this device?')) return; sessions = []; saveSessions(); renderAll(); showToast('Workout history cleared.'); });
    $all('.bottom-nav__item').forEach((button) => button.addEventListener('click', () => showPage(button.dataset.nav)));
    document.addEventListener('click', (event) => {
      const target = event.target.closest('[data-start-template], [data-add-set], [data-remove-exercise], [data-toggle-set], [data-delete-meal], [data-close-sheet]');
      if (!target) return;
      if (target.dataset.startTemplate) openWorkout(target.dataset.startTemplate);
      if (target.dataset.addSet && activeWorkout) { const exercise = activeWorkout.exercises.find((item) => item.id === target.dataset.addSet); if (exercise) { const last = exercise.sets[exercise.sets.length - 1]; exercise.sets.push(newSet(last?.weight || 0, exercise.target)); saveActiveWorkout(); renderActiveWorkout(); } }
      if (target.dataset.removeExercise && activeWorkout) { activeWorkout.exercises = activeWorkout.exercises.filter((exercise) => exercise.id !== target.dataset.removeExercise); saveActiveWorkout(); renderActiveWorkout(); }
      if (target.dataset.toggleSet) { const [exerciseId, setId] = target.dataset.toggleSet.split(':'); toggleSet(exerciseId, setId); }
      if (target.dataset.deleteMeal) { meals = meals.filter((meal) => meal.id !== target.dataset.deleteMeal); saveMeals(); renderFuel(); renderHome(); }
      if (target.dataset.closeSheet) closeFuel();
    });
    document.addEventListener('change', (event) => { const input = event.target; if (!input.matches('[data-set-field]') || !activeWorkout) return; const { set } = findSet(input.dataset.exerciseId, input.dataset.setId); if (!set) return; set[input.dataset.setField] = Math.max(0, number(input.value)); saveActiveWorkout(); });
  }

  function initialise() {
    setupEvents(); selectUnit(profile.unit); mountWheels();
    if (profile.photo) { $('#profile-photo-preview').src = profile.photo; $('#profile-photo-preview').alt = 'Profile preview'; $('.avatar-picker').classList.add('has-photo'); }
    $all('[data-frequency]').forEach((button) => button.classList.toggle('is-selected', Number(button.dataset.frequency) === profile.frequency));
    $all('[data-location]').forEach((button) => button.classList.toggle('is-selected', button.dataset.location === profile.location));
    if (profile.complete) openApp(); else showStep(0);
    if ('serviceWorker' in navigator && window.isSecureContext) navigator.serviceWorker.register('service-worker.js').catch(() => {});
  }

  document.addEventListener('DOMContentLoaded', initialise);
})();
