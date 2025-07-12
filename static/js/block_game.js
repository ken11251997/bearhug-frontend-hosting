// 🎮 エンドレスブロック崩し：ゲームロジック（初期構成）
document.addEventListener("DOMContentLoaded", () => {
  const openingScreen = document.getElementById("opening-screen");
  const countdownText = document.getElementById("countdown-text");
  const gameCanvasWrapper = document.getElementById("game-canvas");
  const scoreEl = document.getElementById("score");
  const timerEl = document.getElementById("timer");
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  
  const endBtn = document.getElementById("end-btn");
  endBtn.addEventListener("click", () => {
    window.location.href = "minigame_list.html";
  });

  // 🕹 ゲーム設定
  const paddleWidth = 75;
  const paddleHeight = 10;
  let paddleX = (canvas.width - paddleWidth) / 2;

  const ballRadius = 8;
  let balls = [{ x: canvas.width / 2, y: canvas.height - 30, dx: 2, dy: -2 }];

  let rightPressed = false;
  let leftPressed = false;

  const brickRowCount = 5;
  const brickColumnCount = 10;
  const brickWidth = 44;
  const brickHeight = 15;
  const brickPadding = 4;
  const brickOffsetTop = 30;
  const brickOffsetLeft = 10;

  let score = 0;
  let stage = 1;
  let timer = 180;
  let timerInterval = null;
  let bricks = [];

  // 🎁 アイテムブロック：硬さ1の見た目でアイテム用
  let itemBricks = [];

  document.addEventListener("keydown", (e) => {
    if (e.key === "Right" || e.key === "ArrowRight") rightPressed = true;
    else if (e.key === "Left" || e.key === "ArrowLeft") leftPressed = true;
  });

  document.addEventListener("keyup", (e) => {
    if (e.key === "Right" || e.key === "ArrowRight") rightPressed = false;
    else if (e.key === "Left" || e.key === "ArrowLeft") leftPressed = false;
  });

  document.getElementById("start-button").addEventListener("click", () => {
    openingScreen.classList.add("hidden");
    countdownText.classList.remove("hidden");

    setTimeout(() => {
      countdownText.classList.add("hidden");
      gameCanvasWrapper.classList.remove("hidden");
      initGame();
    }, 1500);
  });

  function initGame() {
    createBricks();
    timerInterval = setInterval(() => {
      timer--;
      timerEl.textContent = timer;
      if (timer <= 0) {
        clearInterval(timerInterval);
        alert("時間切れ！ゲームオーバー");
        document.location.reload();
      }
    }, 1000);
    draw();
  }

  function createBricks() {
    bricks = [];
    itemBricks = [];

    const hardnessMap = [];
    let hardness1 = 0, hardness2 = 0, hardness3 = 0;

    const mode = (stage - 1) % 4 + 1;
    for (let i = 0; i < brickColumnCount * brickRowCount; i++) {
      if (mode === 1) hardnessMap.push(1);
      else if (mode === 2) hardnessMap.push(i < 25 ? 1 : 2);
      else if (mode === 3) hardnessMap.push(2);
      else if (mode === 4) hardnessMap.push(i < 25 ? 2 : 3);
    }
    hardnessMap.sort(() => Math.random() - 0.5);

    // アイテムブロック 3つ
    const itemIndices = new Set();
    while (itemIndices.size < 3) {
      itemIndices.add(Math.floor(Math.random() * hardnessMap.length));
    }

    let index = 0;
    for (let c = 0; c < brickColumnCount; c++) {
      bricks[c] = [];
      for (let r = 0; r < brickRowCount; r++) {
        const hardness = hardnessMap[index];
        const isItem = itemIndices.has(index);
        bricks[c][r] = {
          x: 0, y: 0,
          status: 1,
          hardness,
          isItem
        };
        index++;
      }
    }
  }

  function drawBricks() {
    for (let c = 0; c < brickColumnCount; c++) {
      for (let r = 0; r < brickRowCount; r++) {
        const b = bricks[c][r];
        if (b.status > 0) {
          const brickX = c * (brickWidth + brickPadding) + brickOffsetLeft;
          const brickY = r * (brickHeight + brickPadding) + brickOffsetTop;
          b.x = brickX;
          b.y = brickY;
          ctx.beginPath();
          ctx.rect(brickX, brickY, brickWidth, brickHeight);
          ctx.fillStyle = b.isItem ? "gold" : ["#66ccff", "#3399ff", "#003366"][b.hardness - 1];
          ctx.fill();
          ctx.closePath();
        }
      }
    }
  }

  function drawPaddle() {
    ctx.beginPath();
    ctx.rect(paddleX, canvas.height - paddleHeight, paddleWidth, paddleHeight);
    ctx.fillStyle = "#fff";
    ctx.fill();
    ctx.closePath();
  }

  function drawBalls() {
    for (const ball of balls) {
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ballRadius, 0, Math.PI * 2);
      ctx.fillStyle = "#fff";
      ctx.fill();
      ctx.closePath();
    }
  }

  function createExplosion(x, y) {
    const exp = document.createElement("div");
    exp.className = "explosion";
    exp.style.left = `${canvasRect.left + x - 5}px`;
    exp.style.top = `${canvasRect.top + y - 5}px`;
    document.body.appendChild(exp);
    setTimeout(() => exp.remove(), 400);
    }

  function collisionDetection() {
    for (const ball of balls) {
      for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
          const b = bricks[c][r];
          if (b.status > 0) {
            if (
              ball.x > b.x &&
              ball.x < b.x + brickWidth &&
              ball.y > b.y &&
              ball.y < b.y + brickHeight
            ) {
              ball.dy = -ball.dy;
              b.hardness--;
              if (b.hardness <= 0) b.status = 0;
              createExplosion(b.x + brickWidth / 2, b.y + brickHeight / 2); // 💥 爆発エフェクト
              score++;
              scoreEl.textContent = score;
              if (b.isItem) {
                // 🎁 アイテムでボール追加
                balls.push({ x: ball.x, y: ball.y, dx: -2, dy: -2 });
              }
            }
          }
        }
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBricks();
    drawBalls();
    drawPaddle();
    collisionDetection();

    for (let i = balls.length - 1; i >= 0; i--) {
      const ball = balls[i];

      // 壁との反射
      if (ball.x + ball.dx > canvas.width - ballRadius || ball.x + ball.dx < ballRadius) ball.dx = -ball.dx;
      if (ball.y + ball.dy < ballRadius) ball.dy = -ball.dy;
      else if (ball.y + ball.dy > canvas.height - ballRadius) {
        if (ball.x > paddleX && ball.x < paddleX + paddleWidth) {
          ball.dy = -ball.dy;
        } else {
          balls.splice(i, 1); // ボールを消す
        }
      }

      ball.x += ball.dx;
      ball.y += ball.dy;
    }

    if (balls.length === 0) {
      clearInterval(timerInterval);
      alert("すべてのボールを落としました。ゲームオーバー");
      document.location.reload();
      return;
    }

    if (rightPressed && paddleX < canvas.width - paddleWidth) paddleX += 5;
    else if (leftPressed && paddleX > 0) paddleX -= 5;

    const allCleared = bricks.flat().every(b => b.status === 0);
    if (allCleared) {
      stage++;
      createBricks();
    }

    requestAnimationFrame(draw);
  }
});
