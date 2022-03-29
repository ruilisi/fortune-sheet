const path = require('path');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

module.exports = ({ config }) => {
  config.resolve.plugins = config.resolve.plugins || [];
  config.resolve.plugins.push(
    new TsconfigPathsPlugin({
      configFile: path.resolve(__dirname, "../tsconfig.json"),
    })
  );
  return config;
};