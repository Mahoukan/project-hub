class Bullet {
  constructor(start, target, enemyBullet = false) {
    this.pos = start.copy();
    this.enemyBullet = enemyBullet;

    const dir = p5.Vector.sub(target, start);
    this.vel = dir.setMag(enemyBullet ? 4.8 : 9);

    this.r = enemyBullet ? 10 : 8;
    this.damage = enemyBullet ? 1 : bulletDamage;

    this.animFrame = random(bulletFrames.length);
    this.animSpeed = 0.7;
    this.angle = this.vel.heading();
  }

  move() {
    this.pos.add(this.vel);

    if (bulletFrames.length > 0) {
      this.animFrame = (this.animFrame + this.animSpeed) % bulletFrames.length;
    }
  }

  display() {
    const frame =
      bulletFrames.length > 0
        ? bulletFrames[Math.floor(this.animFrame) % bulletFrames.length]
        : null;

    push();
    imageMode(CENTER);
    translate(this.pos.x, this.pos.y);

    if (this.enemyBullet) {
      tint(255, 120, 120);
    } else {
      noTint();
    }

    if (frame) {
      image(frame, 0, 0, this.r * 3, this.r * 3);
    } else {
      noStroke();
      fill(this.enemyBullet ? color(255, 100, 100) : color(255));
      ellipse(0, 0, this.r * 2);
    }

    pop();
  }

  hits(enemy) {
    return p5.Vector.dist(this.pos, enemy.pos) < this.r + enemy.size * 0.5;
  }

  offScreen() {
    return (
      this.pos.x < -50 ||
      this.pos.x > width + 50 ||
      this.pos.y < -50 ||
      this.pos.y > height + 50
    );
  }
}