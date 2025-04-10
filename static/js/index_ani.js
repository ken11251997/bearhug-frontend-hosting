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

    // const balloon = document.getElementById("balloon");
    // balloon.classList.remove("hidden");

    const bearImg = document.getElementById("bear-img");
    const bubbleText = document.getElementById("bear-bubble-text");

    const messages = [
        "いい出会いが待ってるかも…？",
        "相性ピッタリな相手がいるかも！",
        "クマたちが応援してるよ🧸",
        "チャットしてみてね✨",
        "ベアと一緒にマッチング体験しよう！"
    ];

    bearImg.addEventListener("click", () => {
        const random = messages[Math.floor(Math.random() * messages.length)];
        bubbleText.textContent = random;
    });
});
