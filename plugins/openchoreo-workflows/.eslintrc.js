const a11y = require('../../eslint-a11y-rules');

module.exports = require('@backstage/cli/config/eslint-factory')(__dirname, {
  extends: a11y.extends,
  plugins: a11y.plugins,
  rules: a11y.rules,
});
