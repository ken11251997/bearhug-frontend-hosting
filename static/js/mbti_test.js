document.addEventListener("DOMContentLoaded", function () {
    const introTexts = [
        "質問には入る前に、2択の質問を全部で20問するよ！",
        "考えすぎず直感で答えてね！"
    ];
    let introStep = 0;

    const questions = [
        { text: "1.グループで活動する方が好きだ。", type: "E" },
        { text: "12.相手の気持ちを考えて判断することが多い。", type: "F" },
        { text: "2.一人で過ごす時間が必要だと感じる。", type: "I" },
        { text: "20.期限が決まっている方がやる気が出る。", type: "J" },
        { text: "19.柔軟に予定を変えながら対応したい。", type: "P" },
        { text: "3.初対面の人ともすぐに打ち解ける。", type: "E" },
        { text: "18物事を決めるとスッキリする。", type: "J" },
        { text: "4.社交的な場面の後は疲れることが多い。", type: "I" },
        { text: "6.具体的な事実やデータに基づいて判断することが多い。", type: "S" },
        { text: "8.ルールやマニュアルに従う方が安心する。", type: "S" },
        { text: "17.その場の流れで動く方が得意だ。", type: "P" },
        { text: "5.物事を話しながら考えることが多い。", type: "E" },
        { text: "15.公平なルールを重視する。", type: "T" },
        { text: "9.未来の可能性やアイデアを考えるのが好きだ。", type: "N" },
        { text: "10.目の前の現実に意識を向けることが多い。", type: "S" },
        { text: "11.物事を論理的に分析するのが得意だ。", type: "T" },
        { text: "14.人の気持ちを傷つけるのはできるだけ避けたい。", type: "F" },
        { text: "16.計画を立てるのが好きだ。", type: "J" },
        { text: "13.感情よりも客観的な事実を優先する。", type: "T" },
        { text: "7.全体の流れや直感を大切にする。", type: "N" }
        
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
        resultBox.classList.remove("hidden");
        restartContainer.classList.remove("hidden");
        // resultText.textContent = `あなたのMBTIタイプは ${mbti} です！`;
        resultText.textContent = `あなたのMBTIタイプは ・・・`;
        resultLast.textContent = `${mbti}です！！`;
        // document.getElementById("user-icon").src = `/static/img/${mbti}.jpg`;
        document.getElementById("user-icon").src = `/static/img/send_message.png`;
        

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
        window.location.href = '/'
        // currentQuestion = 0;
        // scores = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };
        // resultBox.classList.add("hidden");
        // restartContainer.classList.add("hidden");
        // introBox.classList.remove("hidden");
        // introText.textContent = introTexts[0];
        // introStep = 0;
    });
});
