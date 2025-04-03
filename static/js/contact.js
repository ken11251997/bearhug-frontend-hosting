document.getElementById('contact-form').addEventListener('submit', async function (e) {
    e.preventDefault();
  
    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const category = document.getElementById("category").value;
    const message = document.getElementById("message").value;

    const BackButton = document.getElementById("buck_btn");
    BackButton.addEventListener("click", function () {
        const savedUrl = localStorage.getItem("backToLogin");
        window.location.href =savedUrl 
        // history.back()
    });
  
    const res = await fetch("/contact/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email, category, message }),
    });
  
    const result = await res.json();
    document.getElementById("status-message").innerText = result.message || "送信完了しました。";
  });
  