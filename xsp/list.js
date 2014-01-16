var fs = require('fs');
var _path = require('path');
var exec = require('child_process').exec;

function list (next) {
	if (process.platform == 'darwin') {
		next(null, []);
	} else if (process.platform == 'windows') {
		next(null, []);
	} else if (process.platform == 'linux') {
		// linux
		exec('find /sys/devices | grep usb | grep \"tty\\w\\+$\"', function (err, stdout, stderr) {
			var modems = !err && stdout.split(/\r?\n/).filter(function (a) {
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

			next(err, modems || []);
		});
	} else {
		next(new Error('No support for listing modems on this platform.'), [])
	}
}

list(function (err, modems) {
	console.log('Modems:', modems);
})