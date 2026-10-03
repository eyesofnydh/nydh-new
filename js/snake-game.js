(function () {
const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const scoreEl = document.getElementById('score');
  const highScoreEl = document.getElementById('highScore');
  const gameOverMsg = document.getElementById('gameOver');
  const popupWrapper = document.getElementById('popupWrapper');
  const pauseOverlay = document.getElementById('pauseOverlay');
  const quoteDisplay = document.getElementById('quoteDisplay');
  const quoteText = document.getElementById('quoteText');
  const eatSound = document.getElementById('eatSound');
  const gameOverSound = document.getElementById('gameOverSound');
  const gameSection = document.querySelector('.game-section');

  const gridSize = 25;
  const tileCountX = Math.floor(canvas.width / gridSize);
  const tileCountY = Math.floor(canvas.height / gridSize);

  let snake, dx, dy, food, score, highScore, gameRunning, speed, gameLoop, paused, mode;
  let directionChanged = false;
  let quoteTimer;
  const pauseButton = document.getElementById('snake-pause');
  const readScore = () => { try { return Math.max(0, parseInt(localStorage.getItem("snakeHighScore"), 10) || 0); } catch { return 0; } };

  // Motivational quotes for eating food
  const quotes = [
  "🔥 Unstoppable! …until the build fails.",
  "⚡ Power surge! Just ran 100 unit tests in 0.0001s (they all failed).",
  "💎 Flawless execution! Except for that one semicolon I missed.",
  "🚀 Next level! Pushed to production on a Friday.",
  "⭐ Legendary move! Found a bug before the client did.",
  "🎯 Perfect aim! Clicked “Run” instead of “Debug”... again.",
  "💥 Dominating! My backlog of unresolved tickets.",
  "🏆 Elite performance! Deployed without crying (much).",
  "🌟 Outstanding! Logged in as admin on the first try.",
  "🔮 Magical! The bug disappeared when I showed it to someone.",
  "⚡ Lightning fast! Wrote 3 lines of code in 4 hours.",
  "🎭 Masterful! Pretended I understood that regex.",
  "🏅 Champion move! Fixed the bug by deleting the entire function.",
  "🎪 Spectacular! My code passes all tests—because I disabled them.",
  "🦾 Invincible! Until the tester logs a “UI not aligned” bug."
];

  function initGame() {
    clearTimeout(quoteTimer);
    snake = [{ x: Math.floor(tileCountX/2), y: Math.floor(tileCountY/2) }];
    dx = 1;
    dy = 0;
    food = randomFood();
    score = 0;
    scoreEl.textContent = score;
    highScore = readScore();
    highScoreEl.textContent = highScore;
    gameRunning = true;
    paused = false;
    pauseButton.setAttribute('aria-pressed', 'false');
    pauseButton.setAttribute('aria-label', 'Pause game');
    gameOverMsg.style.display = 'none';
    pauseOverlay.style.display = 'none';
    quoteDisplay.classList.remove('show');
  }

  function randomFood() {
    if (snake.length >= tileCountX * tileCountY) return null;
    let newFood;
    do {
      newFood = {
        x: Math.floor(Math.random() * tileCountX),
        y: Math.floor(Math.random() * tileCountY)
      };
    } while (snake.some(segment => segment.x === newFood.x && segment.y === newFood.y));
    return newFood;
  }

  function drawGrid() {
    ctx.strokeStyle = 'rgba(0, 255, 127, 0.1)';
    ctx.lineWidth = 1;

    // Vertical lines
    for (let x = 0; x <= canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    // Horizontal lines
    for (let y = 0; y <= canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
  }

  function createParticles(x, y) {
    const colors = ['#00ff7f', '#ffd700', '#ff69b4', '#00bfff'];
    for (let i = 0; i < 8; i++) {
      const particle = document.createElement('div');
      particle.className = 'particle';
      particle.style.left = ((x * gridSize + gridSize/2) / canvas.width * 100) + '%';
      particle.style.top = ((y * gridSize + gridSize/2) / canvas.height * 100) + '%';
      particle.style.width = '6px';
      particle.style.height = '6px';
      particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      particle.style.transform = `translate(${(Math.random() - 0.5) * 60}px, ${(Math.random() - 0.5) * 60}px)`;

      document.querySelector('.canvas-container').appendChild(particle);

      setTimeout(() => {
        particle.remove();
      }, 1000);
    }
  }

  function showQuote() {
    clearTimeout(quoteTimer);
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    quoteText.textContent = randomQuote;
    quoteDisplay.classList.add('show');

    quoteTimer = setTimeout(() => {
      quoteDisplay.classList.remove('show');
    }, 1500);
  }

  function draw() {
    if (!gameRunning || paused) return;

    // Clear canvas with gradient background
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, 'rgba(10, 10, 10, 0.95)');
    gradient.addColorStop(0.5, 'rgba(15, 15, 15, 0.95)');
    gradient.addColorStop(1, 'rgba(10, 10, 10, 0.95)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    drawGrid();

    // Move snake
    directionChanged = false;
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };

    // Handle boxless mode (wrap around)
    if (mode === 'boxless') {
      if (head.x < 0) head.x = tileCountX - 1;
      if (head.x >= tileCountX) head.x = 0;
      if (head.y < 0) head.y = tileCountY - 1;
      if (head.y >= tileCountY) head.y = 0;
    }

    snake.unshift(head);

    // Check food collision
    if (head.x === food.x && head.y === food.y) {
      food = randomFood();
      if (!food) {
        gameRunning = false;
        scoreEl.textContent = ++score;
        highScore = Math.max(highScore, score);
        highScoreEl.textContent = highScore;
        try { localStorage.setItem("snakeHighScore", highScore); } catch {}
        gameOverMsg.style.display = "block";
        return;
      }
      score++;
      scoreEl.textContent = score;

      // Play eat sound
      eatSound.currentTime = 0;
      eatSound.play().catch(() => {});

      // Show quote and particles
      showQuote();
      createParticles(head.x, head.y);

      // Update high score
      if (score > highScore) {
        highScore = score;
        try { localStorage.setItem("snakeHighScore", score); } catch { /* Keep playing without persistence. */ }
        highScoreEl.textContent = highScore;
      }
    } else {
      snake.pop();
    }

    // Check collisions
    if ((mode === 'boxed' && (head.x < 0 || head.x >= tileCountX || head.y < 0 || head.y >= tileCountY)) ||
        snake.slice(1).some(seg => seg.x === head.x && seg.y === head.y)) {
      gameRunning = false;
      gameOverSound.play().catch(() => {});
      gameOverMsg.style.display = 'block';
      return;
    }

    // Draw food with glow effect
    const foodX = food.x * gridSize;
    const foodY = food.y * gridSize;

    // Glow effect
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 15;

    const foodGradient = ctx.createRadialGradient(
      foodX + gridSize/2, foodY + gridSize/2, 0,
      foodX + gridSize/2, foodY + gridSize/2, gridSize/2
    );
    foodGradient.addColorStop(0, '#ffd700');
    foodGradient.addColorStop(0.7, '#ff8c00');
    foodGradient.addColorStop(1, '#ff4500');

    ctx.fillStyle = foodGradient;
    ctx.fillRect(foodX + 2, foodY + 2, gridSize - 4, gridSize - 4);

    // Reset shadow
    ctx.shadowBlur = 0;

    // Draw snake with enhanced graphics
    for (let i = 0; i < snake.length; i++) {
      const segment = snake[i];
      const segmentX = segment.x * gridSize;
      const segmentY = segment.y * gridSize;

      if (i === 0) {
        // Head with glow effect
        ctx.shadowColor = '#00ff7f';
        ctx.shadowBlur = 20;

        const headGradient = ctx.createRadialGradient(
          segmentX + gridSize/2, segmentY + gridSize/2, 0,
          segmentX + gridSize/2, segmentY + gridSize/2, gridSize/2
        );
        headGradient.addColorStop(0, '#00ff7f');
        headGradient.addColorStop(0.7, '#00cc66');
        headGradient.addColorStop(1, '#008844');

        ctx.fillStyle = headGradient;
        ctx.fillRect(segmentX + 1, segmentY + 1, gridSize - 2, gridSize - 2);

        // Eyes
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(segmentX + 6, segmentY + 6, 4, 4);
        ctx.fillRect(segmentX + 15, segmentY + 6, 4, 4);
        ctx.fillStyle = '#000000';
        ctx.fillRect(segmentX + 7, segmentY + 7, 2, 2);
        ctx.fillRect(segmentX + 16, segmentY + 7, 2, 2);
      } else {
        // Body segments with gradient
        ctx.shadowColor = '#00cc66';
        ctx.shadowBlur = 10;

        const bodyGradient = ctx.createLinearGradient(
          segmentX, segmentY, segmentX + gridSize, segmentY + gridSize
        );
        bodyGradient.addColorStop(0, '#00cc66');
        bodyGradient.addColorStop(0.5, '#00aa55');
        bodyGradient.addColorStop(1, '#008844');

        ctx.fillStyle = bodyGradient;
        ctx.fillRect(segmentX + 2, segmentY + 2, gridSize - 4, gridSize - 4);
      }
    }

    // Reset shadow
    ctx.shadowBlur = 0;

    gameLoop = setTimeout(draw, speed);
  }

  function startGame() {
    clearTimeout(gameLoop);
    gameRunning = false;
    speed = parseInt(document.getElementById('difficulty').value);
    mode = document.getElementById('mode').value;
    popupWrapper.style.display = 'flex';
    popupWrapper.querySelector('button').focus({ preventScroll: true });
  }

  function closePopup() {
    clearTimeout(gameLoop);
    directionChanged = false;
    popupWrapper.style.display = 'none';
    initGame();
    draw();
    gameSection.focus({ preventScroll: true });
  }
  function setDirection(newDx, newDy) {
    if (!gameRunning || paused) return;
    if (!directionChanged && !(dx === -newDx && dy === -newDy)) {
      directionChanged = true;
      dx = newDx;
      dy = newDy;
    }
  }

  function togglePause(forcePause = false) {
    if (!gameRunning || (forcePause && paused)) return;
    clearTimeout(gameLoop);
    paused = forcePause || !paused;
    pauseOverlay.style.display = paused ? 'block' : 'none';
    pauseButton.setAttribute('aria-pressed', String(paused));
    pauseButton.setAttribute('aria-label', paused ? 'Resume game' : 'Pause game');
    if (!paused) draw();
  }
  pauseButton.addEventListener('click', () => togglePause());
  document.querySelectorAll('[data-snake-start]').forEach(button => button.addEventListener('click', startGame));
  document.querySelectorAll('[data-snake-begin]').forEach(button => button.addEventListener('click', closePopup));
  const directions = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
  document.querySelectorAll('[data-direction]').forEach(button => {
    button.addEventListener('click', () => setDirection(...directions[button.dataset.direction]));
  });
  window.addEventListener('blur', () => togglePause(true));
  document.addEventListener('visibilitychange', () => { if (document.hidden) togglePause(true); });
  gameSection.addEventListener('focusout', event => {
    if (!gameSection.contains(event.relatedTarget)) togglePause(true);
  });
  // Draw a static board on load; games only run after a deliberate start.
  highScoreEl.textContent = readScore();
  drawGrid();

  // Event listeners
  gameSection.addEventListener('keydown', (e) => {
    if (!gameRunning || /INPUT|SELECT|TEXTAREA|BUTTON/.test(e.target.tagName)) return;

    let handled = false;

    switch (e.key.toLowerCase()) {
      case 'arrowup':
      case 'w':
        setDirection(0, -1);
        handled = true;
        break;
      case 'arrowdown':
      case 's':
        setDirection(0, 1);
        handled = true;
        break;
      case 'arrowleft':
      case 'a':
        setDirection(-1, 0);
        handled = true;
        break;
      case 'arrowright':
      case 'd':
        setDirection(1, 0);
        handled = true;
        break;
      case 'escape':
        if (e.repeat) break;
        togglePause();
        handled = true;
        break;
    }

    if (handled) {
      e.preventDefault();
    }
  });

})();
