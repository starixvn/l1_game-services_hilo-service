import { Core } from "sc-game-base";
import { SettleGameRoundConsumer } from "../index";
import { player1 } from "../../__tests__/test-data";
import { stub } from "jest-micro-auto-stub";
import { UserBetResultPublisher, RoundResultPublisher } from "sc-game-base/src/core/event-publishers";

describe("SettleGameRoundConsumer", () => {
    let consumer;
    let gameData = {};
    beforeEach(() => {
        // Arrange
        const definition = {};
        const userBetResultPublisher = stub(UserBetResultPublisher);
        const roundResultPublisher = stub(RoundResultPublisher);
        consumer = new SettleGameRoundConsumer({ definition, gameData, userBetResultPublisher, roundResultPublisher });
    });

    it("inherit Core.BaseEventConsumers.SettleGameRoundConsumer", () => {
        // Assert
        expect(consumer instanceof Core.BaseEventConsumers.SettleGameRoundConsumer);
    });

    describe("calculateBetResult", () => {
        describe("when not win", () => {
            it("should return netWin=0, totalWin=0, totalBetAmount=bet amount", () => {
                // Arrange
                const settlementResult = { isLose: true, betwin: 0 };
                const bet = { amount: 10 };
                const expectedValue = { betwin: 0, totalBetAmount: 10, netWin: 0 };

                // Act
                const actualValue = consumer.calculateBetResult(settlementResult, bet);

                // Assert
                expect(actualValue).toStrictEqual(expect.objectContaining(expectedValue));
            });
        });

        describe("when win", () => {
            it("should return netWin=betwin-amount, totalWin=betwin, totalBetAmount=bet amount", () => {
                // Arrange
                const settlementResult = { isLose: false, betwin: 20 };
                const bet = { amount: 10 };
                const expectedValue = { totalBetAmount: 10, netWin: 10, totalWin: 20 };

                // Act
                const actualValue = consumer.calculateBetResult(settlementResult, bet);

                // Assert
                expect(actualValue).toStrictEqual(expect.objectContaining(expectedValue));
            });
        });
    });

    describe("settleBets", () => {
        describe("when not have bet", () => {
            it("should not call save bet", async () => {
                // Arrange
                consumer.gameData = {
                    gameConfigs: {},
                    ingame: {
                        [player1.profile.name]: { betTracks: { result: {}, turnResult: { betwin: 10 }, id: 1, endTime: new Date() } },
                    },
                    settlementResultFromAdmin: {},
                };
                const bet = { save: jest.fn() };
                spyOn(consumer, "queryBets").and.returnValue([]);
                consumer.endGame = async () => {
                    return {
                        isOk: true,
                    };
                };

                // Act
                await consumer.settleBets(player1.profile.name);

                // Assert
                expect(bet.save).not.toHaveBeenCalled();
            });
        });

        describe("when have bet", () => {
            let bet;
            beforeEach(async () => {
                // Arrange
                consumer.gameData = {
                    gameConfigs: {},
                    ingame: {
                        [player1.profile.name]: { betTracks: { result: {}, turnResult: { betwin: 10 }, id: 1, endTime: new Date() } },
                    },
                    settlementResultFromAdmin: {},
                };
                bet = { save: jest.fn() };
                spyOn(consumer, "queryBets").and.returnValue([bet]);
                spyOn(consumer, "calculateBetResult").and.returnValue({ totalWin: 10 });
                consumer.endGame = async () => {
                    return {
                        isOk: true,
                    };
                };

                // Act
                await consumer.settleBets(player1.profile.name);
            });

            it("should assign bet.betwin", async () => {
                // Assert
                expect(bet.betwin).toBe(10);
            });
            it("should set bet.paid = true", async () => {
                // Assert
                expect(bet.paid).toBeTrue();
            });
            it("should set bet.endTime", async () => {
                // Assert
                expect(bet.endTime).not.toBeNull();
            });
            it("should save bet", async () => {
                // Assert
                expect(bet.save).toHaveBeenCalled();
            });
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
                gameData.ingame = { [player1.profile.name]: { betTracks: null } };
                spyOn(consumer, "settleBets");

                // Act
                await consumer.collect(player1);

                // Assert
                expect(consumer.settleBets).not.toBeCalled();
            });
        });

        describe("when have running round", () => {
            it("should call settleGameRoundConsumer.settleBets", async () => {
                // Arrange
                consumer.gameData = {
                    ingame: { [player1.profile.name]: { betTracks: { name: player1.profile.name } } },
                    settlementResultFromAdmin: {},
                };
                spyOn(consumer, "settleBets");

                // Act
                await consumer.collect(player1);

                // Assert
                expect(consumer.settleBets).toBeCalledWith(player1.profile.name);
            });
        });
    });
});
