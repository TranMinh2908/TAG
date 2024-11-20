export class EasyBot {
  constructor(player) {
    this.player = player;
    this.decisionInterval = 800; // Giữ nguyên để bot dễ
    this.lastDecision = 0;
    this.lastSkillUse = 0;
    this.skillCooldown = 2000;
    this.jumpCooldown = 1000;
    this.lastJump = 0;
    this.randomMovementTimer = 0;
    this.randomMovementDuration = 1500;
  }

  update(target, platforms) {
    const now = Date.now();
    if (now - this.lastDecision > this.decisionInterval) {
      this.makeDecision(target, platforms);
      this.lastDecision = now;
    }

    // Random movement changes
    if (now - this.randomMovementTimer > this.randomMovementDuration) {
      this.randomMovementTimer = now;
      this.randomMovementDuration = 1000 + Math.random() * 1000;
    }
  }

  makeDecision(target, platforms) {
    const dx = target.x - this.player.x;
    const dy = target.y - this.player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const now = Date.now();

    // Reset controls
    this.player.controls.left = false;
    this.player.controls.right = false;
    this.player.controls.up = false;
    this.player.controls.dash = false;

    // Add some randomness to make it more human-like
    if (Math.random() < 0.7) {
      // 70% chance to make a decision
      if (this.player.isIt) {
        // Chase behavior with some mistakes
        if (dx > 0 && Math.random() > 0.2) {
          this.player.controls.right = true;
        } else if (dx < 0 && Math.random() > 0.2) {
          this.player.controls.left = true;
        }
      } else {
        // Escape behavior with some mistakes
        if (distance < 200) {
          if (dx > 0 && Math.random() > 0.2) {
            this.player.controls.left = true;
          } else if (dx < 0 && Math.random() > 0.2) {
            this.player.controls.right = true;
          }
        } else {
          // Random movement when far from target
          this.player.controls.left = Math.random() > 0.5;
          this.player.controls.right = !this.player.controls.left;
        }
      }
    }

    // Improved jumping logic with cooldown
    if (now - this.lastJump > this.jumpCooldown) {
      if ((dy < -50 && Math.random() > 0.3) || this.shouldJump(platforms)) {
        this.player.controls.up = true;
        this.lastJump = now;
      }
    }

    // Occasional skill usage
    if (now - this.lastSkillUse > this.skillCooldown && Math.random() < 0.3) {
      if (this.player.skill === 'dash' && distance < 150) {
        this.player.controls.dash = true;
        this.lastSkillUse = now;
      }
    }
  }

  shouldJump(platforms) {
    // Simple platform detection
    const ahead = this.player.controls.right ? 50 : -50;
    const futureX = this.player.x + ahead;

    return platforms.some((platform) => {
      const onPlatform =
        platform.y < this.player.y + this.player.height * 1.2 &&
        platform.y > this.player.y &&
        futureX > platform.x &&
        futureX < platform.x + platform.width;
      return onPlatform && Math.random() > 0.3; // Add randomness to jumping decision
    });
  }
}
