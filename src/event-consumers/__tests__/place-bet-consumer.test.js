import { Core } from "sc-game-base";
import { helpers } from "sc-common";
import { PlaceBetConsumer } from "../index";

describe("place-bet-consumer", () => {
    describe("extends", () => {
        it("inherit Core.BaseEventConsumers.PlaceBetConsumer ", () => {
            // act
            const consumer = new PlaceBetConsumer();

            // assert
            expect(consumer instanceof Core.BaseEventConsumers.PlaceBetConsumer);
        });
    });

    describe("composeValidationCriteria", () => {
        it("should return correct validation result", () => {
            // arrange
            const consumer = new PlaceBetConsumer();
            spyOn(consumer, "composeBettingTimeValidationCriteria").and.returnValue([{ id: 1 }]);
            spyOn(consumer, "composeBetAmountValidationCriteria").and.returnValue([{ id: 2 }]);
            const expectedValue = [{ id: 1 }, { id: 2 }];

            // act
            const actualValue = consumer.composeValidationCriteria();

            // assert
            expect(actualValue).toStrictEqual(expectedValue);
        });
    });

    describe("composeBettingTimeValidationCriteria", () => {
        describe("when already have bet tracks", () => {
            it("should return failed", () => {
                // arrange
                const gameData = { ingame: { m1: { betTracks: {} } } };
                const consumer = new PlaceBetConsumer(null, gameData);
                const expectedValue = [{ failure: true, notice: { errorCode: helpers.noticeHelper.invalidBet } }];
                const player = { profile: { name: "m1" } };

                // act
                const actualValue = consumer.composeBettingTimeValidationCriteria(player);

                // assert
                expect(actualValue).toStrictEqual(expectedValue);
            });
        });

        describe("when not have bet tracks and config disabled", () => {
            it("should return failed", () => {
                // arrange
                const gameData = { ingame: { m1: { betTracks: null } }, gameConfigs: { enabled: false } };
                const consumer = new PlaceBetConsumer(null, gameData);
                const expectedValue = [{ failure: true, notice: { errorCode: helpers.noticeHelper.invalidBet } }];
                const player = { profile: { name: "m1" } };

                // act
                const actualValue = consumer.composeBettingTimeValidationCriteria(player);

                // assert
                expect(actualValue).toStrictEqual(expectedValue);
            });
        });

        describe("when not in game and config enabled", () => {
            it("should return failed", () => {
                // arrange
                const gameData = { ingame: {}, gameConfigs: { enabled: true } };
                const consumer = new PlaceBetConsumer(null, gameData);
                const expectedValue = [{ failure: false, notice: { errorCode: helpers.noticeHelper.invalidBet } }];
                const player = { profile: { name: "m1" } };

                // act
                const actualValue = consumer.composeBettingTimeValidationCriteria(player);

                // assert
                expect(actualValue).toStrictEqual(expectedValue);
            });
        });
    });

    describe("composeBetAmountValidationCriteria", () => {
        describe("when amount < min bet", () => {
            it("should return failed", () => {
                // arrange
                const gameData = { currencyGroupGames: [{ groupId: "group1", minBet: 4, maxBet: 18 }] };
                const consumer = new PlaceBetConsumer(null, gameData);
                const player = {
                    session: { currencyGroupId: "group1" },
                    profile: { name: "m1", minBet: 5, maxBet: 20 },
                };

                const amount = 3;
                const expectedValue = { failure: true, notice: { errorCode: helpers.noticeHelper.minBet, minBet: 5 } };

                // act
                const actualValue = consumer.composeBetAmountValidationCriteria(player, amount);

                // assert
                expect(actualValue[0]).toStrictEqual(expectedValue);
            });
        });

        describe("when amount > max bet ", () => {
            it("should return failed", () => {
                // arrange
                const gameData = { currencyGroupGames: [{ groupId: "group1", minBet: 4, maxBet: 18 }] };
                const consumer = new PlaceBetConsumer(null, gameData);
                const player = {
                    session: { currencyGroupId: "group1" },
                    profile: { name: "m1", minBet: 5, maxBet: 20 },
                };

                const amount = 19;
                const expectedValue = { failure: true, notice: { errorCode: helpers.noticeHelper.maxBet, maxBet: 18 } };

                // act
                const actualValue = consumer.composeBetAmountValidationCriteria(player, amount);

                // assert
                expect(actualValue[1]).toStrictEqual(expectedValue);
            });
        });
    });

    describe("validateBetRequest", () => {
        describe("when have failure", () => {
            it("should return false", () => {
                // arrange
                const gameData = { currencyGroupGames: [{ groupId: "group1", minBet: 4, maxBet: 18 }] };
                const publisher = { publishToUser: jest.fn() };
                const consumer = new PlaceBetConsumer(null, gameData, publisher);
                spyOn(consumer, "composeValidationCriteria").and.returnValue([{ failure: true, notice: { code: 1 } }]);

                const player = { UID: "m1" };
                const amount = 3;

                // act
                const actualValue = consumer.validateBetRequest(player, amount);

                // assert
                expect(actualValue).toBeFalsy();
                expect(publisher.publishToUser).toHaveBeenCalledWith("m1", expect.objectContaining({ endBet: -1, notice: { code: 1 } }));
            });
        });

        describe("when not have failure", () => {
            it("should return true", () => {
                // arrange
                const gameData = { currencyGroupGames: [{ groupId: "group1", minBet: 4, maxBet: 18 }] };
                const publisher = { publishToUser: jest.fn() };
                const consumer = new PlaceBetConsumer(null, gameData, publisher);
                spyOn(consumer, "composeValidationCriteria").and.returnValue([{ failure: false, notice: { code: 1 } }]);

                const player = { UID: "m1" };
                const amount = 3;

                // act
                const actualValue = consumer.validateBetRequest(player, amount);

                // assert
                expect(actualValue).toBeTruthy();
                expect(publisher.publishToUser).not.toHaveBeenCalled();
            });
        });
    });

    describe("consume", () => {
        describe("when have failure", () => {
            it("should not add bet to queue", () => {
                // arrange
                const gameData = { ingame: { m1: { betQueue: [] } } };
                const consumer = new PlaceBetConsumer(null, gameData);
                spyOn(consumer, "validateBetRequest").and.returnValue(false);

                const player = { UID: "m1" };
                const payload = { amount: 3 };

                // act
                consumer.consume(player, payload);

                // assert
                expect(gameData.ingame.m1.betQueue.length).toBe(0);
            });
        });

        describe("when not have failure and not in game yet", () => {
            it("should add bet to queue", () => {
                // arrange
                const gameData = { ingame: {} };
                const consumer = new PlaceBetConsumer(null, gameData);
                spyOn(consumer, "validateBetRequest").and.returnValue(true);

                const player = { UID: "m1", profile: { name: "m1" }, session: { currencyName: "UUS", system: 1, partnerId: 2 } };
                const payload = { amount: 3.2 };

                // act
                consumer.consume(player, payload);

                // assert
                expect(gameData.ingame.m1.betQueue.length).toBe(1);
            });
        });

        describe("when not have failure and already in game", () => {
            it("should add bet to queue", () => {
                // arrange
                const gameData = { ingame: { m1: { betQueue: [] } } };
                const consumer = new PlaceBetConsumer(null, gameData);
                spyOn(consumer, "validateBetRequest").and.returnValue(true);

                const player = { UID: "m1", profile: { name: "m1" }, session: { currencyName: "UUS", system: 1, partnerId: 2 } };
                const payload = { amount: 3.2 };

                // act
                consumer.consume(player, payload);

                // assert
                expect(gameData.ingame.m1.betQueue.length).toBe(1);
            });
        });
    });
});
