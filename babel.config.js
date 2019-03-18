module.exports = function(api) {
    api.cache.forever()

    let presets

    if (process.env.BABEL_ENV === 'modules') {
        presets = []
    } else {
        presets = [
            [
                '@babel/preset-env',
                {
                    modules: 'commonjs',
                },
            ],
        ]
    }

    return {
        presets,
        plugins: [
            '@babel/plugin-proposal-object-rest-spread',
            '@babel/plugin-proposal-class-properties',
        ],
        env: {
            test: {
                plugins: ['@babel/plugin-transform-runtime'],
            },
        },
    }
}
