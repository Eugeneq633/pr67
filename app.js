/* ===== Чисті функції (без доступу до DOM): їх перевіряє tests.js ===== */
const ALLOWED_STATES = ['loading', 'content', 'empty', 'error'];
const ALLOWED_ROUTES = ['catalog', 'details', 'library', 'feedback'];

// Чи є назва стану допустимою
function isValidState(state) {
  return typeof state === 'string' && ALLOWED_STATES.includes(state);
}

// Чи є назва маршруту допустимою
function isValidRoute(route) {
  return typeof route === 'string' && ALLOWED_ROUTES.includes(route);
}

// Текст валідний, якщо це рядок, не порожній після trim() і не довший за maxLength
function validateInput(value, maxLength = 500) {
  if (typeof value !== 'string') return false;
  const text = value.trim();
  return text.length > 0 && text.length <= maxLength;
}

// Проста перевірка пошти: щось@щось.домен без пробілів
function validateEmail(value) {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
}

// Безпечне посилання: лише https і домен lnk.to (офіційні сторінки прослуховування)
function isSafeUrl(value) {
  if (typeof value !== 'string') return false;
  try {
    const u = new URL(value);
    return u.protocol === 'https:' && (u.hostname === 'lnk.to' || u.hostname.endsWith('.lnk.to'));
  } catch (e) {
    return false;
  }
}

