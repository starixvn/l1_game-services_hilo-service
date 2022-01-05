import { Table } from 'sc-game-base';
import mongoose from 'mongoose';
import { stubMongooseModelStupidly } from 'jest-micro-auto-stub';
import { InGameConsumer } from '../index';

describe('in-game-consumer', () => {
    describe('extends', () => {
        it('inherit Table.EventConsumers.TableInGameConsumer', () => {
            // act
            const consumer = new InGameConsumer({});

            //assert
            expect(consumer instanceof Table.EventConsumers.TableInGameConsumer);
        });
    });

    describe('buildPayload', () => {
        it('should return runningRound', async () => {
            // arrange
            const gameData = {
                runningRounds: { m1: { phien: 1 } },
                gameConfigs: {},
                exchangeRates: { code: {} },
                currencyGroupGames: [],
                ingame: {},
                players: {},
            };
            const roundQuery = { getList: jest.fn() };
            const getBalance = jest.fn();
            const userInfosRepository = stubMongooseModelStupidly(mongoose.Model);
            const consumer = new InGameConsumer({}, gameData, roundQuery, {}, getBalance, userInfosRepository);
            const player = { UID: 'm1', session: {}, profile: {} };
            const expectedValue = { phien: 1 };

            // act
            const actualValue = await consumer.buildPayload(player);

            //assert
            expect(actualValue.runningRound).toStrictEqual(expectedValue);
        });
    });
});
