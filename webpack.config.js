const { resolve } = require("path");

const HtmlWebpackPlugin = require("html-webpack-plugin"); // 通过 npm 安装
const webpack = require("webpack");

const DIST = resolve(__dirname, "dist");

module.exports = {
  entry: "./src/index.js",

  output: {
    filename: "js/build.[hash:10].js",
    // __dirname: nodejs 变量, 代表当前文件目录绝对路径
    path: DIST,
  },

  // loader 配置
  module: {
    rules: [
      {
        // 下载 babel-loader, @babel/preset-env, @babel/core, @babel/polifill
        // 在js 中加入 `import "@babel/polifill"`
        test: /\.js$/,
        exclude: /node_modules/,
        loader: "babel-loader",
      },
    ],
  },

  plugins: [
    // 下载 html-webpack-plugin
    // 默认创建空html, 自动引入所有打包的资源
    new HtmlWebpackPlugin({
      template: "./src/index.html", // 指定模板, 会使用模板的结构
      // minify: {
      //   collapseWhitespace: true,
      //   removeComments: true,
      // },
    }),
    new webpack.HotModuleReplacementPlugin(),
  ],

  resolve: {
    extensions: [".js", ".jsx", ".css", "vue"],
  },

  // mode 配置, 默认为 dev
  mode: "development", // "production"

  // 自动编译 / 刷新
  // 在内存中打包, 而不产生实际文件
  // 下载 webpack-dev-server
  devServer: {
    contentBase: DIST,
    compress: true,
    port: 3000,
    open: true,
    hot: true, // HMR
    clientLogLevel: "none",
    quiet: true,
    watchOptions: {
      ignore: /node_modules/,
    },
    overlay: false, // 出错时不要全屏提示
    // proxy: {
    //   // 一旦dev服务器运行端口接收到对 /api/xxx 的请求, 就把请求转发到target
    //   "/api": {
    //     target: "http://real.api/bar",
    //     pathRewrite: {
    //       // 将 /api/foo 转发为 /foo
    //       "^/api": "",
    //     },
    //   },
    // },
  },
  devtool: "eval-source-map",
};
