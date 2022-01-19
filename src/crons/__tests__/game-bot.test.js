import { Core } from "sc-game-base";
import { GameBot } from "../index";

const userInfosRepository = {
    noOfDocuments: 10,
    countDocuments: () => {
        return { exec: () => userInfosRepository.noOfDocuments };
    },
};

describe("game-bot", () => {
    describe("extends", () => {
        it("inherit Core.Crons.BaseBot", () => {
            // act
            const cron = new GameBot({});

            //assert
            expect(cron instanceof Core.Crons.BaseBot);
        });
    });

    describe("placeBet", () => {
        it("when not have config should not increase round id", async () => {
            // arrange
            const gameData = { gameConfigs: null, roundId: 10 };
            const cron = new GameBot({}, gameData);
            const expectedValue = 10;

            // act
            await cron.run();

            //assert
            expect(gameData.roundId).toBe(expectedValue);
        });

        it("when bot not enabled should not increase round id", async () => {
            // arrange
            const gameData = { gameConfigs: { botenabled: false }, roundId: 10 };
            const cron = new GameBot({}, gameData);
            const expectedValue = 10;

            // act
            await cron.run();

            //assert
            expect(gameData.roundId).toBe(expectedValue);
        });

        it("when maxNumberOfBots=0 should not increase round id", async () => {
            // arrange
            const gameData = {
                gameConfigs: {
                    botenabled: true,
                    hour_maxbot: Array(24).fill(10),
                },
                roundId: 10,
            };

            userInfosRepository.noOfDocuments = 0;
            const cron = new GameBot({}, gameData, userInfosRepository);
            const expectedValue = 10;

            // act
            await cron.run();

            //assert
            expect(gameData.roundId).toBe(expectedValue);
        });

        it("when maxNumberOfBots>0 should increase round id in range 1 -> maxNumberOfBots", async () => {
            // arrange
            const gameData = {
                gameConfigs: {
                    botenabled: true,
                    hour_maxbot: Array(24).fill(10),
                },
                roundId: 10,
            };

            userInfosRepository.noOfDocuments = 10;
            const cron = new GameBot({}, gameData, userInfosRepository);
            spyOn(cron, "processDisabledBots");
            await cron.reset();

            // act
            await cron.run();

            //assert
            expect(11 <= gameData.roundId && gameData.roundId <= 110).toBeTruthy();
        });
    });
});
