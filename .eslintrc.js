const { config } = require('@dhis2/cli-style')

module.exports = {
    extends: [config.eslintReact],
    rules: {
        curly: 'warn',
        'getter-return': 'warn',
        'import/extensions': 'warn',
        'import/order': 'warn',
        'max-params': 'warn',
        'no-cond-assign': 'warn',
        'no-control-regex': 'warn',
        'no-empty': 'warn',
        'no-prototype-builtins': 'warn',
        'no-self-assign': 'warn',
        'no-regex-spaces': 'warn',
        'no-undef': 'warn',
        'no-unreachable': 'warn',
        'no-unsafe-finally': 'warn',
        'no-unused-vars': 'warn',
        'no-useless-escape': 'warn',
        'prefer-const': 'warn',
        'react/display-name': 'warn',
    },
}
