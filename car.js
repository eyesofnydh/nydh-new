 const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const keys = {};

    const carImage = new Image();
    carImage.src = 'images/car.png'; // make sure this file exists in the same directory

    const engineSound = document.getElementById("engineSound");
    const hornSound = document.getElementById("hornSound");

    function random(min, max) {
      return Math.random() * (max - min) + min;
    }

    class Car {
      constructor() {
        this.x = canvas.width / 2;
        this.y = canvas.height / 2;
        this.width = 120;
        this.height = 120;
        this.angle = 0;
        this.speed = 0;
        this.maxSpeed = 6;
        this.friction = 0.03;
        this.driftFactor = 0.95;
        this.acceleration = 0.25;
        this.rotationSpeed = 0.07;
        this.flame = { r: [], y: [] };
      }

      update() {
        const isAccelerating = keys["w"] || keys["ArrowUp"];

        if (isAccelerating) {
          this.speed += this.acceleration;
          if (engineSound.paused) engineSound.play();
        } else {
          this.speed *= 1 - this.friction;
          engineSound.pause();
        }

        if (keys["s"] || keys["ArrowDown"]) {
          this.speed -= this.acceleration * 0.5;
        }

        if (keys["a"] || keys["ArrowLeft"]) {
          this.angle -= this.rotationSpeed * (this.speed / this.maxSpeed);
        }
        if (keys["d"] || keys["ArrowRight"]) {
          this.angle += this.rotationSpeed * (this.speed / this.maxSpeed);
        }

        if (keys["Shift"]) {
          this.speed *= this.driftFactor;
        }

        this.speed = Math.max(Math.min(this.speed, this.maxSpeed), -this.maxSpeed / 2);

        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;

        // Screen looping like snake game
        if (this.x < 0) this.x = canvas.width;
        if (this.x > canvas.width) this.x = 0;
        if (this.y < 0) this.y = canvas.height;
        if (this.y > canvas.height) this.y = 0;
      }

      createFlames() {
        const halfPlayerHeight = this.width / 5.5;
        const halfR = 8, rWidth = 16, rIncrease = 4;
        const halfY = 4, yWidth = 8, yIncrease = 2;
        this.flame.r = [[-1 * halfPlayerHeight, -1 * halfR]];
        this.flame.y = [[-1 * halfPlayerHeight, -1 * halfY]];

        for (let x = 0; x < rWidth; x += rIncrease) {
          this.flame.r.push([-random(2, 7) - halfPlayerHeight, x - halfR]);
        }
        this.flame.r.push([-1 * halfPlayerHeight, halfR]);

        for (let x = 0; x < yWidth; x += yIncrease) {
          this.flame.y.push([-random(2, 7) - halfPlayerHeight, x - halfY]);
        }
        this.flame.y.push([-1 * halfPlayerHeight, halfY]);
      }

      drawFlames() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        this.createFlames();

        ctx.fillStyle = 'red';
        ctx.beginPath();
        this.flame.r.forEach(([x, y], i) => {
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = 'yellow';
        ctx.beginPath();
        this.flame.y.forEach(([x, y], i) => {
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.closePath();
        ctx.fill();

        ctx.restore();
      }

      drawCarImage() {
        ctx.drawImage(carImage, -this.width / 2, -this.height / 2, this.width, this.height);
      }

      draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        if (carImage.complete) {
          this.drawCarImage();
        }

        ctx.restore();

        if ((keys['w'] || keys['ArrowUp']) && this.speed > 1) {
          this.drawFlames();
        }
      }
    }

    const car = new Car();

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      car.update();
      car.draw();
      requestAnimationFrame(animate);
    }

    animate();

    window.addEventListener('keydown', e => {
      keys[e.key] = true;
      if (e.key === ' ') {
        hornSound.currentTime = 0;
        hornSound.play();
      }
    });

    window.addEventListener('keyup', e => keys[e.key] = false);