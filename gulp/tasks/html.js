"use strict";

const gulp = require('gulp');
const replace = require('gulp-replace');
const fs = require('fs');
const rename = require('gulp-rename');
const del = require('del');

const config = JSON.parse(fs.readFileSync('config.json','utf-8'));
const devConfig = JSON.parse(fs.readFileSync('build/dev.json','utf-8'));

module.exports = {

	initHtml() {

		gulp.src('./*.html')
			.pipe(replace('href="#"', 'href="javascript:;"'))
			.pipe(replace('href=""', 'href="javascript:;"'))
			.pipe(replace('<script>\n	window.cdnPath = \'.\';\n<\/script>', ''))
			.pipe(replace('seajs/3.0.0/sea.js"><\/script>', 'seajs/3.0.0/sea.js"><\/script>\n<script>\n	window.cdnPath = \'.\';\n<\/script>'))
			.pipe(replace('seajs/3.0.0/sea.js" ><\/script>', 'seajs/3.0.0/sea.js" ><\/script>\n<script>\n	window.cdnPath = \'.\';\n<\/script>'))
			.pipe(replace(/seajs.use(([\s\S]*));/, `seajs.use("${config.entry.split('-')[0]}.js");`))
			.pipe(replace('src="js/config.js"><\/script>', 'src="http://pic.my4399.com/re/cms/ceshi/activity/2017/demo1/js/config.js"><\/script>\n	<script >\n		seajs.use("' + config.entry + '");\n	</script>'))
			.pipe(replace('src="./js/config.js"><\/script>', 'src="http://pic.my4399.com/re/cms/ceshi/activity/2017/demo1/dist/js/config.js"><\/script>\n	<script >\n		seajs.use("' + config.entry + '");\n	</script>'))
			.pipe(replace(/	<script id="__bs_script__">([\s\S]*)<\/script>[\n \r\n]{0,}/g, ''))
			.pipe(replace(/<link href="http:\/\/webpic.my4399.com\/easydialog.css" rel="stylesheet" type="text\/css" \/>[\n \r\n]{0,}/g, ''))
			.pipe(replace('</title>', '</title>\n 	<link href="http://webpic.my4399.com/easydialog.css" rel="stylesheet" type="text/css" />'))
			.pipe(replace('</body>', '	<script id="__bs_script__">' +
				'\n 		var lowIE = !-[1,];if (!lowIE) {document.write(\'<script async src="http://HOST:3002/browser-sync/browser-sync-client.js?v=2.18.8"><\\/script>\'.replace("HOST", location.hostname))};\n	</script>\n</body>'))
			.pipe(gulp.dest('./'));

		gulp.src('./web.html')
			.pipe(rename('index.html'))
			.pipe(gulp.dest('./'));

		del(['./web.html']);

	},

	buildHtml(isDev) {

		let game = config.game;
		let cdnPath = isDev == 1 ? devConfig.cdnDevPath : devConfig.cdnPath;
		let cdnDevPath = devConfig.cdnDevPath;

		return gulp.src('./*.html')
			.pipe(replace('sea.js"><\/script>', 'sea.js"><\/script>\n	<script>\n		if (location.href.indexOf(\'dev.4399.com\') !== -1) {\n			window.cdnPath = \'' + cdnDevPath + '\';\n		} else {\n			window.cdnPath = \'' + cdnPath + '\';\n		}\n 	</script>\n'))
			.pipe(replace('<\/head>', '	<script>\n		otj_json.cid = ' + config.cid + ';\n		otj_json.game = \'' + game + '\';\n	</script>\n	</head>'))
			.pipe(replace('<script>\n	window.cdnPath = \'.\';\n<\/script>', ''))
			.pipe(replace('src="js/', 'src="' + cdnPath + 'dist/js/'))
			.pipe(replace('src="./js/', 'src="' + cdnPath + 'dist/js/'))
			.pipe(replace('style/', cdnPath + 'style/'))
			.pipe(replace('css/', cdnPath + 'css/'))
			.pipe(replace('./style/', cdnPath + 'style/'))
			.pipe(replace('./css/', cdnPath + 'css/'))
			.pipe(replace('src="images/', 'src="' + cdnPath + 'images/'))
			.pipe(replace('src="./images/', 'src="' + cdnPath + 'images/'))
			.pipe(replace('src="img/', 'src="' + cdnPath + 'img/'))
			.pipe(replace('src="./img/', 'src="' + cdnPath + 'img/'))
			.pipe(replace('src="video/', 'src="' + cdnPath + 'video/'))
			.pipe(replace('src="./video/', 'src="' + cdnPath + 'video/'))
			.pipe(replace('../images/', '' + cdnPath + 'images/'))
			.pipe(replace('src="temp/', 'src="' + cdnPath + 'temp/'))
			.pipe(replace('src="./temp/', 'src="' + cdnPath + 'temp/'))
			.pipe(replace('./', cdnPath))
			.pipe(replace('swf/', cdnPath + 'swf/'))
			.pipe(replace('./swf/', cdnPath + 'swf/'))
			.pipe(replace(/seajs.use(([\s\S]*));/, `seajs.use("${config.entry}.js?v=${(new Date).getTime()}");`))
			.pipe(replace(/<script id="__bs_script__">([\s\S]*)<\/script>/g, ''))
			// .pipe(inlineImg(''))
			.pipe(gulp.dest('dist'));

	}

}


