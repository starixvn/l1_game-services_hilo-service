import { Core } from "sc-game-base";
import mongoose from "mongoose";
import { stubMongooseModelStupidly } from "jest-micro-auto-stub";
import { InGameConsumer } from "../index";

describe("in-game-consumer", () => {
    describe("extends", () => {
        it("inherit Core.BaseEventConsumers.InGameConsumer", () => {
            // act
            const consumer = new InGameConsumer({});

            // assert
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
            // arrange
            const gameData = {
                gameConfigs: {},
                exchangeRates: { code: {} },
                currencyGroupGames: [{ groupId: "1" }],
                ingame: testCase.ingame,
                players: {},
            };
            const roundQuery = { getList: jest.fn() };
            const getBalance = jest.fn();
            const userInfosRepository = stubMongooseModelStupidly(mongoose.Model);
            const consumer = new InGameConsumer({}, gameData, roundQuery, {}, getBalance, userInfosRepository);
            const player = { UID: "m1", session: {}, profile: { name: "m1" } };
            // act
            const actualValue = await consumer.buildPayload(player);

            // assert
            expect(actualValue.ownBets.roundId).toStrictEqual(testCase.expectedId);
        });
    });
});
