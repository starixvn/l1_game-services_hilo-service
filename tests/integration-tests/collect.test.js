import { GameClientDriver, normalUser } from "sc-game-service-integration-utils";
import { socketOptions } from "./stubs/set-up";
import { initUserSession } from "./helpers";
import gameSettings from "../../src/game-settings";

const JEST_ASSERT_WAITING_RESPONSE_TIMEOUT = 60000;

describe("event collect - already have running round", () => {
    let gameClientDriver;
    beforeAll(() => {
        // set timeout for jest, waiting for socket response
        jest.setTimeout(JEST_ASSERT_WAITING_RESPONSE_TIMEOUT);
        gameClientDriver = new GameClientDriver(socketOptions, initUserSession(normalUser));
    });

    afterAll(() => {
        gameClientDriver.close();
    });

    it("should start and allow game client connect to.", (done) => {
        // Assert
        gameClientDriver.handleSignedInEvent(() => {
            done();
        });
    });

    it("should return isCollect=-1 or have settlementResult", (done) => {
        // Arrange
        gameClientDriver.sendBetEvent(null, 100);
        let startCollect = false;
        const endCollectFunc = (resp) => {
            if (startCollect && (resp.isCollect === -1 || resp.settlementResult !== null)) {
                done();
            }
        };

        gameClientDriver.handleEndBetEvent((endBetData) => {
            if (endBetData?.endBet) {
                startCollect = true;
                gameClientDriver.emit("collect", null);
                gameClientDriver.on(gameSettings.name, endCollectFunc);
            }
        });
    });
});

describe("event collect - not yet have running round", () => {
    let gameClientDriver;
    beforeAll(() => {
        // set timeout for jest, waiting for socket response
        jest.setTimeout(JEST_ASSERT_WAITING_RESPONSE_TIMEOUT);
        gameClientDriver = new GameClientDriver(socketOptions, initUserSession(normalUser));
    });

    afterAll(() => {
        gameClientDriver.close();
    });

    it("should start and allow game client connect to.", (done) => {
        // Assert
        gameClientDriver.handleSignedInEvent(() => {
            done();
        });
    });

    it("should return isCollect=-1", (done) => {
        //Act
        gameClientDriver.emit("collect", null);

        // Assert
        gameClientDriver.on(gameSettings.name, (resp) => {
            if (resp.isCollect) {
                expect(resp.isCollect).toBe(-1);
                done();
            }
        });
    });
});
