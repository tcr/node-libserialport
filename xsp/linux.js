var fs = require('fs');
var _path = require('path');
var exec = require('child_process').exec;

exec('find /sys/devices | grep usb | grep \"tty\\w\\+$\"', function (err, stdout, stderr) {
	var modems = stdout.split(/\r?\n/).filter(function (a) {
		return (a);
	}).map(function (path) {
		var com = path.split(/\//).filter(function (a) {
			return a;
		}).pop();
		var usbloc = path.replace(/[^\/]+:[^:]+$/, '');

		return {
			path: '/dev/' + com,
			manufacturer: '',
			serialNumber: '',
			pnpId: '',
			locationId: '',
			vendorId: fs.existsSync(usbloc + 'idVendor') && fs.readFileSync(usbloc + 'idVendor', 'utf-8').replace(/^\s+|\s+$/g, ''),
			productId: fs.existsSync(usbloc + 'idProduct') && fs.readFileSync(usbloc + 'idProduct', 'utf-8').replace(/^\s+|\s+$/g, '')
		}
	});

	console.log(modems);
});