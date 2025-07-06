document.addEventListener("DOMContentLoaded", () => {
  const gameList = document.getElementById("game-list");
  const user_id = localStorage.getItem("user_id");
  const mbti = localStorage.getItem("user_mbti");
  const backBtn = document.getElementById("back-to-login");
  if (user_id && mbti) {
    const user_name = localStorage.getItem("user_name") || "User";
    backBtn.href = `login.html?user_id=${user_id}&mbti=${mbti}&user_name=${encodeURIComponent(user_name)}`;
  } else {
    backBtn.href = "login.html";
  }

  const games = [
    {
      id: "reaction",
      title: "反応速度テスト",
      image: "static/img/game_reaction.png",
      description: "笑ったクマをすばやくタップ！反応速度を競おう！",
      link: "reaction_game.html"
    },
    // 今後の追加用サンプル
    // {
    //   id: "click",
    //   title: "連打チャレンジ",
    //   image: "static/img/game_click.png",
    //   description: "10秒間で何回クリックできるか挑戦！",
    //   link: "click_game.html"
    // }
  ];

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
    card.addEventListener("click", () => {
      window.location.href = `${game.link}?user_id=${user_id}&mbti=${mbti}`;
    });
    gameList.appendChild(card);
  });
});
