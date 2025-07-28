function restartDefaultBgm(){
  const oldWin = window.open('', 'bgmWindow');
  if (oldWin && !oldWin.closed) {
    oldWin.close();
  }

  const win = window.open('', 'bgmWindow', 'width=1,height=1,left=-1000,top=-1000');
  if (win) {
    win.document.write(`
      <html><head><title>BGM</title></head>
      <body style="margin:0">
        <audio id="bgm" autoplay loop>
          <source src="static/sound/bgm_default.mp3" type="audio/mp3">
        </audio>
      </body></html>
    `);
  }
}

document.addEventListener("DOMContentLoaded", () => {

  const rankingBtns = document.querySelectorAll("#ranking-btn, #ranking-again-btn");

  const user_id = new URLSearchParams(window.location.search).get("user_id");
  const mbti = new URLSearchParams(window.location.search).get("mbti");
  if (!user_id) {
    alert("⚠️ user_id が取得できません。スコアが保存されません。URLを確認してください。");
    return;
  }

  document.getElementById("quiz-area").classList.add("hidden");

  const successSound = new Audio("static/sound/success.mp3");
  const failSound = new Audio("static/sound/fail.mp3");
  const decisionSound = new Audio("static/sound/decision.mp3");

  const loadingOverlay = document.getElementById("loading-overlay");
  
  const bgImage = new Image();
  bgImage.src = "static/img/reaction.jpg";  // あなたの背景画像のパスに合わせてください

  bgImage.onload = () => {
    loadingOverlay.style.display = "none";
    console.log("✅ 背景画像の読み込み完了");
  };

  bgImage.onerror = () => {
    loadingOverlay.style.display = "none";
    console.warn("⚠️ 背景画像の読み込みに失敗");
  };

  

 // === 表情一覧（後で画像追加予定） ===
const expressions = ["expression_smile","expression_yawn", "expression_angry", "expression_cry", "expression_doya", "expression_happy","expression_normal","expression_shy","expression_sleepy","expression_default"];

const NUM_QUESTIONS = 5;
const CHOICE_COUNTS = [2, 9, 12, 25, 30];


let currentQuestion = 0;
let startTime;
let totalElapsed = 0;
let penaltyTime = 0;
let correctAnswer = "";

window.onload = () => {
  // document.getElementById("start-btn").onclick = startGame;
  document.getElementById("play-again-btn").onclick = () => location.reload();
  // document.getElementById("end-btn").onclick = () => {
  //   restartDefaultBgm();  // ✅ 共通BGM再開
  //   location.href = "minigame_list.html";
  // };
  document.getElementById("back-button").onclick = () => {
    restartDefaultBgm();  // ✅ 共通BGM再開
    location.href = "minigame_list.html";
  };
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
    const bgmWin = window.open('', 'bgmWindow'); // すでに存在していれば参照される
    if (bgmWin && !bgmWin.closed) {
      bgmWin.close();
    }
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



function waitForImagesToLoad() {
  const promises = Object.values(imageCache).map(img => {
    return new Promise(resolve => {
      if (img.complete) {
        resolve();
      } else {
        img.onload = resolve;
        img.onerror = resolve;
      }
    });
  });
  return Promise.all(promises);
}

async function startGame() {
  preloadImages();
  await waitForImagesToLoad();

  document.getElementById("instruction").classList.add("hidden");
  document.getElementById("game-title").classList.add("hidden"); // ✅ タイトル非表示にする
  const countdown = document.getElementById("countdown-text");
  countdown.classList.remove("hidden");
  countdown.textContent = "よーい...";

  setTimeout(() => {
    countdown.textContent = "スタート！";

    setTimeout(() => {
      countdown.classList.add("hidden");
      document.getElementById("quiz-area").classList.remove("hidden"); // ✅ ここで初めて問題表示
      startTime = performance.now();
      showNextQuestion();
      updateTimer();
    }, 800);
  }, 1000);
}

function showNextQuestion() {
  const count = CHOICE_COUNTS[currentQuestion]; // 🔄 先に count を定義
  const columns = Math.min(Math.ceil(Math.sqrt(count)), 9);
  const grid = document.getElementById("options-grid"); // 🔄 gridも定義が後だったので前に移動
  grid.style.gridTemplateColumns = `repeat(${columns}, auto)`;
  if (currentQuestion >= NUM_QUESTIONS) return endGame();


  // 仮の表情リスト（本番では画像名に合わせて更新）
  // let allExpressions = [];
  // while (allExpressions.length < count) {
  //   allExpressions.push(...shuffle([...expressions]));
  // }
  // allExpressions = allExpressions.slice(0, count);

  // correctAnswer = allExpressions.length > 0 ? allExpressions[Math.floor(Math.random() * allExpressions.length)] : expressions[0];

  correctAnswer = expressions[Math.floor(Math.random() * expressions.length)];

  // ターゲット以外の候補を複製して (count - 1) 個作る
  const incorrectOptions = expressions.filter(expr => expr !== correctAnswer);
  let duplicatedIncorrects = [];

  while (duplicatedIncorrects.length < count - 1) {
    duplicatedIncorrects.push(...shuffle([...incorrectOptions]));
  }
  duplicatedIncorrects = duplicatedIncorrects.slice(0, count - 1);

  // 正解1つ + 誤答 (重複あり)
  let allExpressions = shuffle([correctAnswer, ...duplicatedIncorrects]);

  
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
    console.log("🎉 ゲーム終了！スコア:", score);
    document.getElementById("quiz-area").classList.add("hidden");
    const resultArea = document.getElementById("result-area"); // ← 🔧 追加
    resultArea.classList.remove("hidden");

    if (score) {
      const formatted = score.toFixed(3);
      resultScore.textContent = `スコア：${formatted} 秒！`;


      fetch("https://bearhug-6c58c8d5bd0e.herokuapp.com/game/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user_id,
          game_name: "reaction_game",
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
      loadRanking("mbti_median", "reaction_speed");
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
