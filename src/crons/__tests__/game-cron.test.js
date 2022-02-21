import { Core } from "sc-game-base";
import { GameCron } from "../index";
import mongoose from "mongoose";
import { stubMongooseModelStupidly, stub } from "jest-micro-auto-stub";
import { choiceNames } from "../../game-settings";
import { SettleTurnConsumer, CollectConsumer } from "../../event-consumers";
import { SettleGameRoundConsumer } from "sc-game-base/src/core/event-consumers";
import { GameStatusPublisher } from "sc-game-base/src/core/event-publishers";
import { player1 } from "../../__tests__/test-data";

const bot = { resetInRoomTrackings: jest.fn(), reset: jest.fn(), run: jest.fn() };
const roundsRepository = stubMongooseModelStupidly(mongoose.Model);
const archiveStatusesRepository = stubMongooseModelStupidly(mongoose.Model);
const gameConfigsRepository = stubMongooseModelStupidly(mongoose.Model);
const notificationRepository = stubMongooseModelStupidly(mongoose.Model);
const exchangeRatesRepository = stubMongooseModelStupidly(mongoose.Model);
const currencyGroupGamesRepository = stubMongooseModelStupidly(mongoose.Model);
const partnerConfigRepository = stubMongooseModelStupidly(mongoose.Model);
const currencyGroupRepository = stubMongooseModelStupidly(mongoose.Model);
const currencyRepository = stubMongooseModelStupidly(mongoose.Model);
const settleTurnConsumer = stub(SettleTurnConsumer);
const collectConsumer = stub(CollectConsumer);
const settleGameRoundConsumer = stub(SettleGameRoundConsumer);
const gameStatusPublisher = stub(GameStatusPublisher);

