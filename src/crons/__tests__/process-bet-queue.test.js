import { Table } from 'sc-game-base';
import mongoose from 'mongoose';
import { stubMongooseModelStupidly } from 'jest-micro-auto-stub';
import { ProcessBetQueue } from '../index';
import gameSettings from '../../game-settings';

describe('process-bet-queue', () => {
    describe('extends', () => {
        it('inherit Table.Crons.TableGameCron', () => {
            // act
            const cron = new ProcessBetQueue({});

            //assert
            expect(cron instanceof Table.Crons.TableProcessBetQueue);
        });
    });

    describe('bet', () => {
        // arrange
        const testCases = [
            { amount: null, freeBet: null, lastRound: null, expectedValue: 10 },
            { amount: 10, freeBet: true, lastRound: { phien: 10 }, expectedValue: 10 },
        ];

        it.each(testCases)('should assign round id', async (testCase) => {
            // arrange
            const definition = { choicesMapper: {} };
            const betsRepository = stubMongooseModelStupidly(mongoose.Model);
            const placeBetPublisher = { publishGameFailedBet: jest.fn() };
            const baseMetrics = { collectBetProcessedTime: jest.fn() };
            const gameData = { roundId: 10 };
            const cron = new ProcessBetQueue({ definition, gameData, betsRepository, placeBetPublisher, baseMetrics });
            const player = { session: {}, profile: {} };
            const payload = { ...testCase };
            spyOn(cron, 'composeValidationCriteria').and.returnValue([]);
            spyOn(cron, 'handleSuccessBet');
            cron.placeBet = jest.fn();
            cron.placeBet.mockReturnValueOnce({ response: { notice: {} } });

            // act
            await cron.bet(player, payload);

            //assert
            expect(payload.roundId).toBe(testCase.expectedValue);
        });
    });

    describe('collect', () => {
        it('when not have running round should not call settleGameRoundConsumer.settleBets', async () => {
            // arrange
            const settleGameRoundConsumer = { settleBets: jest.fn() };
            const gameData = { runningRounds: {} };
            const cron = new ProcessBetQueue({ settleGameRoundConsumer, gameData });
            const player = { session: {}, profile: {} };

            // act
            await cron.collect(player);

            //assert
            expect(settleGameRoundConsumer.settleBets).not.toBeCalled();
        });

        it('when have running round should call settleGameRoundConsumer.settleBets', async () => {
            // arrange
            const settleGameRoundConsumer = { settleBets: jest.fn() };
            const gameData = { runningRounds: { m1: {} } };
            const cron = new ProcessBetQueue({ settleGameRoundConsumer, gameData });
            const player = { UID: 'm1', session: {}, profile: {} };

            // act
            await cron.collect(player);

            //assert
            expect(settleGameRoundConsumer.settleBets).toBeCalled();
        });
    });

    describe('deal', () => {
        it('when not have running round should not call settleGameRoundConsumer.settleTurn', async () => {
            // arrange
            const settleGameRoundConsumer = { settleTurn: jest.fn() };
            const gameData = { runningRounds: {} };
            const cron = new ProcessBetQueue({ settleGameRoundConsumer, gameData });
            const player = { session: {}, profile: {} };

            // act
            await cron.deal(player);

            //assert
            expect(settleGameRoundConsumer.settleTurn).not.toBeCalled();
        });

        it('when bet order is mismatch should not call settleGameRoundConsumer.settleTurn', async () => {
            // arrange
            const settleGameRoundConsumer = { settleTurn: jest.fn() };
            const gameData = { runningRounds: { m1: { totalTurns: 3 } } };
            const cron = new ProcessBetQueue({ settleGameRoundConsumer, gameData });
            const player = { UID: 'm1', session: {}, profile: { name: 'm1' } };
            const bet = { order: 2 };

            // act
            await cron.deal(player, bet);

            //assert
            expect(settleGameRoundConsumer.settleTurn).not.toBeCalled();
        });

        it('when all info correct should call settleGameRoundConsumer.settleTurn', async () => {
            // arrange
            const settleGameRoundConsumer = { settleTurn: jest.fn() };
            const gameData = { runningRounds: { m1: { totalTurns: 3 } } };
            const placeBetPublisher = { publishToUser: jest.fn() };
            const cron = new ProcessBetQueue({ settleGameRoundConsumer, gameData, placeBetPublisher });
            const player = { UID: 'm1', session: {}, profile: { name: 'm1' } };
            const bet = { order: 3 };

            // act
            await cron.deal(player, bet);

            //assert
            expect(settleGameRoundConsumer.settleTurn).toBeCalled();
        });
    });

    describe('proceedBet', () => {
        it('when bet should call bet function', async () => {
            // arrange
            const settleGameRoundConsumer = { settleBets: jest.fn() };
            const gameData = { runningRounds: {} };
            const cron = new ProcessBetQueue({ settleGameRoundConsumer, gameData });
            cron.bet = jest.fn();
            const player = { session: {}, profile: {} };
            const payload = { action: gameSettings.actions.bet };

            // act
            await cron.proceedBet(player, payload);

            //assert
            expect(cron.bet).toBeCalled();
        });

        it('when collect should call collect function', async () => {
            // arrange
            const settleGameRoundConsumer = { settleBets: jest.fn() };
            const gameData = { runningRounds: {} };
            const cron = new ProcessBetQueue({ settleGameRoundConsumer, gameData });
            cron.collect = jest.fn();
            const player = { session: {}, profile: {} };
            const payload = { action: gameSettings.actions.collect };

            // act
            await cron.proceedBet(player, payload);

            //assert
            expect(cron.collect).toBeCalled();
        });

        it('when deal should call deal function', async () => {
            // arrange
            const settleGameRoundConsumer = { settleBets: jest.fn() };
            const gameData = { runningRounds: {} };
            const cron = new ProcessBetQueue({ settleGameRoundConsumer, gameData });
            cron.deal = jest.fn();
            const player = { session: {}, profile: {} };
            const payload = { action: gameSettings.actions.deal };

            // act
            await cron.proceedBet(player, payload);

            //assert
            expect(cron.deal).toBeCalled();
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
            const gameData = { exchangeRates: {}, runningRounds: {}, gameConfigs: { odds: {} }, roundId: 10 };
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
            expect(gameData.roundId).toBe(11);
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
                runningRounds: { m1: { result: [{ rank: 1 }], odds: { h: 0, l: 0 } } },
                players: {},
                ingame: {},
                chips: [],
                gameConfigs: {},
            };

            const cron = new ProcessBetQueue({ definition, gameData });
            const expectedValue = { result: [{ rank: 1 }], odds: { h: 0, l: 0 } };

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
