import { CollectConsumer } from "../index";
import { player1 } from "../../__tests__/test-data";
import { BaseEventPublisher } from "sc-game-base/src/core/event-publishers";
import { stub } from "jest-micro-auto-stub";
import { helpers } from "sc-common";

describe("CollectConsumer", () => {
    let consumer;
    let publisher;
    let gameData = {};
    let definition = {};

    beforeEach(() => {
        // Arrange
        publisher = stub(BaseEventPublisher);
        consumer = new CollectConsumer(definition, gameData, publisher);
    });

    describe("validate", () => {
        describe("when config disabled", () => {
            it("should return failure", () => {
                // Arrange
                gameData.gameConfigs = { enabled: false };
                const expectedValue = { notice: { errorCode: helpers.noticeHelper.invalidBet } };
                const round = { uid: player1.UID };

                // Act
                const actualValue = consumer.validate(round);

                // Assert
                expect(actualValue).toStrictEqual(expectedValue);
            });
        });

        describe("when config enabled", () => {
            describe("when not have running round", () => {
                it("should return invalidBet", () => {
                    // Arrange
                    gameData.gameConfigs = { enabled: true };
                    const runningRound = null;
                    const expectedValue = { notice: { errorCode: helpers.noticeHelper.invalidBet } };

                    // Act
                    const actualValue = consumer.validate(runningRound);

                    // Assert
                    expect(actualValue).toStrictEqual(expectedValue);
                });
            });

            describe("when running round is empty", () => {
                it("should return invalidBet", () => {
                    // Arrange
                    gameData.gameConfigs = { enabled: true };
                    const runningRound = {};
                    const expectedValue = { notice: { errorCode: helpers.noticeHelper.invalidBet } };

                    // Act
                    const actualValue = consumer.validate(runningRound);

                    // Assert
                    expect(actualValue).toStrictEqual(expectedValue);
                });
            });

            describe("when running round turn = 0", () => {
                it("should return invalidBet", () => {
                    // Arrange
                    gameData.gameConfigs = { enabled: true };
                    const runningRound = { uid: player1.UID, totalTurns: 0 };
                    const expectedValue = { notice: { errorCode: helpers.noticeHelper.invalidBet } };

                    // Act
                    const actualValue = consumer.validate(runningRound);

                    // Assert
                    expect(actualValue).toStrictEqual(expectedValue);
                });
            });

            describe("when running round turn > 0", () => {
                it("should return null failure", () => {
                    // Arrange
                    gameData.gameConfigs = { enabled: true };
                    const runningRound = { uid: player1.UID, totalTurns: 10 };
                    const expectedValue = null;

                    // Act
                    const actualValue = consumer.validate(runningRound);

                    // Assert
                    expect(actualValue).toStrictEqual(expectedValue);
                });
            });
        });
    });

    describe("consume", () => {
        describe("when validate failed", () => {
            it("should publish error to user", async () => {
                // Arrange
                gameData.ingame = { [player1.profile.name]: { betTracks: {} } };
                spyOn(consumer, "validate").and.returnValue({ failed: true });

                // Act
                await consumer.consume(player1);

                // Assert
                expect(publisher.publishToUser).toBeCalledWith(player1.UID, expect.objectContaining({ isCollect: -1, failed: true }));
            });
        });

        describe("when validate passed", () => {
            describe("when betQueue is null", () => {
                it("should create bet queue and push collect info to queue", async () => {
                    // Arrange
                    gameData.ingame = { [player1.profile.name]: { betQueue: null }, betTracks: { id: 2 } };
                    spyOn(consumer, "validate").and.returnValue(null);

                    // Act
                    await consumer.consume(player1);

                    // Assert
                    expect(gameData.ingame[player1.profile.name].betQueue.length > 0).toBeTruthy();
                });
            });

            describe("when betQueue is not null", () => {
                it("should push collect info to queue", async () => {
                    // Arrange
                    gameData.ingame = { [player1.profile.name]: { betQueue: [] }, betTracks: { id: 2 } };
                    spyOn(consumer, "validate").and.returnValue(null);

                    // Act
                    await consumer.consume(player1);

                    // Assert
                    expect(gameData.ingame[player1.profile.name].betQueue.length > 0).toBeTruthy();
                });
            });
        });
    });
});
