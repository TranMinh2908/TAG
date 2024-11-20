export class EasyBot {
  constructor(player) {
    this.player = player;
    this.decisionInterval = 800;
    this.lastDecision = 0;
    this.lastSkillUse = 0;
    this.skillCooldown = 2000;
    this.jumpCooldown = 1000;
    this.lastJump = 0;
    this.movementState = 'idle';
    this.stateTimer = 0;
    this.preferredDirection = Math.random() < 0.5 ? 'left' : 'right';
  }

  update(target, platforms) {
    const now = Date.now();
    
    // Update movement state
    if (now - this.stateTimer > 2000) {
      this.stateTimer = now;
      this.updateMovementState();
    }

    if (now - this.lastDecision > this.decisionInterval) {
      this.makeDecision(target, platforms);
      this.lastDecision = now;
    }
  }

  updateMovementState() {
    const states = ['idle', 'wander', 'chase', 'retreat'];
    const weights = this.player.isIt ? [0.1, 0.2, 0.7, 0] : [0.2, 0.3, 0, 0.5];
    
    let random = Math.random();
    let sum = 0;
    for (let i = 0; i < states.length; i++) {
      sum += weights[i];
      if (random <= sum) {
        this.movementState = states[i];
        this.preferredDirection = Math.random() < 0.5 ? 'left' : 'right';
        break;
      }
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

    switch (this.movementState) {
      case 'idle':
        // Occasionally make small movements
        if (Math.random() < 0.3) {
          this.player.controls[Math.random() < 0.5 ? 'left' : 'right'] = true;
        }
        break;

      case 'wander':
        // Move in preferred direction with platform awareness
        this.player.controls[this.preferredDirection] = true;
        if (this.isNearPlatformEdge(platforms)) {
          this.preferredDirection = this.preferredDirection === 'left' ? 'right' : 'left';
        }
        break;

      case 'chase':
        // Simple chase with occasional mistakes
        if (Math.random() < 0.8) { // 80% accuracy
          if (dx > 0) {
            this.player.controls.right = true;
          } else {
            this.player.controls.left = true;
          }
        } else {
          // Make intentional mistakes
          this.player.controls[Math.random() < 0.5 ? 'left' : 'right'] = true;
        }
        break;

      case 'retreat':
        // Move away from target with some randomness
        if (Math.random() < 0.7) { // 70% accuracy
          if (dx > 0) {
            this.player.controls.left = true;
          } else {
            this.player.controls.right = true;
          }
        }
        break;
    }

    // Jumping logic
    if (now - this.lastJump > this.jumpCooldown) {
      if (this.shouldJump(platforms, target)) {
        this.player.controls.up = true;
        this.lastJump = now;
      }
    }

    // Simple skill usage
    if (now - this.lastSkillUse > this.skillCooldown && Math.random() < 0.3) {
      if (this.player.skill === 'dash' && distance < 150) {
        this.player.controls.dash = true;
        this.lastSkillUse = now;
      }
    }
  }

  shouldJump(platforms, target) {
    // Jump if target is above
    if (target.y < this.player.y - 50 && Math.random() < 0.4) {
      return true;
    }

    // Jump near platform edges
    if (this.isNearPlatformEdge(platforms) && Math.random() < 0.5) {
      return true;
    }

    // Random jumps
    return Math.random() < 0.1;
  }

  isNearPlatformEdge(platforms) {
    const margin = 20;
    return platforms.some(platform => {
      const onPlatform = this.player.y + this.player.height >= platform.y - 5 &&
                        this.player.y + this.player.height <= platform.y + 5;
      const nearEdge = Math.abs(this.player.x - platform.x) < margin ||
                      Math.abs(this.player.x - (platform.x + platform.width)) < margin;
      return onPlatform && nearEdge;
    });
  }
}
