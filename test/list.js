var libserialport = require('..');

libserialport.list(function (err, modems) {
	console.log('Modems:', modems);
})