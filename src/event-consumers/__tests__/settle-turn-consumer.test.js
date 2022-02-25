import { baseCards } from "../../cards";
import { SettleTurnConsumer } from "../index";
import mongoose from "mongoose";
import { stubMongoose, stub } from "jest-micro-auto-stub";
import { UserBetResultPublisher } from "sc-game-base/src/core/event-publishers";
import { SettleGameRoundConsumer } from "sc-game-base/src/core/event-consumers";
import gameSettings from "../../game-settings";
import { player1, odds } from "../../__tests__/test-data";
import { advanceTo } from "jest-date-mock";

jest.mock("../../helpers/deck-helper", () => {
    return {
        drawCard: () => {
            return { rank: "10", suit: 2 };
        },
    };
});

describe("SettleTurnConsumer", () => {
    const betLogsRepository = stubMongoose(mongoose.Model);
    const userBetResultPublisher = stub(UserBetResultPublisher);
    const settleGameRoundConsumer = stub(SettleGameRoundConsumer);

    let consumer;
    let gameData = { gameConfigs: { odds } };
    const mockDate = new Date();

    beforeEach(() => {
        // Arrange
        advanceTo(mockDate);

        consumer = new SettleTurnConsumer({ gameData, betLogsRepository, userBetResultPublisher, settleGameRoundConsumer });
    });

    describe("generateResult", () => {
        describe("when resultFromAdmin is set for user", () => {
            describe("turnOrder < resultFromAdmin.length", () => {
                it("should return resultFromAdmin", () => {
                    // Arrange
                    gameData.settlementResultFromAdmin = { player: [{ rank: "8" }, { rank: "3" }] };
                    const expectedValue = { rank: "3" };
                    const runningRound = { name: "player", id: 10, result: [], totalTurns: 0 };

                    // Act
                    const actualValue = consumer.generateResult(runningRound);

                    // Assert
                    expect(actualValue.rank).toStrictEqual(expectedValue.rank);
                });
            });

            describe("turnOrder >= resultFromAdmin.length", () => {
                it("should return result from drawCard function", () => {
                    // Arrange
                    gameData.settlementResultFromAdmin = { player: [{ rank: "8" }] };
                    const runningRound = { name: "player", id: 10, result: [], totalTurns: 0 };
                    const expectedValue = { rank: "10", suit: 2 };

                    // Act
                    const actualValue = consumer.generateResult(runningRound);

                    // Assert
                    expect(actualValue).toStrictEqual(expectedValue);
                });
            });
        });

        describe("when resultFromAdmin is not set for user", () => {
            const testCases = [{ settlementResultFromAdmin: null }, { settlementResultFromAdmin: { player: [{ rank: "2" }] } }];
            it.each(testCases)("should generate new result", (testCase) => {
                // Arrange
                gameData.settlementResultFromAdmin = testCase.settlementResultFromAdmin;
                const expectedValue = { rank: "10", suit: 2 };
                const runningRound = { name: "player01", id: 11, result: [...baseCards], totalTurns: 3 };

                // Act
                const actualValue = consumer.generateResult(runningRound);

                // Assert
                expect(actualValue).toStrictEqual(expectedValue);
            });
        });
    });

    describe("getSettlementResult", () => {
        describe("when result is low", () => {
            // Arrange
            const testCases = [
                { resultCard: { rank: "4" }, currentCard: { rank: "A" } },
                { resultCard: { rank: "2" }, currentCard: { rank: "A" } },
                { resultCard: { rank: "2" }, currentCard: { rank: "3" } },
                { resultCard: { rank: "4" }, currentCard: { rank: "5" } },
            ];

            it.each(testCases)("should return l", (testCase) => {
                // Arrange
                const expectedValue = "l";

                // Act
                const actualValue = consumer.getSettlementResult(testCase.currentCard, testCase.resultCard);

                // Assert
                expect(actualValue).toStrictEqual(expectedValue);
            });
        });

        describe("when result is high", () => {
            // Arrange
            const testCases = [
                { resultCard: { rank: "A" }, currentCard: { rank: "2" } },
                { resultCard: { rank: "A" }, currentCard: { rank: "3" } },
                { resultCard: { rank: "3" }, currentCard: { rank: "2" } },
                { resultCard: { rank: "4" }, currentCard: { rank: "3" } },
            ];

            it.each(testCases)("should return h", (testCase) => {
                // Arrange
                const expectedValue = "h";

                // Act
                const actualValue = consumer.getSettlementResult(testCase.currentCard, testCase.resultCard);

                // Assert
                expect(actualValue).toStrictEqual(expectedValue);
            });
        });

        describe("when result is tie", () => {
            // Arrange
            const testCases = [{ resultCard: { rank: "4" }, currentCard: { rank: "4" }, expectedValue: "t" }];

            it.each(testCases)("should return t", (testCase) => {
                // Arrange
                const expectedValue = "t";

                // Act
                const actualValue = consumer.getSettlementResult(testCase.currentCard, testCase.resultCard);

                // Assert
                expect(actualValue).toStrictEqual(expectedValue);
            });
        });
    });

    describe("insertBetLog", () => {
        it("should call betLogsRepository.create", async () => {
            // Arrange
            consumer.gameData = {
                realPlayers: { [player1.profile.name]: { uid: player1.UID, session: {} } },
                exchangeRates: { code: [] },
            };
            const runningRound = {
                uid: player1.UID,
                name: player1.profile.name,
                id: 10,
                totalTurns: 3,
                betwin: 1,
                result: [{ rank: "4", suit: 0 }],

                memberId: 1,
                siteId: 2,
                partnerId: 3,
                currency: "AUD",
                rate: 4,
            };

            const turnResult = { betwin: 10, result: [{ rank: "5", suit: 0 }] };
            const expectedLog = {
                uid: player1.UID,
                name: player1.profile.name,
                roundId: 10,

                time: mockDate,
                amount: 1,
                betwin: 10,
                choice: "h",

                memberId: 1,
                siteId: 2,
                partnerId: 3,
                currency: "AUD",
                rate: 4,

                order: 4,
                cards: [
                    { rank: "4", suit: 0 },
                    { rank: "5", suit: 0 },
                ],
            };

            // Act
            await consumer.insertBetLog(runningRound, "h", turnResult);

            // Assert
            expect(betLogsRepository.create).toBeCalledWith(expectedLog);
        });
    });

    describe("isLose", () => {
        describe("when lose", () => {
            // Arrange
            const testCases = [
                { resultCard: { rank: "4" }, currentCard: { rank: "5" }, choice: "h", expectedValue: true },
                { resultCard: { rank: "4" }, currentCard: { rank: "3" }, choice: "l", expectedValue: true },
            ];

            it.each(testCases)("should return true", (testCase) => {
                // Act
                const actualValue = consumer.isLose(testCase.choice, testCase.currentCard, testCase.resultCard);

                // Assert
                expect(actualValue).toBeTruthy();
            });
        });

        describe("when win", () => {
            // Arrange
            const testCases = [
                { resultCard: { rank: "A" }, currentCard: { rank: "4" }, choice: "h", expectedValue: false },
                { resultCard: { rank: "4" }, currentCard: { rank: "3" }, choice: "h", expectedValue: false },
                { resultCard: { rank: "2" }, currentCard: { rank: "4" }, choice: "l", expectedValue: false },
                { resultCard: { rank: "4" }, currentCard: { rank: "5" }, choice: "l", expectedValue: false },
            ];

            it.each(testCases)("should return false", (testCase) => {
                // Act
                const actualValue = consumer.isLose(testCase.choice, testCase.currentCard, testCase.resultCard);

                // Assert
                expect(actualValue).toBeFalsy();
            });
        });
        describe("when tie", () => {
            // Arrange
            const testCases = [
                { resultCard: { rank: "4" }, currentCard: { rank: "4" }, choice: "h", expectedValue: false },
                { resultCard: { rank: "4" }, currentCard: { rank: "4" }, choice: "l", expectedValue: false },
            ];

            it.each(testCases)("should return false", (testCase) => {
                // Act
                const actualValue = consumer.isLose(testCase.choice, testCase.currentCard, testCase.resultCard);

                // Assert
                expect(actualValue).toBeFalsy();
            });
        });
    });

    describe("settleTurn", () => {
        let player;
        let roundsRepositoryUpdate = { exec: jest.fn() };

        beforeEach(() => {
            // Arrange
            consumer.gameData = {
                ingame: {
                    [player1.profile.name]: {
                        betTracks: { id: 10, settlementResult: [], name: player1.profile.name, totalTurns: 0, betwin: 1 },
                    },
                },
                settlementResultFromAdmin: { [player1.profile.name]: [{ rank: "8" }] },
                gameConfigs: { odds },
            };

            consumer.roundsRepository = {
                updateOne: () => {
                    return roundsRepositoryUpdate;
                },
            };

            spyOn(consumer, "insertBetLog");
            spyOn(consumer.settleGameRoundConsumer, "settleBets");
            spyOn(consumer, "generateResult").and.returnValue({ rank: "8", suit: 0 });

            player = { uid: player1.UID, name: player1.profile.name };
        });

        describe("when lose", () => {
            it("should call settleGameRoundConsumer.settleBets", async () => {
                // Arrange
                consumer.gameData.ingame[player1.profile.name].betTracks.result = [{ rank: "10", suit: 3 }];
                const payload = { betChoice: "h" };

                // Act
                await consumer.settleTurn(player, payload);

                // Assert
                expect(consumer.settleGameRoundConsumer.settleBets).toHaveBeenCalledWith(player1.profile.name);
            });
        });

        describe("when win", () => {
            it("should update running round info from turn result to game data", async () => {
                // Arrange
                consumer.gameData.ingame[player1.profile.name].betTracks.result = [{ rank: "4", suit: 3 }];
                const payload = { betChoice: "h" };
                const expectedValue = { betwin: 1.16, nextAmounts: { h: 2.05, l: 2.05 } };

                // Act
                await consumer.settleTurn(player, payload);

                // Assert
                expect(consumer.gameData.ingame[player1.profile.name].betTracks).toStrictEqual(expect.objectContaining(expectedValue));
            });
        });

        describe("always", () => {
            beforeEach(async () => {
                // Arrange
                consumer.gameData.ingame[player1.profile.name].betTracks.result = [{ rank: "4", suit: 3 }];
                const payload = { betChoice: "l" };

                // Act
                await consumer.settleTurn(player, payload);
            });

            it("should add new bet log", async () => {
                // Arrange
                const expectedTurnResult = {
                    betwin: 0,
                    isLose: true,
                    nextAmounts: null,
                    remainingTime: gameSettings.durations.turnTime,
                    result: [
                        { rank: "4", suit: 3 },
                        { rank: "8", suit: 0 },
                    ],
                    settlementResult: ["h"],
                    totalTurns: 1,
                    turnTime: mockDate,
                    turnEndTime: new Date(mockDate.getTime() + gameSettings.durations.turnTime * 1000),
                };
                const expectedRunningRound = {
                    betwin: 1,
                    id: 10,
                    name: player1.profile.name,
                    result: [{ rank: "4", suit: 3 }],
                    settlementResult: [],
                    totalTurns: 0,
                    turnResult: expectedTurnResult,
                };

                // Assert
                expect(consumer.insertBetLog).toHaveBeenCalledWith(expectedRunningRound, "l", expectedTurnResult);
            });

            it("call roundsRepository.updateOne", async () => {
                // Assert
                expect(roundsRepositoryUpdate.exec).toHaveBeenCalled();
            });

            it("should call userBetResultPublisher.publishToUser", async () => {
                // Arrange
                const endDealData = {
                    endDeal: 1,
                    result: {
                        roundId: 10,
                        betwin: 0,
                        result: [
                            { rank: "4", suit: 3 },
                            { rank: "8", suit: 0 },
                        ],
                        settlementResult: ["h"],
                        remainingTime: gameSettings.durations.turnTime,
                        nextAmounts: null,
                        totalTurns: 1,
                    },
                };

                // Assert
                expect(consumer.userBetResultPublisher.publishToUser).toHaveBeenCalledWith(player1.UID, endDealData);
            });
        });
    });

    describe("calculateTurnResult", () => {
        let runningRound;
        let payload;

        beforeEach(() => {
            runningRound = { totalTurns: 3, betwin: 1, result: [{ rank: "7", suit: 0 }], settlementResult: [] };
            payload = { betChoice: "h" };
        });

        it("always return latest settlement result", async () => {});

        it("always return latest result card", async () => {});

        it("always return total turns += 1", async () => {});

        it("always return remainingTime as duration settings", async () => {});

        describe("when lose", () => {
            it("always return betwin = 0", async () => {});

            it("should return next amounts = null", async () => {
                // Arrange
                spyOn(consumer, "generateResult").and.returnValue({ rank: "6", suit: 0 });

                // Act
                const actualValue = await consumer.calculateTurnResult(payload, runningRound);

                // Assert
                expect(actualValue.nextAmounts).toBeNull();
            });
        });

        describe("when win", () => {
            //TODO next amounts always = bet win amount * odds [when win or tie]
            //TODO bet win always = current amount * odds
            it("should return next amounts = odds * betwin", async () => {
                // Arrange
                spyOn(consumer, "generateResult").and.returnValue({ rank: "9", suit: 0 });
                const expectedValue = { h: 2.5, l: 1.96 };

                // Act
                const actualValue = await consumer.calculateTurnResult(payload, runningRound);

                // Assert
                expect(actualValue.nextAmounts).toStrictEqual(expectedValue);
            });
        });

        describe("when tie", () => {
            //TODO betwin always == curernt amount
            it("should return betwin = current amount and next amounts = odds * current amount", async () => {
                // Arrange
                spyOn(consumer, "generateResult").and.returnValue({ rank: "7", suit: 0 });
                const expectedValue = {
                    betwin: 1,
                    nextAmounts: { h: 1.38, l: 1.76 },
                };

                // Act
                const actualValue = await consumer.calculateTurnResult(payload, runningRound);

                // Assert
                expect(actualValue).toStrictEqual(expect.objectContaining(expectedValue));
            });
        });
    });
});
