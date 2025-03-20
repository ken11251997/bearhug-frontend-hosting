
// フォーム切り替え用関数
function toggleForm(formType) {
    document.getElementById("register-form").classList.add("hidden");
    document.getElementById("login-form").classList.add("hidden");
    document.getElementById(`${formType}-form`).classList.remove("hidden");
}

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


document.addEventListener("DOMContentLoaded", function () {
    const logo = document.querySelector(".logo");
    logo.style.opacity = "0";
    logo.style.transform = "translateY(-50px) scale(0.7)";  // 初期スケールを少し大きめに

    setTimeout(() => {
        logo.style.transition = "opacity 0.6s ease-out, transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)";
        logo.style.opacity = "1";
        logo.style.transform = "translateY(0) scale(1)";
    }, 500);
});
