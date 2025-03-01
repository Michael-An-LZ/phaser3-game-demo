// SpriteItem.js - A class for animated sprite items in the game
export default class SpriteItem extends Phaser.GameObjects.Sprite {
	/**
	 * Creates a new sprite item.
	 * @param {Phaser.Scene} scene - The scene this sprite item belongs to.
	 * @param {number} x - The x position in the game world.
	 * @param {number} y - The y position in the game world.
	 * @param {object} config - Configuration object for the sprite item.
	 * @param {string} config.texture - The texture key to use for this sprite.
	 * @param {string} [config.frame] - The initial frame to display (optional).
	 * @param {number} [config.scale=1] - Scale factor for the sprite (optional, defaults to 1).
	 * @param {number} [config.depth=0] - Depth/z-index of the sprite for layering (optional, defaults to 0).
	 * @param {object} [config.origin] - Origin point for the sprite (optional).
	 * @param {number} [config.origin.x=0.5] - X origin (0-1), defaults to center.
	 * @param {number} [config.origin.y=0.5] - Y origin (0-1), defaults to center.
	 * @param {string} [config.animationKey] - Key of the animation to play (optional).
	 * @param {boolean} [config.loop=true] - Whether the animation should loop (optional).
	 * @param {string} [config.type='decoration'] - Type identifier for the item (optional).
	 * @param {boolean} [config.interactive=false] - Whether this item is interactive (optional).
	 * @param {object} [config.light] - Light effect configuration (optional).
	 * @param {boolean} [config.light.enabled=false] - Whether to add a light effect.
	 * @param {number} [config.light.radius=100] - Radius of the light effect.
	 * @param {number} [config.light.color=0xffff00] - Color of the light (hex value).
	 * @param {number} [config.light.intensity=0.5] - Intensity of the light (0-1).
	 */
	constructor(scene, x, y, config) {
		// The texture key will be provided in the config
		super(scene, x, y, config.texture, config.frame);

		// Add to scene
		scene.add.existing(this);

		// Store reference to scene
		this.scene = scene;

		// Set properties from config or use defaults
		this.setScale(config.scale || 1);
		this.setDepth(config.depth || 0);

		// Optional: Set origin point (defaults to center)
		if (config.origin) {
			this.setOrigin(config.origin.x || 0.5, config.origin.y || 0.5);
		}

		// Create animation if animation key is provided
		if (config.animationKey) {
			this.play(config.animationKey, config.loop !== false); // Loop by default
		}

		// Store any other properties from config
		this.itemType = config.type || 'decoration';
		this.isInteractive = config.interactive || false;

		// Setup light effect if enabled
		if (config.light && config.light.enabled) {
			this.addLightEffect(config.light);
		}

		// Setup interactions if needed
		if (this.isInteractive) {
			this.setInteractive();

			// Default pointer up handler for interactive items
			this.on('pointerup', () => {
				this.onInteract();
			});
		}

		// Time-based flicker effect for torches
		this.flickerTimer = 0;
		this.flickerIntensity = config.flickerIntensity || 0.1;
	}

	/**
	 * Add a light/glow effect to this item.
	 * @param {object} lightConfig - Light configuration.
	 * @param {number} [lightConfig.radius=100] - Radius of the light.
	 * @param {number} [lightConfig.color=0xffff00] - Color of the light (hex).
	 * @param {number} [lightConfig.intensity=0.5] - Intensity of the light (0-1).
	 */
	addLightEffect(lightConfig) {
		// Create a circular gradient for the light
		const radius = lightConfig.radius || 100;
		const color = lightConfig.color || 0xffff00; // Yellow default
		const intensity = lightConfig.intensity || 0.5;

		// Create a graphics object for the light
		this.lightGraphics = this.scene.add.graphics();

		// Convert hex color to RGB components
		const r = (color >> 16) & 0xff;
		const g = (color >> 8) & 0xff;
		const b = color & 0xff;

		// Create base color with alpha
		const baseColor = Phaser.Display.Color.GetColor(r, g, b);

		// Fill with radial gradient
		this.lightGraphics.fillStyle(baseColor, intensity);
		this.lightGraphics.fillCircle(0, 0, radius);

		// Position the light at the item's position
		this.lightGraphics.x = this.x;
		this.lightGraphics.y = this.y;

		// Set depth below the item
		this.lightGraphics.setDepth(this.depth - 1);

		// Set blend mode for more realistic lighting
		this.lightGraphics.setBlendMode(Phaser.BlendModes.ADD);

		// Store reference and properties for updates
		this.lightEffect = this.lightGraphics;
		this.lightRadius = radius;
		this.lightColor = color;
		this.lightIntensity = intensity;
		this.baseAlpha = intensity;
	}

	/**
	 * Create a subtle flicker effect for the light
	 * @param {number} time - Current game time
	 */
	updateLightFlicker(time, delta) {
		if (!this.lightEffect) return;

		// Update flicker timer
		this.flickerTimer += delta * 0.001; // Convert to seconds

		// Calculate flicker effect (subtle sine wave)
		const flicker = Math.sin(this.flickerTimer * 5) * this.flickerIntensity;

		// Apply flicker to light intensity
		const newAlpha = Math.max(0.1, Math.min(1, this.baseAlpha + flicker));
		this.lightEffect.alpha = newAlpha;

		// Occasionally do a small "pop" in the flame for more realistic effect
		if (Math.random() < 0.01) {
			// Random slight scale change
			const scale = 1 + (Math.random() * 0.2 - 0.1);
			this.lightEffect.setScale(scale);

			// Return to normal after a short delay
			if (this.scene && this.scene.time) {
				this.scene.time.delayedCall(100, () => {
					if (this.lightEffect) {
						this.lightEffect.setScale(1);
					}
				});
			}
		}
	}

	/**
	 * Update method - called on each frame if added to the update list.
	 * @param {number} time - Current time.
	 * @param {number} delta - Time since last update.
	 */
	update(time, delta) {
		// Update light position if it exists
		if (this.lightEffect) {
			this.lightEffect.x = this.x;
			this.lightEffect.y = this.y;

			// Add subtle flicker for torches
			if (
				this.itemType === 'decoration' &&
				this.texture.key === 'torch'
			) {
				this.updateLightFlicker(time, delta);
			}
		}
	}

	/**
	 * Method called when the item is interacted with.
	 * Override this method in derived classes to implement custom behavior.
	 */
	onInteract() {
		console.log(`Interacted with ${this.itemType} at ${this.x}, ${this.y}`);
		// Default behavior - override in subclasses
	}

	/**
	 * Remove this item and clean up resources.
	 */
	destroy() {
		// Clean up light effect if it exists
		if (this.lightEffect) {
			this.lightEffect.destroy();
		}

		// Call parent destroy method
		super.destroy();
	}
}
