import mongoose from 'mongoose';
import { stubMongooseModelStupidly } from 'jest-micro-auto-stub';
import { Core } from 'sc-game-base';
import { HistoryQuery } from '../index';

describe('history-query', () => {
    describe('extends', () => {
        it('inherit Core.QueryApis.HistoryQuery', () => {
            // act
            const query = new HistoryQuery();

            //assert
            expect(query instanceof Core.QueryApis.HistoryQuery);
        });
    });

    describe('getBetLogDetails', () => {
        it('should return result from betLogsRepository', () => {
            // arrange
            const betLogsRepository = stubMongooseModelStupidly(mongoose.Model);
            const logs = [];
            betLogsRepository.find().lean().exec.mockReturnValueOnce(logs);
            const query = new HistoryQuery(null, null, betLogsRepository);
            const player = {};

            // act
            const actualValue = query.getBetLogDetails(player);

            // assert
            expect(actualValue).toStrictEqual(logs);
        });
    });
});
