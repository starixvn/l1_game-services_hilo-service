import { Core } from "sc-game-base";
import { SocketRouter } from "../index";

describe("socket-router", () => {
    let router;
    beforeEach(() => {
        // Arrange
        router = new SocketRouter({});
    });

    describe("extends", () => {
        it("inherit Core.Routers.BaseSocketRouter", () => {
            // Assert
            expect(router instanceof Core.Routers.BaseSocketRouter);
        });
    });

    describe("init", () => {
        it("should register correct events", () => {
            // Arrange
            const socketClient = { on: jest.fn() };

            // Act
            router.init(socketClient);

            // Assert
            expect(socketClient.on).toBeCalledWith("deal", expect.any(Function));
            expect(socketClient.on).toBeCalledWith("collect", expect.any(Function));
        });
    });

    describe("handleDeal", () => {
        describe("when have error", () => {
            it("should logError", async () => {
                // Arrange
                router.logService = { logError: jest.fn() };
                router.gameData = { realPlayers: null };

                // Act
                await router.handleDeal();

                // Assert
                expect(router.logService.logError).toHaveBeenCalled();
            });
        });

        describe("when verify failed", () => {
            it("should not call dealConsumer.consume", async () => {
                // Arrange
                router.logService = { logError: jest.fn() };
                router.gameData = { realPlayers: {} };
                router.dealConsumer = { consume: jest.fn() };
                spyOn(router, "verify").and.returnValue(false);

                // Act
                await router.handleDeal();

                // Assert
                expect(router.dealConsumer.consume).not.toBeCalled();
            });
        });

        describe("when verify passed", () => {
            it("should call dealConsumer.consume", async () => {
                // Arrange
                router.logService = { logError: jest.fn() };
                router.gameData = { realPlayers: { s1: {} } };
                router.dealConsumer = { consume: jest.fn() };
                router.socketClient = { id: "s1" };

                spyOn(router, "verify").and.returnValue(true);

                // Act
                await router.handleDeal();

                // Assert
                expect(router.dealConsumer.consume).toBeCalled();
            });
        });
    });

    describe("handleCollect", () => {
        describe("when have error", () => {
            it("should logError", async () => {
                // Arrange
                router.logService = { logError: jest.fn() };
                router.gameData = { realPlayers: null };

                // Act
                await router.handleCollect();

                // Assert
                expect(router.logService.logError).toHaveBeenCalled();
            });
        });

        describe("when verify failed", () => {
            it("should not call collectConsumer.consume", async () => {
                // Arrange
                router.logService = { logError: jest.fn() };
                router.gameData = { realPlayers: {} };
                router.collectConsumer = { consume: jest.fn() };
                spyOn(router, "verify").and.returnValue(false);

                // Act
                await router.handleCollect();

                // Assert
                expect(router.collectConsumer.consume).not.toBeCalled();
            });
        });

        describe("when verify passed", () => {
            it("should call collectConsumer.consume", async () => {
                // Arrange
                router.logService = { logError: jest.fn() };
                router.gameData = { realPlayers: { s1: {} } };
                router.collectConsumer = { consume: jest.fn() };
                router.socketClient = { id: "s1" };

                spyOn(router, "verify").and.returnValue(true);

                // Act
                await router.handleCollect();

                // Assert
                expect(router.collectConsumer.consume).toBeCalled();
            });
        });
    });
});
