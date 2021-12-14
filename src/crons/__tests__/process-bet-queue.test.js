import { Table } from 'sc-game-base';
import mongoose from 'mongoose';
import { stubMongooseModelStupidly } from 'jest-micro-auto-stub';
import { ProcessBetQueue } from '../index';

describe('game-cron', () => {
    describe('extends', () => {
        it('inherit Table.Crons.TableGameCron', () => {
            // act
            const cron = new ProcessBetQueue({});

            //assert
            expect(cron instanceof Table.Crons.TableProcessBetQueue);
        });
    });

    describe('proceedBet', () => {
        // arrange
        const testCases = [
            { amount: null, freeBet: null },
            { amount: 10, freeBet: true },
        ];

        it.each(testCases)('should assign round id', async (testCase) => {
            // arrange
            const definition = { choicesMapper: {} };
            const roundsRepository = stubMongooseModelStupidly(mongoose.Model);
            roundsRepository.findOne().lean().exec.mockReturnValueOnce({ id: 10 });
            const placeBetPublisher = { publishGameFailedBet: jest.fn() };
            const baseMetrics = { collectBetProcessedTime: jest.fn() };
            const cron = new ProcessBetQueue({ definition, roundsRepository, placeBetPublisher, baseMetrics });
            const player = { session: {}, profile: {} };
            const payload = { ...testCase };
            const expectedValue = 11;
            spyOn(cron, 'composeValidationCriteria').and.returnValue([]);
            cron.placeBet = jest.fn();
            cron.placeBet.mockReturnValueOnce({ response: { notice: {} } });

            // act
            await cron.proceedBet(player, payload);

            //assert
            expect(payload.roundId).toBe(expectedValue);
        });
    });

    describe('composeValidationCriteria', () => {
        it('when composeBalanceValidationCriteria return null should return correct validation result', async () => {
            // arrange
            const definition = { choicesMapper: {} };
            const cron = new ProcessBetQueue({ definition });

            cron.composeBalanceValidationCriteria = jest.fn();
            cron.composeBalanceValidationCriteria.mockReturnValueOnce(null);

            const player = { session: {} };
            const payload = {};

            // act
            const actualValue = await cron.composeValidationCriteria(player, payload);

            //assert
            expect(actualValue).toStrictEqual([]);
        });

        it('when composeBalanceValidationCriteria return not null should return correct validation result', async () => {
            // arrange
            const definition = { choicesMapper: {} };
            const cron = new ProcessBetQueue({ definition });

            cron.composeBalanceValidationCriteria = jest.fn();
            cron.composeBalanceValidationCriteria.mockReturnValueOnce({ failed: true });

            const player = { session: {} };
            const payload = {};

            // act
            const actualValue = await cron.composeValidationCriteria(player, payload);

            //assert
            expect(actualValue).toStrictEqual({ failed: true });
        });
    });

    describe('handleSuccessBet', () => {
        it('should createNewRound', async () => {
            // arrange
            const definition = { choicesMapper: {} };
            const gameData = { gameConfigs: {}, ingame: {}, players: {} };
            const betsRepository = stubMongooseModelStupidly(mongoose.Model);
            const placeBetPublisher = { publishSuccessBet: jest.fn() };
            const cron = new ProcessBetQueue({ definition, gameData, betsRepository, placeBetPublisher });
            cron.createNewRound = jest.fn();
            spyOn(cron, 'calculateCurrencyRate');
            spyOn(cron, 'generatePlacingBetResult');

            const player = { session: {}, profile: {} };
            const balance = 1;
            const roundId = 1;
            const bet = {};

            // act
            await cron.handleSuccessBet(player, balance, roundId, bet);

            //assert
            expect(cron.createNewRound).toHaveBeenCalled();
        });
    });

    describe('generatePlacingBetResult', () => {
        it('should have odds', async () => {
            // arrange
            const definition = { choicesMapper: {} };
            const gameData = {
                runningRounds: { m1: { cards: [{ card: 0 }] } },
                players: {},
                ingame: {},
                chips: [],
                gameConfigs: {},
            };

            const cron = new ProcessBetQueue({ definition, gameData });
            const expectedValue = { hi: 0, lo: 0 };

            const player = { UID: 'm1', session: {}, profile: {} };
            const balance = 1;
            const roundId = 2;
            const rate = 3;

            // act
            const actualValue = await cron.generatePlacingBetResult(player, balance, roundId, rate);

            //assert
            expect(actualValue.odds).toStrictEqual(expectedValue);
        });
    });

    describe('createNewRound', () => {
        it('should call roundsRepository.create', async () => {
            // arrange
            const definition = { choicesMapper: {} };
            const gameData = { exchangeRates: {}, runningRounds: {} };
            const roundsRepository = stubMongooseModelStupidly(mongoose.Model);
            const cron = new ProcessBetQueue({ definition, gameData, roundsRepository });

            const player = { UID: 'm1', session: {}, profile: {} };
            const payload = {};

            // act
            await cron.createNewRound(player, payload);

            //assert
            expect(roundsRepository.create).toHaveBeenCalled();
        });
    });
});
