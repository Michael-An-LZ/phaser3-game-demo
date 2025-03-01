import Player from './Player.js';
import Enemy from './Enemy.js';
import UI from './UI.js';
import SpriteItem from './SpriteItem.js';
import {
	createKnightAnimations,
	createGoblinAnimations,
	createTorchAnimations,
} from './Animations.js';
import {
	loadEffects,
	createEffectAnimations,
	createDeathExplosion,
	createSlashEffect,
	createHitEffect,
	loadItemEffects,
	createItemEffectAnimations,
	createItemExplosion,
} from './Effects.js';
import Debug from '../utils/Debug.js';

export default class GameScene extends Phaser.Scene {
	constructor() {
		super({ key: 'GameScene' });

		// Map to track breakable items and their hit counts
		this.breakableItems = new Map();

		// Player health
		this.playerMaxHealth = 5;

		// Invincibility time after taking damage (in milliseconds)
		this.invincibilityTime = 1000;
		this.playerInvincible = false;

		// Array to store torch objects
		this.torches = [];
	}

	preload() {
		this.load.image('tiles', 'assets/tiles/full_tilemap_extruded.png');
		this.load.tilemapTiledJSON('map', 'assets/tiles/dungeun.json');
		this.load.atlas(
			'knight',
			'assets/character/knight.png',
			'assets/character/knight.json'
		);
		this.load.atlas(
			'goblin',
			'assets/enemies/goblin/goblin.png',
			'assets/enemies/goblin/goblin.json'
		);
		this.load.image('sword', 'assets/character/weapon_sword_1.png');

		// Load UI assets
		this.load.image('pause-button', 'assets/ui/pause_button.png');
		this.load.image(
			'pause-button-press',
			'assets/ui/pause_button_press.png'
		);
		this.load.image('heart', 'assets/ui/heart.png');

		// Load torch sprite atlas
		this.load.atlas(
			'torch',
			'assets/sprite-items/torch.png',
			'assets/sprite-items/torch.json'
		);

		// Load visual effects
		loadEffects(this);
		loadItemEffects(this);
	}

	create() {
		// Create the map and layers
		this.map = this.make.tilemap({ key: 'map' });
		const tileset = this.map.addTilesetImage(
			'full_tilemap',
			'tiles',
			16,
			16,
			1,
			2
		);
		this.groundLayer = this.map.createLayer('ground', tileset);

		this.wallsLayer = this.map.createLayer('wall', tileset);
		this.wallsLayer.setCollisionByProperty({ collides: true });

		this.itemsLayer = this.map.createLayer('items', tileset);
		this.itemsLayer.setCollisionByProperty({ breakable: true });

		// Initialize breakable items tracking
		this.initBreakableItems();

		// Create animations for player, enemy, effects, and torches
		createKnightAnimations(this);
		createGoblinAnimations(this);
		createEffectAnimations(this);
		createItemEffectAnimations(this);
		createTorchAnimations(this);

		// Create player
		this.player = new Player(this, 100, 280);
		this.physics.add.collider(this.player, this.wallsLayer);
		this.physics.add.collider(this.player, this.itemsLayer);

		// Enable debug mode (only in development)
		// You can wrap this in a conditional if you have a build system
		// if (
		// 	window.location.hostname === 'localhost' ||
		// 	window.location.hostname === '127.0.0.1'
		// ) {
		// 	Debug.setupDebugMode(this, {
		// 		tileSize: 16, // Match your game's tile size
		// 		color: 0x0088ff, // Light blue grid
		// 		showCoordinates: true, // Show coordinate labels
		// 		coordSpacing: 4, // Show coordinates every 4 tiles
		// 		showBodies: true, // Show physics bodies
		// 		bodyColor: 0xff8800, // Orange for physics bodies
		// 	});
		// }

		// Create torch decorations
		this.placeTorches();

		// Set camera to follow the player and zoom in
		this.cameras.main.startFollow(this.player, true);
		this.cameras.main.setZoom(1.2);

		// Initialize UI after camera is set up
		this.ui = new UI(this, this.playerMaxHealth);

		// Initialize wave system
		this.currentWave = 0;
		this.maxWaves = 5;
		this.enemies = [];

		// Start the first wave
		this.startNextWave();
	}

