'use strict';

const path = require('path');
const fs = require('fs');
const gulp = require('gulp');
const gutil = require('gulp-util');
const browserSync = require('browser-sync').create();
const opn = require('opn');
const rev = require('gulp-rev');
const revCollector = require('gulp-rev-collector');
const replace = require('gulp-replace');
const uglify = require('gulp-uglify');
const transport = require('gulp-seajs-transport');
const seaConcat = require('gulp-seajs-concat');
const concat = require('gulp-concat');
const rename = require('gulp-rename');
// var imagemin = require('imagemin');
// var imageminMozjpeg = require('imagemin-mozjpeg');
// var imageminPngquant = require('imagemin-pngquant');

const imagemin = require('gulp-imagemin');
const smushit = require('gulp-smushit');
const pngquant = require('imagemin-pngquant'); // 深度压缩

const config = JSON.parse(fs.readFileSync('config.json','utf-8'));
const devConfig = JSON.parse(fs.readFileSync('build/dev.json','utf-8'));
const utils = require('../utils.js');

module.exports = {

	// seajs匿名模块转为具名模块
	jsTransport() {

		let srcArr = ['js/*.js'];
		for (let item of config.tsIgnore) {
			srcArr.push('!js/' + item);
		}

		gutil.log(config.entry + '.js 更新成功');
		return gulp.src(srcArr, {base: 'js'})
			.pipe(transport())
			.pipe(concat(config.entry + '.js'))
			.pipe(gulp.dest('dist/js'))
            .pipe(concat(config.entry.split('-')[0] + '.js'))
            .pipe(gulp.dest('dist/js'));

	},

	// 初始化路径信息
	initPath() {

		let dirArrs = __dirname.split(path.sep);
		let fullYear = (new Date()).getFullYear();
		let channel = dirArrs[dirArrs.length - 3];

		let devUrl = '';
		let cdnPath = '';
		let cdnDevPath = '';
		let proUrl = '';

		// 判断是否为平台活动
		let game = config.game;
		if (dirArrs[dirArrs.length - 5] == 'activity') {
			game = dirArrs[dirArrs.length - 6];

			devUrl = game + '/activity/' + fullYear + '/' + channel + '/';
			cdnPath = 'http://pic.my4399.com/re/cms/' + devUrl;
			cdnDevPath = 'http://pic.dev.4399.com/re/cms/' + devUrl;
			proUrl = game + '/hd/' + config.classifySrc + '/';
		}
		else {
			devUrl = 'hd/' + fullYear + '/' + channel + '/';
			cdnPath = 'http://pic.my4399.com/re/cms/' + devUrl;
			cdnDevPath = 'http://pic.dev.4399.com/re/cms/' + devUrl;
			proUrl = 'hd/' + config.classifySrc + '/';
		}


		let devConfig = {
			devUrl: devUrl,
			cdnPath: cdnPath,
			cdnDevPath: cdnDevPath,
			proUrl: proUrl
		};

		fs.writeFile('build/dev.json', JSON.stringify(devConfig, null, 4), function(err) {
			if (!err) {
				gutil.log("dev.json 写入成功！")
			}
		});


		let fileList = utils.walk('js');
		if (fileList.indexOf('entry.js') === -1) {
			gulp.src('build/entry.js')
				.pipe(gulp.dest('js'));
		}

	},

	// 打开本地环境
	browerLocal() {
		let _this = this;
		browserSync.init({
			port: 3002
		});

		opn('http://web.local.4399.com/' + devConfig.devUrl);

		gulp.watch('*.html').on('change', browserSync.reload);
		gulp.watch('js/*.js').on('change', function() {
			_this.jsTransport();
			browserSync.reload();
		});
	},

	// 打开测试环境
	browerDev() {
		opn('http://web.dev.4399.com/' + devConfig.proUrl);
        // opn('http://cms.4399houtai.com/html/' + devConfig.proUrl);
	},

	// 打开正式环境
	browerPro() {
		opn('http://web.4399.com/' + devConfig.proUrl);
	},

	// 压缩图片
	imageMin() {
		gulp.src('./images/*.png')
			.pipe(smushit({
				verbose: true
			}))
			.pipe(imagemin({
				progressive: true,
				svgoPlugins: [{removeViewBox: false}],
				use: [pngquant()]
			}))
			.pipe(gulp.dest('./images/'));


	},

	// 压缩js
	jsMin() {
		return gulp.src('dist/js/*.js')
			.pipe(uglify({
				mangle: {except: ['require' ,'exports' ,'module' ,'$']} // 排除混淆关键字
			}))
			.pipe(gulp.dest('dist/js'));
	},

	// 生成版本号json
	jsRev() {

		let revPath = 'rev-manifest-' + utils.getDateString() + utils.getHourString() + '.json';

		return gulp.src('dist/js/' + config.entry.split('-')[0] + '.js')
			.pipe(rev())
			.pipe(gulp.dest('dist/js/'))
			.pipe(rev.manifest({
				path: revPath
			}))
			.pipe(replace('.js', ''))
			.pipe(gulp.dest('build/rev/js'));



	},


	// 覆盖式发布 － 替换版本号
	jsReplace() {

        return gulp.src('dist/js/' + config.entry.split('-')[0] + '.js')
			.pipe(replace(config.entry.split('-')[0], config.entry))
			.pipe(rename(config.entry + '.js'))
			.pipe(gulp.dest('dist/js/'));

	},

	// 非覆盖式发布 － 替换版本号
	jsRevReplace() {

		let revStamp = 'rev-manifest-' + utils.revMax() + '.json';

		let revConfig = JSON.parse(fs.readFileSync('build/rev/js/' + revStamp,'utf-8'));

		config.entry = revConfig[config.entry.split('-')[0]];


		fs.writeFile('config.json', JSON.stringify(config, null, 4), function(err) {
			if (!err) {
				gutil.log("config.json 更新版本成功");
			}
		})



		return gulp.src(['build/rev/js/' + revStamp, 'dist/js/' + config.entry + '.js'])
			.pipe(revCollector({
				replaceReved: true,
			}))
			.pipe(gulp.dest('dist/js/'));
	}

	// jsRev() {
	// 	gulp.src(['js/*.js', '!js/config.js'])
	// 		.pipe(replace(/seajs.use([\s\S]*)[.js]{0}[\']{0,1}["]{0,1}\);/, "seajs.use(window.cdnPath + 'dist/js/"))
	// 		.pipe(rev())
	// 		.pipe(gulp.dest('dist/js/'))
	// 		.pipe(rev.manifest({
	// 			path: 'rev-manifest-' + utils.getDateString() + utils.getHourString() + '.json'
	// 		}))
	// 		.pipe(gulp.dest('build/rev/js'));
	//
	// 	let revStamp = 'rev-manifest-' + utils.revMax() + '.json';
	//
	// 	return gulp.src(['build/rev/js/' + revStamp, 'js/config.js'])
	// 		.pipe(revCollector({
	// 			replaceReved: true,
	// 		}) )
	// 		.pipe(replace(/\"/g, "'"))
	// 		.pipe(replace('/main\'', '/main.js\''))
	// 		.pipe(replace('/index\'', '/index.js\''))
	// 		.pipe(replace(/seajs.use([\s\S]*)js\//, "seajs.use(window.cdnPath + 'dist/js/"))
	// 		.pipe(replace('./js/', devConfig.cdnPath + 'dist/js/'))
	// 		.pipe(gulp.dest('dist/js/'));
	// },

	// jsCopy() {
	// 	gulp.src('./js/config.js')
	// 		.pipe(replace(/\"/g, "'"))
	// 		.pipe(replace('/main\'', '/main.js\''))
	// 		.pipe(replace('/index\'', '/index.js\''))
	// 		.pipe(replace(/seajs.use([\s\S]*)js\//, "seajs.use(window.cdnPath + 'dist/js/"))
	// 		.pipe(gulp.dest('./dist/js/'));
	//
	// 	return gulp.src(['./js/*.js', '!./js/config.js'])
	// 		.pipe(gulp.dest('./dist/js/'));
	// }

}
