import { GameClientDriver, normalUser } from 'sc-game-service-integration-utils';
import { socketOptions } from './stubs/test-data';
import { initUserSession } from './helpers';
import gameSettings from '../../src/game-settings';

const JEST_ASSERT_WAITING_RESPONSE_TIMEOUT = 60000;

describe('event deal', () => {
    beforeAll(() => {
        // set timeout for jest, waiting for socket response
        jest.setTimeout(JEST_ASSERT_WAITING_RESPONSE_TIMEOUT);
    });

    describe('Happy Path Cases', () => {
        let gameClientDriver;
        beforeAll(() => {
            // Arrange
            gameClientDriver = new GameClientDriver(socketOptions, initUserSession(normalUser));
        });

        afterAll(() => {
            gameClientDriver.close();
        });

        it('should start and allow game client connect to.', (done) => {
            // Assert
            gameClientDriver.handleSignedInEvent(() => {
                done();
            });
        });

        it('when deal is valid should return endBet=1', (done) => {
            // arrange
            gameClientDriver.sendBetEvent(null, 100);

            let startDeal = false;
            gameClientDriver.handleEndBetEvent((endBetData) => {
                if (endBetData?.endBet) {
                    startDeal = true;
                    gameClientDriver.emit('deal', { betChoice: 'h' });
                }
            });

            // Assert
            gameClientDriver.on(gameSettings.name, (endBetData) => {
                if (startDeal && endBetData?.endBet) {
                    done();
                }
            });
        });
    });
});
