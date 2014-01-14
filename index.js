var ref = require('ref');
var ArrayType = require('ref-array');
var ffi = require('ffi');
var Struct = require('ref-struct');

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

var sp = ffi.Library('./build/Release/libserialport', {
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
  'sp_get_signals': [ 'int', [ sp_portPtr, "int *" ]]
});

function listPorts (next) {
	var listPtrPtr = ref.alloc(sp_portPtrPtr);
	var err = sp.sp_list_ports(listPtrPtr);
	if (err == 0) {
		var ports = [].slice.call(PortArray.untilZeros(listPtrPtr.deref()));
		ports.ptr = listPtrPtr;
	}
	next(err, ports);
}

function open (port, flags) {
	return sp.sp_open(port, flags);
}

function close (port) {
	return sp.sp_close(port);
}

function getPortName (port) {
	return sp.sp_get_port_name(port);
}

function freePortList (ports) {
	sp.sp_free_port_list(ports.ptr.deref());
}


listPorts(function (err, ports) {
	ports.forEach(function (port) {
		console.log(getPortName(port));
	})

	var port = ports.filter(function (port) {
		return getPortName(port).match(/^\/dev\/(tty|cu)\.usbmodem.*$/);
	})[0];

	var ret = open(port, SP_MODE_READ | SP_MODE_WRITE);
	console.log('open', ret);

	var buf = new Buffer(32);
	buf.fill(0);
	var poller = setInterval(function () {
		var signals = ref.alloc("int");
		sp.sp_get_signals(port, signals);
		if (!(signals.deref() & SP_SIG_CTS)) {
			var ret = close(port);
			console.log('close', ret);
			freePortList(ports);
			clearInterval(poller);
			return;
		}

		// Normal stuff
		do {
			var read = sp.sp_nonblocking_read(port, buf, 32);
			process.stdout.write(buf.slice(0, read).toString())
		} while (read > 0);
	});
})