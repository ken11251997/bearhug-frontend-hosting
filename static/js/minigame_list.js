document.addEventListener("DOMContentLoaded", () => {
  const gameList = document.getElementById("game-list");
  const user_id = localStorage.getItem("user_id");
  const mbti = localStorage.getItem("user_mbti");
  const BackButton = document.getElementById("buck_btn");
  const loginUrl = localStorage.getItem("backToLogin");

  // 🔁 戻るボタン処理
  BackButton.addEventListener("click", function () {
    window.location.href = loginUrl;
  });

  const games = [
    {
      id: "reaction",
      title: "反応速度テスト",
      image: "static/img/some_reaction.png",
      description: "笑ったクマをすばやくタップ！反応速度を競おう！",
      link: "reaction_game.html"
    },
    {
      id: "calcbattle",
      title: "計算バトル5！",
      image: "static/img/some_calc.jpg",
      description: "5問の計算クイズをどれだけ早く解けるか！？",
      link: "calcbattle_game.html"
    },
    {
      id: "block",
      title: "ブロックくずし",
      image: "static/img/some_block.jpg",
      description: "ボール落とさずブロック崩せ！",
      link: "block_game.html"
    }
  ];

  const imagePromises = [];

  games.forEach(game => {
    const card = document.createElement("div");
    card.className = "game-card";
    card.innerHTML = `
      <img src="${game.image}" alt="${game.title}" class="game-thumbnail" />
      <div class="game-info">
        <div class="game-title">${game.title}</div>
        <div class="game-desc">${game.description}</div>
      </div>
    `;

    // ✅ 画像の読み込みが終わるまでPromiseで待つ
    const img = card.querySelector("img");
    const p = new Promise(resolve => {
      if (img.complete) {
        resolve();
      } else {
        img.onload = resolve;
        img.onerror = resolve;
      }
    });
    imagePromises.push(p);

    card.addEventListener("click", () => {
      const gameName = game.link.replace(".html", "");  // e.g. "reaction_game"
      window.location.href = `${game.link}?user_id=${user_id}&mbti=${mbti}&game_name=${gameName}`;
    });

    gameList.appendChild(card);
  });

  // ✅ 全画像が読み終わったらローディング非表示
  Promise.all(imagePromises).then(() => {
    const loading = document.getElementById("loading-overlay");
    if (loading) loading.style.display = "none";
    console.log("✅ ミニゲーム画像すべて読み込み完了");
  });
});
