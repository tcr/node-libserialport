var fs = require('fs');
var _path = require('path');

function readdirRecursive (baseDir, fn) {
    baseDir = baseDir.replace(/\/$/, '');

    var waitCount = 0;

    function readdirRecursive(curDir) {
        var prependcurDir = function(fname){
            return _path.join(curDir, fname);
        };

        waitCount++;
        fs.readdir(curDir, function(e, curFiles) {
            if (e) {
                fn(e);
                return;
            }
            waitCount--;

            curFiles = curFiles.map(prependcurDir);

            curFiles.forEach(function(it) {
                waitCount++;

                fs.stat(it, function(e, stat) {
                    waitCount--;

                    if (e) {
                        fn(e);
                    } else {
                        if (stat.isDirectory()) {
                            readdirRecursive(it);
                        }
                    }

                    if (waitCount == 0) {
                        fn(null, null);
                    }
                });
            });

            fn(null, curFiles.map(function(val) {
                // convert absolute paths to relative
                return _path.relative(baseDir, val);
            }));

            if (waitCount == 0) {
                fn(null, null);
            }
        });
    };

    readdirRecursive(baseDir);
}

readdirRecursive('/sys/', function (err, path) {
	if (path === null) {
		console.log('done');
	}
})