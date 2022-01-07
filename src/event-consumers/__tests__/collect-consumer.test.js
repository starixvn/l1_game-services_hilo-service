import errorCodes from '../../constants/error-codes';
import { CollectConsumer } from '../index';

describe('collect-consumer', () => {
    describe('validate', () => {
        // arrange
        const testCases = [
            { runningRound: null, expectedValue: { notice: errorCodes.roundEnded } },
            { runningRound: { totalTurns: 0 }, expectedValue: { notice: errorCodes.cannotCollect } },
            { runningRound: { totalTurns: 10 }, expectedValue: null },
        ];

        it.each(testCases)('should return correct value', (testCase) => {
            // arrange
            const consumer = new CollectConsumer();

            // act
            const actualValue = consumer.validate(testCase.runningRound);

            //assert
            expect(actualValue).toStrictEqual(testCase.expectedValue);
        });
    });

    describe('consume', () => {
        it('when validate failed should publish error to user', async () => {
            // arrange
            const publisher = { publishToUser: jest.fn() };
            const gameData = { runningRounds: { m1: {} } };
            const consumer = new CollectConsumer(null, gameData, publisher);
            spyOn(consumer, 'validate').and.returnValue({ failed: true });
            const playerUid = 'm1';

            // act
            await consumer.consume(playerUid);

            //assert
            expect(publisher.publishToUser).toBeCalledWith('m1', expect.objectContaining({ isCollect: false, failed: true }));
        });

        it('when validate passed should call settleGameRoundConsumer.settleBets', async () => {
            // arrange
            const publisher = { publishToUser: jest.fn() };
            const gameData = { runningRounds: { m1: { phien: 2 } } };
            const settleGameRoundConsumer = { settleBets: jest.fn() };
            const definition = { durations: {} };
            const consumer = new CollectConsumer(definition, gameData, publisher, settleGameRoundConsumer);
            spyOn(consumer, 'validate').and.returnValue(null);
            const playerUid = 'm1';

            // act
            await consumer.consume(playerUid);

            //assert
            expect(settleGameRoundConsumer.settleBets).toBeCalledWith(expect.objectContaining({ roundId: 2 }));
        });
    });
});
