const svn = require("gulp-svn");
const Q = require('q');
const utils = require('../utils.js');

const svnIgnore = [
	'build',
	'.idea',
	'node_modules',
	'sass',
	'config.rb',
	'.sass-cache',
	'tpl',
	'gulp',
	'gulpfile.js',
	'package.json',
	'.DS_Store'
];

module.exports = {
	addRoot() {
		let status = svn.statusSync(' --non-recursive ./ ');
		if (status.toString().slice(0, 1) != 'A') {
			svn.addSync(' --non-recursive ./ ');
		}
		return false;
	},

	addTree() {

		var defered = Q.defer();

		var fileList = utils.walk('./');

		fileList.forEach(function(item, index) {
			if (svnIgnore.indexOf(item) === -1) {
				svn.addSync(item, {args: '  --force '});
			}

			if (index == fileList.length - 1) {
				defered.resolve();
			}

		});

		return defered.promise;
	},

	commit() {
		return svn.commit('all-commit ', function(err){
			if(err) throw err;
		});
	}
};