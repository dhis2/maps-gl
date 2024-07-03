const { config } = require('@dhis2/cli-style')

module.exports = {
    extends: [config.eslintReact],
    rules: {
        "import/extensions": "warn",
        "import/order": "warn",
        "no-undef": "warn",
        "prefer-const": "warn",
        "max-params": "warn",
        "no-prototype-builtins": "warn",
        "no-unused-vars": "warn",
        "curly": "warn",
        "no-empty": "warn",
        "no-useless-escape": "warn",
        "no-control-regex": "warn",
        "no-unreachable": "warn",
        "no-regex-spaces": "warn",
        "no-unsafe-finally": "warn",
        "no-cond-assign": "warn",
        "react/display-name": "warn",
        "getter-return": "warn",
        "no-self-assign": "warn",
    }
}
