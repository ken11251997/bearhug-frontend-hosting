document.addEventListener("DOMContentLoaded", function () {

    const LiteButton = document.getElementById("Lite-btn");
    const FullButton = document.getElementById("Full-btn");
    const user_id = localStorage.getItem("user_id");
    console.log(user_id)

    const BackButton = document.getElementById("back-button");
    BackButton.addEventListener("click", function () {
        const savedUrl = localStorage.getItem("backToLogin");
        window.location.href =savedUrl 
        // history.back()
    });


    LiteButton.addEventListener("click", function () {
        updatePlan("light");
    });

    // フルプランにアップグレード
    FullButton.addEventListener("click", function () {
        updatePlan("full");
    });

    function updatePlan(plan) {
        fetch("https://bearhug-6c58c8d5bd0e.herokuapp.com/subscribe/subscribe_chose", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: user_id, plan: plan })
        })
        .then(response => response.json())
        .then(data => {
            showPopup(data.message);
            setTimeout(() => window.location.href = 'index.html', 1500);  // ✅ 反映のためページ再読み込み
            
        }).catch(error => console.error("リスト更新エラー:", error));
    };
        
    
    function showPopup(message) {
        // Remove existing popups
        document.querySelectorAll(".popup-message").forEach(p => p.remove());

        const popup = document.createElement("div");
        popup.className = "popup-message";
        popup.innerText = message;
        document.body.appendChild(popup);
        console.log("funshow")
        
        setTimeout(() => {
            popup.classList.add("fade-out");
            setTimeout(() => popup.remove(), 1500);
        }, 1000);
    }
})