import path from 'path'
import module from 'module'
import webpack from 'webpack'
import RemarkGfm from 'remark-gfm'
import RehypeToc from '@jsdevtools/rehype-toc'
import RehypeSlug from 'rehype-slug'
import RehypePrism from '@mapbox/rehype-prism'
import TerserPlugin from 'terser-webpack-plugin'
import RemarkMdxImages from 'remark-mdx-images'
import CopyWebpackPlugin from 'copy-webpack-plugin'
import HtmlWebpackPlugin from 'html-webpack-plugin'
import ForkCheckerPlugin from 'fork-ts-checker-webpack-plugin'
import HtmlMinimizerPlugin from 'html-minimizer-webpack-plugin'

import remarkMdxSvg from './scripts/remark-svg-plugin.mjs'
import rehypeCodeMeta from './scripts/rehype-code-meta.mjs'

const root = path.dirname(new URL(import.meta.url).pathname)
const require = module.createRequire(import.meta.url)

export default ({ generator, prod = false }) => {
    const bundlePath = path.join(
        root,
        'build/bundle',
        generator ? 'generator' : 'web',
        prod ? 'prod' : 'dev',
    )

    return {
        mode: prod ? 'production' : 'development',
        target: generator ? 'node' : 'web',
        devtool: 'source-map',
        entry: path.join(root, 'src', generator ? 'generator.tsx' : 'main.tsx'),
        output: {
            publicPath: '/assets/',
            library: generator ? { type: 'commonjs' } : undefined,
            filename: generator
                ? '[name].js'
                : prod
                ? '[contenthash].js'
                : '[name].js',
            assetModuleFilename: prod ? '[contenthash][ext]' : '[name][ext]',
            path: generator ? bundlePath : path.join(bundlePath, 'assets'),
        },
        plugins: generator
            ? []
            : [
                  new CopyWebpackPlugin({
                      patterns: [
                          {
                              from: require.resolve('./scripts/_headers'),
                              to: '..',
                          },
                      ],
                  }),
                  new HtmlWebpackPlugin({
                      template: require.resolve('./src/index.html'),
                      filename: '../index.html',
                  }),
              ].concat(
                  prod
                      ? [
                            new webpack.optimize.LimitChunkCountPlugin({
                                maxChunks: 1,
                            }),
                        ]
                      : [
                            new ForkCheckerPlugin({
                                typescript: {
                                    build: true,
                                    mode: 'write-references',
                                },
                            }),
                        ],
              ),
        resolve: {
            extensions: ['.ts', '.tsx', '.js', '.mjs', '.cjs'],
            fallback: generator
                ? {}
                : { path: require.resolve('path-browserify') },
        },
        optimization: {
            minimize: prod,
            minimizer: [
                new HtmlMinimizerPlugin(),
                new TerserPlugin({
                    extractComments: {
                        condition: 'all',
                        banner: () => '',
                    },
                }),
            ],
        },
        module: {
            rules: [
                {
                    test: /\.(dat)|(jpg)|(png)|(gif)|(ttf)|(woff2?)$/i,
                    type: 'asset/resource',
                },
                {
                    test: /\.svg$/i,
                    type: 'asset/resource',
                    loader: 'svgo-loader',
                    options: {
                        multipass: true,
                        plugins: [
                            {
                                name: 'removeViewBox',
                                active: false,
                            },
                        ],
                    },
                    resourceQuery: { not: [/embed/] },
                },
                {
                    test: /\.svg$/i,
                    loader: '@svgr/webpack',
                    resourceQuery: /embed/,
                    options: {
                        svgoConfig: {
                            plugins: [
                                {
                                    name: 'removeViewBox',
                                    active: false,
                                },
                            ],
                        },
                    },
                },
                {
                    test: /\.tsx?$/i,
                    loader: 'ts-loader',
                    exclude: /node_modules/,
                    options: {
                        transpileOnly: !prod,
                    },
                },
                {
                    test: /\.css$/i,
                    use: [
                        'isomorphic-style-loader',
                        {
                            loader: 'css-loader',
                            options: { sourceMap: !prod, esModule: false },
                        },
                        {
                            loader: 'postcss-loader',
                            options: {
                                postcssOptions: {
                                    plugins: ['postcss-preset-env', 'cssnano'],
                                },
                            },
                        },
                    ],
                },
                {
                    test: /\.mdx$/i,
                    use: [
                        {
                            loader: '@mdx-js/loader',
                            options: {
                                providerImportSource: '@mdx-js/react',
                                remarkPlugins: [
                                    RemarkGfm,
                                    remarkMdxSvg,
                                    RemarkMdxImages,
                                ],
                                rehypePlugins: [
                                    [
                                        RehypePrism,
                                        {
                                            alias: {
                                                js: 'javascript',
                                                diff: 'patch',
                                                shell: 'console',
                                            },
                                        },
                                    ],
                                    [RehypeSlug],
                                    [rehypeCodeMeta],
                                    [
                                        RehypeToc,
                                        {
                                            headings: ['h2', 'h3', 'h4', 'h5'],
                                            customizeTOC: (toc) =>
                                                toc.children[0].children.length
                                                    ? {
                                                          ...toc,
                                                          children: [
                                                              {
                                                                  type: 'element',
                                                                  tagName: 'p',
                                                                  properties: {
                                                                      className:
                                                                          'toc-header',
                                                                  },
                                                                  children: [
                                                                      {
                                                                          type: 'text',
                                                                          value: 'Table of contents',
                                                                      },
                                                                  ],
                                                              },
                                                              ...toc.children,
                                                          ],
                                                      }
                                                    : false,
                                        },
                                    ],
                                ],
                            },
                        },
                        {
                            loader: require.resolve(
                                './scripts/footer-loader.js',
                            ),
                        },
                    ],
                },
            ],
        },
        devServer: {
            hot: false,
            port: 8000,
            static: { directory: bundlePath },
            historyApiFallback: {
                disableDotRule: true,
            },
            devMiddleware: {
                publicPath: '/assets/',
                writeToDisk: true,
            },
        },

        stats: {
            colors: true,
            assets: false,
            modules: false,
            moduleTrace: true,
            errorDetails: true,
            chunkModules: false,
        },
    }
}
