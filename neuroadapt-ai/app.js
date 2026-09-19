/* NeuroAdapt AI – prototype: rule-based adaptive engine (swap decide() for an ML model in production) */
const $ = id => document.getElementById(id);
const clamp = (v, a = 0, b = 100) => Math.max(a, Math.min(b, Math.round(v)));
const LV = ['Beginner', 'Intermediate', 'Advanced'];
const AX = { font: 60, motion: 60, simple: 70, tts: 75 }; // cognitive-load thresholds for auto accessibility

const Q = [
  [ { q: 'Plants make their food using which energy source?', o: ['Sunlight', 'Wind', 'Sand', 'Moonlight'], a: 0, v: '☀️ → 🌱 → 🍬', h: 'Plants catch sunlight and turn it into food.' },
    { q: 'Which gas do plants take in for photosynthesis?', o: ['Oxygen', 'Carbon dioxide', 'Nitrogen', 'Helium'], a: 1, v: '💨 CO₂ → 🌿 → 🍬', h: 'Leaves take in CO₂ from the air.' } ],
  [ { q: 'Where in a plant cell does photosynthesis mainly occur?', o: ['Nucleus', 'Mitochondria', 'Chloroplast', 'Vacuole'], a: 2, v: '🌿 leaf → 🔬 cell → 🟢 chloroplast', h: 'Chloroplasts hold the green pigment.' },
    { q: 'Which pigment captures light energy?', o: ['Melanin', 'Chlorophyll', 'Keratin', 'Haemoglobin'], a: 1, v: '☀️ → 🟢 chlorophyll → ⚡', h: 'Chlorophyll is the green pigment that absorbs light.' } ],
  [ { q: 'What are the end products of photosynthesis?', o: ['Glucose and oxygen', 'CO₂ and water', 'ATP and CO₂', 'Starch and nitrogen'], a: 0, v: 'CO₂ + H₂O + ☀️ → 🍬 glucose + O₂', h: '6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂.' },
    { q: 'The light-dependent reactions take place in the…', o: ['Stroma', 'Thylakoid membranes', 'Cell wall', 'Cytoplasm'], a: 1, v: '🟢 chloroplast → 📚 thylakoids → ⚡ ATP', h: 'Light reactions run on thylakoid membranes; the Calvin cycle runs in the stroma.' } ]
];

let S;
function init() {
  S = { lvl: 1, mode: 'text', step: false, ok: 0, n: 0, avg: 0, times: [], wrong: 0, right: 0, pend: null, last: null,
        load: 35, qc: [0, 0, 0], style: { v: 60, a: 45, t: 62 }, ax: { font: 0, motion: 0, simple: 0, tts: 0 }, log: [] };
  log('Student opened lesson');
  showQ();
}
const log = m => S.log.push([new Date().toLocaleTimeString('en-GB'), m]);
const speak = t => { try { speechSynthesis.cancel(); speechSynthesis.speak(new SpeechSynthesisUtterance(t)); } catch (e) {} };
const bars = (el, a) => $(el).innerHTML = a.map(([l, v]) => `<div class="bar"><small><span>${l}</span><span>${v}%</span></small><i><em style="width:${v}%"></em></i></div>`).join('');

function showQ() {
  const q = Q[S.lvl][S.qc[S.lvl]++ % 2];
  S.cur = q; S.t0 = Date.now(); S.done = 0;
  $('qtext').textContent = q.q;
  $('opts').innerHTML = q.o.map((t, i) => `<button data-i="${i}">${'ABCD'[i]}. ${t}</button>`).join('');
  $('vis').hidden = !(S.mode === 'visual' || S.step);
  $('vis').innerHTML = '<b>Visual explanation</b>' + (S.mode === 'visual' ? `<div class="flow">${q.v}</div>` : '') + (S.step ? `<p>💡 Step by step: ${q.h}</p>` : '');
  $('fb').textContent = ''; $('next').hidden = true;
  if (S.ax.tts) speak(q.q);
  render();
}

// ---- Adaptive decision engine (rules) ----
function autoAx() {
  let n = 0;
  for (const k in AX) if (S.load >= AX[k] && !S.ax[k]) { S.ax[k] = 1; n++; }
  if (n) log(`AI auto-applied ${n} accessibility adaptation${n > 1 ? 's' : ''}`);
}
function decide(ok, t) {
  S.pend = null;
  if (!ok && (S.wrong >= 2 || t > 8)) {
    const lvl = Math.max(0, S.lvl - 1);
    S.pend = { lvl };
    S.last = {
      why: [`${S.wrong} consecutive error${S.wrong > 1 ? 's' : ''} detected`, `Average response time ${S.avg.toFixed(1)}s`, `Cognitive load → ${S.load >= 60 ? 'HIGH' : 'RISING'}`],
      dec: [S.lvl > lvl ? `Reduce difficulty → ${LV[lvl]}` : 'Keep easiest difficulty', 'Switch to visual content', 'Activate guided step-by-step explanation']
    };
    log('Cognitive load ↑ — adaptation proposed');
  } else if (ok && S.right >= 2 && S.avg < 6 && S.lvl < 2) {
    S.lvl++; S.mode = 'text'; S.step = false; S.right = 0;
    S.last = {
      why: ['2 correct answers in a row', `Average response time ${S.avg.toFixed(1)}s`, 'Cognitive load → LOW'],
      dec: [`Increase difficulty → ${LV[S.lvl]}`, 'Return to text content', 'Remove step-by-step support']
    };
    log(`Accuracy improved — difficulty ↑ ${LV[S.lvl]}`);
  }
}

