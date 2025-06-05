
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
resizeCanvas();

window.addEventListener('resize', resizeCanvas);
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

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
const pointerRadius = 20;
const DOT_SHOW_MS = 300;
const TRACE_MAX_AGE = 1000;
const TRACE_MAX_LEN = 30;
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

const localTraces = {};
let activePointers = {};
let fadingTraces = [];
let activeDots = [];

db.ref("pointers").on("value", snapshot => {
  activePointers = snapshot.val() || {};
});

function drawTrace(trace, fadeOut = false) {
  if (!trace || trace.length < 2) return;
  for (let i = 1; i < trace.length; ++i) {
    const p1 = trace[i - 1];
    const p2 = trace[i];
    const now = Date.now();
    let alpha = 1;
    if (fadeOut) alpha = Math.max(0, 1 - (now - p2.t) / TRACE_MAX_AGE);
    ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
    ctx.lineWidth = Math.max(pointerRadius * 0.4, pointerRadius * 1.5 * alpha);
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  }
}

function drawCircle(x, y, alpha = 1) {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, pointerRadius * 1.5);
  gradient.addColorStop(0, `rgba(255,255,255,${alpha * 1.2})`);
  gradient.addColorStop(1, `rgba(255,255,255,0)`);
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, pointerRadius * 1.5, 0, 2 * Math.PI);
  ctx.fill();
}

function fadeCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function animate() {
  fadeCanvas();

  const now = Date.now();

  // Firebase traces
  for (const id in activePointers) {
    const pointer = activePointers[id];
    if (!pointer.trace) continue;
    const trace = pointer.trace
      .filter(p => now - p.t < TRACE_MAX_AGE)
      .map(p => ({
        x: p.x * canvas.width,
        y: p.y * canvas.height,
        t: p.t
      }));
    drawTrace(trace, true);
  }

  // local fading
  fadingTraces = fadingTraces.filter(ft => now - ft.endTime < TRACE_MAX_AGE);
  for (const ft of fadingTraces) {
    drawTrace(ft.trace, true);
  }

  // instant circles
  activeDots = activeDots.filter(dot => now - dot.t < DOT_SHOW_MS);
  for (const dot of activeDots) {
    const alpha = 1 - (now - dot.t) / DOT_SHOW_MS;
    drawCircle(dot.x, dot.y, alpha);
  }

  requestAnimationFrame(animate);
}
animate();

function handleTouchMove(e) {
  const touches = e.touches ? Array.from(e.touches) : [];
  const seen = new Set();
  const now = Date.now();

  touches.forEach(t => {
    const id = t.identifier;
    seen.add(id);
    activeTouchIds.add(id);
    if (!localTraces[id]) localTraces[id] = [];
    localTraces[id].push({ x: t.clientX, y: t.clientY, t: now });
    localTraces[id] = localTraces[id].filter(p => now - p.t < TRACE_MAX_AGE);
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
  const touches = e.touches ? Array.from(e.touches) : [];
  const now = Date.now();
  touches.forEach(t => {
    activeDots.push({ x: t.clientX, y: t.clientY, t: now });
  });
  handleTouchMove(e);
});
canvas.addEventListener("touchmove", handleTouchMove);
canvas.addEventListener("touchend", handleTouchMove);
canvas.addEventListener("touchcancel", handleTouchMove);

// mouse
let mouseDown = false;
canvas.addEventListener("pointerdown", e => {
  mouseDown = true;
  const id = "mouse";
  const now = Date.now();
  activeDots.push({ x: e.clientX, y: e.clientY, t: now });
  if (!localTraces[id]) localTraces[id] = [];
  localTraces[id].push({ x: e.clientX, y: e.clientY, t: now });
  localTraces[id] = localTraces[id].filter(p => now - p.t < TRACE_MAX_AGE);
  sendTrace(id, localTraces[id]);
});
canvas.addEventListener("pointermove", e => {
  if (!mouseDown) return;
  const id = "mouse";
  const now = Date.now();
  if (!localTraces[id]) localTraces[id] = [];
  localTraces[id].push({ x: e.clientX, y: e.clientY, t: now });
  localTraces[id] = localTraces[id].filter(p => now - p.t < TRACE_MAX_AGE);
  sendTrace(id, localTraces[id]);
});
canvas.addEventListener("pointerup", () => {
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
  mouseDown = false;
});
canvas.addEventListener("pointerleave", () => {
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
  mouseDown = false;
});
