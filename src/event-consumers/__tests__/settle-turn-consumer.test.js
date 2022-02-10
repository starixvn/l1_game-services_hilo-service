import { baseCards } from "../../cards";
import { SettleTurnConsumer } from "../index";
import mongoose from "mongoose";
import { stubMongooseModelStupidly } from "jest-micro-auto-stub";

describe("settle-turn-consumer", () => {
    let betLogsRepository;
    let consumer;

    beforeEach(() => {
        // arrange
        betLogsRepository = stubMongooseModelStupidly(mongoose.Model);
        consumer = new SettleTurnConsumer({ betLogsRepository });
    });

    describe("generateResult", () => {
        describe("when resultFromAdmin is set for user", () => {
            it("should return resultFromAdmin", () => {
                // arrange
                consumer.gameData = { settlementResultFromAdmin: { player: [{ rank: "3" }] } };
                const expectedValue = { rank: "3" };
                const runningRound = { name: "player", id: 10, result: [], totalTurns: 0 };

                // act
                const actualValue = consumer.generateResult(runningRound);

                // assert
                expect(actualValue.rank).toStrictEqual(expectedValue.rank);
            });
        });

        describe("when resultFromAdmin is not set for user", () => {
            const testCases = [{ settlementResultFromAdmin: null }, { settlementResultFromAdmin: { player: [{ rank: "2" }] } }];
            it.each(testCases)("should generate new result", (testCase) => {
                // arrange
                consumer.gameData = { settlementResultFromAdmin: testCase.settlementResultFromAdmin };
                const expectedValue = null;
                const runningRound = { name: "player01", id: 11, result: [...baseCards], totalTurns: 3 };

                // act
                const actualValue = consumer.generateResult(runningRound);

                // assert
                expect(actualValue).not.toBe(expectedValue);
            });
        });
    });

    describe("getSettlementResult", () => {
        // arrange
        const testCases = [
            { resultCard: { rank: "4" }, currentCard: { rank: "4" }, expectedValue: "t" },
            { resultCard: { rank: "4" }, currentCard: { rank: "A" }, expectedValue: "l" },
            { resultCard: { rank: "2" }, currentCard: { rank: "A" }, expectedValue: "l" },
            { resultCard: { rank: "2" }, currentCard: { rank: "3" }, expectedValue: "l" },

            { resultCard: { rank: "A" }, currentCard: { rank: "2" }, expectedValue: "h" },
            { resultCard: { rank: "A" }, currentCard: { rank: "3" }, expectedValue: "h" },
            { resultCard: { rank: "3" }, currentCard: { rank: "2" }, expectedValue: "h" },

            { resultCard: { rank: "4" }, currentCard: { rank: "3" }, expectedValue: "h" },
            { resultCard: { rank: "4" }, currentCard: { rank: "5" }, expectedValue: "l" },
        ];

        it.each(testCases)("should return correct settlement result base on current card and result card", (testCase) => {
            // act
            const actualValue = consumer.getSettlementResult(testCase.currentCard, testCase.resultCard);

            // assert
            expect(actualValue).toStrictEqual(testCase.expectedValue);
        });
    });

    describe("addBetLog", () => {
        it("should call betLogsRepository.create", async () => {
            // arrange
            consumer.gameData = {
                realPlayers: { m1: { uid: "m1", session: {} } },
                exchangeRates: { code: [] },
            };
            const runningRound = { totalTurns: 3, result: [{ rank: "4", suit: 0 }] };
            const turnResult = { betwin: 10, result: [{ rank: "5", suit: 0 }] };

            // act
            await consumer.addBetLog(runningRound, "h", turnResult);

            // assert
            expect(betLogsRepository.create).toBeCalled();
        });
    });

    describe("isLose", () => {
        // arrange
        const testCases = [
            { resultCard: { rank: "A" }, currentCard: { rank: "4" }, choice: "h", expectedValue: false },
            { resultCard: { rank: "4" }, currentCard: { rank: "4" }, choice: "h", expectedValue: false },
            { resultCard: { rank: "4" }, currentCard: { rank: "3" }, choice: "h", expectedValue: false },
            { resultCard: { rank: "4" }, currentCard: { rank: "5" }, choice: "h", expectedValue: true },
            { resultCard: { rank: "2" }, currentCard: { rank: "4" }, choice: "l", expectedValue: false },
            { resultCard: { rank: "4" }, currentCard: { rank: "4" }, choice: "l", expectedValue: false },
            { resultCard: { rank: "4" }, currentCard: { rank: "3" }, choice: "l", expectedValue: true },
            { resultCard: { rank: "4" }, currentCard: { rank: "5" }, choice: "l", expectedValue: false },
        ];

        it.each(testCases)("should return correct result base on current card and result card", (testCase) => {
            // act
            const actualValue = consumer.isLose(testCase.choice, testCase.currentCard, testCase.resultCard);

            // assert
            expect(actualValue).toStrictEqual(testCase.expectedValue);
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
            // arrange
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

            // act
            await consumer.settleTurn(player, payload);

            // assert
            expect(consumer.addBetLog).toHaveBeenCalled();
        });
    });

    describe("calculateTurnResult", () => {
        describe("when lose", () => {
            it("should return next amounts = null", async () => {
                // arrange
                consumer.gameData = { gameConfigs: { odds: {} } };
                const runningRound = { totalTurns: 3, result: [{ rank: "A", suit: 0 }], settlementResult: [] };
                const payload = { betChoice: "h" };

                // act
                const actualValue = await consumer.calculateTurnResult(payload, runningRound);

                // assert
                expect(actualValue.nextAmounts).toBeNull();
            });
        });

        describe("when win", () => {
            it("should return next amounts base on odds and turn order", async () => {
                // arrange
                consumer.gameData = { gameConfigs: { odds: { high8: 0.9, low8: 0.9 } } };
                spyOn(consumer, "generateResult").and.returnValue({ rank: "8", suit: 0 });
                const runningRound = { totalTurns: 0, betwin: 1, result: [{ rank: "8", suit: 0 }], settlementResult: [] };
                const payload = { betChoice: "h" };
                const expectedValue = { h: 3.37, l: 3.37 };

                // act
                const actualValue = await consumer.calculateTurnResult(payload, runningRound);

                // assert
                expect(actualValue.nextAmounts).toStrictEqual(expectedValue);
            });
        });
    });
});
