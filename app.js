const destinations = [
  { id: 'start', label: 'START', title: 'START', description: 'The future, remembered.<br>A new transmission from OFFICAL DODDS.' },
  { id: 'identity', label: 'IDENTITY', title: 'IDENTITY', description: 'A 1970s vision of tomorrow.<br>Expressive letterforms. Polished surfaces. Confident space.' },
  { id: 'work', label: 'WORK', title: 'WORK', description: 'A place for things made with intent.' },
  { id: 'playground', label: 'PLAYGROUND', title: 'PLAYGROUND', description: 'The typography is the imagery.<br>Take it for a spin.' },
  { id: 'journal', label: 'JOURNAL', title: 'JOURNAL', description: 'Notes from the world of OFFICAL DODDS.' },
  { id: 'archive', label: 'ARCHIVE', title: 'ARCHIVE', description: 'The past, kept in the present.' },
  { id: 'contact', label: 'CONTACT', title: 'CONTACT', description: 'The beginning of a new conversation.' },
  { id: 'options', label: 'OPTIONS', title: 'OPTIONS', description: 'Make yourself at home.<br>Fine-tune your experience.' },
];

// Coordinates trace the supplied 956 × 720 reference. Each panel shares
// the curved left edge and sloping right edge with its neighbouring panel.
const rows = [
  { y: 46, bottom: 134, left: 162, nextLeft: 114, right: 484, nextRight: 430, control: 148 },
  { y: 134, bottom: 218, left: 114, nextLeft: 80, right: 478, nextRight: 425, control: 93 },
  { y: 218, bottom: 304, left: 80, nextLeft: 48, right: 425, nextRight: 378, control: 62 },
  { y: 304, bottom: 390, left: 48, nextLeft: 31, right: 378, nextRight: 332, control: 37 },
  { y: 390, bottom: 476, left: 31, nextLeft: 23, right: 332, nextRight: 289, control: 25 },
  { y: 476, bottom: 562, left: 23, nextLeft: 23, right: 289, nextRight: 250, control: 20 },
  { y: 562, bottom: 648, left: 23, nextLeft: 33, right: 250, nextRight: 216, control: 26 },
  { y: 648, bottom: 734, left: 33, nextLeft: 55, right: 216, nextRight: 189, control: 41 },
];
const svgNS = 'http://www.w3.org/2000/svg';
const menu = document.querySelector('#menu-items');
let selected = 0;
let audioContext;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const compactLayout = window.matchMedia('(max-width: 900px)');
const menuToggle = document.querySelector('#menu-toggle');
const mobileMenu = document.querySelector('#mobile-menu');
let mobileMenuOpen = false;
let preferences = { sound: false, motion: !reducedMotion.matches, texture: true };
try { preferences = { ...preferences, ...JSON.parse(localStorage.getItem('dodds-preferences') || '{}') }; } catch { /* Storage is optional. */ }

function element(name, attributes, text) {
  const node = document.createElementNS(svgNS, name);
  Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, value));
  if (text) node.textContent = text;
  return node;
}

function shape(row, active) {
  const extension = active ? 50 : 0;
  return `M${row.left} ${row.y}H${row.right + extension}L${row.nextRight + extension} ${row.bottom}H${row.nextLeft}Q${row.control} ${(row.y + row.bottom) / 2} ${row.left} ${row.y}Z`;
}

const buttons = destinations.map((destination, i) => {
  const row = rows[i];
  const button = element('g', { class: 'menu-item', role: 'button', tabindex: '0', 'aria-label': destination.label, 'data-destination': destination.id });
  button.append(element('path', { class: 'panel', d: shape(row, false) }));
  button.append(element('path', { class: 'panel-edge', d: `M${row.left + 2} ${row.y + 3}H${row.right - 4}` }));
  const center = (row.y + row.bottom) / 2;
  const fontSize = [25, 25, 25, 19, 22, 20, 17, 16][i];
  button.append(element('text', { class: 'menu-label', x: row.nextRight - 17, y: center + 9, 'text-anchor': 'end', 'font-size': fontSize }, destination.label));
  button.append(element('text', { class: 'menu-index', x: Math.max(row.left + 25, i === 0 ? 236 : 40), y: i === 0 ? center + 2 : row.y + 16 }, String(i + 1).padStart(2, '0')));
  button.append(element('path', { class: 'menu-arrow', d: `M${row.nextRight + 26} ${center - 5}l8 6l-8 6Z` }));
  button.addEventListener('click', () => select(i, true));
  button.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); select(i, true); }
  });
  menu.append(button);
  return button;
});

