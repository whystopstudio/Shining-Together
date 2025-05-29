
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import {
  getDatabase,
  ref,
  push,
  onChildAdded,
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDsWLFW4QQUaRGgyqB7KnoCXKfqiuGhW8M",
  authDomain: "shining-together.firebaseapp.com",
  projectId: "shining-together",
  storageBucket: "shining-together.appspot.com",
  messagingSenderId: "322280033754",
  appId: "1:322280033754:web:cc2137fbcf38226d7704e3",
  databaseURL: "https://shining-together-default-rtdb.asia-southeast1.firebasedatabase.app/"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const touchRef = ref(db, "touches");

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
resizeCanvas();

window.addEventListener("resize", resizeCanvas);

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

// 保留尾巴軌跡的粒子列表
let particles = [];

function draw() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  particles = particles.filter(p => performance.now() - p.time < 500);
  for (let p of particles) {
    const age = performance.now() - p.time;
    const alpha = 1 - age / 500;
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.beginPath();
    ctx.arc(p.x * canvas.width, p.y * canvas.height, 10, 0, Math.PI * 2);
    ctx.fill();
  }

  requestAnimationFrame(draw);
}
draw();

function addParticle(xNorm, yNorm) {
  particles.push({ x: xNorm, y: yNorm, time: performance.now() });
}

// 使用 pointermove 捕捉拖曳座標
canvas.addEventListener("pointerdown", (e) => {
  const xNorm = e.clientX / canvas.width;
  const yNorm = e.clientY / canvas.height;
  push(touchRef, { x: xNorm, y: yNorm });
});

canvas.addEventListener("pointermove", (e) => {
  if (e.pressure > 0 || e.buttons > 0) {
    const xNorm = e.clientX / canvas.width;
    const yNorm = e.clientY / canvas.height;
    push(touchRef, { x: xNorm, y: yNorm });
  }
});

onChildAdded(touchRef, (snapshot) => {
  const pt = snapshot.val();
  addParticle(pt.x, pt.y);
});
