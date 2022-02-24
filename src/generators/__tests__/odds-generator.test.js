import oddsGenerator from "../odds-generator";
import { odds } from "../../__tests__/test-data";
import { choiceNames } from "../../game-settings";

describe("OddsGenerator", () => {
    describe("generate", () => {
        describe("when base card is A", () => {
            // Arrange
            const testCases = [{ totalTurns: 0 }, { totalTurns: 1 }, { totalTurns: 6 }, { totalTurns: 7 }];

            it.each(testCases)("should return odds= { h: 0, l:0 }", (testCase) => {
                // Arrange
                const rank = "A";
                const expectedValue = { h: 0, l: 0 };

                // Act
                const actualValue = oddsGenerator.generate(odds, rank, testCase.totalTurns);

                // Assert
                expect(actualValue).toStrictEqual(expectedValue);
            });
        });

        describe("when base card is 2", () => {
            // Arrange
            const testCases = [{ totalTurns: 0 }, { totalTurns: 1 }, { totalTurns: 6 }, { totalTurns: 7 }];

            it.each(testCases)("should return odds= { h: 0, l:0 }", (testCase) => {
                // Arrange
                const rank = "2";
                const expectedValue = { h: 0, l: 0 };

                // Act
                const actualValue = oddsGenerator.generate(odds, rank, testCase.totalTurns);

                // Assert
                expect(actualValue).toStrictEqual(expectedValue);
            });
        });

        describe("when base card is not A or 2 and first turn", () => {
            // Arrange
            const testCases = [
                { rank: "3", expectedValue: { h: 0.05, l: 10.2 } },
                { rank: "4", expectedValue: { h: 0.16, l: 4.62 } },
                { rank: "5", expectedValue: { h: 0.28, l: 2.76 } },
                { rank: "6", expectedValue: { h: 0.44, l: 1.83 } },
                { rank: "7", expectedValue: { h: 0.63, l: 1.27 } },
                { rank: "8", expectedValue: { h: 0.9, l: 0.9 } },
                { rank: "9", expectedValue: { h: 1.27, l: 0.63 } },
                { rank: "10", expectedValue: { h: 1.83, l: 0.44 } },
                { rank: "J", expectedValue: { h: 2.76, l: 0.28 } },
                { rank: "Q", expectedValue: { h: 4.62, l: 0.16 } },
                { rank: "K", expectedValue: { h: 10.2, l: 0.05 } },
            ];

            it.each(testCases)("should return odds from config", (testCase) => {
                // Act
                const actualValue = oddsGenerator.generate(odds, testCase.rank, 1);

                // Assert
                expect(actualValue).toStrictEqual(testCase.expectedValue);
            });
        });

        describe("when base card is not 2 and < 8 and turn > 1", () => {
            // Arrange
            const testCases = [
                { rank: "3", totalTurns: 3, expectedValue: { h: 0.0375, l: 7.65 } },
                { rank: "4", totalTurns: 3, expectedValue: { h: 0.12, l: 3.465 } },
                { rank: "5", totalTurns: 3, expectedValue: { h: 0.21, l: 2.07 } },
                { rank: "6", totalTurns: 3, expectedValue: { h: 0.33, l: 1.3725 } },
                { rank: "7", totalTurns: 3, expectedValue: { h: 0.4725, l: 0.9525 } },
                { rank: "3", totalTurns: 5, expectedValue: { h: 0.03, l: 6.12 } },
                { rank: "4", totalTurns: 5, expectedValue: { h: 0.096, l: 2.772 } },
                { rank: "5", totalTurns: 5, expectedValue: { h: 0.168, l: 1.656 } },
                { rank: "6", totalTurns: 5, expectedValue: { h: 0.264, l: 1.098 } },
                { rank: "7", totalTurns: 5, expectedValue: { h: 0.378, l: 0.762 } },
                { rank: "3", totalTurns: 7, expectedValue: { h: 0.025, l: 5.1 } },
                { rank: "4", totalTurns: 7, expectedValue: { h: 0.08, l: 2.31 } },
                { rank: "5", totalTurns: 7, expectedValue: { h: 0.14, l: 1.38 } },
                { rank: "6", totalTurns: 7, expectedValue: { h: 0.22, l: 0.915 } },
                { rank: "7", totalTurns: 7, expectedValue: { h: 0.315, l: 0.635 } },
            ];

            it.each(testCases)("should return correct odds", (testCase) => {
                // Act
                const actualValue = oddsGenerator.generate(odds, testCase.rank, testCase.totalTurns);
                const formatValue = {
                    [choiceNames.h]: parseFloat(actualValue[choiceNames.h].toFixed(4)),
                    [choiceNames.l]: parseFloat(testCase.expectedValue[choiceNames.l].toFixed(4)),
                };

                // Assert
                expect(formatValue).toStrictEqual(testCase.expectedValue);
            });
        });

        describe("when base card is 8 and turn > 1", () => {
            // Arrange
            const testCases = [
                { rank: "8", totalTurns: 3, expectedValue: { h: 0.675, l: 0.675 } },
                { rank: "8", totalTurns: 5, expectedValue: { h: 0.54, l: 0.54 } },
                { rank: "8", totalTurns: 7, expectedValue: { h: 0.45, l: 0.45 } },
            ];

            it.each(testCases)("should return correct odds", (testCase) => {
                // Act
                const actualValue = oddsGenerator.generate(odds, testCase.rank, testCase.totalTurns);
                const formatValue = {
                    [choiceNames.h]: parseFloat(actualValue[choiceNames.h].toFixed(4)),
                    [choiceNames.l]: parseFloat(testCase.expectedValue[choiceNames.l].toFixed(4)),
                };

                // Assert
                expect(formatValue).toStrictEqual(testCase.expectedValue);
            });
        });

        describe("when base card is not A and > 8 and turn > 1", () => {
            // Arrange
            const testCases = [
                { rank: "9", totalTurns: 3, expectedValue: { h: 0.9525, l: 0.4725 } },
                { rank: "10", totalTurns: 3, expectedValue: { h: 1.3725, l: 0.33 } },
                { rank: "J", totalTurns: 3, expectedValue: { h: 2.07, l: 0.21 } },
                { rank: "Q", totalTurns: 3, expectedValue: { h: 3.465, l: 0.12 } },
                { rank: "K", totalTurns: 3, expectedValue: { h: 7.65, l: 0.0375 } },
                { rank: "9", totalTurns: 5, expectedValue: { h: 0.762, l: 0.378 } },
                { rank: "10", totalTurns: 5, expectedValue: { h: 1.098, l: 0.264 } },
                { rank: "J", totalTurns: 5, expectedValue: { h: 1.656, l: 0.168 } },
                { rank: "Q", totalTurns: 5, expectedValue: { h: 2.772, l: 0.096 } },
                { rank: "K", totalTurns: 5, expectedValue: { h: 6.12, l: 0.03 } },
                { rank: "9", totalTurns: 7, expectedValue: { h: 0.635, l: 0.315 } },
                { rank: "10", totalTurns: 7, expectedValue: { h: 0.915, l: 0.22 } },
                { rank: "J", totalTurns: 7, expectedValue: { h: 1.38, l: 0.14 } },
                { rank: "Q", totalTurns: 7, expectedValue: { h: 2.31, l: 0.08 } },
                { rank: "K", totalTurns: 7, expectedValue: { h: 5.1, l: 0.025 } },
            ];

            it.each(testCases)("should return correct odds", (testCase) => {
                // Act
                const actualValue = oddsGenerator.generate(odds, testCase.rank, testCase.totalTurns);
                const formatValue = {
                    [choiceNames.h]: parseFloat(actualValue[choiceNames.h].toFixed(4)),
                    [choiceNames.l]: parseFloat(testCase.expectedValue[choiceNames.l].toFixed(4)),
                };

                // Assert
                expect(formatValue).toStrictEqual(testCase.expectedValue);
            });
        });
    });
});
