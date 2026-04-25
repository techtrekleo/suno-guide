// Suno 教學 App - 互動邏輯

const SECTIONS = [
  { id: 'intro',      num: '01', label: '開始之前' },
  { id: 'workflow',   num: '02', label: '基本流程' },
  { id: 'style',      num: '03', label: 'Style 欄位' },
  { id: 'instruments',num: '04', label: '常用樂器' },
  { id: 'genres',     num: '05', label: '音樂風格' },
  { id: 'structure',  num: '06', label: '歌詞結構' },
  { id: 'brackets',   num: '07', label: '[ ] 與 ( ) 用法' },
  { id: 'builder',    num: '08', label: '結構模擬器' },
  { id: 'mistakes',   num: '09', label: '常見錯誤' },
  { id: 'cheatsheet', num: '10', label: '快速速查' },
];

// === Navigation ===
function buildNav() {
  const nav = document.getElementById('nav-list');
  nav.innerHTML = SECTIONS.map(s => `
    <button class="nav-item" data-target="${s.id}">
      <span class="num">${s.num}</span>
      <span>${s.label}</span>
    </button>
  `).join('');

  nav.querySelectorAll('.nav-item').forEach(b => {
    b.addEventListener('click', () => goTo(b.dataset.target));
  });
}

function goTo(id) {
  document.querySelectorAll('.section').forEach(s => s.classList.toggle('active', s.id === id));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.target === id));
  updateProgress(id);
  document.querySelector('.main').scrollTo({ top: 0, behavior: 'smooth' });
  window.scrollTo({ top: 0, behavior: 'smooth' });

  // wire section nav buttons after render
  const idx = SECTIONS.findIndex(s => s.id === id);
  const prev = document.querySelector(`#${id} .sec-prev`);
  const next = document.querySelector(`#${id} .sec-next`);
  if (prev) prev.onclick = () => idx > 0 && goTo(SECTIONS[idx - 1].id);
  if (next) next.onclick = () => idx < SECTIONS.length - 1 && goTo(SECTIONS[idx + 1].id);
}

function updateProgress(activeId) {
  document.querySelectorAll('.section').forEach(sec => {
    const idx = SECTIONS.findIndex(s => s.id === sec.id);
    const prog = sec.querySelector('.progress-dots');
    const text = sec.querySelector('.progress-text');
    if (prog) {
      prog.innerHTML = SECTIONS.map((_, i) => `<span class="progress-dot ${i === idx ? 'active' : ''}"></span>`).join('');
    }
    if (text) text.textContent = `${SECTIONS[idx].num} / ${String(SECTIONS.length).padStart(2,'0')} · ${SECTIONS[idx].label}`;
  });
}

// === Copy buttons ===
function wireCopy() {
  document.body.addEventListener('click', async (e) => {
    const btn = e.target.closest('.copy-btn');
    if (!btn) return;
    const block = btn.closest('.codeblock');
    const code = block.querySelector('pre').innerText;
    try {
      await navigator.clipboard.writeText(code);
      const old = btn.textContent;
      btn.textContent = '已複製 ✓';
      btn.classList.add('copied');
      setTimeout(() => { btn.textContent = old; btn.classList.remove('copied'); }, 1500);
    } catch {
      btn.textContent = '請手動複製';
    }
  });
}

// === Tabs ===
function wireTabs() {
  document.querySelectorAll('.tabs').forEach(group => {
    group.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.dataset.tab;
        const scope = group.parentElement;
        group.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t === tab));
        scope.querySelectorAll(':scope > .tab-panel').forEach(p =>
          p.classList.toggle('active', p.dataset.panel === target)
        );
      });
    });
  });
}

// === Lyrics Structure Builder (drag & drop) ===
const BLOCK_TYPES = [
  { name: 'Intro',       hint: '前奏/開場' },
  { name: 'Verse',       hint: '主歌（敘事）' },
  { name: 'Pre-Chorus',  hint: '導歌（情緒鋪墊）' },
  { name: 'Chorus',      hint: '副歌（記憶點）' },
  { name: 'Bridge',      hint: '橋段（轉折）' },
  { name: 'Instrumental',hint: '間奏' },
  { name: 'Outro',       hint: '尾奏/收尾' },
];

const SAMPLE_LYRICS = {
  'Intro':       '',
  'Verse':       '街燈把影子拉長 我獨自走過熟悉的轉角\n那些說好的明天 像紙飛機飄遠了',
  'Pre-Chorus':  '心跳越來越大聲 一句話含在嘴裡不敢說',
  'Chorus':      '愛你像呼吸一樣 不需要理由\n每一秒都是奇蹟 每一刻都剛好',
  'Bridge':      '如果時間能倒流 我還是會選擇你',
  'Instrumental':'',
  'Outro':       '哼 啦 啦 啦…（漸弱）',
};

