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

    describe('validateBetRequest', () => {
        it('when player has already bet return invalidBet', () => {
            // arrange
            const gameData = { gameConfigs: { enabled: false }, ingame: { m1: { betTracks: {} }, m2: {} } };
            const consumer = new PlaceBetConsumer(null, gameData);
            const expectedValue = { errorCode: helpers.noticeHelper.invalidBet };
            const player = { UID: 'm1', profile: { name: 'm2' } };
            const amount = 10;

            // act
            const actualValue = consumer.validateBetRequest(player, amount);

            //assert
            expect(actualValue).toStrictEqual(expectedValue);
        });

        it('when game not enabled should return invalidBet', () => {
            // arrange
            const gameData = { gameConfigs: { enabled: false }, ingame: { m1: { betTracks: {} } } };
            const consumer = new PlaceBetConsumer(null, gameData);
            const expectedValue = { errorCode: helpers.noticeHelper.invalidBet };
            const player = { UID: 'm1', profile: { name: 'm1' } };
            const amount = 10;

            // act
            const actualValue = consumer.validateBetRequest(player, amount);

            //assert
            expect(actualValue).toStrictEqual(expectedValue);
        });

        it('when amount < minBet should return helpers.noticeHelper.minBet', () => {
            // arrange
            const gameData = {
                gameConfigs: { enabled: true },
                currencyGroupGames: [{ groupId: 1, maxBetPerChoices: { newGameChoice: 100 }, minBet: 30 }],
                ingame: { m1: { betTracks: null } },
            };
            const consumer = new PlaceBetConsumer(null, gameData);
            const expectedValue = { errorCode: helpers.noticeHelper.minBet, minBet: 30 };
            const player = { session: { currencyGroupId: '1' }, profile: { minBet: 20, maxBet: 100, name: 'm1' } };
            const amount = 10;

            // act
            const actualValue = consumer.validateBetRequest(player, amount);

            //assert
            expect(actualValue).toStrictEqual(expectedValue);
        });

        it('when maxBet < amount should return helpers.noticeHelper.maxBet', () => {
            // arrange
            const gameData = {
                gameConfigs: { enabled: true },
                currencyGroupGames: [{ groupId: 1, maxBetPerChoices: { newGameChoice: 100 }, minBet: 1, maxBet: 4 }],
                ingame: { m1: { betTracks: null } },
            };
            const consumer = new PlaceBetConsumer(null, gameData);
            const expectedValue = { errorCode: helpers.noticeHelper.maxBet, maxBet: 4 };
            const player = { session: { currencyGroupId: '1' }, profile: { minBet: 1, maxBet: 100, name: 'm1' } };
            const amount = 10;

            // act
            const actualValue = consumer.validateBetRequest(player, amount);

            //assert
            expect(actualValue).toStrictEqual(expectedValue);
        });

        it('when not has error should return null', () => {
            // arrange
            const gameData = {
                gameConfigs: { enabled: true },
                currencyGroupGames: [{ groupId: 1, maxBetPerChoices: { newGameChoice: 100 }, minBet: 1, maxBet: 100 }],
                ingame: { m1: { betTracks: null } },
            };
            const consumer = new PlaceBetConsumer(null, gameData);
            const player = { session: { currencyGroupId: '1' }, profile: { minBet: 1, maxBet: 100, name: 'm1' } };
            const amount = 10;

            // act
            const actualValue = consumer.validateBetRequest(player, amount);

            //assert
            expect(actualValue).toBeNull();
        });
    });

    describe('consume', () => {
        // arrange
        const gameData = {
            realPlayers: {
                m1: { UID: 'm1' },
                m2: { UID: 'm2' },
                m3: { UID: 'm3', profile: { name: 'm3' } },
                m4: { UID: 'm4', profile: { name: 'm4' }, session: {} },
            },
            ingame: { m1: { betQueue: [], betTracks: { uid: 'm1' } }, m3: { betQueue: [] } },
        };

        it('when not has payload should not validateBetRequest', async () => {
            // arrange
            const consumer = new PlaceBetConsumer();
            spyOn(consumer, 'validateBetRequest');
            const payload = null;

            // act
            await consumer.consume({}, payload);

            //assert
            expect(consumer.validateBetRequest).not.toBeCalled();
        });

        it('when not has amount should not validateBetRequest', async () => {
            // arrange
            const consumer = new PlaceBetConsumer();
            spyOn(consumer, 'validateBetRequest');
            const payload = { amount: 0 };

            // act
            await consumer.consume({}, payload);

            //assert
            expect(consumer.validateBetRequest).not.toBeCalled();
        });

        it('when validateBetRequest failed should endBet', async () => {
            // arrange
            const publisher = { publishToUser: jest.fn() };
            const consumer = new PlaceBetConsumer(null, null, publisher);
            spyOn(consumer, 'validateBetRequest').and.returnValue({ failure: true });
            const payload = { amount: 10 };
            const player = { UID: 'm1' };

            // act
            await consumer.consume(player, payload);

            //assert
            expect(publisher.publishToUser).toBeCalledWith('m1', expect.objectContaining({ endBet: -1, failure: true }));
        });

        it('when validateBetRequest pass but player already ingame should keep old ingame info', async () => {
            // arrange
            const gameData = { realPlayers: { m1: { profile: { name: 'm1' } } }, ingame: { m1: { profile: {} } } };
            const consumer = new PlaceBetConsumer(null, gameData, null);
            spyOn(consumer, 'validateBetRequest').and.returnValue(null);
            const payload = { amount: 10 };
            const player = { UID: 'm1', session: {}, profile: {} };
            const expectedInfo = { profile: {} };

            // act
            await consumer.consume(player, payload);

            //assert
            expect(gameData.ingame['m1']).toStrictEqual(expectedInfo);
        });

        it('when validateBetRequest pass and player not ingame should add player to ingame', async () => {
            // arrange
            const gameData = { realPlayers: { m1: { profile: { name: 'm1' } } }, ingame: { m1: { profile: {} } } };
            const consumer = new PlaceBetConsumer(null, gameData, null);
            spyOn(consumer, 'validateBetRequest').and.returnValue(null);
            const player = { UID: 'm4', session: {}, profile: { name: 'm4' } };
            const payload = { amount: 10 };

            // act
            await consumer.consume(player, payload);

            //assert
            expect(gameData.ingame['m4']).not.toBeUndefined();
        });

        it('when validateBetRequest pass and player has betQueue should not add new betQueue', async () => {
            // arrange
            const gameData = {
                realPlayers: { m1: { profile: { name: 'm1' }, session: {} } },
                ingame: { m1: { betQueue: [{}] } },
            };

            const consumer = new PlaceBetConsumer(null, gameData, null);
            spyOn(consumer, 'validateBetRequest').and.returnValue(null);
            const player = { UID: 'm1', session: {}, profile: { name: 'm1' } };
            const payload = { amount: 10 };

            // act
            await consumer.consume(player, payload);

            //assert
            expect(gameData.ingame['m1'].betQueue.length).toBe(1);
        });

        it('when validateBetRequest pass and player does not have betQueue should not add new betQueue', async () => {
            // arrange
            const consumer = new PlaceBetConsumer(null, gameData, null);
            spyOn(consumer, 'validateBetRequest').and.returnValue(null);
            const player = { UID: 'm4', session: {}, profile: { name: 'm4' } };
            const payload = { amount: 10 };

            // act
            await consumer.consume(player, payload);

            //assert
            expect(gameData.ingame['m4'].betQueue.length).toBe(1);
        });
    });
});
