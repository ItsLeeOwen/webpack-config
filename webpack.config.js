const path = require("path"),
  mapValues = require("lodash/mapValues"),
  mapKeys = require("lodash/mapKeys"),
  map = require("lodash/map"),
  reduce = require("lodash/reduce"),
  pickBy = require("lodash/pickBy"),
  HtmlWebpackPlugin = require("html-webpack-plugin"),
  CleanWebpackPlugin = require("clean-webpack-plugin"),
  MiniCssExtractPlugin = require("mini-css-extract-plugin"),
  CopyWebpackPlugin = require("copy-webpack-plugin"),
  ScriptExtHtmlWebpackPlugin = require("script-ext-html-webpack-plugin"),
  dotenv = require("dotenv"),
  webpack = require("webpack"),
  VueLoaderPlugin = require("vue-loader/lib/plugin")

const cwd = process.cwd(),
  defaultOutputPath = "dist",
  pkg = init()

console.log("config::", JSON.stringify(pkg.webpack, null, 2))

module.exports = {
  devtool: "source-map",
  mode: pkg.webpack.mode || "development",
  devServer: pkg.webpack.devServer,
  entry: pkg.webpack.js,
  output: pkg.webpack.output,
  resolve: pkg.webpack.resolve,
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: "vue-loader",
      },
      {
        test: /\.js|.jsx$/,
        exclude: /(node_modules|bower_components)/,
        include: [path.resolve(cwd, "src"), path.resolve(cwd, "lib")],
        use: {
          loader: "babel-loader",
          options: pkg.babel || {
            presets: ["@babel/env", "@babel/react", "@vue/babel-preset-jsx"],
            plugins: [
              "@babel/plugin-proposal-function-bind",
              "@babel/plugin-proposal-export-default-from",
              "@babel/plugin-proposal-logical-assignment-operators",
              [
                "@babel/plugin-proposal-optional-chaining",
                {
                  loose: false,
                },
              ],
              [
                "@babel/plugin-proposal-pipeline-operator",
                {
                  proposal: "minimal",
                },
              ],
              [
                "@babel/plugin-proposal-nullish-coalescing-operator",
                {
                  loose: false,
                },
              ],
              "@babel/plugin-proposal-do-expressions",
              [
                "@babel/plugin-proposal-decorators",
                {
                  legacy: true,
                },
              ],
              "@babel/plugin-proposal-function-sent",
              "@babel/plugin-proposal-export-namespace-from",
              "@babel/plugin-proposal-numeric-separator",
              "@babel/plugin-proposal-throw-expressions",
              "@babel/plugin-syntax-dynamic-import",
              "@babel/plugin-syntax-import-meta",
              [
                "@babel/plugin-proposal-class-properties",
                {
                  loose: false,
                },
              ],
              "@babel/plugin-proposal-json-strings",
            ],
          },
        },
      },
      {
        test: /\.scss$/,
        use: [
          {
            loader: "vue-style-loader",
          },
          {
            loader: MiniCssExtractPlugin.loader,
            options: {
              //publicPath: "../",
            },
          },
          {
            loader: "css-loader",
            options: {
              sourceMap: true,
              url: false,
            },
          },
          {
            loader: "sass-loader",
            options: {
              outputStyle: "compressed",
              sourceMap: true,
            },
          },
        ],
      },
      {
        test: /\.css$/,
        use: ["vue-style-loader", "css-loader"],
      },
    ],
  },
  plugins: [
    new webpack.DefinePlugin(pkg.webpack.env),
    new CleanWebpackPlugin(
      /*pkg.webpack.output.path,*/ {
        root: cwd,
      }
    ),
    new webpack.HotModuleReplacementPlugin(),
    new MiniCssExtractPlugin({
      filename: `${pkg.webpack.outputFilenameConvention}.css`,
      chunkFilename: "[id].css",
    }),
    new VueLoaderPlugin(),
    ...pkg.webpack.html,
    new CopyWebpackPlugin(
      [
        {
          context: pkg.webpack.src || "src",
          from: "**/*",
        },
      ],
      {
        ignore: ["*.js", "*.scss", "*.css", "*.html", "*.map"],
      }
    ),
    new CopyWebpackPlugin([
      {
        context: pkg.webpack.src || "src",
        from: "asset/**/*",
      },
    ]),
  ],
}

function init() {
  let pkg = parseConfig()
  pkg.webpack.js = entry(pkg.webpack.entry)
  pkg.webpack.env = env()
  pkg.webpack.html = html(pkg.webpack.entry)
  pkg.webpack.output = output(pkg.webpack)
  pkg.webpack.resolve = resolve(pkg.webpack.resolve)
  pkg.webpack.devServer = devServer(pkg.webpack)
  return pkg
}

function devServer(webpack) {
  return {
    compress: true,
    port: 8080,
    open: true,
    ...devServer,
    contentBase: path.resolve(
      cwd,
      webpack.output.path ? webpack.output.path : defaultOutputPath
    ),
  }
}

function entry(entries) {
  entries = pickBy(entries, (value, key) => {
    let ext = key.substr(key.lastIndexOf(".") + 1)
    return ext == "js" || ext == "css"
  })
  entries = mapValues(entries, value => path.resolve(cwd, value))
  return mapKeys(entries, (value, key) => key.replace(".js", ""))
}

function env() {
  const env = dotenv.config({
    path: path.resolve(cwd, ".env"),
  })

  if (env.error) {
    console.log(
      "Unable to load environment variables from '.env': ",
      env.error.message
    )
    return {}
  }

  return reduce(
    env.parsed,
    (env, value, key) => ({
      ...env,
      [`process.env.${key}`]: JSON.stringify(value),
    }),
    {}
  )
}

function html(entries) {
  entries = pickBy(
    entries,
    (value, key) => "html" == value.substr(value.lastIndexOf(".") + 1)
  )
  const html = map(entries, (value, key) => {
    return new HtmlWebpackPlugin({
      filename: key,
      template: value,
      inject: "head",
      chunks: [key.replace(".html", "")],
      //inject: false,
    })
  })

  if (html.length) {
    html.push(
      new ScriptExtHtmlWebpackPlugin({
        defaultAttribute: "defer",
      })
    )
  }
  return html
}

function output(webpack) {
  const { output = {} } = webpack
  webpack.outputFilenameConvention = output.filename
    ? output.filename
    : "[hash].[name]"
  return {
    ...output,
    filename: `${webpack.outputFilenameConvention}.js`,
    strictModuleExceptionHandling: true,
    path: path.resolve(cwd, output.path ? output.path : defaultOutputPath),
  }
}

function parseConfig() {
  try {
    let json = require(cwd + "/package.json")
    // console.log("config::", JSON.stringify(json.webpack, null, 2))
    return json
  } catch (err) {
    console.log("webpack-config-starter err parsing package.json", err)
    return
  }
}

function resolve(resolve = {}) {
  return {
    ...resolve,
    alias: {
      vue$: "vue/dist/vue.esm.js",
    },
    extensions: ["*", ".js", ".jsx", ".vue", ".json"],
    modules: [
      path.resolve(cwd, "src"),
      path.resolve(cwd, "lib"),
      "node_modules",
    ].concat(resolve.modules || []),
  }
}
