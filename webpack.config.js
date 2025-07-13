/* eslint-disable */
const path = require('path');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    background: './src/background.ts',
    contentscript: './src/contentscript.ts',
    options: './src/ui/js/options.js',
    popup: './src/ui/js/popup.js',
  },
  devtool: false,
  mode: 'production',
  performance: {
    hints: false,
  },
  node: false,
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: 'ts-loader',
        exclude: /node_modules/,
        options: {
          // Skip type checking to allow building with TypeScript errors
          transpileOnly: true
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  optimization: {
    minimize: false,
    splitChunks: {
      chunks: (chunk) => {
        return ['options', 'popup'].includes(chunk.name);
      },
    },
  },
  resolve: {
    extensions: ['.ts', '.js'],
    plugins: [new TsconfigPathsPlugin()],
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: 'src/ui/options-new.html',
      filename: 'options.html',
      chunks: ['options'],
    }),
    new HtmlWebpackPlugin({
      template: 'src/ui/popup-new.html',
      filename: 'popup.html',
      chunks: ['popup'],
    }),
    new CopyPlugin({
      patterns: [
        'README.md',
        'LICENSE',
        'src/manifest.json',
        { from: 'src/icons', to: 'icons' },
        { from: 'src/_locales', to: '_locales' },
        { from: 'src/ui/vendor', to: 'vendor' },
        { from: 'src/ui/css', to: 'css' },
      ],
    }),
  ],
  devServer: {
    hot: false,
    devMiddleware: {
      writeToDisk: true
    }
  },
};
