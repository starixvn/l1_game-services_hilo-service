import { Core } from "sc-game-base";
import mongoose from "mongoose";
import { stubMongoose } from "jest-micro-auto-stub";
import { InGameConsumer } from "../index";
import Chance from "chance";
import { baseCards } from "../../cards";

describe("InGameConsumer", () => {
    let consumer, player;
    const roundQuery = {};
    const getBalance = jest.fn();
    const userInfosRepository = stubMongoose(mongoose.Model);
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
        const result = chance.pickset(baseCards, chance.integer({ min: 1, max: 5 }));

        return {
            id: chance.integer({ min: 1 }),
            betwin: chance.integer({ min: 1 }),
            amount: chance.integer({ min: 1 }),
            totalTurns: result.length,
            turnEndTime: new Date(),
            nextAmounts: { h: chance.floating({ min: 1, length: 2 }), l: chance.floating({ min: 1, length: 2 }) },
            result,
        };
    };

    const generatePlayer = (playerName) => {
        return { UID: `${playerName}UID`, session: {}, profile: { name: playerName } };
    };

    beforeEach(() => {
        // Arrange
        jest.clearAllMocks();

        consumer = new InGameConsumer(definition, gameData, roundQuery, publisher, getBalance, userInfosRepository);
        player = generatePlayer("player1");
    });

    it("always inherit Core.BaseEventConsumers.InGameConsumer", () => {
        // Assert
        expect(consumer instanceof Core.BaseEventConsumers.InGameConsumer);
    });

    describe("buildPayload", () => {
        describe("when player not have existing bet", () => {
            const testCases = [{ ingame: { player1: { betTracks: undefined } } }, { ingame: {} }];

            it.each(testCases)("should return empty ownBets", async (testCase) => {
                // Arrange
                gameData.ingame = testCase.ingame;

                // Act
                const actualValue = await consumer.buildPayload(player);

                // Assert
                expect(actualValue.ownBets).toBeEmpty();
            });
        });

        describe("when player have existing bet", () => {
            it("should return ownBets with values", async () => {
                // Arrange
                gameData.ingame = { player1: { betTracks: generateBetTrack() } };

                // Act
                const actualValue = await consumer.buildPayload(player);

                // Assert
                expect(actualValue.ownBets).not.toBeEmpty();
            });

            it("should return bet track amount", async () => {
                // Arrange
                const playerBet = generateBetTrack();
                gameData.ingame = { player1: { betTracks: playerBet } };

                // Act
                const actualValue = await consumer.buildPayload(player);

                // Assert
                expect(actualValue.ownBets.amount).toBe(playerBet.amount);
            });

            it("should return bet track betwin", async () => {
                // Arrange
                const playerBet = generateBetTrack();
                gameData.ingame = { player1: { betTracks: playerBet } };

                // Act
                const actualValue = await consumer.buildPayload(player);

                // Assert
                expect(actualValue.ownBets.betwin).toBe(playerBet.betwin);
            });

            it("should return bet track totalTurns", async () => {
                // Arrange
                const playerBet = generateBetTrack();
                gameData.ingame = { player1: { betTracks: playerBet } };

                // Act
                const actualValue = await consumer.buildPayload(player);

                // Assert
                expect(actualValue.ownBets.totalTurns).toBe(playerBet.totalTurns);
            });

            it("should return bet track nextAmounts", async () => {
                // Arrange
                const playerBet = generateBetTrack();
                gameData.ingame = { player1: { betTracks: playerBet } };

                // Act
                const actualValue = await consumer.buildPayload(player);

                // Assert
                expect(actualValue.ownBets.nextAmounts).toBe(playerBet.nextAmounts);
            });

            it("should return remainingTime in seconds", async () => {
                // Arrange
                const playerBet = generateBetTrack();
                gameData.ingame = { player1: { betTracks: playerBet } };
                const expectedRemainingTime = (playerBet.turnEndTime - new Date()) / 1000;

                // Act
                const actualValue = await consumer.buildPayload(player);

                // Assert
                expect(actualValue.ownBets.remainingTime).toBeLessThanOrEqual(expectedRemainingTime);
            });
        });
    });
});
