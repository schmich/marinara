const FileManagerPlugin = require('filemanager-webpack-plugin');
const WebpackTouch = require('webpack-touch');

module.exports = {
  configureWebpack: {
    node: false,
    // Disable eval. Required for Chrome extension CSP.
    // See https://github.com/webpack/webpack/issues/5627#issuecomment-374386048.
    devtool: 'inline-source-map',
    // Override vue-cli's file naming to keep consistent naming
    // between development and production builds.
    output: {
      filename: '[name].js',
      chunkFilename: '[name].js'
    },
    plugins: [
      new FileManagerPlugin({
        onStart: {
          // Ensure package/modules exists so WebpackTouch below works.
          mkdir: ['package/modules']
        },
        onEnd: {
          // Delete background.html after build since it is not used.
          delete: ['package/modules/background.html']
        }
      }),
      // Touch chunks after build to ensure they exist. This is necessary in development
      // since we don't build them, but we still refer to them (see manifest.json).
      new WebpackTouch({ filename: 'package/modules/chunk-vendors.js' }),
      new WebpackTouch({ filename: 'package/modules/chunk-common.js' })
    ]
  },
  // Leave CSS embedded in JS modules instead of
  // extracting it into dedicated .css files.
  css: {
    extract: false
  },
  publicPath: '/modules',
  // Save on production package size by excluding source maps.
  productionSourceMap: false,
  // Exclude content hashes from filenames since we do
  // not require them for versioning.
  filenameHashing: false,
  // Cannot use runtime compiler due to Chrome extension CSP.
  // See https://cli.vuejs.org/config/#runtimecompiler.
  runtimeCompiler: false,
  pages: {
    options: {
      entry: 'src/options/main.js',
      template: 'src/options/options.html',
      filename: 'options.html',
      chunks: ['chunk-vendors', 'chunk-common', 'options']
    },
    expire: {
      entry: 'src/expire/main.js',
      template: 'src/expire/expire.html',
      filename: 'expire.html',
      chunks: ['chunk-vendors', 'chunk-common', 'expire']
    },
    countdown: {
      entry: 'src/countdown/main.js',
      template: 'src/countdown/countdown.html',
      filename: 'countdown.html',
      chunks: ['chunk-vendors', 'chunk-common', 'countdown']
    },
    background: 'src/background/main.js'
  },
  chainWebpack: config => {
    // Preserve HTML whitespace in vue templates.
    // See https://github.com/vuejs/vue-cli/issues/1020.
    config.module
      .rule('vue')
      .use('vue-loader')
        .loader('vue-loader')
        .tap(options => {
          options.compilerOptions.whitespace = 'preserve';
          return options;
        });
  }
};
