import { GameClientDriver, normalUser } from "sc-game-service-integration-utils";
import { socketOptions } from "./stubs/set-up";
import { initUserSession } from "./helpers";

const JEST_ASSERT_WAITING_RESPONSE_TIMEOUT = 60000;

describe("event bet", () => {
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

    describe("when valid bet", () => {
        it("should return endBet info with runningRound", (done) => {
            // Act
            gameClientDriver.sendBetEvent(null, 10);

            // Assert
            gameClientDriver.handleEndBetEvent((endBetData) => {
                if (endBetData?.endBet) {
                    expect(endBetData.runningRound).not.toBeNull();
                    done();
                }
            });
        });
    });

    describe("when bet with amount < min", () => {
        it("should return endBet error", (done) => {
            // Act
            gameClientDriver.sendBetEvent(null, 1);

            // Assert
            gameClientDriver.handleEndBetEvent((endBetData) => {
                if (endBetData?.endBet) {
                    expect(endBetData.endBet).toBe(-1);
                    done();
                }
            });
        });
    });

    describe("when bet with amount > max", () => {
        it("should return endBet error", (done) => {
            // Act
            gameClientDriver.sendBetEvent(null, 2000);

            // Assert
            gameClientDriver.handleEndBetEvent((endBetData) => {
                if (endBetData?.endBet) {
                    expect(endBetData.endBet).toBe(-1);
                    done();
                }
            });
        });
    });

    describe("when already bet", () => {
        it("should return endBet error", (done) => {
            // Act
            gameClientDriver.sendBetEvent(null, 100);
            let betCount = 1;

            // Assert
            gameClientDriver.handleEndBetEvent((endBetData) => {
                if (betCount === 1 && endBetData?.endBet) {
                    betCount++;
                    gameClientDriver.sendBetEvent(null, 100);
                }

                if (betCount === 2 && endBetData?.endBet) {
                    expect(endBetData.endBet).toBe(-1);
                    done();
                }
            });
        });
    });
});
