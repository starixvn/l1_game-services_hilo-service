import { Core } from "sc-game-base";
import mongoose from "mongoose";
import { stubMongooseModelStupidly } from "jest-micro-auto-stub";
import { InGameConsumer } from "../index";

describe("in-game-consumer", () => {
    let consumer;

    beforeEach(() => {
        // Arrange
        consumer = new InGameConsumer({});
    });

    describe("extends", () => {
        it("inherit Core.BaseEventConsumers.InGameConsumer", () => {
            // Assert
            expect(consumer instanceof Core.BaseEventConsumers.InGameConsumer);
        });
    });

    describe("buildPayload", () => {
        const testCases = [
            { ingame: { m1: { betTracks: { id: 1, turnEndTime: new Date() } } }, expectedId: 1 },
            { ingame: { m1: { betTracks: { id: 1 } } }, expectedId: 1 },
            { ingame: { m1: { betTracks: undefined, expectedId: undefined } }, expectedId: undefined },
            { ingame: { m2: { betTracks: undefined, expectedId: undefined } }, expectedId: undefined },
        ];
        it.each(testCases)("should return ownBets", async (testCase) => {
            // Arrange
            consumer.gameData = {
                gameConfigs: {},
                exchangeRates: { code: {} },
                currencyGroupGames: [{ groupId: "1" }],
                ingame: testCase.ingame,
                players: {},
            };
            consumer.roundQuery = { getList: jest.fn() };
            consumer.getBalance = jest.fn();
            consumer.userInfosRepository = stubMongooseModelStupidly(mongoose.Model);
            const player = { UID: "m1", session: {}, profile: { name: "m1" } };
            // Act
            const actualValue = await consumer.buildPayload(player);

            // Assert
            expect(actualValue.ownBets.roundId).toStrictEqual(testCase.expectedId);
        });
    });
});
