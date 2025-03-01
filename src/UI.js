// UI.js - A class to manage game UI elements
export default class UI {
	constructor(scene, playerHealth = 5) {
		this.scene = scene;
		this.isPaused = false;
		this.maxHealth = playerHealth;
		this.currentHealth = playerHealth;
		this.hearts = [];

		// Create UI elements
		this.createPauseButton();
		this.createHealthDisplay();
	}

	createPauseButton() {
		// Create pause button in top-right corner (adjust positions as needed)
		const rightEdge = this.scene.cameras.main.width;
		const topEdge = 0;

		// Create the button with the normal state image
		this.pauseButton = this.scene.add.image(
			rightEdge - 280, // 30 pixels from right edge
			topEdge + 40, // 30 pixels from top edge
			'pause-button'
		);

		// Scale to appropriate size (adjust as needed)
		this.pauseButton.setScale(1);

		// Fix the button to the camera so it doesn't move when the camera moves
		this.pauseButton.setScrollFactor(0);

		// Make the button interactive
		this.pauseButton.setInteractive({ useHandCursor: true });

		// Add hover effect
		this.pauseButton.on('pointerover', () => {
			this.pauseButton.setTint(0xcccccc); // Light gray tint on hover
		});

		this.pauseButton.on('pointerout', () => {
			this.pauseButton.clearTint();
		});

		// Add click effect
		this.pauseButton.on('pointerdown', () => {
			this.pauseButton.setTexture('pause-button-press');
		});

		this.pauseButton.on('pointerup', () => {
			this.pauseButton.setTexture('pause-button');
			this.togglePause();
		});
	}

	createHealthDisplay() {
		// Position constants
		const leftEdge = 200;
		const bottomEdge = this.scene.cameras.main.height;
		const heartSpacing = 12; // Space between hearts
		const heartY = bottomEdge - 33; // 30 pixels from bottom of screen

		// Create hearts
		for (let i = 0; i < this.maxHealth; i++) {
			const heartX = leftEdge + 35 + i * heartSpacing;
			const heart = this.scene.add.image(heartX, heartY, 'heart');
			heart.setScale(0.7);
			heart.setScrollFactor(0); // Fix to camera
			heart.setDepth(100); // Ensure hearts are visible above game elements
			this.hearts.unshift(heart);
		}
	}

	updateHealth(health) {
		// Update current health
		this.currentHealth = Math.max(0, Math.min(health, this.maxHealth));

		// Update heart display
		for (let i = 0; i < this.hearts.length; i++) {
			if (i < this.currentHealth) {
				// Show heart
				this.hearts[i].setVisible(true);
				this.hearts[i].setAlpha(1);
			} else {
				// Hide heart or show empty heart
				// Option 1: Hide heart completely
				// this.hearts[i].setVisible(false);

				// Option 2: Show faded heart
				this.hearts[i].setAlpha(0.3);
			}
		}

		// If health is critical (1 heart), make it pulse
		if (this.currentHealth === 1) {
			this.startHeartPulse();
		} else {
			this.stopHeartPulse();
		}
	}

	startHeartPulse() {
		// Only start pulse if not already pulsing
		if (!this.heartPulseTween && this.hearts.length > 0) {
			this.heartPulseTween = this.scene.tweens.add({
				targets: this.hearts[0],
				scale: { from: 1, to: 1.2 },
				alpha: { from: 1, to: 0.7 },
				duration: 700,
				yoyo: true,
				repeat: -1,
			});
		}
	}

	stopHeartPulse() {
		// Stop pulse animation if it exists
		if (this.heartPulseTween) {
			this.heartPulseTween.stop();
			this.heartPulseTween = null;

			// Reset heart appearance
			for (let heart of this.hearts) {
				heart.setScale(1);
				heart.setAlpha(heart.visible ? 1 : 0.3);
			}
		}
	}

	// Method to damage player (can be called from GameScene)
	damagePlayer(amount = 1) {
		const newHealth = this.currentHealth - amount;
		this.updateHealth(newHealth);

		// Shake the camera slightly for impact
		this.scene.cameras.main.shake(200, 0.01);

		return newHealth;
	}

	// Method to heal player (can be called from GameScene)
	healPlayer(amount = 1) {
		const newHealth = this.currentHealth + amount;
		this.updateHealth(newHealth);

		return newHealth;
	}

	togglePause() {
		this.isPaused = !this.isPaused;

		if (this.isPaused) {
			// Pause the game
			this.scene.physics.pause();
			this.scene.time.paused = true;

			// Create a semi-transparent overlay
			this.overlay = this.scene.add.rectangle(
				this.scene.cameras.main.centerX,
				this.scene.cameras.main.centerY,
				this.scene.cameras.main.width,
				this.scene.cameras.main.height,
				0x000000,
				0.7
			);
			this.overlay.setScrollFactor(0);
			this.overlay.setDepth(100);

			// Add pause text
			this.pauseText = this.scene.add.text(
				this.scene.cameras.main.centerX,
				this.scene.cameras.main.centerY,
				'GAME PAUSED',
				{
					fontFamily: 'Arial',
					fontSize: '16px',
					fontStyle: 'bold',
					color: '#ffffff',
					align: 'center',
					stroke: '#000000',
					strokeThickness: 6,
				}
			);
			this.pauseText.setOrigin(0.5);
			this.pauseText.setScrollFactor(0);
			this.pauseText.setDepth(101);

			// Add instructions text
			this.instructionsText = this.scene.add.text(
				this.scene.cameras.main.centerX,
				this.scene.cameras.main.centerY + 50,
				'Click the pause button again to resume',
				{
					fontFamily: 'Arial',
					fontSize: '14px',
					color: '#ffffff',
					align: 'center',
					stroke: '#000000',
					strokeThickness: 4,
				}
			);
			this.instructionsText.setOrigin(0.5);
			this.instructionsText.setScrollFactor(0);
			this.instructionsText.setDepth(101);
		} else {
			// Resume the game
			this.scene.physics.resume();
			this.scene.time.paused = false;

			// Remove pause overlay and text
			this.overlay.destroy();
			this.pauseText.destroy();
			this.instructionsText.destroy();
		}
	}

	// Add this to the update function of your game scene
	update() {
		// Any UI updates can go here
	}
}
