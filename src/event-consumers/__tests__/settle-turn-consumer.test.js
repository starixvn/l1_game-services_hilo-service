import { baseCards } from "../../cards";
import { SettleTurnConsumer } from "../index";
import mongoose from "mongoose";
import { stubMongooseModelStupidly } from "jest-micro-auto-stub";

describe("settle-turn-consumer", () => {
    describe("generateResult", () => {
        describe("when resultFromAdmin is set for user", () => {
            it("should return resultFromAdmin", () => {
                // arrange
                const gameData = { settlementResultFromAdmin: { player: [{ rank: "3" }] } };
                const consumer = new SettleTurnConsumer({ gameData });
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
                const gameData = { settlementResultFromAdmin: testCase.settlementResultFromAdmin };
                const consumer = new SettleTurnConsumer({ gameData });
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
            // arrange
            const consumer = new SettleTurnConsumer({});

            // act
            const actualValue = consumer.getSettlementResult(testCase.currentCard, testCase.resultCard);

            // assert
            expect(actualValue).toStrictEqual(testCase.expectedValue);
        });
    });

    describe("addBetLog", () => {
        it("should call betLogsRepository.create", async () => {
            // arrange
            const gameData = {
                realPlayers: { m1: { uid: "m1", session: {} } },
                exchangeRates: { code: [] },
            };
            const betLogsRepository = stubMongooseModelStupidly(mongoose.Model);
            const consumer = new SettleTurnConsumer({ gameData, betLogsRepository });
            const runningRound = { totalTurns: 3 };
            const card1 = { rank: "4", suit: 0 };
            const card2 = { rank: "5", suit: 0 };

            // act
            await consumer.addBetLog(runningRound, card1, card2, "h", 10);

            // assert
            expect(betLogsRepository.create).toBeCalled();
        });
    });

    describe("isWinOrTie", () => {
        // arrange
        const testCases = [
            { resultCard: { rank: "3" }, currentCard: { rank: "A" }, expectedValue: true },
            { resultCard: { rank: "3" }, currentCard: { rank: "2" }, expectedValue: true },
            { resultCard: { rank: "A" }, currentCard: { rank: "4" }, choice: "h", expectedValue: true },
            { resultCard: { rank: "4" }, currentCard: { rank: "4" }, choice: "h", expectedValue: true },
            { resultCard: { rank: "4" }, currentCard: { rank: "3" }, choice: "h", expectedValue: true },
            { resultCard: { rank: "4" }, currentCard: { rank: "5" }, choice: "h", expectedValue: false },
            { resultCard: { rank: "2" }, currentCard: { rank: "4" }, choice: "l", expectedValue: true },
            { resultCard: { rank: "4" }, currentCard: { rank: "4" }, choice: "l", expectedValue: true },
            { resultCard: { rank: "4" }, currentCard: { rank: "3" }, choice: "l", expectedValue: false },
            { resultCard: { rank: "4" }, currentCard: { rank: "5" }, choice: "l", expectedValue: true },
        ];

        it.each(testCases)("should return correct result base on current card and result card", (testCase) => {
            // arrange
            const consumer = new SettleTurnConsumer({});

            // act
            const actualValue = consumer.isWinOrTie(testCase.choice, testCase.currentCard, testCase.resultCard);

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
        ];
        it.each(testCases)("should add new bet log", async (testCase) => {
            // arrange
            const gameData = {
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

            const roundsRepository = {
                updateOne: () => {
                    return { exec: jest.fn() };
                },
            };

            const userBetResultPublisher = { publishToUser: jest.fn() };
            const settleGameRoundConsumer = { settleBets: jest.fn() };
            const consumer = new SettleTurnConsumer({
                gameData,
                roundsRepository,
                userBetResultPublisher,
                settleGameRoundConsumer,
            });
            const player = { uid: "m1", name: "m1" };
            const payload = { betChoice: testCase.betChoice };
            spyOn(consumer, "addBetLog");
            spyOn(settleGameRoundConsumer, "settleBets");

            // act
            await consumer.settleTurn(player, payload);

            // assert
            expect(consumer.addBetLog).toHaveBeenCalled();
        });
    });
});
