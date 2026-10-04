(function() {
            const canvas = document.getElementById('myrGameCanvas');
            const ctx = canvas.getContext('2d');
            const scoreEl = document.getElementById('myr-score');
            const gameOverEl = document.getElementById('myr-gameOver');
            const gameSection = document.getElementById('myr-dino-game');

            // Game state
            let gameRunning = false;
            let gameSpeed = 6;
            let score = 0;
            let highScore = 0;
            try {
                const storedScore = Number(localStorage.getItem('dinoHighScore'));
                highScore = Number.isFinite(storedScore) ? Math.max(0, Math.floor(storedScore)) : 0;
            } catch {}
            let frameId;
            let lastFrame = 0;
            let frameCount = 0;

            // Dino properties
            const dino = {
                x: 50,
                y: 150,
                width: 40,
                height: 40,
                dy: 0,
                jumpPower: 15,
                grounded: true,
                ducking: false
            };

            // Obstacles array
            let obstacles = [];
            let clouds = [];
            let ground = [];

            // Input handling
            let keys = {};
            let touchStartY = 0;
            let isDucking = false;

            // Initialize ground
            for (let i = 0; i < Math.ceil(canvas.width / 20) + 1; i++) {
                ground.push({
                    x: i * 20,
                    y: 180,
                    width: 20,
                    height: 20
                });
            }

            // Initialize clouds
            for (let i = 0; i < 3; i++) {
                clouds.push({
                    x: Math.random() * canvas.width,
                    y: 50 + Math.random() * 50,
                    width: 30,
                    height: 20
                });
            }

            function updateScore() {
                frameCount++;
                if (frameCount % 8 === 0) { // Update score every 8 frames (slower)
                    score++;
                    if (score > highScore) {
                        highScore = score;
                    }
                    scoreEl.textContent = `HI ${highScore.toString().padStart(5, '0')} ${score.toString().padStart(5, '0')}`;
                }
            }

            function drawDino() {
                ctx.fillStyle = '#4ade80'; // Green dinosaur body

                if (dino.ducking) {
                    // Ducking dino - horizontal body
                    ctx.fillRect(dino.x, dino.y + 25, dino.width + 10, 15); // main body

                    // Head
                    ctx.fillRect(dino.x + 35, dino.y + 15, 20, 20);
                    ctx.fillRect(dino.x + 45, dino.y + 10, 12, 10); // snout

                    // Ducking legs
                    ctx.fillRect(dino.x + 8, dino.y + 35, 6, 8);
                    ctx.fillRect(dino.x + 20, dino.y + 35, 6, 8);

                    // Tail while ducking
                    ctx.fillRect(dino.x - 8, dino.y + 28, 15, 8);

                    // Eye
                    ctx.fillStyle = '#000';
                    ctx.fillRect(dino.x + 48, dino.y + 18, 3, 3);

                    // Nostril
                    ctx.fillRect(dino.x + 52, dino.y + 15, 2, 2);

                } else {
                    // Standing/jumping dino
                    // Main body
                    ctx.fillRect(dino.x + 10, dino.y + 10, 20, 25);

                    // Head
                    ctx.fillRect(dino.x + 25, dino.y - 5, 18, 18);
                    ctx.fillRect(dino.x + 35, dino.y - 2, 10, 8); // snout

                    // Neck
                    ctx.fillRect(dino.x + 22, dino.y + 5, 8, 10);

                    // Tail
                    ctx.fillRect(dino.x - 2, dino.y + 15, 15, 8);
                    ctx.fillRect(dino.x - 8, dino.y + 18, 10, 5);

                    // Animated legs
                    const legOffset = Math.floor(frameCount / 15) % 2 === 0 ? 0 : 3;
                    const legOffset2 = Math.floor(frameCount / 15) % 2 === 0 ? 3 : 0;

                    // Back leg
                    ctx.fillRect(dino.x + 12, dino.y + 35, 6, 12 + legOffset);
                    ctx.fillRect(dino.x + 10, dino.y + 45 + legOffset, 10, 4); // back foot

                    // Front leg
                    ctx.fillRect(dino.x + 22, dino.y + 35, 6, 12 + legOffset2);
                    ctx.fillRect(dino.x + 20, dino.y + 45 + legOffset2, 10, 4); // front foot

                    // Arms (small)
                    ctx.fillRect(dino.x + 30, dino.y + 12, 3, 8);
                    ctx.fillRect(dino.x + 30, dino.y + 18, 6, 3);

                    // Eye
                    ctx.fillStyle = '#000';
                    ctx.fillRect(dino.x + 38, dino.y + 2, 4, 4);

                    // Nostril
                    ctx.fillRect(dino.x + 42, dino.y + 2, 2, 2);

                    // Belly detail
                    ctx.fillStyle = '#86efac';
                    ctx.fillRect(dino.x + 12, dino.y + 15, 16, 15);

                    // Back spikes
                    ctx.fillStyle = '#22c55e';
                    ctx.fillRect(dino.x + 15, dino.y + 8, 3, 6);
                    ctx.fillRect(dino.x + 20, dino.y + 6, 3, 6);
                    ctx.fillRect(dino.x + 25, dino.y + 8, 3, 6);
                }

                // Add some texture spots
                ctx.fillStyle = '#22c55e';
                if (!dino.ducking) {
                    ctx.fillRect(dino.x + 15, dino.y + 20, 2, 2);
                    ctx.fillRect(dino.x + 20, dino.y + 25, 2, 2);
                    ctx.fillRect(dino.x + 28, dino.y + 0, 2, 2);
                }
            }

            function drawObstacles() {
                obstacles.forEach(obstacle => {
                    if (obstacle.type === 'cactus') {
                        // More detailed cactus
                        ctx.fillStyle = '#22c55e'; // Green cactus

                        // Main trunk
                        ctx.fillRect(obstacle.x + 5, obstacle.y, obstacle.width - 10, obstacle.height);

                        // Left arm
                        ctx.fillRect(obstacle.x, obstacle.y + 15, 12, 8);
                        ctx.fillRect(obstacle.x + 2, obstacle.y + 8, 8, 15);

                        // Right arm
                        ctx.fillRect(obstacle.x + obstacle.width - 8, obstacle.y + 20, 12, 8);
                        ctx.fillRect(obstacle.x + obstacle.width - 6, obstacle.y + 12, 8, 16);

                        // Cactus spines
                        ctx.fillStyle = '#15803d';
                        for(let i = 0; i < 5; i++) {
                            ctx.fillRect(obstacle.x + 8, obstacle.y + 5 + (i * 8), 1, 3);
                            ctx.fillRect(obstacle.x + 12, obstacle.y + 8 + (i * 8), 1, 3);
                        }

                        // Flower on top
                        ctx.fillStyle = '#f97316';
                        ctx.fillRect(obstacle.x + 7, obstacle.y - 3, 6, 4);

                    } else if (obstacle.type === 'bird') {
                        // More detailed pterodactyl
                        ctx.fillStyle = '#94a3b8'; // Gray pterodactyl

                        // Body
                        ctx.fillRect(obstacle.x + 10, obstacle.y + 8, 12, 8);

                        // Head/beak
                        ctx.fillRect(obstacle.x + 18, obstacle.y + 6, 8, 6);
                        ctx.fillRect(obstacle.x + 22, obstacle.y + 8, 6, 2); // beak

                        // Wing animation
                        const wingFlap = Math.floor(frameCount / 12) % 2;
                        if (wingFlap === 0) {
                            // Wings up
                            ctx.fillRect(obstacle.x, obstacle.y + 2, 15, 4);
                            ctx.fillRect(obstacle.x + 15, obstacle.y, 10, 8);
                        } else {
                            // Wings down
                            ctx.fillRect(obstacle.x, obstacle.y + 12, 15, 4);
                            ctx.fillRect(obstacle.x + 15, obstacle.y + 8, 10, 8);
                        }

                        // Tail
                        ctx.fillRect(obstacle.x + 5, obstacle.y + 10, 8, 3);

                        // Eye
                        ctx.fillStyle = '#000';
                        ctx.fillRect(obstacle.x + 20, obstacle.y + 7, 2, 2);

                        // Wing membrane details
                        ctx.fillStyle = '#64748b';
                        if (wingFlap === 0) {
                            ctx.fillRect(obstacle.x + 2, obstacle.y + 3, 8, 2);
                        } else {
                            ctx.fillRect(obstacle.x + 2, obstacle.y + 13, 8, 2);
                        }
                    }
                });
            }

            function drawClouds() {
                ctx.fillStyle = '#6b7280'; // More realistic cloud color
                clouds.forEach(cloud => {
                    // More puffy, realistic clouds
                    ctx.fillRect(cloud.x + 5, cloud.y + 5, cloud.width - 10, cloud.height - 6);
                    ctx.fillRect(cloud.x, cloud.y + 8, cloud.width, cloud.height - 8);
                    ctx.fillRect(cloud.x + 8, cloud.y, cloud.width - 16, cloud.height - 5);
                    ctx.fillRect(cloud.x + 12, cloud.y + 2, cloud.width - 20, cloud.height - 8);

                    // Cloud highlights
                    ctx.fillStyle = '#9ca3af';
                    ctx.fillRect(cloud.x + 8, cloud.y + 3, cloud.width - 20, 3);
                    ctx.fillRect(cloud.x + 3, cloud.y + 9, cloud.width - 12, 2);

                    ctx.fillStyle = '#6b7280'; // Reset color for next cloud
                });
            }

            function drawGround() {
                // More detailed ground
                ctx.fillStyle = '#8b5cf6'; // Purple ground base
                ctx.fillRect(0, 180, canvas.width, 20);

                // Ground texture and rocks
                ctx.fillStyle = '#7c3aed';
                ground.forEach((g, index) => {
                    // Alternating ground pattern
                    if (index % 3 === 0) {
                        ctx.fillRect(g.x, g.y + 2, 3, 2);
                    } else if (index % 5 === 0) {
                        ctx.fillRect(g.x + 5, g.y + 1, 2, 3);
                    }

                    // Small rocks scattered
                    if (index % 7 === 0) {
                        ctx.fillStyle = '#6366f1';
                        ctx.fillRect(g.x + 2, g.y - 2, 4, 3);
                        ctx.fillRect(g.x + 8, g.y - 1, 3, 2);
                        ctx.fillStyle = '#7c3aed';
                    }
                });

                // Ground line detail
                ctx.fillStyle = '#6d28d9';
                ctx.fillRect(0, 179, canvas.width, 1);
            }

            function updateDino() {
                if (keys['Space'] || keys['ArrowUp']) {
                    if (dino.grounded) {
                        dino.dy = -dino.jumpPower;
                        dino.grounded = false;
                    }
                }

                dino.ducking = keys['ArrowDown'] || isDucking;

                if (!dino.grounded) {
                    dino.dy += 0.8; // gravity
                    dino.y += dino.dy;
                }

                if (dino.y >= 150) {
                    dino.y = 150;
                    dino.grounded = true;
                    dino.dy = 0;
                }
            }

            function updateObstacles() {
                // Move obstacles
                obstacles.forEach(obstacle => {
                    obstacle.x -= gameSpeed;
                });

                // Remove off-screen obstacles
                obstacles = obstacles.filter(obstacle => obstacle.x > -obstacle.width);

                // Add new obstacles
                if (obstacles.length === 0 || obstacles[obstacles.length - 1].x < canvas.width - 200 - Math.random() * 200) {
                    const types = ['cactus', 'bird'];
                    const type = types[Math.floor(Math.random() * types.length)];

                    obstacles.push({
                        x: canvas.width,
                        y: type === 'bird' ? 100 + Math.random() * 50 : 140,
                        width: type === 'bird' ? 30 : 20,
                        height: type === 'bird' ? 20 : 50,
                        type: type
                    });
                }
            }

            function updateClouds() {
                clouds.forEach(cloud => {
                    cloud.x -= gameSpeed * 0.3;
                    if (cloud.x < -cloud.width) {
                        cloud.x = canvas.width;
                        cloud.y = 50 + Math.random() * 50;
                    }
                });
            }

            function updateGround() {
                ground.forEach(g => {
                    g.x -= gameSpeed;
                    if (g.x < -g.width) {
                        g.x = canvas.width;
                    }
                });
            }

            function checkCollisions() {
                const dinoRect = {
                    x: dino.x + 5,
                    y: dino.ducking ? dino.y + 20 : dino.y,
                    width: dino.width - 10,
                    height: dino.ducking ? dino.height - 20 : dino.height
                };

                return obstacles.some(obstacle => {
                    return dinoRect.x < obstacle.x + obstacle.width - 5 &&
                           dinoRect.x + dinoRect.width > obstacle.x + 5 &&
                           dinoRect.y < obstacle.y + obstacle.height - 5 &&
                           dinoRect.y + dinoRect.height > obstacle.y + 5;
                });
            }

            function gameLoop(time = 0) {
                if (!gameRunning) return;
                // Keep physics consistent on 60/120/144 Hz screens.
                if (time && time - lastFrame < 1000 / 60 - 1) {
                    frameId = requestAnimationFrame(gameLoop);
                    return;
                }
                lastFrame = time;

                ctx.clearRect(0, 0, canvas.width, canvas.height);

                updateDino();
                updateObstacles();
                updateClouds();
                updateGround();

                drawClouds();
                drawGround();
                drawDino();
                drawObstacles();

                if (checkCollisions()) {
                    gameOver();
                    return;
                }

                // Update score continuously
                updateScore();

                // Increase speed every 150 points (slower progression)
                if (frameCount % 8 === 0 && score % 150 === 0 && score > 0) {
                    gameSpeed += 0.03; // Smaller speed increases
                }

                frameId = requestAnimationFrame(gameLoop);
            }

            function gameOver() {
                gameRunning = false;
                cancelAnimationFrame(frameId);
                try { localStorage.setItem('dinoHighScore', highScore); } catch {}
                gameOverEl.style.display = 'block';
            }

            function startGame() {
                if (gameRunning) return;
                lastFrame = 0;
                gameRunning = true;
                gameSpeed = 4; // Reduced starting speed
                score = 0;
                frameCount = 0;
                obstacles = [];
                dino.y = 150;
                dino.dy = 0;
                dino.grounded = true;
                dino.ducking = false;
                gameOverEl.style.display = 'none';
                scoreEl.textContent = `HI ${highScore.toString().padStart(5, '0')} ${score.toString().padStart(5, '0')}`;
                gameLoop();
            }

            function restartGame() {
                startGame();
            }

            // FOCUSED EVENT LISTENERS - Only work when game section is focused
            gameSection.addEventListener('keydown', (e) => {
                if (!['Space', 'ArrowUp', 'ArrowDown'].includes(e.code) || /BUTTON|INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) return;
                keys[e.code] = true;
                if ((e.code === 'Space' || e.code === 'ArrowUp') && !gameRunning) {
                    startGame();
                }
                e.preventDefault();
            });

            gameSection.addEventListener('keyup', (e) => {
                keys[e.code] = false;
            });

            // Auto-focus when clicking on the game area
            gameSection.addEventListener('click', () => {
                gameSection.focus({ preventScroll: true });
            });

            // Touch events for mobile - Enhanced responsiveness
            canvas.addEventListener('touchstart', (e) => {
                e.preventDefault();
                touchStartY = e.touches[0].clientY;
                gameSection.focus({ preventScroll: true });
                if (!gameRunning) {
                    startGame();
                } else {
                    keys['Space'] = true;
                }
            });

            canvas.addEventListener('touchend', (e) => {
                e.preventDefault();
                keys['Space'] = false;
                isDucking = false;
            });

            canvas.addEventListener('touchmove', (e) => {
                e.preventDefault();
                const touchY = e.touches[0].clientY;
                const touchDiff = touchY - touchStartY;
                if (touchDiff > 30) { // Increased sensitivity threshold
                    isDucking = true;
                    keys['Space'] = false;
                } else if (touchDiff < -30) {
                    isDucking = false;
                    keys['Space'] = true;
                }
            });

            // Handle game over screen touches
            gameOverEl.addEventListener('click', () => {
                gameSection.focus({ preventScroll: true });
                restartGame();
            });
            gameOverEl.addEventListener('touchstart', (e) => {
                e.preventDefault();
                gameSection.focus({ preventScroll: true });
                restartGame();
            });

            // Initialize
            scoreEl.textContent = `HI ${highScore.toString().padStart(5, '0')} ${score.toString().padStart(5, '0')}`;

            gameSection.addEventListener('blur', () => {
                Object.keys(keys).forEach(key => keys[key] = false);
                isDucking = false;
            });
            canvas.addEventListener('touchcancel', () => {
                keys['Space'] = false;
                isDucking = false;
            });
            document.addEventListener('visibilitychange', () => {
                if (document.hidden && gameRunning) gameOver();
            });

            // Draw initial state
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            drawClouds();
            drawGround();
            drawDino();
        })();
