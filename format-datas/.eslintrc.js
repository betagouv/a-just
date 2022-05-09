module.exports = {
  env: {
    mocha: true,
    node: true,
    protractor: true,
    es6: true,
  },
  extends: ['eslint:recommended'],
  parser: 'babel-eslint',
  rules: {
    'max-len': [
      'error',
      {
        code: 160,
        ignoreComments: true,
        ignoreStrings: true,
        ignoreTemplateLiterals: true,
      },
    ],
    'space-before-function-paren': ['error', 'always'],
    'object-curly-spacing': ['error', 'always'],
    indent: ['error', 2],
    quotes: ['error', 'single', { avoidEscape: true }],
    'comma-dangle': ['error', 'always-multiline'],
    semi: ['error', 'never'],
    'space-infix-ops': ['error', { int32Hint: false }],
    'block-spacing': ['error', 'always'],
    'no-empty': ['error', { 'allowEmptyCatch': true }],
  },
}
