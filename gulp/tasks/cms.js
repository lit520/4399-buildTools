'use strict';

const Q = require('q');
const co = require('../co');
const fs = require('fs');
const path = require('path');
const http = require('http');
const gutil = require('gulp-util');
const querystring = require('querystring');

const utils = require('../utils.js');
const config = JSON.parse(fs.readFileSync('config.json','utf-8'));
const cmsHost = 'cms.4399houtai.com';

module.exports = {

	createChannel: co.wrap(function *() {

		var data = {
			name: config.name,
			classify_src: config.classifySrc,
			list_template: config.template,
			content_template: config.template,
			order_index: '',
			state: '0',
			default_file: 'index.html',
			extend: ''
		};

		var params = querystring.stringify({
			game: config.game,
			data: JSON.stringify(data)

		});

		var options = {
			hostname: cmsHost,
			path: '/?ct=classify&ac=save',
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
				'Content-Length': Buffer.byteLength(params)
			}
		}

		let chunk = yield utils.httpRequest(options, params);

		if (chunk.cid) {
			fs.writeFile('build/api.json', JSON.stringify(chunk, null, 4), function(err) {
				if (!err) {
					gutil.log("api.json 写入成功！")
				}
			})
		}
		else {
			gutil.log('REPONSE: ' + chunk.tips);
		}

	}),

	saveTpl: co.wrap(function *() {

		var defered = Q.defer();

		var api = JSON.parse(fs.readFileSync('build/api.json','utf-8'));
		var fileData = fs.readFileSync('dist/index.html','utf-8');

		if (!api.channel) {
			gutil.log('请先执行init方法获得cms栏目id');
			defered.reject();
			return ;
		}

		var params = querystring.stringify({
			cid: api.channel,
			file: config.template,
			code: fileData

		});

		var options = {
			hostname: cmsHost,
			path: '/?ct=tpl&ac=save',
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
				'Content-Length': Buffer.byteLength(params)
			}
		}

		let chunk = yield utils.httpRequest(options, params);

		if (chunk == 'ok') {
			defered.resolve();
		}
		else {
			gutil.log('保存模板失败');
			defered.reject();
		}

		return defered.promise;
	}),

	makeTpl: co.wrap(function *() {

		var deferred = Q.defer();

		// 生成模板
		const makeTpl = co.wrap(function *() {
			let deferred = Q.defer();

			let config = JSON.parse(fs.readFileSync('build/api.json','utf-8'));
			let params = querystring.stringify({
				channel: config.channel,
				cid: config.cid,
				just_list: 0,
				post_date: 1

			});

			let options = {
				hostname: cmsHost,
				path: '/?ct=view&ac=taskpro',
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
					'Content-Length': Buffer.byteLength(params)
				}
			};

			let chunk = yield utils.httpRequest(options, params);

			if (chunk.state == true) {
				var sign = chunk.data;
				deferred.resolve(sign);
			}
			else {
				gutil.log('模板生成失败: ' + chunk.msg)
			}

			return deferred.promise;

		});

		// 模板生成进度
		const makePro = co.wrap(function *(sign) {

			let deferred = Q.defer();

			let taskProcess = setInterval(co.wrap(function *() {

				let params = querystring.stringify({
					sign: sign
				});

				let options = {
					hostname: cmsHost,
					path: '/?ct=view&ac=taskFinish&' + params,
					method: 'GET'
				};

				let chunk = yield utils.httpRequest(options, params);

				gutil.log(Math.ceil(chunk.data * 100) + '%');

				if (chunk.data == 1) {
					clearInterval(taskProcess);
					deferred.resolve();
				}

			}), 1000);

			return deferred.promise;

		});

		// 模板生成是否成功
		const makeError = co.wrap(function *(sign) {

			let deferred = Q.defer();

			let params = querystring.stringify({
				sign: sign
			});

			let options = {
				hostname: cmsHost,
				path: '/?ct=view&ac=taskError&' + params,
				method: 'GET'
			};

			let chunk = yield utils.httpRequest(options, params);

			if (chunk.data.length == 0) {
				gutil.log('模板生成成功。');
				deferred.resolve(1);
			}
			else {
				gutil.log('模板生成失败: ' + chunk.data[0].msg + ' , 详情请点击 ' + chunk.data[0].url);
				deferred.resolve(0);
			}


			return deferred.promise;
		});

		let sign = yield makeTpl();
		yield makePro(sign);
		let flag = yield makeError(sign);

		// flag == 1 生成成功，否则失败
		if (flag == 1) {
			deferred.resolve();
		}

		return deferred.promise;
	}),

	// 推送模板到线上服务器
	pushTpl: co.wrap(function *() {

		var deferred = Q.defer();
		let config = JSON.parse(fs.readFileSync('build/api.json','utf-8'));
		let params = querystring.stringify({
			cid: config.channel
		});

		let options = {
			hostname: cmsHost,
			path: '/?ct=view&ac=rsync&' + params,
			method: 'GET'
		};

		let chunk = yield utils.httpRequest(options, params);

		if (chunk.state == false) {
			gutil.log('推送失败: ' + chunk.msg);
		}
		else {
			gutil.log('模板推送成功，' + chunk.siteurl);
		}

		deferred.resolve();

		return deferred.promise;

	})


}