import { Core } from "sc-game-base";
import { SettleGameRoundConsumer } from "../index";

describe("settle-game-round-consumer", () => {
    describe("extends", () => {
        it("inherit Core.BaseEventConsumers.SettleGameRoundConsumer", () => {
            // act
            const consumer = new SettleGameRoundConsumer({});

            // assert
            expect(consumer instanceof Core.BaseEventConsumers.SettleGameRoundConsumer);
        });
    });

    describe("calculateBetResult", () => {
        describe("when not win should", () => {
            it("should return correct value", () => {
                // arrange
                const gameData = {};
                const consumer = new SettleGameRoundConsumer({ gameData });
                const settlementResult = { isWinOrTie: false, betwin: 0 };
                const bet = { amount: 10 };
                const expectedValue = {
                    isWinOrTie: false,
                    betwin: 0,
                    totalBetAmount: 10,
                    netWin: 0,
                    totalWin: 0,
                    totalLost: 10,
                };

                // act
                const actualValue = consumer.calculateBetResult(settlementResult, bet);

                // assert
                expect(actualValue).toStrictEqual(expectedValue);
            });
        });

        describe("when win", () => {
            it("should return correct value", () => {
                // arrange
                const gameData = {};
                const consumer = new SettleGameRoundConsumer({ gameData });
                const settlementResult = { isWinOrTie: true, betwin: 20 };
                const bet = { amount: 10 };
                const expectedValue = {
                    isWinOrTie: true,
                    totalBetAmount: 10,
                    netWin: 10,
                    totalWin: 20,
                    totalLost: 0,
                    betwin: 20,
                };

                // act
                const actualValue = consumer.calculateBetResult(settlementResult, bet);

                // assert
                expect(actualValue).toStrictEqual(expectedValue);
            });
        });
    });

    describe("settleRound", () => {
        it("should do nothing", async () => {
            // arrange
            const consumer = new SettleGameRoundConsumer({});
            spyOn(consumer, "generateResult");

            // act
            await consumer.settleRound();

            // assert
            expect(consumer.generateResult).not.toHaveBeenCalled();
        });
    });

    describe("settleBets", () => {
        describe("when not have bet", () => {
            it("should not call bet with end time", async () => {
                // arrange
                const gameData = {
                    gameConfigs: {},
                    ingame: { m1: { betTracks: { result: {}, turnResult: { betwin: 10 }, id: 1, endTime: new Date() } } },
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

                // assert
                expect(bet.save).not.toHaveBeenCalled();
            });
        });

        it("should save bet with end time", async () => {
            // arrange
            const gameData = {
                gameConfigs: {},
                ingame: { m1: { betTracks: { result: {}, turnResult: { betwin: 10 }, id: 1, endTime: new Date() } } },
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

            // assert
            expect(bet.save).toHaveBeenCalled();
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

            // assert
            expect(actualValue).toStrictEqual(bets);
        });
    });
});
