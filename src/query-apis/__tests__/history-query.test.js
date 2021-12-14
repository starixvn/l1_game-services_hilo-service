import { Core } from 'sc-game-base';
import { HistoryQuery } from '../index';

const stepModel = {
    countDocuments: () => {
        return {
            exec: async () => {
                return 0;
            },
        };
    },
    find: () => {
        return {
            lean: () => {
                return {
                    exec: async () => {
                        return [{ uid: 'm1' }, { uid: 'm2' }];
                    },
                };
            },
        };
    },
};

jest.mock('../../models', () => {
    return { StepModel: stepModel };
});

describe('history-query', () => {
    describe('extends', () => {
        it('inherit Core.QueryApis.HistoryQuery', () => {
            // act
            const query = new HistoryQuery({});

            //assert
            expect(query instanceof Core.QueryApis.HistoryQuery);
        });
    });

    describe('queryHistorys', () => {
        it('when page < 1 should return empty', async () => {
            // arrange
            const query = new HistoryQuery({});
            const player = {};
            const page = 0;

            // act
            const actualValue = await query.queryHistory(player, page);

            //assert
            expect(actualValue).toStrictEqual({});
        });

        it('when not have player should return empty', async () => {
            // arrange
            const query = new HistoryQuery({});
            const page = 3;
            const player = null;

            // act
            const actualValue = await query.queryHistory(player, page);

            //assert
            expect(actualValue).toStrictEqual({});
        });

        it('when have player and page >= 1 should return histories', async () => {
            // arrange
            const query = new HistoryQuery({});
            const page = 3;
            const player = {};

            // act
            const actualValue = await query.queryHistory(player, page);

            //assert
            expect(actualValue.history).not.toStrictEqual({});
        });
    });
});
