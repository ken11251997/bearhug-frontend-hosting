document.addEventListener("DOMContentLoaded", () => {
  const startScreen = document.getElementById("start-screen");
  const gameScreen = document.getElementById("game-screen");
  const endScreen = document.getElementById("end-screen");

  const startBtn = document.getElementById("start-btn");
  const retryBtn = document.getElementById("retry-btn");
  const backBtn = document.getElementById("back-btn");
  const rankingBtn = document.getElementById("ranking-btn");
  const rankingAgainBtn = document.getElementById("end-ranking-btn");
  const rankingBtns = document.querySelectorAll("#ranking-btn, #ranking-again-btn");

  const timerDisplay = document.getElementById("timer");
  const questionDisplay = document.getElementById("question");
  const choicesContainer = document.getElementById("choices");
  const questionCountDisplay = document.getElementById("question-count");
  const feedbackDisplay = document.getElementById("feedback");
  const finalTimeDisplay = document.getElementById("final-time");

  const user_id = new URLSearchParams(window.location.search).get("user_id");
  const mbti = new URLSearchParams(window.location.search).get("mbti");

  let currentQuestionIndex = 0;
  let startTime = 0;
  let elapsed = 0;
  let penaltyTime = 0;
  let timerInterval = null;
  const totalQuestions = 5;
  let questions = [];

  function generateQuestions() {
    const q = [];
    for (let i = 0; i < totalQuestions; i++) {
      const a = Math.floor(Math.random() * 20) + 1;
      const b = Math.floor(Math.random() * 20) + 1;
      const ops = ['+', '-', '×'];
      const op = ops[Math.floor(Math.random() * ops.length)];
      let answer, questionText;

      switch (op) {
        case '+':
          answer = a + b;
          questionText = `${a} + ${b} = ?`;
          break;
        case '-':
          answer = a - b;
          questionText = `${a} - ${b} = ?`;
          break;
        case '×':
          answer = a * b;
          questionText = `${a} × ${b} = ?`;
          break;
      }

      const choices = new Set();
      choices.add(answer);
      while (choices.size < 4) {
        choices.add(answer + Math.floor(Math.random() * 10) - 5);
      }

      q.push({
        questionText,
        answer,
        choices: Array.from(choices).sort(() => Math.random() - 0.5),
      });
    }
    return q;
  }

  function showScreen(target) {
    [startScreen, gameScreen, endScreen].forEach(screen => screen.classList.add("hidden"));
    target.classList.remove("hidden");
  }


    startBtn.addEventListener("click", () => {
    startBtn.disabled = true;

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
            beginGameFlow();
        }
        })
        .catch(err => {
        console.error("通信エラー:", err);
        alert("通信エラー:")
        });
    });

  function beginGameFlow() {
    // 強制的に game-screen を表示
    document.getElementById("start-screen").classList.add("hidden");
    document.getElementById("end-screen").classList.add("hidden");
    document.getElementById("game-screen").classList.remove("hidden");

    questions = generateQuestions();
    currentQuestionIndex = 0;
    elapsed = 0;
    penaltyTime = 0;
    startTime = performance.now();
    startTimer();
    showQuestion();
    }

  function startTimer() {
    timerInterval = setInterval(() => {
      const now = performance.now();
      elapsed = (now - startTime) / 1000 + penaltyTime;
      timerDisplay.textContent = `タイム: ${elapsed.toFixed(3)}秒`;
    }, 50);
  }

  function stopTimer() {
    clearInterval(timerInterval);
  }

  function showQuestion() {
    console.log("✅ showQuestion() 呼び出し中:", questions[currentQuestionIndex]);
    const q = questions[currentQuestionIndex];
    questionDisplay.textContent = q.questionText;
    questionCountDisplay.textContent = `第${currentQuestionIndex + 1}問 / ${totalQuestions}`;
    choicesContainer.innerHTML = "";
    feedbackDisplay.textContent = "";

    q.choices.forEach(choice => {
      const btn = document.createElement("button");
      btn.className = "choice-button";
      btn.textContent = choice;
      btn.addEventListener("click", () => handleAnswer(choice));
      choicesContainer.appendChild(btn);
    });
  }

  function handleAnswer(choice) {
    const q = questions[currentQuestionIndex];
    if (choice === q.answer) {
      showFeedback("⭕ 正解！", "correct");
      currentQuestionIndex++;
      if (currentQuestionIndex < totalQuestions) {
        setTimeout(showQuestion, 600);
      } else {
        endGame();
      }
    } else {
      showFeedback("❌ 不正解！+10秒", "wrong");
      penaltyTime += 10;
    }
  }

  function showFeedback(text, type) {
    feedbackDisplay.textContent = text;
    feedbackDisplay.className = "feedback " + type;
    setTimeout(() => {
      feedbackDisplay.textContent = "";
      feedbackDisplay.className = "feedback";
    }, 800);
  }

  function endGame() {
    stopTimer();
    showScreen(endScreen);
    finalTimeDisplay.textContent = `あなたの記録：${elapsed.toFixed(3)}秒！`;
    

    // ✅ スコア送信処理
    fetch("https://bearhug-6c58c8d5bd0e.herokuapp.com/game/score", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id,
        game_name: "calcbattle",
        score: parseFloat(elapsed.toFixed(3)),
      }),
    })
      .then(res => res.json())
      .then(data => {
        console.log("スコア送信成功:", data);
        if (data.best !== undefined) {
            startConfetti()
          // 🎉 ここでエフェクトや音を鳴らす処理を入れてもOK
        }
      })
      .catch(err => {
        console.error("スコア送信エラー:", err);
      });
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

  // 🎯 ランキング表示処理（モーダル）
  
  rankingBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      document.getElementById("ranking-modal").classList.remove("hidden");
      loadRanking("mbti_median");
    });
  });

  // 🎮 イベント登録
