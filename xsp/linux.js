var fs = require('fs');
var _path = require('path');
var exec = require('child_process').exec;

exec('find /sys/devices | grep usb | grep \"tty\\w\\+$\"', function (err, stdout, stderr) {
	stdout.split(/\r?\n/).filter(function (a) {
		return (a);
	}).forEach(function (path) {
		var com = path.split(/\//).filter(function (a) {
			return a;
		}).pop();
		console.log('COM:', com)
		var usbloc = path.replace(/[^\/]+:[^:]+$/, '');
		console.log('idVendor:', fs.existsSync(usbloc + 'idVendor') && fs.readFileSync(usbloc + 'idVendor', 'utf-8'));
		console.log('idProduct:', fs.existsSync(usbloc + 'idProduct') && fs.readFileSync(usbloc + 'idProduct', 'utf-8'));
	})
});