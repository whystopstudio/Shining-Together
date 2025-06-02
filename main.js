const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
resizeCanvas();

window.addEventListener('resize', resizeCanvas);
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

// Firebase init
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
const pointerRadius = 40; // 原來是 50，現在縮小為 80%

function sendPosition(fingerId, x, y) {
  db.ref("pointers/" + userId + "_" + fingerId).set({
    x: x / canvas.width,
    y: y / canvas.height,
    t: firebase.database.ServerValue.TIMESTAMP
  });
}

function clearPosition(fingerId) {
  db.ref("pointers/" + userId + "_" + fingerId).remove();
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

function clearCanvas() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// Firebase listener
db.ref("pointers").on("value", snapshot => {
  const now = Date.now();
  const data = snapshot.val() || {};

  requestAnimationFrame(() => {
    clearCanvas();
    for (const id in data) {
      const p = data[id];
      const age = now - (p.t || 0);
      if (age < 2000) {
        const x = p.x * canvas.width;
        const y = p.y * canvas.height;
        const alpha = 1 - age / 2000;
        drawCircle(x, y, alpha);
      }
    }
  });
});

// 多指觸控處理
function handleTouchMove(e) {
  const touches = e.touches ? Array.from(e.touches) : [];
  touches.forEach((t, i) => {
    sendPosition(i, t.clientX, t.clientY);
  });
}

function handleTouchEnd(e) {
  const changed = e.changedTouches ? Array.from(e.changedTouches) : [];
  changed.forEach((t, i) => {
    clearPosition(i);
  });
}

canvas.addEventListener("touchstart", handleTouchMove);
canvas.addEventListener("touchmove", handleTouchMove);
canvas.addEventListener("touchend", handleTouchEnd);
canvas.addEventListener("touchcancel", handleTouchEnd);

// 滑鼠也支援（單一指標）
canvas.addEventListener("pointerdown", e => sendPosition("mouse", e.clientX, e.clientY));
canvas.addEventListener("pointermove", e => sendPosition("mouse", e.clientX, e.clientY));
canvas.addEventListener("pointerup", () => clearPosition("mouse"));
canvas.addEventListener("pointerleave", () => clearPosition("mouse"));
