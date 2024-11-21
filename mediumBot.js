export class MediumBot {
  constructor(player) {
    this.player = player;
    this.decisionInterval = 500;
    this.lastDecision = 0;
    this.lastSkillUse = 0;
    this.skillCooldown = 2000;
    this.jumpCooldown = 800;
    this.lastJump = 0;
    this.platformMemory = new Map(); // Remember recently visited platforms
    this.lastPosition = { x: player.x, y: player.y };
    this.stuckTimer = 0;
  }

  update(target, platforms) {
    const now = Date.now();
    if (now - this.lastDecision > this.decisionInterval) {
      this.makeDecision(target, platforms);
      this.lastDecision = now;

      // Update stuck detection
      const dx = Math.abs(this.player.x - this.lastPosition.x);
      const dy = Math.abs(this.player.y - this.lastPosition.y);
      if (dx < 5 && dy < 5) {
        this.stuckTimer += this.decisionInterval;
      } else {
        this.stuckTimer = 0;
      }

      this.lastPosition = { x: this.player.x, y: this.player.y };
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

    if (Math.random() < 0.85) {
      // 85% chance to make a decision
      if (this.player.isIt) {
        // Improved chase behavior
        this.handleChasing(dx, dy, distance, target);
      } else {
        // Improved escape behavior
        this.handleEscaping(dx, dy, distance, target, platforms);
      }
    }

    // Handle stuck situations
    if (this.stuckTimer > 1500) {
      this.handleStuckSituation(platforms);
    }

    // Smart jumping logic with cooldown
    if (now - this.lastJump > this.jumpCooldown) {
      if (this.shouldJump(platforms, target)) {
        this.player.controls.up = true;
        this.lastJump = now;
      }
    }

    // Strategic skill usage
    if (now - this.lastSkillUse > this.skillCooldown && Math.random() < 0.6) {
      if (this.player.skill === 'dash') {
        if (this.shouldUseDash(distance, target)) {
          this.player.controls.dash = true;
          this.lastSkillUse = now;
        }
      }
    }
  }

  handleChasing(dx, dy, distance, target) {
    // Predict target movement
    const predictedX = target.x + target.velocity.x * 3;
    const predictedY = target.y + target.velocity.y * 3;

    if (predictedX > this.player.x && Math.random() > 0.15) {
      this.player.controls.right = true;
    } else if (predictedX < this.player.x && Math.random() > 0.15) {
      this.player.controls.left = true;
    }
  }

  handleEscaping(dx, dy, distance, target, platforms) {
    if (distance < 200) {
      // Find escape direction
      const escapeLeft = dx > 0;
      const nearestPlatform = this.findNearestPlatform(platforms);

      if (nearestPlatform) {
        // Consider platform position for escape
        if (nearestPlatform.x < this.player.x) {
          this.player.controls.left = true;
        } else {
          this.player.controls.right = true;
        }
      } else {
        // Basic escape
        this.player.controls.left = escapeLeft;
        this.player.controls.right = !escapeLeft;
      }
    }
  }

  handleStuckSituation(platforms) {
    this.player.controls.up = true;
    this.player.controls.left = !this.player.controls.left;
    this.player.controls.right = !this.player.controls.right;
    this.stuckTimer = 0;
  }

  shouldJump(platforms, target) {
    const ahead = this.player.controls.right ? 100 : -100;
    const futureX = this.player.x + ahead;

    // Check for platforms ahead
    const shouldJumpPlatform = platforms.some((platform) => {
      return (
        platform.y < this.player.y + this.player.height * 1.5 &&
        platform.y > this.player.y &&
        futureX > platform.x &&
        futureX < platform.x + platform.width
      );
    });

    // Jump if target is above
    const targetAbove = target.y < this.player.y - 50;

    return shouldJumpPlatform || targetAbove;
  }

  shouldUseDash(distance, target) {
    if (this.player.isIt) {
      return distance < 200 && distance > 50;
    } else {
      return distance < 120;
    }
  }

  findNearestPlatform(platforms) {
    return platforms.reduce((nearest, platform) => {
      const distance = Math.sqrt(
        Math.pow(platform.x - this.player.x, 2) +
          Math.pow(platform.y - this.player.y, 2)
      );

      if (!nearest || distance < nearest.distance) {
        return { platform, distance };
      }
      return nearest;
    }, null)?.platform;
  }
}
