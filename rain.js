#!/usr/bin/env node
const ansi = require('ansi');
const color = require('color');
const cursor = ansi(process.stdout);
const chalk = require('chalk');
const cliCursor = require('cli-cursor');
const getPixels = require('get-pixels')

const clear = () => console.log('\033[2J');
cliCursor.hide();

const width = process.stdout.columns;
const height = process.stdout.rows;

const ramp = 'ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒｴｶｷﾑﾕﾗｾﾈｽﾀﾇﾍZ:・."=*+-<>¦｜çﾘｸㄥϛㄣƐ4日';

const rndFromRange = (min, max) => (Math.random() * (max - min)) + min;

let img;
let imgWidth;
let imgHeight;

const lumAtPixel = (x, y) => {
	const idx = ((imgWidth * parseInt(y, 10)) + parseInt(x, 10)) << 2;

	if (idx + 4 <= img.data.length) {
		const r = img.data[idx]
		const g = img.data[idx + 1]
		const b = img.data[idx + 2]
		const l = color({r, g, b}).hsl().color[2]
		return {r, g, b, l};
	}
}

const out = (x, y, char, col) => {
	if (x < 0 || x > width, y < 0 || y > height) {
		return false
	}
	let [r, g, b] = col;

	const pix = lumAtPixel(imgWidth / width * x, imgHeight / height * y);
	if (!pix) {return};
	const l = 0.4 + (0.6 / 100 * pix.l);
	r = parseInt(r * l);
	g = parseInt(g * l);
	b = parseInt(b * l);

	cursor.goto(x, y);

	cursor.rgb(r, g, b);
	if (l > 0.5) {
		cursor.write(chalk.bold.rgb(r,g,b)(char));
	} else {
		cursor.write(chalk.rgb(r,g,b)(char));
	}
}

const loadPixels = path => new Promise((resolve, reject) => {
	getPixels(path, (err, pixels) => {
		if (err) {
			return reject(err)
		}
		resolve(pixels)
	})
})

const genChars = len => {
	let chars = '';
	for (let i = 0; i < len; i += 1) {
		const x = parseInt(Math.random() * ramp.length);
		chars += ramp[x];
	}
	return chars;
};

const Strand = () => {
	const length = parseInt(rndFromRange(5, height * 1.5));
	const mutations = parseInt(rndFromRange(length * 0.125, length * 0.25));
	const fallSpeed = parseInt(rndFromRange(1, 3));
	const brightness = parseInt(rndFromRange(200, 255));
	let chars = genChars(length);
	let x = parseInt(Math.random() * width);
	let y = parseInt(Math.random() * height) - (height + 1);

	return {
		draw: () => {
			for (let i = 1; i < length; i += 1) {
				const green = parseInt(brightness / length * (length - i));
				const col = [0, green, 0]
				out(x, y - i, chars[i], col);
			}

			cursor.bold();
			out(x, y, chars[0], [255, 255, 255]);
			cursor.reset();

			for (let i = 0; i < fallSpeed + 1; i += 1) {
				out(x, y - length - i, ' ', [0, 0, 0]);
			}
		},

		fall: () => {
			y = parseInt(y + fallSpeed);
			if (y > height + length + fallSpeed) {
				y = 0;
				x = rndFromRange(0, width)
			}
		},

		mutate: () => {
			const nextChars = chars.split('');
			for (let i = 0; i < mutations; i += 1) {
			 	const index = parseInt(Math.random() * length);
			 	const x = parseInt(Math.random() * ramp.length - 1);
			 	nextChars[index] = ramp[x];
			}
			chars = nextChars.join('');
		}
	};
}


const Strands = count => {
	const strands = [];

	for (let i = 0; i < count; i += 1) {
		strands.push(Strand());
	}

	return {
		fall: () => strands.forEach(strand => strand.fall()),
		mutate: () => strands.forEach(strand => strand.mutate()),
		draw: () => strands.forEach(strand => strand.draw()),
	}
}

const strands = Strands(20);

(async () => {
	// clear();
	img = await loadPixels('./white-rabbit.jpg');
	imgWidth = img.shape[0];
	imgHeight = img.shape[1];

	setInterval(() => {
		strands.draw();
		strands.fall();
		strands.mutate();
	}, 1000 / 30);
})();
