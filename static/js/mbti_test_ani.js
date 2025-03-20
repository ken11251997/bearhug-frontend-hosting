document.addEventListener("DOMContentLoaded", function () {
    const resultImage = document.getElementById("user-icon");

    if (resultImage) {
        resultImage.style.opacity = "0";
        resultImage.style.transform = "scale(0.5) translateY(0px)";

        // 画像が読み込まれたらアニメーションを適用
        resultImage.onload = function () {
            setTimeout(() => {
                resultImage.style.transition = "opacity 0.8s ease-out, transform 0.4s ease-out";
                resultImage.style.opacity = "1";
                resultImage.style.transform = "scale(1.2) translateY(0)";
                
                // 140%に拡大後、100%に戻す
                setTimeout(() => {
                    resultImage.style.transition = "transform 0.4s ease-out";
                    resultImage.style.transform = "scale(1) translateY(0)";
                }, 400);

            }, 500);
        };
    }
});
