import { Core } from "sc-game-base";
import { helpers } from "sc-common";
import { PlaceBetConsumer } from "../index";

describe("place-bet-consumer", () => {
    let consumer;
    beforeEach(() => {
        // Arrange
        consumer = new PlaceBetConsumer();
    });

    describe("extends", () => {
        it("inherit Core.BaseEventConsumers.PlaceBetConsumer ", () => {
            // Assert
            expect(consumer instanceof Core.BaseEventConsumers.PlaceBetConsumer);
        });
    });

    describe("composeValidationCriteria", () => {
        it("should return correct validation result", () => {
            // Arrange
            spyOn(consumer, "composeBettingTimeValidationCriteria").and.returnValue([{ id: 1 }]);
            spyOn(consumer, "composeBetAmountValidationCriteria").and.returnValue([{ id: 2 }]);
            const expectedValue = [{ id: 1 }, { id: 2 }];

            // Act
            const actualValue = consumer.composeValidationCriteria();

            // Assert
            expect(actualValue).toStrictEqual(expectedValue);
        });
    });

    describe("composeBettingTimeValidationCriteria", () => {
        describe("when already have bet tracks", () => {
            it("should return failed", () => {
                // Arrange
                consumer.gameData = { ingame: { m1: { betTracks: {} } } };
                const expectedValue = [{ failure: true, notice: { errorCode: helpers.noticeHelper.invalidBet } }];
                const player = { profile: { name: "m1" } };

                // Act
                const actualValue = consumer.composeBettingTimeValidationCriteria(player);

                // Assert
                expect(actualValue).toStrictEqual(expectedValue);
            });
        });

        describe("when not have bet tracks and config disabled", () => {
            it("should return failed", () => {
                // Arrange
                consumer.gameData = { ingame: { m1: { betTracks: null } }, gameConfigs: { enabled: false } };
                const expectedValue = [{ failure: true, notice: { errorCode: helpers.noticeHelper.invalidBet } }];
                const player = { profile: { name: "m1" } };

                // Act
                const actualValue = consumer.composeBettingTimeValidationCriteria(player);

                // Assert
                expect(actualValue).toStrictEqual(expectedValue);
            });
        });

        describe("when not in game and config enabled", () => {
            it("should return failed", () => {
                // Arrange
                consumer.gameData = { ingame: {}, gameConfigs: { enabled: true } };
                const expectedValue = [{ failure: false, notice: { errorCode: helpers.noticeHelper.invalidBet } }];
                const player = { profile: { name: "m1" } };

                // Act
                const actualValue = consumer.composeBettingTimeValidationCriteria(player);

                // Assert
                expect(actualValue).toStrictEqual(expectedValue);
            });
        });
    });

    describe("composeBetAmountValidationCriteria", () => {
        describe("when amount < min bet", () => {
            it("should return failed", () => {
                // Arrange
                consumer.gameData = { currencyGroupGames: [{ groupId: "group1", minBet: 4, maxBet: 18 }] };
                const player = {
                    session: { currencyGroupId: "group1" },
                    profile: { name: "m1", minBet: 5, maxBet: 20 },
                };

                const amount = 3;
                const expectedValue = { failure: true, notice: { errorCode: helpers.noticeHelper.minBet, minBet: 5 } };

                // Act
                const actualValue = consumer.composeBetAmountValidationCriteria(player, amount);

                // Assert
                expect(actualValue[0]).toStrictEqual(expectedValue);
            });
        });

        describe("when amount > max bet ", () => {
            it("should return failed", () => {
                // Arrange
                consumer.gameData = { currencyGroupGames: [{ groupId: "group1", minBet: 4, maxBet: 18 }] };
                const player = {
                    session: { currencyGroupId: "group1" },
                    profile: { name: "m1", minBet: 5, maxBet: 20 },
                };

                const amount = 19;
                const expectedValue = { failure: true, notice: { errorCode: helpers.noticeHelper.maxBet, maxBet: 18 } };

                // Act
                const actualValue = consumer.composeBetAmountValidationCriteria(player, amount);

                // Assert
                expect(actualValue[1]).toStrictEqual(expectedValue);
            });
        });
    });

    describe("validateBetRequest", () => {
        describe("when have failure", () => {
            it("should return false", () => {
                // Arrange
                consumer.gameData = { currencyGroupGames: [{ groupId: "group1", minBet: 4, maxBet: 18 }] };
                consumer.publisher = { publishToUser: jest.fn() };
                spyOn(consumer, "composeValidationCriteria").and.returnValue([{ failure: true, notice: { code: 1 } }]);

                const player = { UID: "m1" };
                const amount = 3;

                // Act
                const actualValue = consumer.validateBetRequest(player, amount);

                // Assert
                expect(actualValue).toBeFalsy();
                expect(consumer.publisher.publishToUser).toHaveBeenCalledWith(
                    "m1",
                    expect.objectContaining({ endBet: -1, notice: { code: 1 } })
                );
            });
        });

        describe("when not have failure", () => {
            it("should return true", () => {
                // Arrange
                consumer.gameData = { currencyGroupGames: [{ groupId: "group1", minBet: 4, maxBet: 18 }] };
                consumer.publisher = { publishToUser: jest.fn() };
                spyOn(consumer, "composeValidationCriteria").and.returnValue([{ failure: false, notice: { code: 1 } }]);

                const player = { UID: "m1" };
                const amount = 3;

                // Act
                const actualValue = consumer.validateBetRequest(player, amount);

                // Assert
                expect(actualValue).toBeTruthy();
                expect(consumer.publisher.publishToUser).not.toHaveBeenCalled();
            });
        });
    });

    describe("consume", () => {
        describe("when have failure", () => {
            it("should not add bet to queue", () => {
                // Arrange
                consumer.gameData = { ingame: { m1: { betQueue: [] } } };
                spyOn(consumer, "validateBetRequest").and.returnValue(false);

                const player = { UID: "m1" };
                const payload = { amount: 3 };

                // Act
                consumer.consume(player, payload);

                // Assert
                expect(consumer.gameData.ingame.m1.betQueue.length).toBe(0);
            });
        });

        describe("when not have failure and not in game yet", () => {
            it("should add bet to queue", () => {
                // Arrange
                consumer.gameData = { ingame: {} };
                spyOn(consumer, "validateBetRequest").and.returnValue(true);

                const player = { UID: "m1", profile: { name: "m1" }, session: { currencyName: "UUS", system: 1, partnerId: 2 } };
                const payload = { amount: 3.2 };

                // Act
                consumer.consume(player, payload);

                // Assert
                expect(consumer.gameData.ingame.m1.betQueue.length).toBe(1);
            });
        });

        describe("when not have failure and already in game", () => {
            it("should add bet to queue", () => {
                // Arrange
                consumer.gameData = { ingame: { m1: { betQueue: [] } } };
                spyOn(consumer, "validateBetRequest").and.returnValue(true);

                const player = { UID: "m1", profile: { name: "m1" }, session: { currencyName: "UUS", system: 1, partnerId: 2 } };
                const payload = { amount: 3.2 };

                // Act
                consumer.consume(player, payload);

                // Assert
                expect(consumer.gameData.ingame.m1.betQueue.length).toBe(1);
            });
        });
    });
});
