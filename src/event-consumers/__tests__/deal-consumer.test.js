import { Core } from "sc-game-base";
import { stub } from "jest-micro-auto-stub";
import { helpers } from "sc-common";
import { DealConsumer } from "../index";
import errorCodes from "../../constants/error-codes";
import { player1 } from "../../__tests__/set-up";
import { BaseEventPublisher } from "sc-game-base/src/core/event-publishers";

describe("deal-consumer", () => {
    let consumer;
    beforeEach(() => {
        // Arrange
        const definition = { choices: ["h", "l"] };
        const publisher = stub(BaseEventPublisher);
        consumer = new DealConsumer(definition, null, publisher);
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
            consumer.gameData = { gameConfigs: { enabled: testCase.enabled } };
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
            consumer.gameData = { gameConfigs: { enabled: true } };
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
                consumer.gameData = { ingame: { [player1.profile.name]: { betTracks: null } } };
                const expectedValue = { failure: true, notice: { errorCode: helpers.noticeHelper.invalidBet } };
                const betChoice = "o";

                // Act
                const actualValue = consumer.composeBetChoiceValidationCriteria(player1, betChoice);

                // Assert
                expect(actualValue[0]).toStrictEqual(expectedValue);
            });
        });

        describe("when bet choice in definition.choices", () => {
            it("should not failed choices criterion", () => {
                // Arrange
                consumer.gameData = { ingame: { [player1.profile.name]: { betTracks: null } } };
                const expectedValue = { failure: false, notice: { errorCode: helpers.noticeHelper.invalidBet } };
                const betChoice = "h";

                // Act
                const actualValue = consumer.composeBetChoiceValidationCriteria(player1, betChoice);

                // Assert
                expect(actualValue[0]).toStrictEqual(expectedValue);
            });
        });
        describe("when loChoice", () => {
            describe("card is 2", () => {
                it("should failed loChoice criterion", () => {
                    // Arrange
                    consumer.gameData = {
                        ingame: { [player1.profile.name]: { betTracks: { uid: player1.UID, result: [{ rank: "2" }] } } },
                    };
                    const expectedValue = {
                        failure: true,
                        notice: { errorCode: errorCodes.cannotLowerThan },
                    };
                    const betChoice = "l";

                    // Act
                    const actualValue = consumer.composeBetChoiceValidationCriteria(player1, betChoice);

                    // Assert
                    expect(actualValue[1]).toStrictEqual(expectedValue);
                });
            });

            describe("card is not 2", () => {
                it("should not failed loChoice criterion", () => {
                    // Arrange
                    consumer.gameData = {
                        ingame: { [player1.profile.name]: { betTracks: { uid: player1.UID, result: [{ rank: "2" }, { rank: "4" }] } } },
                    };
                    const expectedValue = {
                        failure: false,
                        notice: { errorCode: errorCodes.cannotLowerThan },
                    };
                    const betChoice = "l";

                    // Act
                    const actualValue = consumer.composeBetChoiceValidationCriteria(player1, betChoice);

                    // Assert
                    expect(actualValue[1]).toStrictEqual(expectedValue);
                });
            });

            describe("card is not 1", () => {
                it("should not failed hiChoice criterion", () => {
                    // Arrange
                    consumer.gameData = {
                        ingame: { [player1.profile.name]: { betTracks: { uid: player1.UID, result: [{ rank: "2" }, { rank: "4" }] } } },
                    };
                    const expectedValue = {
                        failure: false,
                        notice: { errorCode: errorCodes.cannotGreaterThan },
                    };
                    const betChoice = "l";

                    // Act
                    const actualValue = consumer.composeBetChoiceValidationCriteria(player1, betChoice);

                    // Assert
                    expect(actualValue[2]).toStrictEqual(expectedValue);
                });
            });

            describe("card is 2", () => {
                it("should not failed hiChoice criterion", () => {
                    // Arrange
                    consumer.gameData = {
                        ingame: { [player1.profile.name]: { betTracks: { uid: player1.UID, result: [{ rank: "2" }, { rank: "A" }] } } },
                    };
                    const expectedValue = {
                        failure: false,
                        notice: { errorCode: errorCodes.cannotGreaterThan },
                    };
                    const betChoice = "l";

                    // Act
                    const actualValue = consumer.composeBetChoiceValidationCriteria(player1, betChoice);

                    // Assert
                    expect(actualValue[2]).toStrictEqual(expectedValue);
                });
            });
        });

        describe("when hiChoice", () => {
            describe("card is not 2", () => {
                it("should not failed loChoice criterion", () => {
                    // Arrange
                    consumer.gameData = {
                        ingame: { [player1.profile.name]: { betTracks: { uid: player1.UID, result: [{ rank: "2" }, { rank: "4" }] } } },
                    };
                    const expectedValue = {
                        failure: false,
                        notice: { errorCode: errorCodes.cannotLowerThan },
                    };
                    const betChoice = "h";

                    // Act
                    const actualValue = consumer.composeBetChoiceValidationCriteria(player1, betChoice);

                    // Assert
                    expect(actualValue[1]).toStrictEqual(expectedValue);
                });
            });

            describe("card is 2", () => {
                it("should not failed loChoice criterion", () => {
                    // Arrange
                    consumer.gameData = {
                        ingame: { [player1.profile.name]: { betTracks: { uid: player1.UID, result: [{ rank: "2" }, { rank: "2" }] } } },
                    };
                    const expectedValue = {
                        failure: false,
                        notice: { errorCode: errorCodes.cannotLowerThan },
                    };
                    const betChoice = "h";

                    // Act
                    const actualValue = consumer.composeBetChoiceValidationCriteria(player1, betChoice);

                    // Assert
                    expect(actualValue[1]).toStrictEqual(expectedValue);
                });
            });

            describe("card is 1", () => {
                it("should failed hiChoice criterion", () => {
                    // Arrange
                    consumer.gameData = { ingame: { [player1.profile.name]: { betTracks: { result: [{ rank: "A" }] } } } };
                    const expectedValue = {
                        failure: true,
                        notice: { errorCode: errorCodes.cannotGreaterThan },
                    };
                    const betChoice = "h";

                    // Act
                    const actualValue = consumer.composeBetChoiceValidationCriteria(player1, betChoice);

                    // Assert
                    expect(actualValue[2]).toStrictEqual(expectedValue);
                });
            });

            describe("card is not 1", () => {
                it("should not failed hiChoice criterion", () => {
                    // Arrange
                    consumer.gameData = {
                        ingame: { [player1.profile.name]: { betTracks: { uid: player1.UID, result: [{ rank: "2" }, { rank: "4" }] } } },
                    };
                    const expectedValue = {
                        failure: false,
                        notice: { errorCode: errorCodes.cannotGreaterThan },
                    };
                    const betChoice = "h";

                    // Act
                    const actualValue = consumer.composeBetChoiceValidationCriteria(player1, betChoice);

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
                consumer.gameData = {
                    ingame: { [player1.profile.name]: { betTracks: { uid: player1.UID, result: [{ rank: "2" }, { rank: "A" }] } } },
                };
                const amount = 10;
                const betChoice = "h";
                spyOn(consumer, "composeValidationCriteria").and.returnValue([{ failure: true }]);

                // Act
                const actualValue = await consumer.validateBetRequest(player1, betChoice, amount);

                // Assert
                expect(actualValue).toBeFalse();
            });
        });

        describe("when not have failedCriterion", () => {
            it("should return true", async () => {
                // Arrange
                consumer.definition = { choices: [] };
                consumer.gameData = {
                    ingame: {
                        [player1.profile.name]: { betTracks: { uid: player1.UID, result: [{ rank: "2" }, { rank: "A" }] } },
                    },
                };
                const amount = 10;
                const betChoice = "h";
                spyOn(consumer, "composeValidationCriteria").and.returnValue([]);

                // Act
                const actualValue = await consumer.validateBetRequest(player1, betChoice, amount);

                // Assert
                expect(actualValue).toBeTruthy();
            });
        });
    });

    describe("consume", () => {
        describe("when not have ingame data", () => {
            it("should not push deal info to queue", () => {
                // Arrange
                consumer.gameData = {
                    ingame: {
                        m2: { betTracks: { uid: "m1", result: [{ rank: "2" }, { rank: "A" }] } },
                        m1: { betQueue: [] },
                    },
                };
                spyOn(consumer, "validateBetRequest").and.returnValue(false);
                const payload = {};

                // Act
                consumer.consume(player1, payload);

                // Assert
                expect(consumer.gameData.ingame.m1.betQueue.length).toBe(0);
            });
        });

        describe("when not have bet tracks data", () => {
            it("should not push deal info to queue", () => {
                // Arrange
                consumer.gameData = { ingame: { [player1.profile.name]: { betTracks: null, betQueue: [] } } };
                spyOn(consumer, "validateBetRequest").and.returnValue(false);
                const payload = {};

                // Act
                consumer.consume(player1, payload);

                // Assert
                expect(consumer.gameData.ingame[player1.profile.name].betQueue.length).toBe(0);
            });
        });

        describe("when validateBetRequest failed", () => {
            it("should not push deal info to queue", async () => {
                // Arrange
                consumer.gameData = {
                    ingame: {
                        [player1.profile.name]: { betTracks: { uid: player1.UID, result: [{ rank: "2" }, { rank: "A" }] }, betQueue: [] },
                    },
                };
                spyOn(consumer, "validateBetRequest").and.returnValue(false);
                const payload = {};

                // Act
                consumer.consume(player1, payload);

                // Assert
                expect(consumer.gameData.ingame[player1.profile.name].betQueue.length).toBe(0);
            });
        });

        describe("when validateBetRequest passed", () => {
            const testCases = [{ betQueue: null }, { betQueue: [] }];
            it.each(testCases)("should push deal info to queue", (testCase) => {
                // Arrange
                consumer.gameData = {
                    ingame: {
                        [player1.profile.name]: {
                            betQueue: testCase.betQueue,
                            betTracks: { uid: player1.UID, result: [{ rank: "2" }, { rank: "A" }] },
                        },
                    },
                };
                spyOn(consumer, "validateBetRequest").and.returnValue(true);
                const payload = {};

                // Act
                consumer.consume(player1, payload);

                // Assert
                expect(consumer.gameData.ingame[player1.profile.name].betQueue.length > 0).toBeTruthy();
            });
        });
    });
});