	// Place torch decorations at fixed positions on the walls
	placeTorches() {
		// Define torch positions - you can customize these coordinates
		const torchPositions = [
			{ x: 40, y: 20 },
			{ x: 230, y: 20 },
			{ x: 135, y: 20 },
			{ x: 268, y: 35 },
			{ x: 216, y: 148 },
			{ x: 280, y: 148 },
		];

		// Create torches at each position
		torchPositions.forEach((pos) => {
			const torch = new SpriteItem(this, pos.x, pos.y, {
				texture: 'torch',
				frame: 'torch_anim_f0.png',
				scale: 1.5,
				depth: 5, // Make sure torches appear above ground but below other objects
				animationKey: 'torch-flame',
				// Add light effect for ambience
				light: {
					enabled: true,
					radius: 60,
					color: 0xff6600,
					intensity: 0.4,
				},
			});

			this.torches.push(torch);
		});
	}

	// Initialize tracking for all breakable items
	initBreakableItems() {
		// Find all tiles with the 'breakable' property
		this.itemsLayer.forEachTile((tile) => {
			if (tile.properties && tile.properties.breakable) {
				// Store the tile with a hit count of 0
				const tileKey = `${tile.x},${tile.y}`;
				this.breakableItems.set(tileKey, {
					tile: tile,
					hits: 0,
					maxHits: 2, // Number of hits required to break the item
					lastHitTime: 0, // Track last hit time to prevent rapid hits
				});
			}
		});

		console.log(`Initialized ${this.breakableItems.size} breakable items`);
	}

	// Check for sword collisions with breakable items
	checkSwordItemCollisions() {
		// Only check when the player is attacking and the sword hitbox is active
		if (!this.player.isAttacking || !this.player.swordHitbox.body.enable) {
			return;
		}

		// Get sword hitbox bounds
		const swordBounds = this.player.swordHitbox.getBounds();

		// Keep track of which tiles we've already checked this frame
		const checkedTiles = new Set();

		// Get all tiles that the sword hitbox overlaps with
		const tiles = this.itemsLayer.getTilesWithinShape(
			new Phaser.Geom.Rectangle(
				swordBounds.x,
				swordBounds.y,
				swordBounds.width,
				swordBounds.height
			)
		);

		// Process each tile
		for (const tile of tiles) {
			// Skip if empty or already checked
			if (!tile || tile.index === -1) continue;

			const tileKey = `${tile.x},${tile.y}`;
			if (checkedTiles.has(tileKey)) continue;
			checkedTiles.add(tileKey);

			// Check if this is a breakable item we're tracking
			if (this.breakableItems.has(tileKey)) {
				this.hitBreakableItem(tileKey);
			}
		}
	}

	// Handle hitting a breakable item
	hitBreakableItem(tileKey) {
		const item = this.breakableItems.get(tileKey);

		// Get tile coordinates from the key
		const [tileX, tileY] = tileKey.split(',').map(Number);

		// Don't allow hitting the same tile too quickly
		const now = this.time.now;
		if (item.lastHitTime && now - item.lastHitTime < 500) {
			return; // Too soon to hit again
		}

		// Update last hit time
		item.lastHitTime = now;

		// Increment hit count
		item.hits++;

		// Flash the tile
		const originalTint = item.tile.tint;
		item.tile.tint = 0xff0000; // Red tint

		// Reset tint after a short delay
		this.time.delayedCall(100, () => {
			if (item.tile) {
				item.tile.tint = originalTint;
			}
		});

		// Add a little screen shake for feedback
		this.cameras.main.shake(100, 0.005);

		console.log(
			`Hit item at ${tileX}, ${tileY}, hits: ${item.hits}/${item.maxHits}`
		);

		// If item has taken enough hits, break it
		if (item.hits >= item.maxHits) {
			// Play explosion animation
			createItemExplosion(this, tileX, tileY);

			// Remove the tile
			this.itemsLayer.removeTileAt(tileX, tileY);

			// Remove from tracking
			this.breakableItems.delete(tileKey);

			console.log(`Broke item at ${tileX}, ${tileY}`);
		}
	}

