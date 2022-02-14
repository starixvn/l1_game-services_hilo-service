import { baseCards } from "../../cards";
import { SettleTurnConsumer } from "../index";
import mongoose from "mongoose";
import { stubMongooseModelStupidly } from "jest-micro-auto-stub";

describe("settle-turn-consumer", () => {
    let betLogsRepository;
    let consumer;

    beforeEach(() => {
        // Arrange
        betLogsRepository = stubMongooseModelStupidly(mongoose.Model);
        consumer = new SettleTurnConsumer({ betLogsRepository });
    });

    describe("generateResult", () => {
        describe("when resultFromAdmin is set for user", () => {
            it("should return resultFromAdmin", () => {
                // Arrange
                consumer.gameData = { settlementResultFromAdmin: { player: [{ rank: "8" }, { rank: "3" }] } };
                const expectedValue = { rank: "3" };
                const runningRound = { name: "player", id: 10, result: [], totalTurns: 0 };

                // Act
                const actualValue = consumer.generateResult(runningRound);

                // Assert
                expect(actualValue.rank).toStrictEqual(expectedValue.rank);
            });
        });

        describe("when resultFromAdmin is not set for user", () => {
            const testCases = [{ settlementResultFromAdmin: null }, { settlementResultFromAdmin: { player: [{ rank: "2" }] } }];
            it.each(testCases)("should generate new result", (testCase) => {
                // Arrange
                consumer.gameData = { settlementResultFromAdmin: testCase.settlementResultFromAdmin };
                const expectedValue = null;
                const runningRound = { name: "player01", id: 11, result: [...baseCards], totalTurns: 3 };

                // Act
                const actualValue = consumer.generateResult(runningRound);

                // Assert
                expect(actualValue).not.toBe(expectedValue);
            });
        });
    });

    describe("getSettlementResult", () => {
        describe("when result is low", () => {
            // Arrange
            const testCases = [
                { resultCard: { rank: "4" }, currentCard: { rank: "A" } },
                { resultCard: { rank: "2" }, currentCard: { rank: "A" } },
                { resultCard: { rank: "2" }, currentCard: { rank: "3" } },
                { resultCard: { rank: "4" }, currentCard: { rank: "5" } },
            ];

            it.each(testCases)("should return l", (testCase) => {
                // Arrange
                const expectedValue = "l";

                // Act
                const actualValue = consumer.getSettlementResult(testCase.currentCard, testCase.resultCard);

                // Assert
                expect(actualValue).toStrictEqual(expectedValue);
            });
        });

        describe("when result is high", () => {
            // Arrange
            const testCases = [
                { resultCard: { rank: "A" }, currentCard: { rank: "2" } },
                { resultCard: { rank: "A" }, currentCard: { rank: "3" } },
                { resultCard: { rank: "3" }, currentCard: { rank: "2" } },
                { resultCard: { rank: "4" }, currentCard: { rank: "3" } },
            ];

            it.each(testCases)("should return h", (testCase) => {
                // Arrange
                const expectedValue = "h";

                // Act
                const actualValue = consumer.getSettlementResult(testCase.currentCard, testCase.resultCard);

                // Assert
                expect(actualValue).toStrictEqual(expectedValue);
            });
        });
        describe("when result is tie", () => {
            // Arrange
            const testCases = [{ resultCard: { rank: "4" }, currentCard: { rank: "4" }, expectedValue: "t" }];

            it.each(testCases)("should return t", (testCase) => {
                // Arrange
                const expectedValue = "t";

                // Act
                const actualValue = consumer.getSettlementResult(testCase.currentCard, testCase.resultCard);

                // Assert
                expect(actualValue).toStrictEqual(expectedValue);
            });
        });
    });

    describe("addBetLog", () => {
        it("should call betLogsRepository.create", async () => {
            // Arrange
            consumer.gameData = {
                realPlayers: { m1: { uid: "m1", session: {} } },
                exchangeRates: { code: [] },
            };
            const runningRound = { totalTurns: 3, result: [{ rank: "4", suit: 0 }] };
            const turnResult = { betwin: 10, result: [{ rank: "5", suit: 0 }] };

            // Act
            await consumer.addBetLog(runningRound, "h", turnResult);

            // Assert
            expect(betLogsRepository.create).toBeCalled();
        });
    });

    describe("isLose", () => {
        describe("when lose", () => {
            // Arrange
            const testCases = [
                { resultCard: { rank: "4" }, currentCard: { rank: "5" }, choice: "h", expectedValue: true },
                { resultCard: { rank: "4" }, currentCard: { rank: "3" }, choice: "l", expectedValue: true },
            ];

            it.each(testCases)("should return true", (testCase) => {
                // Act
                const actualValue = consumer.isLose(testCase.choice, testCase.currentCard, testCase.resultCard);

                // Assert
                expect(actualValue).toBeTruthy();
            });
        });

        describe("when win", () => {
            // Arrange
            const testCases = [
                { resultCard: { rank: "A" }, currentCard: { rank: "4" }, choice: "h", expectedValue: false },
                { resultCard: { rank: "4" }, currentCard: { rank: "3" }, choice: "h", expectedValue: false },
                { resultCard: { rank: "2" }, currentCard: { rank: "4" }, choice: "l", expectedValue: false },
                { resultCard: { rank: "4" }, currentCard: { rank: "5" }, choice: "l", expectedValue: false },
            ];

            it.each(testCases)("should return false", (testCase) => {
                // Act
                const actualValue = consumer.isLose(testCase.choice, testCase.currentCard, testCase.resultCard);

                // Assert
                expect(actualValue).toBeFalsy();
            });
        });
        describe("when tie", () => {
            // Arrange
            const testCases = [
                { resultCard: { rank: "4" }, currentCard: { rank: "4" }, choice: "h", expectedValue: false },
                { resultCard: { rank: "4" }, currentCard: { rank: "4" }, choice: "l", expectedValue: false },
            ];

            it.each(testCases)("should return false", (testCase) => {
                // Act
                const actualValue = consumer.isLose(testCase.choice, testCase.currentCard, testCase.resultCard);

                // Assert
                expect(actualValue).toBeFalsy();
            });
        });
    });

    describe("settleTurn", () => {
        const testCases = [
            {
                previousCards: [{ rank: "4", suit: 3 }],
                betChoice: "h",
            },
            {
                previousCards: [{ rank: "4", suit: 3 }],
                betChoice: "l",
            },
            {
                previousCards: [{ rank: "8", suit: 3 }],
                betChoice: "h",
            },
            {
                previousCards: [{ rank: "8", suit: 3 }],
                betChoice: "l",
            },
        ];
        it.each(testCases)("should add new bet log", async (testCase) => {
            // Arrange
            consumer.gameData = {
                ingame: {
                    m1: {
                        betTracks: {
                            id: 10,
                            result: testCase.previousCards,
                            settlementResult: [],
                            name: "m1",
                            totalTurns: 0,
                        },
                    },
                },
                settlementResultFromAdmin: { m1: [{ rank: "3" }] },
                gameConfigs: { odds: {} },
            };

            consumer.roundsRepository = {
                updateOne: () => {
                    return { exec: jest.fn() };
                },
            };

            consumer.userBetResultPublisher = { publishToUser: jest.fn() };
            consumer.settleGameRoundConsumer = { settleBets: jest.fn() };
            const player = { uid: "m1", name: "m1" };
            const payload = { betChoice: testCase.betChoice };
            spyOn(consumer, "addBetLog");
            spyOn(consumer.settleGameRoundConsumer, "settleBets");
            spyOn(consumer, "generateResult").and.returnValue({ rank: "8", suit: 0 });

            // Act
            await consumer.settleTurn(player, payload);

            // Assert
            expect(consumer.addBetLog).toHaveBeenCalled();
        });
    });

    describe("calculateTurnResult", () => {
        describe("when lose", () => {
            it("should return next amounts = null", async () => {
                // Arrange
                consumer.gameData = { gameConfigs: { odds: {} } };
                spyOn(consumer, "generateResult").and.returnValue({ rank: "8", suit: 0 });
                const runningRound = { totalTurns: 3, result: [{ rank: "A", suit: 0 }], settlementResult: [] };
                const payload = { betChoice: "h" };

                // Act
                const actualValue = await consumer.calculateTurnResult(payload, runningRound);

                // Assert
                expect(actualValue.nextAmounts).toBeNull();
            });
        });

        describe("when win", () => {
            it("should return next amounts base on odds and turn order", async () => {
                // Arrange
                consumer.gameData = { gameConfigs: { odds: { high7: 0.9, low7: 0.9, high8: 0.9, low8: 0.9 } } };
                spyOn(consumer, "generateResult").and.returnValue({ rank: "8", suit: 0 });
                const runningRound = { totalTurns: 0, betwin: 1, result: [{ rank: "7", suit: 0 }], settlementResult: [] };
                const payload = { betChoice: "h" };
                const expectedValue = { h: 3.37, l: 3.37 };

                // Act
                const actualValue = await consumer.calculateTurnResult(payload, runningRound);

                // Assert
                expect(actualValue.nextAmounts).toStrictEqual(expectedValue);
            });
        });

        describe("when tie", () => {
            it("should return next amounts = current amount", async () => {
                // Arrange
                consumer.gameData = { gameConfigs: { odds: { high8: 0.9, low8: 0.9 } } };
                spyOn(consumer, "generateResult").and.returnValue({ rank: "8", suit: 0 });
                const runningRound = { totalTurns: 0, betwin: 1, result: [{ rank: "8", suit: 0 }], settlementResult: [] };
                const payload = { betChoice: "h" };
                const expectedValue = { h: 1.77, l: 1.77 };

                // Act
                const actualValue = await consumer.calculateTurnResult(payload, runningRound);

                // Assert
                expect(actualValue.betwin).toStrictEqual(runningRound.betwin);
                expect(actualValue.nextAmounts).toStrictEqual(expectedValue);
            });
        });
    });
});
