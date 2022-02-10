import errorCodes from "../../constants/error-codes";
import { CollectConsumer } from "../index";

describe("collect-consumer", () => {
    let consumer;
    beforeEach(() => {
        // Arrange
        consumer = new CollectConsumer();
    });

    describe("validate", () => {
        describe("when config disabled", () => {
            it("should return failure", () => {
                // Arrange
                consumer.gameData = { gameConfigs: { enabled: false } };
                const expectedValue = { notice: errorCodes.cannotCollect };
                const round = { uid: "m1" };

                // Act
                const actualValue = consumer.validate(round);

                // Assert
                expect(actualValue).toStrictEqual(expectedValue);
            });
        });

        describe("when config enabled", () => {
            // Arrange
            const testCases = [
                { runningRound: null, expectedValue: { notice: errorCodes.roundEnded } },
                { runningRound: { uid: "m1", totalTurns: 0 }, expectedValue: { notice: errorCodes.cannotCollect } },
                { runningRound: { uid: "m1", totalTurns: 10 }, expectedValue: null },
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
                consumer.publisher = { publishToUser: jest.fn() };
                consumer.gameData = { ingame: { m1: { betTracks: {} } } };
                spyOn(consumer, "validate").and.returnValue({ failed: true });
                const player = { UID: "m1", profile: { name: "m1" } };

                // Act
                await consumer.consume(player);

                // Assert
                expect(consumer.publisher.publishToUser).toBeCalledWith("m1", expect.objectContaining({ isCollect: -1, failed: true }));
            });
        });

        describe("when validate passed", () => {
            const testCases = [{ betQueue: null }, { betQueue: [] }];
            it.each(testCases)("should push collect info to queue", async (testCase) => {
                // Arrange
                consumer.publisher = { publishToUser: jest.fn() };
                consumer.gameData = { ingame: { m1: { betQueue: testCase.betQueue }, betTracks: { id: 2 } } };
                consumer.settleGameRoundConsumer = { settleBets: jest.fn() };
                consumer.definition = { durations: {} };
                spyOn(consumer, "validate").and.returnValue(null);
                const player = { UID: "m1", profile: { name: "m1" } };

                // Act
                await consumer.consume(player);

                // Assert
                expect(consumer.gameData.ingame.m1.betQueue.length > 0).toBeTruthy();
            });
        });
    });
});
