const path = require('path');
const assetPath = require('./src/services/asset_path.js');

module.exports = {
    mode: process.env.TRILIUM_ENV === 'dev' ? 'development' : 'production',
    entry: './src/public/app/excalidraw.js',
    output: {
        publicPath: `${assetPath}/app-dist/`,
        path: path.resolve(__dirname, 'src/public/app-dist'),
        filename: 'excalidraw.js',
        chunkFilename: 'excalidraw-[id].js',
        chunkLoadingGlobal: 'webpackChunkTriliumExcalidraw',
        uniqueName: 'trilium-excalidraw',
    },
    devtool: 'source-map',
    target: 'web',
    cache: {
        type: 'filesystem',
        cacheDirectory: path.resolve(__dirname, '.webpack-cache/excalidraw'),
    },
    module: {
        rules: [
            {
                test: /\.m?js$/,
                resolve: {
                    // Excalidraw imports some dependencies without file extensions.
                    fullySpecified: false,
                },
            },
        ],
    },
    optimization: {
        splitChunks: false,
        runtimeChunk: false,
    },
};