// Запит для пошуку: рядок без пробілів по краях, нижній регістр
function normalizeQuery(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

// Фільтрація треків за назвою або виконавцем; порожній запит або пробіли повертають усі елементи
function filterTracks(tracks, query) {
  if (!Array.isArray(tracks)) return [];
  const q = normalizeQuery(query);
  if (!q) return tracks.slice();
  return tracks.filter(t => `${t.title} ${t.artist}`.toLowerCase().includes(q));
}

// Скорочення довгого тексту для показу в інтерфейсі
function truncate(text, max = 60) {
  const s = typeof text === 'string' ? text : '';
  return s.length > max ? s.slice(0, max) + '…' : s;
}

/* ===== Інтерфейс ===== */
(() => {
  const DEFAULT_ROUTE = 'catalog';
  const sections = document.querySelectorAll('main > section');
  const links = document.querySelectorAll('nav a');

  // Хеш-маршрутизація: показуємо одну секцію, решту ховаємо класом
  function render() {
    const hash = location.hash.slice(1);
    const route = isValidRoute(hash) ? hash : DEFAULT_ROUTE;
    sections.forEach(s => s.classList.toggle('is-hidden', s.id !== route));
    links.forEach(a => {
      if (a.getAttribute('href') === '#' + route) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    const active = document.getElementById(route);
    document.title = active.dataset.title + ' — Саундтрек GTA VI';
    if (hash) active.querySelector('h1').focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }
  window.addEventListener('hashchange', render);
  render();

  // State Monitor: таймер сесії на setInterval
  const timerEl = document.getElementById('timer');
  let seconds = 0;
  window.setInterval(() => {
    seconds++;
    const m = String(Math.floor(seconds / 60)).padStart(2, '0');
    const s = String(seconds % 60).padStart(2, '0');
    timerEl.textContent = `${m}:${s}`;
  }, 1000);

  // Посилання «Слухати»: адреса вставляється лише після перевірки isSafeUrl
  function makeListenLink(track, className) {
    if (!isSafeUrl(track.url)) return null;
    const a = document.createElement('a');
    a.className = className;
    a.href = track.url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.textContent = 'Слухати';
    a.setAttribute('aria-label', `Слухати ${track.title} — ${track.artist} (відкриється в новій вкладці)`);
    return a;
  }

  /* ----- Каталог: таблиця зі згрупованими рядками ----- */
  (function buildCatalog() {
    const body = document.getElementById('catalogBody');
    let lastEdition = '';
    TRACKS.forEach(t => {
      if (t.edition !== lastEdition) {
        lastEdition = t.edition;
        const g = document.createElement('tr');
        g.className = 'group-row';
        const th = document.createElement('th');
        th.colSpan = 4; th.scope = 'colgroup'; th.textContent = t.edition;
        g.append(th);
        body.append(g);
      }
      const tr = document.createElement('tr');
      const n = document.createElement('td'); n.className = 'num'; n.textContent = t.id;
      const title = document.createElement('td'); title.className = 'title'; title.textContent = t.title;
      const artist = document.createElement('td'); artist.textContent = t.artist;
      const act = document.createElement('td');
      const link = makeListenLink(t, 'link');
      if (link) act.append(link);
      tr.append(n, title, artist, act);
      body.append(tr);
    });
  })();

  /* ----- Медіатека: стани екрана ----- */
  let items = [...TRACKS];
  let loadTimer = null;

  const stateBlocks = document.querySelectorAll('[data-state]');
  const switchBtns = document.querySelectorAll('[data-switch]');
  const cardList = document.getElementById('cardList');
  const filterInput = document.getElementById('libraryFilter');
  const emptyText = document.getElementById('emptyText');
  const countText = document.getElementById('countText');

  function renderState(name) {
    if (!isValidState(name)) return;
    stateBlocks.forEach(b => b.classList.toggle('is-hidden', b.dataset.state !== name));
    switchBtns.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.switch === name)));
  }

  // Картки малюємо через DOM-API та textContent: дані ніколи не стають HTML
  function renderCards(visible) {
    cardList.replaceChildren();
    visible.forEach(t => {
      const li = document.createElement('li');
      li.className = 'card';
      const tile = document.createElement('div');
      tile.className = 'tile tile-' + (t.id % 6);
      tile.setAttribute('aria-hidden', 'true');
      tile.textContent = String(t.id).padStart(2, '0');
      const body = document.createElement('div');
      body.className = 'card-body';
      const h2 = document.createElement('h2'); h2.textContent = t.title;
      const meta = document.createElement('span'); meta.className = 'meta'; meta.textContent = t.artist;
      const actions = document.createElement('div'); actions.className = 'card-actions';
      const link = makeListenLink(t, 'link');
      const del = document.createElement('button');
      del.type = 'button'; del.className = 'btn btn-small btn-danger'; del.textContent = 'Видалити';
      del.setAttribute('aria-label', 'Видалити трек ' + t.title);
      del.addEventListener('click', () => { items = items.filter(x => x.id !== t.id); showData(); });
      if (link) actions.append(link);
      actions.append(del);
      body.append(h2, meta, actions);
      li.append(tile, body);
      cardList.append(li);
    });
  }

  // Є що показати -> content, інакше empty з поясненням
  function showData() {
    const visible = filterTracks(items, filterInput.value);
    if (visible.length > 0) {
      renderCards(visible);
      countText.textContent = `Показано ${visible.length} з ${TRACKS.length}`;
      renderState('content');
      return;
    }
    const q = filterInput.value.trim();
    emptyText.textContent = items.length === 0
      ? 'Усі треки видалено.'
      : `За запитом «${truncate(q, 60)}» нічого не знайдено.`;
    renderState('empty');
  }

  // Імітація асинхронного завантаження: loading 1.5-2 с, потім content
  function load() {
    window.clearTimeout(loadTimer);
    renderState('loading');
    loadTimer = window.setTimeout(showData, 1500 + Math.random() * 500);
  }

  switchBtns.forEach(b => b.addEventListener('click', () => {
    window.clearTimeout(loadTimer);
    const s = b.dataset.switch;
    if (s === 'content') showData(); else renderState(s);
  }));
  document.getElementById('refreshBtn').addEventListener('click', load);
  document.getElementById('retryBtn').addEventListener('click', load);
  document.getElementById('resetBtn').addEventListener('click', () => {
    items = [...TRACKS];
    filterInput.value = '';
    showData();
  });
  filterInput.addEventListener('input', showData);
  document.getElementById('filterForm').addEventListener('submit', e => e.preventDefault());
  showData();

  /* ----- Форма зворотного зв'язку з валідацією ----- */
  const form = document.getElementById('feedbackForm');
  const status = document.getElementById('formStatus');
  const fields = [
    { input: 'fbName', err: 'fbNameErr', ok: v => validateInput(v, 60), msg: "Вкажіть ім'я (до 60 символів)." },
    { input: 'fbEmail', err: 'fbEmailErr', ok: validateEmail, msg: 'Вкажіть коректну електронну пошту.' },
    { input: 'fbMessage', err: 'fbMessageErr', ok: v => validateInput(v, 500), msg: 'Напишіть повідомлення (до 500 символів).' }
  ];
  form.addEventListener('submit', e => {
    e.preventDefault();
    status.textContent = '';
    let firstBad = null;
    fields.forEach(f => {
      const input = document.getElementById(f.input);
      const err = document.getElementById(f.err);
      const good = f.ok(input.value);
      input.setAttribute('aria-invalid', String(!good));
      err.textContent = good ? '' : f.msg;
      if (!good && !firstBad) firstBad = input;
    });
    if (firstBad) { firstBad.focus(); return; }
    status.textContent = `Дякуємо, ${truncate(document.getElementById('fbName').value.trim(), 60)}! Повідомлення прийнято.`;
    form.reset();
  });
})();
