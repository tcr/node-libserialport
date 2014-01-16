{
  'target_defaults': {
    'default_configuration': 'Debug',
    'configurations': {
      'Debug': {
        'defines': [ 'DEBUG', '_DEBUG' ],
        'msvs_settings': {
          'VCCLCompilerTool': {
            'CompileAs': 2,
            'RuntimeLibrary': 0, # shared debug
          },
        },
      },
      'Release': {
        'defines': [ 'NDEBUG' ],
        'msvs_settings': {
          'VCCLCompilerTool': {
            'CompileAs': 2,
            'RuntimeLibrary': 1, # shared release
          },
        },
      }
    },
    'msvs_settings': {
      'VCLinkerTool': {
        'GenerateDebugInformation': 'true',
      },
    },
    'include_dirs': [
      '.'
    ],
    'defines': [
    ],
    'conditions': [
      ['OS=="win"', {
        'defines': [
          '_WIN32'
        ]
      }]
    ],
  },

  'targets': [
    # libserialport
    {
      'target_name': 'serialport',
      'product_prefix': 'lib',
      'type': 'shared_library',
      'sources': [
        'serialport.c',
      ],
      'conditions': [
        ['OS=="linux"', {
          'sources': [
            'linux_termios.c'
          ],
          'libraries': [
            '-ludev'
          ],
          'defines': [
            'HAVE_LIBUDEV'
          ]
        }]
      ],
      'dependencies': [
        'modules/ffi/binding.gyp:ffi_bindings',
        'modules/ref/binding.gyp:binding'
      ]
    }
  ]
}