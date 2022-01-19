import { Core } from "sc-game-base";
import { baseCards } from "../../cards";
import { SettleGameRoundConsumer } from "../index";
import mongoose from "mongoose";
import { stubMongooseModelStupidly } from "jest-micro-auto-stub";

describe("settle-game-round-consumer", () => {
    describe("extends", () => {
        it("inherit Core.BaseEventConsumers.SettleGameRoundConsumer", () => {
            // act
            const consumer = new SettleGameRoundConsumer({});

            //assert
            expect(consumer instanceof Core.BaseEventConsumers.SettleGameRoundConsumer);
        });
    });

    describe("generateResult", () => {
        it("when resultFromAdmin is set for user should return resultFromAdmin", () => {
            // arrange
            const gameData = { settlementResultFromAdmin: { player: [{ rank: "3" }] } };
            const consumer = new SettleGameRoundConsumer({ gameData });
            const expectedValue = { rank: "3" };
            const runningRound = { name: "player", id: 10, result: [], totalTurns: 0 };

            // act
            const actualValue = consumer.generateResult(runningRound);

            //assert
            expect(actualValue.rank).toStrictEqual(expectedValue.rank);
        });

        const testCases = [{ settlementResultFromAdmin: null }, { settlementResultFromAdmin: { player: [{ rank: "2" }] } }];
        it.each(testCases)("when resultFromAdmin is not set for user should generate new result", (testCase) => {
            // arrange
            const gameData = { settlementResultFromAdmin: testCase.settlementResultFromAdmin };
            const consumer = new SettleGameRoundConsumer({ gameData });
            const expectedValue = null;
            const runningRound = { name: "player01", id: 11, result: [...baseCards], totalTurns: 3 };

            // act
            const actualValue = consumer.generateResult(runningRound);

            //assert
            expect(actualValue).not.toBe(expectedValue);
        });
    });

    describe("calculateBetResult", () => {
        it("when not win should return correct value", () => {
            // arrange
            const gameData = {};
            const consumer = new SettleGameRoundConsumer({ gameData });
            const settlementResult = { isWin: false, betwin: 0 };
            const bet = { amount: 10 };
            const expectedValue = {
                isWin: false,
                betwin: 0,
                totalBetAmount: 10,
                netWin: 0,
                totalWin: 0,
                totalLost: 10,
            };

            // act
            const actualValue = consumer.calculateBetResult(settlementResult, bet);

            //assert
            expect(actualValue).toStrictEqual(expectedValue);
        });

        it("when win should return correct value", () => {
            // arrange
            const gameData = {};
            const consumer = new SettleGameRoundConsumer({ gameData });
            const settlementResult = { isWin: true, betwin: 20 };
            const bet = { amount: 10 };
            const expectedValue = {
                isWin: true,
                totalBetAmount: 10,
                netWin: 10,
                totalWin: 20,
                totalLost: 0,
                betwin: 20,
            };

            // act
            const actualValue = consumer.calculateBetResult(settlementResult, bet);

            //assert
            expect(actualValue).toStrictEqual(expectedValue);
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
            const consumer = new SettleGameRoundConsumer({ gameData, roundsRepository, userBetResultPublisher });
            const player = { uid: "m1", name: "m1" };
            const payload = { betChoice: testCase.betChoice };
            spyOn(consumer, "addBetLog");
            spyOn(consumer, "settleBets");

            // act
            await consumer.settleTurn(player, payload);

            //assert
            expect(consumer.addBetLog).toHaveBeenCalled();
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
            const consumer = new SettleGameRoundConsumer({ gameData, betLogsRepository });
            const runningRound = { totalTurns: 3 };
            const card1 = { rank: "4", suit: 0 };
            const card2 = { rank: "5", suit: 0 };

            // act
            await consumer.addBetLog(runningRound, card1, card2, "h", 10);

            //assert
            expect(betLogsRepository.create).toBeCalled();
        });
    });

    describe("settleRound", () => {
        it("should do nothing", async () => {
            // arrange
            const consumer = new SettleGameRoundConsumer({});
            spyOn(consumer, "generateResult");

            // act
            await consumer.settleRound();

            //assert
            expect(consumer.generateResult).not.toHaveBeenCalled();
        });
    });

    describe("settleBets", () => {
        it("when not have bet should not call bet with end time", async () => {
            // arrange
            const gameData = {
                gameConfigs: {},
                ingame: { m1: { betTracks: { result: {}, settlementBetResult: { betwin: 10 }, id: 1, endTime: new Date() } } },
            };
            const definition = {};
            const userBetResultPublisher = { publish: jest.fn() };
            const roundResultPublisher = { publishRoundResult: jest.fn() };
            const consumer = new SettleGameRoundConsumer({ gameData, definition, userBetResultPublisher, roundResultPublisher });
            const bet = { save: jest.fn() };
            spyOn(consumer, "queryBets").and.returnValue([]);
            consumer.endGame = async () => {
                return {
                    isOk: true,
                };
            };

            // act
            await consumer.settleBets("m1");

            //assert
            expect(bet.save).not.toHaveBeenCalled();
        });

        it("should save bet with end time", async () => {
            // arrange
            const gameData = {
                gameConfigs: {},
                ingame: { m1: { betTracks: { result: {}, settlementBetResult: { betwin: 10 }, id: 1, endTime: new Date() } } },
            };
            const definition = {};
            const userBetResultPublisher = { publish: jest.fn() };
            const roundResultPublisher = { publishRoundResult: jest.fn() };
            const consumer = new SettleGameRoundConsumer({ gameData, definition, userBetResultPublisher, roundResultPublisher });
            const bet = { save: jest.fn() };
            spyOn(consumer, "queryBets").and.returnValue([bet]);
            consumer.endGame = async () => {
                return {
                    isOk: true,
                };
            };

            // act
            await consumer.settleBets("m1");

            //assert
            expect(bet.save).toHaveBeenCalled();
        });
    });

    describe("isWin", () => {
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
            const consumer = new SettleGameRoundConsumer({});

            // act
            const actualValue = consumer.isWin(testCase.choice, testCase.previousCard, testCase.nextCard);

            //assert
            expect(actualValue).toStrictEqual(testCase.expectedValue);
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
            const consumer = new SettleGameRoundConsumer({});

            // act
            const actualValue = consumer.getSettlementResult(testCase.previousCard, testCase.nextCard);

            //assert
            expect(actualValue).toStrictEqual(testCase.expectedValue);
        });
    });

    describe("queryBets", () => {
        it("should return from db", async () => {
            // arrange
            const bets = [];
            const roundsRepository = {
                find: () => {
                    return { exec: () => bets };
                },
            };

            const consumer = new SettleGameRoundConsumer({ roundsRepository });

            // act
            const actualValue = await consumer.queryBets();

            //assert
            expect(actualValue).toStrictEqual(bets);
        });
    });
});