$('opts').onclick = e => {
  const b = e.target.closest('button');
  if (!b || S.done) return;
  S.done = 1;
  const t = (Date.now() - S.t0) / 1000, ok = +b.dataset.i === S.cur.a;
  [...$('opts').children].forEach((x, i) => { if (i === S.cur.a) x.classList.add('good'); else if (x === b) x.classList.add('bad'); });
  S.times.push(t);
  const r = S.times.slice(-5);
  S.avg = r.reduce((a, c) => a + c) / r.length;
  if (ok) { S.ok++; S.right++; S.wrong = 0; S.style[S.mode === 'visual' ? 'v' : 't'] += 3; }
  else { S.wrong++; S.right = 0; S.style.t -= 2; S.style.v += 2; }
  S.n++;
  S.load = clamp(25 + S.wrong * 18 + Math.max(0, S.avg - 5) * 5 + S.lvl * 6, 10, 98);
  log(`${ok ? 'Correct' : 'Incorrect'} answer (${t.toFixed(1)}s)`);
  decide(ok, t);
  autoAx();
  $('fb').textContent = ok ? '✅ Correct!' : '❌ Not quite. ' + S.cur.h;
  if (!ok) { $('vis').hidden = false; $('vis').innerHTML = `<b>Visual explanation</b><div class="flow">${S.cur.v}</div>`; }
  $('next').hidden = false;
  render();
};

$('next').onclick = () => { if (S.pend) { log('Learner kept current settings'); S.pend = null; } showQ(); };
$('apply').onclick = () => {
  if (!S.pend) return;
  S.lvl = S.pend.lvl; S.mode = 'visual'; S.step = true; S.pend = null;
  log(`AI switched content → Visual, difficulty → ${LV[S.lvl]}`);
  showQ();
};
$('say').onclick = () => speak(S.cur.q);
$('reset').onclick = () => { init(); $('exp').hidden = true; };
$('why').onclick = () => {
  const e = $('exp'); e.hidden = !e.hidden;
  if (e.hidden) return;
  e.innerHTML = S.last
    ? `<b>I noticed:</b><ul>${S.last.why.map(x => `<li>• ${x}</li>`).join('')}</ul><b>Therefore I changed:</b><ul>${S.last.dec.map(x => `<li>→ ${x}</li>`).join('')}</ul><p>You can change or undo any adaptation at any time.</p>`
    : 'No adaptation yet. Answer a few questions first.';
};
document.querySelectorAll('.axs input').forEach(i => i.onchange = () => { S.ax[i.id.slice(3)] = +i.checked; render(); });

function render() {
  const acc = S.n ? Math.round(S.ok / S.n * 100) : 0, L = S.load;
  const foc = S.n ? clamp(100 - Math.max(0, S.avg - 4) * 6 - S.wrong * 8, 20) : 80;
  $('s-acc').textContent = S.n ? acc + '%' : '—';
  $('s-time').textContent = S.n ? S.avg.toFixed(1) + ' s' : '—';
  $('s-focus').textContent = foc + '%';
  $('s-level').textContent = 'Level ' + (S.lvl + 1);
  const sc = S.n ? clamp(acc * .7 + (100 - L) * .3) : 50;
  $('ring').style.setProperty('--p', sc); $('score').textContent = sc + '%';
  bars('twinbars', [['Cognitive load', L], ['Visual learning', clamp(S.style.v)], ['Audio learning', clamp(S.style.a)], ['Text learning', clamp(S.style.t)]]);
  $('state').textContent = L < 40 ? '🟢 Comfortable' : L < 65 ? '🟡 Moderate difficulty' : '🔴 High cognitive load';
  $('interp').textContent = !S.n ? 'Answer a question to start building your twin.'
    : L >= 60 ? 'Higher response times and errors on text-heavy questions. Visual explanations are recommended.'
    : 'Steady performance. The engine is keeping content at the current level.';
  $('eng').textContent = S.pend ? 'Adapting — waiting for your approval' : 'Active';
  $('evt').innerHTML = (S.last ? S.last.why : ['No events yet']).map(x => `<li>❗ ${x}</li>`).join('');
  $('dec').innerHTML = (S.last ? S.last.dec : ['Waiting for learner behaviour']).map(x => `<li>✓ ${x}</li>`).join('');
  $('apply').hidden = !S.pend;
  $('lvl').textContent = LV[S.lvl]; $('mode').textContent = S.mode === 'visual' ? 'Visual' : 'Text'; $('stp').hidden = !S.step;
  bars('axbars', [['🧠 Cognitive load', L], ['👁 Visual support', clamp(S.style.v)], ['🔊 Audio support', S.ax.tts ? 89 : clamp(S.style.a)], ['⌨ Motor accessibility', 54]]);
  for (const k in S.ax) $('ax-' + k).checked = !!S.ax[k];
  const c = Object.values(S.ax).filter(Boolean).length;
  $('axnote').textContent = c ? `AI automatically applied ${c} accessibility adaptation${c > 1 ? 's' : ''}. You can switch any of them off.` : 'No accessibility adaptations needed yet.';
  document.body.classList.toggle('big', !!S.ax.font);
  document.body.classList.toggle('calm', !!S.ax.motion);
  $('instr').textContent = S.ax.simple ? 'Pick one answer.' : 'Read the question carefully, then choose the best answer. Take your time.';
  $('tl').innerHTML = S.log.slice(-10).map(([t, m]) => `<li><time>${t}</time>${m}</li>`).join('');
  const p = $('chk'); p.classList.remove('run'); void p.offsetWidth; p.classList.add('run');
}

init();
