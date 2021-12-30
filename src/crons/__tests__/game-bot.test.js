import { Table } from 'sc-game-base';
import { GameBot } from '../index';
import mongoose from 'mongoose';
import { stubMongooseModelStupidly } from 'jest-micro-auto-stub';

describe('game-bot', () => {
    describe('extends', () => {
        it('inherit Table.Crons.TableGameBot', () => {
            // act
            const cron = new GameBot({});

            //assert
            expect(cron instanceof Table.Crons.TableGameBot);
        });
    });

    describe('placeBet', () => {
        it('when bot already played in time should not create new round', async () => {
            // arrange
            const gameData = { exchangeRates: { exId: 1 }, gameConfigs: { minbet: 10 } };
            const roundsRepository = stubMongooseModelStupidly(mongoose.Model);
            const cron = new GameBot({}, gameData, null, null, null, roundsRepository);
            const bot = { id: 2, name: 'bot2', hasPlayed: true };

            // act
            await cron.placeBet(bot);

            //assert
            expect(roundsRepository.create).not.toHaveBeenCalled();
        });

        const testCases = [{ lastRound: null }, { lastRound: { id: 0 } }, { lastRound: { id: 10 } }];
        it.each(testCases)('should create new round', async (testCase) => {
            // arrange
            const gameData = { exchangeRates: { exId: 1 }, gameConfigs: { minbet: 10 } };
            const roundsRepository = stubMongooseModelStupidly(mongoose.Model);
            roundsRepository.findOne().lean().exec.mockReturnValueOnce(testCase.lastRound);
            const cron = new GameBot({}, gameData, null, null, null, roundsRepository);
            const bot = { id: 2, name: 'bot2', hasPlayed: false };

            // act
            await cron.placeBet(bot);

            //assert
            expect(roundsRepository.create).toHaveBeenCalled();
        });
    });

    describe('resetBot', () => {
        it('should reset played value', () => {
            // arrange
            const cron = new GameBot();
            const bot = { id: 2, name: 'bot2', hasPlayed: true };

            // act
            cron.resetBot(bot);

            //assert
            expect(bot.hasPlayed).toBeFalsy();
        });
    });
});
