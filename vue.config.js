module.exports = {
  configureWebpack: {
    node: false,
    // Disable eval. Required for Chrome extension CSP.
    // See https://github.com/webpack/webpack/issues/5627#issuecomment-374386048.
    devtool: 'inline-source-map'
  },
  baseUrl: '/modules',
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
    background: 'src/background/main.js'
  },
  chainWebpack: config => {
    // Preserve HTML whitespace in templates.
    // See https://github.com/vuejs/vue-cli/issues/1020.
    config.module
      .rule('vue')
      .use('vue-loader')
      .loader('vue-loader')
      .tap(options => {
        options.compilerOptions.preserveWhitespace = true;
        return options;
      });
  }
};
