import { Core } from "sc-game-base";
import mongoose from "mongoose";
import { stubMongooseModelStupidly } from "jest-micro-auto-stub";
import { helpers } from "sc-common";
import { DealConsumer } from "../index";
import errorCodes from "../../constants/error-codes";

describe("deal-consumer", () => {
    describe("extends", () => {
        it("inherit Core.BaseEventConsumers.PlaceBetConsumer ", () => {
            // act
            const consumer = new DealConsumer();

            // assert
            expect(consumer instanceof Core.BaseEventConsumers.PlaceBetConsumer);
        });
    });

    describe("composeValidationCriteria", () => {
        const testCases = [{ criterion: [] }, { criterion: null }];
        it.each(testCases)("should return concat of time/amount/choice validation", (testCase) => {
            // arrange
            const consumer = new DealConsumer();
            spyOn(consumer, "composeBettingTimeValidationCriteria").and.returnValue(testCase.criterion);
            spyOn(consumer, "composeBetAmountValidationCriteria").and.returnValue(testCase.criterion);
            spyOn(consumer, "composeBetChoiceValidationCriteria").and.returnValue(testCase.criterion);
            const expectedValue = [];

            // act
            const actualValue = consumer.composeValidationCriteria();

            // assert
            expect(actualValue).toStrictEqual(expectedValue);
        });
    });

    describe("composeBettingTimeValidationCriteria", () => {
        let testCases = [
            { enabled: false, expectedValue: { failure: true, notice: { errorCode: helpers.noticeHelper.invalidBet } } },
            { enabled: true, expectedValue: { failure: false, notice: { errorCode: helpers.noticeHelper.invalidBet } } },
        ];
        it.each(testCases)("should check game enabled or not", (testCase) => {
            // arrange
            const definition = {};
            const gameData = { gameConfigs: { enabled: testCase.enabled } };
            const roundsRepository = stubMongooseModelStupidly(mongoose.Model);
            const consumer = new DealConsumer(definition, gameData, {}, roundsRepository);
            const roundId = undefined;

            // act
            const actualValue = consumer.composeBettingTimeValidationCriteria(roundId);

            // assert
            expect(actualValue[0]).toStrictEqual(testCase.expectedValue);
        });

        testCases = [
            {
                roundId: undefined,
                expectedValue: {
                    failure: true,
                    notice: { errorCode: errorCodes.roundNotExist },
                },
            },
            {
                roundId: 10,
                expectedValue: {
                    failure: false,
                    notice: { errorCode: errorCodes.roundNotExist },
                },
            },
        ];
        it.each(testCases)("should check round id", (testCase) => {
            // arrange
            const definition = {};
            const gameData = { gameConfigs: { enabled: true } };
            const roundsRepository = stubMongooseModelStupidly(mongoose.Model);
            const consumer = new DealConsumer(definition, gameData, {}, roundsRepository);
            const roundId = testCase.roundId;

            // act
            const actualValue = consumer.composeBettingTimeValidationCriteria(roundId);

            // assert
            expect(actualValue[1]).toStrictEqual(testCase.expectedValue);
        });
    });

    describe("composeBetChoiceValidationCriteria", () => {
        describe("when bet choice not in definition.choices", () => {
            it("should failed choices criterion", () => {
                // arrange
                const definition = { choices: [] };
                const gameData = { ingame: { m1: { betTracks: null } } };
                const consumer = new DealConsumer(definition, gameData, {});
                const expectedValue = { failure: true, notice: { errorCode: helpers.noticeHelper.invalidBet } };
                const player = { profile: { maxBet: 8, maxBet: 6, name: "m1" }, session: { currencyGroupId: "g1" } };
                const betChoice = "h";

                // act
                const actualValue = consumer.composeBetChoiceValidationCriteria(player, betChoice);

                // assert
                expect(actualValue[0]).toStrictEqual(expectedValue);
            });
        });

        describe("when bet choice in definition.choices", () => {
            it("should not failed choices criterion", () => {
                // arrange
                const definition = { choices: ["h", "l"] };
                const gameData = { ingame: { m1: { betTracks: null } } };
                const consumer = new DealConsumer(definition, gameData, {});
                const expectedValue = { failure: false, notice: { errorCode: helpers.noticeHelper.invalidBet } };
                const player = { profile: { maxBet: 8, maxBet: 6, name: "m1" }, session: { currencyGroupId: "g1" } };
                const betChoice = "h";

                // act
                const actualValue = consumer.composeBetChoiceValidationCriteria(player, betChoice);

                // assert
                expect(actualValue[0]).toStrictEqual(expectedValue);
            });
        });

        describe("when loChoice and card is 2", () => {
            it("should failed loChoice criterion", () => {
                // arrange
                const definition = { choices: [] };
                const gameData = { ingame: { m1: { betTracks: { result: [{ rank: "2" }] } } } };
                const consumer = new DealConsumer(definition, gameData, {});
                const expectedValue = {
                    failure: true,
                    notice: { errorCode: errorCodes.cannotLowerThan },
                };
                const player = { UID: "m1", profile: { name: "m1" } };
                const betChoice = "l";

                // act
                const actualValue = consumer.composeBetChoiceValidationCriteria(player, betChoice);

                // assert
                expect(actualValue[1]).toStrictEqual(expectedValue);
            });
        });

        describe("when loChoice and card is not 2", () => {
            it("should not failed loChoice criterion", () => {
                // arrange
                const definition = { choices: [] };
                const gameData = { ingame: { m1: { betTracks: { result: [{ rank: "2" }, { rank: "4" }] } } } };
                const consumer = new DealConsumer(definition, gameData, {});
                const expectedValue = {
                    failure: false,
                    notice: { errorCode: errorCodes.cannotLowerThan },
                };
                const player = { UID: "m1", profile: { name: "m1" } };
                const betChoice = "l";

                // act
                const actualValue = consumer.composeBetChoiceValidationCriteria(player, betChoice);

                // assert
                expect(actualValue[1]).toStrictEqual(expectedValue);
            });
        });

        describe("when hiChoice and card is not 2", () => {
            it("should not failed loChoice criterion", () => {
                // arrange
                const definition = { choices: [] };
                const gameData = { ingame: { m1: { betTracks: { result: [{ rank: "2" }, { rank: "4" }] } } } };
                const consumer = new DealConsumer(definition, gameData, {});
                const expectedValue = {
                    failure: false,
                    notice: { errorCode: errorCodes.cannotLowerThan },
                };
                const player = { UID: "m1", profile: { name: "m1" } };
                const betChoice = "h";

                // act
                const actualValue = consumer.composeBetChoiceValidationCriteria(player, betChoice);

                // assert
                expect(actualValue[1]).toStrictEqual(expectedValue);
            });
        });

        describe("when hiChoice and card is 2", () => {
            it("should not failed loChoice criterion", () => {
                // arrange
                const definition = { choices: [] };
                const gameData = { ingame: { m1: { betTracks: { result: [{ rank: "2" }, { rank: "2" }] } } } };
                const consumer = new DealConsumer(definition, gameData, {});
                const expectedValue = {
                    failure: false,
                    notice: { errorCode: errorCodes.cannotLowerThan },
                };
                const player = { UID: "m1", profile: { name: "m1" } };
                const betChoice = "h";

                // act
                const actualValue = consumer.composeBetChoiceValidationCriteria(player, betChoice);

                // assert
                expect(actualValue[1]).toStrictEqual(expectedValue);
            });
        });

        describe("when hiChoice and card is 1", () => {
            it("should failed hiChoice criterion", () => {
                // arrange
                const definition = { choices: [] };
                const gameData = { ingame: { m1: { betTracks: { result: [{ rank: "A" }] } } } };
                const consumer = new DealConsumer(definition, gameData, {});
                const expectedValue = {
                    failure: true,
                    notice: { errorCode: errorCodes.cannotGreaterThan },
                };
                const player = { UID: "m1", profile: { name: "m1" } };
                const betChoice = "h";

                // act
                const actualValue = consumer.composeBetChoiceValidationCriteria(player, betChoice);

                // assert
                expect(actualValue[2]).toStrictEqual(expectedValue);
            });
        });

        describe("when hiChoice and card is not 1", () => {
            it("should not failed hiChoice criterion", () => {
                // arrange
                const definition = { choices: [] };
                const gameData = { ingame: { m1: { betTracks: { result: [{ rank: "2" }, { rank: "4" }] } } } };
                const consumer = new DealConsumer(definition, gameData, {});
                const expectedValue = {
                    failure: false,
                    notice: { errorCode: errorCodes.cannotGreaterThan },
                };
                const player = { UID: "m1", profile: { name: "m1" } };
                const betChoice = "h";

                // act
                const actualValue = consumer.composeBetChoiceValidationCriteria(player, betChoice);

                // assert
                expect(actualValue[2]).toStrictEqual(expectedValue);
            });
        });

        describe("when loChoice and card is not 1", () => {
            it("should not failed hiChoice criterion", () => {
                // arrange
                const definition = { choices: [] };
                const gameData = { ingame: { m1: { betTracks: { result: [{ rank: "2" }, { rank: "4" }] } } } };
                const consumer = new DealConsumer(definition, gameData, {});
                const expectedValue = {
                    failure: false,
                    notice: { errorCode: errorCodes.cannotGreaterThan },
                };
                const player = { UID: "m1", profile: { name: "m1" } };
                const betChoice = "l";

                // act
                const actualValue = consumer.composeBetChoiceValidationCriteria(player, betChoice);

                // assert
                expect(actualValue[2]).toStrictEqual(expectedValue);
            });
        });

        describe("when loChoice and card is 2", () => {
            it("should not failed hiChoice criterion", () => {
                // arrange
                const definition = { choices: [] };
                const gameData = { ingame: { m1: { betTracks: { result: [{ rank: "2" }, { rank: "A" }] } } } };
                const consumer = new DealConsumer(definition, gameData, {});
                const expectedValue = {
                    failure: false,
                    notice: { errorCode: errorCodes.cannotGreaterThan },
                };
                const player = { UID: "m1", profile: { name: "m1" } };
                const betChoice = "l";

                // act
                const actualValue = consumer.composeBetChoiceValidationCriteria(player, betChoice);

                // assert
                expect(actualValue[2]).toStrictEqual(expectedValue);
            });
        });
    });

    describe("validateBetRequest", () => {
        describe("when have failedCriterion", () => {
            it("should return failed", async () => {
                // arrange
                const definition = { choices: [] };
                const gameData = { ingame: { m1: { betTracks: { result: [{ rank: "2" }, { rank: "A" }] } } } };
                const publisher = { publishToUser: jest.fn() };
                const consumer = new DealConsumer(definition, gameData, publisher);
                const player = { UID: "m1" };
                const amount = 10;
                const betChoice = "hi";
                spyOn(consumer, "composeValidationCriteria").and.returnValue([{ failure: true }]);

                // act
                const actualValue = await consumer.validateBetRequest(player, betChoice, amount);

                // assert
                expect(actualValue).toBeFalse();
            });
        });

        describe("when not have failedCriterion", () => {
            it("should return true", async () => {
                // arrange
                const definition = { choices: [] };
                const gameData = { ingame: { m1: { betTracks: { result: [{ rank: "2" }, { rank: "A" }] } } } };
                const publisher = { publishToUser: jest.fn() };
                const consumer = new DealConsumer(definition, gameData, publisher);
                const player = { UID: "m1" };
                const amount = 10;
                const betChoice = "hi";
                spyOn(consumer, "composeValidationCriteria").and.returnValue([]);

                // act
                const actualValue = await consumer.validateBetRequest(player, betChoice, amount);

                // assert
                expect(actualValue).toBeTruthy();
            });
        });
    });

    describe("consume", () => {
        describe("when not have ingame data", () => {
            it("should not push deal info to queue", () => {
                // arrange
                const definition = { choices: [] };
                const gameData = { ingame: { m2: { betTracks: { result: [{ rank: "2" }, { rank: "A" }] } }, m1: { betQueue: [] } } };
                const publisher = { publishToUser: jest.fn() };
                const settleTurnConsumer = { settleTurn: jest.fn() };
                const consumer = new DealConsumer(definition, gameData, publisher, null, settleTurnConsumer);
                const player = { UID: "m1", profile: { name: "m1" } };
                spyOn(consumer, "validateBetRequest").and.returnValue(false);
                const payload = {};

                // act
                consumer.consume(player, payload);

                // assert
                expect(gameData.ingame.m1.betQueue.length).toBe(0);
            });
        });

        describe("when not have bet tracks data", () => {
            it("should not push deal info to queue", () => {
                // arrange
                const definition = { choices: [] };
                const gameData = { ingame: { m1: { betTracks: null, betQueue: [] } } };
                const publisher = { publishToUser: jest.fn() };
                const settleGameRoundConsumer = { settleTurn: jest.fn() };
                const consumer = new DealConsumer(definition, gameData, publisher, null, settleGameRoundConsumer);
                const player = { UID: "m1", profile: { name: "m1" } };
                spyOn(consumer, "validateBetRequest").and.returnValue(false);
                const payload = {};

                // act
                consumer.consume(player, payload);

                // assert
                expect(gameData.ingame.m1.betQueue.length).toBe(0);
            });
        });

        describe("when validateBetRequest failed", () => {
            it("should not push deal info to queue", async () => {
                // arrange
                const definition = { choices: [] };
                const gameData = { ingame: { m1: { betTracks: { result: [{ rank: "2" }, { rank: "A" }] }, betQueue: [] } } };
                const publisher = { publishToUser: jest.fn() };
                const settleTurnConsumer = { settleTurn: jest.fn() };
                const consumer = new DealConsumer(definition, gameData, publisher, null, settleTurnConsumer);
                const player = { UID: "m1", profile: { name: "m1" } };
                spyOn(consumer, "validateBetRequest").and.returnValue(false);
                const payload = {};

                // act
                consumer.consume(player, payload);

                // assert
                expect(gameData.ingame.m1.betQueue.length).toBe(0);
            });
        });

        describe("when validateBetRequest passed", () => {
            const testCases = [{ betQueue: null }, { betQueue: [] }];
            it.each(testCases)("should push deal info to queue", (testCase) => {
                // arrange
                const definition = { choices: [] };
                const gameData = {
                    ingame: { m1: { betQueue: testCase.betQueue, betTracks: { result: [{ rank: "2" }, { rank: "A" }] } } },
                };
                const publisher = { publishToUser: jest.fn() };
                const settleGameRoundConsumer = { settleTurn: jest.fn() };
                const consumer = new DealConsumer(definition, gameData, publisher, null, settleGameRoundConsumer);

                const player = { UID: "m1", profile: { name: "m1" } };
                spyOn(consumer, "validateBetRequest").and.returnValue(true);
                const payload = {};

                // act
                consumer.consume(player, payload);

                // assert
                expect(gameData.ingame.m1.betQueue.length > 0).toBeTruthy();
            });
        });
    });
});
