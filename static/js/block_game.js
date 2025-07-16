// 🎮 エンドレスブロック崩し：ゲームロジック（スコア＆タイムボーナス対応）
document.addEventListener("DOMContentLoaded", () => {
  const openingScreen = document.getElementById("opening-screen");
  const countdownText = document.getElementById("countdown-text");
  const gameCanvasWrapper = document.getElementById("game-canvas");
  const scoreEl = document.getElementById("score");
  const timerEl = document.getElementById("timer");
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const canvasRect = canvas.getBoundingClientRect();

  const paddleWidth = canvas.width * 0.25;
  const paddleHeight = 10;
  let paddleX = (canvas.width - paddleWidth) / 2;

  canvas.addEventListener("touchstart", handleTouch);
  canvas.addEventListener("touchmove", handleTouch);

  const rankingBtns = document.querySelectorAll("#ranking-btn, #ranking-again-btn");
  rankingBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      document.getElementById("ranking-modal").classList.remove("hidden");
      loadRanking("mbti_median");
    });
  });

  function handleTouch(e) {
    const touchX = e.touches[0].clientX - canvas.getBoundingClientRect().left;
    paddleX = touchX - paddleWidth / 2;
    if (paddleX < 0) paddleX = 0;
    if (paddleX + paddleWidth > canvas.width) paddleX = canvas.width - paddleWidth;
  }

  const bonusEl = document.createElement("div");
  bonusEl.className = "bonus-message"; // ← CSSで定義されたclassに変更
  bonusEl.style.display = "none"; // 表示非表示はJS側で制御


  canvas.width = Math.min(window.innerWidth * 0.9, 420);
  canvas.height = canvas.width * 1.3;  // ★縦を縮小（1.6 → 1.3）



  const ballRadius = 8;
  let balls = [{ x: canvas.width / 2, y: canvas.height - 30, dx: 3, dy: -3 }]; // ★速度アップ

  let fallingItems = [];

  // 🎁 追加：アイテムを生成（type: "ball" or "bomb"）
  function spawnItem(x, y, type) {
    fallingItems.push({ x, y, dy: 2, type });
  }


  let rightPressed = false;
  let leftPressed = false;

  const brickColumnCount = 6;
  const brickRowCount = 4; // ← ★これを追加！
  const brickPadding = 4;
  const brickOffsetTop = 30;
  const brickOffsetLeft = canvas.width * 0.08; 

  const brickWidth = (canvas.width - brickOffsetLeft * 2 - brickPadding * (brickColumnCount - 1)) / brickColumnCount;
  const brickHeight = 15;

  let score = 0;
  let stage = 1;
  let timer = 180;
  let timerInterval = null;
  let bricks = [];

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
    const mode = (stage - 1) % 4 + 1;
    for (let i = 0; i < brickColumnCount * brickRowCount; i++) {
      if (mode === 1) hardnessMap.push(1);
      else if (mode === 2) hardnessMap.push(i < 25 ? 1 : 2);
      else if (mode === 3) hardnessMap.push(2);
      else if (mode === 4) hardnessMap.push(i < 25 ? 2 : 3);
    }
    hardnessMap.sort(() => Math.random() - 0.5);

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


  function createExplosion(x, y) {
    const rect = canvas.getBoundingClientRect();  // ★リアルタイムで取得
    const exp = document.createElement("div");
    exp.className = "explosion";
    exp.style.left = `${rect.left + x - 5}px`;
    exp.style.top = `${rect.top + y - 5}px`;
    document.body.appendChild(exp);
    setTimeout(() => exp.remove(), 400);
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
              score += 100; // 💯 1回当てるごとに100点
              scoreEl.textContent = score;

              if (b.hardness <= 0) {
                b.status = 0;
                createExplosion(b.x + brickWidth / 2, b.y + brickHeight / 2);
              }

              if (b.isItem) {
                const rand = Math.random();
                if (rand < 0.75) {
                  spawnItem(b.x + brickWidth / 2, b.y + brickHeight / 2, "ball");
                } else {
                  spawnItem(b.x + brickWidth / 2, b.y + brickHeight / 2, "bomb");
                }
              }
            }
          }
        }
      }
    }
  }

  function triggerFullScreenExplosion() {
    const flash = document.createElement("div");
    flash.className = "fullscreen-explosion";
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 400);
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBricks();
    drawBalls();
    drawPaddle();
    // 🎁 追加：アイテムの描画・当たり判定処理
    for (let i = fallingItems.length - 1; i >= 0; i--) {
      const item = fallingItems[i];
      item.y += item.dy;

      // 描画（アイテムの色はタイプで変化）
      ctx.beginPath();
      ctx.arc(item.x, item.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = item.type === "ball" ? "gold" : "red";
      ctx.fill();
      ctx.closePath();

      // パドルと当たったか判定
      if (
        item.y + 8 > canvas.height - paddleHeight &&
        item.x > paddleX &&
        item.x < paddleX + paddleWidth
      ) {
        if (item.type === "ball") {
          balls.push({ x: item.x, y: item.y, dx: 3, dy: -3 }); // ★ボール増加
        } else if (item.type === "bomb") {
          // ★爆弾：全ブロックに1ダメージ
          triggerFullScreenExplosion();
          bricks.flat().forEach(b => {
            if (b.status > 0) {
              b.hardness--;
              if (b.hardness <= 0) {
                b.status = 0;
                createExplosion(b.x + brickWidth / 2, b.y + brickHeight / 2);
              }
            }
          });
        }
        fallingItems.splice(i, 1); // アイテムを削除
      } else if (item.y > canvas.height) {
        fallingItems.splice(i, 1); // 落下しきったら削除
      }
    }

    collisionDetection();

    for (let i = balls.length - 1; i >= 0; i--) {
      const ball = balls[i];
      if (ball.x + ball.dx > canvas.width - ballRadius || ball.x + ball.dx < ballRadius) ball.dx = -ball.dx;
      if (ball.y + ball.dy < ballRadius) ball.dy = -ball.dy;
      else if (ball.y + ball.dy > canvas.height - ballRadius) {
        if (ball.x > paddleX && ball.x < paddleX + paddleWidth) {
          ball.dy = -ball.dy;
        } else {
          balls.splice(i, 1);
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
      const bonus = timer * 100; // ⏳ タイムボーナス
      score += bonus;
      scoreEl.textContent = score;
      bonusEl.textContent = `タイムボーナス +${bonus}点！`;
      bonusEl.style.display = "block";
      setTimeout(() => {
        bonusEl.style.display = "none";
      }, 3000);

      stage++;
      timer = 180;
      timerEl.textContent = timer;
      createBricks();
    }

    requestAnimationFrame(draw);
  }


  function showResult(score) {
    // 表示切り替え
    gameCanvasWrapper.classList.add("hidden");
    document.getElementById("result-screen").classList.remove("hidden");

    // スコアを表示
    const formatted = score.toLocaleString();
    document.getElementById("final-score").textContent = `スコア：${formatted} 点`;

    // スコア送信（任意）
    fetch("https://bearhug-6c58c8d5bd0e.herokuapp.com/game/score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: user_id,
        game_name: "block_game",
        score: score
      }),
    })
    .then(res => res.json())
    .then(data => {
      if (data.best !== undefined) {
        const bestScoreEl = document.getElementById("best-score");
        bestScoreEl.classList.remove("hidden");
        bestScoreEl.textContent = `自己ベスト：${parseInt(data.best).toLocaleString()} 点`;
      }
    });
  }
});
