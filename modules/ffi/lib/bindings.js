
module.exports = require('bindings-shyp')({
  bindings: 'ffi_bindings.node',
  module_root: require('bindings-shyp').getRoot(__dirname + '/../../..')
})
