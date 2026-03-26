class Player {
  constructor(position, size, maxHealth, maxSpeed) {
    this.position = position.copy();
    this.size = size;
    this.halfSize = size / 2;

    this.maxHealth = maxHealth;
    this.health = maxHealth;
    this.maxSpeed = maxSpeed;

    this.xp = 0;
    this.level = 1;
    this.xpToNextLevel = 10;

    this.shieldMax = 0;
    this.shieldCurrent = 0;
    this.shieldRegenDelay = 7000;
    this.shieldRegenTimer = 0;
    this.shieldOnCooldown = false;

    this.contactDamage = 1;
    this.invulnerableUntil = 0;
    this.flashTimer = 0;

    this.animFrame = 0;
    this.animSpeed = 0.3;
  }

  updateDamageFlash() {
    if (this.flashTimer > 0) this.flashTimer--;
  }

  updateAnimation() {
    if (!playerFrames || playerFrames.length === 0) return;
    this.animFrame = (this.animFrame + this.animSpeed) % playerFrames.length;
  }

  display() {
    this.updateAnimation();

    const frameIndex = Math.floor(this.animFrame) % playerFrames.length;
    const frame = playerFrames[frameIndex];

    push();
    imageMode(CENTER);

    if (millis() < this.invulnerableUntil && frameCount % 6 < 3) {
      tint(255, 120, 120);
    } else if (this.flashTimer > 0) {
      tint(255, 180, 180);
    } else {
      noTint();
    }

    if (frame) {
      image(frame, this.position.x, this.position.y, this.size, this.size);
    } else {
      noStroke();
      fill(255);
      ellipse(this.position.x, this.position.y, this.size);
    }

    pop();
  }
}