/* eslint-disable */
const path = require('path');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { VueLoaderPlugin } = require('vue-loader');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    background: './src/background.ts',
    contentscript: './src/contentscript.ts',
    options: './src/ui/options.ts',
    popup: './src/ui/popup.ts',
  },
  devtool: 'source-map',
  mode: 'production',
  performance: { hints: false },
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: 'ts-loader',
        exclude: /node_modules/,
        options: {
          appendTsSuffixTo: [/\.vue$/],
          transpileOnly: true,
        },
      },
      {
        test: /\.vue$/,
        loader: 'vue-loader',
      },
      {
        test: /\.css$/,
        use: ['vue-style-loader', 'css-loader'],
      },
    ],
  },
  optimization: {
    minimize: false,
    splitChunks: {
      chunks: (chunk) => ['options', 'popup'].includes(chunk.name),
    },
  },
  resolve: {
    extensions: ['.ts', '.js', '.vue', '.json'],
    plugins: [new TsconfigPathsPlugin()],
    alias: {
      '@': path.resolve(__dirname, 'src'),
      'vue': '@vue/runtime-dom'
    },
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: 'src/ui/ui.html',
      filename: 'options.html',
      chunks: ['options'],
    }),
    new HtmlWebpackPlugin({
      template: 'src/ui/ui.html',
      filename: 'popup.html',
      chunks: ['popup'],
    }),
    new VueLoaderPlugin(),
    new CopyPlugin({
      patterns: [
        'README.md',
        'LICENSE',
        'src/manifest.json',
        { from: 'src/icons', to: 'icons' },
        { from: 'src/_locales', to: '_locales' },
        { from: 'src/ui/vendor', to: 'vendor' },
      ],
    }),
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, 'dist'),
    },
    hot: true,
    devMiddleware: {
      writeToDisk: true,
    },
  },
};