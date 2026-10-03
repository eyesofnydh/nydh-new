const funnyThoughts = [
      "QA: Where ‘It works on my machine’ goes to die.",
      "Coding is 90% figuring out why it’s not working... and 10% Googling the error.",
      "Design is just making things pretty until the client ruins it.",
      "Photography tip: If you can’t make it good, make it blurry and call it ‘artsy.’",
      "If debugging is the process of removing bugs, then programming must be the process of putting them in.",
      "QA doesn’t break things. They just *expose* how broken it already was.",
      "Design feedback: 'Can you make it pop?' – The horror continues.",
      "My code never has bugs. It just develops random unexpected features.",
      "Photography: Because buying expensive gear is cheaper than therapy.",
      "I’m on a coffee-based salary.","Ctrl + Z is my coding superpower.",
      "QA: Making developers cry since forever."
    ];

    function showRandomFunnyQuote() {
      const quoteBox = document.getElementById("funny-quote-box");
      const randomIndex = Math.floor(Math.random() * funnyThoughts.length);
      quoteBox.textContent = funnyThoughts[randomIndex];
    }

    // Show first quote on load and update every 10s
    showRandomFunnyQuote();
    setInterval(showRandomFunnyQuote, 10000);
