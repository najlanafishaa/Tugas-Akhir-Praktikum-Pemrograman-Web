const exprEl = document.getElementById('expression');
const resEl = document.getElementById('result');
const historyListEl = document.getElementById('historyList');
const memIndEl = document.getElementById('mem-ind');
const clearHistoryBtn = document.getElementById('clearHistory');

let expression = '';
let current = '';
let memory = 0;
let history = [];
const MAX_HISTORY = 5;

function renderDisplay() {
  exprEl.textContent = expression;
  resEl.textContent = current || (expression ? '...' : '0');
}

function escapeHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function pushHistory(expr, res) {
  history.unshift({expr, res});
  if (history.length > MAX_HISTORY) history.pop();
  renderHistory();
}

function renderHistory() {
  historyListEl.innerHTML = '';
  if (history.length === 0) {
    historyListEl.innerHTML = '<div class="empty">Belum ada riwayat</div>';
    return;
  }
  history.forEach(item => {
    const row = document.createElement('div');
    row.className = 'history-item';
    const left = document.createElement('div');
    left.innerHTML = `<div>${escapeHtml(item.expr)}</div>`;
    const right = document.createElement('div');
    right.innerHTML = `<div><b>${escapeHtml(item.res)}</b></div>`;
    row.appendChild(left); 
    row.appendChild(right);

    row.addEventListener('click', () => {
      expression = item.expr;
      current = '';
      renderDisplay();
    });

    historyListEl.appendChild(row);
  });
  memIndEl.textContent = formatMem(memory);
}

function formatMem(m) {
  return Number.isInteger(m) ? String(m) : parseFloat(m.toFixed(10));
}

function sanitizeForEval(s) {
  return s.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g,'-');
}

function hasLiteralDivideByZero(expr) {
  const noSpaces = expr.replace(/\s+/g,'');
  return /(\/|÷)0+(?:\.0+)?(?:$|[^0-9\.])/.test(noSpaces);
}

function safeEvaluate(expr) {
  const s = sanitizeForEval(expr);
  const fn = new Function('return (' + s + ')');
  return fn();
}

document.getElementById('buttons').addEventListener('click', (e) => {
  const t = e.target;
  if (!t) return;
  const num = t.dataset.num;
  const op = t.dataset.op;

  if (num !== undefined) {
    if (current === '0' && num === '0') return;
    if (current === '0' && num !== '.') current = num;
    else current += num;
    renderDisplay();
    return;
  }

  if (op !== undefined) {
    if (!current && !expression && op === '−') { current = '-'; renderDisplay(); return; }

    if (!current && expression) {
      expression = expression.replace(/[\+\-×÷\s]+$/,'') + ' ' + op + ' ';
      renderDisplay();
      return;
    }
    if (current) {
      expression = (expression ? expression + ' ' : '') + current + ' ' + op + ' ';
      current = '';
      renderDisplay();
    }
    return;
  }

  if (t.id === 'dot') {
    if (!current) current = '0.';
    else if (!current.includes('.')) current += '.';
    renderDisplay();
    return;
  }

  if (t.id === 'backspace') {
    if (current) current = current.slice(0,-1);
    else {
      expression = expression.replace(/\s+$/,'').replace(/[\+\-×÷]$/,'');
    }
    renderDisplay();
    return;
  }

  if (t.id === 'clearEntry') {
    current = '';
    renderDisplay();
    return;
  }

  if (t.id === 'clearAll') {
    current = '';
    expression = '';
    renderDisplay();
    return;
  }

  if (t.id === 'equals') {
    handleEquals();
    return;
  }

  if (t.id === 'mplus') { 
    memory += parseFloat(current || (expression ? tryEvaluatePreview(expression) : 0)) || 0; 
    memIndEl.textContent = formatMem(memory); 
    return; 
  }
  if (t.id === 'mminus') { 
    memory -= parseFloat(current || (expression ? tryEvaluatePreview(expression) : 0)) || 0; 
    memIndEl.textContent = formatMem(memory); 
    return; 
  }
  if (t.id === 'mr') { 
    current = formatMem(memory); 
    renderDisplay(); 
    return; 
  }
  if (t.id === 'mc') { 
    memory = 0; 
    memIndEl.textContent = formatMem(memory); 
    return; 
  }
});

function tryEvaluatePreview(exprOnly) {
  try {
    return safeEvaluate(sanitizeForEval(exprOnly));
  } catch {
    return 0;
  }
}

function handleEquals() {
  const full = (expression + (current ? (expression ? ' ' : '') + current : '')).trim();
  if (!full) return;

  if (hasLiteralDivideByZero(full)) {
    resEl.textContent = '∞';
    pushHistory(full, 'Tidak bisa dibagi 0');
    expression = '';
    current = '';
    return;
  }

  try {
    const result = safeEvaluate(full);
    if (!isFinite(result)) {
      resEl.textContent = '∞';
      pushHistory(full, 'Tidak bisa dibagi 0');
      expression = '';
      current = '';
      return;
    }
    const out = Number.isInteger(result) ? result : parseFloat(result.toFixed(10));
    pushHistory(full, out);
    expression = '';
    current = String(out);
    renderDisplay();
  } catch {
    resEl.textContent = 'Error';
    pushHistory(full, 'Error');
    expression = '';
    current = '';
  }
}

window.addEventListener('keydown', (e) => {
  const k = e.key;

  if ((/^[0-9]$/).test(k)) {
    if (current === '0') current = k;
    else current += k;
    renderDisplay();
    e.preventDefault();
    return;
  }
  if (k === '.') { document.getElementById('dot').click(); e.preventDefault(); return; }
  if (k === 'Enter' || k === '=') { document.getElementById('equals').click(); e.preventDefault(); return; }
  if (k === 'Backspace') { document.getElementById('backspace').click(); e.preventDefault(); return; }
  if (k === 'Escape') { document.getElementById('clearAll').click(); e.preventDefault(); return; }

  if (k === '+' || k === '-' || k === '*' || k === '/') {
    const map = {'+':'+','-':'−','*':'×','/':'÷'};
    const opSym = map[k];
    const opBtn = Array.from(document.querySelectorAll('[data-op]')).find(b => b.dataset.op === opSym);
    if (opBtn) opBtn.click();
    e.preventDefault();
    return;
  }
});

clearHistoryBtn.addEventListener('click', () => {
  history = [];
  renderHistory();
});

renderDisplay();
renderHistory();

(function attachFallbackIDs(){
  if (!document.getElementById('dot')) {
    const b = Array.from(document.querySelectorAll('.btn')).find(x => x.textContent === '.');
    if (b) b.id = 'dot';
  }
  if (!document.getElementById('backspace')) {
    const b = Array.from(document.querySelectorAll('.btn')).find(x => x.textContent.trim() === '⌫');
    if (b) b.id = 'backspace';
  }
  if (!document.getElementById('equals')) {
    const b = Array.from(document.querySelectorAll('.btn')).find(x => x.textContent.trim() === '=');
    if (b) b.id = 'equals';
  }
})();
