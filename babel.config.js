module.exports = {
  presets: ['next/babel'],
  plugins: [
    // Required for WatermelonDB model decorators (@field, @date, @children, @relation)
    ['@babel/plugin-proposal-decorators', { legacy: true }],
    // Must come AFTER decorators plugin when using legacy mode
    ['@babel/plugin-proposal-class-properties', { loose: true }],
    ['@babel/plugin-transform-private-methods', { loose: true }],
    ['@babel/plugin-transform-private-property-in-object', { loose: true }],
  ],
};