const mobileLinks = destinations.map((destination, i) => {
  const link = document.createElement('a');
  link.href = `#${destination.id}`;
  link.className = 'mobile-menu-link';
  link.style.setProperty('--item-index', i);
  link.innerHTML = `<span class="mobile-menu-index" aria-hidden="true">${String(i + 1).padStart(2, '0')}</span><span>${destination.label}</span><span class="mobile-menu-arrow" aria-hidden="true">↗</span>`;
  link.addEventListener('click', event => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    select(i, true);
  });
  document.querySelector('#mobile-menu-items').append(link);
  return link;
});

function setMobileMenu(open, restoreFocus = false) {
  mobileMenuOpen = open && compactLayout.matches;
  mobileMenu.hidden = !mobileMenuOpen;
  menuToggle.setAttribute('aria-expanded', String(mobileMenuOpen));
  menuToggle.setAttribute('aria-label', mobileMenuOpen ? 'Close menu' : 'Open menu');
  if (mobileMenuOpen) window.scrollTo({ top: 0, behavior: 'auto' });
  if (restoreFocus) menuToggle.focus({ preventScroll: true });
}

menuToggle.addEventListener('click', () => setMobileMenu(!mobileMenuOpen));
menuToggle.addEventListener('keydown', event => {
  if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
  event.preventDefault();
  setMobileMenu(true);
  mobileLinks[event.key === 'ArrowDown' ? 0 : mobileLinks.length - 1].focus();
});
mobileMenu.addEventListener('keydown', event => {
  const index = mobileLinks.indexOf(document.activeElement);
  if (index < 0) return;
  let next;
  if (event.key === 'ArrowDown') next = (index + 1) % mobileLinks.length;
  if (event.key === 'ArrowUp') next = (index + mobileLinks.length - 1) % mobileLinks.length;
  if (event.key === 'Home') next = 0;
  if (event.key === 'End') next = mobileLinks.length - 1;
  if (next !== undefined) { event.preventDefault(); mobileLinks[next].focus(); }
});

function syncLayout() {
  const focus = document.activeElement;
  const wasInMobileMenu = mobileMenu.contains(focus) || focus === menuToggle;
  setMobileMenu(false);
  if (!compactLayout.matches && wasInMobileMenu) buttons[selected].focus({ preventScroll: true });
  if (compactLayout.matches && menu.contains(focus)) menuToggle.focus({ preventScroll: true });
}
// Older Safari exposes MediaQueryList.addListener instead of addEventListener.
if (compactLayout.addEventListener) compactLayout.addEventListener('change', syncLayout);
else compactLayout.addListener(syncLayout);

