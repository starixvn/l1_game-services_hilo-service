import { GameClientDriver, normalUser } from "sc-game-service-integration-utils";
import { socketOptions } from "./stubs/test-data";
import { initUserSession } from "./helpers";
import gameSettings from "../../src/game-settings";

const JEST_ASSERT_WAITING_RESPONSE_TIMEOUT = 60000;

describe("event get history", () => {
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
            gameClientDriver.sendBetEvent(null, 100);
            gameClientDriver.handleEndBetEvent((endBetData) => {
                if (endBetData?.endBet) {
                    gameClientDriver.emit("deal", { betChoice: "l" });
                    done();
                }
            });
        });
    });

    it("should return bets with details", async (done) => {
        // Arrange
        gameClientDriver.emit("collect", null);

        // Act
        gameClientDriver.on(gameSettings.name, (resp) => {
            if (resp.isCollect || resp.settlementResult !== null) {
                gameClientDriver.sendGetHistoryEvent();
                gameClientDriver.handleGetHistoryEvent((betHistoryData) => {
                    if (betHistoryData?.history) {
                        expect(betHistoryData.history.betLogs).not.toBeNull();
                        done();
                    }
                });
            }
        });
    });
});
