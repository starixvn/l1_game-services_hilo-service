import { Table } from 'sc-game-base';
import { GameCron } from '../index';
import mongoose from 'mongoose';
import { stubMongooseModelStupidly } from 'jest-micro-auto-stub';

const bot = { resetInRoomTrackings: jest.fn() };
const roundsRepository = stubMongooseModelStupidly(mongoose.Model);
const archiveStatusesRepository = stubMongooseModelStupidly(mongoose.Model);
const gameConfigsRepository = stubMongooseModelStupidly(mongoose.Model);
const notificationRepository = stubMongooseModelStupidly(mongoose.Model);
const exchangeRatesRepository = stubMongooseModelStupidly(mongoose.Model);
const currencyGroupGamesRepository = stubMongooseModelStupidly(mongoose.Model);
const partnerConfigRepository = stubMongooseModelStupidly(mongoose.Model);
const currencyGroupRepository = stubMongooseModelStupidly(mongoose.Model);
const currencyRepository = stubMongooseModelStupidly(mongoose.Model);

describe('game-cron', () => {
    // arrange
    const definition = { durations: { wholeRound: 120 }, choices: ['hi', 'lo'] };

    describe('extends', () => {
        it('inherit Table.Crons.TableGameCron', () => {
            // act
            const cron = new GameCron({ definition });

            //assert
            expect(cron instanceof Table.Crons.TableGameCron);
        });
    });

    describe('start', () => {
        // arrange
        const processCorruptedBetsConsumer = { consume: jest.fn() };
        const gameData = {};
        const cron = new GameCron({
            definition,
            gameData,
            processCorruptedBetsConsumer,
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
        });

        it('should processCorruptedBetsConsumer', async () => {
            // act
            await cron.start();

            //assert
            expect(processCorruptedBetsConsumer.consume).toHaveBeenCalled();
        });

        const testCases = [
            { lastRound: null, expectedValue: 10 },
            { lastRound: { phien: 10 }, expectedValue: 11 },
        ];
        it.each(testCases)('should assign round id', async (testCase) => {
            // arrange
            roundsRepository.findOne().lean().exec.mockReturnValue(testCase.lastRound);
            spyOn(cron, 'getLastArchiveRound').and.returnValue(10);

            // act
            await cron.start();

            //assert
            expect(gameData.roundId).toStrictEqual(testCase.expectedValue);
        });
    });

    describe('proceed', () => {
        it('always processRunningRounds', async () => {
            // arrange
            const gameData = { ingame: {} };
            const cron = new GameCron({ definition, gameData });
            spyOn(cron, 'processRunningRounds');

            // act
            await cron.proceed();

            //assert
            expect(cron.processRunningRounds).toHaveBeenCalled();
        });
    });

    describe('processRunningRounds', () => {
        it('should settle correct turns', async () => {
            // arrange
            const dt = new Date();
            const expiredTime = new Date(dt.getTime() - 120000);
            const runningRounds = {
                m1: { turnEndTime: expiredTime, uid: 'm1', totalTurns: 0 },
                m2: { turnEndTime: expiredTime, uid: 'm2', totalTurns: 1 },
                m3: { turnEndTime: new Date(dt.getTime() + 20000), uid: 'm3' },
            };
            const realPlayers = { m1: { UID: 'm1' }, m2: { UID: 'm2' } };
            const gameData = { runningRounds, realPlayers };
            const settleGameRoundConsumer = { settleTurn: jest.fn() };
            const collectConsumer = { consume: jest.fn() };
            const cron = new GameCron({ definition, gameData, settleGameRoundConsumer, collectConsumer });

            // act
            await cron.processRunningRounds();

            //assert
            expect(cron.settleGameRoundConsumer.settleTurn).toHaveBeenCalledWith('m1', expect.any(Object));
            expect(collectConsumer.consume).toHaveBeenCalled();
            expect(cron.settleGameRoundConsumer.settleTurn).not.toHaveBeenCalledWith('m3', expect.any(Object));
        });
    });

    describe('autoChooseChoice', () => {
        it('difference of frequency of choice not too high', () => {
            // arrange
            const cron = new GameCron({ definition });
            const choiceCounts = { hi: 0, lo: 0 };
            const testCount = 1000;

            // act
            for (let i = 0; i < testCount; i++) {
                const choice = cron.autoChooseChoice();
                choiceCounts[choice]++;
            }

            //assert
            expect(Math.abs(choiceCounts.hi / testCount - 0.5) <= 0.05).toBeTruthy();
            expect(Math.abs(choiceCounts.lo / testCount - 0.5) <= 0.05).toBeTruthy();
        });
    });

    describe('resetForNewRound', () => {
        it('should do nothing', () => {
            // arrange
            const gameData = { ingame: { m1: { betTracks: { newGameChoice: 10 } } }, settlementResultFromAdmin: { 10: {} } };
            const cron = new GameCron({ gameData });

            // act
            cron.resetForNewRound();

            //assert
            expect(gameData.ingame.m1).not.toBeNull();
            expect(gameData.settlementResultFromAdmin['10']).not.toBeNull();
        });
    });
});
