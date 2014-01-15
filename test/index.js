var libserialport = require('../');

var ports = libserialport.list();
console.log(ports);

var port = ports.filter(function (port) {
	return port.path.match(/^\/dev\/(tty|cu)\.usbmodem.*$|^COM\d+$/);
})[0];

var modem = libserialport.open(port.path);
modem.on('data', function (data) {
	process.stdout.write(data.toString())
})

setTimeout(function () {
	// console.log('hey listen');
	modem.write(new Buffer(['V'.charCodeAt(0), 0, 0, 0, 0]))
}, 2000);

var ctshigh = false;
modem.on('cts', function (cts) {
	console.log('--> cts:', cts);
	if (cts) {
		ctshigh = true;
	} else if (ctshigh) {
		modem.close();
	}
})
modem.on('close', function () {
	console.log('close');
})