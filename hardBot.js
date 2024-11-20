export class HardBot {
  constructor(player) {
    this.player = player;
    this.decisionInterval = 300;
    this.lastDecision = 0;
    this.lastSkillUse = 0;
    this.skillCooldown = 2000;
    this.jumpCooldown = 500;
    this.lastJump = 0;
    this.pathMemory = [];
    this.targetPredictions = [];
    this.lastPlatform = null;
    this.strategyTimer = 0;
    this.currentStrategy = 'direct';
    this.lastPosition = { x: player.x, y: player.y };
    this.stuckTimer = 0;
  }

  update(target, platforms) {
    const now = Date.now();
    if (now - this.lastDecision > this.decisionInterval) {
      // Update target prediction history
      this.updateTargetPredictions(target);

      // Update strategy
      this.updateStrategy(target, platforms);

      // Make decision based on current strategy
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

  updateTargetPredictions(target) {
    this.targetPredictions.push({
      x: target.x,
      y: target.y,
      vx: target.velocity.x,
      vy: target.velocity.y,
      timestamp: Date.now(),
    });

    // Keep only recent predictions
    if (this.targetPredictions.length > 10) {
      this.targetPredictions.shift();
    }
  }

  updateStrategy(target, platforms) {
    const now = Date.now();
    if (now - this.strategyTimer > 2000) {
      this.strategyTimer = now;

      if (this.player.isIt) {
        // Choose chase strategy
        const distance = this.getDistance(target);
        if (distance > 300) {
          this.currentStrategy = 'intercept';
        } else if (distance < 100) {
          this.currentStrategy = 'direct';
        } else {
          this.currentStrategy = 'predict';
        }
      } else {
        // Choose escape strategy
        const distance = this.getDistance(target);
        if (distance < 150) {
          this.currentStrategy = 'emergency_escape';
        } else if (distance < 300) {
          this.currentStrategy = 'platform_escape';
        } else {
          this.currentStrategy = 'position';
        }
      }
    }
  }

  makeDecision(target, platforms) {
    // Reset controls
    this.player.controls.left = false;
    this.player.controls.right = false;
    this.player.controls.up = false;
    this.player.controls.dash = false;

    const now = Date.now();

    // Handle stuck situations first
    if (this.stuckTimer > 1000) {
      this.handleStuckSituation(platforms);
      return;
    }

    if (this.player.isIt) {
      switch (this.currentStrategy) {
        case 'direct':
          this.executeDirectChase(target);
          break;
        case 'predict':
          this.executePredictiveChase(target);
          break;
        case 'intercept':
          this.executeInterception(target, platforms);
          break;
      }
    } else {
      switch (this.currentStrategy) {
        case 'emergency_escape':
          this.executeEmergencyEscape(target, platforms);
          break;
        case 'platform_escape':
          this.executePlatformEscape(target, platforms);
          break;
        case 'position':
          this.executePositioning(target, platforms);
          break;
      }
    }

    // Advanced jumping logic
    if (now - this.lastJump > this.jumpCooldown) {
      if (this.shouldJump(target, platforms)) {
        this.player.controls.up = true;
        this.lastJump = now;
      }
    }

    // Strategic skill usage
    if (now - this.lastSkillUse > this.skillCooldown) {
      if (this.shouldUseDash(target)) {
        this.player.controls.dash = true;
        this.lastSkillUse = now;
      }
    }
  }

  executeDirectChase(target) {
    const dx = target.x - this.player.x;
    if (dx > 0) {
      this.player.controls.right = true;
    } else {
      this.player.controls.left = true;
    }
  }
  executePredictiveChase(target) {
    // Predict target position based on velocity and acceleration patterns
    const prediction = this.predictTargetPosition(target);
    const dx = prediction.x - this.player.x;

    if (dx > 0) {
      this.player.controls.right = true;
    } else {
      this.player.controls.left = true;
    }
  }

  executeInterception(target, platforms) {
    // Calculate interception point based on target's movement pattern
    const interceptionPoint = this.calculateInterceptionPoint(target);
    const bestPath = this.findBestPath(
      this.player,
      interceptionPoint,
      platforms
    );

    if (bestPath.length > 0) {
      const nextPoint = bestPath[0];
      if (nextPoint.x > this.player.x) {
        this.player.controls.right = true;
      } else {
        this.player.controls.left = true;
      }
    }
  }

  executeEmergencyEscape(target, platforms) {
    // Find the quickest escape route when in immediate danger
    const escapeDirection = this.findEmergencyEscapeDirection(
      target,
      platforms
    );
    const nearestPlatform = this.findSafestPlatform(platforms, target);

    if (escapeDirection === 'left') {
      this.player.controls.left = true;
    } else {
      this.player.controls.right = true;
    }

    // Consider vertical escape if possible
    if (nearestPlatform && nearestPlatform.y < this.player.y - 50) {
      this.player.controls.up = true;
    }
  }

  executePlatformEscape(target, platforms) {
    // Find optimal platform to escape to
    const safePlatform = this.findSafestPlatform(platforms, target);
    if (safePlatform) {
      const dx = safePlatform.x + safePlatform.width / 2 - this.player.x;
      if (dx > 0) {
        this.player.controls.right = true;
      } else {
        this.player.controls.left = true;
      }
    }
  }

  executePositioning(target, platforms) {
    // Find strategically advantageous position
    const bestPosition = this.findStrategicPosition(platforms, target);
    if (bestPosition) {
      const dx = bestPosition.x - this.player.x;
      if (dx > 0) {
        this.player.controls.right = true;
      } else {
        this.player.controls.left = true;
      }
    }
  }

  predictTargetPosition(target) {
    if (this.targetPredictions.length < 2) {
      return target;
    }

    // Calculate average velocity
    const recentPredictions = this.targetPredictions.slice(-3);
    const avgVx =
      recentPredictions.reduce((sum, p) => sum + p.vx, 0) /
      recentPredictions.length;
    const avgVy =
      recentPredictions.reduce((sum, p) => sum + p.vy, 0) /
      recentPredictions.length;

    // Predict position in next few frames
    return {
      x: target.x + avgVx * 5,
      y: target.y + avgVy * 5,
    };
  }

  calculateInterceptionPoint(target) {
    const predictedPosition = this.predictTargetPosition(target);
    const targetVelocity = {
      x: target.velocity.x,
      y: target.velocity.y,
    };

    // Calculate time to intercept
    const dx = predictedPosition.x - this.player.x;
    const dy = predictedPosition.y - this.player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const timeToIntercept = distance / this.player.speed;

    return {
      x: predictedPosition.x + targetVelocity.x * timeToIntercept,
      y: predictedPosition.y + targetVelocity.y * timeToIntercept,
    };
  }

  findEmergencyEscapeDirection(target, platforms) {
    const dx = target.x - this.player.x;
    const leftSpace = this.evaluateEscapeSpace(-1, platforms);
    const rightSpace = this.evaluateEscapeSpace(1, platforms);

    if (dx > 0) {
      return leftSpace > rightSpace / 2 ? 'left' : 'right';
    } else {
      return rightSpace > leftSpace / 2 ? 'right' : 'left';
    }
  }

  evaluateEscapeSpace(direction, platforms) {
    let space = 0;
    const checkDistance = 300;
    const step = 50;
    let x = this.player.x;

    for (let i = 0; i < checkDistance; i += step) {
      x += direction * step;
      const hasPlatform = platforms.some(
        (p) =>
          x >= p.x && x <= p.x + p.width && Math.abs(p.y - this.player.y) < 100
      );
      if (hasPlatform) {
        space += step;
      }
    }

    return space;
  }

  findSafestPlatform(platforms, target) {
    return platforms
      .map((platform) => {
        const distanceToTarget = Math.sqrt(
          Math.pow(platform.x + platform.width / 2 - target.x, 2) +
            Math.pow(platform.y - target.y, 2)
        );
        const distanceToSelf = Math.sqrt(
          Math.pow(platform.x + platform.width / 2 - this.player.x, 2) +
            Math.pow(platform.y - this.player.y, 2)
        );
        return {
          platform,
          score: distanceToTarget - distanceToSelf / 2,
        };
      })
      .sort((a, b) => b.score - a.score)[0]?.platform;
  }

  findStrategicPosition(platforms, target) {
    const positions = platforms.map((platform) => ({
      x: platform.x + platform.width / 2,
      y: platform.y,
      score: this.evaluatePosition(platform, target),
    }));

    return positions.sort((a, b) => b.score - a.score)[0];
  }

  evaluatePosition(platform, target) {
    const distanceToTarget = Math.sqrt(
      Math.pow(platform.x + platform.width / 2 - target.x, 2) +
        Math.pow(platform.y - target.y, 2)
    );

    const heightAdvantage = target.y - platform.y;
    const platformWidth = platform.width;

    return distanceToTarget * 0.5 + heightAdvantage * 0.3 + platformWidth * 0.2;
  }

  handleStuckSituation(platforms) {
    this.player.controls.up = true;
    if (Math.random() > 0.5) {
      this.player.controls.left = !this.player.controls.left;
      this.player.controls.right = !this.player.controls.right;
    }
    this.stuckTimer = 0;
  }

  shouldJump(target, platforms) {
    const predictedPosition = this.predictTargetPosition(target);

    // Jump if target is above
    if (this.player.isIt && predictedPosition.y < this.player.y - 30) {
      return true;
    }

    // Jump to avoid getting cornered
    if (!this.player.isIt && this.isInCorner(platforms)) {
      return true;
    }

    // Jump over obstacles
    return this.isObstacleAhead(platforms);
  }

  isInCorner(platforms) {
    const leftBlocked = platforms.some(
      (p) =>
        p.x > this.player.x - 50 &&
        p.x < this.player.x &&
        Math.abs(p.y - this.player.y) < 50
    );

    const rightBlocked = platforms.some(
      (p) =>
        p.x + p.width > this.player.x &&
        p.x + p.width < this.player.x + 50 &&
        Math.abs(p.y - this.player.y) < 50
    );

    return leftBlocked || rightBlocked;
  }

  isObstacleAhead(platforms) {
    const ahead = this.player.controls.right ? 100 : -100;
    const futureX = this.player.x + ahead;

    return platforms.some(
      (platform) =>
        platform.y < this.player.y + this.player.height * 1.5 &&
        platform.y > this.player.y &&
        futureX > platform.x &&
        futureX < platform.x + platform.width
    );
  }

  shouldUseDash(target) {
    const distance = this.getDistance(target);
    if (this.player.isIt) {
      // Dash when close enough to catch but not too close
      return distance < 200 && distance > 50;
    } else {
      // Dash when in immediate danger
      return distance < 100;
    }
  }

  getDistance(target) {
    const dx = target.x - this.player.x;
    const dy = target.y - this.player.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  findBestPath(start, end, platforms) {
    // Simplified A* implementation for path finding
    const points = platforms
      .map((p) => [
        { x: p.x, y: p.y },
        { x: p.x + p.width, y: p.y },
      ])
      .flat();

    points.push(end);

    return points
      .filter((p) => this.isReachable(start, p, platforms))
      .sort(
        (a, b) =>
          this.getDistance({ x: a.x, y: a.y }) -
          this.getDistance({ x: b.x, y: b.y })
      );
  }

  isReachable(from, to, platforms) {
    // Simple line of sight check
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 300) return false;

    // Check if any platform blocks the path
    return !platforms.some((p) =>
      this.lineIntersectsRectangle(
        from.x,
        from.y,
        to.x,
        to.y,
        p.x,
        p.y,
        p.width,
        p.height
      )
    );
  }

  lineIntersectsRectangle(x1, y1, x2, y2, rx, ry, rw, rh) {
    // Line-rectangle intersection check
    const left = rx;
    const right = rx + rw;
    const top = ry;
    const bottom = ry + rh;

    // Check if line is completely to one side of rectangle
    if (x1 < left && x2 < left) return false;
    if (x1 > right && x2 > right) return false;
    if (y1 < top && y2 < top) return false;
    if (y1 > bottom && y2 > bottom) return false;

    // Check if either endpoint is inside rectangle
    if (x1 >= left && x1 <= right && y1 >= top && y1 <= bottom) return true;
    if (x2 >= left && x2 <= right && y2 >= top && y2 <= bottom) return true;

    return true; // Simplified check for basic collision
  }
}