const content = {
  identity: `<span class="detail-label">01 / THE DESIGN LANGUAGE</span><p class="detail-copy">Sculptural type. Cool metal. Deep blue.<br>A world built from oversized letters, bold crops and a little retro futurism. One voice throughout: Syne ExtraBold 800.</p><span class="detail-label">02 / THE PALETTE</span><div class="palette"><div class="swatch" style="background:#071426"><span>#071426</span></div><div class="swatch" style="background:#255cff"><span>#255CFF</span></div><div class="swatch" style="background:#bfe9ff"><span>#BFE9FF</span></div><div class="swatch" style="background:#c6cfda"><span>#C6CFDA</span></div><div class="swatch" style="background:#f5f8fc"><span>#F5F8FC</span></div></div>`,
  work: `<div class="empty-state"><span class="detail-label">SELECTED WORK / 00</span><h2>A space for what comes next.</h2><p class="detail-copy">No projects have been published here yet.<br>For now, explore the visual language behind this world.</p></div><button class="action-button" data-go="playground">ENTER THE PLAYGROUND <span aria-hidden="true">↗</span></button>`,
  playground: `<label class="type-input-label" for="type-input">YOUR LETTERS. OUR WORLD.<input class="type-input" id="type-input" maxlength="5" value="OD" autocomplete="off" spellcheck="false" aria-label="Try up to five letters"></label><div class="type-playground" id="type-preview" aria-hidden="true">OD</div><div class="finish-controls" role="group" aria-label="Typography finish"><button data-finish="chrome" aria-pressed="true">CHROME</button><button data-finish="cobalt" aria-pressed="false">COBALT</button><button data-finish="ice" aria-pressed="false">ICE</button></div>`,
  journal: `<article class="transmission"><span class="entry-date">TRANSMISSION 001 / DESIGN NOTES</span><h2>The future, remembered.</h2><p>A 1970s vision of tomorrow: expressive letterforms, polished surfaces and confident space.</p><p>Blue is the field. Chrome is the finish.<br>The typography is the imagery.</p><span class="entry-date">FROM THE OFFICAL DODDS BRAND GUIDELINES / V0.1</span></article>`,
  archive: `<div class="empty-state"><span class="detail-label">ARCHIVE / 00</span><h2>Every future has a past.</h2><p class="detail-copy">The archive is empty for now.<br>Past projects and transmissions will live here.</p></div><button class="action-button" data-go="journal">READ TRANSMISSION 001 <span aria-hidden="true">↗</span></button>`,
  contact: `<div class="empty-state"><span class="detail-label">CONTACT / NOT YET CONNECTED</span><h2>Stay on this frequency.</h2><p class="detail-copy">Contact details haven't been added yet.</p></div><p class="contact-note">In the meantime, explore the identity and the ideas behind OFFICAL DODDS.</p><button class="action-button" data-go="identity">EXPLORE THE IDENTITY <span aria-hidden="true">↗</span></button>`,
  options: `<div class="option-row"><span>MENU SOUND</span><button type="button" data-option="sound"></button></div><div class="option-row"><span>BACKGROUND MOTION</span><button type="button" data-option="motion"></button></div><div class="option-row"><span>SCREEN TEXTURE</span><button type="button" data-option="texture"></button></div><button class="action-button" id="restore-preferences">RESTORE DEFAULTS</button>`,
};

function playTone() {
  if (!preferences.sound) return;
  try {
    audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === 'suspended') audioContext.resume();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(520 + selected * 45, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(820, audioContext.currentTime + .07);
    gain.gain.setValueAtTime(.025, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001, audioContext.currentTime + .12);
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start(); oscillator.stop(audioContext.currentTime + .12);
  } catch { /* Menu remains functional without audio support. */ }
}

function applyPreferences() {
  document.body.dataset.motion = preferences.motion ? 'on' : 'off';
  document.body.dataset.texture = preferences.texture ? 'on' : 'off';
  document.querySelector('.sound-toggle').setAttribute('aria-pressed', String(preferences.sound));
  document.querySelector('#sound-status').textContent = preferences.sound ? 'ON' : 'OFF';
  document.querySelectorAll('[data-option]').forEach(button => {
    const isOn = preferences[button.dataset.option];
    button.textContent = isOn ? 'ON' : 'OFF';
    button.setAttribute('aria-pressed', String(isOn));
    button.setAttribute('aria-label', `${button.dataset.option}: ${isOn ? 'on' : 'off'}`);
  });
  try { localStorage.setItem('dodds-preferences', JSON.stringify(preferences)); } catch { /* Storage is optional. */ }
}