//   startBtn.addEventListener("click", startGame);
  retryBtn.addEventListener("click", beginGameFlow);
  backBtn.addEventListener("click", () => showScreen(startScreen));
//   rankingBtn.addEventListener("click", showRanking);


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
        .then(res => {
        if (!res.ok) throw new Error("リミット解除失敗");
        })
        .catch(err => {
        console.error("広告解除エラー:", err);
        alert("通信エラー（広告）: " + err.message);
        })
        .finally(() => {
        loadingOverlay.classList.add("hidden");
        loadingOverlay.style.display = "none";
        alert("gameflow"); // ✅ 確実に表示される
        beginGameFlow();
        });
    }
    }

  // 📲 アプリ内通知から受け取り（広告完了）
//   window.addEventListener("AD_WATCHED", (event) => {
//     const adType = event.detail?.type || "unknown";
//     fetch("https://bearhug-6c58c8d5bd0e.herokuapp.com/adresets/limit/recover", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ user_id, type: adType })
//     }).finally(() => {
//       const loadingOverlay = document.getElementById("loading-overlay");
//       loadingOverlay.classList.add("hidden");
//       loadingOverlay.style.display = "none";
//       beginGameFlow();
//     });
//   });

    window.addEventListener("AD_WATCHED", (event) => {
            // alert("🎉 AD_WATCHED カスタムイベントを受信しました");
            const adType = event.detail?.type || "unknown";
            closeLoadingOverlay();
            // showPopup(`✅ ${adType === 'chat' ? 'チャット' : 'マッチ'}回数が回復しました！`);
        });

    window.addEventListener("AD_FAILED", (event) => {
        // alert("❌ AD_FAILED カスタムイベントを受信しました");
        const msg = event.detail?.message || "不明なエラー";
        closeLoadingOverlay();
        // showPopup(`❌ 広告の視聴に失敗しました: ${msg}`);
    });

});