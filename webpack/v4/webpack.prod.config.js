// NOTE: this configuration file MUST NOT be loaded with `-p` or `--optimize-minimize` option.
// This option includes an implicit call to UglifyJsPlugin and LoaderOptionsPlugin. Instead,
// an explicit call is made in this file to these plugins with customized options that enables
// more control of the output bundle in order to fix unexpected behavior in old browsers.

const webpack = require('webpack');
const { resolve } = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const WebpackDeleteAfterEmit = require('webpack-delete-after-emit');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const { version } = require('../../package.json');
const entryPoints = require('./entryPoints');
const { http_path_prefix } = require(`../../config/grunt_${process.env.NODE_ENV}.json`);

const rootDir = file => resolve(__dirname, '../../', file);
const isVendor = (module, count) => {
  const userRequest = module.userRequest;
  return userRequest && userRequest.indexOf('node_modules') >= 0;
};

module.exports = env => {
  return {
    mode: 'production',
    entry: entryPoints,
    output: {
      filename: `${version}/javascripts/[name].js`,
      path: rootDir('public/assets')
    },
    resolve: {
      symlinks: false,
      modules: require('../common/modules.js'),
      alias: require('../common/alias.js')
    },
    devtool: 'source-map',
    plugins: [
      // Object.keys(entryPoints)
      // .map(entry => new webpack.optimize.CommonsChunkPlugin({
      //   name: `${entry}_vendor`,
      //   chunks: [entry],
      //   minChunks: isVendor
      // }))
      // .concat()
      // new webpack.LoaderOptionsPlugin({
      //   minimize: true
      // }),

      // Extract common chuncks from the 3 vendor files
      // new webpack.optimize.CommonsChunkPlugin({
      //   name: 'common_dashboard',
      //   chunks: Object.keys(entryPoints).map(n => `${n}_vendor`),
      //   minChunks: (module, count) => {
      //     return count >= Object.keys(entryPoints).length && isVendor(module);
      //   }
      // }),

      // Extract common chuncks from the 3 entry points
      // new webpack.optimize.CommonsChunkPlugin({
      //   children: true,
      //   minChunks: Object.keys(entryPoints).length
      // }),

      new webpack.ProvidePlugin({
        $: 'jquery',
        jQuery: 'jquery',
        'window.jQuery': 'jquery'
      }),

      new webpack.DefinePlugin({
        __IN_DEV__: JSON.stringify(false),
        __ENV__: JSON.stringify('prod')
      }),

      new MiniCssExtractPlugin({
        filename: `./${version}/stylesheets/[name].css`
      }),

      new CopyWebpackPlugin([
        {
          from: rootDir('app/assets/images'),
          to: `./${version}/images/`,
          toType: 'dir'
        }, {
          from: rootDir('public/favicons'),
          to: `./${version}/favicons/`,
          toType: 'dir'
        }, {
          from: rootDir('app/assets/images/avatars'),
          to: `./unversioned/images/avatars/`,
          toType: 'dir'
        }, {
          from: rootDir('app/assets/images/alphamarker.png'),
          to: `./unversioned/images/alphamarker.png`,
          toType: 'file'
        }, {
          from: rootDir('app/assets/images/carto.png'),
          to: `./unversioned/images/carto.png`,
          toType: 'file'
        }, {
          from: rootDir('app/assets/images/google-maps-basemap-icons'),
          to: `./unversioned/images/google-maps-basemap-icon`,
          toType: 'dir'
        }
      ]),

      new WebpackDeleteAfterEmit({
        globs: [
          `${version}/javascripts/common_new.js`,
          `${version}/javascripts/common_new.js.map`,
          `${version}/javascripts/deep_insights_new.js`,
          `${version}/javascripts/deep_insights_new.js.map`,
          `${version}/javascripts/public_map_new.js`,
          `${version}/javascripts/public_map_new.js.map`
        ]
      })
    ],
    optimization: {
      minimizer: [
        new UglifyJsPlugin({
          cache: false,
          parallel: true,
          uglifyOptions: {
            sourceMap: true,
            keep_fnames: true,
            output: {
              ascii_only: true,
              beautify: false
            }
          }
        }),
        new OptimizeCSSAssetsPlugin({})
      ],
      splitChunks: {
        cacheGroups: {
          commons: {
            name: 'commons',
            chunks: 'initial',
            minChunks: 2,
            minSize: 0
          }
        }
      }
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          loader: 'shim-loader',
          include: [
            rootDir('node_modules/internal-carto.js')
          ],
          options: {
            shim: {
              'wax.cartodb.js': {
                exports: 'wax'
              },
              'html-css-sanitizer': {
                exports: 'html'
              },
              'lzma': {
                exports: 'LZMA'
              }
            }
          }
        },
        {
          test: /\.tpl$/,
          use: [{
            loader: 'tpl-loader',
            options: {}
          }],
          include: [
            rootDir('lib/assets/javascripts/builder'),
            rootDir('lib/assets/javascripts/dashboard'),
            rootDir('lib/assets/javascripts/deep-insights'),
            rootDir('node_modules/internal-carto.js')
          ]
        },
        {
          test: /\.mustache$/,
          use: 'raw-loader',
          include: [
            rootDir('lib/assets/javascripts/builder'),
            rootDir('lib/assets/javascripts/deep-insights'),
            rootDir('node_modules/internal-carto.js')
          ]
        },
        {
          test: /\.js$/,
          loader: 'babel-loader',
          include: [
            rootDir('node_modules/tangram-cartocss'),
            rootDir('node_modules/tangram.cartodb'),
            rootDir('lib/assets/javascripts/carto-node'),
            rootDir('lib/assets/javascripts/dashboard')
          ],
          options: {
            presets: ['env'],
            plugins: ['transform-object-rest-spread']
          }
        },
        {
          test: /\.s?css$/,
          use: [
            MiniCssExtractPlugin.loader,
            {
              loader: 'css-loader',
              options: {
                alias: {
                  // This is because of Carto.js _leaflet partial
                  '../../img': '../img'
                },
                sourceMap: false
              }
            },
            {
              loader: 'sass-loader',
              options: {
                data: `$assetsDir: "${http_path_prefix}/assets/${version}";`,
                sourceMap: false,
                includePaths: [
                  rootDir('node_modules/cartoassets/src/scss')
                ]
              }
            }
          ]
        },
        {
          test: /\.(ttf|eot|woff|woff2|svg)(.+#.+)?$/,
          use: {
            loader: 'file-loader',
            options: {
              name: `[name].[ext]`,
              outputPath: `${version}/fonts/`,
              publicPath: `${http_path_prefix}/assets/${version}/fonts/`
            }
          }
        },
        {
          test: /\.(png|gif)$/,
          use: {
            loader: 'file-loader',
            options: {
              name: `[name].[ext]`,
              outputPath: `${version}/images/`,
              publicPath: `${http_path_prefix}/assets/${version}/fonts/`
            }
          }
        }
      ]
    },

    node: {
      fs: 'empty' // This fixes the error Module not found: Error: Can't resolve 'fs'
    },

    stats: {
      warnings: false
    }
  };
};
