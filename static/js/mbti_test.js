document.addEventListener("DOMContentLoaded", function () {
    const introTexts = [
        "質問には入る前に、2択の質問を全部で20問するよ！",
        "考えすぎず直感で答えてね！"
    ];
    let introStep = 0;
    let bearImage;

    const questions = [
        { text: "1.グループで活動する方が好きだ。", type: "E" },
        { text: "2.相手の気持ちを考えて判断しがち。", type: "F" },
        { text: "3.一人で過ごす時間が必要だと感じる。", type: "I" },
        { text: "4.期限が決まっている方がやる気が出る。", type: "J" },
        { text: "5.柔軟に予定を変えながら対応したい。", type: "P" },
        { text: "6.初対面の人ともすぐに打ち解ける。", type: "E" },
        { text: "7.物事を決めるとスッキリする。", type: "J" },
        { text: "8.社交的な場面の後は疲れることが多い。", type: "I" },
        { text: "9.事実やデータで判断するのが好き。", type: "S" },
        { text: "10.ルールやマニュアルに従う方が安心だ。", type: "S" },
        { text: "11.その場の流れで動く方が得意だ。", type: "P" },
        { text: "12.物事を話しながら考えることが多い。", type: "E" },
        { text: "13.公平なルールを重視する。", type: "T" },
        { text: "14.未来やアイデアを考えるのが好きだ。", type: "N" },
        { text: "15.目の前の現実に意識を向けがちだ。", type: "S" },
        { text: "16.物事を論理的に分析するのが得意だ。", type: "T" },
        { text: "17.人の気持ちを傷つけるのは避けたい。", type: "F" },
        { text: "18.計画を立てるのが好きだ。", type: "J" },
        { text: "19.感情よりも客観的な事実を優先する。", type: "T" },
        { text: "20.全体の流れや直感を大切にする。", type: "N" }
        
    ];

    let currentQuestion = 0;
    let scores = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };

    const introText = document.getElementById("intro-text");
    const nextIntroBtn = document.getElementById("next-intro-btn");
    const introBox = document.getElementById("intro-box");

    const questionBox = document.getElementById("question-box");
    const questionText = document.getElementById("question-text");
    const buttonContainer = document.getElementById("button-container");
    const yesBtn = document.getElementById("yes-btn");
    const noBtn = document.getElementById("no-btn");

    const resultBox = document.getElementById("result-box");
    const resultText = document.getElementById("result-text");
    const resultLast = document.getElementById("result-last");
    const restartContainer = document.getElementById("restart-container");
    const restartBtn = document.getElementById("restart-btn");

    

    nextIntroBtn.addEventListener("click", function () {
        if (introStep < introTexts.length - 1) {
            introStep++;
            introText.textContent = introTexts[introStep];
        } else {
            introBox.classList.add("hidden");
            questionBox.classList.remove("hidden");
            buttonContainer.classList.remove("hidden");
            showQuestion();
        }
    });

    function showQuestion() {
        if (currentQuestion < questions.length) {
            questionText.textContent = questions[currentQuestion].text;
        } else {
            calculateMBTI();
        }
    }

    function calculateMBTI() {
        const mbti = (scores.E > scores.I ? "E" : "I") +
                     (scores.S > scores.N ? "S" : "N") +
                     (scores.T > scores.F ? "T" : "F") +
                     (scores.J > scores.P ? "J" : "P");

        questionBox.classList.add("hidden");
        buttonContainer.classList.add("hidden");
        if (bearImage) {
            bearImage.remove();  // ✅ クマを削除
        }
        resultBox.classList.remove("hidden");
        restartContainer.classList.remove("hidden");
        // resultText.textContent = `あなたのMBTIタイプは ${mbti} です！`;
        resultText.textContent = `あなたのMBTIタイプは ・・・`;
        resultLast.textContent = `${mbti}です！！`;
        // document.getElementById("user-icon").src = `/static/img/${mbti}.jpg`;
        document.getElementById("user-icon").src =`static/img/${mbti}.png`;
        

    }

    yesBtn.addEventListener("click", function () {
        scores[questions[currentQuestion].type]++;
        currentQuestion++;
        showQuestion();
    });

    noBtn.addEventListener("click", function () {
        const oppositeType = {
            "E": "I", "I": "E",
            "S": "N", "N": "S",
            "T": "F", "F": "T",
            "J": "P", "P": "J"
        }[questions[currentQuestion].type];

        scores[oppositeType]++;
        currentQuestion++;
        showQuestion();
    });

    restartBtn.addEventListener("click", function () {
        window.location.href = 'index.html'
    });

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
        "/static/img/bear_2.png",  // クマ画像
        "26%", "68%",              // クマの位置
        "calc(33% + 130px)", "75%",// 吹き出しの位置
        "頭からっぽにして答えてね～"       // 吹き出しのメッセージ
    );
});
