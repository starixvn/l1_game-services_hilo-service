import { Table } from 'sc-game-base';
import { GameCron } from '../index';

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

    describe('proceed', () => {
        it('always processRunningRounds', async () => {
            // arrange
            const gameData = {};
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
            const expiredTime = new Date() - 200000;
            const runningRounds = {
                m1: { turnTime: expiredTime, uid: 'm1', totalTurns: 1 },
                m2: { turnTime: expiredTime, uid: 'm2', totalTurns: 0 },
                m3: { turnTime: new Date(), uid: 'm3' },
            };
            const realPlayers = { m1: { UID: 'm1' }, m2: { UID: 'm2' } };
            const gameData = { runningRounds, realPlayers };
            const settleGameRoundConsumer = { settleTurn: jest.fn(), collect: jest.fn() };
            const cron = new GameCron({ definition, gameData, settleGameRoundConsumer });

            // act
            await cron.processRunningRounds();

            //assert
            expect(cron.settleGameRoundConsumer.settleTurn).toHaveBeenCalledWith('m1', expect.any(Object));
            expect(cron.settleGameRoundConsumer.settleTurn).toHaveBeenCalledWith('m2', expect.any(Object));
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
});
