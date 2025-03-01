import GameScene from './GameScene.js';

const config = {
	type: Phaser.AUTO,
	width: 320,
	height: 320,
	pixelArt: true,
	physics: {
		default: 'arcade',
		arcade: {
			gravity: { y: 0 },
			debug: false,
		},
	},
	scene: [GameScene],
	scale: {
		mode: Phaser.Scale.FIT,
		autoCenter: Phaser.Scale.CENTER_BOTH,
	},
};

const game = new Phaser.Game(config);
