const path = require('path');

module.exports = {
  entry: './src/module.ts',
  output: {
    filename: 'module.js',
    path: path.resolve(__dirname),
    libraryTarget: 'amd',
    publicPath: '/',
  },
  externals: [
    'react',
    '@grafana/data',
    '@grafana/ui',
    '@grafana/runtime',
    '@emotion/css',
  ],
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
};
