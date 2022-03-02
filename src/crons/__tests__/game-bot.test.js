import { Core } from "sc-game-base";
import { GameBot } from "../index";

const userInfosRepository = {
    noOfDocuments: 10,
    countDocuments: () => {
        return { exec: () => userInfosRepository.noOfDocuments };
    },
};

describe("GameBot", () => {
    let cron;
    beforeEach(() => {
        // Arrange
        cron = new GameBot({}, null, userInfosRepository);
    });

    it("inherit Core.Crons.BaseBot", () => {
        // Assert
        expect(cron instanceof Core.Crons.BaseBot);
    });

    describe("run", () => {
        describe("when not have config", () => {
            it("should not increase round id", async () => {
                // Arrange
                cron.gameData = { gameConfigs: null, roundId: 10 };
                const expectedValue = 10;

                // Act
                await cron.run();

                // Assert
                expect(cron.gameData.roundId).toBe(expectedValue);
            });
        });

        describe("when bot not enabled ", () => {
            it("should not increase round id", async () => {
                // Arrange
                cron.gameData = { gameConfigs: { botenabled: false }, roundId: 10 };
                const expectedValue = 10;

                // Act
                await cron.run();

                // Assert
                expect(cron.gameData.roundId).toBe(expectedValue);
            });
        });

        describe("when maxNumberOfBots=0", () => {
            it("should not increase round id", async () => {
                // Arrange
                cron.gameData = {
                    gameConfigs: {
                        botenabled: true,
                        hour_maxbot: Array(24).fill(10),
                    },
                    roundId: 10,
                };

                userInfosRepository.noOfDocuments = 0;
                const expectedValue = 10;

                // Act
                await cron.run();

                // Assert
                expect(cron.gameData.roundId).toBe(expectedValue);
            });
        });

        describe("when maxNumberOfBots>0", () => {
            it("should increase round id in range 1 -> maxNumberOfBots", async () => {
                // Arrange
                cron.gameData = {
                    gameConfigs: {
                        botenabled: true,
                        hour_maxbot: Array(24).fill(10),
                    },
                    roundId: 10,
                };

                userInfosRepository.noOfDocuments = 10;
                spyOn(cron, "processDisabledBots");
                await cron.reset();

                // Act
                await cron.run();

                // Assert
                expect(11 <= cron.gameData.roundId && cron.gameData.roundId <= 110).toBeTruthy();
            });
        });
    });
});
