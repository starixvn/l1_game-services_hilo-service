import { Core } from "sc-game-base";
import { SocketRouter } from "../index";

describe("socket-router", () => {
    describe("extends", () => {
        it("inherit Core.Routers.BaseSocketRouter", () => {
            // act
            const cron = new SocketRouter({});

            // assert
            expect(cron instanceof Core.Routers.BaseSocketRouter);
        });
    });

    describe("init", () => {
        it("should register correct events", () => {
            // arrange
            const socketRouter = new SocketRouter({});
            const socketClient = { on: jest.fn() };

            // act
            socketRouter.init(socketClient);

            // assert
            expect(socketClient.on).toBeCalledWith("deal", expect.any(Function));
            expect(socketClient.on).toBeCalledWith("collect", expect.any(Function));
        });
    });

    describe("handleDeal", () => {
        it("when have error should logError", async () => {
            // arrange
            const logService = { logError: jest.fn() };
            const gameData = { realPlayers: null };
            const socketRouter = new SocketRouter({ logService, gameData });

            // act
            await socketRouter.handleDeal();

            // assert
            expect(logService.logError).toHaveBeenCalled();
        });

        it("when verify failed should not call dealConsumer.consume", async () => {
            // arrange
            const logService = { logError: jest.fn() };
            const gameData = { realPlayers: {} };
            const dealConsumer = { consume: jest.fn() };
            const socketRouter = new SocketRouter({ logService, gameData, dealConsumer });
            spyOn(socketRouter, "verify").and.returnValue(false);

            // act
            await socketRouter.handleDeal();

            // assert
            expect(dealConsumer.consume).not.toBeCalled();
        });

        it("when verify passed should call dealConsumer.consume", async () => {
            // arrange
            const logService = { logError: jest.fn() };
            const gameData = { realPlayers: { s1: {} } };
            const dealConsumer = { consume: jest.fn() };

            const socketRouter = new SocketRouter({ logService, gameData, dealConsumer });
            socketRouter.socketClient = { id: "s1" };

            spyOn(socketRouter, "verify").and.returnValue(true);

            // act
            await socketRouter.handleDeal();

            // assert
            expect(dealConsumer.consume).toBeCalled();
        });
    });

    describe("handleCollect", () => {
        it("when have error should logError", async () => {
            // arrange
            const logService = { logError: jest.fn() };
            const gameData = { realPlayers: null };
            const socketRouter = new SocketRouter({ logService, gameData });

            // act
            await socketRouter.handleCollect();

            // assert
            expect(logService.logError).toHaveBeenCalled();
        });

        it("when verify failed should not call collectConsumer.consume", async () => {
            // arrange
            const logService = { logError: jest.fn() };
            const gameData = { realPlayers: {} };
            const collectConsumer = { consume: jest.fn() };
            const socketRouter = new SocketRouter({ logService, gameData, collectConsumer });
            spyOn(socketRouter, "verify").and.returnValue(false);

            // act
            await socketRouter.handleCollect();

            // assert
            expect(collectConsumer.consume).not.toBeCalled();
        });

        it("when verify passed should call collectConsumer.consume", async () => {
            // arrange
            const logService = { logError: jest.fn() };
            const gameData = { realPlayers: { s1: {} } };
            const collectConsumer = { consume: jest.fn() };

            const socketRouter = new SocketRouter({ logService, gameData, collectConsumer });
            socketRouter.socketClient = { id: "s1" };

            spyOn(socketRouter, "verify").and.returnValue(true);

            // act
            await socketRouter.handleCollect();

            // assert
            expect(collectConsumer.consume).toBeCalled();
        });
    });
});
