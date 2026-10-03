const peekImage = document.getElementById("peekImage");
    const clickSound = document.getElementById("clickSound");

    peekImage.addEventListener("mouseenter", () => {
      clickSound.currentTime = .1; // reset if already playing
      clickSound.play().catch(() => {});
    });
