const path = require('path');
const assetPath = require('./src/services/asset_path.js');

module.exports = {
    mode: 'production',
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
