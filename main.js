
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
const pointerRadius = 30;
const activeTouchIds = new Set();

function sendPosition(pointerId, x, y) {
  db.ref("pointers/" + userId + "_" + pointerId).set({
    x: x / canvas.width,
    y: y / canvas.height,
    t: Date.now()
  });
}
function clearPosition(pointerId) {
  db.ref("pointers/" + userId + "_" + pointerId).remove();
}

function drawCircle(x, y, alpha = 1) {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, pointerRadius);
  gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
  gradient.addColorStop(1, `rgba(255, 255, 255, 0)`);
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, pointerRadius, 0, 2 * Math.PI);
  ctx.fill();
}

function fadeCanvas() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

let activePoints = {};
let fadingPoints = {};

db.ref("pointers").on("value", snapshot => {
  activePoints = snapshot.val() || {};
});

function addFadingPoint(x, y) {
  const id = `${Math.random().toString(36).slice(2)}_${Date.now()}`;
  fadingPoints[id] = {
    x,
    y,
    start: Date.now(),
    duration: 300
  };
}

function handleTouchMove(e) {
  const touches = Array.from(e.touches || []);
  const seen = new Set();

  touches.forEach(t => {
    sendPosition(t.identifier, t.clientX, t.clientY);
    seen.add(t.identifier);
    activeTouchIds.add(t.identifier);
  });

  [...activeTouchIds].forEach(id => {
    if (!seen.has(id)) {
      const pointerKey = userId + "_" + id;
      if (activePoints[pointerKey]) {
        const p = activePoints[pointerKey];
        addFadingPoint(p.x, p.y);
      }
      clearPosition(id);
      activeTouchIds.delete(id);
    }
  });
}

canvas.addEventListener("touchstart", handleTouchMove);
canvas.addEventListener("touchmove", handleTouchMove);
canvas.addEventListener("touchend", handleTouchMove);
canvas.addEventListener("touchcancel", handleTouchMove);

let mouseDown = false;
canvas.addEventListener("pointerdown", e => {
  mouseDown = true;
  sendPosition("mouse", e.clientX, e.clientY);
});
canvas.addEventListener("pointermove", e => {
  if (mouseDown || e.buttons > 0) sendPosition("mouse", e.clientX, e.clientY);
});
canvas.addEventListener("pointerup", () => {
  const pointerKey = userId + "_mouse";
  if (activePoints[pointerKey]) {
    const p = activePoints[pointerKey];
    addFadingPoint(p.x, p.y);
  }
  clearPosition("mouse");
  mouseDown = false;
});
canvas.addEventListener("pointerleave", () => {
  const pointerKey = userId + "_mouse";
  if (activePoints[pointerKey]) {
    const p = activePoints[pointerKey];
    addFadingPoint(p.x, p.y);
  }
  clearPosition("mouse");
  mouseDown = false;
});

function animate() {
  fadeCanvas();
  for (const id in activePoints) {
    const p = activePoints[id];
    const x = p.x * canvas.width;
    const y = p.y * canvas.height;
    drawCircle(x, y, 1);
  }

  const now = Date.now();
  for (const id in fadingPoints) {
    const f = fadingPoints[id];
    const progress = Math.min(1, (now - f.start) / f.duration);
    drawCircle(f.x * canvas.width, f.y * canvas.height, 1 - progress);
    if (progress >= 1) delete fadingPoints[id];
  }

  requestAnimationFrame(animate);
}
animate();
