var ref = require('ffi-shyp/ref');
var ArrayType = require('ffi-shyp/ref-array');
var ffi = require('ffi-shyp/ffi');
var StructType = require('ffi-shyp/ref-struct');
var path = require('path')
var fs = require('fs');

var sp_port = ref.types.void; // ignore layout
var sp_portPtr = ref.refType(sp_port); sp_portPtr.size = ref.types.Object.size; // not automatic?
var sp_portPtrPtr = ref.refType(sp_portPtr);
var sp_portPtrPtrPtr = ref.refType(sp_portPtrPtr);
var PortArray = ArrayType(sp_portPtr)

var stringPtr = ref.refType(ref.types.CString);

var strbuf = ArrayType(ref.types.char, 1024);
var ListResultItem = StructType({
	comName: strbuf,
	manufacturer: strbuf,
	serialNumber: strbuf,
	pnpId: strbuf,
	locationId: strbuf,
	vendorId: strbuf,
	productId: strbuf
})
var ListResultItemPtr = ref.refType(ListResultItem);
var ListResultItemPtrPtr = ref.refType(ListResultItemPtr);
var ListResultItemArray = ArrayType(ListResultItemPtr)

var

/** Return values. */
// enum sp_return {
	/** Operation completed successfully. */
	SP_OK = 0,
	/** Invalid arguments were passed to the function. */
	SP_ERR_ARG = -1,
	/** A system error occured while executing the operation. */
	SP_ERR_FAIL = -2,
	/** A memory allocation failed while executing the operation. */
	SP_ERR_MEM = -3,
	/** The requested operation is not supported by this system or device. */
	SP_ERR_SUPP = -4,
// };

/** Port access modes. */
// enum sp_mode {
	/** Open port for read access. */
	SP_MODE_READ = 1,
	/** Open port for write access. */
	SP_MODE_WRITE = 2,
// };

/** Port events. */
// enum sp_event {
	/* Data received and ready to read. */
	SP_EVENT_RX_READY = 1,
	/* Ready to transmit new data. */
	SP_EVENT_TX_READY = 2,
	/* Error occured. */
	SP_EVENT_ERROR = 4,
// };

/** Buffer selection. */
// enum sp_buffer {
	/** Input buffer. */
	SP_BUF_INPUT = 1,
	/** Output buffer. */
	SP_BUF_OUTPUT = 2,
	/** Both buffers. */
	SP_BUF_BOTH = 3,
// };

/** Parity settings. */
// enum sp_parity {
	/** Special value to indicate setting should be left alone. */
	SP_PARITY_INVALID = -1,
	/** No parity. */
	SP_PARITY_NONE = 0,
	/** Odd parity. */
	SP_PARITY_ODD = 1,
	/** Even parity. */
	SP_PARITY_EVEN = 2,
	/** Mark parity. */
	SP_PARITY_MARK = 3,
	/** Space parity. */
	SP_PARITY_SPACE = 4,
// };

/** RTS pin behaviour. */
// enum sp_rts {
	/** Special value to indicate setting should be left alone. */
	SP_RTS_INVALID = -1,
	/** RTS off. */
	SP_RTS_OFF = 0,
	/** RTS on. */
	SP_RTS_ON = 1,
	/** RTS used for flow control. */
	SP_RTS_FLOW_CONTROL = 2,
// };

/** CTS pin behaviour. */
// enum sp_cts {
	/** Special value to indicate setting should be left alone. */
	SP_CTS_INVALID = -1,
	/** CTS ignored. */
	SP_CTS_IGNORE = 0,
	/** CTS used for flow control. */
	SP_CTS_FLOW_CONTROL = 1,
// };

/** DTR pin behaviour. */
// enum sp_dtr {
	/** Special value to indicate setting should be left alone. */
	SP_DTR_INVALID = -1,
	/** DTR off. */
	SP_DTR_OFF = 0,
	/** DTR on. */
	SP_DTR_ON = 1,
	/** DTR used for flow control. */
	SP_DTR_FLOW_CONTROL = 2,
// };

/** DSR pin behaviour. */
// enum sp_dsr {
	/** Special value to indicate setting should be left alone. */
	SP_DSR_INVALID = -1,
	/** DSR ignored. */
	SP_DSR_IGNORE = 0,
	/** DSR used for flow control. */
	SP_DSR_FLOW_CONTROL = 1,
