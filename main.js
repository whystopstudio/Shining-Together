import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDsWLFW4QQUaRGgyqB7KnoCXKfqiuGhW8M",
  authDomain: "shining-together.firebaseapp.com",
  projectId: "shining-together",
  storageBucket: "shining-together.firebasestorage.app",
  messagingSenderId: "322280033754",
  appId: "1:322280033754:web:cc2137fbcf38226d7704e3",
  databaseURL: "https://shining-together-default-rtdb.asia-southeast1.firebasedatabase.app/"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const canvas = document.getElementById("touchCanvas");
const ctx = canvas.getContext("2d");

let pointerId = null;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

function drawPoint(x, y, alpha = 1) {
  ctx.beginPath();
  ctx.arc(x, y, 10, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(255,255,255,${alpha})`;
  ctx.fill();
}

const myId = "id_" + Math.random().toString(36).substring(2, 9);
function updatePosition(x, y) {
  set(ref(db, "points/" + myId), { x, y, time: Date.now() });
}

canvas.addEventListener("pointerdown", e => {
  pointerId = e.pointerId;
  updatePosition(e.clientX, e.clientY);
});
canvas.addEventListener("pointermove", e => {
  if (e.pointerId === pointerId) updatePosition(e.clientX, e.clientY);
});
canvas.addEventListener("pointerup", () => {
  pointerId = null;
  set(ref(db, "points/" + myId), null);
});

onValue(ref(db, "points"), snapshot => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const data = snapshot.val();
  if (!data) return;
  const now = Date.now();
  for (const [id, point] of Object.entries(data)) {
    if (now - point.time < 1000) {
      const alpha = 1 - (now - point.time) / 1000;
      drawPoint(point.x, point.y, alpha);
    }
  }
});