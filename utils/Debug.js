// Debug.js - Utility functions for debugging game elements

/**
 * Debug utilities for Phaser games
 * Contains functions for displaying grids, tracking coordinates, and debugging physics
 */
export default class Debug {
	/**
	 * Creates a visible grid overlay to help with positioning game elements
	 * @param {Phaser.Scene} scene - The scene to add the grid to
	 * @param {object} options - Configuration options
	 * @param {number} [options.tileSize=16] - The size of each grid cell in pixels
	 * @param {number} [options.color=0x0000ff] - The color of the grid lines
	 * @param {number} [options.alpha=0.3] - The opacity of the grid lines
	 * @param {boolean} [options.showCoordinates=true] - Whether to show coordinate labels
	 * @param {number} [options.coordSpacing=4] - Show coordinates every N tiles
	 * @returns {object} - References to created debug objects
	 */
	static createGrid(scene, options = {}) {
		// Default options
		const config = {
			tileSize: options.tileSize || 16,
			color: options.color || 0x0000ff,
			alpha: options.alpha || 0.3,
			showCoordinates: options.showCoordinates !== false,
			coordSpacing: options.coordSpacing || 4,
		};

		// Create container for debug objects
		const debugObjects = {
			graphics: null,
			textGroup: null,
			debugText: null,
		};

		// Create a graphics object for the grid
		const graphics = scene.add.graphics();
		debugObjects.graphics = graphics;

		// Get map dimensions
		const mapWidth = scene.map
			? scene.map.widthInPixels
			: scene.cameras.main.width;
		const mapHeight = scene.map
			? scene.map.heightInPixels
			: scene.cameras.main.height;

		// Draw vertical grid lines
		graphics.lineStyle(1, config.color, config.alpha);
		for (let x = 0; x <= mapWidth; x += config.tileSize) {
			graphics.moveTo(x, 0);
			graphics.lineTo(x, mapHeight);
		}

		// Draw horizontal grid lines
		for (let y = 0; y <= mapHeight; y += config.tileSize) {
			graphics.moveTo(0, y);
			graphics.lineTo(mapWidth, y);
		}

		// Stroke the grid lines
		graphics.strokePath();

		// Set grid to appear on top of game elements
		graphics.setDepth(100);

		// Create a group for coordinate labels
		if (config.showCoordinates) {
			const textGroup = scene.add.group();
			debugObjects.textGroup = textGroup;

			const textStyle = {
				font: '6px Arial',
				fill: '#ffffff',
				backgroundColor: '#00000080',
			};

			// Place coordinate text at regular intervals
			for (
				let x = 0;
				x <= mapWidth;
				x += config.tileSize * config.coordSpacing
			) {
				for (
					let y = 0;
					y <= mapHeight;
					y += config.tileSize * config.coordSpacing
				) {
					// Add text showing the coordinates
					const coordText = scene.add.text(
						x + 2, // Small offset for readability
						y + 1,
						`${x},${y}`,
						textStyle
					);
					coordText.setDepth(101);
					coordText.setOrigin(0, 0);
					textGroup.add(coordText);
				}
			}
		}

		// Add mouse position tracking
		scene.input.on('pointermove', (pointer) => {
			// Get tile coordinates
			const tileX = Math.floor(pointer.worldX / config.tileSize);
			const tileY = Math.floor(pointer.worldY / config.tileSize);

			// Update debug text if it exists
			if (debugObjects.debugText) {
				debugObjects.debugText.setText(
					`Pos: ${Math.floor(pointer.worldX)},${Math.floor(
						pointer.worldY
					)}\n` + `Tile: ${tileX},${tileY}`
				);
			}
		});

		// Add mouse click logging
		scene.input.on('pointerdown', (pointer) => {
			console.log(
				`Position: x=${Math.floor(pointer.worldX)}, y=${Math.floor(
					pointer.worldY
				)}`
			);
			console.log(
				`Tile: x=${Math.floor(
					pointer.worldX / config.tileSize
				)}, y=${Math.floor(pointer.worldY / config.tileSize)}`
			);
		});

		// Create debug text display (follows camera) - UPDATED POSITION TO UPPER RIGHT
		const debugText = scene.add.text(
			scene.cameras.main.width - 170, // Position 170ps from right edge
			30, // 30px from top edge
			'Debug Mode: ON\nPress G to toggle grid',
			{ fontSize: '12px', fill: '#ffffff', backgroundColor: '#00000080' }
		);
		debugText.setScrollFactor(0); // Fix to camera
		debugText.setDepth(102);
		debugText.setOrigin(0, 0); // Align to top-left of text
		debugObjects.debugText = debugText;

		// Add key to toggle grid visibility
		scene.input.keyboard.on('keydown-G', () => {
			graphics.visible = !graphics.visible;
			if (debugObjects.textGroup) {
				debugObjects.textGroup.toggleVisible();
			}
			debugText.setText(
				`Debug Mode: ${graphics.visible ? 'ON' : 'OFF'}\n` +
					`Press G to toggle grid`
			);
		});

		return debugObjects;
	}

	/**
	 * Enables and configures physics debugging
	 * @param {Phaser.Scene} scene - The scene to add physics debugging to
	 * @param {object} options - Configuration options
	 * @param {boolean} [options.showBodies=true] - Whether to show physics bodies
	 * @param {boolean} [options.showVelocity=true] - Whether to show velocity vectors
	 * @param {number} [options.bodyColor=0xff0000] - The color of physics bodies
	 * @returns {void}
	 */
	static enablePhysicsDebugging(scene, options = {}) {
		// Default options
		const config = {
			showBodies: options.showBodies !== false,
			showVelocity: options.showVelocity !== false,
			bodyColor: options.bodyColor || 0xff0000,
		};

		// Enable physics debugging
		if (scene.physics && scene.physics.world) {
			scene.physics.world.createDebugGraphic();

			// Configure debug display
			const debugGraphic = scene.physics.world.debugGraphic;
			debugGraphic.visible = config.showBodies;

			// Customize debug rendering
			const debugDraw = scene.physics.world.drawDebug;

			// Override default colors
			if (
				scene.physics.world.defaults &&
				scene.physics.world.defaults.debugShowBody
			) {
				scene.physics.world.defaults.bodyDebugColor = config.bodyColor;
			}

			// Add keyboard shortcut to toggle physics debug
			scene.input.keyboard.on('keydown-P', () => {
				debugGraphic.visible = !debugGraphic.visible;
				scene.debugText.setText(
					`Debug Mode: ${
						scene.gridGraphics.visible ? 'ON' : 'OFF'
					}\n` +
						`Physics Debug: ${
							debugGraphic.visible ? 'ON' : 'OFF'
						}\n` +
						`G: Toggle Grid | P: Toggle Physics`
				);
			});

			// Update debug text
			if (scene.debugText) {
				scene.debugText.setText(
					`Debug Mode: ON\n` +
						`Physics Debug: ON\n` +
						`G: Toggle Grid | P: Toggle Physics`
				);
			}
		}
	}

	/**
	 * Setup all debug features at once
	 * @param {Phaser.Scene} scene - The scene to add debugging to
	 * @param {object} options - Configuration options
	 * @returns {object} - References to created debug objects
	 */
	static setupDebugMode(scene, options = {}) {
		// Create grid
		const debugObjects = this.createGrid(scene, options);

		// Enable physics debugging
		this.enablePhysicsDebugging(scene, options);

		// Store references to debug objects in the scene for easier access
		scene.debugObjects = debugObjects;

		return debugObjects;
	}
}