// };

/** XON/XOFF flow control behaviour. */
// enum sp_xonxoff {
	/** Special value to indicate setting should be left alone. */
	SP_XONXOFF_INVALID = -1,
	/** XON/XOFF disabled. */
	SP_XONXOFF_DISABLED = 0,
	/** XON/XOFF enabled for input only. */
	SP_XONXOFF_IN = 1,
	/** XON/XOFF enabled for output only. */
	SP_XONXOFF_OUT = 2,
	/** XON/XOFF enabled for input and output. */
	SP_XONXOFF_INOUT = 3,
// };

/** Standard flow control combinations. */
// enum sp_flowcontrol {
	/** No flow control. */
	SP_FLOWCONTROL_NONE = 0,
	/** Software flow control using XON/XOFF characters. */
	SP_FLOWCONTROL_XONXOFF = 1,
	/** Hardware flow control using RTS/CTS signals. */
	SP_FLOWCONTROL_RTSCTS = 2,
	/** Hardware flow control using DTR/DSR signals. */
	SP_FLOWCONTROL_DTRDSR = 3,
// };

/** Input signals. */
// enum sp_signal {
	/** Clear to send. */
	SP_SIG_CTS = 1,
	/** Data set ready. */
	SP_SIG_DSR = 2,
	/** Data carrier detect. */
	SP_SIG_DCD = 4,
	/** Ring indicator. */
	SP_SIG_RI = 8,
// };

	_dummy = null;

var sp = ffi.Library(path.join(path.dirname(require('bindings-shyp')({ bindings: 'binding', path: true })), 'libserialport'), {
  // Port enumeration
  'sp_list_ports': [ 'int', [ sp_portPtrPtrPtr ] ],
  'sp_free_port_list':	[ 'void', [ sp_portPtrPtr ] ],

  // Opening, closing, and querying ports
  'sp_open': [ 'int', [ sp_portPtr, 'int' ] ],
  'sp_close': [ 'int', [ sp_portPtr ] ],
  'sp_get_port_name': [ 'string', [ sp_portPtr ] ],

  // Reading, writing, and flushing data
  'sp_blocking_read': [ 'int', [ sp_portPtr, "void *", "size_t", "int" ] ],
  'sp_nonblocking_read': [ 'int', [ sp_portPtr, "void *", "size_t" ] ],
  'sp_blocking_write': [ 'int', [ sp_portPtr, "void *", "size_t", "int" ] ],
  'sp_nonblocking_write': [ 'int', [ sp_portPtr, "void *", "size_t" ] ],
  'sp_input_waiting': [ 'int', [ sp_portPtr ]],
  'sp_output_waiting': [ 'int', [ sp_portPtr ]],
  // 'sp_flush': [ 'int', [ sp_portPtr ]],
  'sp_drain': [ 'int', [ sp_portPtr ]],

  // more things
  'sp_get_signals': [ 'int', [ sp_portPtr, "int *" ]],

  'sp_set_flowcontrol': [ 'int', [ sp_portPtr, 'int' ]],
  'sp_set_rts': [ 'int', [ sp_portPtr, 'int' ]],
  'sp_set_cts': [ 'int', [ sp_portPtr, 'int' ]],
  'sp_set_dtr': [ 'int', [ sp_portPtr, 'int' ]],
  'sp_set_dsr': [ 'int', [ sp_portPtr, 'int' ]],
  
  // xserialport
  'xsp_list_ports': [ ListResultItemPtrPtr, [] ],
  'xsp_free_ports_list': [ 'int', [ ListResultItemPtrPtr ]]
});

function getPortName (port) {
	return sp.sp_get_port_name(port);
}

// exports.list = function list (next) {
// 	var listPtrPtr = ref.alloc(sp_portPtrPtr);
// 	var err = sp.sp_list_ports(listPtrPtr);
// 	if (err == 0) {
// 		var ports = [].slice.call(PortArray.untilZeros(listPtrPtr.deref())).map(getPortName).map(function (name) {
// 			return { path: name };
// 		});
// 	}
// 	sp.sp_free_port_list(listPtrPtr.deref());
// 	next(!ports, ports);
// }

var exec = require('child_process').exec;

