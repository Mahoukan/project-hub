class Enemy {
  constructor(start, type) {
    this.pos = start.copy();
    this.type = type;

    switch (type) {
      case "sprinter":
        this.speed = 7;
        this.health = 1;
        break;
      case "tank":
        this.speed = 0.5;
        this.health = 5;
        break;
      case "splitter":
        this.speed = 0.2;
        this.health = 3;
        break;
      default:
        this.speed = 2;
        this.health = 2;
        break;
    }

    this.startingHealth = this.health;
    this.lastShotTime = millis();
  }

  move(target) {
    const dir = p5.Vector.sub(target, this.pos);
    if (dir.mag() > 1) {
      dir.setMag(this.speed);
      this.pos.add(dir);
    }
  }

  display() {
    noStroke();

    switch (this.type) {
      case "sprinter":
        fill(255, 0, 0);
        break;
      case "tank":
        fill(0, 0, 255);
        break;
      case "splitter":
        fill(255, 255, 0);
        break;
      default:
        fill(0, 255, 255);
    }

    ellipse(this.pos.x, this.pos.y, 30);
  }

  isDead() {
    return this.health <= 0;
  }
}