const path = require('path');
const fs = require('fs');
const http = require('http');

module.exports = {

	// 获得最新的版本号
	revMax() {
		var fileList = this.walk('build/rev/js');
		var revStamp = [];
		fileList.forEach(function(item) {
			var stamp = (item.split('.')[0]).split('-')[2];
			if (!isNaN(stamp)) {
				revStamp.push(stamp);
			}
		})

		return Math.max.apply(null, revStamp);
	},

	// 遍历所有目录
	walk(path) {
		var fileList = [];
		var dirList = fs.readdirSync(path);
		dirList.forEach(function(item){

			fileList.push(item);

		});

		return fileList;
	},

	// 获得当前的时分秒
	getHourString() {
		var d = new Date();
		var hour = d.getHours();
		var minute = d.getMinutes();
		var second = d.getSeconds();
		hour = hour > 9 ? hour : '0' + hour;
		minute = minute > 9 ? minute : '0' + minute;
		second = second > 9 ? second : '0' + second;

		var dateString = hour + '' + minute + '' + second;
		return dateString;
	},

	// 获得当天的日期  20170208
	getDateString() {
		var d = new Date();
		var year = d.getFullYear();
		var month = d.getMonth()+1;
		var date = d.getDate();
		month = month > 9 ? month : '0' + month;
		date = date > 9 ? date : '0' + date;

		var dateString = year +'' + month +'' + date;
		return dateString;
	},

	// 封装http请求
	httpRequest(options, params, timeout = 3000) {

		return new Promise((resolve, reject) => {

			let req = http.request(options, function (res) {
				res.setEncoding('utf8');
				res.on('data', function (chunk) {
					try {
						chunk = JSON.parse(chunk);
					}
					catch(e) {
						chunk = chunk;
					}

					resolve(chunk);
				});
			});

			req.write(params);
			req.on('error', function (e) {
				gutil.log('problem with request: ' + e.message);
			});
			req.end();

		});
	}
}