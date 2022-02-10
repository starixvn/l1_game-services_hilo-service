import { Core } from "sc-game-base";
import { SettleGameRoundConsumer } from "../index";

describe("settle-game-round-consumer", () => {
    let consumer;
    beforeEach(() => {
        // Arrange
        consumer = new SettleGameRoundConsumer({});
    });

    describe("extends", () => {
        it("inherit Core.BaseEventConsumers.SettleGameRoundConsumer", () => {
            // Assert
            expect(consumer instanceof Core.BaseEventConsumers.SettleGameRoundConsumer);
        });
    });

    describe("calculateBetResult", () => {
        describe("when not win", () => {
            it("should return isLose true", () => {
                // Arrange
                consumer.gameData = {};
                const settlementResult = { isLose: true, betwin: 0 };
                const bet = { amount: 10 };
                const expectedValue = {
                    isLose: true,
                    betwin: 0,
                    totalBetAmount: 10,
                    netWin: 0,
                    totalWin: 0,
                    totalLost: 10,
                };

                // Act
                const actualValue = consumer.calculateBetResult(settlementResult, bet);

                // Assert
                expect(actualValue).toStrictEqual(expectedValue);
            });
        });

        describe("when win", () => {
            it("should return isLose false", () => {
                // Arrange
                consumer.gameData = {};
                const settlementResult = { isLose: false, betwin: 20 };
                const bet = { amount: 10 };
                const expectedValue = {
                    isLose: false,
                    totalBetAmount: 10,
                    netWin: 10,
                    totalWin: 20,
                    totalLost: 0,
                    betwin: 20,
                };

                // Act
                const actualValue = consumer.calculateBetResult(settlementResult, bet);

                // Assert
                expect(actualValue).toStrictEqual(expectedValue);
            });
        });
    });

    describe("settleBets", () => {
        describe("when not have bet", () => {
            it("should not call bet with end time", async () => {
                // Arrange
                consumer.gameData = {
                    gameConfigs: {},
                    ingame: { m1: { betTracks: { result: {}, turnResult: { betwin: 10 }, id: 1, endTime: new Date() } } },
                };
                consumer.definition = {};
                consumer.userBetResultPublisher = { publish: jest.fn() };
                consumer.roundResultPublisher = { publishRoundResult: jest.fn() };
                const bet = { save: jest.fn() };
                spyOn(consumer, "queryBets").and.returnValue([]);
                consumer.endGame = async () => {
                    return {
                        isOk: true,
                    };
                };

                // Act
                await consumer.settleBets("m1");

                // Assert
                expect(bet.save).not.toHaveBeenCalled();
            });
        });

        it("should save bet with end time", async () => {
            // Arrange
            consumer.gameData = {
                gameConfigs: {},
                ingame: { m1: { betTracks: { result: {}, turnResult: { betwin: 10 }, id: 1, endTime: new Date() } } },
            };
            consumer.definition = {};
            consumer.userBetResultPublisher = { publish: jest.fn() };
            consumer.roundResultPublisher = { publishRoundResult: jest.fn() };
            const bet = { save: jest.fn() };
            spyOn(consumer, "queryBets").and.returnValue([bet]);
            consumer.endGame = async () => {
                return {
                    isOk: true,
                };
            };

            // Act
            await consumer.settleBets("m1");

            // Assert
            expect(bet.save).toHaveBeenCalled();
        });
    });

    describe("queryBets", () => {
        it("should return from db", async () => {
            // Arrange
            const bets = [];
            consumer.roundsRepository = {
                find: () => {
                    return { exec: () => bets };
                },
            };

            // Act
            const actualValue = await consumer.queryBets();

            // Assert
            expect(actualValue).toStrictEqual(bets);
        });
    });

    describe("collect", () => {
        describe("when not have running round", () => {
            it("should not call settleGameRoundConsumer.settleBets", async () => {
                // Arrange
                consumer.gameData = { ingame: { m1: { betTracks: null } } };
                spyOn(consumer, "settleBets");
                const player = { session: {}, profile: { name: "m1" } };

                // Act
                await consumer.collect(player);

                // Assert
                expect(consumer.settleBets).not.toBeCalled();
            });
        });

        describe("when have running round", () => {
            it("should call settleGameRoundConsumer.settleBets", async () => {
                // Arrange
                consumer.gameData = { ingame: { m1: { betTracks: {} } }, settlementResultFromAdmin: {} };
                const player = { UID: "m1", session: {}, profile: { name: "m1" } };
                spyOn(consumer, "settleBets");

                // Act
                await consumer.collect(player);

                // Assert
                expect(consumer.settleBets).toBeCalled();
            });
        });
    });
});
