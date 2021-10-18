const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlWebpackTagsPlugin = require('html-webpack-tags-plugin');
const ESLintPlugin = require('eslint-webpack-plugin');

const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
  entry: `${__dirname}/src/index.jsx`,
  mode: process.env.NODE_ENV,
  output: {
    path: `${__dirname}/public`,
    filename: 'bundle.js',
  },
  devtool: 'source-map',
  devServer: {
    static: './',
    allowedHosts: 'all',
    hot: true,
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /(node_modules|bower_components)/,
        use: { loader: 'babel-loader' },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.svg/,
        use: {
          loader: 'svg-url-loader',
          options: {},
        },
      },
    ],
  },
  resolve: {
    extensions: ['.js', '.jsx'],
  },
  plugins: [
    new ESLintPlugin({
      extensions: ['js', 'jsx'],
      fix: false,
    }),
    new HtmlWebpackPlugin({
      title: 'DatoCMS plugin',
      minify: isProduction,
    }),
    new HtmlWebpackTagsPlugin({
      tags: [
        'https://unpkg.com/datocms-plugins-sdk@0.1.2/dist/sdk.js',
        'https://unpkg.com/datocms-plugins-sdk@0.1.2/dist/sdk.css',
      ],
      append: false,
    }),
  ].filter(Boolean),
};
