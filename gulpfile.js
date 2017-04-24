'use strict';


// cnpm install
// config.json 栏目信息
// 各模块标识
// entry.js 引入主模块
// local
// 增加module1
// 发布测试环境
// 增加module2
// 发布正式环境
// 增加module3
// 非覆盖式发布
// 增加module4
// 非覆盖式发布


const gulp = require('gulp');
const gutil = require('gulp-util');

const svnTask = require('./gulp/tasks/svn.js');
const cmsTask = require('./gulp/tasks/cms.js');
const htmlTask = require('./gulp/tasks/html.js');
const flowTask = require('./gulp/tasks/flow.js');

const runSequence = require('gulp-sequence');


gulp.task('init', function() {
	runSequence('html:init', 'flow:initPath', 'cms:createChannel', 'svn:addRoot')(function(err) {
		if (err) gutil.log(err)
	});
});

// cms推送html
gulp.task('cms:push', function() {
	return runSequence('html:build', 'cms:saveTpl', 'cms:makeTpl', 'cms:pushTpl')(function(err) {
		if (err) gutil.log(err)
	});
});

// cms生成html
gulp.task('cms:make', function() {
	return runSequence('html:buildDev', 'cms:saveTpl', 'cms:makeTpl')(function(err) {
		if (err) gutil.log(err)
	});
});

// 非覆盖式发布
gulp.task('release:unCover', function() {
	runSequence('flow:jsTransport', 'js:rev', 'svn:addTree','svn:commit')(function(err) {
		if (err) gutil.log(err)
	});
});

// 覆盖式发布
gulp.task('release:cover', function() {
	runSequence('flow:jsTransport', 'js:replace', 'svn:addTree','svn:commit')(function(err) {
		if (err) gutil.log(err)
	});
});

// 打开开发环境
gulp.task('brower:local', function() {
	return flowTask.browerLocal();
});

// 打开测试环境
gulp.task('brower:dev', function() {
	return flowTask.browerDev();
});

// 打开正式环境
gulp.task('brower:pro', function() {
	return flowTask.browerPro();
});

// 图片压缩
gulp.task('image:min', function() {
	return flowTask.imageMin();
});

// 添加所有目录至svn
gulp.task('svn:add', function() {
	runSequence('svn:addRoot', 'svn:addTree')(function(err) {
		if (err) gutil.log(err)
	});
});

// 添加根目录至svn
gulp.task('svn:addRoot', function() {
	return svnTask.addRoot();
});

// 添加子目录文件至svn
gulp.task('svn:addTree', function() {
	return svnTask.addTree();
});

// 提交所有文件至svn
gulp.task('svn:commit', function(path) {
	return svnTask.commit();
});

// 保存模板
gulp.task('cms:saveTpl', function() {
	return cmsTask.saveTpl();
});

// 创建栏目
gulp.task('cms:createChannel', function() {
	return cmsTask.createChannel();
});

// 生成模板
gulp.task('cms:makeTpl', function() {
	return cmsTask.makeTpl();
});

// 推送模板
gulp.task('cms:pushTpl', function() {
	return cmsTask.pushTpl();
});

// 压缩Js
gulp.task('js:min',function(){
	return flowTask.jsMin();
});

// 编译html
gulp.task('html:build', function() {
	return htmlTask.buildHtml(0);
});


// 编译html,测试环境
gulp.task('html:buildDev', function() {
	return htmlTask.buildHtml(1);
});

// 初始化html
gulp.task('html:init', function() {
	return htmlTask.initHtml();
});

// 生成新版本js资源
gulp.task('js:rev', function() {
	return runSequence('flow:rev', 'flow:revReplace')(function(err) {
		if (err) gutil.log(err)
	});
});

gulp.task('flow:rev', function() {
	return flowTask.jsRev();
});

gulp.task('flow:revReplace', function() {
	return flowTask.jsRevReplace();
});

gulp.task('js:replace', function() {
    return flowTask.jsReplace();
});

// 初始化项目路径配置
gulp.task('flow:initPath', function() {
	return flowTask.initPath();
});

// seajs具名化
gulp.task('flow:jsTransport', function() {
	return flowTask.jsTransport();
});