exports.list = function (next) {
	if (process.platform == 'darwin' || process.platform == 'win32') {

		var ports = sp.xsp_list_ports();
		// var list = ListResultItemArray.untilZeros(ports.deref());
		var list = [].slice.call(new ListResultItemArray(ref.reinterpretUntilZeros(ports, ref.types.Object.size)))
			.map(function (res) {
				return {
					path: ref.readCString(res.deref().comName.buffer),
					manufacturer: ref.readCString(res.deref().manufacturer.buffer),
					serialNumber: ref.readCString(res.deref().serialNumber.buffer),
					pnpId: ref.readCString(res.deref().pnpId.buffer),
					locationId: ref.readCString(res.deref().locationId.buffer).replace(/^0x/, '').toLowerCase(),
					vendorId: ref.readCString(res.deref().vendorId.buffer).replace(/^0x/, '').toLowerCase(),
					productId: ref.readCString(res.deref().productId.buffer).replace(/^0x/, '').toLowerCase()
				};
			})
			.forEach(function (modem) {
				// Specific fixes for Windows here
				if (!modem.pnpId) {
					return;
				}
				if (!modem.vendorId) {
					modem.vendorId = (modem.pnpId.match(/VID_([0-9A-F])+/i) || ['', ''])[1].replace(/^0x/, '').toLowerCase()
				}
				if (!modem.productId) {
					modem.productId = (modem.pnpId.match(/PID_([0-9A-F])+/i) || ['', ''])[1].replace(/^0x/, '').toLowerCase()
				}
				if (!modem.serialNumber) {
					modem.serialNumber = modem.pnpId.split('\\\\').pop();
				}
			});
		sp.xsp_free_ports_list(ports);
		next(null, list);


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
					vendorId: fs.existsSync(usbloc + 'idVendor') && fs.readFileSync(usbloc + 'idVendor', 'utf-8').replace(/^\s+|\s+$/g, '').replace(/^0x/, '').toLowerCase(),
					productId: fs.existsSync(usbloc + 'idProduct') && fs.readFileSync(usbloc + 'idProduct', 'utf-8').replace(/^\s+|\s+$/g, '').replace(/^0x/, '').toLowerCase()
				}
			});

			next(err, modems || []);
		});
	} else {
		next(new Error('No support for listing modems on this platform.'), [])
	}
}

function lookupPort (path) {
	var listPtrPtr = ref.alloc(sp_portPtrPtr);
	var err = sp.sp_list_ports(listPtrPtr);
	if (err == 0) {
		// TODO GOTTA COPY
		var ports = [].slice.call(PortArray.untilZeros(listPtrPtr.deref()));
		return ports.filter(function (port) {
			return getPortName(port) == path;
		})[0]
	}
	sp.sp_free_port_list(ports.ptr.deref());
	return null;
}

exports.open = function (path) {
	var stream = new (require('stream').Duplex);
	stream._write = function (data, encoding, next) {
		while (true) {
			var num = sp.sp_blocking_write(port, data, data.length, 0);
			if (num < data.length) {
				data = data.slice(num);
			} else {
				break;
			}
		}
		next(null);
	};
	stream._read = function () {
	};

	var port = lookupPort(path);
	if (!port) {
		throw new Error('Port ' + path + ' not found.');
	}
	var ret = sp.sp_open(port, SP_MODE_READ | SP_MODE_WRITE);
	// console.log('open', ret);

	sp.sp_set_flowcontrol(port, SP_FLOWCONTROL_RTSCTS);
	sp.sp_set_rts(port, SP_RTS_ON);
	sp.sp_set_dtr(port, SP_DTR_ON);

	var buf = new Buffer(1024);
	buf.fill(0);
	var lastsignal = 0;
	var poller = setInterval(function () {
		var signals = ref.alloc("int");
		sp.sp_get_signals(port, signals);
		// console.log(signals.deref() & SP_SIG_CTS, lastsignal & SP_SIG_CTS);
		if ((signals.deref() & SP_SIG_CTS) != (lastsignal & SP_SIG_CTS)) {
			stream.emit('cts', signals.deref() & SP_SIG_CTS);
		}
		lastsignal = signals.deref();

		// Normal stuff
		do {
			var read = sp.sp_nonblocking_read(port, buf, buf.length);
			if (read > 0) {
				stream.push(buf.slice(0, read));
			}
		} while (read > 0);
	});

	stream.close = function () {
		clearInterval(poller);
		stream.emit('close');
		sp.sp_close(port);
	};

	return stream;
}