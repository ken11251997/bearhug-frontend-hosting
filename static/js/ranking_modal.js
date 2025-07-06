document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("ranking-modal");
  const closeBtn = document.getElementById("close-ranking");
  const tabButtons = document.querySelectorAll(".ranking-tab");
  const rankingList = document.getElementById("ranking-list");

  const user_id = new URLSearchParams(window.location.search).get("user_id");
  const mbti = new URLSearchParams(window.location.search).get("mbti");

  // ✅ MBTIごとの色クラス（list.cssと連携）
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

  // ✅ MBTI画像パス（MBTI画像は /static/img/mbti_icons/MBTI.png）
  const mbtiIcons = {};
  Object.keys(mbtiColorClasses).forEach(type => {
    mbtiIcons[type] = `static/img/mbti_icons/${type}.png`;
  });

  // ✅ タブ切り替え
  tabButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      tabButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const type = btn.dataset.type;
      loadRanking(type);
    });
  });

  // ✅ モーダルを閉じる
  closeBtn.addEventListener("click", () => {
    modal.classList.add("hidden");
  });

  // ✅ ランキング取得API
  function loadRanking(type) {
    showLoadingOverlay();

    const url = `https://bearhug-6c58c8d5bd0e.herokuapp.com/game/ranking/reaction_speed?type=${type}&user_id=${user_id}`;
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

    entries.forEach(entry => {
      const row = document.createElement("div");
      const type = entry.mbti || "???";
      const icon = mbtiIcons[type] || "static/img/unknown.png";
      const colorClass = mbtiColorClasses[type] || "";
      const scoreText = entry.score === null ? "記録なし" : `${entry.score.toFixed(3)} 秒`;

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

  // ✅ 初回読み込み用関数（外から呼べる）
  window.loadRanking = loadRanking;

  // ✅ ローディング表示制御（共通仕様）
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
});
