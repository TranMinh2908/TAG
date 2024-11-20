export class MediumBot {
  constructor(player) {
    this.player = player;
    this.decisionInterval = 500;
    this.lastDecision = 0;
    this.lastSkillUse = 0;
    this.skillCooldown = 2000;
    this.jumpCooldown = 800;
    this.lastJump = 0;
    this.movementHistory = [];
    this.platformMemory = new Map();
    this.lastPosition = { x: player.x, y: player.y };
    this.stuckTimer = 0;
    this.strategy = this.selectStrategy();
    this.strategyTimer = 0;
  }

  update(target, platforms) {
    const now = Date.now();
    
    // Update movement history
    this.updateMovementHistory(target);

    // Update strategy periodically
    if (now - this.strategyTimer > 3000) {
      this.strategy = this.selectStrategy();
      this.strategyTimer = now;
    }

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

  updateMovementHistory(target) {
    this.movementHistory.push({
      x: target.x,
      y: target.y,
      vx: target.velocity.x,
      vy: target.velocity.y,
      timestamp: Date.now()
    });

    // Keep only recent history
    if (this.movementHistory.length > 20) {
      this.movementHistory.shift();
    }
  }

  selectStrategy() {
    const strategies = {
      aggressive: {
        chaseThreshold: 150,
        retreatThreshold: 100,
        jumpFrequency: 0.6,
        dashThreshold: 120
      },
      defensive: {
        chaseThreshold: 200,
        retreatThreshold: 150,
        jumpFrequency: 0.4,
        dashThreshold: 100
      },
      balanced: {
        chaseThreshold: 180,
        retreatThreshold: 120,
        jumpFrequency: 0.5,
        dashThreshold: 110
      }
    };

    // Select strategy based on game state
    if (this.player.isIt) {
      return Math.random() < 0.7 ? strategies.aggressive : strategies.balanced;
    } else {
      return Math.random() < 0.7 ? strategies.defensive : strategies.balanced;
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

    // Handle stuck situations
    if (this.stuckTimer > 1500) {
      this.handleStuckSituation(platforms);
      return;
    }

    // Predict target's movement
    const prediction = this.predictTargetMovement(target);
    const predictedDx = prediction.x - this.player.x;

    if (this.player.isIt) {
      this.handleChasing(predictedDx, distance);
    } else {
      this.handleEscaping(dx, distance, platforms);
    }

    // Smart jumping with prediction
    if (now - this.lastJump > this.jumpCooldown) {
      if (this.shouldJump(prediction, platforms)) {
        this.player.controls.up = true;
        this.lastJump = now;
      }
    }

    // Strategic skill usage
    if (now - this.lastSkillUse > this.skillCooldown) {
      if (this.shouldUseDash(distance)) {
        this.player.controls.dash = true;
        this.lastSkillUse = now;
      }
    }
  }

  handleChasing(predictedDx, distance) {
    if (distance < this.strategy.chaseThreshold) {
      if (Math.random() < 0.9) { // 90% accuracy
        if (predictedDx > 0) {
          this.player.controls.right = true;
        } else {
          this.player.controls.left = true;
        }
      }
    }
  }

  handleEscaping(dx, distance, platforms) {
    if (distance < this.strategy.retreatThreshold) {
      const safePlatform = this.findSafePlatform(platforms);
      if (safePlatform) {
        const platformDx = safePlatform.x + safePlatform.width / 2 - this.player.x;
        if (platformDx > 0) {
          this.player.controls.right = true;
        } else {
          this.player.controls.left = true;
        }
      } else {
        // Basic escape
        if (dx > 0) {
          this.player.controls.left = true;
        } else {
          this.player.controls.right = true;
        }
      }
    }
  }

  predictTargetMovement(target) {
    if (this.movementHistory.length < 5) {
      return target;
    }

    const recent = this.movementHistory.slice(-5);
    const avgVx = recent.reduce((sum, m) => sum + m.vx, 0) / recent.length;
    const avgVy = recent.reduce((sum, m) => sum + m.vy, 0) / recent.length;

    // Predict position with acceleration
    const lastTwo = recent.slice(-2);
    const acceleration = {
      x: (lastTwo[1].vx - lastTwo[0].vx) / (lastTwo[1].timestamp - lastTwo[0].timestamp),
      y: (lastTwo[1].vy - lastTwo[0].vy) / (lastTwo[1].timestamp - lastTwo[0].timestamp)
    };

    return {
      x: target.x + avgVx * 10 + 0.5 * acceleration.x * 100,
      y: target.y + avgVy * 10 + 0.5 * acceleration.y * 100
    };
  }

  shouldJump(prediction, platforms) {
    // Jump if predicted position is above
    if (prediction.y < this.player.y - 30 && Math.random() < this.strategy.jumpFrequency) {
      return true;
    }

    // Jump to avoid getting cornered
    if (this.isInCorner(platforms) && Math.random() < 0.8) {
      return true;
    }

    // Platform navigation
    return this.shouldJumpForPlatform(platforms);
  }

  shouldJumpForPlatform(platforms) {
    const ahead = this.player.controls.right ? 50 : -50;
    const futureX = this.player.x + ahead;

    return platforms.some(platform => {
      return platform.y < this.player.y + this.player.height * 1.5 &&
             platform.y > this.player.y &&
             futureX > platform.x &&
             futureX < platform.x + platform.width &&
             Math.random() < 0.6;
    });
  }

  isInCorner(platforms) {
    const margin = 30;
    return platforms.some(platform => {
      return Math.abs(this.player.x - platform.x) < margin ||
             Math.abs(this.player.x - (platform.x + platform.width)) < margin;
    });
  }

  findSafePlatform(platforms) {
    return platforms.reduce((best, platform) => {
      const distance = Math.sqrt(
        Math.pow(platform.x + platform.width / 2 - this.player.x, 2) +
        Math.pow(platform.y - this.player.y, 2)
      );

      const score = distance + (platform.y < this.player.y ? -50 : 50);
      
      if (!best || score < best.score) {
        return { platform, score };
      }
      return best;
    }, null)?.platform;
  }

  shouldUseDash(distance) {
    if (this.player.isIt) {
      return distance < this.strategy.dashThreshold && distance > 50;
    } else {
      return distance < this.strategy.dashThreshold * 0.8;
    }
  }

  handleStuckSituation(platforms) {
    this.player.controls.up = true;
    if (this.isInCorner(platforms)) {
      this.player.controls.left = !this.player.controls.left;
      this.player.controls.right = !this.player.controls.right;
    }
    this.stuckTimer = 0;
  }
}
