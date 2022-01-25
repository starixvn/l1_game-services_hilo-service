import oddsGenerator from "../odds-generator";

describe("odds-generator", () => {
    describe("generate", () => {
        // arrange
        const testCases = [
            { rank: "A", expectedValue: { h: 0, l: 0 } },
            { rank: "2", expectedValue: { h: 0, l: 0 } },
            { rank: "J", expectedValue: { h: 276, l: 28 } },
        ];

        it.each(testCases)("should return correct odds", (testCase) => {
            // arrange
            const odds = { ["high11"]: 276, ["high5"]: 28, ["low5"]: 276, ["low11"]: 28 };
            const totalTurns = 1;

            // act
            const actualValue = oddsGenerator.generate(odds, testCase.rank, totalTurns);

            // assert
            expect(actualValue).toStrictEqual(testCase.expectedValue);
        });
    });
});
