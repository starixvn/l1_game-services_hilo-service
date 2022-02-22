import oddsGenerator from "../odds-generator";
import { odds } from "../../__tests__/test-data";

describe("OddsGenerator", () => {
    describe("generate", () => {
        describe("when base card is A", () => {
            // Arrange
            const testCases = [
                { rank: "A", totalTurns: 0 },
                { rank: "A", totalTurns: 1 },
                { rank: "A", totalTurns: 6 },
                { rank: "A", totalTurns: 7 },
            ];

            it.each(testCases)("should return odds= { h: 0, l:0 }", (testCase) => {
                // Arrange
                const expectedValue = { h: 0, l: 0 };

                // Act
                const actualValue = oddsGenerator.generate(odds, testCase.rank, testCase.totalTurns);

                // Assert
                expect(actualValue).toStrictEqual(expectedValue);
            });
        });

        describe("when base card is 2", () => {
            // Arrange
            const testCases = [
                { rank: "2", totalTurns: 0 },
                { rank: "2", totalTurns: 1 },
                { rank: "2", totalTurns: 6 },
                { rank: "2", totalTurns: 7 },
            ];

            it.each(testCases)("should return odds= { h: 0, l:0 }", (testCase) => {
                // Arrange
                const expectedValue = { h: 0, l: 0 };

                // Act
                const actualValue = oddsGenerator.generate(odds, testCase.rank, testCase.totalTurns);

                // Assert
                expect(actualValue).toStrictEqual(expectedValue);
            });
        });

        describe("when base card is not A or 2 and first turn", () => {
            // Arrange
            const testCases = [
                { rank: "J", totalTurns: 1, expectedValue: { h: 276, l: 28 } },
                { rank: "8", totalTurns: 1, expectedValue: { h: 0.9, l: 0.9 } },
            ];

            it.each(testCases)("should return correct odds", (testCase) => {
                // Act
                const actualValue = oddsGenerator.generate(odds, testCase.rank, testCase.totalTurns);
                console.log(testCase);
                console.log(actualValue);

                // Assert
                expect(actualValue).toStrictEqual(testCase.expectedValue);
            });
        });

        describe("when base card is not A or 2 and turn > 1", () => {
            // Arrange
            const testCases = [
                { rank: "J", totalTurns: 7, expectedValue: { h: 138, l: 14 } },
                { rank: "8", totalTurns: 7, expectedValue: { h: 0.45, l: 0.45 } },
            ];

            it.each(testCases)("should return correct odds", (testCase) => {
                // Act
                const actualValue = oddsGenerator.generate(odds, testCase.rank, testCase.totalTurns);
                console.log(testCase);
                console.log(actualValue);

                // Assert
                expect(actualValue).toStrictEqual(testCase.expectedValue);
            });
        });
    });
});
