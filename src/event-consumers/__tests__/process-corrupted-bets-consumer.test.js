import mongoose from 'mongoose';
import { stubMongooseModelStupidly } from 'jest-micro-auto-stub';
import { ProcessCorruptedBetsConsumer } from '../index';

describe('in-game-consumer', () => {
    describe('consume', () => {
        const testCases = [
            {
                bets: [
                    { uid: 'm1', thanhtoan: false },
                    { uid: 'm2', thanhtoan: false },
                    { uid: 'm4', thanhtoan: false },
                ],
                expectedCallTimes: 3,
            },
            { bets: null, expectedCallTimes: 0 },
        ];
        it.each(testCases)('should call settleGameRoundConsumer.settleBets with correct unsettled bets', async (testCase) => {
            // arrange
            const betsRepository = stubMongooseModelStupidly(mongoose.Model);
            betsRepository.find().lean().exec.mockReturnValueOnce(testCase.bets);

            const settleGameRoundConsumer = { settleBets: jest.fn() };

            const consumer = new ProcessCorruptedBetsConsumer(betsRepository, settleGameRoundConsumer);

            // act
            await consumer.consume();

            // assert
            expect(settleGameRoundConsumer.settleBets).toHaveBeenCalledTimes(testCase.expectedCallTimes);
        });
    });
});