function select(index, userInitiated = false) {
  selected = (index + destinations.length) % destinations.length;
  const destination = destinations[selected];
  buttons.forEach((button, i) => {
    const active = i === selected;
    const row = rows[i];
    button.classList.toggle('selected', active);
    button.setAttribute('aria-pressed', String(active));
    button.querySelector('.panel').setAttribute('d', shape(row, active));
    button.querySelector('.panel-edge').setAttribute('d', `M${row.left + 2} ${row.y + 3}H${row.right - 4 + (active ? 50 : 0)}`);
    button.querySelector('.menu-label').setAttribute('x', row.nextRight - 17 + (active ? 20 : 0));
  });
  mobileLinks.forEach((link, i) => {
    if (i === selected) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  document.querySelector('#dial-number').textContent = String(selected + 1).padStart(2, '0');
  document.querySelector('#scene-index').textContent = `${String(selected + 1).padStart(2, '0')} / 08`;
  document.querySelector('#scene-title').textContent = destination.title;
  document.querySelector('#scene-description').innerHTML = destination.description;
  document.querySelector('#scene-content').innerHTML = content[destination.id] || '';
  document.querySelector('.scene').classList.toggle('has-content', selected !== 0);
  document.querySelector('#footer-status').textContent = selected === 0 ? 'AWAITING YOUR NEXT MOVE' : `${destination.label} / NOW EXPLORING`;
  document.title = `OFFICAL DODDS — ${selected ? destination.label : 'The future, remembered.'}`;
  if (userInitiated) {
    if (location.hash !== `#${destination.id}`) history.pushState(null, '', `#${destination.id}`);
    playTone();
  }
  applyPreferences();
  wireContent();
  const focusWasInMenu = mobileMenu.contains(document.activeElement);
  setMobileMenu(false);
  if (compactLayout.matches && (userInitiated || focusWasInMenu)) {
    document.querySelector('#scene-title').focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'auto' });
  }
}

function wireContent() {
  document.querySelectorAll('[data-go]').forEach(button => button.addEventListener('click', () => select(destinations.findIndex(d => d.id === button.dataset.go), true)));
  document.querySelectorAll('[data-option]').forEach(button => button.addEventListener('click', () => {
    preferences[button.dataset.option] = !preferences[button.dataset.option];
    applyPreferences(); playTone();
  }));
  document.querySelector('#restore-preferences')?.addEventListener('click', () => {
    preferences = { sound: false, motion: !reducedMotion.matches, texture: true };
    applyPreferences();
  });
  document.querySelector('#type-input')?.addEventListener('input', event => {
    const value = event.target.value.toUpperCase();
    const preview = document.querySelector('#type-preview');
    preview.textContent = value || 'OD';
    preview.style.fontSize = value.length > 3 ? 'clamp(40px, 6vw, 90px)' : '';
  });
  document.querySelectorAll('[data-finish]').forEach(button => button.addEventListener('click', () => {
    document.querySelector('#type-preview').dataset.finish = button.dataset.finish;
    document.querySelectorAll('button[data-finish]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    playTone();
  }));
}

document.querySelector('.sound-toggle').addEventListener('click', () => {
  preferences.sound = !preferences.sound;
  applyPreferences(); playTone();
});
document.querySelector('#reset-button').addEventListener('click', () => select(0, true));
document.querySelector('.brand-link').addEventListener('click', event => { event.preventDefault(); select(0, true); });
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && mobileMenuOpen) {
    event.preventDefault(); setMobileMenu(false, true); return;
  }
  // Mobile uses native link/tab navigation; do not focus the hidden SVG menu.
  if (compactLayout.matches) return;
  if (event.target.matches('input,textarea,select') || event.metaKey || event.ctrlKey || event.altKey) return;
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault(); select(selected + (event.key === 'ArrowDown' ? 1 : -1), true); buttons[selected].focus({ preventScroll: true });
  } else if (event.key === 'Escape') {
    event.preventDefault(); select(0, true); buttons[0].focus({ preventScroll: true });
  } else if (event.key === 'Enter' && !event.target.closest('button,a,[role="button"]')) {
    event.preventDefault(); buttons[selected].focus({ preventScroll: true }); playTone();
  }
});
function selectFromHash() { const index = destinations.findIndex(d => `#${d.id}` === location.hash); select(index >= 0 ? index : 0); }
window.addEventListener('popstate', selectFromHash);
window.addEventListener('hashchange', selectFromHash);
selectFromHash();
