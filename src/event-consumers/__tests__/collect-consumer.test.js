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
            const gameData = { ingame: { m1: { betTracks: {} } } };
            const consumer = new CollectConsumer(null, gameData, publisher);
            spyOn(consumer, 'validate').and.returnValue({ failed: true });
            const player = { UID: 'm1', profile: { name: 'm1' } };

            // act
            await consumer.consume(player);

            //assert
            expect(publisher.publishToUser).toBeCalledWith('m1', expect.objectContaining({ isCollect: -1, failed: true }));
        });

        const testCases = [{ betQueue: null }, { betQueue: [] }];
        it.each(testCases)('when validate passed should push collect info to queue', async (testCase) => {
            // arrange
            const publisher = { publishToUser: jest.fn() };
            const gameData = { ingame: { m1: { betQueue: testCase.betQueue }, betTracks: { id: 2 } } };
            const settleGameRoundConsumer = { settleBets: jest.fn() };
            const definition = { durations: {} };
            const consumer = new CollectConsumer(definition, gameData, publisher, settleGameRoundConsumer);
            spyOn(consumer, 'validate').and.returnValue(null);
            const player = { UID: 'm1', profile: { name: 'm1' } };

            // act
            await consumer.consume(player);

            //assert
            expect(gameData.ingame.m1.betQueue.length > 0).toBeTruthy();
        });
    });
});
