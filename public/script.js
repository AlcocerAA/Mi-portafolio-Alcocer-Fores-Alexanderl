function generateContributions(year) {
  const cells = [];
  const start = new Date(year, 0, 1);
  const startDay = start.getDay();
  const totalWeeks = 53;

  const today = new Date();

  for (let w = 0; w < totalWeeks; w++) {
    for (let d = 0; d < 7; d++) {
      const dayOffset = w * 7 + d - startDay;
      const date = new Date(year, 0, 1 + dayOffset);
      const isFuture = date > today;
      const isCurrentYear = date.getFullYear() === year;
      let level = 0;

      if (!isFuture && isCurrentYear) {
        const month = date.getMonth();
        if (month <= 2) {
          const r = Math.random();
          if (r < 0.12) level = 0;
          else if (r < 0.30) level = 1;
          else if (r < 0.55) level = 2;
          else if (r < 0.78) level = 3;
          else level = 4;
          if (d === 0 || d === 6) level = Math.max(0, level - 1);
        } else if (month <= 5) {
          const r = Math.random();
          if (r < 0.55) level = 0;
          else if (r < 0.72) level = 1;
          else if (r < 0.85) level = 2;
          else if (r < 0.94) level = 3;
          else level = 4;
        } else {
          const r = Math.random();
          if (r < 0.70) level = 0;
          else if (r < 0.82) level = 1;
          else if (r < 0.92) level = 2;
          else if (r < 0.97) level = 3;
          else level = 4;
        }
      }

      cells.push({
        date,
        level: (isFuture || !isCurrentYear) ? -1 : level,
        week: w,
        dayOfWeek: d
      });
    }
  }
  return cells;
}

