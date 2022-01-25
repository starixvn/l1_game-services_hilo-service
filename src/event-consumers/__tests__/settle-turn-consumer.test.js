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
            { nextCard: { rank: "4" }, previousCard: { rank: "4" }, expectedValue: "t" },
            { nextCard: { rank: "4" }, previousCard: { rank: "A" }, expectedValue: "l" },
            { nextCard: { rank: "2" }, previousCard: { rank: "A" }, expectedValue: "l" },
            { nextCard: { rank: "2" }, previousCard: { rank: "3" }, expectedValue: "l" },

            { nextCard: { rank: "A" }, previousCard: { rank: "2" }, expectedValue: "h" },
            { nextCard: { rank: "A" }, previousCard: { rank: "3" }, expectedValue: "h" },
            { nextCard: { rank: "3" }, previousCard: { rank: "2" }, expectedValue: "h" },

            { nextCard: { rank: "4" }, previousCard: { rank: "3" }, expectedValue: "h" },
            { nextCard: { rank: "4" }, previousCard: { rank: "5" }, expectedValue: "l" },
        ];

        it.each(testCases)("should return correct value", (testCase) => {
            // arrange
            const consumer = new SettleTurnConsumer({});

            // act
            const actualValue = consumer.getSettlementResult(testCase.previousCard, testCase.nextCard);

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
            { nextCard: { rank: "3" }, previousCard: { rank: "A" }, expectedValue: true },
            { nextCard: { rank: "3" }, previousCard: { rank: "2" }, expectedValue: true },
            { nextCard: { rank: "A" }, previousCard: { rank: "4" }, choice: "h", expectedValue: true },
            { nextCard: { rank: "4" }, previousCard: { rank: "4" }, choice: "h", expectedValue: true },
            { nextCard: { rank: "4" }, previousCard: { rank: "3" }, choice: "h", expectedValue: true },
            { nextCard: { rank: "4" }, previousCard: { rank: "5" }, choice: "h", expectedValue: false },
            { nextCard: { rank: "2" }, previousCard: { rank: "4" }, choice: "l", expectedValue: true },
            { nextCard: { rank: "4" }, previousCard: { rank: "4" }, choice: "l", expectedValue: true },
            { nextCard: { rank: "4" }, previousCard: { rank: "3" }, choice: "l", expectedValue: false },
            { nextCard: { rank: "4" }, previousCard: { rank: "5" }, choice: "l", expectedValue: true },
        ];

        it.each(testCases)("should return correct value", (testCase) => {
            // arrange
            const consumer = new SettleTurnConsumer({});

            // act
            const actualValue = consumer.isWinOrTie(testCase.choice, testCase.previousCard, testCase.nextCard);

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

            const userBetResultPublisher = { publish: jest.fn() };
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
