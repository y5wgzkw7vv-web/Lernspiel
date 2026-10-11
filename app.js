(() => {
  'use strict';
  const $ = (q, root = document) => root.querySelector(q);
  const $$ = (q, root = document) => [...root.querySelectorAll(q)];
  const screen = $('#screen');
  const STORAGE_KEY = 'victorias-blockwelt-v1';
  const MODES = {
    dictation: ['Hör-Diktat', '🎧'], gap: ['Lückenwort', '🧩'], syllables: ['Silben-Klatschen', '👏'],
    salad: ['Buchstabensalat', '🔀'], reading: ['Lese-Blitz', '⚡'], noun: ['Groß oder klein?', '🔎'],
    extend: ['Verlängern-Detektiv', '🕵️‍♀️'], copy: ['Abschreib-Mission', '✍️'], sentence: ['Satz-Diktat', '🗣️'], real: ['Echtes Diktat', '📝']
  };
  const defaultState = {
    version: 2, childName: 'Victoria', stars: 0, rounds: 0, station: 1, streak: 0, lastPlayed: '', firstVisit: true,
    words: {}, lists: [], recordings: {}, stats: { tasks: 0, minutes: 0, errors: {}, modes: {} },
    settings: { minutes: 10, sound: true, difficulty: 3, turbo: false, voiceURI: '', activeModes: Object.keys(MODES).filter(m => m !== 'real') }
  };
  let state = loadState();
  let audioCtx = null, voices = [], germanVoice = null, audioUnlocked = false, round = null, task = null, toastTimer = null;
  let sessionStart = null, recorder = null, recordChunks = [], recordTarget = '', dictationRun = 0;
  let activeAudio = null;
  const REAL_DICTATION_PAUSE_MS = 7000;

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!saved) return structuredClone(defaultState);
      const merged = { ...structuredClone(defaultState), ...saved, settings: { ...defaultState.settings, ...(saved.settings || {}) }, stats: { ...defaultState.stats, ...(saved.stats || {}) } };
      if ((saved.version || 1) < 2) { merged.version = 2; merged.settings.difficulty = Math.max(3, merged.settings.difficulty || 1); }
      return merged;
    } catch { return structuredClone(defaultState); }
  }
  function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); updateChrome(); }
  function updateChrome() { $('#starTotal').textContent = state.stars; $('#soundBtn').textContent = state.settings.sound ? '🔊 Ton an' : '🔇 Ton aus'; $('#soundBtn').setAttribute('aria-pressed', String(state.settings.sound)); }
  function esc(s = '') { return String(s).replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c])); }
  function normalize(s) { return String(s).trim().toLocaleLowerCase('de-DE').replace(/[.!?,;:]/g, ''); }
  function shuffle(a) { const b = [...a]; for (let i = b.length - 1; i; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; }
  function today() { return new Intl.DateTimeFormat('de-DE').format(new Date()); }
  function mascot() { return $('#mascotTemplate').innerHTML; }
  function showToast(text) { const t = $('#toast'); t.textContent = text; t.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2200); }

  function initVoices() {
    voices = speechSynthesis.getVoices();
    const de = voices.filter(v => /^de([-_]|$)/i.test(v.lang));
    const selected = de.find(v => v.voiceURI === state.settings.voiceURI);
    const score = v => {
      let n = /^de-DE$/i.test(v.lang) ? 100 : 70;
      if (/Natural|Neural|Premium|Enhanced/i.test(v.name)) n += 90;
      if (/Katja|Conrad|Seraphina|Florian|Anna|Petra|Vicki|Google Deutsch/i.test(v.name)) n += 55;
      if (v.localService) n += 25;
      if (/eSpeak|Festival|Compact|Desktop/i.test(v.name)) n -= 80;
      return n;
    };
    germanVoice = selected || de.sort((a, b) => score(b) - score(a))[0] || null;
  }
  initVoices();
  speechSynthesis.onvoiceschanged = initVoices;
  function unlockAudio() {
    if (audioUnlocked) return;
    audioUnlocked = true;
    try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); audioCtx.resume(); } catch {}
    const u = new SpeechSynthesisUtterance(''); u.volume = 0; speechSynthesis.speak(u);
  }
  document.addEventListener('pointerdown', unlockAudio, { once: true });
  function stopSpeech() {
    speechSynthesis.cancel();
    if (activeAudio) { activeAudio.pause(); activeAudio.currentTime = 0; activeAudio = null; }
  }
  function speak(text, wordKey = '', rate = .48) {
    if (!audioUnlocked) { showToast('Tippe einmal – dann kann Mila vorlesen.'); return; }
    stopSpeech();
    const recorded = state.recordings[normalize(wordKey)];
    if (recorded) { const a = new Audio(recorded); activeAudio = a; a.onended = () => { if (activeAudio === a) activeAudio = null; }; a.onerror = a.onended; a.play().catch(() => { if (activeAudio === a) activeAudio = null; }); return; }
    const u = new SpeechSynthesisUtterance(text); u.lang = 'de-DE'; u.rate = rate; u.pitch = .96; if (germanVoice) u.voice = germanVoice;
    speechSynthesis.speak(u);
  }
  function tone(kind = 'good') {
    if (!state.settings.sound || !audioUnlocked || !audioCtx) return;
    const now = audioCtx.currentTime;
    const notes = kind === 'good' ? [523, 659, 784] : [392, 523];
    notes.forEach((freq, i) => { const o = audioCtx.createOscillator(), g = audioCtx.createGain(); o.type = 'sine'; o.frequency.value = freq; g.gain.setValueAtTime(.001, now + i * .08); g.gain.exponentialRampToValueAtTime(.12, now + i * .08 + .01); g.gain.exponentialRampToValueAtTime(.001, now + i * .08 + .15); o.connect(g).connect(audioCtx.destination); o.start(now + i * .08); o.stop(now + i * .08 + .17); });
  }
  function celebrate() {
    tone('good'); const c = $('#celebration'); c.innerHTML = '';
    ['⭐','✨','⭐','🌿','✨'].forEach((x, i) => { const s = document.createElement('span'); s.className = 'spark'; s.textContent = x; s.style.left = `${12 + i * 19}%`; s.style.top = `${35 + (i % 2) * 12}%`; c.appendChild(s); });
    c.classList.add('show'); setTimeout(() => c.classList.remove('show'), 780);
  }

  function welcome() {
    screen.innerHTML = `<section class="hero">${mascot()}<h1>Hallo, Victoria!</h1><p class="lead">Ich bin <strong>Mila Moosfunke</strong>. Gemeinsam bauen wir aus Wörtern unsere eigene Blockwelt.</p><p class="speech-note">🔊 Tippe auf „Los geht’s“. Danach spricht Mila nur Lernwörter und Diktatsätze vor.</p><button class="primary" id="startWelcome">Los geht’s! 🧱</button></section>`;
    $('#startWelcome').onclick = () => { unlockAudio(); state.firstVisit = false; saveState(); tone('soft'); home(); };
  }

  function home() {
    dictationRun++; stopSpeech(); round = null; task = null; updateStreak();
    const activeList = state.lists.find(l => l.active);
    const unlocked = getUnlocked();
    const realUnlocked = state.rounds >= 3 || state.settings.difficulty >= 4;
    const roundsToReal = Math.max(0, 3 - state.rounds);
    screen.innerHTML = `<section class="panel">
      <div class="home-head">${mascot()}<div class="speech-bubble"><h2>Bereit, Victoria?</h2><p>${activeList ? `Deine Schulwörter „${esc(activeList.name)}“ sind heute zuerst dran.` : 'Such dir deine nächste kurze Mission aus.'}</p></div></div>
      ${!germanVoice && voices.length ? '<p class="speech-note">ℹ️ Auf diesem Gerät wurde keine deutsche Stimme gefunden. Mila nutzt die Standardstimme. Im Elternbereich können Wörter selbst aufgenommen werden.</p>' : ''}
      <div class="learning-path" aria-label="Dein Diktat-Lernweg"><span>1&nbsp; 🎧 Wörter</span><b>→</b><span>2&nbsp; 📜 Sätze</span><b>→</b><span class="${realUnlocked ? '' : 'path-locked'}">3&nbsp; ${realUnlocked ? '📝' : '🔒'} Echtes Diktat</span></div>
      <div class="mission-grid">
        <button class="mission-card" data-mission="worddictation"><span class="emoji">🎧</span><strong>Wort-Diktat</strong><small>5 schwierigere Wörter hören und schreiben</small></button>
        <button class="mission-card" data-mission="fulldictation"><span class="emoji">📜</span><strong>Satz-Training</strong><small>5 Sätze einzeln hören und schreiben</small></button>
        <button class="mission-card current-mission" data-mission="currentwords"><span class="emoji">🎒</span><strong>Aktuelle Lernwörter</strong><small>Nur Victorias 29 aktuelle Schulwörter</small></button>
        <button class="mission-card ${realUnlocked ? '' : 'locked-mission'}" data-mission="realdictation" ${realUnlocked ? '' : 'disabled'}><span class="emoji">${realUnlocked ? '📝' : '🔒'}</span><strong>Echtes Diktat</strong><small>${realUnlocked ? 'Die Stimme diktiert weiter und wiederholt am Ende alles' : `Noch ${roundsToReal} kurze Runde${roundsToReal === 1 ? '' : 'n'} bis zur Freischaltung`}</small></button>
      </div>
      <div class="home-links"><button class="secondary" id="mixBtn">⛏️ Misch-Mine</button><button class="secondary" id="collectionBtn">🎒 Sammlung (${unlocked.length})</button><button class="secondary" id="mapBtn">🗺️ Level-Karte</button></div>
      <p class="timer-note">🔥 Tages-Serie: <strong>${state.streak}</strong> · Ohne Strafe, wenn du eine Pause brauchst.</p>
    </section>`;
    $$('.mission-card:not([disabled])').forEach(b => b.onclick = () => startRound(b.dataset.mission));
    $('#mixBtn').onclick = () => startRound('mix'); $('#collectionBtn').onclick = collectionView; $('#mapBtn').onclick = mapView;
  }

  function updateStreak() {
    const key = new Date().toISOString().slice(0, 10); if (state.lastPlayed === key) return;
    if (!state.lastPlayed) state.streak = 0;
  }
  function markPlayed() {
    const key = new Date().toISOString().slice(0, 10); if (state.lastPlayed === key) return;
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    state.streak = state.lastPlayed === yesterday.toISOString().slice(0, 10) ? state.streak + 1 : Math.max(1, state.streak);
    state.lastPlayed = key;
  }
  function schoolItems() {
    const list = state.lists.find(l => l.active);
    if (!list) return [];
    return list.items.filter(x => x.type === 'word').map((x, i) => ({ id: `c-${list.id}-${i}`, word: x.text, syllables: syllabify(x.text), pos: guessPos(x.text), emoji: '🧱', focus: detectFocus(x.text), level: 1, custom: true }));
  }
  function customSentences() { const list = state.lists.find(l => l.active); return list ? list.items.filter(x => x.type === 'sentence').map(x => x.text) : []; }
  function syllabify(word) {
    const w = word.trim(); const chunks = w.match(/[^aeiouyäöü]*[aeiouyäöü]+(?:[^aeiouyäöü](?=[^aeiouyäöü]*[aeiouyäöü])|[^aeiouyäöü]*$)/gi);
    return chunks && chunks.length ? chunks : [w];
  }
  function guessPos(word) { return /^[A-ZÄÖÜ]/.test(word) ? 'Nomen' : 'unbekannt'; }
  function detectFocus(word) { const w = normalize(word); for (const p of ['sch','ch','ie','ei','eu','au','ck','tz']) if (w.includes(p)) return p; if (/(.)\1/.test(w)) return 'Doppelkonsonant'; if (/[bdg]$/.test(w)) return 'Endbuchstabe'; return 'Lernwort'; }
  function weightedPick(pool, count) {
    const bag = []; pool.forEach(w => { const rec = state.words[normalize(w.word)] || { box: 1 }; const weight = Math.max(1, 6 - rec.box); for (let i = 0; i < weight; i++) bag.push(w); });
    const out = []; while (out.length < count && bag.length) { const w = bag[Math.floor(Math.random() * bag.length)]; if (!out.some(x => normalize(x.word) === normalize(w.word))) out.push(w); if (out.length >= pool.length) break; }
    while (out.length < count) out.push(pool[Math.floor(Math.random() * pool.length)]); return out;
  }
  function chooseWords(mission) {
    if (mission === 'currentwords') return weightedPick(CURRENT_WORDS, 5);
    const school = schoolItems();
    let pool = school.length ? school : BASE_WORDS.filter(w => w.level <= state.settings.difficulty);
    if (mission === 'detective') {
      const weak = pool.filter(w => (state.words[normalize(w.word)]?.box || 1) <= 2 || (state.words[normalize(w.word)]?.wrong || 0) > 0); if (weak.length >= 3) pool = weak;
    }
    return weightedPick(pool, 5);
  }
  function compatibleModes(word) {
    let modes = state.settings.activeModes.filter(m => MODES[m] && m !== 'real');
    if (!/^[A-Za-zÄÖÜäöüß]+$/.test(word.word)) modes = modes.filter(m => !['salad','gap','dictation'].includes(m));
    if (word.pos === 'unbekannt') modes = modes.filter(m => m !== 'noun');
    if (word.focus !== 'Endbuchstabe') modes = modes.filter(m => m !== 'extend');
    if (word.word.length > 10) modes = modes.filter(m => m !== 'salad');
    return modes.length ? modes : ['dictation','gap'];
  }
  function startRound(mission) {
    unlockAudio(); if (!sessionStart) sessionStart = Date.now();
    if (mission === 'fulldictation' || mission === 'realdictation') {
      const chosen = selectDictation();
      const sentences = [...chosen.sentences];
      while (sentences.length < 5) sentences.push(chosen.sentences[sentences.length % chosen.sentences.length]);
      if (mission === 'realdictation') {
        const five = sentences.slice(0, 5), fullText = five.join(' ');
        const realTask = { mode: 'real', word: { id: `real-${Date.now()}`, word: fullText, syllables: [], pos: 'Text', emoji: chosen.emoji, focus: 'Großschreibung und Satzzeichen', level: state.settings.difficulty }, sentences: five, fullText, input: '', attempts: 0, complete: false, started: false };
        round = { mission, title: chosen.title, emoji: chosen.emoji, index: 0, stars: 0, perfect: true, tasks: [realTask] };
        return renderTask();
      }
      const tasks = sentences.slice(0, 5).map((sentence, index) => makeTask('sentence', { id: `d${index}`, word: `Satz ${index + 1}`, syllables: ['Satz'], pos: 'Satz', emoji: chosen.emoji, focus: 'Großschreibung', level: state.settings.difficulty }, sentence));
      round = { mission, title: chosen.title, emoji: chosen.emoji, index: 0, stars: 0, perfect: true, tasks };
      return renderTask();
    }
    const words = chooseWords(mission), used = [];
    const tasks = words.map((word, index) => {
      let choices = compatibleModes(word).filter(m => !used.slice(-2).includes(m));
      let mode = ['worddictation','currentwords'].includes(mission) ? 'dictation' : (shuffle(choices)[0] || shuffle(compatibleModes(word))[0]);
      if (mission === 'mix' && index === 4 && state.settings.difficulty >= 3 && state.settings.activeModes.includes('sentence') && (customSentences().length || SENTENCES.length)) mode = 'sentence';
      used.push(mode); return makeTask(mode, word);
    });
    const title = mission === 'worddictation' ? 'Wort-Diktat' : mission === 'currentwords' ? 'Aktuelle Lernwörter' : 'Misch-Mine';
    round = { mission, title, index: 0, stars: 0, perfect: true, tasks }; renderTask();
  }
  function selectDictation() {
    const own = customSentences();
    const available = DICTATIONS.filter(d => d.level <= state.settings.difficulty);
    const fallback = shuffle(available.length ? available : DICTATIONS)[0];
    return own.length ? { title: state.lists.find(l => l.active)?.name || 'Schuldiktat', emoji: '📚', sentences: [...own, ...fallback.sentences.filter(s => !own.includes(s))] } : fallback;
  }
  function makeTask(mode, word, sentenceOverride = '') {
    const base = { mode, word, attempts: 0, input: '', complete: false };
    if (mode === 'gap') Object.assign(base, makeGap(word));
    if (mode === 'salad') base.letters = shuffle([...word.word]);
    if (mode === 'reading') base.options = makeEmojiOptions(word);
    if (mode === 'extend') Object.assign(base, makeExtend(word));
    if (mode === 'sentence') base.sentence = sentenceOverride || shuffle(customSentences())[0] || shuffle(SENTENCES)[0];
    return base;
  }
  function makeGap(w) {
    const word = w.word, focus = w.focus.split('/')[0]; let target = focus;
    if (!normalize(word).includes(normalize(target)) || ['lautgetreu','Lernwort','Merkwort','Endbuchstabe','Doppelkonsonant','Dehnungs-h','v'].includes(target)) {
      if (w.focus === 'Doppelkonsonant') { const m = word.match(/(.)\1/i); target = m ? m[0] : word[Math.floor(word.length / 2)]; }
      else target = word.slice(Math.max(0, Math.floor(word.length / 2) - 1), Math.floor(word.length / 2) + 1);
    }
    const i = normalize(word).indexOf(normalize(target)); const real = word.slice(i, i + target.length);
    const distractorMap = { ie: ['ei','i'], ei: ['ie','ai'], au: ['eu','a'], eu: ['äu','au'], sch: ['ch','s'], ch: ['sch','h'], ck: ['k','kk'], tz: ['z','t'], v: ['f','w'] };
    const others = distractorMap[normalize(real)] || shuffle('abcdefghijklmnopqrstuvwxyz'.split('').filter(x => !normalize(real).includes(x))).slice(0,2);
    return { gapStart: word.slice(0, i), gapEnd: word.slice(i + real.length), answer: real, options: shuffle([real, ...others]).slice(0,3) };
  }
  function makeEmojiOptions(word) { const others = shuffle(BASE_WORDS.filter(w => w.emoji !== word.emoji && w.emoji !== '🧱')).slice(0, 2); return shuffle([{ label: word.emoji, answer: true }, ...others.map(w => ({ label: w.emoji, answer: false }))]); }
  function makeExtend(word) {
    const last = word.word.slice(-1).toLocaleLowerCase('de-DE'); const pairs = { d: 't', t: 'd', b: 'p', p: 'b', g: 'k', k: 'g' }; const alt = pairs[last] || 't';
    const forms = { Hand: 'Hände', Mund: 'Münder', Kind: 'Kinder', Rad: 'Räder', Hund: 'Hunde', Wald: 'Wälder', Bild: 'Bilder', Tag: 'Tage', Weg: 'Wege', Korb: 'Körbe', gelb: 'gelbe', lieb: 'liebe', König: 'Könige' };
    return { stem: word.word.slice(0, -1), answer: last, options: shuffle([last, alt]), extension: forms[word.word] || `${word.word}e` };
  }

  function taskShell(content, instruction) {
    const total = round.tasks.length, left = total - round.index, pct = (round.index / total) * 100;
    const hasAudioPrompt = task.mode === 'dictation' || task.mode === 'sentence';
    screen.innerHTML = `<div class="progress-wrap"><div class="progress-line"><span>Mission ${round.index + 1} von ${total}</span><span>noch ${left}!</span></div><div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div></div>
      <section class="task-card"><span class="mode-label">${MODES[task.mode][1]} ${MODES[task.mode][0]}</span><div class="speak-row"><p class="instruction">${instruction}</p>${hasAudioPrompt ? '<button class="speak-btn" id="repeatBtn" aria-label="Wort oder Satz anhören" title="Wort oder Satz anhören">🔊</button>' : ''}</div>${content}<div class="feedback" id="feedback"></div></section>`;
    const spokenKey = task.mode === 'sentence' ? task.sentence : task.word.word;
    if (hasAudioPrompt) $('#repeatBtn').onclick = () => speak(spokenKey, spokenKey, task.mode === 'sentence' ? .42 : .46);
  }
  function getSpokenInstruction() {
    const w = task.word.word;
    return ({ dictation: `Höre genau. Schreibe das Wort: ${w}.`, gap: `Welche Buchstaben fehlen in ${w}?`, syllables: `Höre das Wort ${w}. Tippe einmal für jede Silbe.`, salad: `Bringe die Buchstaben von ${w} in die richtige Reihenfolge.`, reading: `Lies das Wort und wähle das passende Bild.`, noun: `Ist ${w} ein Nomen? Kann man der, die oder das davor sagen?`, extend: `Verlängere ${w}. Welchen Endbuchstaben hörst du?`, copy: `Schau dir ${w} genau an und merke es dir.`, sentence: `Diktat ${round.index + 1} von 5. Höre den ganzen Satz und schreibe ihn: ${task.sentence}`, real: 'Schreibe das Diktat. Die Stimme spricht langsam weiter und wiederholt am Ende den ganzen Text.' })[task.mode];
  }
  function renderTask() {
    stopSpeech();
    task = round.tasks[round.index];
    ({ dictation: renderDictation, gap: renderGap, syllables: renderSyllables, salad: renderSalad, reading: renderReading, noun: renderNoun, extend: renderExtend, copy: renderCopy, sentence: renderSentence, real: renderRealDictation })[task.mode]();
    if (task.mode === 'real') return;
  }
  function renderDictation() {
    taskShell(`<label class="pencil-label" for="wordInput">✏️ Mit Apple Pencil oder Tastatur schreiben</label><textarea class="field word-input pencil-entry" id="wordInput" rows="2" autocomplete="off" autocorrect="off" autocapitalize="sentences" spellcheck="false" inputmode="text" enterkeyhint="done" aria-label="Gehörtes Wort selbst schreiben" placeholder="Hier schreiben …"></textarea><button class="primary" id="checkBtn">Prüfen</button>`, 'Tippe auf 🔊. Schreibe danach das Wort.');
    $('#wordInput').value = task.input;
    $('#wordInput').oninput = e => task.input = e.target.value;
    $('#wordInput').onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); $('#checkBtn').click(); } };
    $('#checkBtn').onclick = () => checkTyped(task.word.word);
  }
  function renderGap() {
    taskShell(`<div class="word">${esc(task.gapStart)}<span class="dangerless">__</span>${esc(task.gapEnd)}</div><div class="choices">${task.options.map(o => `<button class="choice" data-answer="${esc(o)}">${esc(o)}</button>`).join('')}</div><p class="hint">Achte auf die knifflige Stelle: ${esc(task.word.focus)}.</p>`, 'Welche Buchstaben fehlen?');
    $$('.choice').forEach(b => b.onclick = () => checkChoice(b, normalize(b.dataset.answer) === normalize(task.answer)));
  }
  function renderSyllables() {
    taskShell(`<div class="syllable-counter" id="claps">${'👏'.repeat(task.input.length)}</div><button class="primary" id="clapBtn">Klatsch! 👏</button><button class="secondary" id="doneBtn">Fertig</button>`, 'Tippe einmal für jede Silbe.');
    $('#clapBtn').onclick = () => { task.input += 'x'; $('#claps').textContent = '👏'.repeat(task.input.length); tone('soft'); }; $('#doneBtn').onclick = () => checkSyllables();
  }
  function renderSalad() {
    taskShell(`<div class="answer-line" id="answer">${esc(task.input)}</div><div class="keyboard">${task.letters.map((c,i) => `<button class="key" data-i="${i}">${esc(c)}</button>`).join('')}<button class="key wide" id="undoBtn">↩</button></div><button class="primary" id="checkBtn">Prüfen</button>`, 'Tippe die Buchstaben in der richtigen Reihenfolge.');
    $$('.key[data-i]').forEach(b => b.onclick = () => { if (b.disabled) return; task.input += task.letters[+b.dataset.i]; b.disabled = true; $('#answer').textContent = task.input; });
    $('#undoBtn').onclick = () => { task.input = ''; renderSalad(); }; $('#checkBtn').onclick = () => checkTyped(task.word.word);
  }
  function renderReading() {
    taskShell(`<div class="word" id="flashWord">${esc(task.word.word)}</div><div class="choices" id="emojiChoices" hidden>${task.options.map((o,i) => `<button class="choice" data-i="${i}">${o.label}</button>`).join('')}</div>`, 'Lies das Wort. Gleich wählst du das passende Bild.');
    setTimeout(() => { const w = $('#flashWord'), c = $('#emojiChoices'); if (!w || !c) return; w.classList.add('hidden-word'); w.textContent = task.word.word; c.hidden = false; $$('.choice', c).forEach(b => b.onclick = () => checkChoice(b, task.options[+b.dataset.i].answer)); }, state.settings.turbo ? 1600 : 2600);
  }
  function renderNoun() {
    taskShell(`<div class="word">${esc(task.word.word)}</div><p class="hint">Kann man <strong>der, die oder das</strong> davor sagen?</p><div class="choices"><button class="choice" data-v="yes">Ja, Nomen</button><button class="choice" data-v="no">Nein</button></div>`, 'Ist dieses Wort ein Nomen?');
    $$('.choice').forEach(b => b.onclick = () => checkChoice(b, (b.dataset.v === 'yes') === (task.word.pos === 'Nomen')));
  }
  function renderExtend() {
    taskShell(`<div class="word">${esc(task.stem)}_</div><p class="hint">Sprich länger: ${esc(task.extension)}</p><div class="choices">${task.options.map(o => `<button class="choice" data-answer="${o}">${o}</button>`).join('')}</div>`, 'Verlängere das Wort. Welcher Endbuchstabe passt?');
    $$('.choice').forEach(b => b.onclick = () => checkChoice(b, b.dataset.answer === task.answer));
  }
  function renderCopy() {
    taskShell(`<div class="paper-icon">✍️</div><div class="word" id="copyWord">${esc(task.word.word)}</div><button class="primary" id="hideBtn">Ich hab’s gemerkt</button>`, 'Schau dir das Wort genau an. Schreibe es dann in dein Heft.');
    $('#hideBtn').onclick = () => { $('#copyWord').classList.add('hidden-word'); $('#hideBtn').remove(); const box = document.createElement('div'); box.innerHTML = `<p class="instruction">Schreibe das Wort jetzt ins Heft. Decke es danach auf.</p><button class="primary" id="revealBtn">Aufdecken</button>`; $('.task-card').insertBefore(box, $('#feedback')); $('#revealBtn').onclick = () => { $('#copyWord').classList.remove('hidden-word'); box.innerHTML = `<p>Vergleiche selbst:</p><button class="primary" id="selfYes">Stimmt! ⭐</button><button class="secondary" id="selfNo">Noch mal</button>`; $('#selfYes').onclick = () => finishTask(true); $('#selfNo').onclick = () => { task.attempts++; round.perfect = false; renderCopy(); }; }; };
  }
  function renderSentence() {
    task.word = { ...task.word, word: task.sentence };
    taskShell(`<div class="dictation-badge">${esc(round.emoji || '📜')} ${esc(round.title || 'Satz-Diktat')}</div><label class="pencil-label" for="sentenceInput">✏️ Mit Apple Pencil oder Tastatur schreiben</label><textarea class="field sentence-input pencil-entry" id="sentenceInput" rows="3" autocomplete="off" autocorrect="off" autocapitalize="sentences" spellcheck="false" inputmode="text" placeholder="Den ganzen Satz hier schreiben …"></textarea><p class="hint">Achte auch auf große Anfangsbuchstaben, Nomen und das Satzzeichen.</p><button class="primary" id="checkBtn">Satz prüfen</button>`, 'Tippe auf 🔊. Schreibe danach den Satz.');
    $('#sentenceInput').value = task.input; $('#sentenceInput').oninput = e => task.input = e.target.value; $('#checkBtn').onclick = () => checkTyped(task.sentence);
  }
  function renderRealDictation() {
    screen.innerHTML = `<div class="progress-wrap"><div class="progress-line"><span>📝 Echtes Diktat</span><span>5 Sätze</span></div><div class="progress-track"><div class="progress-fill" style="width:${task.started ? 50 : 8}%"></div></div></div><section class="task-card real-dictation"><div class="dictation-badge">${esc(round.emoji || '📝')} ${esc(round.title)}</div><h2>Jetzt wie in der Schule</h2><p class="instruction">Die Stimme liest jeden Satz langsam vor und wartet danach etwa sieben Sekunden. Am Ende hörst du das ganze Diktat noch einmal.</p><div class="dictation-status" id="dictationStatus">Das Diktat startet gleich …</div><label class="pencil-label" for="realInput">✏️ Mit Apple Pencil oder Tastatur mitschreiben</label><textarea class="field real-input pencil-entry" id="realInput" spellcheck="false" autocorrect="off" autocapitalize="sentences" inputmode="text" placeholder="Hier mitschreiben …"></textarea><button class="primary" id="realCheck">Diktat prüfen</button><button class="secondary" id="realReplay" hidden>🔊 Noch einmal starten</button><div class="feedback" id="feedback"></div></section>`;
    $('#realInput').value = task.input; $('#realInput').oninput = e => task.input = e.target.value; $('#realCheck').onclick = () => checkTyped(task.fullText); $('#realReplay').onclick = playRealDictation;
    setTimeout(playRealDictation, 650);
  }
  function playRealDictation() {
    const status = $('#dictationStatus'), replay = $('#realReplay'); if (!status || !audioUnlocked) return;
    const run = ++dictationRun; task.started = true; replay.hidden = true; stopSpeech();
    const speakPart = (text, rate, done) => {
      if (run !== dictationRun) return;
      const recorded = state.recordings[normalize(text)];
      if (recorded) { const a = new Audio(recorded); activeAudio = a; a.onended = () => { if (activeAudio === a) activeAudio = null; done(); }; a.onerror = a.onended; a.play().catch(done); return; }
      const u = new SpeechSynthesisUtterance(text); u.lang = 'de-DE'; u.rate = rate; u.pitch = .96; if (germanVoice) u.voice = germanVoice; u.onend = done; u.onerror = done; speechSynthesis.speak(u);
    };
    let i = 0;
    const next = () => {
      if (run !== dictationRun || !$('#dictationStatus')) return;
      if (i < task.sentences.length) {
        const sentenceNumber = i + 1;
        status.textContent = `👂 Satz ${sentenceNumber} von ${task.sentences.length}`;
        speakPart(task.sentences[i], .48, () => {
          if (run !== dictationRun || !$('#dictationStatus')) return;
          status.textContent = `✍️ Schreibpause nach Satz ${sentenceNumber} – Mila wartet.`;
          setTimeout(() => { i++; next(); }, REAL_DICTATION_PAUSE_MS);
        });
        return;
      }
      status.textContent = '🔁 Jetzt kommt das ganze Diktat noch einmal.';
      speakPart('Jetzt hörst du das ganze Diktat noch einmal.', .52, () => setTimeout(() => speakPart(task.fullText, .50, () => { if (run !== dictationRun || !$('#dictationStatus')) return; status.textContent = '✅ Ganz wiederholt. Lies deinen Text jetzt noch einmal durch.'; replay.hidden = false; }), 2200));
    };
    next();
  }
  function checkSyllables() { checkResult(task.input.length === task.word.syllables.length, null, `Das Wort hat ${task.word.syllables.length} Silben.`); }
  function sentenceKey(s) { return String(s).trim().replace(/\s+/g, ' ').replace(/[.!?]+$/, ''); }
  function checkTyped(answer) { stopSpeech(); checkResult(['sentence','real'].includes(task.mode) ? sentenceKey(task.input) === sentenceKey(answer) : normalize(task.input) === normalize(answer)); }
  function checkChoice(button, correct) { checkResult(correct, button); }
  function checkResult(correct, button = null, hint = '') {
    if (correct) return finishTask(true);
    task.attempts++; round.perfect = false; recordError(task.word, task.mode);
    if (button) button.classList.add('soft-mark');
    if (task.attempts < 2) {
      const msg = hint || gentleHint(task.word); $('#feedback').textContent = `Fast! ${msg} Versuch es noch einmal.`; task.input = '';
      if (task.mode === 'dictation' && $('#wordInput')) { $('#wordInput').value = ''; $('#wordInput').focus(); }
      if (task.mode === 'sentence' && $('#sentenceInput')) { $('#sentenceInput').value = ''; $('#sentenceInput').focus(); }
      if (task.mode === 'syllables') $('#claps').textContent = '';
      if (task.mode === 'salad') setTimeout(renderSalad, 650);
      return;
    }
    showCorrection();
  }
  function gentleHint(word) { const f = word.focus || 'Lernwort'; if (/Nomen/i.test(word.pos)) return 'Denk an den großen Anfangsbuchstaben.'; if (/Endbuchstabe/.test(f)) return 'Mach das Wort länger und höre genau hin.'; return `Schau besonders auf ${f}.`; }
  function showCorrection() {
    dictationRun++; stopSpeech(); const isLong = ['sentence','real'].includes(task.mode); const answer = task.mode === 'sentence' ? task.sentence : task.word.word; task.input = '';
    const input = isLong ? '<textarea class="field real-input pencil-entry" id="answer" autocomplete="off" autocorrect="off" autocapitalize="sentences" spellcheck="false" placeholder="Text selbst abschreiben"></textarea>' : '<textarea class="field word-input pencil-entry" id="answer" rows="2" autocomplete="off" autocorrect="off" autocapitalize="sentences" spellcheck="false" inputmode="text" placeholder="Wort selbst abschreiben"></textarea>';
    taskShell(`<p class="instruction">Die Lösung ist:</p><div class="${isLong ? 'sentence' : 'word'}">${esc(answer)}</div><p>Schreibe sie einmal selbst ab.</p>${input}<button class="primary" id="checkBtn">Geschafft?</button>`, 'Schau dir die Lösung an und schreibe sie einmal selbst ab.');
    $('#answer').oninput = e => task.input = e.target.value;
    $('#checkBtn').onclick = () => { const correct = isLong ? sentenceKey(task.input) === sentenceKey(answer) : normalize(task.input) === normalize(answer); if (correct) finishTask(false); else { $('#feedback').textContent = 'Schau noch einmal genau auf die Lösung.'; $(isLong ? '.sentence' : '.word').classList.add('soft-mark'); } };
  }
  function praise(word, clean) {
    const choices = clean ? [`${word.focus || 'Die Stelle'} war knifflig – geschafft!`, 'Genau hingehört und richtig gebaut!', 'Stark! Du bist drangeblieben.', 'Sorgfältig gelöst, Victoria!'] : ['Du hast weitergemacht – das zählt!', 'Mit Hilfe geschafft. Stark drangeblieben!', 'Jetzt kennt dein Kopf das Wort besser.'];
    return shuffle(choices)[0];
  }
  function finishTask(clean) {
    if (task.complete) return; stopSpeech(); if (task.mode === 'real') dictationRun++; task.complete = true; const key = normalize(task.word.word), rec = state.words[key] || { box: 1, right: 0, wrong: 0 };
    if (clean && task.attempts === 0) { rec.right++; rec.box = Math.min(5, rec.box + 1); } else { rec.wrong++; rec.box = 1; }
    const earned = task.mode === 'real' ? 5 : 1;
    state.words[key] = rec; state.stars += earned; round.stars += earned; state.stats.tasks += earned; state.stats.modes[task.mode] = (state.stats.modes[task.mode] || 0) + 1; markPlayed(); saveState(); celebrate();
    const msg = praise(task.word, clean && task.attempts === 0); $('#feedback').innerHTML = `⭐ ${esc(msg)}`;
    setTimeout(() => { round.index++; if (round.index >= round.tasks.length) endRound(); else renderTask(); }, 1150);
  }
  function recordError(word, mode) { const f = mode === 'noun' ? 'Großschreibung' : mode === 'extend' ? 'Endbuchstabe' : word.focus || MODES[mode][0]; state.stats.errors[f] = (state.stats.errors[f] || 0) + 1; }
  function endRound() {
    state.rounds++; state.station = Math.min(30, state.rounds + 1); if (round.perfect) { state.stars += 3; round.stars += 3; }
    const minutes = sessionStart ? Math.max(1, Math.round((Date.now() - sessionStart) / 60000)) : 1; state.stats.minutes += minutes; saveState();
    const over = sessionStart && Date.now() - sessionStart >= state.settings.minutes * 60000;
    if (over) return sessionEnd();
    const moves = ['5 Hampelmänner!','Hüpf 5-mal wie ein Frosch!','Streck dich hoch wie ein Baum!','Schüttle Arme und Beine aus!']; const move = shuffle(moves)[0];
    screen.innerHTML = `<section class="hero break-screen"><h1>${esc(round.title || 'Runde')} geschafft! ⭐</h1><p class="lead">Du hast ${round.stars} Sterne gesammelt${round.perfect ? ' – plus 3 Bonussterne!' : ' und bist drangeblieben!'}</p><h2>${move}</h2><div class="countdown" id="countdown">10</div><button class="secondary" id="skipBreak">Pause fertig</button></section>`;
    stopSpeech(); let n = 10; const timer = setInterval(() => { n--; const el = $('#countdown'); if (!el) return clearInterval(timer); el.textContent = n; if (n <= 0) { clearInterval(timer); home(); } }, 1000); $('#skipBreak').onclick = () => { clearInterval(timer); home(); };
  }
  function sessionEnd() {
    sessionStart = null; stopSpeech(); screen.innerHTML = `<section class="hero">${mascot()}<h1>Mission geschafft!</h1><p class="lead">Victoria, du hast heute richtig Ausdauer gezeigt. Morgen geht’s weiter!</p><p class="word">⭐ ${state.stars}</p><button class="primary" id="homeAfter">Zurück zur Blockwelt</button></section>`; $('#homeAfter').onclick = home;
  }

  function getUnlocked() { const all = [{s:0,e:'🐣',n:'Moosküken'},{s:8,e:'🦕',n:'Smaragd-Dino'},{s:18,e:'🦊',n:'Kupferfuchs'},{s:30,e:'🚀',n:'Block-Rakete'},{s:45,e:'🐉',n:'Wolken-Drache'},{s:65,e:'🏰',n:'Sternenburg'}]; return all.filter(x => state.stars >= x.s); }
  function collectionView() {
    const all = [{s:0,e:'🐣',n:'Moosküken'},{s:8,e:'🦕',n:'Smaragd-Dino'},{s:18,e:'🦊',n:'Kupferfuchs'},{s:30,e:'🚀',n:'Block-Rakete'},{s:45,e:'🐉',n:'Wolken-Drache'},{s:65,e:'🏰',n:'Sternenburg'}];
    screen.innerHTML = `<section class="panel"><div class="panel-head"><h1>Victorias Sammlung</h1><button class="secondary" id="back">Zurück</button></div><p>Fürs Dranbleiben wachsen neue Freunde und Bauwerke.</p><div class="collection-grid">${all.map(x => `<div class="collection-item ${state.stars < x.s ? 'locked' : ''}"><div class="big">${state.stars < x.s ? '🔒' : x.e}</div><strong>${esc(x.n)}</strong><small>${state.stars < x.s ? `<br>bei ${x.s} Sternen` : '<br>freigeschaltet!'}</small></div>`).join('')}</div></section>`; $('#back').onclick = home;
  }
  function mapView() {
    screen.innerHTML = `<section class="panel"><div class="panel-head"><h1>Level-Karte</h1><button class="secondary" id="back">Zurück</button></div><p>Jede kurze Runde baut eine neue Station.</p><div class="map">${Array.from({length:12},(_,i)=>`<div class="station ${i+1 < state.station ? 'done' : i+1 === state.station ? 'current' : ''}">${i+1 < state.station ? '✓' : i+1}</div>`).join('')}</div></section>`; $('#back').onclick = home;
  }

  function parentGate() {
    const a = 6 + Math.floor(Math.random()*4), b = 7 + Math.floor(Math.random()*3), answer = a*b;
    screen.innerHTML = `<section class="gate"><h1>Bereich für Erwachsene</h1><p>Bitte lösen: <strong>${a} × ${b} = ?</strong></p><input id="gateInput" class="field" inputmode="numeric" aria-label="Ergebnis"><button class="primary" id="gateGo">Öffnen</button><button class="secondary" id="gateBack">Zurück</button><div id="gateMsg" class="feedback"></div></section>`;
    $('#gateGo').onclick = () => { if (+$('#gateInput').value === answer) parentArea('lists'); else $('#gateMsg').textContent = 'Das passt noch nicht. Bitte noch einmal rechnen.'; }; $('#gateBack').onclick = home;
  }
  function parentArea(tab = 'lists') {
    const content = tab === 'lists' ? listsPanel() : tab === 'settings' ? settingsPanel() : tab === 'stats' ? statsPanel() : backupPanel();
    screen.innerHTML = `<section class="panel"><div class="panel-head"><h1>Elternbereich</h1><button class="secondary" id="parentClose">Fertig</button></div><div class="tabs">${[['lists','Wortlisten'],['settings','Einstellungen'],['stats','Statistik'],['backup','Backup']].map(([id,label])=>`<button data-tab="${id}" class="${tab===id?'active':''}">${label}</button>`).join('')}</div><div id="parentContent">${content}</div></section>`;
    $('#parentClose').onclick = home; $$('.tabs button').forEach(b => b.onclick = () => parentArea(b.dataset.tab));
    wireParent(tab);
  }
  function listsPanel() {
    return `<div class="list-card"><h2>Neue Schulliste</h2><label>Name<input class="field" id="listName" placeholder="z. B. Diktat 14.10."></label><label>Ein Wort oder Satz pro Zeile<textarea class="field" id="listWords" placeholder="Biene&#10;Wiese&#10;Die Biene fliegt."></textarea></label><button class="primary" id="saveList">Liste speichern</button></div>
      <h2>Gespeicherte Listen</h2>${state.lists.length ? state.lists.map(l => `<div class="list-card"><h3>${esc(l.name)} ${l.active ? '✅ aktiv' : ''}</h3><p>${l.items.length} Einträge</p><button class="secondary activate-list" data-id="${l.id}">${l.active ? 'Deaktivieren' : 'Als Wochenliste wählen'}</button><button class="secondary edit-list" data-id="${l.id}">Bearbeiten</button><button class="text-btn delete-list" data-id="${l.id}">Entfernen</button></div>`).join('') : '<p>Noch keine eigene Liste. Ohne Liste nutzt das Spiel den Grundwortschatz.</p>'}
      <div class="list-card"><h2>Eigene menschliche Aussprache</h2><p>Ein Elternteil kann ein Wort oder einen kompletten Diktatsatz einsprechen. Diese Aufnahme ersetzt dann die Computerstimme.</p><input id="recordWord" class="field" placeholder="Wort oder Satz genau eingeben"><div class="recording"><button class="primary" id="recordBtn">🎙️ Aufnehmen</button><button class="secondary" id="stopRecord" disabled>⏹ Stoppen</button><button class="secondary" id="playRecord">▶ Anhören</button></div><p id="recordStatus"></p></div>`;
  }
  function settingsPanel() {
    const german = voices.filter(v => /^de([-_]|$)/i.test(v.lang));
    const voiceOptions = german.map(v => `<option value="${esc(v.voiceURI)}" ${state.settings.voiceURI === v.voiceURI ? 'selected' : ''}>${esc(v.name)} (${esc(v.lang)})${v.localService ? ' · offline' : ''}</option>`).join('');
    return `<div class="settings-grid"><div class="setting"><label>Sitzungsdauer: <span id="minutesOut">${state.settings.minutes}</span> Minuten</label><input id="minutes" type="range" min="5" max="10" value="${state.settings.minutes}"></div><div class="setting"><label>Schwierigkeit</label><select id="difficulty" class="field"><option value="1">1 – leicht</option><option value="2">2 – mittel</option><option value="3">3 – knifflig</option><option value="4">4 – echtes Diktat</option></select></div><div class="setting"><label><input id="settingSound" type="checkbox" ${state.settings.sound?'checked':''}> Sounds einschalten</label></div><div class="setting"><label><input id="turbo" type="checkbox" ${state.settings.turbo?'checked':''}> freiwilliger Turbo-Modus</label></div></div><div class="list-card"><h2>Stimme auswählen</h2><p>„Automatisch“ bevorzugt natürlich klingende deutsche Stimmen. Welche Stimmen vorhanden sind, hängt vom Tablet ab.</p><select id="voiceSelect" class="field"><option value="">Automatisch beste deutsche Stimme</option>${voiceOptions}</select><button class="secondary" id="voicePreview">🔊 Stimme probehören</button>${german.length ? '' : '<p class="speech-note">Auf diesem Gerät wurde noch keine deutsche Stimme gefunden.</p>'}</div><h2>Aktive Spielmodi</h2><div class="mode-list">${Object.entries(MODES).filter(([id])=>id!=='real').map(([id,[name,icon]])=>`<button class="toggle ${state.settings.activeModes.includes(id)?'on':''}" data-mode="${id}">${icon} ${name}</button>`).join('')}</div><button class="primary" id="saveSettings">Einstellungen speichern</button>`;
  }
  function statsPanel() {
    const weak = Object.entries(state.words).sort((a,b)=>(b[1].wrong||0)-(a[1].wrong||0)).slice(0,8);
    return `<div class="settings-grid"><div class="stat-card"><strong>${state.stats.tasks}</strong><br>Aufgaben geübt</div><div class="stat-card"><strong>${state.rounds}</strong><br>Runden geschafft</div><div class="stat-card"><strong>${state.stats.minutes}</strong><br>Minuten geübt</div><div class="stat-card"><strong>${state.stars}</strong><br>Sterne gesammelt</div></div><h2>Häufig knifflige Wörter</h2>${weak.length?`<table class="table"><thead><tr><th>Wort</th><th>Fehler</th><th>Leitner-Fach</th></tr></thead><tbody>${weak.map(([w,r])=>`<tr><td>${esc(w)}</td><td>${r.wrong||0}</td><td>${r.box||1}</td></tr>`).join('')}</tbody></table>`:'<p>Noch keine Daten.</p>'}<h2>Fehlertypen</h2>${Object.entries(state.stats.errors).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`<div class="list-card"><strong>${esc(k)}</strong>: ${v}</div>`).join('')||'<p>Noch keine Fehler gespeichert.</p>'}`;
  }
  function backupPanel() { return `<div class="list-card"><h2>Backup</h2><p>Export speichert Fortschritt, Listen und Einstellungen als JSON-Datei. Aufnahmen können die Datei vergrößern.</p><button class="primary" id="exportBtn">JSON exportieren</button><button class="secondary" id="importBtn">JSON importieren</button></div>`; }
  function wireParent(tab) {
    if (tab === 'lists') {
      $('#saveList').onclick = saveList;
      $$('.activate-list').forEach(b=>b.onclick=()=>{const l=state.lists.find(x=>x.id===b.dataset.id); const was=l.active; state.lists.forEach(x=>x.active=false); l.active=!was; saveState(); parentArea('lists');});
      $$('.delete-list').forEach(b=>b.onclick=()=>{state.lists=state.lists.filter(x=>x.id!==b.dataset.id);saveState();parentArea('lists');});
      $$('.edit-list').forEach(b=>b.onclick=()=>{const l=state.lists.find(x=>x.id===b.dataset.id);$('#listName').value=l.name;$('#listWords').value=l.items.map(x=>x.text).join('\n');state.lists=state.lists.filter(x=>x.id!==l.id);});
      $('#recordBtn').onclick = startRecording; $('#stopRecord').onclick = stopRecording; $('#playRecord').onclick = playRecording;
    } else if (tab === 'settings') {
      $('#difficulty').value=state.settings.difficulty; $('#minutes').oninput=e=>$('#minutesOut').textContent=e.target.value;
      $$('.toggle').forEach(b=>b.onclick=()=>b.classList.toggle('on'));
      $('#voicePreview').onclick=()=>{unlockAudio();state.settings.voiceURI=$('#voiceSelect').value;initVoices();speak('Hallo Victoria. Ich lese dir die Wörter jetzt ruhig und deutlich vor.');};
      $('#saveSettings').onclick=()=>{const active=$$('.toggle.on').map(b=>b.dataset.mode); if(active.length<2)return showToast('Bitte mindestens zwei Spielmodi aktiv lassen.'); state.settings.minutes=+$('#minutes').value;state.settings.difficulty=+$('#difficulty').value;state.settings.sound=$('#settingSound').checked;state.settings.turbo=$('#turbo').checked;state.settings.voiceURI=$('#voiceSelect').value;state.settings.activeModes=active;initVoices();saveState();showToast('Einstellungen gespeichert.');};
    } else if (tab === 'backup') { $('#exportBtn').onclick=exportData; $('#importBtn').onclick=()=>$('#importFile').click(); }
  }
  function saveList() {
    const name=$('#listName').value.trim(), lines=$('#listWords').value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean); if(!name||!lines.length)return showToast('Bitte Name und mindestens einen Eintrag angeben.');
    const id=`l${Date.now()}`; state.lists.push({id,name,active:state.lists.length===0,items:lines.map(text=>({text,type:/\s/.test(text.trim())?'sentence':'word'}))});saveState();parentArea('lists');
  }
  async function startRecording() {
    recordTarget=$('#recordWord').value.trim(); if(!recordTarget)return showToast('Bitte zuerst das Wort eingeben.');
    if(!navigator.mediaDevices||!window.MediaRecorder)return showToast('Aufnahmen werden in diesem Browser nicht unterstützt.');
    try { const stream=await navigator.mediaDevices.getUserMedia({audio:true}); recorder=new MediaRecorder(stream);recordChunks=[];recorder.ondataavailable=e=>recordChunks.push(e.data);recorder.onstop=()=>saveRecording(stream);recorder.start();$('#recordStatus').textContent=`Aufnahme für „${recordTarget}“ läuft …`;$('#recordBtn').disabled=true;$('#stopRecord').disabled=false; } catch { showToast('Mikrofonzugriff wurde nicht erlaubt.'); }
  }
  function stopRecording(){if(recorder&&recorder.state==='recording')recorder.stop();}
  function saveRecording(stream){const blob=new Blob(recordChunks,{type:recorder.mimeType});const reader=new FileReader();reader.onload=()=>{try{state.recordings[normalize(recordTarget)]=reader.result;saveState();$('#recordStatus').textContent=`Aufnahme für „${recordTarget}“ gespeichert.`;}catch{$('#recordStatus').textContent='Aufnahme ist zu groß für den Browserspeicher.';}finally{$('#recordBtn').disabled=false;$('#stopRecord').disabled=true;stream.getTracks().forEach(t=>t.stop());}};reader.readAsDataURL(blob);}
  function playRecording(){const word=$('#recordWord').value.trim();if(!state.recordings[normalize(word)])return showToast('Für dieses Wort gibt es noch keine Aufnahme.');stopSpeech();activeAudio=new Audio(state.recordings[normalize(word)]);activeAudio.onended=()=>activeAudio=null;activeAudio.play();}
  function exportData(){const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`victorias-blockwelt-backup-${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(a.href);}
  $('#importFile').onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const data=JSON.parse(r.result);if(!data.settings||!data.stats)throw new Error();state={...structuredClone(defaultState),...data};saveState();showToast('Backup importiert.');parentArea('backup');}catch{showToast('Diese JSON-Datei ist kein gültiges Backup.');}};r.readAsText(f);};

  $('#homeBtn').onclick = () => { dictationRun++; stopSpeech(); home(); };
  $('#parentBtn').onclick = () => { dictationRun++; stopSpeech(); parentGate(); };
  $('#soundBtn').onclick = () => { state.settings.sound=!state.settings.sound;saveState();tone('soft'); };
  window.addEventListener('beforeunload', () => { if(sessionStart){state.stats.minutes += Math.max(1,Math.round((Date.now()-sessionStart)/60000));saveState();} });
  if ('serviceWorker' in navigator) window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
  updateChrome(); state.firstVisit ? welcome() : home();
})();