function countContribs(cells) {
  return cells.filter(c => c.level > 0).reduce((acc, c) => acc + [1,2,4,7,10][c.level] || 0, 0);
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

let currentYear = 2026;
let cellElements = [];
let cellData = [];

function renderCalendar(year) {
  const grid = document.getElementById('contribGrid');
  const monthLabels = document.getElementById('monthLabels');
  grid.innerHTML = '';
  monthLabels.innerHTML = '';

  cellData = generateContributions(year);
  cellElements = [];

  const monthPositions = {};
  cellData.forEach(c => {
    if (c.level !== -1 || c.date.getFullYear() === year) {
      const m = c.date.getMonth();
      if (c.date.getFullYear() === year && !monthPositions[m]) {
        monthPositions[m] = c.week;
      }
    }
  });

  let lastWeek = -1;
  const labelContainer = document.createElement('div');
  labelContainer.style.cssText = 'display:flex; padding-left:32px; margin-bottom:4px; position:relative; height:16px;';

  const totalWeeks = 53;
  Object.keys(monthPositions).sort((a,b)=>a-b).forEach(m => {
    const w = monthPositions[m];
    const span = document.createElement('span');
    span.className = 'month-label';
    span.textContent = MONTHS[m];
    span.style.cssText = `position:absolute; left:${32 + w * 16}px; font-size:11px; color:var(--text-2); white-space:nowrap;`;
    labelContainer.appendChild(span);
  });
  monthLabels.parentNode.replaceChild(labelContainer, monthLabels);
  labelContainer.id = 'monthLabels';

  cellData.forEach((c, idx) => {
    const el = document.createElement('div');
    el.className = 'contrib-cell';
    const level = c.level < 0 ? 0 : c.level;
    el.dataset.level = c.level < 0 ? 0 : level;
    el.dataset.idx = idx;

    const dateStr = c.level < 0 ? '' :
      c.date.toLocaleDateString('en-US', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
    const contribCount = c.level <= 0 ? 0 : [1,3,5,8,12][c.level];
    el.dataset.tooltip = c.level < 0
      ? 'No data'
      : `${contribCount} contribution${contribCount !== 1 ? 's' : ''} on ${dateStr}`;

    el.addEventListener('mouseenter', showTooltip);
    el.addEventListener('mouseleave', hideTooltip);

    grid.appendChild(el);
    cellElements.push(el);
  });

  const total = cellData.filter(c => c.level > 0).length * 6 + 247;
  document.getElementById('contribCount').textContent = total.toLocaleString();

  setTimeout(() => startWorm(), 800);
}

const tooltip = document.getElementById('tooltip');

function showTooltip(e) {
  const txt = e.target.dataset.tooltip;
  if (!txt || txt === 'No data') return;
  tooltip.textContent = txt;
  tooltip.classList.add('visible');
  positionTooltip(e);
}

function hideTooltip() {
  tooltip.classList.remove('visible');
}

document.addEventListener('mousemove', e => {
  if (tooltip.classList.contains('visible')) positionTooltip(e);
});

function positionTooltip(e) {
  const x = e.clientX;
  const y = e.clientY;
  const tw = tooltip.offsetWidth;
  const th = tooltip.offsetHeight;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  let left = x + 12;
  let top  = y - th - 8;

  if (left + tw > vw - 10) left = x - tw - 12;
  if (top < 10) top = y + 16;

  tooltip.style.left = left + 'px';
  tooltip.style.top  = top  + 'px';
}

let wormInterval = null;
let wormPath = [];
let wormPos = 0;
const WORM_LENGTH = 5; 

function buildWormPath() {
  const activeCells = cellData
    .map((c, i) => ({ ...c, idx: i }))
    .filter(c => c.level > 0);

  if (activeCells.length === 0) return [];

  activeCells.sort((a, b) => a.date - b.date);

  const byWeek = {};
  activeCells.forEach(c => {
    if (!byWeek[c.week]) byWeek[c.week] = [];
    byWeek[c.week].push(c);
  });

  const path = [];
  const weeks = Object.keys(byWeek).sort((a,b) => +a - +b);
  let goDown = true;

  weeks.forEach(w => {
    let col = byWeek[w].slice().sort((a,b) => a.dayOfWeek - b.dayOfWeek);
    if (!goDown) col = col.reverse();
    col.forEach(c => path.push(c.idx));
    goDown = !goDown;
  });

  return path;
}

function clearWormClasses() {
  cellElements.forEach(el => {
    el.classList.remove('worm-head','worm-body-1','worm-body-2','worm-body-3','worm-tail');
  });
}

function paintWorm(pos) {
  clearWormClasses();
  const classes = ['worm-head','worm-body-1','worm-body-2','worm-body-3','worm-tail'];
  for (let i = 0; i < WORM_LENGTH; i++) {
    const pathIdx = pos - i;
    if (pathIdx < 0) continue;
    const cellIdx = wormPath[pathIdx];
    if (cellIdx === undefined) continue;
    const el = cellElements[cellIdx];
    if (!el) continue;
    el.classList.add(classes[i]);
  }
}

function eatCell(cellIdx) {
  const el = cellElements[cellIdx];
  if (!el) return;
  el.classList.add('eaten');
  el.dataset.level = '0';
}

function startWorm() {
  if (wormInterval) clearInterval(wormInterval);

  wormPath = buildWormPath();
  if (wormPath.length === 0) return;

  cellElements.forEach((el, idx) => {
    el.classList.remove('eaten');
    const level = cellData[idx]?.level;
    el.dataset.level = level < 0 ? 0 : (level || 0);
  });

  wormPos = 0;

  wormInterval = setInterval(() => {
    paintWorm(wormPos);

    const eatIdx = wormPos - WORM_LENGTH;
    if (eatIdx >= 0) {
      eatCell(wormPath[eatIdx]);
    }

    wormPos++;

    if (wormPos >= wormPath.length + WORM_LENGTH) {
      clearInterval(wormInterval);
      clearWormClasses();

      setTimeout(() => {
        restoreCells();
      }, 1200);
    }
  }, 80);
}

function restoreCells() {
  const eaten = wormPath.slice();
  let i = 0;
  const restore = setInterval(() => {
    if (i >= eaten.length) { clearInterval(restore); return; }
    const cellIdx = eaten[i];
    const el = cellElements[cellIdx];
    if (el) {
      el.classList.remove('eaten');
      el.dataset.level = cellData[cellIdx]?.level || 0;
    }
    i += 3;
  }, 25);

  setTimeout(() => startWorm(), 2000);
}

function switchYear(year) {
  if (wormInterval) clearInterval(wormInterval);
  currentYear = year;
  document.querySelectorAll('.year-tab').forEach(t => {
    t.classList.toggle('active', +t.dataset.year === year);
  });
  renderCalendar(year);
}

const PROJECTS = [
  {
    id: 1,
    type: 'Company',
    title: 'Everything Alpaca',
    desc: 'Empresa Textil, Pagina web de Eccomerce',
    tags: [{ label:'JavaScript', cls:'tag-nextjs'}, {label:'Html-CSS-JS', cls:'tag-supabase'}, {label:'react', cls:'tag-edge'}],
    year: '2025',
    buttons: [{ icon:'globe', label:'Website', href:'https://everything-alpaca.vercel.app/' }]
  },
];

const ICONS = {
  globe: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
  github: `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/></svg>`,
  play:   `<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`
};

const TYPE_LABELS = {
  freelance: 'Freelance',
  company: 'Company',
  'open-source': 'Open Source',
  personal: 'Personal'
};

function buildCard(p) {
  const typeClass = `type-${p.type}`;
  const typeLabel = TYPE_LABELS[p.type];

  const tagsHTML = p.tags.map(t =>
    `<span class="tag ${t.cls}">${t.label}</span>`
  ).join('');

  const buttonsHTML = p.buttons.map(b =>
    `<a href="${b.href}" target="_blank" class="card-btn">${ICONS[b.icon] || ''}${b.label}</a>`
  ).join('');

  return `
    <div class="project-card" data-type="${p.type}">
      <div class="card-top">
        <span class="type-badge ${typeClass}">${typeLabel}</span>
        <span class="card-year">${p.year}</span>
      </div>
      <div class="card-title">${p.title}</div>
      <div class="card-desc">${p.desc}</div>
      <div class="card-tags">${tagsHTML}</div>
      ${buttonsHTML ? `<div class="card-buttons">${buttonsHTML}</div>` : ''}
    </div>
  `;
}

function renderProjects(filter) {
  const grid = document.getElementById('projectsGrid');
  const filtered = filter === 'all'
    ? PROJECTS
    : PROJECTS.filter(p => p.type === filter);

  grid.innerHTML = filtered.map(p => buildCard(p)).join('');

  document.getElementById('projectCount').textContent =
    `${filtered.length} project${filtered.length !== 1 ? 's' : ''}`;

  const cols = getComputedColumnsCount();
  const cards = grid.querySelectorAll('.project-card');
  const total = cards.length;
  const lastRowStart = total - ((total % cols) || cols);
  cards.forEach((c, i) => {
    c.classList.toggle('last-row', i >= lastRowStart);
  });
}

function getComputedColumnsCount() {
  const w = window.innerWidth;
  if (w > 1100) return 4;
  if (w > 900) return 3;
  if (w > 600) return 2;
  return 1;
}

function filterProjects(filter, btn) {
  document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  renderProjects(filter);
}

document.addEventListener('DOMContentLoaded', () => {
  renderCalendar(currentYear);
  renderProjects('all');

  window.addEventListener('resize', () => {
    const active = document.querySelector('.filter-tab.active');
    if (active) renderProjects(active.dataset.filter);
  });
});
