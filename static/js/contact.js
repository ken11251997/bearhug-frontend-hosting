document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("contact-form");
    const contactType = document.getElementById("contact-type");
    const message = document.getElementById("message");
    const user_id = localStorage.getItem("user_id");

    const BackButton = document.getElementById("back-button");
    BackButton.addEventListener("click", function () {
        const savedUrl = localStorage.getItem("backToLogin");
        window.location.href =savedUrl 
        // history.back()
    });

  
    form.addEventListener("submit", async function (event) {
      event.preventDefault();

      const contact_type = contactType.value;
      const message_text = message.value;
      console.log("user_id:", user_id);
      console.log("category:", contact_type);
      console.log("message:", message_text);

      const data ={
        user_id : user_id,
        category : contact_type,
        message : message_text
        }
      const response = await fetch("https://bearhug-6c58c8d5bd0e.herokuapp.com/contact/submit", {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),  
      });
  
      if (response.ok) {
        showPopup("お問い合わせが送信されました。ありがとうございました。");
        form.reset();
      } else {
        showPopup("送信に失敗しました。もう一度お試しください。");
      }
    });

    function showPopup(message,callback) {
        // Remove existing popups
        document.querySelectorAll(".popup-message").forEach(p => p.remove());
        console.log(message)
        const popup = document.createElement("div");
        popup.className = "popup-message";
        popup.innerText = message;
        console.log(popup)
        alert(popup)
        document.body.appendChild(popup);
        
        setTimeout(() => {
            popup.classList.add("fade-out");
            setTimeout(() => {
                popup.remove();
                if (callback) callback();
            }, 100);
        }, 750);
    }
  });