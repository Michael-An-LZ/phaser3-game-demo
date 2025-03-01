export function createKnightAnimations(scene) {
	// Idle animation (Facing Right)
	scene.anims.create({
		key: 'knight-idle-right',
		frames: scene.anims.generateFrameNames('knight', {
			start: 0,
			end: 5,
			prefix: 'knight_idle_anim_f',
			suffix: '.png',
		}),
		repeat: -1,
		frameRate: 10,
	});

	// Run animation (Facing Right)
	scene.anims.create({
		key: 'knight-run-right',
		frames: scene.anims.generateFrameNames('knight', {
			start: 0,
			end: 5,
			prefix: 'knight_run_anim_f',
			suffix: '.png',
		}),
		repeat: -1,
		frameRate: 15,
	});

	// Idle animation (Facing Left) - Reuse right animation but flipped
	scene.anims.create({
		key: 'knight-idle-left',
		frames: scene.anims.generateFrameNames('knight', {
			start: 0,
			end: 5,
			prefix: 'knight_idle_anim_f',
			suffix: '.png',
		}),
		repeat: -1,
		frameRate: 10,
	});

	// Run animation (Facing Left) - Reuse right animation but flipped
	scene.anims.create({
		key: 'knight-run-left',
		frames: scene.anims.generateFrameNames('knight', {
			start: 0,
			end: 5,
			prefix: 'knight_run_anim_f',
			suffix: '.png',
		}),
		repeat: -1,
		frameRate: 15,
	});
}

export function createGoblinAnimations(scene) {
	// Goblin Idle (Facing Right)
	scene.anims.create({
		key: 'goblin-idle-right',
		frames: scene.anims.generateFrameNames('goblin', {
			start: 0,
			end: 5,
			prefix: 'goblin_idle_anim_f',
			suffix: '.png',
		}),
		frameRate: 6,
		repeat: -1,
	});

	// Goblin Run (Facing Right)
	scene.anims.create({
		key: 'goblin-run-right',
		frames: scene.anims.generateFrameNames('goblin', {
			start: 0,
			end: 5,
			prefix: 'goblin_run_anim_f',
			suffix: '.png',
		}),
		frameRate: 10,
		repeat: -1,
	});

	// Goblin Idle (Facing Left) - Use Right Frames but Flip
	scene.anims.create({
		key: 'goblin-idle-left',
		frames: scene.anims.generateFrameNames('goblin', {
			start: 0,
			end: 5,
			prefix: 'goblin_idle_anim_f',
			suffix: '.png',
		}),
		frameRate: 6,
		repeat: -1,
	});

	// Goblin Run (Facing Left) - Use Right Frames but Flip
	scene.anims.create({
		key: 'goblin-run-left',
		frames: scene.anims.generateFrameNames('goblin', {
			start: 0,
			end: 5,
			prefix: 'goblin_run_anim_f',
			suffix: '.png',
		}),
		frameRate: 10,
		repeat: -1,
	});
}

export function createTorchAnimations(scene) {
	// Torch animation
	scene.anims.create({
		key: 'torch-flame',
		frames: scene.anims.generateFrameNames('torch', {
			frames: [0, 1, 2, 3, 4, 5], // Frames from the JSON
			prefix: 'torch_anim_f',
			suffix: '.png',
		}),
		frameRate: 8,
		repeat: -1, // Loop continuously
	});
}
