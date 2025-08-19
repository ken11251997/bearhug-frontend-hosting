document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("ranking-modal");
  const closeBtn = document.getElementById("close-ranking");
  const tabButtons = document.querySelectorAll(".ranking-tab");
  const rankingList = document.getElementById("ranking-list");

  const user_id = new URLSearchParams(window.location.search).get("user_id");
  const mbti = new URLSearchParams(window.location.search).get("mbti");
  const game_name = new URLSearchParams(window.location.search).get("game_name") || "reaction_game";

  const mbtiColorClasses = {
    ISTJ: "mbti-blue", ISFJ: "mbti-blue",
    INFJ: "mbti-green", INTJ: "mbti-green",
    ISTP: "mbti-orange", ISFP: "mbti-orange",
    INFP: "mbti-yellow", INTP: "mbti-yellow",
    ESTP: "mbti-red", ESFP: "mbti-red",
    ENFP: "mbti-pink", ENTP: "mbti-pink",
    ESTJ: "mbti-purple", ESFJ: "mbti-purple",
    ENFJ: "mbti-gray", ENTJ: "mbti-gray",
  };

  const mbtiIcons = {};
  Object.keys(mbtiColorClasses).forEach(type => {
    mbtiIcons[type] = `static/img/${type}.png`;
  });

  // ✅ タブ切り替え
  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      tabButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const type = btn.dataset.type;
      loadRanking(type); // game_name は内部で保持
    });
  });

  // ✅ モーダルを閉じる
  closeBtn.addEventListener("click", () => {
    modal.classList.add("hidden");
  });

  // ✅ ランキング取得API
  function loadRanking(type) {
    showLoadingOverlay();

    const url = `https://bearhug-6c58c8d5bd0e.herokuapp.com/ranking/${game_name}?type=${type}&user_id=${user_id}`;
    fetch(url)
      .then(res => res.json())
      .then(data => {
        renderRanking(data.ranking || []);
      })
      .catch(err => {
        console.error("ランキング取得エラー:", err);
        rankingList.innerHTML = "<p>読み込み失敗</p>";
      })
      .finally(() => {
        hideLoadingOverlay();
      });
  }

  // ✅ ランキング表示処理
  function renderRanking(entries) {
    rankingList.innerHTML = "";
    if (entries.length === 0) {
      rankingList.innerHTML = "<p>データがありません</p>";
      return;
    }

    const isScoreBased = game_name === "block_game";

    // entries.sort((a, b) => {
    //   if (isScoreBased) {
    //     return b.score - a.score; // 高い方が上位（block_game）
    //   } else {
    //     return a.score - b.score; // 速い方が上位（reaction_gameなど）
    //   }
    // });

    entries.sort((a, b) => {
      // 記録なしは常に下に
      if (a.score === null && b.score === null) return 0;
      if (a.score === null) return 1;   // aが記録なし → bを上に
      if (b.score === null) return -1;  // bが記録なし → aを上に

      // ここからは両方スコアありの場合
      const isScoreBased = game_name === "block_game" || game_name === "calcbattle";
      
      if (isScoreBased) {
        // ブロック崩し・計算ゲーム → スコア大きい順
        return b.score - a.score;
      } else {
        // リアクションゲーム → 時間短い順
        return a.score - b.score;
      }
    });

    entries.forEach(entry => {
      const type = entry.mbti || "???";
      const icon = mbtiIcons[type] || "static/img/unknown.png";
      const colorClass = mbtiColorClasses[type] || "";
      let scoreText = "記録なし";
      if (entry.score !== null && entry.score !== undefined) {
        scoreText = isScoreBased
          ? `${entry.score.toLocaleString()} 点`
          : `${entry.score.toFixed(3)} 秒`;
      }

      const row = document.createElement("div");
      row.className = `ranking-row ${colorClass}`;
      row.innerHTML = `
        <img src="${icon}" alt="${type}" class="mbti-icon" />
        <span class="mbti-type">${type}</span>
        <span class="user-name">${entry.username || "???"}</span>
        <span class="score">${scoreText}</span>
      `;
      rankingList.appendChild(row);
    });
  }

  window.loadRanking = loadRanking;

  function showLoadingOverlay() {
    const overlay = document.getElementById("loading-overlay");
    if (overlay) {
      overlay.classList.remove("hidden");
      overlay.style.display = "flex";
    }
  }

  function hideLoadingOverlay() {
    const overlay = document.getElementById("loading-overlay");
    if (overlay) {
      overlay.classList.add("hidden");
      overlay.style.display = "none";
    }
  }

  // ✅ 初期表示（MBTI中央値）
  loadRanking("mbti_median");
});
