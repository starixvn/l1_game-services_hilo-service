import { GameClientDriver, normalUser } from "sc-game-service-integration-utils";
import { socketOptions } from "./stubs/set-up";
import { initUserSession } from "./helpers";
import gameSettings from "../../src/game-settings";

const JEST_ASSERT_WAITING_RESPONSE_TIMEOUT = 60000;

describe("event deal - already have running round", () => {
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

    describe("when deal is valid", () => {
        it("should return endDeal", (done) => {
            // Arrange
            gameClientDriver.sendBetEvent(null, 20);
            let startDeal = false;
            const endDealFunc = (endBetData) => {
                if (startDeal && endBetData?.endDeal) {
                    done();
                }
            };

            gameClientDriver.handleEndBetEvent((endBetData) => {
                if (endBetData?.endBet) {
                    startDeal = true;
                    gameClientDriver.on(gameSettings.name, endDealFunc);
                    gameClientDriver.emit("deal", { betChoice: "h" });
                }
            });
        });
    });
});

describe("event deal - not yet have running round", () => {
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

    it("should return endDeal=-1", (done) => {
        // Arrange
        gameClientDriver.emit("collect", null);

        // Assert
        gameClientDriver.on(gameSettings.name, (resp) => {
            if (resp.isCollect || resp.settlementResult !== null) {
                gameClientDriver.emit("deal", { betChoice: "l" });
                done();
            }

            if (resp?.endDeal && resp.bet?.betChoice === "l") {
                expect(resp.endDeal).toBe(-1);
                done();
            }
        });
    });
});
