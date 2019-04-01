const path = require('path')
const webpack = require('webpack')

module.exports = {
  entry: {
    server: './src/index.js'
  },
  output: {
    path: path.resolve(__dirname, 'bin/'),
    filename: 'bundle.js'
  },
  plugins: [
    new webpack.BannerPlugin({
      banner: '#!/usr/bin/env node',
      raw: true
    })
  ],
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: path.resolve(__dirname, 'node_modules/'),
        loader: 'babel-loader',
        query: {
          presets: ['@babel/preset-env']
        }
      }
    ]
  },
  mode: 'development',
  target: 'node',
  watch: true
}
