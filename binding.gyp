{
  'target_defaults': {
    'default_configuration': 'Debug',
    'configurations': {
      'Debug': {
        'defines': [ 'DEBUG', '_DEBUG' ],
        'msvs_settings': {
          'VCCLCompilerTool': {
            'RuntimeLibrary': 0, # shared debug
          },
        },
      },
      'Release': {
        'defines': [ 'NDEBUG' ],
        'msvs_settings': {
          'VCCLCompilerTool': {
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
    # disphelper
    {
      'target_name': 'disphelper',
      'type': 'static_library',
      'conditions': [
        ['OS=="win"', {
          'sources': [
            'disphelper.c'
          ]
        }]
      ]
    },

    # libserialport
    {
      'target_name': 'serialport',
      'product_prefix': 'lib',
      'type': 'shared_library',
      'sources': [
        'serialport.c',
        'xserialport.cc'
      ],
      'msvs_settings': {
        'VCCLCompilerTool': {
          'CompileAs': 2
        }
      },
      'conditions': [
        ['OS=="linux"', {
          'sources': [
            'linux_termios.c'
          ],
          'libraries': [
            '-ludev'
          ],
          'defines': [
            'HAVE_LIBUDEV=1'
          ]
        }],
        ['OS=="win"', {
          'dependencies': [
            'disphelper'
          ]
        }]
      ]
    },

    # dummy
    {
      'target_name': 'binding',
      'sources': [
        'dummy.cc'
      ]
    }
  ]
}