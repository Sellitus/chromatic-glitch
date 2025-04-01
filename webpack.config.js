const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: './src/js/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    clean: true,
    publicPath: '/',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.html$/,
        use: ['html-loader']
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html'
    })
  ],
  devServer: {
    static: [ // Use an array to serve multiple directories
      {
        // Serve files from 'dist' - contains bundle.js and index.html (via plugin)
        directory: path.join(__dirname, 'dist'),
        publicPath: '/', // Serve bundle.js at the root
      },
      {
        // Serve files from 'src' - needed for assets like manifest.json
        directory: path.join(__dirname, 'src'),
        publicPath: '/', // Make assets accessible directly (e.g., /assets/manifest.json)
        // Note: This might serve index.html from src if not careful, but
        // historyApiFallback: true should prioritize the one in dist.
      },
    ],
    compress: true,
    port: 9000,
    hot: true,
    historyApiFallback: true
  }
};
