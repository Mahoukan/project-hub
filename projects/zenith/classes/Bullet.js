class Bullet {
  constructor(start, target) {
    this.pos = start.copy();
    this.vel = p5.Vector.sub(target, start).normalize().mult(10);
    this.r = 5;
  }

  move() {
    this.pos.add(this.vel);
  }

  display() {
    fill(255, 150, 0);
    noStroke();
    ellipse(this.pos.x, this.pos.y, this.r * 2);
  }

  hits(enemy) {
    return p5.Vector.dist(this.pos, enemy.pos) < this.r + 15;
  }

  offScreen() {
    return (
      this.pos.x < 0 ||
      this.pos.x > width ||
      this.pos.y < 0 ||
      this.pos.y > height
    );
  }
}