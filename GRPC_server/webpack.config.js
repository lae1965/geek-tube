import path from 'path';

const __dirname = path.resolve();

export default {
  target: 'node',
  entry: path.resolve(__dirname, 'server.js'),
  output: {
    path: __dirname,
    filename: 'main.js'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader"
        }
      }
    ]
  }
}
