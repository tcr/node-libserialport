var test = require('tape')

test('list test', function (t) {
	t.plan(2);

	var libserialport = require('../');

	t.doesNotThrow(function () {
		libserialport.list(function (err, modems) {
			t.ok(typeof modems.length == 'number');
		})
	});
});