describe("game-cron", () => {
    const definition = { durations: { wholeRound: 120, placingBets: 40 }, choices: ["hi", "lo"] };
    let cron;
    beforeEach(() => {
        // Arrange
        cron = new GameCron({
            definition,
            bot,
            roundsRepository,
            archiveStatusesRepository,
            gameConfigsRepository,
            notificationRepository,
            exchangeRatesRepository,
            currencyGroupGamesRepository,
            partnerConfigRepository,
            currencyGroupRepository,
            currencyRepository,
            settleTurnConsumer,
            collectConsumer,
            settleGameRoundConsumer,
            gameStatusPublisher,
        });
    });

    describe("extends", () => {
        it("inherit Core.Crons.BaseGameCron", () => {
            // Assert
            expect(cron instanceof Core.Crons.BaseGameCron);
        });
    });

    describe("start", () => {
        const testCases = [
            { lastRound: null, expectedValue: 10 },
            { lastRound: { id: 10 }, expectedValue: 11 },
        ];
        it.each(testCases)("should proceed Unsettled Bets", async (testCase) => {
            // Arrange
            cron.gameData = { ingame: { m1: { betTracks: {} } } };
            roundsRepository.find().lean().exec.mockReturnValue([]);

            roundsRepository.findOne().lean().exec.mockReturnValue(testCase.lastRound);
            spyOn(cron, "getLastArchiveRound").and.returnValue(10);
            spyOn(cron, "proceedUnsettledBets");

            // Act
            await cron.start();

            // Assert
            expect(cron.proceedUnsettledBets).toHaveBeenCalled();
        });
    });

    describe("proceed", () => {
        describe("when game disabled", () => {
            it("should not process running rounds", async () => {
                // Arrange
                cron.gameData = { ingame: {}, remainingTime: 120, disabled: true };
                spyOn(cron, "processRunningRounds");

                // Act
                await cron.proceed();

                // Assert
                expect(cron.processRunningRounds).not.toHaveBeenCalled();
            });
        });

        describe("when game enabled", () => {
            it("should process running rounds", async () => {
                // Arrange
                cron.gameData = { ingame: {}, remainingTime: 118, disabled: false };
                spyOn(cron, "processRunningRounds");

                // Act
                await cron.proceed();

                // Assert
                expect(cron.processRunningRounds).toHaveBeenCalled();
            });
        });

        describe("when remainingTime is wholeRound", () => {
            it("should checkGameStatus", async () => {
                // Arrange
                cron.gameData = { ingame: {}, remainingTime: 120 };
                spyOn(cron, "checkGameStatus");

                // Act
                await cron.proceed();

                // Assert
                expect(cron.checkGameStatus).toHaveBeenCalled();
            });
        });

        describe("when is Starting Time", () => {
            it("should call bot.reset", async () => {
                // Arrange
                cron.gameData = { ingame: {}, remainingTime: 40, disabled: true };

                // Act
                await cron.proceed();

                // Assert
                expect(bot.reset).toHaveBeenCalled();
            });
        });

        describe("when remainingTime < 0", () => {
            it("should reset remainingTime", async () => {
                // Arrange
                cron.gameData = { ingame: {}, remainingTime: -1, disabled: false };

                // Act
                await cron.proceed();

                // Assert
                expect(cron.gameData.remainingTime).toBe(definition.durations.wholeRound);
            });
        });

        describe("when remainingTime < placingBets", () => {
            it("should call bot.run", async () => {
                // Arrange
                cron.gameData = { ingame: {}, remainingTime: 39, disabled: false };

                // Act
                await cron.proceed();

                // Assert
                expect(bot.run).toHaveBeenCalled();
            });
        });
    });

    describe("processRunningRounds", () => {
        beforeEach(async () => {
            // Arrange
            const realPlayers = { m1: { UID: "m1" }, m2: { UID: "m2" } };
            const dt = new Date();
            const expiredTime = new Date(dt.getTime() - 120000);
            cron.gameData = {
                ingame: {
                    m1: { betTracks: { turnEndTime: expiredTime, uid: "m1", totalTurns: 0, name: "m1", result: [{ rank: 3 }] } },
                    m2: { betTracks: { turnEndTime: expiredTime, uid: "m2", totalTurns: 1, name: "m2" }, result: [{ rank: 3 }] },
                    m3: { betTracks: { turnEndTime: new Date(dt.getTime() + 20000), uid: "m3", name: "m3", result: [{ rank: 3 }] } },
                    m4: {},
                },
                realPlayers,
            };

            // Act
            await cron.processRunningRounds();
        });

        it("should settle correct turns", async () => {
            // Assert
            expect(cron.settleTurnConsumer.settleTurn).toHaveBeenCalledWith(expect.objectContaining({ name: "m1" }), expect.any(Object));
        });

        it("should collect correct turns", async () => {
            // Assert
            expect(cron.collectConsumer.consume).toHaveBeenCalledWith({ UID: "m2", profile: { name: "m2" } });
        });

        it("should settle correct turns", async () => {
            // Assert
            expect(cron.settleTurnConsumer.settleTurn).not.toHaveBeenCalledWith(
                expect.objectContaining({ name: "m3" }),
                expect.any(Object)
            );
        });
    });

    describe("autoChooseChoice", () => {
        it("difference of choice frequency not too high", () => {
            // Arrange
            const choiceCounts = { hi: 0, lo: 0 };
            const testCount = 1000;
            const round = { result: [{ rank: 3 }] };

            // Act
            for (let i = 0; i < testCount; i++) {
                const choice = cron.autoChooseChoice(round);
                choiceCounts[choice]++;
            }

            // Assert
            expect(Math.abs(choiceCounts.hi / testCount - 0.5) <= 0.05 && Math.abs(choiceCounts.lo / testCount - 0.5) <= 0.05).toBeTruthy();
        });

        describe("when current card is Ace", () => {
            it("should return low", () => {
                // Arrange
                const round = { result: [{ rank: "A" }] };

                // Act
                const actualValue = cron.autoChooseChoice(round);

                // Assert
                expect(actualValue).toBe(choiceNames.l);
            });
        });

        describe("when current card is Two", () => {
            it("should return high", () => {
                // Arrange
                const round = { result: [{ rank: "2" }] };

                // Act
                const actualValue = cron.autoChooseChoice(round);

                // Assert
                expect(actualValue).toBe(choiceNames.h);
            });
        });
    });

    describe("proceedUnsettledBets", () => {
        it("should call collectConsumer.consume", async () => {
            // Arrange
            cron.gameData = { ingame: { m1: { betTracks: { name: "m1" } } } };
            const rounds = [
                { totalTurns: 0, uid: "m1" },
                { totalTurns: 1, uid: "m2" },
            ];
            roundsRepository.find().lean().exec.mockReturnValue(rounds);

            // Act
            await cron.proceedUnsettledBets();

            // Assert
            expect(cron.settleGameRoundConsumer.settleBets).toHaveBeenCalledWith("m1");
        });
    });

    describe("enableGame", () => {
        describe("when player doesn't complete turn 1 yet", () => {
            beforeEach(() => {
                // Arrange
                cron.gameData = {
                    ingame: { [player1.profile.name]: { betTracks: { name: player1.profile.name, totalTurns: 0, amount: 10 } } },
                };
            });

            it("should set bet.amount to turn result", async () => {
                // Arrange
                const expectedTurnResult = { isLose: false, betwin: 10 };

                // Act
                await cron.enableGame();

                // Assert
                expect(cron.gameData.ingame[player1.profile.name].betTracks.turnResult).toStrictEqual(expectedTurnResult);
            });

            it("should settleBets for that player", async () => {
                // Act
                await cron.enableGame();

                // Assert
                expect(cron.settleGameRoundConsumer.settleBets).toHaveBeenCalledWith(player1.profile.name);
            });
        });

        describe("when player already finish 1st turn and continue to next turn", () => {
            beforeEach(() => {
                // Arrange
                cron.gameData = {
                    ingame: {
                        [player1.profile.name]: { betTracks: { name: player1.profile.name, totalTurns: 1, amount: 10, betwin: 20 } },
                    },
                };
            });

            it("should set bet.betwin to turn result", async () => {
                // Arrange
                const expectedTurnResult = { isLose: false, betwin: 20 };

                // Act
                await cron.enableGame();

                // Assert
                expect(cron.gameData.ingame[player1.profile.name].betTracks.turnResult).toStrictEqual(expectedTurnResult);
            });

            it("should settleBets for that player", async () => {
                // Act
                await cron.enableGame();

                // Assert
                expect(cron.settleGameRoundConsumer.settleBets).toHaveBeenCalledWith(player1.profile.name);
            });
        });

        describe("when player not have play game yet", () => {
            it("should not call settleBets for that player", async () => {
                // Arrange
                const name = "playerName2";
                cron.gameData = {
                    ingame: { name: { betTracks: {} } },
                };

                // Act
                await cron.enableGame();

                // Assert
                expect(cron.settleGameRoundConsumer.settleBets).not.toHaveBeenCalledWith(name);
            });
        });
    });
});
