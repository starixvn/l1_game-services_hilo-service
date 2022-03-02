import { Core } from "sc-game-base";
import { helpers } from "sc-common";
import { PlaceBetConsumer } from "../index";
import { player1 } from "../../__tests__/test-data";
import { BaseEventPublisher } from "sc-game-base/src/core/event-publishers";
import { stub } from "jest-micro-auto-stub";

describe("PlaceBetConsumer", () => {
    const definition = {};
    const gameData = {
        gameConfigs: { odds: {} },
        exchangeRates: { code: {} },
        currencyGroupGames: [{ groupId: "1" }],
        players: {},
        ingame: {},
        roundId: 1,
    };

    let consumer;

    beforeEach(() => {
        jest.clearAllMocks();

        // Arrange
        const publisher = stub(BaseEventPublisher);
        consumer = new PlaceBetConsumer(definition, gameData, publisher);
    });

    it("inherit Core.BaseEventConsumers.PlaceBetConsumer", () => {
        // Assert
        expect(consumer instanceof Core.BaseEventConsumers.PlaceBetConsumer);
    });

    describe("composeValidationCriteria", () => {
        it("should return combined results of betting time and bet amount validations", () => {
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
        describe("when game is disabled", () => {
            beforeEach(() => {
                gameData.gameConfigs.enabled = false;
            });
            it("should return failed", () => {
                // Arrange
                gameData.ingame = { [player1.profile.name]: { betTracks: null } };
                gameData.gameConfigs.enabled = false;

                const expectedValue = [{ failure: true, notice: { errorCode: helpers.noticeHelper.invalidBet } }];

                // Act
                const actualValue = consumer.composeBettingTimeValidationCriteria(player1);

                // Assert
                expect(actualValue).toStrictEqual(expectedValue);
            });
        });
        describe("when game is enabled", () => {
            beforeEach(() => {
                gameData.gameConfigs.enabled = true;
                gameData.ingame = {};
            });

            it("should return failed if player not has running round", () => {
                // Arrange
                gameData.ingame = { [player1.profile.name]: { betTracks: {} } };
                const expectedValue = [{ failure: true, notice: { errorCode: helpers.noticeHelper.invalidBet } }];

                // Act
                const actualValue = consumer.composeBettingTimeValidationCriteria(player1);

                // Assert
                expect(actualValue).toStrictEqual(expectedValue);
            });

            it("should return ok if player have running round", () => {
                // Arrange
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
                expect(actualValue).toBeFalse();
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
                expect(actualValue).toBeTrue();
            });
        });
    });

    describe("consume", () => {
        describe("when bet is invalid", () => {
            it("should not add it to queue", () => {
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

        describe("when bet is valid and not in game yet", () => {
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
                consumer.gameData = { ingame: { [player1.profile.name]: { betQueue: undefined } } };
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
