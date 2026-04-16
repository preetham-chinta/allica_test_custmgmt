const path             = require("path");
const { HtmlRspackPlugin, DefinePlugin } = require("@rspack/core");

const isDev    = process.env.NODE_ENV !== "production";
const BACKEND  = process.env.ACTIVE_BACKEND || "mvc";
const BACKEND_URL = BACKEND === "webflux"
  ? (process.env.BACKEND_WEBFLUX_URL || "http://localhost:8081")
  : (process.env.BACKEND_MVC_URL     || "http://localhost:8080");

module.exports = {
  entry:  "./src/index.jsx",
  output: {
    path:       path.resolve(__dirname, "dist"),
    filename:   isDev ? "[name].js" : "[name].[contenthash:8].js",
    publicPath: "/",
    clean:      true,
  },
  resolve: {
    extensions: [".jsx", ".js"],
    alias: { "@": path.resolve(__dirname, "src") },
  },
  module: {
    rules: [
      {
        test: /\.(jsx|js)$/,
        exclude: /node_modules/,
        use: {
          // Rspack's built-in SWC loader — Rust-powered, no extra install needed.
          // Replace "builtin:swc-loader" with "babel-loader" for plain Webpack.
          loader: "builtin:swc-loader",
          options: {
            jsc: {
              parser:    { syntax: "ecmascript", jsx: true },
              transform: { react: { runtime: "automatic" } },
            },
          },
        },
        type: "javascript/auto",
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
        type: "javascript/auto",
      },
    ],
  },
  plugins: [
    new HtmlRspackPlugin({ template: "./public/index.html" }),
    new DefinePlugin({
      "process.env.NODE_ENV":       JSON.stringify(process.env.NODE_ENV || "development"),
      "process.env.ACTIVE_BACKEND": JSON.stringify(BACKEND),
    }),
  ],
  optimization: {
    splitChunks: {
      chunks: "all",
      cacheGroups: {
        vendor: { test: /node_modules/, name: "vendor", priority: 10 },
      },
    },
  },
  devServer: {
    port: 3000,
    hot:  true,
    historyApiFallback: true,
    proxy: [{
      // /api/* proxied to Spring Boot — browser never talks to 8080/8081 directly
      context:      ["/api"],
      target:       BACKEND_URL,
      changeOrigin: true,
    }],
  },
  devtool: isDev ? "eval-cheap-module-source-map" : "hidden-source-map",
};
