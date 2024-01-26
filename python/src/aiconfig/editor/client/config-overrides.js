const { alias, configPaths } = require("react-app-rewire-alias");

const aliasMap = configPaths("./tsconfig.paths.json");

module.exports = {
  webpack: function (config) {
    const webpackConfig = alias(aliasMap)(config);
    return {
      ...webpackConfig,
      watchOptions: {
        ...webpackConfig.watchOptions,
        followSymlinks: true,
      },
      resolve: {
        ...webpackConfig.resolve,
        symlinks: false,
      },
    };
  },
  devServer: function (configFunction) {
    return function (proxy, allowedHost) {
      const devConfig = configFunction(proxy, allowedHost);
      return {
        ...devConfig,
        watchFiles: {
          paths: [
            "src/**/*",
            "node_modules/aiconfig-editor/**/*",
            "node_modules/@lastmileai/aiconfig-editor/**/*",
          ],
          options: {
            followSymlinks: true,
          },
        },
      };
    };
  },
};
