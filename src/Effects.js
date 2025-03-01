// Create a new file called Effects.js to centralize our effects-related code
export function loadEffects(scene) {
	// Load all effect-related assets
	scene.load.atlas(
		'explosion',
		'assets/effects/enemy_afterdead_explosion.png',
		'assets/effects/enemy_afterdead_explosion.json'
	);
	scene.load.atlas(
		'slash',
		'assets/effects/slash.png',
		'assets/effects/slash.json'
	);
	scene.load.atlas(
		'hit',
		'assets/effects/hit.png',
		'assets/effects/hit.json'
	);
}

export function loadItemEffects(scene) {
	// Load explosion effect for breakable items
	scene.load.atlas(
		'item-explosion',
		'assets/effects/explosion.png',
		'assets/effects/explosion.json'
	);
}

export function createEffectAnimations(scene) {
	// Create explosion animation
	scene.anims.create({
		key: 'explosion',
		frames: scene.anims.generateFrameNames('explosion', {
			prefix: 'enemy_afterdead_explosion_anim_f',
			start: 0,
			end: 3,
			suffix: '.png',
		}),
		frameRate: 12,
		repeat: 0, // Play once
	});

	// Create slash animation
	scene.anims.create({
		key: 'slash',
		frames: scene.anims.generateFrameNames('slash', {
			prefix: 'slash_effect_anim_f',
			start: 0,
			end: 2,
			suffix: '.png',
		}),
		frameRate: 20,
		repeat: 0, // Play once
	});

	// Create hit animation
	scene.anims.create({
		key: 'hit',
		frames: scene.anims.generateFrameNames('hit', {
			prefix: 'hit_effect_anim_f',
			start: 0,
			end: 2,
			suffix: '.png',
		}),
		frameRate: 15,
		repeat: 0, // Play once
	});
}

// Create a death explosion at specified coordinates
export function createDeathExplosion(scene, x, y) {
	const explosion = scene.add.sprite(x, y, 'explosion');
	explosion.setScale(2);

	// Play animation
	explosion.play('explosion');

	// Remove the sprite when the animation completes
	explosion.on('animationcomplete', () => {
		explosion.destroy();
	});

	return explosion;
}

// Create a slash effect at specified coordinates with rotation
export function createSlashEffect(scene, x, y, angle, flipX = false) {
	const slash = scene.add.sprite(x, y, 'slash');
	slash.setScale(1.5);
	slash.setAngle(angle);
	slash.setFlipX(flipX);

	// Play animation
	slash.play('slash');

	// Remove the sprite when the animation completes
	slash.on('animationcomplete', () => {
		slash.destroy();
	});

	return slash;
}

// Create a hit effect at specified coordinates
export function createHitEffect(scene, x, y) {
	const hit = scene.add.sprite(x, y, 'hit');
	hit.setScale(1.5);

	// Play animation
	hit.play('hit');

	// Remove the sprite when the animation completes
	hit.on('animationcomplete', () => {
		hit.destroy();
	});

	return hit;
}

export function createItemEffectAnimations(scene) {
	// Create explosion animation for breakable items
	scene.anims.create({
		key: 'item-explosion',
		frames: scene.anims.generateFrameNames('item-explosion', {
			prefix: 'explosion_anim_f',
			frames: [0, 1, 2, 3, 4, 5, 6], // Use all frames in sequence
			suffix: '.png',
		}),
		frameRate: 15,
		repeat: 0, // Play once
	});
}

// Create an explosion effect at the specified tile position
export function createItemExplosion(scene, tileX, tileY) {
	// Convert tile coordinates to world coordinates (center of the tile)
	const worldX = tileX * scene.map.tileWidth + scene.map.tileWidth / 2;
	const worldY = tileY * scene.map.tileHeight + scene.map.tileHeight / 2;

	// Create explosion sprite
	const explosion = scene.add.sprite(worldX, worldY, 'item-explosion');
	explosion.setScale(1.2);

	// Play animation
	explosion.play('item-explosion');

	// Remove the sprite when the animation completes
	explosion.on('animationcomplete', () => {
		explosion.destroy();
	});

	return explosion;
}