	// Start the next wave of enemies
	startNextWave() {
		// Increment wave counter
		this.currentWave++;

		// Check if we've reached the maximum number of waves
		if (this.currentWave > this.maxWaves) {
			this.showGameWon();
			return;
		}

		// Calculate number of enemies for this wave
		const enemiesToSpawn = this.currentWave;

		// Spawn enemies
		for (let i = 0; i < enemiesToSpawn; i++) {
			const spawnPoint = this.getValidSpawnPoint();
			this.spawnEnemy(spawnPoint.x, spawnPoint.y);
		}

		// Display wave number above player
		this.displayWaveCounter();
	}

	// Display wave counter above player
	displayWaveCounter() {
		// Create wave text with format "WAVE X/10"
		const waveText = this.add.text(
			this.player.x,
			this.player.y - 40,
			`WAVE ${this.currentWave}/${this.maxWaves}`,
			{
				fontSize: '24px',
				fontStyle: 'bold',
				fill: '#ffffff',
				stroke: '#000000',
				strokeThickness: 4,
				align: 'center',
			}
		);
		waveText.setOrigin(0.5);

		// Flash animation
		let flashCount = 0;
		const flashInterval = this.time.addEvent({
			delay: 200,
			callback: () => {
				waveText.visible = !waveText.visible;
				flashCount++;

				// Update position to follow player
				waveText.x = this.player.x;
				waveText.y = this.player.y - 40;

				// After 5 flashes, destroy the text
				if (flashCount >= 5) {
					flashInterval.destroy();
					waveText.destroy();
				}
			},
			repeat: 9,
		});
	}

	// Show game won message when all waves are cleared
	showGameWon() {
		// Create victory text
		const victoryText = this.add.text(
			this.cameras.main.centerX,
			this.cameras.main.centerY,
			'VICTORY!\nAll waves cleared!',
			{
				fontSize: '20px',
				fontStyle: 'bold',
				fill: '#ffff00',
				stroke: '#000000',
				strokeThickness: 6,
				align: 'center',
			}
		);
		victoryText.setOrigin(0.5);
		victoryText.setScrollFactor(0); // Fixed to camera

		// Add entrance animation effect
		this.tweens.add({
			targets: victoryText,
			scale: { from: 0.5, to: 1 },
			alpha: { from: 0, to: 1 },
			duration: 1000,
			ease: 'Bounce.Out',
			onComplete: () => {
				// After entrance animation completes, wait 1 second then fade out
				this.time.delayedCall(1000, () => {
					// Fade out animation
					this.tweens.add({
						targets: victoryText,
						alpha: 0,
						y: victoryText.y - 50, // Move up while fading
						duration: 1500,
						ease: 'Power2',
						onComplete: () => {
							// Destroy the text object when fade out is complete
							victoryText.destroy();
						},
					});
				});
			},
		});
	}

