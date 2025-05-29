
const firebaseConfig = {
  apiKey: "AIzaSyDsWLFW4QQUaRGgyqB7KnoCXKfqiuGhW8M",
  authDomain: "shining-together.firebaseapp.com",
  projectId: "shining-together",
  storageBucket: "shining-together.appspot.com",
  messagingSenderId: "322280033754",
  appId: "1:322280033754:web:cc2137fbcf38226d7704e3",
  databaseURL: "https://shining-together-default-rtdb.asia-southeast1.firebasedatabase.app"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

const userId = Math.random().toString(36).substring(2);
let touches = {};

canvas.addEventListener("pointerdown", updateTouch);
canvas.addEventListener("pointermove", updateTouch);
canvas.addEventListener("pointerup", removeTouch);
canvas.addEventListener("pointercancel", removeTouch);

function updateTouch(e) {
  touches[userId] = {
    x: e.clientX / window.innerWidth,
    y: e.clientY / window.innerHeight,
    t: Date.now()
  };
  db.ref("touches/" + userId).set(touches[userId]);
}

function removeTouch() {
  db.ref("touches/" + userId).remove();
  delete touches[userId];
}

function drawCircle(x, y, opacity = 1) {
  ctx.beginPath();
  ctx.arc(x * canvas.width, y * canvas.height, 10, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
  ctx.shadowColor = "white";
  ctx.shadowBlur = 20 * opacity;
  ctx.fill();
  ctx.shadowBlur = 0;
}

function draw() {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const now = Date.now();
  for (const [id, touch] of Object.entries(touches)) {
    const age = now - touch.t;
    if (age < 600) {
      const opacity = 1 - age / 600;
      drawCircle(touch.x, touch.y, opacity);
    }
  }

  requestAnimationFrame(draw);
}

db.ref("touches").on("value", (snap) => {
  touches = snap.val() || {};
});

draw();
