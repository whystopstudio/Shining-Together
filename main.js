
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

const userId = Math.random().toString(36).substring(2);
const pointerRadius = 30;

let trailHistory = {};  // Record path history per pointer

function sendPosition(pointerId, x, y) {
  db.ref("pointers/" + userId + "_" + pointerId).set({
    x: x / canvas.width,
    y: y / canvas.height,
    t: Date.now()
  });

  // Save local history for ribbon effect
  if (!trailHistory[pointerId]) trailHistory[pointerId] = [];
  trailHistory[pointerId].push({x, y, t: Date.now()});
  if (trailHistory[pointerId].length > 20) trailHistory[pointerId].shift();
}

function clearPosition(pointerId) {
  db.ref("pointers/" + userId + "_" + pointerId).remove();
  delete trailHistory[pointerId];
}

function drawRibbonTrail(trail) {
  for (let i = 0; i < trail.length - 1; i++) {
    const p1 = trail[i];
    const p2 = trail[i + 1];
    const age = Date.now() - p1.t;
    const alpha = 1 - i / trail.length;
    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.lineWidth = pointerRadius * alpha * 0.5;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  }
}

function fadeCanvas() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

const db = firebase.database();
let activePoints = {};
db.ref("pointers").on("value", snapshot => {
  activePoints = snapshot.val() || {};
});

function animate() {
  fadeCanvas();
  const now = Date.now();
  for (const id in activePoints) {
    const p = activePoints[id];
    const age = now - (p.t || 0);
    if (age < 10000 && !isNaN(p.x) && !isNaN(p.y)) {
      const x = p.x * canvas.width;
      const y = p.y * canvas.height;
      drawCircle(x, y, 1);

      // Use local pointerId for trail
      const pointerId = id.split("_")[1];
      if (trailHistory[pointerId]) {
        drawRibbonTrail(trailHistory[pointerId]);
      }
    }
  }
  requestAnimationFrame(animate);
}
animate();

function drawCircle(x, y, alpha = 1) {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, pointerRadius);
  gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
  gradient.addColorStop(1, `rgba(255, 255, 255, 0)`);
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, pointerRadius, 0, 2 * Math.PI);
  ctx.fill();
}

canvas.addEventListener("touchstart", e => {
  Array.from(e.changedTouches).forEach(t => {
    sendPosition(t.identifier, t.clientX, t.clientY);
  });
});
canvas.addEventListener("touchmove", e => {
  Array.from(e.touches).forEach(t => {
    sendPosition(t.identifier, t.clientX, t.clientY);
  });
});
canvas.addEventListener("touchend", e => {
  Array.from(e.changedTouches).forEach(t => {
    clearPosition(t.identifier);
  });
});
canvas.addEventListener("touchcancel", e => {
  Array.from(e.changedTouches).forEach(t => {
    clearPosition(t.identifier);
  });
});
canvas.addEventListener("pointerdown", e => {
  sendPosition("mouse", e.clientX, e.clientY);
});
canvas.addEventListener("pointermove", e => {
  if (e.buttons > 0) sendPosition("mouse", e.clientX, e.clientY);
});
canvas.addEventListener("pointerup", () => clearPosition("mouse"));
canvas.addEventListener("pointerleave", () => clearPosition("mouse"));

firebase.database().ref(".info/connected").on("value", function(snap) {
  if (snap.val() === true) {
    const ref = firebase.database().ref("pointers");
    ref.once("value", snapshot => {
      const val = snapshot.val() || {};
      for (const key in val) {
        if (key.startsWith(userId + "_")) {
          firebase.database().ref("pointers/" + key).onDisconnect().remove();
        }
      }
    });
  }
});
