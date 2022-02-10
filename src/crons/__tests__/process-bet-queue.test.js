import { Core } from "sc-game-base";
import mongoose from "mongoose";
import { stubMongooseModelStupidly } from "jest-micro-auto-stub";
import { ProcessBetQueue } from "../index";
import gameSettings from "../../game-settings";

describe("process-bet-queue", () => {
    let cron;
    beforeEach(() => {
        // Arrange
        cron = new ProcessBetQueue({});
    });

    describe("extends", () => {
        it("inherit Core.Crons.ProcessBetQueue", () => {
            // Assert
            expect(cron instanceof Core.Crons.ProcessBetQueue);
        });
    });

    describe("deal", () => {
        describe("when not have running round", () => {
            it("should not call settleTurnConsumer.settleTurn", async () => {
                // Arrange
                cron.settleTurnConsumer = { settleTurn: jest.fn() };
                cron.gameData = { ingame: { m1: { betTracks: null } } };
                cron.placeBetPublisher = { publishToUser: jest.fn() };
                const player = { session: {}, profile: { name: "m1" } };

                // Act
                await cron.deal(player);

                // Assert
                expect(cron.settleTurnConsumer.settleTurn).not.toBeCalled();
            });
        });

        describe("when bet order is mismatch", () => {
            it("should not call settleTurnConsumer.settleTurn", async () => {
                // Arrange
                cron.settleTurnConsumer = { settleTurn: jest.fn() };
                cron.gameData = { ingame: { m1: { betTracks: { m1: { totalTurns: 3 } } } } };
                cron.placeBetPublisher = { publishToUser: jest.fn() };
                const player = { UID: "m1", session: {}, profile: { name: "m1" } };
                const bet = { order: 2 };

                // Act
                await cron.deal(player, bet);

                // Assert
                expect(cron.settleTurnConsumer.settleTurn).not.toBeCalled();
            });
        });

        describe("when all info correct", () => {
            it("should call settleTurnConsumer.settleTurn", async () => {
                // Arrange
                cron.settleTurnConsumer = { settleTurn: jest.fn() };
                cron.settleTurnConsumer.settleTurn.mockReturnValueOnce({});
                cron.gameData = { ingame: { m1: { betTracks: { totalTurns: 3 } } } };
                cron.placeBetPublisher = { publishToUser: jest.fn() };
                const player = { UID: "m1", session: {}, profile: { name: "m1" } };
                const bet = { order: 3 };

                // Act
                await cron.deal(player, bet);

                // Assert
                expect(cron.settleTurnConsumer.settleTurn).toBeCalled();
            });
        });
    });

    describe("proceedBet", () => {
        describe("when deal", () => {
            it("should call deal function", async () => {
                // Arrange
                cron.settleGameRoundConsumer = { settleBets: jest.fn() };
                cron.gameData = { ingame: { m1: { betTracks: {} } } };
                cron.deal = jest.fn();
                const player = { session: {}, profile: {} };
                const payload = { action: gameSettings.actions.deal };

                // Act
                await cron.proceedBet(player, payload);

                // Assert
                expect(cron.deal).toBeCalled();
            });
        });

        describe("when collect", () => {
            it("should call settleGameRoundConsumer.collect function", async () => {
                // Arrange
                cron.settleGameRoundConsumer = { collect: jest.fn() };
                cron.gameData = { ingame: { m1: { betTracks: {} } } };
                cron.deal = jest.fn();
                const player = { session: {}, profile: {} };
                const payload = { action: gameSettings.actions.collect };

                // Act
                await cron.proceedBet(player, payload);

                // Assert
                expect(cron.settleGameRoundConsumer.collect).toBeCalled();
            });
        });

        describe("when bet", () => {
            it("should call super proceedBet function", async () => {
                // Arrange
                cron.settleGameRoundConsumer = { settleBets: jest.fn() };
                cron.gameData = { ingame: { m1: { betTracks: {} } } };
                spyOn(cron, "formatApiBetInfo");
                spyOn(cron, "validateBetRequest").and.returnValue(false);
                const player = { session: {}, profile: {} };
                const payload = { action: gameSettings.actions.bet };

                // Act
                await cron.proceedBet(player, payload);

                // Assert
                expect(cron.formatApiBetInfo).toBeCalled();
            });
        });
    });

    describe("composeValidationCriteria", () => {
        describe("when composeBalanceValidationCriteria return null", () => {
            it("should return correct validation result", async () => {
                // Arrange
                cron.definition = { choicesMapper: {} };
                cron.composeBalanceValidationCriteria = jest.fn();
                cron.composeBalanceValidationCriteria.mockReturnValueOnce(null);

                const player = { session: {} };
                const payload = {};

                // Act
                const actualValue = await cron.composeValidationCriteria(player, payload);

                // Assert
                expect(actualValue).toStrictEqual([]);
            });
        });

        describe("when composeBalanceValidationCriteria return not null", () => {
            it("should return correct validation result", async () => {
                // Arrange
                cron.definition = { choicesMapper: {} };
                cron.composeBalanceValidationCriteria = jest.fn();
                cron.composeBalanceValidationCriteria.mockReturnValueOnce({ failed: true });

                const player = { session: {} };
                const payload = {};

                // Act
                const actualValue = await cron.composeValidationCriteria(player, payload);

                // Assert
                expect(actualValue).toStrictEqual({ failed: true });
            });
        });
    });

    describe("decreaseBetTracks", () => {
        it("should do nothing", () => {
            // Arrange
            cron.gameData = { ingame: { m1: { betTracks: { amount: 10 } } } };
            const playerName = "m1";

            // Act
            cron.decreaseBetTracks(playerName);

            // Assert
            expect(cron.gameData.ingame["m1"].betTracks).toStrictEqual({ amount: 10 });
        });
    });

    describe("upsertBet", () => {
        const testCases = [{ session: {} }, { session: null }];
        it.each(testCases)("should call roundsRepository.updateOne", async (testCase) => {
            // Arrange
            cron.definition = { choicesMapper: {}, durations: {} };
            cron.gameData = { exchangeRates: {}, ingame: { m1: { betTracks: {} } }, gameConfigs: { odds: {} }, roundId: 10 };
            cron.roundsRepository = stubMongooseModelStupidly(mongoose.Model);
            spyOn(cron, "generateFirstCard").and.returnValue({ rank: "3" });

            const player = { UID: "m1", session: testCase.session, profile: { name: "m1" } };
            const roundId = 1;
            const bet = {};
            const rate = 1;

            // Act
            await cron.upsertBet(player, roundId, bet, rate);

            // Assert
            expect(cron.roundsRepository.updateOne).toHaveBeenCalled();
        });
    });

    describe("generateFirstCard", () => {
        describe("when not have result from admin", () => {
            const testCases = [
                { settlementResultFromAdmin: null },
                { settlementResultFromAdmin: {} },
                { settlementResultFromAdmin: { player: [] } },
            ];
            it.each(testCases)("should return random", (testCase) => {
                // Arrange
                cron.gameData = { settlementResultFromAdmin: testCase.settlementResultFromAdmin };
                const name = "player";

                // Act
                const actualValue = cron.generateFirstCard(name);

                // Assert
                expect(actualValue).not.toBeNull();
            });
        });

        describe("when have result from admin", () => {
            it("should return from that", () => {
                // Arrange
                cron.gameData = { settlementResultFromAdmin: { player: [{ rank: "3" }] } };
                const name = "player";

                // Act
                const actualValue = cron.generateFirstCard(name);

                // Assert
                expect(actualValue.rank).toBe("3");
            });
        });
    });

    describe("generatePlacingBetResult", () => {
        describe("when not have betTracks", () => {
            it("should return end bet wih own bets info has undefined values", () => {
                // Arrange
                cron.gameData = { ingame: {} };
                const player = { profile: { name: "m1" } };
                const balance = {};
                const bet = { amount: 10 };
                const expectedValue = {
                    endBet: 10,
                    ownBets: {
                        roundId: undefined,
                        result: undefined,
                        totalTurns: 0,
                        remainingTime: 122,
                        nextAmounts: undefined,
                    },
                    user: {},
                };

                // Act
                const actualValue = cron.generatePlacingBetResult(player, balance, bet);

                // Assert
                expect(actualValue).toStrictEqual(expectedValue);
            });
        });

        describe("when have betTracks", () => {
            it("should return end bet wih own bets info has values", () => {
                // Arrange
                cron.gameData = { ingame: { m1: { betTracks: { id: 3, result: [], nextAmounts: { h: 100, l: 150 } } } } };
                const player = { profile: { name: "m1" } };
                const balance = {};
                const bet = { amount: 10 };
                const expectedValue = {
                    endBet: 10,
                    ownBets: {
                        roundId: 3,
                        result: [],
                        totalTurns: 0,
                        remainingTime: 122,
                        nextAmounts: { h: 100, l: 150 },
                    },
                    user: {},
                };

                // Act
                const actualValue = cron.generatePlacingBetResult(player, balance, bet);

                // Assert
                expect(actualValue).toStrictEqual(expectedValue);
            });
        });
    });

    describe("handleSuccessBet", () => {
        describe("always", () => {
            it("should upsertBet", async () => {
                // Arrange
                cron.gameData = { gameConfigs: { odds: {} }, ingame: { m1: { betTracks: { result: [{ rank: 3 }] } } } };
                cron.settleTurnConsumer = { calculateWinAmounts: jest.fn() };
                spyOn(cron, "calculateCurrencyRate");
                spyOn(cron, "upsertBet");
                spyOn(cron, "notifyPlacingBetResult");
                const player = { profile: { name: "m1" } };

                // Act
                await cron.handleSuccessBet(player);

                // Assert
                expect(cron.upsertBet).toHaveBeenCalled();
            });
        });
    });
});
