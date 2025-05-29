
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

function drawCircle(x, y) {
  const startTime = performance.now();
  function fade() {
    const t = (performance.now() - startTime) / 500;
    if (t >= 1) return;

    ctx.fillStyle = `rgba(255, 255, 255, ${1 - t})`;
    ctx.beginPath();
    ctx.arc(x, y, 10, 0, Math.PI * 2);
    ctx.fill();
    requestAnimationFrame(fade);
  }
  fade();
}

canvas.addEventListener("pointerdown", (e) => {
  const xNorm = e.clientX / canvas.width;
  const yNorm = e.clientY / canvas.height;
  push(touchRef, { x: xNorm, y: yNorm });
});

onChildAdded(touchRef, (snapshot) => {
  const pt = snapshot.val();
  const x = pt.x * canvas.width;
  const y = pt.y * canvas.height;
  drawCircle(x, y);
});
