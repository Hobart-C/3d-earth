const path = require('path')
const webpack = require('webpack')
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')
function resolve(dir) {
  return path.join(__dirname, dir)
}

// 使用等比适配插件
module.exports = {
  publicPath: process.env.VUE_APP_BASE_URL,
  runtimeCompiler: true,
  productionSourceMap: false,
  configureWebpack: (config) => {
    if (process.env.NODE_ENV === 'production') {
      config.plugins.push(
        new UglifyJsPlugin({
          uglifyOptions: {
            compress: {
              drop_debugger: true,
              drop_console: true
            }
          },
          sourceMap: false,
          parallel: true
        })
      )
      config.plugins.push(new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/))
      config.plugins.push(
        new webpack.optimize.LimitChunkCountPlugin({
          maxChunks: 5,
          minChunkSize: 100
          // maxChunkSize
        })
      )
    }
  },
  chainWebpack: (config) => {
    // 通过webpack-chain，链式操作修改webpack
    config.resolve.alias.set('@', resolve('src'))
  }
}
