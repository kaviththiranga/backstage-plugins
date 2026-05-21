const a11y = require('../../eslint-a11y-rules');

module.exports = require('@backstage/cli/config/eslint-factory')(__dirname, {
  ignorePatterns: ['templates/'],
  extends: a11y.extends,
  plugins: a11y.plugins,
  rules: {
    'react/react-in-jsx-scope': 'off',
    ...a11y.rules,
  },
});
