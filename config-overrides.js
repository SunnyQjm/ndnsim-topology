/* config-overrides.js */

module.exports = function override(config, env) {
    //do stuff with the webpack config...
    // 添加一行这个代码,关闭
    config.devtool = false
    return config;
}