function buildPalette() {
  const palette = document.getElementById('block-palette');
  palette.innerHTML = BLOCK_TYPES.map(b => `
    <div class="block-source" draggable="true" data-name="${b.name}">
      <span><span class="b-name">[${b.name}]</span></span>
      <span class="b-hint">${b.hint}</span>
    </div>
  `).join('');
  palette.querySelectorAll('.block-source').forEach(el => {
    el.addEventListener('dragstart', e => {
      e.dataTransfer.setData('text/blockname', el.dataset.name);
      e.dataTransfer.setData('text/source', 'palette');
      e.dataTransfer.effectAllowed = 'copy';
    });
  });
}

function setupCanvas() {
  const canvas = document.getElementById('block-canvas');
  canvas.addEventListener('dragover', e => {
    e.preventDefault();
    canvas.classList.add('drag-over');
    e.dataTransfer.dropEffect = e.dataTransfer.types.includes('text/source') &&
      e.dataTransfer.getData ? 'move' : 'copy';
  });
  canvas.addEventListener('dragleave', e => {
    if (e.target === canvas) canvas.classList.remove('drag-over');
  });
  canvas.addEventListener('drop', e => {
    e.preventDefault();
    canvas.classList.remove('drag-over');
    const name = e.dataTransfer.getData('text/blockname');
    const source = e.dataTransfer.getData('text/source');
    if (source === 'canvas') {
      // reorder existing
      const draggingEl = canvas.querySelector('.dragging');
      const after = getDragAfter(canvas, e.clientY);
      if (draggingEl) {
        if (after == null) canvas.appendChild(draggingEl);
        else canvas.insertBefore(draggingEl, after);
      }
    } else if (name) {
      addBlock(name);
    }
    renderOutput();
  });
}

function getDragAfter(container, y) {
  const els = [...container.querySelectorAll('.block:not(.dragging)')];
  return els.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) return { offset, element: child };
    return closest;
  }, { offset: Number.NEGATIVE_INFINITY, element: null }).element;
}

function addBlock(name) {
  const canvas = document.getElementById('block-canvas');
  const el = document.createElement('div');
  el.className = 'block';
  el.draggable = true;
  el.dataset.name = name;
  el.innerHTML = `
    <span><span class="b-name">[${name}]</span></span>
    <button class="remove" title="移除">✕</button>
  `;
  el.addEventListener('dragstart', e => {
    el.classList.add('dragging');
    e.dataTransfer.setData('text/blockname', name);
    e.dataTransfer.setData('text/source', 'canvas');
    e.dataTransfer.effectAllowed = 'move';
  });
  el.addEventListener('dragend', () => {
    el.classList.remove('dragging');
    renderOutput();
  });
  el.querySelector('.remove').addEventListener('click', () => {
    el.remove();
    renderOutput();
  });
  canvas.appendChild(el);
}

function renderOutput() {
  const canvas = document.getElementById('block-canvas');
  const out = document.getElementById('builder-output');
  const blocks = [...canvas.querySelectorAll('.block')];
  if (!blocks.length) {
    out.innerHTML = '<span class="empty">組合完成後會在這裡產出 Suno 可用的歌詞範本</span>';
    return;
  }
  const text = blocks.map(b => {
    const name = b.dataset.name;
    const lyric = SAMPLE_LYRICS[name] || '';
    return `[${name}]${lyric ? '\n' + lyric : ''}`;
  }).join('\n\n');
  out.textContent = text;
}

function clearCanvas() {
  document.getElementById('block-canvas').innerHTML = '';
  renderOutput();
}

function loadPreset() {
  clearCanvas();
  ['Intro','Verse','Pre-Chorus','Chorus','Verse','Pre-Chorus','Chorus','Bridge','Chorus','Outro']
    .forEach(addBlock);
  renderOutput();
}

async function copyOutput() {
  const out = document.getElementById('builder-output').textContent;
  if (!out || out.includes('組合完成後')) return;
  try {
    await navigator.clipboard.writeText(out);
    const btn = document.getElementById('copy-output');
    const old = btn.textContent;
    btn.textContent = '已複製 ✓';
    setTimeout(() => btn.textContent = old, 1500);
  } catch {}
}

// === Init ===
document.addEventListener('DOMContentLoaded', () => {
  buildNav();
  buildPalette();
  setupCanvas();
  wireCopy();
  wireTabs();
  goTo('intro');
  renderOutput();

  document.getElementById('clear-canvas')?.addEventListener('click', clearCanvas);
  document.getElementById('load-preset')?.addEventListener('click', loadPreset);
  document.getElementById('copy-output')?.addEventListener('click', copyOutput);
});
