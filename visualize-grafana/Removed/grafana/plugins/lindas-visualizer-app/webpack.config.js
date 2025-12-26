const path = require('path');

module.exports = {
  entry: './src/module.ts',
  output: {
    filename: 'module.js',
    path: path.resolve(__dirname),
    libraryTarget: 'amd',
    publicPath: '',
  },
  externals: [
    '@grafana/data',
    '@grafana/ui',
    '@grafana/runtime',
    'react',
    'react-dom',
    '@emotion/css',
    '@emotion/react',
    'lodash',
    'moment',
  ],
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  mode: 'production',
};
