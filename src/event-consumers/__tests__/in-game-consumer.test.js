import { Core } from "sc-game-base";
import mongoose from "mongoose";
import { stubMongooseModelStupidly, stub } from "jest-micro-auto-stub";
import { InGameConsumer } from "../index";
import { player1 } from "../../test-data";
import { RoundQuery } from "../../query-apis";

describe("in-game-consumer", () => {
    let consumer;

    beforeEach(() => {
        // Arrange
        const roundQuery = stub(RoundQuery);
        const userInfosRepository = stubMongooseModelStupidly(mongoose.Model);
        consumer = new InGameConsumer({}, null, roundQuery, null, null, userInfosRepository);
    });

    describe("extends", () => {
        it("inherit Core.BaseEventConsumers.InGameConsumer", () => {
            // Assert
            expect(consumer instanceof Core.BaseEventConsumers.InGameConsumer);
        });
    });

    describe("buildPayload", () => {
        const testCases = [
            { ingame: { [player1.profile.name]: { betTracks: { id: 1, turnEndTime: new Date() } } }, expectedId: 1 },
            { ingame: { [player1.profile.name]: { betTracks: { id: 1 } } }, expectedId: 1 },
            { ingame: { [player1.profile.name]: { betTracks: undefined, expectedId: undefined } }, expectedId: undefined },
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
            consumer.getBalance = jest.fn();

            // Act
            const actualValue = await consumer.buildPayload(player1);

            // Assert
            expect(actualValue.ownBets.roundId).toStrictEqual(testCase.expectedId);
        });
    });
});
