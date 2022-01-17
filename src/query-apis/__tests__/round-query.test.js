import mongoose from 'mongoose';
import { stubMongooseModelStupidly } from 'jest-micro-auto-stub';
import { Core } from 'sc-game-base';
import { RoundQuery } from '../index';

describe('round-query', () => {
    describe('extends', () => {
        it('inherit Core.QueryApis.RoundQuery', () => {
            // act
            const query = new RoundQuery();

            //assert
            expect(query instanceof Core.QueryApis.RoundQuery);
        });
    });

    describe('getOne', () => {
        it('should return result from roundsRepository', async () => {
            // arrange
            const roundsRepository = stubMongooseModelStupidly(mongoose.Model);
            const round = {};
            roundsRepository.findOne().lean().exec.mockReturnValueOnce(round);
            const query = new RoundQuery(roundsRepository);

            // act
            const actualValue = await query.getOne();

            // assert
            expect(actualValue).toStrictEqual(round);
        });
    });

    describe('getList', () => {
        it('should return result from roundsRepository', async () => {
            // arrange
            const roundsRepository = stubMongooseModelStupidly(mongoose.Model);
            const rounds = [{ id: 1 }];
            roundsRepository.find().lean().exec.mockReturnValueOnce(rounds);
            const query = new RoundQuery(roundsRepository);
            const expectedValue = [{ roundId: 1, result: undefined, settlementResult: undefined }];

            // act
            const actualValue = await query.getList();

            // assert
            expect(actualValue).toStrictEqual(expectedValue);
        });
    });
});
