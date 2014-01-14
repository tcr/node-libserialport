{
  'target_defaults': {
    'default_configuration': 'Debug',
    'configurations': {
      'Debug': {
        'defines': [ 'DEBUG', '_DEBUG' ],
        'msvs_settings': {
          'VCCLCompilerTool': {
            'CompileAsCpp': 1,
            'RuntimeLibrary': 0, # shared debug
          },
        },
      },
      'Release': {
        'defines': [ 'NDEBUG' ],
        'msvs_settings': {
          'VCCLCompilerTool': {
            'CompileAsCpp': 1,
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
        'serialport.cc',
      ],
      'conditions': [
        ['OS=="linux"', {
          'sources': [
            'linux_termios.c'
          ],
        }]
      ],
    }
  ]
}