var fs = require('fs');
var _path = require('path');
var exec = require('child_process').exec;

exec('find /sys/devices | grep usb | grep tty', function (err, stdout, stderr) {
	console.log(stdout);
});