	// Show game over message when player dies
	showGameOver() {
		// Create game over text
		const gameOverText = this.add.text(
			this.cameras.main.centerX,
			this.cameras.main.centerY,
			'GAME OVER',
			{
				fontSize: '32px',
				fontStyle: 'bold',
				fill: '#ff0000',
				stroke: '#000000',
				strokeThickness: 6,
				align: 'center',
			}
		);
		gameOverText.setOrigin(0.5);
		gameOverText.setScrollFactor(0); // Fixed to camera
		gameOverText.setDepth(200);

		// Pause the game
		this.physics.pause();

		// Add entrance animation effect
		this.tweens.add({
			targets: gameOverText,
			scale: { from: 2, to: 1 },
			alpha: { from: 0, to: 1 },
			duration: 1000,
			ease: 'Bounce.Out',
			onComplete: () => {
				// Add restart instructions
				const restartText = this.add.text(
					this.cameras.main.centerX,
					this.cameras.main.centerY + 50,
					'Press Space to restart',
					{
						fontSize: '16px',
						color: '#ffffff',
						stroke: '#000000',
						strokeThickness: 4,
						align: 'center',
					}
				);
				restartText.setOrigin(0.5);
				restartText.setScrollFactor(0);
				restartText.setDepth(200);

				// Add restart key listener
				const spaceKey = this.input.keyboard.addKey('SPACE');
				spaceKey.once('down', () => {
					this.scene.restart();
				});
			},
		});
	}

	// Handle player damage
	damagePlayer() {
		// If player is currently invincible, do nothing
		if (this.playerInvincible) return;

		// Add a little screen shake for feedback
		this.cameras.main.shake(100, 0.01);
		// Damage the player through the UI
		const newHealth = this.ui.damagePlayer(1);

		// Check if player has died
		if (newHealth <= 0) {
			// Call playerDeath immediately
			this.playerDeath();
			return; // Exit early to skip invincibility setup
		}

		// Set temporary invincibility
		this.playerInvincible = true;

		// Make player flash to indicate invincibility
		this.player.setAlpha(0.5);

		// Create a flashing effect
		const flashInterval = this.time.addEvent({
			delay: 150,
			callback: () => {
				this.player.setAlpha(this.player.alpha === 1 ? 0.5 : 1);
			},
			repeat: 5,
		});

		// Reset invincibility after delay
		this.time.delayedCall(this.invincibilityTime, () => {
			this.playerInvincible = false;
			this.player.setAlpha(1); // Ensure player is fully visible
		});
	}

	// Handle player death
	playerDeath() {
		// Add death animation or effects here
		this.player.setTint(0xff0000);

		// Make player "fall"
		this.tweens.add({
			targets: this.player,
			alpha: 0,
			y: this.player.y + 20,
			angle: 90,
			duration: 500,
			ease: 'Power2',
			onComplete: () => {
				// Show game over screen
				this.showGameOver();
			},
		});
	}

	// Heal player
	healPlayer(amount = 1) {
		this.ui.healPlayer(amount);
	}

	// Spawn a single enemy at the specified position
	spawnEnemy(x, y) {
		// Create enemy configuration
		const enemyConfig = {
			texture: 'goblin',
			frame: 'goblin_idle_anim_f0.png',
			scale: 1.2,
			bodySizeFactor: 0.7,
			bodySizeFactorY: 0.9,
			drag: 0.0005,
			maxVelocity: 150,
			speed: 50,
			target: this.player,
			anims: {
				idleLeft: 'goblin-idle-left',
				idleRight: 'goblin-idle-right',
				runLeft: 'goblin-run-left',
				runRight: 'goblin-run-right',
			},
		};

		// Create the enemy
		const enemy = new Enemy(this, x, y, enemyConfig);

		// Add collision with walls and items
		this.physics.add.collider(enemy, this.wallsLayer);
		this.physics.add.collider(enemy, this.itemsLayer);

		// Add collision with player
		this.physics.add.collider(
			this.player,
			enemy,
			this.playerHit,
			null,
			this
		);

		// Add collision with sword
		this.physics.add.overlap(
			this.player.swordHitbox,
			enemy,
			this.swordHit,
			null,
			this
		);

		// Track when enemy is destroyed
		enemy.on('destroy', () => {
			// Remove from enemies array
			this.enemies = this.enemies.filter((e) => e !== enemy);

			// If all enemies are defeated, start next wave
			if (this.enemies.length === 0) {
				// Add a short delay before next wave
				this.time.delayedCall(1000, () => {
					this.startNextWave();
				});
			}
		});

		// Add enemy to tracking array
		this.enemies.push(enemy);
	}

