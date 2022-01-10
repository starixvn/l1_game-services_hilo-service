import oddsGenerator from '../odds-generator';

describe('odds-generator', () => {
    describe('generate', () => {
        // arrange
        const testCases = [
            { rank: 0, expectedValue: { h: 0, l: 0 } },
            { rank: 1, expectedValue: { h: 0, l: 0 } },
            { rank: 10, expectedValue: { h: 2.76, l: 0.28 } },
        ];

        it.each(testCases)('should return correct odds', (testCase) => {
            // arrange
            const odds = { ['11']: 276, ['5']: 28 };
            const totalTurns = 1;

            // act
            const actualValue = oddsGenerator.generate(odds, testCase.rank, totalTurns);

            //assert
            expect(actualValue).toStrictEqual(testCase.expectedValue);
        });
    });
});
