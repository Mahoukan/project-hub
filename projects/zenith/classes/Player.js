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
    this.shieldRegenDelay = 10000;
    this.shieldRegenTimer = 0;
    this.shieldOnCooldown = false;
  }

  display() {
    fill(255);
    noStroke();
    ellipse(this.position.x, this.position.y, this.size);
  }
}