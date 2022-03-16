'use strict';

const webpack = require('webpack');
const path = require('path');

const ROOT_DIRECTORY = process.cwd();
const NODE_ENV = process.env.NODE_ENV;

const config = {
  mode: 'production',
  devtool: false,
  entry: {
    main: path.resolve(ROOT_DIRECTORY, 'src/index.js'),
  },
  output: {
    library: 'formulaParser',
    libraryTarget: 'umd',
    path: path.resolve(ROOT_DIRECTORY, 'dist'),
    filename: `formula-parser${NODE_ENV === 'production' ? '.min' : ''}.js`,
    umdNamedDefine: true,
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        loaders: ['babel-loader'],
        exclude: /node_modules|grammar\-parser\.js$/
      },
    ]
  },
  optimization: {
    minimize: NODE_ENV === 'production',
  },
  plugins: [
    new webpack.optimize.OccurrenceOrderPlugin(),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(NODE_ENV)
    })
  ]
};

module.exports = config;
