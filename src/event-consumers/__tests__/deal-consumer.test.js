import { Core } from 'sc-game-base';
import mongoose from 'mongoose';
import { stubMongooseModelStupidly } from 'jest-micro-auto-stub';
import { helpers } from 'sc-common';
import { DealConsumer } from '../index';
import errorCodes from '../../constants/error-codes';

describe('deal-consumer', () => {
    describe('extends', () => {
        it('inherit Core.BaseEventConsumers.PlaceBetConsumer ', () => {
            // act
            const consumer = new DealConsumer();

            //assert
            expect(consumer instanceof Core.BaseEventConsumers.PlaceBetConsumer);
        });
    });

    describe('composeValidationCriteria', () => {
        const testCases = [{ criterion: [] }, { criterion: null }];
        it.each(testCases)('should return correct value', (testCase) => {
            // arrange
            const consumer = new DealConsumer();
            spyOn(consumer, 'composeBettingTimeValidationCriteria').and.returnValue(testCase.criterion);
            spyOn(consumer, 'composeBetAmountValidationCriteria').and.returnValue(testCase.criterion);
            spyOn(consumer, 'composeBetChoiceValidationCriteria').and.returnValue(testCase.criterion);
            const expectedValue = [];

            // act
            const actualValue = consumer.composeValidationCriteria();

            //assert
            expect(actualValue).toStrictEqual(expectedValue);
        });
    });

    describe('composeBettingTimeValidationCriteria', () => {
        let testCases = [
            { enabled: false, expectedValue: { failure: true, notice: { errorCode: helpers.noticeHelper.invalidBet } } },
            { enabled: true, expectedValue: { failure: false, notice: { errorCode: helpers.noticeHelper.invalidBet } } },
        ];
        it.each(testCases)('should check game enabled or not', (testCase) => {
            // arrange
            const definition = {};
            const gameData = { gameConfigs: { enabled: testCase.enabled } };
            const betsRepository = stubMongooseModelStupidly(mongoose.Model);
            const consumer = new DealConsumer(definition, gameData, {}, betsRepository);
            const roundId = undefined;

            // act
            const actualValue = consumer.composeBettingTimeValidationCriteria(roundId);

            //assert
            expect(actualValue[0]).toStrictEqual(testCase.expectedValue);
        });

        testCases = [
            {
                roundId: undefined,
                expectedValue: {
                    failure: true,
                    notice: { errorCode: helpers.noticeHelper.invalidBet, message: errorCodes.roundNotExist },
                },
            },
            {
                roundId: 10,
                expectedValue: {
                    failure: false,
                    notice: { errorCode: helpers.noticeHelper.invalidBet, message: errorCodes.roundNotExist },
                },
            },
        ];
        it.each(testCases)('should check round id', (testCase) => {
            // arrange
            const definition = {};
            const gameData = { gameConfigs: { enabled: true } };
            const betsRepository = stubMongooseModelStupidly(mongoose.Model);
            const consumer = new DealConsumer(definition, gameData, {}, betsRepository);
            const roundId = testCase.roundId;

            // act
            const actualValue = consumer.composeBettingTimeValidationCriteria(roundId);

            //assert
            expect(actualValue[1]).toStrictEqual(testCase.expectedValue);
        });
    });

    describe('composeBetAmountValidationCriteria', () => {
        let testCases = [
            { freeBet: false, enableFreeBet: false, expectedFailure: false },
            { freeBet: false, enableFreeBet: true, expectedFailure: false },
            { freeBet: true, enableFreeBet: false, expectedFailure: true },
            { freeBet: true, enableFreeBet: true, expectedFailure: false },
        ];
        it.each(testCases)('should validate base on enableFreeBet', async (testCase) => {
            // arrange
            const definition = {};
            const gameData = {
                currencyGroupGames: [{ groupId: 'g1', maxBetPerChoices: {} }],
                gameConfigs: { enabled: true, enableFreeBet: testCase.enableFreeBet },
            };
            const consumer = new DealConsumer(definition, gameData, {});
            const expectedValue = {
                failure: testCase.expectedFailure,
                notice: { errorCode: helpers.noticeHelper.invalidBet },
            };
            const player = { profile: {}, session: { currencyGroupId: 'g1' } };
            const betChoice = 'hi';
            const amount = 10;
            const freeBet = testCase.freeBet;

            // act
            const actualValue = await consumer.composeBetAmountValidationCriteria(freeBet);

            //assert
            expect(actualValue[0]).toStrictEqual(expectedValue);
        });
    });

    describe('composeBetChoiceValidationCriteria', () => {
        it('when bet choice not in definition.choices should failed choices criterion', () => {
            // arrange
            const definition = { choices: [] };
            const gameData = { ingame: { betTracks: {} } };
            const consumer = new DealConsumer(definition, gameData, {});
            const expectedValue = { failure: true, notice: { errorCode: helpers.noticeHelper.invalidBet } };
            const player = { profile: { maxBet: 8, maxBet: 6 }, session: { currencyGroupId: 'g1' } };
            const betChoice = 'h';

            // act
            const actualValue = consumer.composeBetChoiceValidationCriteria(player, betChoice);

            //assert
            expect(actualValue[0]).toStrictEqual(expectedValue);
        });

        it('when bet choice in definition.choices should not failed choices criterion', () => {
            // arrange
            const definition = { choices: ['h', 'l'] };
            const gameData = { ingame: { betTracks: {} } };
            const consumer = new DealConsumer(definition, gameData, {});
            const expectedValue = { failure: false, notice: { errorCode: helpers.noticeHelper.invalidBet } };
            const player = { profile: { maxBet: 8, maxBet: 6 }, session: { currencyGroupId: 'g1' } };
            const betChoice = 'h';

            // act
            const actualValue = consumer.composeBetChoiceValidationCriteria(player, betChoice);

            //assert
            expect(actualValue[0]).toStrictEqual(expectedValue);
        });

        it('when loChoice and card is 2 should failed loChoice criterion', () => {
            // arrange
            const definition = { choices: [] };
            const gameData = { ingame: { betTracks: { m1: { result: [{ rank: '2' }] } } } };
            const consumer = new DealConsumer(definition, gameData, {});
            const expectedValue = {
                failure: true,
                notice: { errorCode: helpers.noticeHelper.invalidBet, message: errorCodes.lowerThan2 },
            };
            const player = { UID: 'm1' };
            const betChoice = 'l';

            // act
            const actualValue = consumer.composeBetChoiceValidationCriteria(player, betChoice);

            //assert
            expect(actualValue[1]).toStrictEqual(expectedValue);
        });

        it('when loChoice and card is not 2 should not failed loChoice criterion', () => {
            // arrange
            const definition = { choices: [] };
            const gameData = { ingame: { betTracks: { m1: { result: [{ rank: '2' }, { rank: '4' }] } } } };
            const consumer = new DealConsumer(definition, gameData, {});
            const expectedValue = {
                failure: false,
                notice: { errorCode: helpers.noticeHelper.invalidBet, message: errorCodes.lowerThan2 },
            };
            const player = { UID: 'm1' };
            const betChoice = 'l';

            // act
            const actualValue = consumer.composeBetChoiceValidationCriteria(player, betChoice);

            //assert
            expect(actualValue[1]).toStrictEqual(expectedValue);
        });

        it('when hiChoice and card is not 2 should not failed loChoice criterion', () => {
            // arrange
            const definition = { choices: [] };
            const gameData = { ingame: { betTracks: { m1: { result: [{ rank: '2' }, { rank: '4' }] } } } };
            const consumer = new DealConsumer(definition, gameData, {});
            const expectedValue = {
                failure: false,
                notice: { errorCode: helpers.noticeHelper.invalidBet, message: errorCodes.lowerThan2 },
            };
            const player = { UID: 'm1' };
            const betChoice = 'h';

            // act
            const actualValue = consumer.composeBetChoiceValidationCriteria(player, betChoice);

            //assert
            expect(actualValue[1]).toStrictEqual(expectedValue);
        });

        it('when hiChoice and card is 2 should not failed loChoice criterion', () => {
            // arrange
            const definition = { choices: [] };
            const gameData = { ingame: { betTracks: { m1: { result: [{ rank: '2' }, { rank: '2' }] } } } };
            const consumer = new DealConsumer(definition, gameData, {});
            const expectedValue = {
                failure: false,
                notice: { errorCode: helpers.noticeHelper.invalidBet, message: errorCodes.lowerThan2 },
            };
            const player = { UID: 'm1' };
            const betChoice = 'h';

            // act
            const actualValue = consumer.composeBetChoiceValidationCriteria(player, betChoice);

            //assert
            expect(actualValue[1]).toStrictEqual(expectedValue);
        });

        it('when hiChoice and card is 1 should failed hiChoice criterion', () => {
            // arrange
            const definition = { choices: [] };
            const gameData = { ingame: { betTracks: { m1: { result: [{ rank: 'A' }] } } } };
            const consumer = new DealConsumer(definition, gameData, {});
            const expectedValue = {
                failure: true,
                notice: { errorCode: helpers.noticeHelper.invalidBet, message: errorCodes.greaterThan1 },
            };
            const player = { UID: 'm1' };
            const betChoice = 'h';

            // act
            const actualValue = consumer.composeBetChoiceValidationCriteria(player, betChoice);

            //assert
            expect(actualValue[2]).toStrictEqual(expectedValue);
        });

        it('when hiChoice and card is not 1 should not failed hiChoice criterion', () => {
            // arrange
            const definition = { choices: [] };
            const gameData = { ingame: { betTracks: { m1: { result: [{ rank: '2' }, { rank: '4' }] } } } };
            const consumer = new DealConsumer(definition, gameData, {});
            const expectedValue = {
                failure: false,
                notice: { errorCode: helpers.noticeHelper.invalidBet, message: errorCodes.greaterThan1 },
            };
            const player = { UID: 'm1' };
            const betChoice = 'h';

            // act
            const actualValue = consumer.composeBetChoiceValidationCriteria(player, betChoice);

            //assert
            expect(actualValue[2]).toStrictEqual(expectedValue);
        });

        it('when loChoice and card is not 1 should not failed hiChoice criterion', () => {
            // arrange
            const definition = { choices: [] };
            const gameData = { ingame: { betTracks: { m1: { result: [{ rank: '2' }, { rank: '4' }] } } } };
            const consumer = new DealConsumer(definition, gameData, {});
            const expectedValue = {
                failure: false,
                notice: { errorCode: helpers.noticeHelper.invalidBet, message: errorCodes.greaterThan1 },
            };
            const player = { UID: 'm1' };
            const betChoice = 'l';

            // act
            const actualValue = consumer.composeBetChoiceValidationCriteria(player, betChoice);

            //assert
            expect(actualValue[2]).toStrictEqual(expectedValue);
        });

        it('when loChoice and card is 2 should not failed hiChoice criterion', () => {
            // arrange
            const definition = { choices: [] };
            const gameData = { ingame: { betTracks: { m1: { result: [{ rank: '2' }, { rank: 'A' }] } } } };
            const consumer = new DealConsumer(definition, gameData, {});
            const expectedValue = {
                failure: false,
                notice: { errorCode: helpers.noticeHelper.invalidBet, message: errorCodes.greaterThan1 },
            };
            const player = { UID: 'm1' };
            const betChoice = 'l';

            // act
            const actualValue = consumer.composeBetChoiceValidationCriteria(player, betChoice);

            //assert
            expect(actualValue[2]).toStrictEqual(expectedValue);
        });
    });

    describe('validateBetRequest', () => {
        it('when not have betChoice should return failed', async () => {
            // arrange
            const definition = { choices: [] };
            const gameData = { ingame: { betTracks: { m1: { result: [{ rank: '2' }, { rank: 'A' }] } } } };
            const consumer = new DealConsumer(definition, gameData, {});
            const player = { UID: 'm1' };
            const amount = 10;
            const betChoice = null;

            // act
            const actualValue = await consumer.validateBetRequest(player, betChoice, amount);

            //assert
            expect(actualValue).toBeFalse();
        });

        it('when have failedCriterion should return failed', async () => {
            // arrange
            const definition = { choices: [] };
            const gameData = { ingame: { betTracks: { m1: { result: [{ rank: '2' }, { rank: 'A' }] } } } };
            const publisher = { publishToUser: jest.fn() };
            const consumer = new DealConsumer(definition, gameData, publisher);
            const player = { UID: 'm1' };
            const amount = 10;
            const betChoice = 'hi';
            spyOn(consumer, 'composeValidationCriteria').and.returnValue([{ failure: true }]);

            // act
            const actualValue = await consumer.validateBetRequest(player, betChoice, amount);

            //assert
            expect(actualValue).toBeFalse();
        });

        it('when not have failedCriterion should return true', async () => {
            // arrange
            const definition = { choices: [] };
            const gameData = { ingame: { betTracks: { m1: { result: [{ rank: '2' }, { rank: 'A' }] } } } };
            const publisher = { publishToUser: jest.fn() };
            const consumer = new DealConsumer(definition, gameData, publisher);
            const player = { UID: 'm1' };
            const amount = 10;
            const betChoice = 'hi';
            spyOn(consumer, 'composeValidationCriteria').and.returnValue([]);

            // act
            const actualValue = await consumer.validateBetRequest(player, betChoice, amount);

            //assert
            expect(actualValue).toBeTruthy();
        });
    });

    describe('consume', () => {
        it('when validateBetRequest failed should not call settleGameRoundConsumer.settleTurn', async () => {
            // arrange
            const definition = { choices: [] };
            const gameData = { ingame: { betTracks: { m2: { result: [{ rank: '2' }, { rank: 'A' }] } } } };
            const publisher = { publishToUser: jest.fn() };
            const settleGameRoundConsumer = { settleTurn: jest.fn() };
            const consumer = new DealConsumer(definition, gameData, publisher, null, settleGameRoundConsumer);
            const player = { UID: 'm1' };
            spyOn(consumer, 'validateBetRequest').and.returnValue(false);
            const payload = {};

            // act
            await consumer.consume(player, payload);

            //assert
            expect(settleGameRoundConsumer.settleTurn).not.toBeCalled();
        });

        it('when validateBetRequest past should push deal info to queue', async () => {
            // arrange
            const definition = { choices: [] };
            const gameData = {
                ingame: { m1: { betQueue: [] }, betTracks: { m1: { result: [{ rank: '2' }, { rank: 'A' }] } } },
            };
            const publisher = { publishToUser: jest.fn() };
            const settleGameRoundConsumer = { settleTurn: jest.fn() };
            const consumer = new DealConsumer(definition, gameData, publisher, null, settleGameRoundConsumer);

            const player = { UID: 'm1', profile: { name: 'm1' } };
            spyOn(consumer, 'validateBetRequest').and.returnValue(true);
            const payload = {};

            // act
            await consumer.consume(player, payload);

            //assert
            expect(gameData.ingame.m1.betQueue.length > 0).toBeTruthy();
        });
    });
});
