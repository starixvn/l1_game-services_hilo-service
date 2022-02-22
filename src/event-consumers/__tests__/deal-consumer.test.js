import { Core } from "sc-game-base";
import { stub } from "jest-micro-auto-stub";
import { helpers } from "sc-common";
import { DealConsumer } from "../index";
import { player1 } from "../../__tests__/test-data";
import { BaseEventPublisher } from "sc-game-base/src/core/event-publishers";

describe("DealConsumer", () => {
    let consumer;
    let gameData = {};

    beforeEach(() => {
        // Arrange
        const definition = { choices: ["h", "l"] };
        const publisher = stub(BaseEventPublisher);
        consumer = new DealConsumer(definition, gameData, publisher);
    });

    it("inherit Core.BaseEventConsumers.PlaceBetConsumer ", () => {
        // Assert
        expect(consumer instanceof Core.BaseEventConsumers.PlaceBetConsumer);
    });

    describe("composeValidationCriteria", () => {
        it("should return concat of time/choice validation", () => {
            // Arrange
            spyOn(consumer, "composeBettingTimeValidationCriteria").and.returnValue([{ failure: true, notice: { code: 1 } }]);
            spyOn(consumer, "composeBetAmountValidationCriteria").and.returnValue([{ failure: true, notice: { code: 2 } }]);
            spyOn(consumer, "composeBetChoiceValidationCriteria").and.returnValue([{ failure: true, notice: { code: 3 } }]);
            const expectedValue = [
                { failure: true, notice: { code: 1 } },
                { failure: true, notice: { code: 3 } },
            ];

            // Act
            const actualValue = consumer.composeValidationCriteria();

            // Assert
            expect(actualValue).toStrictEqual(expectedValue);
        });
    });

    describe("composeBettingTimeValidationCriteria", () => {
        describe("when game disable", () => {
            it("should return invalidBet criterion with failure = true", () => {
                // Arrange
                gameData.gameConfigs = { enabled: false };
                const roundId = undefined;
                const expectedValue = { failure: true, notice: { errorCode: helpers.noticeHelper.invalidBet } };

                // Act
                const actualValue = consumer.composeBettingTimeValidationCriteria(roundId);

                // Assert
                expect(actualValue[0]).toStrictEqual(expectedValue);
            });
        });

        describe("when game enabled", () => {
            it("should return invalidBet criterion with failure = false", () => {
                // Arrange
                gameData.gameConfigs = { enabled: true };
                const roundId = undefined;
                const expectedValue = { failure: false, notice: { errorCode: helpers.noticeHelper.invalidBet } };

                // Act
                const actualValue = consumer.composeBettingTimeValidationCriteria(roundId);

                // Assert
                expect(actualValue[0]).toStrictEqual(expectedValue);
            });
        });

        describe("when not have round id", () => {
            it("should return invalidBet criterion with failure = true", () => {
                // Arrange
                gameData.gameConfigs = { enabled: true };
                const roundId = undefined;
                const expectedValue = {
                    failure: true,
                    notice: { errorCode: helpers.noticeHelper.invalidBet },
                };

                // Act
                const actualValue = consumer.composeBettingTimeValidationCriteria(roundId);

                // Assert
                expect(actualValue[1]).toStrictEqual(expectedValue);
            });
        });

        describe("when have round id", () => {
            it("should return invalidBet criterion with failure = false", () => {
                // Arrange
                gameData.gameConfigs = { enabled: true };
                const roundId = 10;
                const expectedValue = {
                    failure: false,
                    notice: { errorCode: helpers.noticeHelper.invalidBet },
                };

                // Act
                const actualValue = consumer.composeBettingTimeValidationCriteria(roundId);

                // Assert
                expect(actualValue[1]).toStrictEqual(expectedValue);
            });
        });
    });

    describe("composeBetChoiceValidationCriteria", () => {
        describe("when bet choice not in definition.choices", () => {
            it("should return invalidBet criterion with failure = true", () => {
                // Arrange
                gameData.ingame = { [player1.profile.name]: { betTracks: null } };
                const expectedValue = { failure: true, notice: { errorCode: helpers.noticeHelper.invalidBet } };
                const betChoice = "o";

                // Act
                const actualValue = consumer.composeBetChoiceValidationCriteria(player1, betChoice);

                // Assert
                expect(actualValue[0]).toStrictEqual(expectedValue);
            });
        });

        describe("when bet choice in definition.choices", () => {
            it("should return invalidBet criterion with failure = false", () => {
                // Arrange
                gameData.ingame = { [player1.profile.name]: { betTracks: null } };
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
                it("should return invalidBet criterion with failure = true", () => {
                    // Arrange
                    gameData.ingame = { [player1.profile.name]: { betTracks: { uid: player1.UID, result: [{ rank: "2" }] } } };
                    const expectedValue = {
                        failure: true,
                        notice: { errorCode: helpers.noticeHelper.invalidBet },
                    };
                    const betChoice = "l";

                    // Act
                    const actualValue = consumer.composeBetChoiceValidationCriteria(player1, betChoice);

                    // Assert
                    expect(actualValue[1]).toStrictEqual(expectedValue);
                });
            });

            describe("card is not 2", () => {
                it("should return invalidBet criterion with failure = false", () => {
                    // Arrange
                    gameData.ingame = {
                        [player1.profile.name]: { betTracks: { uid: player1.UID, result: [{ rank: "2" }, { rank: "4" }] } },
                    };
                    const expectedValue = {
                        failure: false,
                        notice: { errorCode: helpers.noticeHelper.invalidBet },
                    };
                    const betChoice = "l";

                    // Act
                    const actualValue = consumer.composeBetChoiceValidationCriteria(player1, betChoice);

                    // Assert
                    expect(actualValue[1]).toStrictEqual(expectedValue);
                });
            });

            describe("card is not Ace", () => {
                it("should return invalidBet criterion with failure = false", () => {
                    // Arrange
                    gameData.ingame = {
                        [player1.profile.name]: { betTracks: { uid: player1.UID, result: [{ rank: "2" }, { rank: "4" }] } },
                    };
                    const expectedValue = {
                        failure: false,
                        notice: { errorCode: helpers.noticeHelper.invalidBet },
                    };
                    const betChoice = "l";

                    // Act
                    const actualValue = consumer.composeBetChoiceValidationCriteria(player1, betChoice);

                    // Assert
                    expect(actualValue[2]).toStrictEqual(expectedValue);
                });
            });

            describe("card is Ace", () => {
                it("should return invalidBet criterion with failure = false", () => {
                    // Arrange
                    gameData.ingame = {
                        [player1.profile.name]: { betTracks: { uid: player1.UID, result: [{ rank: "2" }, { rank: "A" }] } },
                    };
                    const expectedValue = {
                        failure: false,
                        notice: { errorCode: helpers.noticeHelper.invalidBet },
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
                it("should return invalidBet criterion with failure = false", () => {
                    // Arrange
                    gameData.ingame = {
                        [player1.profile.name]: { betTracks: { uid: player1.UID, result: [{ rank: "2" }, { rank: "4" }] } },
                    };
                    const expectedValue = {
                        failure: false,
                        notice: { errorCode: helpers.noticeHelper.invalidBet },
                    };
                    const betChoice = "h";

                    // Act
                    const actualValue = consumer.composeBetChoiceValidationCriteria(player1, betChoice);

                    // Assert
                    expect(actualValue[1]).toStrictEqual(expectedValue);
                });
            });

            describe("card is 2", () => {
                it("should return invalidBet criterion with failure = false", () => {
                    // Arrange
                    gameData.ingame = {
                        [player1.profile.name]: { betTracks: { uid: player1.UID, result: [{ rank: "2" }, { rank: "2" }] } },
                    };
                    const expectedValue = {
                        failure: false,
                        notice: { errorCode: helpers.noticeHelper.invalidBet },
                    };
                    const betChoice = "h";

                    // Act
                    const actualValue = consumer.composeBetChoiceValidationCriteria(player1, betChoice);

                    // Assert
                    expect(actualValue[1]).toStrictEqual(expectedValue);
                });
            });

            describe("card is Ace", () => {
                it("should return invalidBet criterion with failure = true", () => {
                    // Arrange
                    gameData.ingame = { [player1.profile.name]: { betTracks: { result: [{ rank: "A" }] } } };
                    const expectedValue = {
                        failure: true,
                        notice: { errorCode: helpers.noticeHelper.invalidBet },
                    };
                    const betChoice = "h";

                    // Act
                    const actualValue = consumer.composeBetChoiceValidationCriteria(player1, betChoice);

                    // Assert
                    expect(actualValue[2]).toStrictEqual(expectedValue);
                });
            });

            describe("card is not Ace", () => {
                it("should return invalidBet criterion with failure = false", () => {
                    // Arrange
                    gameData.ingame = {
                        [player1.profile.name]: { betTracks: { uid: player1.UID, result: [{ rank: "2" }, { rank: "4" }] } },
                    };
                    const expectedValue = {
                        failure: false,
                        notice: { errorCode: helpers.noticeHelper.invalidBet },
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
            it("should return false", async () => {
                // Arrange
                gameData.ingame = { [player1.profile.name]: { betTracks: { uid: player1.UID, result: [{ rank: "2" }, { rank: "A" }] } } };
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
                gameData.ingame = {
                    [player1.profile.name]: { betTracks: { uid: player1.UID, result: [{ rank: "2" }, { rank: "A" }] } },
                };
                const amount = 10;
                const betChoice = "h";
                spyOn(consumer, "composeValidationCriteria").and.returnValue([]);

                // Act
                const actualValue = await consumer.validateBetRequest(player1, betChoice, amount);

                // Assert
                expect(actualValue).toBeTrue();
            });
        });
    });

    describe("consume", () => {
        describe("when not have ingame data", () => {
            beforeEach(() => {
                // Arrange
                gameData.ingame = {
                    m2: { betTracks: { uid: "m1", result: [{ rank: "2" }, { rank: "A" }] } },
                    m1: { betQueue: [] },
                };
                spyOn(consumer, "validateBetRequest").and.returnValue(false);
                const payload = {};

                // Act
                consumer.consume(player1, payload);
            });

            it("should call publisher.publishToUser", () => {
                // Assert
                expect(consumer.publisher.publishToUser).toBeCalledWith(player1.UID, {
                    endDeal: -1,
                    notice: { errorCode: helpers.noticeHelper.invalidBet },
                });
            });

            it("should not push deal info to queue", () => {
                // Assert
                expect(consumer.gameData.ingame.m1.betQueue.length).toBe(0);
            });
        });

        describe("when not have bet tracks data", () => {
            it("should not push deal info to queue", () => {
                // Arrange
                gameData.ingame = { [player1.profile.name]: { betTracks: null, betQueue: [] } };
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
                gameData.ingame = {
                    [player1.profile.name]: { betTracks: { uid: player1.UID, result: [{ rank: "2" }, { rank: "A" }] }, betQueue: [] },
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
            it("should push deal info to queue", () => {
                // Arrange
                gameData.ingame = {
                    [player1.profile.name]: {
                        betQueue: [],
                        betTracks: { uid: player1.UID, result: [{ rank: "2" }, { rank: "A" }] },
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
