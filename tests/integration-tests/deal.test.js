import { GameClientDriver, normalUser } from "sc-game-service-integration-utils";
import { socketOptions } from "./stubs/test-data";
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
        it("should return endBet", (done) => {
            // arrange
            gameClientDriver.sendBetEvent(null, 20);
            let startDeal = false;
            const endDealFunc = (endBetData) => {
                if (startDeal && endBetData?.endBet) {
                    done();
                }
            };

            gameClientDriver.handleEndBetEvent((endBetData) => {
                if (endBetData?.endBet) {
                    startDeal = true;
                    gameClientDriver.emit("deal", { betChoice: "h" });
                    gameClientDriver.on(gameSettings.name, endDealFunc);
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

    it("should return endBet=-1", (done) => {
        // arrange
        gameClientDriver.emit("collect", null);

        // Assert
        gameClientDriver.on(gameSettings.name, (resp) => {
            if (resp.isCollect || resp.settlementResult !== null) {
                gameClientDriver.emit("deal", { betChoice: "l" });
                done();
            }

            if (resp?.endBet && resp.bet?.betChoice === "l") {
                expect(resp.endBet).toBe(-1);
                done();
            }
        });
    });
});
