import { Core } from "sc-game-base";
import mongoose from "mongoose";
import { stubMongooseModelStupidly } from "jest-micro-auto-stub";
import { helpers } from "sc-common";
import { DealConsumer } from "../index";
import errorCodes from "../../constants/error-codes";

describe("deal-consumer", () => {
    let consumer;
    beforeEach(() => {
        // Arrange
        consumer = new DealConsumer();
    });

    describe("extends", () => {
        it("inherit Core.BaseEventConsumers.PlaceBetConsumer ", () => {
            // Assert
            expect(consumer instanceof Core.BaseEventConsumers.PlaceBetConsumer);
        });
    });

    describe("composeValidationCriteria", () => {
        const testCases = [{ criterion: [] }];
        it.each(testCases)("should return concat of time/amount/choice validation", (testCase) => {
            // Arrange
            spyOn(consumer, "composeBettingTimeValidationCriteria").and.returnValue(testCase.criterion);
            spyOn(consumer, "composeBetAmountValidationCriteria").and.returnValue(testCase.criterion);
            spyOn(consumer, "composeBetChoiceValidationCriteria").and.returnValue(testCase.criterion);
            const expectedValue = [];

            // Act
            const actualValue = consumer.composeValidationCriteria();

            // Assert
            expect(actualValue).toStrictEqual(expectedValue);
        });
    });

    describe("composeBettingTimeValidationCriteria", () => {
        let testCases = [
            { enabled: false, expectedValue: { failure: true, notice: { errorCode: helpers.noticeHelper.invalidBet } } },
            { enabled: true, expectedValue: { failure: false, notice: { errorCode: helpers.noticeHelper.invalidBet } } },
        ];
        it.each(testCases)("should check game enabled or not", (testCase) => {
            // Arrange
            consumer.definition = {};
            consumer.gameData = { gameConfigs: { enabled: testCase.enabled } };
            consumer.roundsRepository = stubMongooseModelStupidly(mongoose.Model);
            const roundId = undefined;

            // Act
            const actualValue = consumer.composeBettingTimeValidationCriteria(roundId);

            // Assert
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
            // Arrange
            consumer.definition = {};
            consumer.gameData = { gameConfigs: { enabled: true } };
            consumer.roundsRepository = stubMongooseModelStupidly(mongoose.Model);
            const roundId = testCase.roundId;

            // Act
            const actualValue = consumer.composeBettingTimeValidationCriteria(roundId);

            // Assert
            expect(actualValue[1]).toStrictEqual(testCase.expectedValue);
        });
    });

    describe("composeBetChoiceValidationCriteria", () => {
        describe("when bet choice not in definition.choices", () => {
            it("should failed choices criterion", () => {
                // Arrange
                consumer.definition = { choices: [] };
                consumer.gameData = { ingame: { m1: { betTracks: null } } };
                const expectedValue = { failure: true, notice: { errorCode: helpers.noticeHelper.invalidBet } };
                const player = { profile: { maxBet: 8, maxBet: 6, name: "m1" }, session: { currencyGroupId: "g1" } };
                const betChoice = "h";

                // Act
                const actualValue = consumer.composeBetChoiceValidationCriteria(player, betChoice);

                // Assert
                expect(actualValue[0]).toStrictEqual(expectedValue);
            });
        });

        describe("when bet choice in definition.choices", () => {
            it("should not failed choices criterion", () => {
                // Arrange
                consumer.definition = { choices: ["h", "l"] };
                consumer.gameData = { ingame: { m1: { betTracks: null } } };
                const expectedValue = { failure: false, notice: { errorCode: helpers.noticeHelper.invalidBet } };
                const player = { profile: { maxBet: 8, maxBet: 6, name: "m1" }, session: { currencyGroupId: "g1" } };
                const betChoice = "h";

                // Act
                const actualValue = consumer.composeBetChoiceValidationCriteria(player, betChoice);

                // Assert
                expect(actualValue[0]).toStrictEqual(expectedValue);
            });
        });
        describe("when loChoice", () => {
            describe("card is 2", () => {
                it("should failed loChoice criterion", () => {
                    // Arrange
                    consumer.definition = { choices: [] };
                    consumer.gameData = { ingame: { m1: { betTracks: { uid: "m1", result: [{ rank: "2" }] } } } };
                    const expectedValue = {
                        failure: true,
                        notice: { errorCode: errorCodes.cannotLowerThan },
                    };
                    const player = { UID: "m1", profile: { name: "m1" } };
                    const betChoice = "l";

                    // Act
                    const actualValue = consumer.composeBetChoiceValidationCriteria(player, betChoice);

                    // Assert
                    expect(actualValue[1]).toStrictEqual(expectedValue);
                });
            });

            describe("card is not 2", () => {
                it("should not failed loChoice criterion", () => {
                    // Arrange
                    consumer.definition = { choices: [] };
                    consumer.gameData = { ingame: { m1: { betTracks: { uid: "m1", result: [{ rank: "2" }, { rank: "4" }] } } } };
                    const expectedValue = {
                        failure: false,
                        notice: { errorCode: errorCodes.cannotLowerThan },
                    };
                    const player = { UID: "m1", profile: { name: "m1" } };
                    const betChoice = "l";

                    // Act
                    const actualValue = consumer.composeBetChoiceValidationCriteria(player, betChoice);

                    // Assert
                    expect(actualValue[1]).toStrictEqual(expectedValue);
                });
            });

            describe("card is not 1", () => {
                it("should not failed hiChoice criterion", () => {
                    // Arrange
                    consumer.definition = { choices: [] };
                    consumer.gameData = { ingame: { m1: { betTracks: { uid: "m1", result: [{ rank: "2" }, { rank: "4" }] } } } };
                    const expectedValue = {
                        failure: false,
                        notice: { errorCode: errorCodes.cannotGreaterThan },
                    };
                    const player = { UID: "m1", profile: { name: "m1" } };
                    const betChoice = "l";

                    // Act
                    const actualValue = consumer.composeBetChoiceValidationCriteria(player, betChoice);

                    // Assert
                    expect(actualValue[2]).toStrictEqual(expectedValue);
                });
            });

            describe("card is 2", () => {
                it("should not failed hiChoice criterion", () => {
                    // Arrange
                    consumer.definition = { choices: [] };
                    consumer.gameData = { ingame: { m1: { betTracks: { uid: "m1", result: [{ rank: "2" }, { rank: "A" }] } } } };
                    const expectedValue = {
                        failure: false,
                        notice: { errorCode: errorCodes.cannotGreaterThan },
                    };
                    const player = { UID: "m1", profile: { name: "m1" } };
                    const betChoice = "l";

                    // Act
                    const actualValue = consumer.composeBetChoiceValidationCriteria(player, betChoice);

                    // Assert
                    expect(actualValue[2]).toStrictEqual(expectedValue);
                });
            });
        });

        describe("when hiChoice", () => {
            describe("card is not 2", () => {
                it("should not failed loChoice criterion", () => {
                    // Arrange
                    consumer.definition = { choices: [] };
                    consumer.gameData = { ingame: { m1: { betTracks: { uid: "m1", result: [{ rank: "2" }, { rank: "4" }] } } } };
                    const expectedValue = {
                        failure: false,
                        notice: { errorCode: errorCodes.cannotLowerThan },
                    };
                    const player = { UID: "m1", profile: { name: "m1" } };
                    const betChoice = "h";

                    // Act
                    const actualValue = consumer.composeBetChoiceValidationCriteria(player, betChoice);

                    // Assert
                    expect(actualValue[1]).toStrictEqual(expectedValue);
                });
            });

            describe("card is 2", () => {
                it("should not failed loChoice criterion", () => {
                    // Arrange
                    consumer.definition = { choices: [] };
                    consumer.gameData = { ingame: { m1: { betTracks: { uid: "m1", result: [{ rank: "2" }, { rank: "2" }] } } } };
                    const expectedValue = {
                        failure: false,
                        notice: { errorCode: errorCodes.cannotLowerThan },
                    };
                    const player = { UID: "m1", profile: { name: "m1" } };
                    const betChoice = "h";

                    // Act
                    const actualValue = consumer.composeBetChoiceValidationCriteria(player, betChoice);

                    // Assert
                    expect(actualValue[1]).toStrictEqual(expectedValue);
                });
            });

            describe("card is 1", () => {
                it("should failed hiChoice criterion", () => {
                    // Arrange
                    consumer.definition = { choices: [] };
                    consumer.gameData = { ingame: { m1: { betTracks: { result: [{ rank: "A" }] } } } };
                    const expectedValue = {
                        failure: true,
                        notice: { errorCode: errorCodes.cannotGreaterThan },
                    };
                    const player = { UID: "m1", profile: { name: "m1" } };
                    const betChoice = "h";

                    // Act
                    const actualValue = consumer.composeBetChoiceValidationCriteria(player, betChoice);

                    // Assert
                    expect(actualValue[2]).toStrictEqual(expectedValue);
                });
            });

            describe("card is not 1", () => {
                it("should not failed hiChoice criterion", () => {
                    // Arrange
                    consumer.definition = { choices: [] };
                    consumer.gameData = { ingame: { m1: { betTracks: { uid: "m1", result: [{ rank: "2" }, { rank: "4" }] } } } };
                    const expectedValue = {
                        failure: false,
                        notice: { errorCode: errorCodes.cannotGreaterThan },
                    };
                    const player = { UID: "m1", profile: { name: "m1" } };
                    const betChoice = "h";

                    // Act
                    const actualValue = consumer.composeBetChoiceValidationCriteria(player, betChoice);

                    // Assert
                    expect(actualValue[2]).toStrictEqual(expectedValue);
                });
            });
        });
    });

    describe("validateBetRequest", () => {
        describe("when have failedCriterion", () => {
            it("should return failed", async () => {
                // Arrange
                consumer.definition = { choices: [] };
                consumer.gameData = { ingame: { m1: { betTracks: { uid: "m1", result: [{ rank: "2" }, { rank: "A" }] } } } };
                consumer.publisher = { publishToUser: jest.fn() };
                const player = { UID: "m1" };
                const amount = 10;
                const betChoice = "hi";
                spyOn(consumer, "composeValidationCriteria").and.returnValue([{ failure: true }]);

                // Act
                const actualValue = await consumer.validateBetRequest(player, betChoice, amount);

                // Assert
                expect(actualValue).toBeFalse();
            });
        });

        describe("when not have failedCriterion", () => {
            it("should return true", async () => {
                // Arrange
                consumer.definition = { choices: [] };
                consumer.gameData = { ingame: { m1: { betTracks: { uid: "m1", result: [{ rank: "2" }, { rank: "A" }] } } } };
                consumer.publisher = { publishToUser: jest.fn() };
                const player = { UID: "m1" };
                const amount = 10;
                const betChoice = "hi";
                spyOn(consumer, "composeValidationCriteria").and.returnValue([]);

                // Act
                const actualValue = await consumer.validateBetRequest(player, betChoice, amount);

                // Assert
                expect(actualValue).toBeTruthy();
            });
        });
    });

    describe("consume", () => {
        describe("when not have ingame data", () => {
            it("should not push deal info to queue", () => {
                // Arrange
                consumer.definition = { choices: [] };
                consumer.gameData = {
                    ingame: { m2: { betTracks: { uid: "m1", result: [{ rank: "2" }, { rank: "A" }] } }, m1: { betQueue: [] } },
                };
                consumer.publisher = { publishToUser: jest.fn() };
                consumer.settleTurnConsumer = { settleTurn: jest.fn() };
                const player = { UID: "m1", profile: { name: "m1" } };
                spyOn(consumer, "validateBetRequest").and.returnValue(false);
                const payload = {};

                // Act
                consumer.consume(player, payload);

                // Assert
                expect(consumer.gameData.ingame.m1.betQueue.length).toBe(0);
            });
        });

        describe("when not have bet tracks data", () => {
            it("should not push deal info to queue", () => {
                // Arrange
                consumer.definition = { choices: [] };
                consumer.gameData = { ingame: { m1: { betTracks: null, betQueue: [] } } };
                consumer.publisher = { publishToUser: jest.fn() };
                consumer.settleGameRoundConsumer = { settleTurn: jest.fn() };
                const player = { UID: "m1", profile: { name: "m1" } };
                spyOn(consumer, "validateBetRequest").and.returnValue(false);
                const payload = {};

                // Act
                consumer.consume(player, payload);

                // Assert
                expect(consumer.gameData.ingame.m1.betQueue.length).toBe(0);
            });
        });

        describe("when validateBetRequest failed", () => {
            it("should not push deal info to queue", async () => {
                // Arrange
                consumer.definition = { choices: [] };
                consumer.gameData = { ingame: { m1: { betTracks: { uid: "m1", result: [{ rank: "2" }, { rank: "A" }] }, betQueue: [] } } };
                consumer.publisher = { publishToUser: jest.fn() };
                consumer.settleTurnConsumer = { settleTurn: jest.fn() };
                const player = { UID: "m1", profile: { name: "m1" } };
                spyOn(consumer, "validateBetRequest").and.returnValue(false);
                const payload = {};

                // Act
                consumer.consume(player, payload);

                // Assert
                expect(consumer.gameData.ingame.m1.betQueue.length).toBe(0);
            });
        });

        describe("when validateBetRequest passed", () => {
            const testCases = [{ betQueue: null }, { betQueue: [] }];
            it.each(testCases)("should push deal info to queue", (testCase) => {
                // Arrange
                consumer.definition = { choices: [] };
                consumer.gameData = {
                    ingame: { m1: { betQueue: testCase.betQueue, betTracks: { uid: "m1", result: [{ rank: "2" }, { rank: "A" }] } } },
                };
                consumer.publisher = { publishToUser: jest.fn() };
                consumer.settleGameRoundConsumer = { settleTurn: jest.fn() };

                const player = { UID: "m1", profile: { name: "m1" } };
                spyOn(consumer, "validateBetRequest").and.returnValue(true);
                const payload = {};

                // Act
                consumer.consume(player, payload);

                // Assert
                expect(consumer.gameData.ingame.m1.betQueue.length > 0).toBeTruthy();
            });
        });
    });
});
