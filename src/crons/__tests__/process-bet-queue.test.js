import { Core } from "sc-game-base";
import mongoose from "mongoose";
import { stubMongooseModelStupidly } from "jest-micro-auto-stub";
import { ProcessBetQueue } from "../index";
import gameSettings from "../../game-settings";

describe("process-bet-queue", () => {
    describe("extends", () => {
        it("inherit Core.Crons.ProcessBetQueue", () => {
            // act
            const cron = new ProcessBetQueue({});

            // assert
            expect(cron instanceof Core.Crons.ProcessBetQueue);
        });
    });

    describe("deal", () => {
        describe("when not have running round", () => {
            it("should not call settleTurnConsumer.settleTurn", async () => {
                // arrange
                const settleTurnConsumer = { settleTurn: jest.fn() };
                const gameData = { ingame: { m1: { betTracks: null } } };
                const placeBetPublisher = { publishToUser: jest.fn() };
                const cron = new ProcessBetQueue({ settleTurnConsumer, gameData, placeBetPublisher });
                const player = { session: {}, profile: { name: "m1" } };

                // act
                await cron.deal(player);

                // assert
                expect(settleTurnConsumer.settleTurn).not.toBeCalled();
            });
        });

        describe("when bet order is mismatch", () => {
            it("should not call settleTurnConsumer.settleTurn", async () => {
                // arrange
                const settleTurnConsumer = { settleTurn: jest.fn() };
                const gameData = { ingame: { m1: { betTracks: { m1: { totalTurns: 3 } } } } };
                const placeBetPublisher = { publishToUser: jest.fn() };
                const cron = new ProcessBetQueue({ settleTurnConsumer, gameData, placeBetPublisher });
                const player = { UID: "m1", session: {}, profile: { name: "m1" } };
                const bet = { order: 2 };

                // act
                await cron.deal(player, bet);

                // assert
                expect(settleTurnConsumer.settleTurn).not.toBeCalled();
            });
        });

        describe("when all info correct", () => {
            it("should call settleTurnConsumer.settleTurn", async () => {
                // arrange
                const settleTurnConsumer = { settleTurn: jest.fn() };
                settleTurnConsumer.settleTurn.mockReturnValueOnce({});
                const gameData = { ingame: { m1: { betTracks: { totalTurns: 3 } } } };
                const placeBetPublisher = { publishToUser: jest.fn() };
                const cron = new ProcessBetQueue({ settleTurnConsumer, gameData, placeBetPublisher });
                const player = { UID: "m1", session: {}, profile: { name: "m1" } };
                const bet = { order: 3 };

                // act
                await cron.deal(player, bet);

                // assert
                expect(settleTurnConsumer.settleTurn).toBeCalled();
            });
        });
    });

    describe("proceedBet", () => {
        describe("when deal", () => {
            it("should call deal function", async () => {
                // arrange
                const settleGameRoundConsumer = { settleBets: jest.fn() };
                const gameData = { ingame: { m1: { betTracks: {} } } };
                const cron = new ProcessBetQueue({ settleGameRoundConsumer, gameData });
                cron.deal = jest.fn();
                const player = { session: {}, profile: {} };
                const payload = { action: gameSettings.actions.deal };

                // act
                await cron.proceedBet(player, payload);

                // assert
                expect(cron.deal).toBeCalled();
            });
        });

        describe("when collect", () => {
            it("should call settleGameRoundConsumer.collect function", async () => {
                // arrange
                const settleGameRoundConsumer = { collect: jest.fn() };
                const gameData = { ingame: { m1: { betTracks: {} } } };
                const cron = new ProcessBetQueue({ settleGameRoundConsumer, gameData });
                cron.deal = jest.fn();
                const player = { session: {}, profile: {} };
                const payload = { action: gameSettings.actions.collect };

                // act
                await cron.proceedBet(player, payload);

                // assert
                expect(settleGameRoundConsumer.collect).toBeCalled();
            });
        });

        describe("when bet", () => {
            it("should call super proceedBet function", async () => {
                // arrange
                const settleGameRoundConsumer = { settleBets: jest.fn() };
                const gameData = { ingame: { m1: { betTracks: {} } } };
                const cron = new ProcessBetQueue({ settleGameRoundConsumer, gameData });
                spyOn(cron, "formatApiBetInfo");
                spyOn(cron, "validateBetRequest").and.returnValue(false);
                const player = { session: {}, profile: {} };
                const payload = { action: gameSettings.actions.bet };

                // act
                await cron.proceedBet(player, payload);

                // assert
                expect(cron.formatApiBetInfo).toBeCalled();
            });
        });
    });

    describe("composeValidationCriteria", () => {
        describe("when composeBalanceValidationCriteria return null", () => {
            it("should return correct validation result", async () => {
                // arrange
                const definition = { choicesMapper: {} };
                const cron = new ProcessBetQueue({ definition });

                cron.composeBalanceValidationCriteria = jest.fn();
                cron.composeBalanceValidationCriteria.mockReturnValueOnce(null);

                const player = { session: {} };
                const payload = {};

                // act
                const actualValue = await cron.composeValidationCriteria(player, payload);

                // assert
                expect(actualValue).toStrictEqual([]);
            });
        });

        describe("when composeBalanceValidationCriteria return not null", () => {
            it("should return correct validation result", async () => {
                // arrange
                const definition = { choicesMapper: {} };
                const cron = new ProcessBetQueue({ definition });

                cron.composeBalanceValidationCriteria = jest.fn();
                cron.composeBalanceValidationCriteria.mockReturnValueOnce({ failed: true });

                const player = { session: {} };
                const payload = {};

                // act
                const actualValue = await cron.composeValidationCriteria(player, payload);

                // assert
                expect(actualValue).toStrictEqual({ failed: true });
            });
        });
    });

    describe("decreaseBetTracks", () => {
        it("should do nothing", () => {
            // arrange
            const gameData = { ingame: { m1: { betTracks: { amount: 10 } } } };
            const cron = new ProcessBetQueue({ gameData });
            const playerName = "m1";

            // act
            cron.decreaseBetTracks(playerName);

            // assert
            expect(gameData.ingame["m1"].betTracks).toStrictEqual({ amount: 10 });
        });
    });

    describe("upsertBet", () => {
        const testCases = [{ session: {} }, { session: null }];
        it.each(testCases)("should call roundsRepository.updateOne", async (testCase) => {
            // arrange
            const definition = { choicesMapper: {}, durations: {} };
            const gameData = { exchangeRates: {}, ingame: { m1: { betTracks: {} } }, gameConfigs: { odds: {} }, roundId: 10 };
            const roundsRepository = stubMongooseModelStupidly(mongoose.Model);
            const cron = new ProcessBetQueue({ definition, gameData, roundsRepository });
            spyOn(cron, "generateFirstCard").and.returnValue({ rank: "3" });

            const player = { UID: "m1", session: testCase.session, profile: { name: "m1" } };
            const roundId = 1;
            const bet = {};
            const rate = 1;

            // act
            await cron.upsertBet(player, roundId, bet, rate);

            // assert
            expect(roundsRepository.updateOne).toHaveBeenCalled();
        });
    });

    describe("insertBetLog", () => {
        it("should do nothing", async () => {
            // arrange
            const betLogsRepository = stubMongooseModelStupidly(mongoose.Model);
            const cron = new ProcessBetQueue({ betLogsRepository });

            // act
            await cron.insertBetLog();

            // assert
            expect(betLogsRepository.create).not.toBeCalled();
        });
    });

    describe("adjustTotalBets", () => {
        it("should do nothing", () => {
            // arrange
            const gameData = { totalBets: {} };
            const cron = new ProcessBetQueue({});
            const bet = {};
            const expectedValue = { ...gameData };

            // act
            cron.adjustTotalBets(null, bet);

            // assert
            expect(gameData).toStrictEqual(expectedValue);
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
                // arrange
                const gameData = { settlementResultFromAdmin: testCase.settlementResultFromAdmin };
                const cron = new ProcessBetQueue({ gameData });
                const name = "player";

                // act
                const actualValue = cron.generateFirstCard(name);

                // assert
                expect(actualValue).not.toBeNull();
            });
        });

        describe("when have result from admin", () => {
            it("should return from that", () => {
                // arrange
                const gameData = { settlementResultFromAdmin: { player: [{ rank: "3" }] } };
                const cron = new ProcessBetQueue({ gameData });
                const name = "player";

                // act
                const actualValue = cron.generateFirstCard(name);

                // assert
                expect(actualValue.rank).toBe("3");
            });
        });
    });

    describe("generatePlacingBetResult", () => {
        describe("when not have betTracks", () => {
            it("should return end bet wih own bets info has undefined values", () => {
                // arrange
                const gameData = { ingame: {} };
                const cron = new ProcessBetQueue({ gameData });
                const player = { profile: { name: "m1" } };
                const balance = {};
                const bet = { amount: 10 };
                const expectedValue = {
                    endBet: 10,
                    ownBets: {
                        roundId: undefined,
                        result: undefined,
                        remainingTime: 120,
                        nextAmounts: undefined,
                    },
                    user: {},
                };

                // act
                const actualValue = cron.generatePlacingBetResult(player, balance, bet);

                // assert
                expect(actualValue).toStrictEqual(expectedValue);
            });
        });

        describe("when have betTracks", () => {
            it("should return end bet wih own bets info has values", () => {
                // arrange
                const gameData = { ingame: { m1: { betTracks: { id: 3, result: [], nextAmounts: { h: 100, l: 150 } } } } };
                const cron = new ProcessBetQueue({ gameData });
                const player = { profile: { name: "m1" } };
                const balance = {};
                const bet = { amount: 10 };
                const expectedValue = {
                    endBet: 10,
                    ownBets: {
                        roundId: 3,
                        result: [],
                        remainingTime: 120,
                        nextAmounts: { h: 100, l: 150 },
                    },
                    user: {},
                };

                // act
                const actualValue = cron.generatePlacingBetResult(player, balance, bet);

                // assert
                expect(actualValue).toStrictEqual(expectedValue);
            });
        });
    });
});
