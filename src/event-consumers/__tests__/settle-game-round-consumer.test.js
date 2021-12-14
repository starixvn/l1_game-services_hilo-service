import { Core } from 'sc-game-base';
import mongoose from 'mongoose';
import { stubMongooseModelStupidly } from 'jest-micro-auto-stub';
import baseCards from '../../constants/cards';
import { SettleGameRoundConsumer } from '../index';

const stepModel = {
    called: false,
};

jest.mock('../../models', () => {
    return {
        StepModel: {
            create: () => {
                stepModel.called = true;
            },
        },
    };
});

describe('settle-game-round-consumer', () => {
    describe('extends', () => {
        it('inherit Core.BaseEventConsumers.SettleGameRoundConsumer', () => {
            // act
            const consumer = new SettleGameRoundConsumer({});

            //assert
            expect(consumer instanceof Core.BaseEventConsumers.SettleGameRoundConsumer);
        });
    });

    describe('generateResult', () => {
        it('when resultFromAdmin is set for round should return resultFromAdmin', () => {
            // arrange
            const gameData = { settlementResultFromAdmin: { roundId: 10, result: { card: 2 } } };
            const consumer = new SettleGameRoundConsumer({ gameData });
            const expectedValue = { card: 2 };
            const runningRound = { id: 10 };

            // act
            const actualValue = consumer.generateResult(runningRound);

            //assert
            expect(actualValue).toStrictEqual(expectedValue);
        });

        it('when resultFromAdmin is not set for round should generate new result', () => {
            // arrange
            const gameData = { settlementResultFromAdmin: { roundId: 10, result: { card: 2 } } };
            const consumer = new SettleGameRoundConsumer({ gameData });
            const expectedValue = null;
            const runningRound = { id: 11, cards: baseCards };

            // act
            const actualValue = consumer.generateResult(runningRound);

            //assert
            expect(actualValue).toStrictEqual(expectedValue);
        });
    });

    describe('calculateBetResult', () => {
        it('when not win should return correct value', () => {
            // arrange
            const gameData = {};
            const consumer = new SettleGameRoundConsumer({ gameData });
            const settlementResult = { isWin: false, betWin: 0 };
            const bet = { newGameChoice: 10 };
            const expectedValue = {
                isWin: false,
                betWin: 0,
                totalBetAmount: 10,
                netWin: 0,
                totalWin: '0.00',
                totalLost: 10,
            };

            // act
            const actualValue = consumer.calculateBetResult(settlementResult, bet);

            //assert
            expect(actualValue).toStrictEqual(expectedValue);
        });

        it('when win should return correct value', () => {
            // arrange
            const gameData = {};
            const consumer = new SettleGameRoundConsumer({ gameData });
            const settlementResult = { isWin: true, betWin: 20 };
            const bet = { newGameChoice: 10 };
            const expectedValue = {
                isWin: true,
                betWin: 20,
                totalBetAmount: 10,
                netWin: '10.00',
                totalWin: '20.00',
                totalLost: 0,
            };

            // act
            const actualValue = consumer.calculateBetResult(settlementResult, bet);

            //assert
            expect(actualValue).toStrictEqual(expectedValue);
        });
    });

    describe('settleSubRound', () => {
        it('when an non runningRound should return runningRound', async () => {
            // arrange
            const gameData = { runningRounds: { m1: { anNon: true } } };
            const consumer = new SettleGameRoundConsumer({ gameData });
            const player = { UID: 'm1' };
            const payload = {};
            const expectedValue = { anNon: true };

            // act
            const actualValue = await consumer.settleSubRound(player, payload);

            //assert
            expect(actualValue).toStrictEqual(expectedValue);
        });

        const testCases = [
            {
                previousCards: [
                    { card: 0, type: 0 },
                    { card: 0, type: 1 },
                    { card: 0, type: 2 },
                    { card: 0, type: 3 },
                    { card: 1, type: 0 },
                    { card: 1, type: 1 },
                    { card: 1, type: 2 },
                    { card: 1, type: 3 },
                    { card: 2, type: 3 },
                ],
                betChoice: 'hi',
            },
            {
                previousCards: [
                    { card: 0, type: 0 },
                    { card: 0, type: 1 },
                    { card: 0, type: 2 },
                    { card: 0, type: 3 },
                    { card: 1, type: 0 },
                    { card: 1, type: 1 },
                    { card: 1, type: 2 },
                    { card: 1, type: 3 },
                    { card: 2, type: 3 },
                ],
                betChoice: 'lo',
            },
        ];
        it.each(testCases)('when not an non runningRound should add new step', async (testCase) => {
            // arrange
            const gameData = {
                runningRounds: {
                    m1: { anNon: false, cards: testCase.previousCards, id: 10, result: [], settlementResult: [] },
                },
                settlementResultFromAdmin: {},
                gameConfigs: { odds: {} },
            };
            const consumer = new SettleGameRoundConsumer({ gameData });
            const player = { UID: 'm1' };
            const payload = { betChoice: testCase.betChoice };
            spyOn(consumer, 'addStep');
            spyOn(consumer, 'settleMainRound');

            // act
            await consumer.settleSubRound(player, payload);

            //assert
            expect(consumer.addStep).toHaveBeenCalled();
        });
    });

    describe('addStep', () => {
        it('should call StepModel.create', async () => {
            // arrange
            stepModel.called = false;
            const gameData = {};
            const consumer = new SettleGameRoundConsumer({ gameData });
            const runningRound = { stepCount: 3 };

            // act
            await consumer.addStep(runningRound);

            //assert
            expect(stepModel.called).toBeTruthy();
        });
    });

    describe('settleMainRound', () => {
        it('should call settleBets', async () => {
            // arrange
            const gameData = {};
            const roundsRepository = {
                updateOne: () => {
                    return { exec: jest.fn() };
                },
            };

            const consumer = new SettleGameRoundConsumer({ gameData, roundsRepository });
            const runningRound = { stepCount: 3 };
            spyOn(consumer, 'settleBets');

            // act
            await consumer.settleMainRound(runningRound, {});

            //assert
            expect(consumer.settleBets).toHaveBeenCalled();
        });
    });

    describe('anNon', () => {
        it('should call settleBets', async () => {
            // arrange
            const gameData = { runningRounds: { m1: {} } };
            const roundsRepository = {
                updateOne: () => {
                    return { exec: jest.fn() };
                },
            };

            const consumer = new SettleGameRoundConsumer({ gameData, roundsRepository });
            const player = { UID: 'm1' };
            spyOn(consumer, 'settleBets');

            // act
            await consumer.anNon(player);

            //assert
            expect(consumer.settleBets).toHaveBeenCalled();
        });
    });
});
