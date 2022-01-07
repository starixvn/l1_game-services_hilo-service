import { GameClientDriver, normalUser } from 'sc-game-service-integration-utils';
import { socketOptions } from './stubs/test-data';
import { initUserSession } from './helpers';

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

        it('should return game configs, odds', (done) => {
            // Act
            gameClientDriver.sendInGameEvent();

            // Assert
            gameClientDriver.handleInGameEvent((inGameData) => {
                expect(inGameData.gameConfigs).not.toBeNull();
                expect(inGameData.odds).not.toBeNull();
                done();
            });
        });
    });
});
