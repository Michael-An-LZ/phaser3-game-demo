import { createDeathExplosion } from './Effects.js';
export default class Enemy extends Phaser.Physics.Arcade.Sprite {
	/**
	 * @param {Phaser.Scene} scene - The scene this enemy belongs to.
	 * @param {number} x - The x position.
	 * @param {number} y - The y position.
	 * @param {object} config - Configuration for the enemy.
	 *        Required:
	 *          config.texture: string (the texture key)
	 *        Optional:
	 *          config.frame: string (initial frame; no default is provided)
	 *          config.scale: number (defaults to 1.2)
	 *          config.bodySizeFactor: number (for width, defaults to 0.6)
	 *          config.bodySizeFactorY: number (for height, defaults to 0.8)
	 *          config.drag: number (defaults to 0.0005)
	 *          config.maxVelocity: number (defaults to 150)
	 *          config.speed: number (movement speed, defaults to 150)
	 *          config.target: Phaser.GameObjects.Sprite (optional target for chasing)
	 *          config.anims: object containing the animation keys:
	 *                    { idleLeft, idleRight, runLeft, runRight }
	 */
	constructor(scene, x, y, config) {
		if (!config || !config.texture) {
			throw new Error(
				"Enemy requires a 'texture' property in the config."
			);
		}

		// Use provided texture key and frame (if provided)
		super(scene, x, y, config.texture, config.frame);

		scene.add.existing(this);
		scene.physics.add.existing(this);

		this.setScale(config.scale || 1.2);
		this.setCollideWorldBounds(true);
		this.body.setSize(
			this.width * (config.bodySizeFactor || 0.6),
			this.height * (config.bodySizeFactorY || 0.8)
		);

		// Apply drag for smooth stopping/inertia - increased from default
		this.body.setDamping(true);
		this.body.setDrag(0.00005); // Slightly more drag than player for quicker stops
		this.body.setMaxVelocity(config.maxVelocity || 150);

		this.speed = config.speed || 150;
		this.currentDirection = 'right';
		this.target = config.target || null;

		// Require an animation keys object in the config.
		if (!config.anims) {
			throw new Error(
				"Enemy requires an 'anims' object in the config with idleLeft, idleRight, runLeft, and runRight keys."
			);
		}
		this.animKeys = config.anims;

		// Add a stunned property to track when enemy is knocked back
		this.stunned = false;

		// Hit counter - enemy dies after 3 hits
		this.hitsToKill = 3;
		this.hitsTaken = 0;

		// Track last hit time to prevent multiple hits in quick succession
		this.lastHitTime = 0;
		this.hitCooldown = 500; // ms between valid hits

		// Flag to prevent issues during death animation
		this.isDying = false;
	}

	update() {
		// If stunned or dying, don't update movement logic
		if (this.stunned || this.isDying) return;

		let moving = false;
		let velocityX = 0;
		let velocityY = 0;

		if (this.target) {
			// Calculate differences between target and enemy
			const diffX = this.target.x - this.x;
			const diffY = this.target.y - this.y;
			const horizontalThreshold = 5; // Only adjust horizontal if difference is significant

			// Horizontal movement: update only if difference is significant
			if (Math.abs(diffX) > horizontalThreshold) {
				if (diffX < 0) {
					this.currentDirection = 'left';
					this.setFlipX(true);
					velocityX = -this.speed;
				} else {
					this.currentDirection = 'right';
					this.setFlipX(false);
					velocityX = this.speed;
				}
				moving = true;
			}

			// Vertical movement: always set based on diffY (does not change horizontal facing)
			if (Math.abs(diffY) > 0) {
				if (diffY < 0) {
					velocityY = -this.speed;
				} else {
					velocityY = this.speed;
				}
				moving = true;
			}

			// Normalize diagonal movement to keep overall speed consistent
			if (velocityX !== 0 && velocityY !== 0) {
				velocityX *= Math.SQRT1_2;
				velocityY *= Math.SQRT1_2;
			}

			// Only set velocity directly if actively moving
			// This allows inertia to take effect when stopping
			if (moving) {
				this.setVelocity(velocityX, velocityY);
			}
			// When not actively chasing, don't set velocity to zero - let drag handle it
		}

		// Play the appropriate animation based on movement and current horizontal direction
		if (
			moving ||
			Math.abs(this.body.velocity.x) > 10 ||
			Math.abs(this.body.velocity.y) > 10
		) {
			// Play run animation if moving or sliding with significant velocity
			this.play(
				this.currentDirection === 'left'
					? this.animKeys.runLeft
					: this.animKeys.runRight,
				true
			);
		} else {
			// Only snap to zero if very low velocity
			if (Math.abs(this.body.velocity.x) < 5) this.setVelocityX(0);
			if (Math.abs(this.body.velocity.y) < 5) this.setVelocityY(0);

			// Play idle animation when stopped or nearly stopped
			this.play(
				this.currentDirection === 'left'
					? this.animKeys.idleLeft
					: this.animKeys.idleRight,
				true
			);
		}
	}

	// Method to handle taking damage and track hits
	takeDamage(damage) {
		// If already dying, ignore further hits
		if (this.isDying) return false;

		// Check for hit cooldown to prevent multiple hits in quick succession
		const currentTime = new Date().getTime();
		if (currentTime - this.lastHitTime < this.hitCooldown) {
			return false; // Hit rejected due to cooldown
		}

		// Update last hit time
		this.lastHitTime = currentTime;

		// Increase hit counter
		this.hitsTaken++;

		// Check if enemy should die
		if (this.hitsTaken >= this.hitsToKill) {
			this.isDying = true;
			this.die();
			return true; // Killed
		}

		return false; // Not killed yet
	}

	// Method to handle death
	die() {
		// Disable physics body to prevent further interactions
		this.body.enable = false;

		// Store position before creating explosion effect
		const enemyX = this.x;
		const enemyY = this.y;

		// Create explosion effect at enemy's position
		createDeathExplosion(this.scene, enemyX, enemyY);

		// Play death sequence - make enemy smaller and fade out
		this.scene.tweens.add({
			targets: this,
			alpha: 0,
			scale: 0.5,
			duration: 500,
			onComplete: () => {
				this.destroy();
			},
		});
	}
}
