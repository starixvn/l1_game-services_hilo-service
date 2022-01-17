module.exports = async () => {
    return {
        rootDir: './',
        verbose: true,
        transform: {
            '^.+\\.js?$': 'babel-jest',
        },
        transformIgnorePatterns: [
            'node_modules/(?!(sc-base-database|sc-common|sc-game-base|sc-base-apis|sc-api-client|sc-game-service-integration|sc-game-service-integration-utils)/)',
        ],
        testEnvironment: 'node',
        setupFilesAfterEnv: ['jest-extended'],
        testResultsProcessor: 'jest-sonar-reporter',
        coverageDirectory: 'coverage',
        reporters: ['default', ['jest-junit', { outputDirectory: 'coverage' }]],
        coverageReporters: ['clover', 'lcov', 'cobertura', 'text-summary', 'text', 'html'],
    };
};
