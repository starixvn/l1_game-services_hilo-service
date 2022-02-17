import { CollectConsumer } from "../index";
import { player1 } from "../../__tests__/test-data";
import { BaseEventPublisher } from "sc-game-base/src/core/event-publishers";
import { stub } from "jest-micro-auto-stub";
import { helpers } from "sc-common";

describe("collect-consumer", () => {
    let consumer;
    let publisher;

    beforeEach(() => {
        // Arrange
        publisher = stub(BaseEventPublisher);
        consumer = new CollectConsumer(null, null, publisher);
    });

    describe("validate", () => {
        describe("when config disabled", () => {
            it("should return failure", () => {
                // Arrange
                consumer.gameData = { gameConfigs: { enabled: false } };
                const expectedValue = { notice: { errorCode: helpers.noticeHelper.invalidBet } };
                const round = { uid: player1.UID };

                // Act
                const actualValue = consumer.validate(round);

                // Assert
                expect(actualValue).toStrictEqual(expectedValue);
            });
        });

        describe("when config enabled", () => {
            // Arrange
            const testCases = [
                { runningRound: null, expectedValue: { notice: { errorCode: helpers.noticeHelper.invalidBet } } },
                {
                    runningRound: { uid: player1.UID, totalTurns: 0 },
                    expectedValue: { notice: { errorCode: helpers.noticeHelper.invalidBet } },
                },
                { runningRound: { uid: player1.UID, totalTurns: 10 }, expectedValue: null },
            ];

            it.each(testCases)("should return validation result of runningRound", (testCase) => {
                // Arrange
                consumer.gameData = { gameConfigs: { enabled: true } };

                // Act
                const actualValue = consumer.validate(testCase.runningRound);

                // Assert
                expect(actualValue).toStrictEqual(testCase.expectedValue);
            });
        });
    });

    describe("consume", () => {
        describe("when validate failed", () => {
            it("should publish error to user", async () => {
                // Arrange
                consumer.gameData = { ingame: { [player1.profile.name]: { betTracks: {} } } };
                spyOn(consumer, "validate").and.returnValue({ failed: true });

                // Act
                await consumer.consume(player1);

                // Assert
                expect(publisher.publishToUser).toBeCalledWith(player1.UID, expect.objectContaining({ isCollect: -1, failed: true }));
            });
        });

        describe("when validate passed", () => {
            const testCases = [{ betQueue: null }, { betQueue: [] }];
            it.each(testCases)("should push collect info to queue", async (testCase) => {
                // Arrange
                consumer.gameData = { ingame: { [player1.profile.name]: { betQueue: testCase.betQueue }, betTracks: { id: 2 } } };
                consumer.definition = { durations: {} };
                spyOn(consumer, "validate").and.returnValue(null);

                // Act
                await consumer.consume(player1);

                // Assert
                expect(consumer.gameData.ingame[player1.profile.name].betQueue.length > 0).toBeTruthy();
            });
        });
    });
});
