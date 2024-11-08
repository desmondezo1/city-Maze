let particles = [];

new p5(function(p) {
  p.setup = function() {
    let canvas = p.createCanvas(p.windowWidth, p.windowHeight);
    canvas.parent('p5-canvas');
  };

  p.draw = function() {
    p.clear();
    for (let i = particles.length - 1; i >= 0; i--) {
      particles[i].update();
      particles[i].display(p);
      if (particles[i].isDead()) {
        particles.splice(i, 1);
      }
    }
  };

  p.windowResized = function() {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
  };
});

class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.vx = p5.Vector.random2D().mult(2);
    this.vy = p5.Vector.random2D().mult(2);
    this.alpha = 255;
    this.size = 10;
  }

  update() {
    this.x += this.vx.x;
    this.y += this.vy.y;
    this.alpha -= 5;
    this.size -= 0.1;
  }

  display(p) {
    p.noStroke();
    p.fill(this.color[0], this.color[1], this.color[2], this.alpha);
    p.ellipse(this.x, this.y, this.size);
  }

  isDead() {
    return this.alpha <= 0 || this.size <= 0;
  }
}

function createParticles(x, y, color, count = 20) {
  for (let i = 0; i < count; i++) {
    particles.push(new Particle(x, y, color));
  }
}