import { createSlashEffect } from './Effects.js';
export default class Player extends Phaser.Physics.Arcade.Sprite {
	constructor(scene, x, y) {
		super(scene, x, y, 'knight', 'knight_idle_anim_f0.png');
		scene.add.existing(this);
		scene.physics.add.existing(this);

		// Basic player setup
		this.setScale(1.2);
		this.setCollideWorldBounds(true);
		this.body.setSize(this.width * 0.6, this.height * 0.8);

		// Inertia settings - increased drag for smoother slide
		this.body.setDamping(true);
		this.body.setDrag(0.00005); // Increased from 0.00005 for better inertia
		this.body.setMaxVelocity(300);

		// Input handling
		this.cursors = scene.input.keyboard.createCursorKeys();
		this.attackKey = scene.input.keyboard.addKey(
			Phaser.Input.Keyboard.KeyCodes.SPACE
		);

		// Track facing/attack direction ('left', 'right', 'up', 'down')
		this.currentDirection = 'right';
		this.attackDirection = 'right'; // Default attack direction

		// Attack flag
		this.isAttacking = false;

		// Knockback state
		this.isKnockedBack = false;
		this.knockbackDuration = 300; // Time in ms that player is knocked back

		// Create the sword sprite (assume sword asset is loaded with key 'sword')
		this.sword = scene.add.sprite(this.x, this.y, 'sword');
		this.sword.setOrigin(0.5, 0.5);
		this.sword.setVisible(false);

		// Create sword hitbox physics body
		this.swordHitbox = scene.physics.add.sprite(this.x, this.y, null);
		this.swordHitbox.setSize(20, 20); // Adjust size as needed
		this.swordHitbox.setVisible(false); // Invisible hitbox
		this.swordHitbox.body.setAllowGravity(false);
		this.swordHitbox.body.enable = false; // Disable physics until attacking

		// Attack animation duration (milliseconds)
		this.attackDuration = 200;

		// Damage settings
		this.attackDamage = 10;
		this.knockbackForce = 200; // Increased knockback force

		// Keep reference to the scene
		this.scene = scene;
	}

	update() {
		let moving = false;
		const speed = 150; // Fixed movement speed (no acceleration)
		let velocityX = 0;
		let velocityY = 0;

		// Skip input handling if player is currently knocked back
		if (!this.isKnockedBack) {
			// Update attackDirection based on input (only consider cardinal directions)
			if (this.cursors.left.isDown) {
				this.attackDirection = 'left';
			} else if (this.cursors.right.isDown) {
				this.attackDirection = 'right';
			} else if (this.cursors.up.isDown) {
				this.attackDirection = 'up';
			} else if (this.cursors.down.isDown) {
				this.attackDirection = 'down';
			}

			// Horizontal movement
			if (this.cursors.left.isDown) {
				this.setFlipX(true);
				this.currentDirection = 'left';
				velocityX = -speed;
				moving = true;
			} else if (this.cursors.right.isDown) {
				this.setFlipX(false);
				this.currentDirection = 'right';
				velocityX = speed;
				moving = true;
			}

			// Vertical movement
			if (this.cursors.up.isDown) {
				velocityY = -speed;
				moving = true;
			} else if (this.cursors.down.isDown) {
				velocityY = speed;
				moving = true;
			}

			// Normalize diagonal movement
			if (
				(this.cursors.left.isDown || this.cursors.right.isDown) &&
				(this.cursors.up.isDown || this.cursors.down.isDown)
			) {
				velocityX *= Math.SQRT1_2;
				velocityY *= Math.SQRT1_2;
			}

			// Only set velocity directly if actively moving
			// This allows inertia to take effect when stopping
			if (moving) {
				this.setVelocity(velocityX, velocityY);
			}
			// When not moving, don't set velocity to zero - let drag handle it
		}

		// Play movement animations
		if (moving) {
			this.play(
				this.currentDirection === 'left'
					? 'knight-run-left'
					: 'knight-run-right',
				true
			);
		} else {
			// Only snap to zero if nearly stopped (very low velocity)
			if (Math.abs(this.body.velocity.x) < 5) this.setVelocityX(0);
			if (Math.abs(this.body.velocity.y) < 5) this.setVelocityY(0);

			this.play(
				this.currentDirection === 'left'
					? 'knight-idle-left'
					: 'knight-idle-right',
				true
			);
		}

		// Update the sword position relative to the player
		this.updateSwordPosition();

		// Check for attack input (SPACE)
		if (Phaser.Input.Keyboard.JustDown(this.attackKey)) {
			this.attack();
		}
	}

