import { Core } from "sc-game-base";
import mongoose from "mongoose";
import { stubMongoose, stub } from "jest-micro-auto-stub";
import { ProcessBetQueue } from "../index";
import gameSettings from "../../game-settings";
import { player1 } from "../../__tests__/test-data";
import { SettleTurnConsumer, SettleGameRoundConsumer } from "../../event-consumers";
import { PlaceBetPublisher } from "sc-game-base/src/core/event-publishers";
import { helpers, logger } from "sc-common";

describe("ProcessBetQueue", () => {
    let mockDate = new Date();
    let cron;
    let settleTurnConsumer;
    let settleGameRoundConsumer;
    let placeBetPublisher;

    beforeEach(() => {
        // Arrange
        jest.spyOn(global, "Date").mockImplementation(() => mockDate);
        settleTurnConsumer = stub(SettleTurnConsumer);
        settleGameRoundConsumer = stub(SettleGameRoundConsumer);
        placeBetPublisher = stub(PlaceBetPublisher);
        const roundsRepository = stubMongoose(mongoose.Model);

        const definition = stub(Core.GameDefinition);
        const gameData = stub(Core.GameData);
        const placeBet = jest.fn();
        const logService = stub(logger);
        const betsRepository = stubMongoose(mongoose.Model);
        const betLogsRepository = stubMongoose(mongoose.Model);
        const userInfosRepository = stubMongoose(mongoose.Model);
        const baseMetrics = stub(Core.BaseMetrics);

        cron = new ProcessBetQueue({
            definition,
            gameData,
            placeBetPublisher,
            placeBet,
            logService,
            betsRepository,
            betLogsRepository,
            userInfosRepository,
            baseMetrics,
            roundsRepository,
            settleGameRoundConsumer,
            settleTurnConsumer,
        });
    });

    it("inherit Core.Crons.ProcessBetQueue", () => {
        // Assert
        expect(cron instanceof Core.Crons.ProcessBetQueue);
    });

    describe("deal", () => {
        describe("when not have running round", () => {
            beforeEach(() => {
                // Arrange
                cron.gameData = { ingame: { [player1.profile.name]: { betTracks: null } } };
            });

            it("should call placeBetPublisher.publishToUser", async () => {
                // Act
                await cron.deal(player1);

                // Assert
                expect(placeBetPublisher.publishToUser).toBeCalledWith(player1.UID, {
                    endDeal: -1,
                    notice: { errorCode: helpers.noticeHelper.invalidBet },
                });
            });

            it("should not call settleTurnConsumer.settleTurn", async () => {
                // Act
                await cron.deal(player1);

                // Assert
                expect(cron.settleTurnConsumer.settleTurn).not.toBeCalled();
            });
        });

        describe("when bet order is mismatch", () => {
            let bet;
            beforeEach(() => {
                // Arrange
                cron.gameData = { ingame: { [player1.profile.name]: { betTracks: { [player1.UID]: { totalTurns: 3 } } } } };
                bet = { order: 2 };
            });

            it("should call placeBetPublisher.publishToUser", async () => {
                // Act
                await cron.deal(player1, bet);

                // Assert
                expect(placeBetPublisher.publishToUser).toBeCalledWith(player1.UID, {
                    endDeal: -1,
                    notice: { errorCode: helpers.noticeHelper.invalidBet },
                });
            });

            it("should not call settleTurnConsumer.settleTurn", async () => {
                // Act
                await cron.deal(player1, bet);

                // Assert
                expect(cron.settleTurnConsumer.settleTurn).not.toBeCalled();
            });
        });

        describe("when all info correct", () => {
            it("should call settleTurnConsumer.settleTurn", async () => {
                // Arrange
                const runningRound = { id: 1 };
                settleTurnConsumer.settleTurn.mockReturnValueOnce(runningRound);
                cron.gameData = { ingame: { [player1.profile.name]: { betTracks: { uid: player1.UID, totalTurns: 3 } } } };
                const bet = { order: 3 };

                // Act
                await cron.deal(player1, bet);

                // Assert
                expect(settleTurnConsumer.settleTurn).toBeCalledWith({ name: player1.profile.name, uid: player1.UID }, { order: 3 });
            });
        });
    });

    describe("proceedBet", () => {
        describe("when action is deal", () => {
            it("should call deal function", async () => {
                // Arrange
                cron.gameData = { ingame: { [player1.profile.name]: { betTracks: {} } } };
                cron.deal = jest.fn();
                const player = { session: {}, profile: {} };
                const payload = { action: gameSettings.actions.deal, bet: {} };

                // Act
                await cron.proceedBet(player, payload);

                // Assert
                expect(cron.deal).toBeCalledWith(player, payload.bet);
            });
        });

        describe("when action is collect", () => {
            it("should call settleGameRoundConsumer.collect function", async () => {
                // Arrange
                cron.gameData = { ingame: { [player1.profile.name]: { betTracks: {} } } };
                cron.deal = jest.fn();
                const player = { session: {}, profile: {} };
                const payload = { action: gameSettings.actions.collect, bet: {} };

                // Act
                await cron.proceedBet(player, payload);

                // Assert
                expect(settleGameRoundConsumer.collect).toBeCalledWith(player);
            });
        });

        describe("when action is bet", () => {
            it("should call super proceedBet function", async () => {
                // Arrange
                cron.gameData = { ingame: { [player1.profile.name]: { betTracks: {} } } };
                spyOn(cron, "formatApiBetInfo");
                spyOn(cron, "validateBetRequest").and.returnValue(false);
                const player = { session: {}, profile: {} };
                const payload = { action: gameSettings.actions.bet, bet: {} };

                // Act
                await cron.proceedBet(player, payload);

                // Assert
                expect(cron.formatApiBetInfo).toBeCalledWith(payload.bet);
            });
        });
    });

    describe("composeValidationCriteria", () => {
        it("should return combination composeBalanceValidationCriteria and composeBettingTimeValidationCriteria", async () => {
            // Arrange
            cron.definition = { choicesMapper: {} };
            cron.composeBalanceValidationCriteria = jest.fn();
            cron.composeBalanceValidationCriteria.mockReturnValueOnce([{ failed: true, id: 1 }]);
            cron.composeBettingTimeValidationCriteria = jest.fn();
            cron.composeBettingTimeValidationCriteria.mockReturnValueOnce([{ failed: false, id: 2 }]);
            const expectedValue = [
                { failed: false, id: 2 },
                { failed: true, id: 1 },
            ];

            const player = { session: {} };
            const payload = {};

            // Act
            const actualValue = await cron.composeValidationCriteria(player, payload);

            // Assert
            expect(actualValue).toStrictEqual(expectedValue);
        });
    });

    describe("composeBettingTimeValidationCriteria", () => {
        describe("when already have running round", () => {
            it("should return invalidBet criterion with failure = true", () => {
                // Arrange
                cron.gameData = { ingame: { [player1.profile.name]: { betTracks: { uid: player1.UID } } } };

                // Act
                const actualValue = cron.composeBettingTimeValidationCriteria(player1);

                // Assert
                expect(actualValue[0]).toStrictEqual({ failure: true, notice: { errorCode: helpers.noticeHelper.invalidBet } });
            });
        });

        describe("when bet track is empty", () => {
            it("should return invalidBet criterion with failure = false", () => {
                // Arrange
                cron.gameData = { ingame: { [player1.profile.name]: { betTracks: {} } } };

                // Act
                const actualValue = cron.composeBettingTimeValidationCriteria(player1);

                // Assert
                expect(actualValue[0]).toStrictEqual({ failure: false, notice: { errorCode: helpers.noticeHelper.invalidBet } });
            });
        });

        describe("when bet track is null", () => {
            it("should return invalidBet criterion with failure = false", () => {
                // Arrange
                cron.gameData = { ingame: { [player1.profile.name]: { betTracks: null } } };

                // Act
                const actualValue = cron.composeBettingTimeValidationCriteria(player1);

                // Assert
                expect(actualValue[0]).toStrictEqual({ failure: false, notice: { errorCode: helpers.noticeHelper.invalidBet } });
            });
        });
    });

    describe("decreaseBetTracks", () => {
        it("should do nothing", () => {
            // Arrange
            cron.gameData = { ingame: { [player1.profile.name]: { betTracks: { amount: 10 } } } };
            const playerName = player1.profile.name;

            // Act
            cron.decreaseBetTracks(playerName);

            // Assert
            expect(cron.gameData.ingame[player1.profile.name].betTracks).toStrictEqual({ amount: 10 });
        });
    });

    describe("upsertBet", () => {
        describe("when session is null", () => {
            it("should call roundsRepository.updateOne", async () => {
                // Arrange
                cron.definition = { choicesMapper: {}, durations: {} };
                cron.gameData = {
                    exchangeRates: {},
                    ingame: { [player1.profile.name]: { betTracks: {} } },
                    gameConfigs: { odds: {} },
                    roundId: 10,
                };
                spyOn(cron, "generateFirstCard").and.returnValue({ rank: "3" });

                const player = { UID: player1.UID, session: null, profile: { name: player1.profile.name } };
                const roundId = 1;
                const bet = { amount: 10 };
                const rate = 1;

                // Act
                await cron.upsertBet(player, roundId, bet, rate);

                // Assert
                expect(cron.roundsRepository.updateOne).toHaveBeenCalledWith(
                    { id: 1, uid: player1.UID },
                    {
                        $setOnInsert: {
                            amount: 10,
                            betwin: 10,
                            id: 1,
                            name: player1.profile.name,
                            odds: {},
                            rate: 1,
                            result: [{ rank: "3" }],
                            settlementResult: [],
                            time: mockDate,
                            totalTurns: 0,
                            turnEndTime: mockDate,
                            turnTime: mockDate,
                            uid: player1.UID,
                        },
                    },
                    { setDefaultsOnInsert: true, upsert: true }
                );
            });
        });

        describe("when session is not null", () => {
            it("should call roundsRepository.updateOne", async () => {
                // Arrange
                cron.definition = { choicesMapper: {}, durations: {} };
                cron.gameData = {
                    exchangeRates: { exId: 1 },
                    ingame: { [player1.profile.name]: { betTracks: {} } },
                    gameConfigs: { odds: {} },
                    roundId: 10,
                };
                spyOn(cron, "generateFirstCard").and.returnValue({ rank: "3" });

                const player = {
                    UID: player1.UID,
                    session: { currencyName: "AUD", memberId: 2, partnerId: 3, siteId: 4 },
                    profile: { name: player1.profile.name },
                };
                const roundId = 1;
                const bet = { amount: 10 };
                const rate = 1;

                // Act
                await cron.upsertBet(player, roundId, bet, rate);

                // Assert
                expect(cron.roundsRepository.updateOne).toHaveBeenCalledWith(
                    { id: 1, uid: player1.UID },
                    {
                        $setOnInsert: {
                            amount: 10,
                            betwin: 10,
                            currency: "AUD",
                            exchangeRateId: 1,
                            id: 1,
                            memberId: 2,
                            name: player1.profile.name,
                            odds: {},
                            partnerId: 3,
                            rate: 1,
                            result: [{ rank: "3" }],
                            settlementResult: [],
                            siteId: 4,
                            time: mockDate,
                            totalTurns: 0,
                            turnEndTime: mockDate,
                            turnTime: mockDate,
                            uid: player1.UID,
                        },
                    },
                    { setDefaultsOnInsert: true, upsert: true }
                );
            });
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
                cron.gameData = { settlementResultFromAdmin: { [player1.profile.name]: [{ rank: "3" }] } };
                const name = player1.profile.name;

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
                const balance = {};
                const bet = { amount: 10 };
                const expectedValue = {
                    endBet: 10,
                    ownBets: {
                        roundId: undefined,
                        result: undefined,
                        amount: 10,
                        betwin: 10,
                        totalTurns: 0,
                        remainingTime: 121,
                        nextAmounts: undefined,
                    },
                    user: {},
                };

                // Act
                const actualValue = cron.generatePlacingBetResult(player1, balance, bet);

                // Assert
                expect(actualValue).toStrictEqual(expectedValue);
            });
        });

        describe("when have betTracks", () => {
            it("should return end bet wih own bets info has values", () => {
                // Arrange
                cron.gameData = {
                    ingame: { [player1.profile.name]: { betTracks: { id: 3, result: [], nextAmounts: { h: 100, l: 150 } } } },
                };
                const balance = {};
                const bet = { amount: 10 };
                const expectedValue = {
                    endBet: 10,
                    ownBets: {
                        roundId: 3,
                        amount: 10,
                        betwin: 10,
                        result: [],
                        totalTurns: 0,
                        remainingTime: 121,
                        nextAmounts: { h: 100, l: 150 },
                    },
                    user: {},
                };

                // Act
                const actualValue = cron.generatePlacingBetResult(player1, balance, bet);

                // Assert
                expect(actualValue).toStrictEqual(expectedValue);
            });
        });
    });

    describe("handleSuccessBet", () => {
        let calculateCurrencyRate;
        beforeEach(() => {
            // Arrange
            cron.gameData = {
                gameConfigs: { odds: {} },
                ingame: { [player1.profile.name]: { betTracks: { roundId: 10, result: [{ rank: 3 }] } } },
            };

            calculateCurrencyRate = 1;
            spyOn(cron, "calculateCurrencyRate").and.returnValue(calculateCurrencyRate);
            spyOn(cron, "upsertBet");
            spyOn(cron, "notifyPlacingBetResult");
            spyOn(cron, "updateUserStakeLevel");
        });

        describe("always", () => {
            it("should upsertBet", async () => {
                // Arrange
                const balance = 20;
                const roundId = 10;
                const bet = {};

                // Act
                await cron.handleSuccessBet(player1, balance, roundId, bet);

                // Assert
                expect(cron.upsertBet).toHaveBeenCalledWith(player1, roundId, bet, calculateCurrencyRate);
            });
        });

        describe("when minBet changed", () => {
            it("should updateUserStakeLevel", async () => {
                // Arrange
                const balance = { minBet: 10, maxBet: 8 };
                const roundId = 10;
                const bet = {};

                // Act
                await cron.handleSuccessBet(player1, balance, roundId, bet);

                // Assert
                expect(cron.updateUserStakeLevel).toHaveBeenCalledWith(player1, 10, 8);
            });
        });
        describe("when maxBet changed", () => {
            it("should updateUserStakeLevel", async () => {
                // Arrange
                const balance = { minBet: 6, maxBet: 20 };
                const roundId = 10;
                const bet = {};

                // Act
                await cron.handleSuccessBet(player1, balance, roundId, bet);

                // Assert
                expect(cron.updateUserStakeLevel).toHaveBeenCalledWith(player1, 6, 20);
            });
        });
        describe("when minBet/maxBet not changed", () => {
            it("should not update User Stake Level", async () => {
                // Arrange
                const balance = { minBet: 6, maxBet: 8 };
                const roundId = 10;
                const bet = {};

                // Act
                await cron.handleSuccessBet(player1, balance, roundId, bet);

                // Assert
                expect(cron.updateUserStakeLevel).not.toHaveBeenCalled();
            });
        });
    });
});
