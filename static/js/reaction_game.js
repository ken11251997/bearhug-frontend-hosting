document.addEventListener("DOMContentLoaded", () => {

  const rankingBtns = document.querySelectorAll("#ranking-btn, #ranking-again-btn");

  const user_id = new URLSearchParams(window.location.search).get("user_id");
  const mbti = new URLSearchParams(window.location.search).get("mbti");

  document.getElementById("quiz-area").classList.add("hidden");

  const successSound = new Audio("static/sound/success.mp3");
  const failSound = new Audio("static/sound/fail.mp3");
  const decisionSound = new Audio("static/sound/decision.mp3");
  

 // === 表情一覧（後で画像追加予定） ===
const expressions = ["expression_smile","expression_yawn", "expression_angry", "expression_cry", "expression_doya", "expression_happy","expression_normal","expression_shy","expression_sleepy","expression_default"];

const NUM_QUESTIONS = 5;
const CHOICE_COUNTS = [2, 8, 12, 30, 40];


let currentQuestion = 0;
let startTime;
let totalElapsed = 0;
let penaltyTime = 0;
let correctAnswer = "";

window.onload = () => {
  // document.getElementById("start-btn").onclick = startGame;
  document.getElementById("play-again-btn").onclick = () => location.reload();
  document.getElementById("end-btn").onclick = () => location.href = "minigame_list.html";
};

const imageCache = {};
function preloadImages() {
  expressions.forEach(expr => {
    const img = new Image();
    img.src = `static/img/${expr}.png`;
    imageCache[expr] = img;
  });
}

const startBtn = document.getElementById("start-btn");
startBtn.addEventListener("click", () => {
    startBtn.disabled = true;
    decisionSound.play();

    if (!user_id) {
      console.warn("⚠️ user_id が見つかりません。ローカルモードで開始します。");
      startGame();  // ← ローカルモードでも開始
      return;
    }

    fetch("https://bearhug-6c58c8d5bd0e.herokuapp.com/game/play_start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id })
    })
        .then(async res => {
        if (res.status === 429) {
            alert("無料プレイ回数が上限に達しました。\n広告を見ると続行できます。");
            onWatchAd("game"); // ← game_name に合わせて変更
            return;
        }
        const data = await res.json();
        if (data.show_ad) {
            onWatchAd("game");
        } else {
            startGame();
        }
        })
        .catch(err => {
        console.error("通信エラー:", err);
        alert("通信エラー:")
        });
    });



function startGame() {
  preloadImages(); // 🔧 最初に画像をキャッシュ
  document.getElementById("instruction").classList.add("hidden");
  document.getElementById("quiz-area").classList.remove("hidden");
  document.getElementById("live-timer").classList.remove("hidden"); // ⏱ タイマー表示
  startTime = performance.now();
  showNextQuestion();
}

function showNextQuestion() {
  const count = CHOICE_COUNTS[currentQuestion]; // 🔄 先に count を定義
  const columns = Math.min(Math.ceil(Math.sqrt(count)), 9);
  const grid = document.getElementById("options-grid"); // 🔄 gridも定義が後だったので前に移動
  grid.style.gridTemplateColumns = `repeat(${columns}, auto)`;
  if (currentQuestion >= NUM_QUESTIONS) return endGame();


  // 仮の表情リスト（本番では画像名に合わせて更新）
  let allExpressions = [];
  while (allExpressions.length < count) {
    allExpressions.push(...shuffle([...expressions]));
  }
  allExpressions = allExpressions.slice(0, count);


  correctAnswer = allExpressions.length > 0 ? allExpressions[Math.floor(Math.random() * allExpressions.length)] : expressions[0];

  
  document.getElementById("question-text").textContent = `この表情を探してね：`;

  const target = document.getElementById("target-face");
  const targetImg = imageCache[correctAnswer].cloneNode();
  target.innerHTML = `<img src="static/img/${correctAnswer}.png" alt="target"/>`;

  grid.innerHTML = "";
  grid.style.gridTemplateColumns = `repeat(${Math.ceil(Math.sqrt(count))}, auto)`;

  shuffle(allExpressions).forEach(expr => {
    const wrapper = document.createElement("div");
    wrapper.className = "option";

    const img = imageCache[expr].cloneNode(); // 🔧 キャッシュから複製
    img.src = `static/img/${expr}.png`;
    img.alt = expr;
    wrapper.appendChild(img);

    const marker = document.createElement("div");
    marker.className = "marker";
    wrapper.appendChild(marker);

    wrapper.onclick = () => handleChoice(wrapper, expr);
    grid.appendChild(wrapper);
  });

  updateTimer();
}

function handleChoice(wrapper, selected) {
    const now = performance.now();
    const timeTaken = (now - startTime) / 1000;
    if (selected !== correctAnswer) {
    penaltyTime += 5;
    showPenalty();
  } else {
    totalElapsed += timeTaken;
  }

    const marker = wrapper.querySelector(".marker");

    if (selected === correctAnswer) {
      wrapper.classList.add("correct");
      marker.textContent = "⭕";
      successSound.play(); // ✅ 成功音を再生
      disableChoices();
      setTimeout(() => {
        currentQuestion++;
        startTime = performance.now();
        if (currentQuestion >= NUM_QUESTIONS) {
          endGame();
        } else {
          showNextQuestion();
        }
      }, 800);
    } else {
      wrapper.classList.add("wrong");
      marker.textContent = "×";
      failSound.play();
      penaltyTime += 5;
      showPenalty();
      wrapper.onclick = null; // ❌ ミスタップされた選択肢は無効化
    }
  }


function disableChoices() {
  document.querySelectorAll(".option").forEach(el => el.onclick = null);
}

function showPenalty() {
  const text = document.getElementById("penalty-text");
  text.classList.remove("hidden");
  setTimeout(() => text.classList.add("hidden"), 1000);
}

function updateTimer() {
  const timer = document.getElementById("live-timer");
  const now = performance.now();
  const currentElapsed = (now - startTime) / 1000;
  timer.textContent = `${(totalElapsed + penaltyTime + currentElapsed).toFixed(3)} 秒`;

  if (currentQuestion < NUM_QUESTIONS) {
    requestAnimationFrame(updateTimer);
  }
}

function endGame() {
  const finalTime = totalElapsed + penaltyTime;
  showResult(finalTime);
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
  }



  function startConfetti() {
    const colors = ["#ffb6c1", "#ffc0cb", "#ff69b4", "#ff1493", "#db7093"];
    for (let i = 0; i < 30; i++) {
      const confetti = document.createElement("div");
      confetti.classList.add("confetti");
      confetti.style.left = Math.random() * 100 + "vw";
      confetti.style.animationDuration = (Math.random() * 2 + 2) + "s";
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      document.body.appendChild(confetti);
      setTimeout(() => confetti.remove(), 4000);
    }
  }

  function showResult(score) {
    const resultScore = document.getElementById("result-score"); // ✅ 追加
    const bestScoreEl = document.getElementById("best-score");   // ✅ 追加
    document.getElementById("quiz-area").classList.add("hidden");
    resultArea.classList.remove("hidden");

    if (score) {
      const formatted = score.toFixed(3);
      resultScore.textContent = `スコア：${formatted} 秒！`;


      fetch("https://bearhug-6c58c8d5bd0e.herokuapp.com/game/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user_id,
          game_name: "reaction_speed",
          score: parseFloat(formatted)
        }),
      })
      .then(res => res.json())
      .then(data => {
        if (data.best !== undefined) {
          startConfetti();
          bestScoreEl.classList.remove("hidden");
          bestScoreEl.textContent = `自己ベスト：${parseFloat(data.best).toFixed(3)} 秒`;
        }
      });
    }
  }

  // endBtn.addEventListener("click", () => {
  //   window.location.href = "minigame_list.html";
  // });

  rankingBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      decisionSound.play();
      document.getElementById("ranking-modal").classList.remove("hidden");
      loadRanking("mbti_median");
    });
  });




  // 📺 広告再生
  function onWatchAd(type) {
    const loadingOverlay = document.getElementById("loading-overlay");
    loadingOverlay.classList.remove("hidden");
    loadingOverlay.style.display = "flex";

    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: "SHOW_REWARD_AD",
        adType: type
      }));
    } else {
      alert("📺 広告（仮）を見ています...");
      fetch("https://bearhug-6c58c8d5bd0e.herokuapp.com/adresets/limit/recover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id, type })
      })
      .finally(() => {
        loadingOverlay.classList.add("hidden");
        loadingOverlay.style.display = "none";
        startGame();
      });
    }
  }

  // 📲 アプリ内通知から受け取り（広告完了）
  // window.addEventListener("AD_WATCHED", (event) => {
  //   const adType = event.detail?.type || "unknown";
  //   fetch("https://bearhug-6c58c8d5bd0e.herokuapp.com/adresets/limit/recover", {
  //     method: "POST",
  //     headers: { "Content-Type": "application/json" },
  //     body: JSON.stringify({ user_id, type: adType })
  //   }).finally(() => {
  //     const loadingOverlay = document.getElementById("loading-overlay");
  //     loadingOverlay.classList.add("hidden");
  //     loadingOverlay.style.display = "none";
  //     beginGameFlow();
  //   });
  // });

  window.addEventListener("AD_WATCHED", (event) => {
        alert("🎉 AD_WATCHED カスタムイベントを受信しました");
        const adType = event.detail?.type || "unknown";
        closeLoadingOverlay();
        // showPopup(`✅ ${adType === 'chat' ? 'チャット' : 'マッチ'}回数が回復しました！`);
    });

  window.addEventListener("AD_FAILED", (event) => {
      alert("❌ AD_FAILED カスタムイベントを受信しました");
      const msg = event.detail?.message || "不明なエラー";
      closeLoadingOverlay();
      // showPopup(`❌ 広告の視聴に失敗しました: ${msg}`);
  });
});
