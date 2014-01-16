# libserialport for node

A binding to [libserialport](http://sigrok.org/wiki/Libserialport) by the Sigrok project for Node.

## Install

```
npm install libserialport
```

Binary versions are provided for Windows and OS X. Linux requires node-gyp.

## Run

```js
var libserialport = require('libserialport');

libserialport.list(function (err, ports) {
	console.log(ports) // [ { path: '/dev/cu.usbmodem1411', ... } ]

	var serial = libserialport.open(ports[0])
	serial.on('data', function (data) {
		process.stdout.write(data);
	})
	serial.on('cts', function (cts) {
		// cts line changed
	})
	serial.close();
})
```

## License

LGPL3+ license.