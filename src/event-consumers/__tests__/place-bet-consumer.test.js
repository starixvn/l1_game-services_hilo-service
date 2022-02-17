import { Core } from "sc-game-base";
import { helpers } from "sc-common";
import { PlaceBetConsumer } from "../index";
import { player1 } from "../../__tests__/set-up";
import { BaseEventPublisher } from "sc-game-base/src/core/event-publishers";
import { stub } from "jest-micro-auto-stub";

describe("place-bet-consumer", () => {
    let consumer;
    beforeEach(() => {
        // Arrange
        const publisher = stub(BaseEventPublisher);
        consumer = new PlaceBetConsumer(null, null, publisher);
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
                consumer.gameData = { ingame: { [player1.profile.name]: { betTracks: {} } } };
                const expectedValue = [{ failure: true, notice: { errorCode: helpers.noticeHelper.invalidBet } }];

                // Act
                const actualValue = consumer.composeBettingTimeValidationCriteria(player1);

                // Assert
                expect(actualValue).toStrictEqual(expectedValue);
            });
        });

        describe("when not have bet tracks and config disabled", () => {
            it("should return failed", () => {
                // Arrange
                consumer.gameData = { ingame: { [player1.profile.name]: { betTracks: null } }, gameConfigs: { enabled: false } };
                const expectedValue = [{ failure: true, notice: { errorCode: helpers.noticeHelper.invalidBet } }];

                // Act
                const actualValue = consumer.composeBettingTimeValidationCriteria(player1);

                // Assert
                expect(actualValue).toStrictEqual(expectedValue);
            });
        });

        describe("when not in game and config enabled", () => {
            it("should return failed", () => {
                // Arrange
                consumer.gameData = { ingame: {}, gameConfigs: { enabled: true } };
                const expectedValue = [{ failure: false, notice: { errorCode: helpers.noticeHelper.invalidBet } }];

                // Act
                const actualValue = consumer.composeBettingTimeValidationCriteria(player1);

                // Assert
                expect(actualValue).toStrictEqual(expectedValue);
            });
        });
    });

    describe("composeBetAmountValidationCriteria", () => {
        describe("when amount < min bet", () => {
            it("should return failed", () => {
                // Arrange
                consumer.gameData = { currencyGroupGames: [{ groupId: player1.session.currencyGroupId, minBet: 4, maxBet: 18 }] };
                const amount = 3;
                const expectedValue = { failure: true, notice: { errorCode: helpers.noticeHelper.minBet, minBet: 6 } };

                // Act
                const actualValue = consumer.composeBetAmountValidationCriteria(player1, amount);

                // Assert
                expect(actualValue[0]).toStrictEqual(expectedValue);
            });
        });

        describe("when amount > max bet ", () => {
            it("should return failed", () => {
                // Arrange
                consumer.gameData = { currencyGroupGames: [{ groupId: player1.session.currencyGroupId, minBet: 4, maxBet: 18 }] };
                const amount = 19;
                const expectedValue = { failure: true, notice: { errorCode: helpers.noticeHelper.maxBet, maxBet: 8 } };

                // Act
                const actualValue = consumer.composeBetAmountValidationCriteria(player1, amount);

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
                spyOn(consumer, "composeValidationCriteria").and.returnValue([{ failure: true, notice: { code: 1 } }]);
                const amount = 3;

                // Act
                const actualValue = consumer.validateBetRequest(player1, amount);

                // Assert
                expect(actualValue).toBeFalsy();
            });
        });

        describe("when not have failure", () => {
            it("should return true", () => {
                // Arrange
                consumer.gameData = { currencyGroupGames: [{ groupId: player1.session.currencyGroupId, minBet: 4, maxBet: 18 }] };
                spyOn(consumer, "composeValidationCriteria").and.returnValue([{ failure: false, notice: { code: 1 } }]);
                const amount = 3;

                // Act
                const actualValue = consumer.validateBetRequest(player1, amount);

                // Assert
                expect(actualValue).toBeTruthy();
            });
        });
    });

    describe("consume", () => {
        describe("when have failure", () => {
            it("should not add bet to queue", () => {
                // Arrange
                consumer.gameData = { ingame: { m1: { betQueue: [] } } };
                spyOn(consumer, "validateBetRequest").and.returnValue(false);
                const payload = { amount: 3 };

                // Act
                consumer.consume(player1, payload);

                // Assert
                expect(consumer.gameData.ingame.m1.betQueue.length).toBe(0);
            });
        });

        describe("when not have failure and not in game yet", () => {
            it("should add bet to queue", () => {
                // Arrange
                consumer.gameData = { ingame: {} };
                spyOn(consumer, "validateBetRequest").and.returnValue(true);
                const payload = { amount: 3.2 };

                // Act
                consumer.consume(player1, payload);

                // Assert
                expect(consumer.gameData.ingame[player1.profile.name].betQueue.length).toBe(1);
            });
        });

        describe("when not have failure and already in game", () => {
            it("should add bet to queue", () => {
                // Arrange
                consumer.gameData = { ingame: { [player1.profile.name]: { betQueue: [] } } };
                spyOn(consumer, "validateBetRequest").and.returnValue(true);
                const payload = { amount: 3.2 };

                // Act
                consumer.consume(player1, payload);

                // Assert
                expect(consumer.gameData.ingame[player1.profile.name].betQueue.length).toBe(1);
            });
        });
    });
});
