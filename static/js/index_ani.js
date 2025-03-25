function toggleForm(formType) {
    document.getElementById("register-form").classList.add("hidden");
    document.getElementById("login-form").classList.add("hidden");
    document.getElementById(`${formType}-form`).classList.remove("hidden");
    const existingBear = document.getElementById("bear-1");
    const existingBalloon = document.getElementById("balloon-1");
    if (existingBear) existingBear.remove();
    if (existingBalloon) existingBalloon.remove();
}
let bearImage;

document.addEventListener("DOMContentLoaded", function () {
    // フォーム切り替え用関数
    
    window.addEventListener("load", function () {
        setTimeout(() => {
            document.querySelector("h1").classList.add("show");
            document.querySelector(".card").classList.add("show");
        }, 1000);

        // 背景画像スライドアニメーションを同時に開始
        setTimeout(() => {
            document.querySelectorAll(".background-slider").forEach(slider => {
                slider.style.animationPlayState = "running";
            });
        }, 0);
    });

    // 背景画像スライドアニメーションの適用

    document.querySelectorAll(".top-slider").forEach(slider => {
        slider.style.animation = "slideLeft 20s linear infinite";
        slider.style.animationPlayState = "paused";
    });

    document.querySelectorAll(".bottom-slider").forEach(slider => {
        slider.style.animation = "slideRight 20s linear infinite";
        slider.style.animationPlayState = "paused";
    });



    const logo = document.querySelector(".logo");
    logo.style.opacity = "0";
    logo.style.transform = "translateY(-50px) scale(0.7)";  // 初期スケールを少し大きめに

    setTimeout(() => {
        logo.style.transition = "opacity 0.6s ease-out, transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)";
        logo.style.opacity = "1";
        logo.style.transform = "translateY(0) scale(1)";
    }, 500);

    function createBearWithBalloon(imgSrc, bearX, bearY, balloonX, balloonY, messageText) {
        // 🧸 クマ画像を作成
        bearImage = document.createElement("img");
        bearImage.src = imgSrc;
        bearImage.alt = "Bear";
        bearImage.style.position = "absolute";
        bearImage.style.left = bearX;
        bearImage.style.top = bearY;
        bearImage.style.width = "240px";
        bearImage.style.zIndex = "500";
        bearImage.style.cursor = "pointer";
        bearImage.style.transition = "transform 0.5s ease";

        // 💬 吹き出し作成

        const balloon = document.createElement("div");
        balloon.className = "balloon"; // ← 追加
        balloon.innerHTML = `
            ${messageText}
            <div style="
                position: absolute;
                top: 50%;
                left: -12px;
                width: 0;
                height: 0;
                border-top: 10px solid transparent;
                border-bottom: 10px solid transparent;
                border-right: 12px solid #fffaf0;
                transform: translateY(-50%);
            "></div>
        `;
        balloon.style.position = "absolute";
        balloon.style.left = balloonX;
        balloon.style.top = balloonY;
        balloon.style.padding = "10px 16px";
        balloon.style.background = "#fffaf0";
        balloon.style.border = "2px solid #8b4513";
        balloon.style.borderRadius = "12px";
        balloon.style.color = "#8b4513";
        balloon.style.fontWeight = "bold";
        balloon.style.boxShadow = "0 4px 10px rgba(0,0,0,0.2)";
        balloon.style.display = "none";
        balloon.style.zIndex = "600";
        balloon.style.whiteSpace = "nowrap";

        bearImage.id = "bear-1";
        balloon.id = "balloon-1";
        

        // 🖱️ クマをクリックしたら吹き出し表示 → 3秒後に消える
        bearImage.addEventListener("click", () => {
            balloon.style.display = "block";
            setTimeout(() => {
                balloon.style.display = "none";
            }, 3000);
        });

        bearImage.addEventListener("mouseenter", () => {
            bearImage.style.transform = "scale(1.05)";
        });
        bearImage.addEventListener("mouseleave", () => {
            bearImage.style.transform = "scale(1)";
        });

        document.body.appendChild(bearImage);
        document.body.appendChild(balloon);
    }

    // ✅ 任意の座標で実行（例）
    createBearWithBalloon(
        "static/img/bear_2.png",  // クマ画像
        "25%", "63%",              // クマの位置
        "calc(30% + 130px)", "70%",// 吹き出しの位置
        "まずは簡単診断から！"       // 吹き出しのメッセージ
    );
});
