import { Core } from 'sc-game-base';
import baseCards from '../../constants/cards';
import { SettleGameRoundConsumer } from '../index';
import mongoose from 'mongoose';
import { stubMongooseModelStupidly } from 'jest-micro-auto-stub';

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
            const gameData = { settlementResultFromAdmin: { 10: { result: [{ rank: 2 }] } } };
            const consumer = new SettleGameRoundConsumer({ gameData });
            const expectedValue = { rank: 2 };
            const runningRound = { phien: 10, result: [], totalTurns: 0 };

            // act
            const actualValue = consumer.generateResult(runningRound);

            //assert
            expect(actualValue).toStrictEqual(expectedValue);
        });

        const testCases = [{ settlementResultFromAdmin: null }, { settlementResultFromAdmin: { 10: { result: [{ rank: 2 }] } } }];
        it.each(testCases)('when resultFromAdmin is not set for round should generate new result', (testCase) => {
            // arrange
            const gameData = { settlementResultFromAdmin: testCase.settlementResultFromAdmin };
            const consumer = new SettleGameRoundConsumer({ gameData });
            const expectedValue = null;
            const runningRound = { phien: 11, result: [...baseCards], totalTurns: 3 };

            // act
            const actualValue = consumer.generateResult(runningRound);

            //assert
            expect(actualValue).not.toBe(expectedValue);
        });
    });

    describe('calculateBetResult', () => {
        it('when not win should return correct value', () => {
            // arrange
            const gameData = {};
            const consumer = new SettleGameRoundConsumer({ gameData });
            const settlementResult = { isWin: false, betwin: 0 };
            const bet = { amount: 10 };
            const expectedValue = {
                isWin: false,
                betwin: 0,
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
            const settlementResult = { isWin: true, betwin: 20 };
            const bet = { amount: 10 };
            const expectedValue = {
                isWin: true,
                totalBetAmount: 10,
                netWin: '10.00',
                totalWin: '20.00',
                totalLost: 0,
                betwin: 20,
            };

            // act
            const actualValue = consumer.calculateBetResult(settlementResult, bet);

            //assert
            expect(actualValue).toStrictEqual(expectedValue);
        });
    });

    describe('settleTurn', () => {
        const testCases = [
            {
                previousCards: [{ rank: 2, suit: 3 }],
                betChoice: 'h',
            },
            {
                previousCards: [{ rank: 2, suit: 3 }],
                betChoice: 'l',
            },
        ];
        it.each(testCases)('should add new bet log', async (testCase) => {
            // arrange
            const gameData = {
                runningRounds: {
                    m1: { phien: 10, result: testCase.previousCards, settlementResult: [] },
                },
                settlementResultFromAdmin: { 10: { result: { rank: 1 } } },
                gameConfigs: { odds: {} },
            };

            const betsRepository = {
                updateOne: () => {
                    return { exec: jest.fn() };
                },
            };

            const userBetResultPublisher = { publish: jest.fn() };
            const consumer = new SettleGameRoundConsumer({ gameData, betsRepository, userBetResultPublisher });
            const playerUid = 'm1';
            const payload = { betChoice: testCase.betChoice };
            spyOn(consumer, 'addBetLog');
            spyOn(consumer, 'settleBets');

            // act
            await consumer.settleTurn(playerUid, payload);

            //assert
            expect(consumer.addBetLog).toHaveBeenCalled();
        });
    });

    describe('addBetLog', () => {
        it('should call betLogsRepository.create', async () => {
            // arrange
            const gameData = {
                realPlayers: { m1: { uid: 'm1', session: {} } },
                exchangeRates: { code: [] },
            };
            const betLogsRepository = stubMongooseModelStupidly(mongoose.Model);
            const consumer = new SettleGameRoundConsumer({ gameData, betLogsRepository });
            const runningRound = { totalTurns: 3 };
            const card1 = { rank: 3, suit: 0 };
            const card2 = { rank: 4, suit: 0 };

            // act
            await consumer.addBetLog(runningRound, card1, card2, 'h', 10);

            //assert
            expect(betLogsRepository.create).toBeCalled();
        });
    });

    describe('settleRound', () => {
        it('should do nothing', async () => {
            // arrange
            const consumer = new SettleGameRoundConsumer({});
            spyOn(consumer, 'generateResult');

            // act
            await consumer.settleRound();

            //assert
            expect(consumer.generateResult).not.toHaveBeenCalled();
        });
    });

    describe('settleBets', () => {
        it('when not have bet should not call bet with end time', async () => {
            // arrange
            const gameData = {
                gameConfigs: {},
                runningRounds: { m1: { result: {}, settlementBetResult: { betwin: 10 }, phien: 1, endTime: new Date() } },
            };
            const definition = {};
            const userBetResultPublisher = { publish: jest.fn() };
            const roundResultPublisher = { publishRoundResult: jest.fn() };
            const consumer = new SettleGameRoundConsumer({ gameData, definition, userBetResultPublisher, roundResultPublisher });
            const bet = { save: jest.fn() };
            spyOn(consumer, 'queryBets').and.returnValue([]);
            consumer.endGame = async () => {
                return {
                    isOk: true,
                };
            };

            // act
            await consumer.settleBets('m1');

            //assert
            expect(bet.save).not.toHaveBeenCalled();
        });

        it('should save bet with end time', async () => {
            // arrange
            const gameData = {
                gameConfigs: {},
                runningRounds: { m1: { result: {}, settlementBetResult: { betwin: 10 }, phien: 1, endTime: new Date() } },
            };
            const definition = {};
            const userBetResultPublisher = { publish: jest.fn() };
            const roundResultPublisher = { publishRoundResult: jest.fn() };
            const consumer = new SettleGameRoundConsumer({ gameData, definition, userBetResultPublisher, roundResultPublisher });
            const bet = { save: jest.fn() };
            spyOn(consumer, 'queryBets').and.returnValue([bet]);
            consumer.endGame = async () => {
                return {
                    isOk: true,
                };
            };

            // act
            await consumer.settleBets('m1');

            //assert
            expect(bet.save).toHaveBeenCalled();
        });
    });

    describe('isWin', () => {
        // arrange
        const testCases = [
            { previousCard: { rank: 0 }, expectedValue: true },
            { previousCard: { rank: 1 }, expectedValue: true },
            { nextCard: { rank: 0 }, previousCard: { rank: 3 }, choice: 'h', expectedValue: true },
            { nextCard: { rank: 3 }, previousCard: { rank: 3 }, choice: 'h', expectedValue: true },
            { nextCard: { rank: 3 }, previousCard: { rank: 2 }, choice: 'h', expectedValue: true },
            { nextCard: { rank: 3 }, previousCard: { rank: 4 }, choice: 'h', expectedValue: false },
            { nextCard: { rank: 1 }, previousCard: { rank: 3 }, choice: 'l', expectedValue: true },
            { nextCard: { rank: 3 }, previousCard: { rank: 3 }, choice: 'l', expectedValue: true },
            { nextCard: { rank: 3 }, previousCard: { rank: 2 }, choice: 'l', expectedValue: false },
            { nextCard: { rank: 3 }, previousCard: { rank: 4 }, choice: 'l', expectedValue: true },
        ];

        it.each(testCases)('should return correct value', (testCase) => {
            // arrange
            const consumer = new SettleGameRoundConsumer({});

            // act
            const actualValue = consumer.isWin(testCase.choice, testCase.previousCard, testCase.nextCard);

            //assert
            expect(actualValue).toStrictEqual(testCase.expectedValue);
        });
    });

    describe('getSettlementResult', () => {
        // arrange
        const testCases = [
            { nextCard: { rank: 3 }, previousCard: { rank: 3 }, expectedValue: 't' },
            { nextCard: { rank: 3 }, previousCard: { rank: 0 }, expectedValue: 'l' },
            { nextCard: { rank: 1 }, previousCard: { rank: 0 }, expectedValue: 'l' },
            { nextCard: { rank: 1 }, previousCard: { rank: 2 }, expectedValue: 'l' },

            { nextCard: { rank: 0 }, previousCard: { rank: 1 }, expectedValue: 'h' },
            { nextCard: { rank: 0 }, previousCard: { rank: 2 }, expectedValue: 'h' },
            { nextCard: { rank: 2 }, previousCard: { rank: 1 }, expectedValue: 'h' },

            { nextCard: { rank: 3 }, previousCard: { rank: 2 }, expectedValue: 'h' },
            { nextCard: { rank: 3 }, previousCard: { rank: 4 }, expectedValue: 'l' },
        ];

        it.each(testCases)('should return correct value', (testCase) => {
            // arrange
            const consumer = new SettleGameRoundConsumer({});

            // act
            const actualValue = consumer.getSettlementResult(testCase.previousCard, testCase.nextCard);

            //assert
            expect(actualValue).toStrictEqual(testCase.expectedValue);
        });
    });
});
