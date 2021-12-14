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

        it('when past 120s should checkGameStatus', async () => {
            // arrange
            const gameData = { remainingTime: 120 };
            const cron = new GameCron({ definition, gameData });
            spyOn(cron, 'processRunningRounds');
            spyOn(cron, 'checkGameStatus');

            // act
            await cron.proceed();

            //assert
            expect(cron.checkGameStatus).toHaveBeenCalled();
        });

        it('when not past 120s should not checkGameStatus', async () => {
            // arrange
            const gameData = { remainingTime: 110 };
            const cron = new GameCron({ definition, gameData });
            spyOn(cron, 'processRunningRounds');
            spyOn(cron, 'checkGameStatus');

            // act
            await cron.proceed();

            //assert
            expect(cron.checkGameStatus).not.toHaveBeenCalled();
        });

        it('when game disabled should not reduce remainingTime', async () => {
            // arrange
            const gameData = { remainingTime: 110, disabled: true };
            const cron = new GameCron({ definition, gameData });
            spyOn(cron, 'processRunningRounds');
            spyOn(cron, 'checkGameStatus');
            const expectedValue = 110;

            // act
            await cron.proceed();

            //assert
            expect(cron.gameData.remainingTime).toBe(expectedValue);
        });

        it('when game not disabled should reduce remainingTime', async () => {
            // arrange
            const gameData = { remainingTime: 110, disabled: false };
            const cron = new GameCron({ definition, gameData });
            spyOn(cron, 'processRunningRounds');
            spyOn(cron, 'checkGameStatus');
            const expectedValue = 109;

            // act
            await cron.proceed();

            //assert
            expect(cron.gameData.remainingTime).toBe(expectedValue);
        });

        it('when remainingTime < 0 should set remainingTime=wholeRound', async () => {
            // arrange
            const gameData = { remainingTime: -1, disabled: false };
            const cron = new GameCron({ definition, gameData });
            spyOn(cron, 'processRunningRounds');
            spyOn(cron, 'checkGameStatus');
            const expectedValue = 120;

            // act
            await cron.proceed();

            //assert
            expect(cron.gameData.remainingTime).toBe(expectedValue);
        });
    });

    describe('processRunningRounds', () => {
        it('should an non round of correct player', async () => {
            // arrange
            const runningRounds = { m1: { anNon: true, uid: 'm1' }, m2: { anNon: true, uid: 'm2' } };
            const realPlayers = { m1: { UID: 'm1' }, m2: { UID: 'm2' } };
            const gameData = { runningRounds, realPlayers };
            const settleGameRoundConsumer = { anNon: jest.fn() };
            const cron = new GameCron({ definition, gameData, settleGameRoundConsumer });

            // act
            await cron.processRunningRounds();

            //assert
            expect(cron.settleGameRoundConsumer.anNon).toHaveBeenCalledWith(expect.objectContaining({ UID: 'm1' }));
            expect(cron.settleGameRoundConsumer.anNon).toHaveBeenCalledWith(expect.objectContaining({ UID: 'm2' }));
        });

        it('should an non round of correct player', async () => {
            // arrange
            const expiredTime = new Date() - 200000;
            const runningRounds = {
                m1: { subRoundTime: expiredTime, uid: 'm1' },
                m2: { subRoundTime: expiredTime, uid: 'm2' },
                m3: { subRoundTime: new Date(), uid: 'm3' },
            };
            const realPlayers = { m1: { UID: 'm1' }, m2: { UID: 'm2' } };
            const gameData = { runningRounds, realPlayers };
            const settleGameRoundConsumer = { settleSubRound: jest.fn() };
            const cron = new GameCron({ definition, gameData, settleGameRoundConsumer });

            // act
            await cron.processRunningRounds();

            //assert
            expect(cron.settleGameRoundConsumer.settleSubRound).toHaveBeenCalledWith(
                expect.objectContaining({ UID: 'm1' }),
                expect.any(Object)
            );
            expect(cron.settleGameRoundConsumer.settleSubRound).toHaveBeenCalledWith(
                expect.objectContaining({ UID: 'm2' }),
                expect.any(Object)
            );
        });
    });

    describe('isExpiredRound', () => {
        // arrange
        const testCases = [
            { round: { subRoundTime: new Date() }, expectedValue: false },
            { round: { subRoundTime: new Date() - 200000 }, expectedValue: true },
        ];

        it.each(testCases)('should return correct value', (testCase) => {
            // arrange
            const cron = new GameCron({ definition });

            // act
            const actualValue = cron.isExpiredRound(testCase.round);

            //assert
            expect(actualValue).toBe(testCase.expectedValue);
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
