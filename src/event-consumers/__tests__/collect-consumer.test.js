import errorCodes from "../../constants/error-codes";
import { CollectConsumer } from "../index";

describe("collect-consumer", () => {
    describe("validate", () => {
        describe("when config disabled", () => {
            it("should return failure", () => {
                // arrange
                const gameData = { gameConfigs: { enabled: false } };
                const consumer = new CollectConsumer(null, gameData);
                const expectedValue = { notice: errorCodes.cannotCollect };
                const round = { uid: "m1" };

                // act
                const actualValue = consumer.validate(round);

                // assert
                expect(actualValue).toStrictEqual(expectedValue);
            });
        });

        describe("when config enabled", () => {
            // arrange
            const testCases = [
                { runningRound: null, expectedValue: { notice: errorCodes.roundEnded } },
                { runningRound: { uid: "m1", totalTurns: 0 }, expectedValue: { notice: errorCodes.cannotCollect } },
                { runningRound: { uid: "m1", totalTurns: 10 }, expectedValue: null },
            ];

            it.each(testCases)("should return validation result of runningRound", (testCase) => {
                // arrange
                const gameData = { gameConfigs: { enabled: true } };
                const consumer = new CollectConsumer(null, gameData);

                // act
                const actualValue = consumer.validate(testCase.runningRound);

                // assert
                expect(actualValue).toStrictEqual(testCase.expectedValue);
            });
        });
    });

    describe("consume", () => {
        describe("when validate failed", () => {
            it("should publish error to user", async () => {
                // arrange
                const publisher = { publishToUser: jest.fn() };
                const gameData = { ingame: { m1: { betTracks: {} } } };
                const consumer = new CollectConsumer(null, gameData, publisher);
                spyOn(consumer, "validate").and.returnValue({ failed: true });
                const player = { UID: "m1", profile: { name: "m1" } };

                // act
                await consumer.consume(player);

                // assert
                expect(publisher.publishToUser).toBeCalledWith("m1", expect.objectContaining({ isCollect: -1, failed: true }));
            });
        });

        describe("when validate passed", () => {
            const testCases = [{ betQueue: null }, { betQueue: [] }];
            it.each(testCases)("should push collect info to queue", async (testCase) => {
                // arrange
                const publisher = { publishToUser: jest.fn() };
                const gameData = { ingame: { m1: { betQueue: testCase.betQueue }, betTracks: { id: 2 } } };
                const settleGameRoundConsumer = { settleBets: jest.fn() };
                const definition = { durations: {} };
                const consumer = new CollectConsumer(definition, gameData, publisher, settleGameRoundConsumer);
                spyOn(consumer, "validate").and.returnValue(null);
                const player = { UID: "m1", profile: { name: "m1" } };

                // act
                await consumer.consume(player);

                // assert
                expect(gameData.ingame.m1.betQueue.length > 0).toBeTruthy();
            });
        });
    });
});
