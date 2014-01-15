var ref = require('./modules/ref');
var ArrayType = require('./modules/ref-array');
var ffi = require('./modules/ffi');
var Struct = require('./modules/ref-struct');
var path = require('path')

var sp_port = ref.types.void; // ignore layout
var sp_portPtr = ref.refType(sp_port); sp_portPtr.size = ref.types.Object.size; // not automatic?
var sp_portPtrPtr = ref.refType(sp_portPtr);
var sp_portPtrPtrPtr = ref.refType(sp_portPtrPtr);
var PortArray = ArrayType(sp_portPtr)

var stringPtr = ref.refType(ref.types.CString);

var
	/** Open port for read access. */
	SP_MODE_READ = 1,
	/** Open port for write access. */
	SP_MODE_WRITE = 2,

	SP_SIG_CTS = 1,
	  /** Data set ready. */
	  SP_SIG_DSR = 2,
	  /** Data carrier detect. */
	  SP_SIG_DCD = 4,
	  /** Ring indicator. */
	  SP_SIG_RI = 8

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

	_dummy;

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
  'sp_set_dsr': [ 'int', [ sp_portPtr, 'int' ]]
});

function getPortName (port) {
	return sp.sp_get_port_name(port);
}

exports.list = function list () {
	var listPtrPtr = ref.alloc(sp_portPtrPtr);
	var err = sp.sp_list_ports(listPtrPtr);
	if (err == 0) {
		var ports = [].slice.call(PortArray.untilZeros(listPtrPtr.deref())).map(getPortName).map(function (name) {
			return { path: name };
		});
	}
	sp.sp_free_port_list(listPtrPtr.deref());
	return ports;
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
		sp.sp_nonblocking_write(port, data, data.length);
		next(null);
	};
	stream._read = function () {
	};

	var port = lookupPort(path);
	var ret = sp.sp_open(port, SP_MODE_READ | SP_MODE_WRITE);
	// console.log('open', ret);

	sp.sp_set_flowcontrol(port, SP_FLOWCONTROL_RTSCTS);
	sp.sp_set_rts(port, SP_RTS_ON);

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