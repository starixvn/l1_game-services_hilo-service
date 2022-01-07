import { Table } from 'sc-game-base';
import mongoose from 'mongoose';
import { stubMongooseModelStupidly } from 'jest-micro-auto-stub';
import { ProcessBetQueue } from '../index';

describe('process-bet-queue', () => {
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
            { amount: null, freeBet: null, lastRound: null, expectedValue: 1 },
            { amount: 10, freeBet: true, lastRound: { phien: 10 }, expectedValue: 11 },
        ];

        it.each(testCases)('should assign round id', async (testCase) => {
            // arrange
            const definition = { choicesMapper: {} };
            const betsRepository = stubMongooseModelStupidly(mongoose.Model);
            betsRepository.findOne().lean().exec.mockReturnValueOnce(testCase.lastRound);
            const placeBetPublisher = { publishGameFailedBet: jest.fn() };
            const baseMetrics = { collectBetProcessedTime: jest.fn() };
            const cron = new ProcessBetQueue({ definition, betsRepository, placeBetPublisher, baseMetrics });
            const player = { session: {}, profile: {} };
            const payload = { ...testCase };
            spyOn(cron, 'composeValidationCriteria').and.returnValue([]);
            spyOn(cron, 'handleSuccessBet');
            cron.placeBet = jest.fn();
            cron.placeBet.mockReturnValueOnce({ response: { notice: {} } });

            // act
            await cron.proceedBet(player, payload);

            //assert
            expect(payload.roundId).toBe(testCase.expectedValue);
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

    describe('decreaseBetTracks', () => {
        it('should do nothing', () => {
            // arrange
            const gameData = { ingame: { m1: { betTracks: { newGameChoice: 10 } } } };
            const cron = new ProcessBetQueue({ gameData });
            const playerName = 'm1';

            // act
            cron.decreaseBetTracks(playerName);

            //assert
            expect(gameData.ingame['m1'].betTracks).toStrictEqual({ newGameChoice: 10 });
        });
    });

    describe('upsertBet', () => {
        const testCases = [{ session: {} }, { session: null }];
        it.each(testCases)('should call betsRepository.updateOne', async (testCase) => {
            // arrange
            const definition = { choicesMapper: {}, durations: {} };
            const gameData = { exchangeRates: {}, runningRounds: {}, gameConfigs: { odds: {} } };
            const betsRepository = stubMongooseModelStupidly(mongoose.Model);
            const cron = new ProcessBetQueue({ definition, gameData, betsRepository });

            const player = { UID: 'm1', session: testCase.session, profile: {} };
            const roundId = 1;
            const bet = {};
            const rate = 1;

            // act
            await cron.upsertBet(player, roundId, bet, rate);

            //assert
            expect(betsRepository.updateOne).toHaveBeenCalled();
        });
    });

    describe('insertBetLog', () => {
        it('should do nothing', async () => {
            // arrange
            const betLogsRepository = stubMongooseModelStupidly(mongoose.Model);
            const cron = new ProcessBetQueue({ betLogsRepository });

            // act
            await cron.insertBetLog();

            //assert
            expect(betLogsRepository.create).not.toBeCalled();
        });
    });

    describe('generatePlacingBetResult', () => {
        it('should have runningRound', async () => {
            // arrange
            const definition = { choicesMapper: {} };
            const gameData = {
                runningRounds: { m1: { result: [{ rank: 0 }], odds: { h: 0, l: 0 } } },
                players: {},
                ingame: {},
                chips: [],
                gameConfigs: {},
            };

            const cron = new ProcessBetQueue({ definition, gameData });
            const expectedValue = { result: [{ rank: 0 }], odds: { h: 0, l: 0 } };

            const player = { UID: 'm1', session: {}, profile: {} };
            const balance = 1;
            const roundId = 2;
            const rate = 3;

            // act
            const actualValue = await cron.generatePlacingBetResult(player, balance, roundId, rate);

            //assert
            expect(actualValue.runningRound).toStrictEqual(expectedValue);
        });
    });

    describe('adjustTotalBets', () => {
        it('should do nothing', () => {
            // arrange
            const gameData = { totalBets: {} };
            const cron = new ProcessBetQueue({});
            const bet = {};
            const expectedValue = { ...gameData };

            // act
            cron.adjustTotalBets(null, bet);

            //assert
            expect(gameData).toStrictEqual(expectedValue);
        });
    });
});
