import oddsGenerator from "../odds-generator";
import { odds } from "../../__tests__/set-up";

describe("odds-generator", () => {
    describe("generate", () => {
        // Arrange
        const testCases = [
            { rank: "A", expectedValue: { h: 0, l: 0 } },
            { rank: "2", expectedValue: { h: 0, l: 0 } },
            { rank: "J", expectedValue: { h: 276, l: 28 } },
        ];

        it.each(testCases)("should return correct odds", (testCase) => {
            // Arrange
            const totalTurns = 1;

            // Act
            const actualValue = oddsGenerator.generate(odds, testCase.rank, totalTurns);

            // Assert
            expect(actualValue).toStrictEqual(testCase.expectedValue);
        });
    });
});
