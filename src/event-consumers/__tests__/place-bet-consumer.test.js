import { Core } from 'sc-game-base';
import mongoose from 'mongoose';
import { stubMongooseModelStupidly } from 'jest-micro-auto-stub';
import { helpers } from 'sc-common';
import { PlaceBetConsumer } from '../index';

describe('place-bet-consumer', () => {
    describe('extends', () => {
        it('inherit Core.BaseEventConsumers.PlaceBetConsumer ', () => {
            // act
            const consumer = new PlaceBetConsumer();

            //assert
            expect(consumer instanceof Core.BaseEventConsumers.PlaceBetConsumer);
        });
    });

    describe('composeValidationCriteria', () => {
        const testCases = [{ criterion: [] }, { criterion: null }];
        it.each(testCases)('should return correct value', async (testCase) => {
            // arrange
            const consumer = new PlaceBetConsumer();
            spyOn(consumer, 'composeBettingTimeValidationCriteria').and.returnValue(testCase.criterion);
            spyOn(consumer, 'composeBetAmountValidationCriteria').and.returnValue(testCase.criterion);
            spyOn(consumer, 'composeBetChoiceValidationCriteria').and.returnValue(testCase.criterion);
            const expectedValue = [];

            // act
            const actualValue = await consumer.composeValidationCriteria();

            //assert
            expect(actualValue).toStrictEqual(expectedValue);
        });
    });

    describe('composeBettingTimeValidationCriteria', () => {
        let testCases = [
            { enabled: false, expectedValue: { failure: true, notice: { errorCode: helpers.noticeHelper.invalidBet } } },
            { enabled: true, expectedValue: { failure: false, notice: { errorCode: helpers.noticeHelper.invalidBet } } },
        ];
        it.each(testCases)('should check game enabled or not', async (testCase) => {
            // arrange
            const definition = {};
            const gameData = { gameConfigs: { enabled: testCase.enabled } };
            const roundsRepository = stubMongooseModelStupidly(mongoose.Model);
            const consumer = new PlaceBetConsumer(definition, gameData, {}, roundsRepository);
            const roundId = undefined;

            // act
            const actualValue = await consumer.composeBettingTimeValidationCriteria(roundId);

            //assert
            expect(actualValue[0]).toStrictEqual(testCase.expectedValue);
        });

        testCases = [
            {
                roundId: undefined,
                expectedValue: {
                    failure: true,
                    notice: { errorCode: helpers.noticeHelper.invalidBet, message: 'Phiên chơi đã kết thúc...' },
                },
            },
            {
                roundId: 10,
                expectedValue: {
                    failure: false,
                    notice: { errorCode: helpers.noticeHelper.invalidBet, message: 'Phiên chơi đã kết thúc...' },
                },
            },
        ];
        it.each(testCases)('should check round id', async (testCase) => {
            // arrange
            const definition = {};
            const gameData = { gameConfigs: { enabled: true } };
            const roundsRepository = stubMongooseModelStupidly(mongoose.Model);
            const consumer = new PlaceBetConsumer(definition, gameData, {}, roundsRepository);
            const roundId = testCase.roundId;

            // act
            const actualValue = await consumer.composeBettingTimeValidationCriteria(roundId);

            //assert
            expect(actualValue[1]).toStrictEqual(testCase.expectedValue);
        });

        it('when round not exist should return failed', async () => {
            // arrange
            const definition = {};
            const gameData = { gameConfigs: { enabled: true } };
            const roundsRepository = stubMongooseModelStupidly(mongoose.Model);
            roundsRepository.findOne().lean().exec.mockReturnValueOnce(null);
            const consumer = new PlaceBetConsumer(definition, gameData, {}, roundsRepository);
            const roundId = 1;
            const expectedValue = {
                failure: true,
                notice: { errorCode: helpers.noticeHelper.invalidBet, message: 'Phiên không tồn tại...' },
            };

            // act
            const actualValue = await consumer.composeBettingTimeValidationCriteria(roundId);

            //assert
            expect(actualValue[2]).toStrictEqual(expectedValue);
        });

        it('when round exist should not failed', async () => {
            // arrange
            const definition = {};
            const gameData = { gameConfigs: { enabled: true } };
            const roundsRepository = stubMongooseModelStupidly(mongoose.Model);
            roundsRepository.findOne().lean().exec.mockReturnValueOnce({ id: 10 });

            const consumer = new PlaceBetConsumer(definition, gameData, {}, roundsRepository);
            const roundId = 1;
            const expectedValue = {
                failure: false,
                notice: { errorCode: helpers.noticeHelper.invalidBet, message: 'Phiên không tồn tại...' },
            };

            // act
            const actualValue = await consumer.composeBettingTimeValidationCriteria(roundId);

            //assert
            expect(actualValue[2]).toStrictEqual(expectedValue);
        });

        it('when round not exists should not failed ended criterion', async () => {
            // arrange
            const definition = {};
            const gameData = { gameConfigs: { enabled: true } };
            const roundsRepository = stubMongooseModelStupidly(mongoose.Model);
            roundsRepository.findOne().lean().exec.mockReturnValueOnce(null);
            const consumer = new PlaceBetConsumer(definition, gameData, {}, roundsRepository);
            const roundId = 1;
            const expectedValue = {
                failure: null,
                notice: { errorCode: helpers.noticeHelper.invalidBet, message: 'Phiên đã kết thúc...' },
            };

            // act
            const actualValue = await consumer.composeBettingTimeValidationCriteria(roundId);

            //assert
            expect(actualValue[3]).toStrictEqual(expectedValue);
        });

        it('when round not ended should not failed ended criterion', async () => {
            // arrange
            const definition = {};
            const gameData = { gameConfigs: { enabled: true } };
            const roundsRepository = stubMongooseModelStupidly(mongoose.Model);
            roundsRepository.findOne().lean().exec.mockReturnValueOnce({ id: 10, ended: false });
            const consumer = new PlaceBetConsumer(definition, gameData, {}, roundsRepository);
            const roundId = 1;
            const expectedValue = {
                failure: false,
                notice: { errorCode: helpers.noticeHelper.invalidBet, message: 'Phiên đã kết thúc...' },
            };

            // act
            const actualValue = await consumer.composeBettingTimeValidationCriteria(roundId);

            //assert
            expect(actualValue[3]).toStrictEqual(expectedValue);
        });

        it('when round ended should failed ended criterion', async () => {
            // arrange
            const definition = {};
            const gameData = { gameConfigs: { enabled: true } };
            const roundsRepository = stubMongooseModelStupidly(mongoose.Model);
            roundsRepository.findOne().lean().exec.mockReturnValueOnce({ id: 10, ended: true });

            const consumer = new PlaceBetConsumer(definition, gameData, {}, roundsRepository);
            const roundId = 1;
            const expectedValue = {
                failure: true,
                notice: { errorCode: helpers.noticeHelper.invalidBet, message: 'Phiên đã kết thúc...' },
            };

            // act
            const actualValue = await consumer.composeBettingTimeValidationCriteria(roundId);

            //assert
            expect(actualValue[3]).toStrictEqual(expectedValue);
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
            const consumer = new PlaceBetConsumer(definition, gameData, {});
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
            const gameData = { runningRounds: {} };
            const consumer = new PlaceBetConsumer(definition, gameData, {});
            const expectedValue = { failure: true, notice: { errorCode: helpers.noticeHelper.invalidBet } };
            const player = { profile: { maxBet: 8, maxBet: 6 }, session: { currencyGroupId: 'g1' } };
            const betChoice = 'hi';

            // act
            const actualValue = consumer.composeBetChoiceValidationCriteria(player, betChoice);

            //assert
            expect(actualValue[0]).toStrictEqual(expectedValue);
        });

        it('when bet choice in definition.choices should not failed choices criterion', () => {
            // arrange
            const definition = { choices: ['hi', 'lo'] };
            const gameData = { runningRounds: {} };
            const consumer = new PlaceBetConsumer(definition, gameData, {});
            const expectedValue = { failure: false, notice: { errorCode: helpers.noticeHelper.invalidBet } };
            const player = { profile: { maxBet: 8, maxBet: 6 }, session: { currencyGroupId: 'g1' } };
            const betChoice = 'hi';

            // act
            const actualValue = consumer.composeBetChoiceValidationCriteria(player, betChoice);

            //assert
            expect(actualValue[0]).toStrictEqual(expectedValue);
        });

        it('when loChoice and card is 2 should failed loChoice criterion', () => {
            // arrange
            const definition = { choices: [] };
            const gameData = { runningRounds: { m1: { cards: [{ card: 1 }] } } };
            const consumer = new PlaceBetConsumer(definition, gameData, {});
            const expectedValue = {
                failure: true,
                notice: { errorCode: helpers.noticeHelper.invalidBet, message: 'Không thể chọn thấp hơn 2' },
            };
            const player = { UID: 'm1' };
            const betChoice = 'lo';

            // act
            const actualValue = consumer.composeBetChoiceValidationCriteria(player, betChoice);

            //assert
            expect(actualValue[1]).toStrictEqual(expectedValue);
        });

        it('when loChoice and card is not 2 should not failed loChoice criterion', () => {
            // arrange
            const definition = { choices: [] };
            const gameData = { runningRounds: { m1: { cards: [{ card: 1 }, { card: 3 }] } } };
            const consumer = new PlaceBetConsumer(definition, gameData, {});
            const expectedValue = {
                failure: false,
                notice: { errorCode: helpers.noticeHelper.invalidBet, message: 'Không thể chọn thấp hơn 2' },
            };
            const player = { UID: 'm1' };
            const betChoice = 'lo';

            // act
            const actualValue = consumer.composeBetChoiceValidationCriteria(player, betChoice);

            //assert
            expect(actualValue[1]).toStrictEqual(expectedValue);
        });

        it('when hiChoice and card is not 2 should not failed loChoice criterion', () => {
            // arrange
            const definition = { choices: [] };
            const gameData = { runningRounds: { m1: { cards: [{ card: 1 }, { card: 3 }] } } };
            const consumer = new PlaceBetConsumer(definition, gameData, {});
            const expectedValue = {
                failure: false,
                notice: { errorCode: helpers.noticeHelper.invalidBet, message: 'Không thể chọn thấp hơn 2' },
            };
            const player = { UID: 'm1' };
            const betChoice = 'hi';

            // act
            const actualValue = consumer.composeBetChoiceValidationCriteria(player, betChoice);

            //assert
            expect(actualValue[1]).toStrictEqual(expectedValue);
        });

        it('when hiChoice and card is 2 should not failed loChoice criterion', () => {
            // arrange
            const definition = { choices: [] };
            const gameData = { runningRounds: { m1: { cards: [{ card: 1 }, { card: 1 }] } } };
            const consumer = new PlaceBetConsumer(definition, gameData, {});
            const expectedValue = {
                failure: false,
                notice: { errorCode: helpers.noticeHelper.invalidBet, message: 'Không thể chọn thấp hơn 2' },
            };
            const player = { UID: 'm1' };
            const betChoice = 'hi';

            // act
            const actualValue = consumer.composeBetChoiceValidationCriteria(player, betChoice);

            //assert
            expect(actualValue[1]).toStrictEqual(expectedValue);
        });

        it('when hiChoice and card is 1 should failed hiChoice criterion', () => {
            // arrange
            const definition = { choices: [] };
            const gameData = { runningRounds: { m1: { cards: [{ card: 0 }] } } };
            const consumer = new PlaceBetConsumer(definition, gameData, {});
            const expectedValue = {
                failure: true,
                notice: { errorCode: helpers.noticeHelper.invalidBet, message: 'Không thể chọn cao hơn A' },
            };
            const player = { UID: 'm1' };
            const betChoice = 'hi';

            // act
            const actualValue = consumer.composeBetChoiceValidationCriteria(player, betChoice);

            //assert
            expect(actualValue[2]).toStrictEqual(expectedValue);
        });

        it('when hiChoice and card is not 1 should not failed hiChoice criterion', () => {
            // arrange
            const definition = { choices: [] };
            const gameData = { runningRounds: { m1: { cards: [{ card: 1 }, { card: 3 }] } } };
            const consumer = new PlaceBetConsumer(definition, gameData, {});
            const expectedValue = {
                failure: false,
                notice: { errorCode: helpers.noticeHelper.invalidBet, message: 'Không thể chọn cao hơn A' },
            };
            const player = { UID: 'm1' };
            const betChoice = 'hi';

            // act
            const actualValue = consumer.composeBetChoiceValidationCriteria(player, betChoice);

            //assert
            expect(actualValue[2]).toStrictEqual(expectedValue);
        });

        it('when loChoice and card is not 1 should not failed hiChoice criterion', () => {
            // arrange
            const definition = { choices: [] };
            const gameData = { runningRounds: { m1: { cards: [{ card: 1 }, { card: 3 }] } } };
            const consumer = new PlaceBetConsumer(definition, gameData, {});
            const expectedValue = {
                failure: false,
                notice: { errorCode: helpers.noticeHelper.invalidBet, message: 'Không thể chọn cao hơn A' },
            };
            const player = { UID: 'm1' };
            const betChoice = 'lo';

            // act
            const actualValue = consumer.composeBetChoiceValidationCriteria(player, betChoice);

            //assert
            expect(actualValue[2]).toStrictEqual(expectedValue);
        });

        it('when loChoice and card is 2 should not failed hiChoice criterion', () => {
            // arrange
            const definition = { choices: [] };
            const gameData = { runningRounds: { m1: { cards: [{ card: 1 }, { card: 0 }] } } };
            const consumer = new PlaceBetConsumer(definition, gameData, {});
            const expectedValue = {
                failure: false,
                notice: { errorCode: helpers.noticeHelper.invalidBet, message: 'Không thể chọn cao hơn A' },
            };
            const player = { UID: 'm1' };
            const betChoice = 'lo';

            // act
            const actualValue = consumer.composeBetChoiceValidationCriteria(player, betChoice);

            //assert
            expect(actualValue[2]).toStrictEqual(expectedValue);
        });
    });

    describe('validateBetRequest', () => {
        it('when not have amount should return failed', async () => {
            // arrange
            const definition = { choices: [] };
            const gameData = { runningRounds: { m1: { cards: [{ card: 1 }, { card: 0 }] } } };
            const consumer = new PlaceBetConsumer(definition, gameData, {});
            const player = { UID: 'm1' };
            const amount = 0;
            const betChoice = 'lo';

            // act
            const actualValue = await consumer.validateBetRequest(player, betChoice, amount);

            //assert
            expect(actualValue).toBeFalse();
        });

        it('when not have betChoice should return failed', async () => {
            // arrange
            const definition = { choices: [] };
            const gameData = { runningRounds: { m1: { cards: [{ card: 1 }, { card: 0 }] } } };
            const consumer = new PlaceBetConsumer(definition, gameData, {});
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
            const gameData = { runningRounds: { m1: { cards: [{ card: 1 }, { card: 0 }] } } };
            const publisher = { publishToUser: jest.fn() };
            const consumer = new PlaceBetConsumer(definition, gameData, publisher);
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
            const gameData = { runningRounds: { m1: { cards: [{ card: 1 }, { card: 0 }] } } };
            const publisher = { publishToUser: jest.fn() };
            const consumer = new PlaceBetConsumer(definition, gameData, publisher);
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
        it('when validateBetRequest failed should not call settleGameRoundConsumer.settleSubRound', async () => {
            // arrange
            const definition = { choices: [] };
            const gameData = { runningRounds: { m2: { cards: [{ card: 1 }, { card: 0 }] } } };
            const publisher = { publishToUser: jest.fn() };
            const settleGameRoundConsumer = { settleSubRound: jest.fn() };
            const consumer = new PlaceBetConsumer(definition, gameData, publisher, null, settleGameRoundConsumer);
            const player = { UID: 'm1' };
            spyOn(consumer, 'validateBetRequest').and.returnValue(false);
            const payload = {};

            // act
            await consumer.consume(player, payload);

            //assert
            expect(settleGameRoundConsumer.settleSubRound).not.toBeCalled();
        });

        it('when validateBetRequest past should call settleGameRoundConsumer.settleSubRound', async () => {
            // arrange
            const definition = { choices: [] };
            const gameData = { runningRounds: { m1: { cards: [{ card: 1 }, { card: 0 }] } } };
            const publisher = { publishToUser: jest.fn() };
            const settleGameRoundConsumer = { settleSubRound: jest.fn() };
            const consumer = new PlaceBetConsumer(definition, gameData, publisher, null, settleGameRoundConsumer);
            const player = { UID: 'm1' };
            spyOn(consumer, 'validateBetRequest').and.returnValue(true);
            const payload = {};

            // act
            await consumer.consume(player, payload);

            //assert
            expect(settleGameRoundConsumer.settleSubRound).toBeCalled();
        });
    });
});
