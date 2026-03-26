class Enemy {
  constructor(start, type) {
    this.pos = start.copy();
    this.type = type;
    this.spawnTime = millis();
    this.hitFlash = 0;

    switch (type) {
      case "sprinter":
        this.speed = 3.9;
        this.health = 1;
        this.contactDamage = 1;
        this.size = 30;
        this.animSpeed = 0.35;
        break;

      case "tank":
        this.speed = 0.75;
        this.health = 6;
        this.contactDamage = 2;
        this.size = 54;
        this.animSpeed = 0.18;
        break;

      case "splitter":
        this.speed = 1.25;
        this.health = 3;
        this.contactDamage = 1;
        this.size = 40;
        this.animSpeed = 0.22;
        break;

      default:
        this.speed = 2.2;
        this.health = 2;
        this.contactDamage = 1;
        this.size = 36;
        this.animSpeed = 0.25;
        break;
    }

    this.startingHealth = this.health;
    this.xpValue = this.startingHealth;
    this.lastShotTime = millis();

    this.animFrame = random(this.getFrameSet().length || 1);
  }

  getFrameSet() {
    switch (this.type) {
      case "sprinter":
        return enemyFrames.sprinter;
      case "tank":
        return enemyFrames.tank;
      case "splitter":
        return enemyFrames.splitter;
      default:
        return enemyFrames.normal;
    }
  }

  update() {
    if (this.hitFlash > 0) {
      this.hitFlash--;
    }

    const frames = this.getFrameSet();
    if (frames.length > 0) {
      this.animFrame = (this.animFrame + this.animSpeed) % frames.length;
    }
  }

  move(target) {
    const dir = p5.Vector.sub(target, this.pos);
    if (dir.mag() > 1) {
      dir.setMag(this.speed);
      this.pos.add(dir);
    }
  }

  display() {
    const frames = this.getFrameSet();
    const frame =
      frames.length > 0
        ? frames[Math.floor(this.animFrame) % frames.length]
        : null;

    const age = millis() - this.spawnTime;
    const appear = constrain(age / 180, 0, 1);
    const drawSize = this.size * lerp(0.45, 1, appear);

    push();
    imageMode(CENTER);

    if (this.hitFlash > 0) {
      tint(255, 180, 180);
    } else {
      noTint();
    }

    if (frame) {
      image(frame, this.pos.x, this.pos.y, drawSize, drawSize);
    } else {
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

      ellipse(this.pos.x, this.pos.y, drawSize);
    }

    pop();

    // spawn ripple
    if (appear < 1) {
      push();
      noFill();
      stroke(255, 120 * (1 - appear));
      strokeWeight(2);
      ellipse(this.pos.x, this.pos.y, this.size + (1 - appear) * 16);
      pop();
    }
  }

  isDead() {
    return this.health <= 0;
  }
}