	// Find a valid spawn point on the map (not on walls or items)
	getValidSpawnPoint() {
		const mapWidth = this.map.widthInPixels;
		const mapHeight = this.map.heightInPixels;
		const minDistanceFromPlayer = 100;
		let x,
			y,
			validPosition = false;
		let attempts = 0;

		// Try to find a valid position
		while (!validPosition && attempts < 50) {
			attempts++;

			// Generate random position within map bounds
			x = Phaser.Math.Between(50, mapWidth - 50);
			y = Phaser.Math.Between(50, mapHeight - 50);

			// Calculate distance to player
			const distanceToPlayer = Phaser.Math.Distance.Between(
				x,
				y,
				this.player.x,
				this.player.y
			);

			// Check if position is valid (not on wall or item)
			const tileX = this.map.worldToTileX(x);
			const tileY = this.map.worldToTileY(y);

			const wallTile = this.wallsLayer.getTileAt(tileX, tileY);
			const itemTile = this.itemsLayer.getTileAt(tileX, tileY);

			if (
				(!wallTile ||
					!wallTile.properties ||
					!wallTile.properties.collides) &&
				(!itemTile ||
					!itemTile.properties ||
					!itemTile.properties.breakable) &&
				distanceToPlayer > minDistanceFromPlayer
			) {
				validPosition = true;
			}
		}

		// If no valid position found after max attempts, use a default position
		if (!validPosition) {
			// Use a position away from the player
			const angle = Math.random() * Math.PI * 2;
			x = this.player.x + Math.cos(angle) * 150;
			y = this.player.y + Math.sin(angle) * 150;
		}

		return { x, y };
	}

	// Collision callback: when enemy touches player, flash red and knock back the player
	playerHit(player, enemy) {
		// Flash the player red
		player.setTint(0xff0000);
		this.time.addEvent({
			delay: 100, // flash duration (milliseconds)
			callback: () => {
				player.clearTint();
			},
		});
		// Calculate knockback: determine the angle from the enemy to the player
		const angle = Phaser.Math.Angle.Between(
			enemy.x,
			enemy.y,
			player.x,
			player.y
		);
		const knockbackSpeed = 300;

		// Use the player's knockback method instead of directly setting velocity
		player.knockback(
			Math.cos(angle) * knockbackSpeed,
			Math.sin(angle) * knockbackSpeed
		);

		// Create hit effect at collision point
		createHitEffect(
			this,
			player.x - Math.cos(angle) * 10,
			player.y - Math.sin(angle) * 10
		);

		// Damage the player
		this.damagePlayer();
	}

	// Collision callback: when sword hits enemy
	swordHit(swordHitbox, enemy) {
		// Call the player's hitEnemy method to handle the hit logic
		const hit = this.player.hitEnemy(enemy);

		// If hit was successful, create hit effect
		if (hit) {
			// Add a little screen shake for feedback
			this.cameras.main.shake(100, 0.005);
			// Calculate angle between player and enemy for appropriate hit effect placement
			const angle = Phaser.Math.Angle.Between(
				this.player.x,
				this.player.y,
				enemy.x,
				enemy.y
			);

			// Create hit effect at contact point
			createHitEffect(
				this,
				enemy.x - Math.cos(angle) * 10,
				enemy.y - Math.sin(angle) * 10
			);
		}
	}

	update() {
		// Skip update if game is paused
		if (this.ui && this.ui.isPaused) return;

		this.player.update();

		// Update all enemies
		for (const enemy of this.enemies) {
			if (!enemy.stunned) {
				enemy.update();
			}
		}

		// Check for sword hits on breakable items
		this.checkSwordItemCollisions();

		// Update UI
		if (this.ui) {
			this.ui.update();
		}

		// Update torches if they have any dynamic behavior
		this.torches.forEach((torch) => torch.update());
	}
}
