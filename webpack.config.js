const path = require("path"),
  mapValues = require("lodash/mapValues"),
  mapKeys = require("lodash/mapKeys"),
  map = require("lodash/map"),
  reduce = require("lodash/reduce"),
  pickBy = require("lodash/pickBy"),
  isArray = require("lodash/isArray"),
  isObject = require("lodash/isArray"),
  isString = require("lodash/isString"),
  HtmlWebpackPlugin = require("html-webpack-plugin"),
  CleanWebpackPlugin = require("clean-webpack-plugin"),
  ExtractTextPlugin = require("extract-text-webpack-plugin"),
  CopyWebpackPlugin = require('copy-webpack-plugin'),
  ScriptExtHtmlWebpackPlugin = require("script-ext-html-webpack-plugin"),
  MiniCssExtractPlugin = require("mini-css-extract-plugin"),
  webpack = require("webpack")

const cwd = process.cwd(),
  processEnvRegExp = /"process.env.(.*)"/gm,
  defaultOutputPath = "dist",
  pkg = init()

module.exports = function (opts = {}) {
  let {
    plugins = [],
  } = opts
  if (!pkg)
    return
  return {
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
          include: [
            path.resolve(cwd, "src"),
            path.resolve(cwd, "lib"),
          ],
          use: {
            loader: 'babel-loader',
            options: pkg.babel || {
              "presets": [
                "env",
                "stage-0",
                "es2017",
                "react"
              ]
            }
          }
        },
        {
          test: /\.css$/,
          use: [
            {
              loader: MiniCssExtractPlugin.loader,
              options: {
                // you can specify a publicPath here
                // by default it use publicPath in webpackOptions.output
                //publicPath: '../'
              }
            },
            "css-loader"
          ]
        },
        {
          test: /\.scss$/,
          use: ExtractTextPlugin.extract({
            fallback: 'style-loader',
            use: [
              {
                loader: "css-loader",
                options: {
                  sourceMap: true,
                }
              }, {
                loader: "sass-loader",
                options: {
                  outputStyle: 'compressed',
                  sourceMap: true,
                }
              }]
          })
        }
      ]
    },
    plugins: [
      new CleanWebpackPlugin([pkg.webpack.output.path], {
        root: cwd,
      }),
      new webpack.DefinePlugin(pkg.webpack.env),
      new webpack.HotModuleReplacementPlugin(),
      new ExtractTextPlugin({
        filename: pkg.webpack.extractCSS || "[hash].[name].css",
      }),
      new MiniCssExtractPlugin({
        filename: pkg.webpack.extractCSS || "[hash].[name].css",
        chunkFilename: "[id].css"
      }),
      ...pkg.webpack.html,
      new ScriptExtHtmlWebpackPlugin({
        defaultAttribute: 'defer'
      }),
      // copy text based files & transform process.env vars
      new CopyWebpackPlugin([
        {
          from: "**/*.+(json|txt|md)",
          transform: (content, path) => content.toString().replace(processEnvRegExp, (match, $1) => `"${process.env[$1]}"`)
        }
      ], {
          context: pkg.webpack.src || 'src',
        }),
      // copy misc assets
      new CopyWebpackPlugin([
        {
          from: "**/*",
        }
      ], {
          context: pkg.webpack.src || 'src',
          ignore: [
            "*.js",
            "*.scss",
            "*.css",
            "*.html",
            "*.map",
            "*.json",
            "*.txt",
            "*.md",
          ],
        }),
    ].concat(plugins)
  }
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
    ...webpack.devServer,
    contentBase: path.resolve(cwd, webpack.output
      ? webpack.output.path
      : defaultOutputPath),
  }
}

function entry(entries) {
  entries = pickBy(entries, (value, key) => {
    let ext = key.substr(key.lastIndexOf('.') + 1)
    return ext == "js" || ext == "css"
  })
  entries = mapValues(entries, value => path.resolve(cwd, value))
  return mapKeys(entries, (value, key) => key.replace(".js", ""))
}

function env(env = {}) {
  return reduce(env, (r, value, key) => {
    r[`process.env.${key}`] = JSON.stringify(value)
    return r
  }, {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    })
}

function html(entries) {
  entries = pickBy(entries, (value, key) => "html" == value.substr(value.lastIndexOf('.') + 1))
  return map(entries, (value, key) => {
    return new HtmlWebpackPlugin({
      filename: key,
      template: value,
      inject: "head",
      chunks: [key.replace(".html", "")]
      //inject: false,
    })
  })
}

function output(output) {
  return {
    filename: "[hash].[name].js",
    ...output,
    strictModuleExceptionHandling: true,
    path: path.resolve(cwd, output
      ? output.path
      : defaultOutputPath),
  }
}

function parseConfig() {
  try {
    let json = require(cwd + "/package.json"),
      jsonString = JSON.stringify(json, null, 2),
      parsedString = jsonString.replace(processEnvRegExp, (match, $1) => `"${process.env[$1]}"`),
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
    modules: [path.resolve(cwd, "src"), path.resolve(cwd, "lib"), "node_modules"].concat(resolve.modules || [])
  }
}
