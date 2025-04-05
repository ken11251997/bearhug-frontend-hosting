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
        body: JSON.stringify({data}),
      });
  
      if (response.ok) {
        alert("お問い合わせが送信されました。ありがとうございました。");
        form.reset();
      } else {
        alert("送信に失敗しました。もう一度お試しください。");
      }
    });
  });