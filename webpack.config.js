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
  webpack = require("webpack")

const cwd = process.cwd(),
  processEnvRegExp = /"process.env.(.*)"/gm,
  defaultOutputPath = "dist",
  pkg = init()

console.log("config::", JSON.stringify(pkg.webpack, null, 2))
init(pkg)

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
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        include: [path.resolve(cwd, "src"), path.resolve(cwd, "lib")],
        use: {
          loader: "babel-loader",
          options: pkg.babel || {
            presets: ["@babel/env", "@babel/react"],
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
    ],
  },
  plugins: [
    new webpack.DefinePlugin(pkg.webpack.env),
    new CleanWebpackPlugin(pkg.webpack.output.path, {
      root: cwd,
    }),
    new webpack.HotModuleReplacementPlugin(),
    new MiniCssExtractPlugin({
      filename: "[hash].[name].css",
      chunkFilename: "[id].css",
    }),

    ...pkg.webpack.html,
    new ScriptExtHtmlWebpackPlugin({
      defaultAttribute: "defer",
    }),
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
  pkg.webpack.devServer = devServer(pkg.webpack)
  pkg.webpack.js = entry(pkg.webpack.entry)
  pkg.webpack.env = env(pkg.webpack.env)
  pkg.webpack.html = html(pkg.webpack.entry)
  pkg.webpack.output = output(pkg.webpack.output)
  pkg.webpack.resolve = resolve(pkg.webpack.resolve)
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
      webpack.output ? webpack.output.path : defaultOutputPath
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

function env(env = {}) {
  return reduce(
    env,
    (r, value, key) => {
      if ("$" == value.charAt(0))
        r[`process.env.${key}`] = JSON.stringify(
          process.env[value.substring(1)]
        )
      else r[`process.env.${key}`] = JSON.stringify(value)
      return r
    },
    {
      "process.env.NODE_ENV": JSON.stringify(
        process.env.NODE_ENV || "development"
      ),
    }
  )
}

function html(entries) {
  entries = pickBy(
    entries,
    (value, key) => "html" == value.substr(value.lastIndexOf(".") + 1)
  )
  return map(entries, (value, key) => {
    return new HtmlWebpackPlugin({
      filename: key,
      template: value,
      inject: "head",
      chunks: [key.replace(".html", "")],
      //inject: false,
    })
  })
}

function output(output) {
  return {
    filename: "[hash].[name].js",
    ...output,
    strictModuleExceptionHandling: true,
    path: path.resolve(cwd, output ? output.path : defaultOutputPath),
  }
}

function parseConfig() {
  try {
    let json = require(cwd + "/package.json"),
      jsonString = JSON.stringify(json, null, 2),
      parsedString = jsonString.replace(
        processEnvRegExp,
        (match, $1) => `"${process.env[$1]}"`
      ),
      pkg = JSON.parse(parsedString)
    console.log("config::", JSON.stringify(pkg.webpack, null, 2))
    return pkg
  } catch (err) {
    console.log("webpack-config-starter err parsing package.json", err)
    return
  }
}

function resolve(resolve = {}) {
  return {
    ...resolve,
    modules: [
      path.resolve(cwd, "src"),
      path.resolve(cwd, "lib"),
      "node_modules",
    ].concat(resolve.modules || []),
  }
}