	updateSwordPosition() {
		// Offset for sword position
		const offset = 13;

		// Updated angles for consistent orientation between left and right
		switch (this.attackDirection) {
			case 'right':
				this.sword.x = this.x + offset;
				this.sword.y = this.y;
				this.sword.setAngle(0); // Right: 0° (pointing right)
				this.sword.setFlipX(false);

				// Update hitbox position
				this.swordHitbox.x = this.x + offset * 1.5;
				this.swordHitbox.y = this.y;
				break;
			case 'left':
				this.sword.x = this.x - offset;
				this.sword.y = this.y;
				this.sword.setAngle(0); // Left: also 0° but will be flipped horizontally
				this.sword.setFlipX(true); // Flip the sword horizontally

				// Update hitbox position
				this.swordHitbox.x = this.x - offset * 1.5;
				this.swordHitbox.y = this.y;
				break;
			case 'up':
				this.sword.x = this.x;
				this.sword.y = this.y - offset;
				this.sword.setAngle(-90);
				this.sword.setFlipX(false); // Reset flip

				// Update hitbox position
				this.swordHitbox.x = this.x;
				this.swordHitbox.y = this.y - offset * 1.5;
				break;
			case 'down':
				this.sword.x = this.x;
				this.sword.y = this.y + offset;
				this.sword.setAngle(90);
				this.sword.setFlipX(false); // Reset flip

				// Update hitbox position
				this.swordHitbox.x = this.x;
				this.swordHitbox.y = this.y + offset * 1.5;
				break;
		}
	}

	attack() {
		if (this.isAttacking) return;
		this.isAttacking = true;

		// Show the sword sprite
		this.sword.setVisible(true);

		// Enable sword hitbox
		this.swordHitbox.body.enable = true;

		// Determine base angle based on attackDirection
		let baseAngle = 0;
		let flipX = false;
		let slashOffsetX = 0;
		let slashOffsetY = 0;
		let slashAngle = 0;

		switch (this.attackDirection) {
			case 'right':
				baseAngle = 0;
				flipX = false;
				slashOffsetX = 20;
				slashOffsetY = 0;
				slashAngle = 0;
				break;
			case 'left':
				baseAngle = 0; // Same as right, but will be flipped
				flipX = true;
				slashOffsetX = -20;
				slashOffsetY = 0;
				slashAngle = 0;
				break;
			case 'up':
				baseAngle = -90;
				flipX = false;
				slashOffsetX = 0;
				slashOffsetY = -20;
				slashAngle = -90;
				break;
			case 'down':
				baseAngle = 90;
				flipX = false;
				slashOffsetX = 0;
				slashOffsetY = 20;
				slashAngle = 90;
				break;
		}

		// Create slash effect
		createSlashEffect(
			this.scene,
			this.x + slashOffsetX,
			this.y + slashOffsetY,
			slashAngle,
			flipX
		);

		// Apply the flip state to the sword
		this.sword.setFlipX(flipX);

		// Define swing angles (swing 60° on either side of base)
		const startAngle = baseAngle - 60;
		const endAngle = baseAngle + 60;

		// Set initial sword angle and perform tween for swing effect
		this.sword.setAngle(startAngle);
		this.scene.tweens.add({
			targets: this.sword,
			angle: endAngle,
			duration: this.attackDuration,
			ease: 'Power1',
			onComplete: () => {
				// Hide the sword after the swing and reset angle
				this.sword.setVisible(false);
				this.isAttacking = false;
				this.sword.setAngle(baseAngle);

				// Disable sword hitbox
				this.swordHitbox.body.enable = false;
			},
		});
	}

	// Method to handle enemy collision with sword
	hitEnemy(enemy) {
		if (!this.isAttacking) return false;

		// Calculate knockback direction based on attack direction
		let knockbackX = 0;
		let knockbackY = 0;

		switch (this.attackDirection) {
			case 'right':
				knockbackX = this.knockbackForce;
				break;
			case 'left':
				knockbackX = -this.knockbackForce;
				break;
			case 'up':
				knockbackY = -this.knockbackForce;
				break;
			case 'down':
				knockbackY = this.knockbackForce;
				break;
		}

		// Apply knockback to enemy with more force
		enemy.body.velocity.x = knockbackX;
		enemy.body.velocity.y = knockbackY;

		// Prevent the enemy from immediately changing direction
		if (!enemy.stunned) {
			enemy.stunned = true;

			// Allow enemy to move again after a short delay
			this.scene.time.delayedCall(500, () => {
				enemy.stunned = false;
			});
		}

		// Flash the enemy red
		enemy.setTint(0xff0000);
		this.scene.time.delayedCall(150, () => {
			enemy.clearTint();
		});

		// Call the enemy's takeDamage method to register the hit
		const wasKilled = enemy.takeDamage(this.attackDamage);

		if (wasKilled) {
			console.log('Enemy killed!');
		} else {
			console.log('Enemy hit with force:', knockbackX, knockbackY);
		}

		return true;
	}

	// Method to handle player getting knocked back
	knockback(velocityX, velocityY) {
		// Set the knockback state
		this.isKnockedBack = true;

		// Apply the knockback velocity
		this.setVelocity(velocityX, velocityY);

		// Reset knockback state after a short duration
		this.scene.time.delayedCall(this.knockbackDuration, () => {
			this.isKnockedBack = false;
		});
	}
}
