
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-database.js";

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

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

let userId = "user_" + Math.random().toString(36).substring(2, 10);
let dots = {};

function drawDot(id, x, y) {
  ctx.beginPath();
  ctx.arc(x, y, 8, 0, Math.PI * 2);
  ctx.fillStyle = "white";
  ctx.fill();
  dots[id] = { x, y, timestamp: Date.now() };
}

function updateDots() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  let now = Date.now();
  for (let id in dots) {
    let { x, y, timestamp } = dots[id];
    let age = now - timestamp;
    if (age < 1000) {
      ctx.beginPath();
      ctx.arc(x, y, 8 * (1 - age / 1000), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${1 - age / 1000})`;
      ctx.fill();
    } else {
      delete dots[id];
    }
  }
  requestAnimationFrame(updateDots);
}
updateDots();

function sendPosition(x, y) {
  set(ref(db, "users/" + userId), { x, y, t: Date.now() });
}

canvas.addEventListener("pointermove", (e) => {
  sendPosition(e.clientX, e.clientY);
});

onValue(ref(db, "users"), (snapshot) => {
  const data = snapshot.val();
  for (let id in data) {
    drawDot(id, data[id].x, data[id].y);
  }
});
