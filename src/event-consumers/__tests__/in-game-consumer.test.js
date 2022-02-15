import { Core } from "sc-game-base";
import mongoose from "mongoose";
import { stubMongooseModelStupidly } from "jest-micro-auto-stub";
import { InGameConsumer } from "../index";
import Chance from "chance";

describe("in-game-consumer", () => {
    let consumer;
    const roundQuery = {};
    const getBalance = jest.fn();
    const userInfosRepository = stubMongooseModelStupidly(mongoose.Model);
    const definition = {};
    const gameData = {
        gameConfigs: { odds: {} },
        exchangeRates: { code: {} },
        currencyGroupGames: [{ groupId: "1" }],
        players: {},
    };
    const publisher = {};
    const chance = new Chance();

    const generateBetTrack = () => {
        return {
            id: chance.integer({ min: 1 }),
            betwin: chance.integer({ min: 1 }),
            amount: chance.integer({ min: 1 }),
            totalTurns: chance.integer({ min: 1 }),
            turnEndTime: new Date(),
            nextAmounts: { h: chance.floating({ min: 1, length: 2 }), l: chance.floating({ min: 1, length: 2 }) },
            result: [],
        };
    };

    beforeEach(() => {
        // Arrange
        jest.clearAllMocks();

        consumer = new InGameConsumer(definition, gameData, roundQuery, publisher, getBalance, userInfosRepository);
    });

    it("always inherit Core.BaseEventConsumers.InGameConsumer", () => {
        // Assert
        expect(consumer instanceof Core.BaseEventConsumers.InGameConsumer);
    });

    describe("buildPayload", () => {
        describe("when player not have existing bet", () => {
            const testCases = [{ ingame: { player1: { betTracks: undefined } } }, { ingame: { player2: { betTracks: undefined } } }];

            it.each(testCases)("should return empty ownBets", async (testCase) => {
                // Arrange
                consumer.gameData = {
                    ...gameData,
                    ingame: testCase.ingame,
                };

                const player = { UID: "uid", session: {}, profile: { name: "player1" } };

                // Act
                const actualValue = await consumer.buildPayload(player);

                // Assert
                expect(actualValue.ownBets).toBeEmpty();
            });
        });

        describe("when player have existing bet", () => {
            it("should return ownBets", async () => {
                // Arrange
                consumer.gameData = {
                    ...gameData,
                    ingame: { player1: { betTracks: generateBetTrack() } },
                };

                const player = { UID: "uid", session: {}, profile: { name: "player1" } };

                // Act
                const actualValue = await consumer.buildPayload(player);

                // Assert
                expect(actualValue.ownBets).not.toBeEmpty();
            });

            it("should return bet track amount", async () => {
                // Arrange
                const playerBet = generateBetTrack();
                consumer.gameData = {
                    ...gameData,
                    ingame: { player1: { betTracks: playerBet } },
                };

                const player = { UID: "uid", session: {}, profile: { name: "player1" } };

                // Act
                const actualValue = await consumer.buildPayload(player);

                // Assert
                expect(actualValue.ownBets.amount).toBe(playerBet.amount);
            });

            it("should return bet track betwin", async () => {
                // Arrange
                const playerBet = generateBetTrack();
                consumer.gameData = {
                    ...gameData,
                    ingame: { player1: { betTracks: playerBet } },
                };

                const player = { UID: "uid", session: {}, profile: { name: "player1" } };

                // Act
                const actualValue = await consumer.buildPayload(player);

                // Assert
                expect(actualValue.ownBets.betwin).toBe(playerBet.betwin);
            });

            it("should return bet track totalTurns", async () => {
                // Arrange
                const playerBet = generateBetTrack();
                consumer.gameData = {
                    ...gameData,
                    ingame: { player1: { betTracks: playerBet } },
                };

                const player = { UID: "uid", session: {}, profile: { name: "player1" } };

                // Act
                const actualValue = await consumer.buildPayload(player);

                // Assert
                expect(actualValue.ownBets.totalTurns).toBe(playerBet.totalTurns);
            });

            it("should return bet track totalTurns", async () => {
                // Arrange
                const playerBet = generateBetTrack();
                consumer.gameData = {
                    ...gameData,
                    ingame: { player1: { betTracks: playerBet } },
                };

                const player = { UID: "uid", session: {}, profile: { name: "player1" } };

                // Act
                const actualValue = await consumer.buildPayload(player);

                // Assert
                expect(actualValue.ownBets.nextAmounts).toBe(playerBet.nextAmounts);
            });
        });
    });
});
