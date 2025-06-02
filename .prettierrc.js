const { config } = require('@dhis2/cli-style')

module.exports = {
    ...require(config.prettier),
    printWidth: 80,
    tabWidth: 4,
    useTabs: false,
    semi: false,
    singleQuote: true,
    trailingComma: 'es5',
    bracketSpacing: true,
    bracketSameLine: false,
    jsxSingleQuote: false,
    arrowParens: 'avoid',
    rangeStart: 0,
    rangeEnd: Infinity,
    proseWrap: 'preserve',
    requirePragma: false,
    insertPragma: false,
    endOfLine: 'lf',
}
