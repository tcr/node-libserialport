var fs = require('fs');
var _path = require('path');
var exec = require('child_process').exec;

exec('find /sys/devices | grep usb | grep \"tty\\w\\+$\"', function (err, stdout, stderr) {
	stdout.split(/\r?\n/).filter(function (a) {
		return (a);
	}).forEach(function (path) {
		console.log(path.replace(/[^\/]+:[^:]+$/, ''))
	})
});