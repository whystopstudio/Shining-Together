
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
resizeCanvas();

window.addEventListener('resize', resizeCanvas);
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

// --- Firebase setup ---
const firebaseConfig = {
  apiKey: "AIzaSyDsWLFW4QQUaRGgyqB7KnoCXKfqiuGhW8M",
  authDomain: "shining-together.firebaseapp.com",
  projectId: "shining-together",
  storageBucket: "shining-together.appspot.com",
  messagingSenderId: "322280033754",
  appId: "1:322280033754:web:cc2137fbcf38226d7704e3",
  databaseURL: "https://shining-together-default-rtdb.asia-southeast1.firebasedatabase.app/"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const userId = Math.random().toString(36).substring(2);
const pointerRadius = 30;
const DOT_SHOW_MS = 300;
const TRACE_MAX_LEN = 50;   // 增加點數，讓殘影拖更長
const activeTouchIds = new Set();

function sendTrace(pointerId, trace) {
  db.ref("pointers/" + userId + "_" + pointerId).set({
    trace: trace.map(p => ({ x: p.x / canvas.width, y: p.y / canvas.height, t: p.t })),
    t: Date.now()
  });
}
function clearTrace(pointerId) {
  db.ref("pointers/" + userId + "_" + pointerId).remove();
}

const localTraces = {}; // pointerId: [{x, y, t}, ...]
let activePointers = {};
db.ref("pointers").on("value", snapshot => {
  activePointers = snapshot.val() || {};
});

// 插值補點，讓線條不會有明顯間隔
function drawTrace(trace, fadeOut = false) {
  if (!trace || trace.length < 2) return;
  for (let i = 1; i < trace.length; ++i) {
    const p1 = trace[i - 1];
    const p2 = trace[i];
    const now = Date.now();
    let alpha = 1;
    if (fadeOut) {
      alpha = Math.max(0, 1 - (now - p2.t) / 1000); // 殘影才淡出
    }
    ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
    ctx.lineWidth = pointerRadius * 2;

    // 插值補點
    const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    const steps = Math.ceil(dist / 8); // 距離大於8px就補點
    let lastX = p1.x, lastY = p1.y;
    for (let s = 1; s <= steps; ++s) {
      const t = s / steps;
      const x = p1.x * (1 - t) + p2.x * t;
      const y = p1.y * (1 - t) + p2.y * t;
      ctx.beginPath();
      ctx.moveTo(lastX, lastY);
      ctx.lineTo(x, y);
      ctx.stroke();
      lastX = x; lastY = y;
    }
  }
}

// --- 畫圓點 ---
function drawDot(x, y, alpha = 1) {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, pointerRadius);
  gradient.addColorStop(0, `rgba(255,255,255,${alpha})`);
  gradient.addColorStop(1, `rgba(255,255,255,0)`);
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, pointerRadius, 0, 2 * Math.PI);
  ctx.fill();
}

// 讓畫布慢慢淡出
function fadeCanvas() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.12)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

let fadingTraces = []; // [{trace: [...], tEnd: time}]
let activeDots = []; // {x, y, t}

function animate() {
  fadeCanvas();

  // 活動中的 pointer（所有指頭/滑鼠），全畫出來，永不淡出
  for (const id in activePointers) {
    const pointer = activePointers[id];
    if (!pointer.trace) continue;
    const trace = pointer.trace.map(p => ({
      x: p.x * canvas.width,
      y: p.y * canvas.height,
      t: p.t
    }));
    drawTrace(trace, false);
  }

  // fadingTraces: 手指離開後才淡出
  fadingTraces = fadingTraces.filter(ft => Date.now() - ft.endTime < 1000);
  for (const ft of fadingTraces) {
    drawTrace(ft.trace, true);
  }

  // 畫點
  const now = Date.now();
  activeDots = activeDots.filter(dot => now - dot.t < DOT_SHOW_MS);
  for (const dot of activeDots) {
    const alpha = 1 - (now - dot.t) / DOT_SHOW_MS;
    drawDot(dot.x, dot.y, alpha);
  }

  requestAnimationFrame(animate);
}
animate();

// --- 多指觸控專用 ---
function handleTouchMove(e) {
  e.preventDefault();
  const touches = e.touches ? Array.from(e.touches) : [];
  const seen = new Set();
  const now = Date.now();

  touches.forEach(t => {
    const id = t.identifier;
    seen.add(id);
    activeTouchIds.add(id);

    if (!localTraces[id]) localTraces[id] = [];
    localTraces[id].push({ x: t.clientX, y: t.clientY, t: now });
    if (localTraces[id].length > TRACE_MAX_LEN) localTraces[id].shift();
    sendTrace(id, localTraces[id]);
  });

  activeTouchIds.forEach(id => {
    if (!seen.has(id)) {
      if (localTraces[id]) {
        fadingTraces.push({
          trace: localTraces[id].map(p => ({...p})),
          endTime: now
        });
      }
      clearTrace(id);
      delete localTraces[id];
      activeTouchIds.delete(id);
    }
  });
}
canvas.addEventListener("touchstart", function(e) {
  e.preventDefault();
  const touches = e.touches ? Array.from(e.touches) : [];
  const now = Date.now();
  touches.forEach(t => {
    activeDots.push({ x: t.clientX, y: t.clientY, t: now });
  });
  handleTouchMove(e);
}, { passive: false });
canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
canvas.addEventListener("touchend", handleTouchMove, { passive: false });
canvas.addEventListener("touchcancel", handleTouchMove, { passive: false });

// --- 滑鼠/觸控筆專用 ---
let mouseDown = false;
canvas.addEventListener("pointerdown", e => {
  mouseDown = true;
  const id = "mouse";
  const now = Date.now();
  activeDots.push({ x: e.clientX, y: e.clientY, t: now });
  if (!localTraces[id]) localTraces[id] = [];
  localTraces[id].push({ x: e.clientX, y: e.clientY, t: now });
  if (localTraces[id].length > TRACE_MAX_LEN) localTraces[id].shift();
  sendTrace(id, localTraces[id]);
});
canvas.addEventListener("pointermove", e => {
  if (!mouseDown) return;
  const id = "mouse";
  const now = Date.now();
  if (!localTraces[id]) localTraces[id] = [];
  localTraces[id].push({ x: e.clientX, y: e.clientY, t: now });
  if (localTraces[id].length > TRACE_MAX_LEN) localTraces[id].shift();
  sendTrace(id, localTraces[id]);
});
canvas.addEventListener("pointerup", () => {
  mouseDown = false;
  const id = "mouse";
  const now = Date.now();
  if (localTraces[id]) {
    fadingTraces.push({
      trace: localTraces[id].map(p => ({...p})),
      endTime: now
    });
  }
  clearTrace(id);
  delete localTraces[id];
});
canvas.addEventListener("pointerleave", () => {
  mouseDown = false;
  const id = "mouse";
  const now = Date.now();
  if (localTraces[id]) {
    fadingTraces.push({
      trace: localTraces[id].map(p => ({...p})),
      endTime: now
    });
  }
  clearTrace(id);
  delete localTraces[id];
});
