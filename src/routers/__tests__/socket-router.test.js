import { Core } from "sc-game-base";
import { SocketRouter } from "../index";
import { DealConsumer, CollectConsumer } from "../../event-consumers";
import { stub } from "jest-micro-auto-stub";
import { player1 } from "../../__tests__/set-up";

describe("socket-router", () => {
    let router;
    beforeEach(() => {
        // Arrange
        const dealConsumer = stub(DealConsumer);
        const collectConsumer = stub(CollectConsumer);
        router = new SocketRouter({ dealConsumer, collectConsumer });
        router.logService = { logError: jest.fn() };
    });

    describe("extends", () => {
        it("inherit Core.Routers.BaseSocketRouter", () => {
            // Assert
            expect(router instanceof Core.Routers.BaseSocketRouter);
        });
    });

    describe("init", () => {
        let socketClient;
        beforeEach(() => {
            // Arrange
            socketClient = { on: jest.fn() };

            // Act
            router.init(socketClient);
        });

        it("should register deal event", () => {
            // Assert
            expect(socketClient.on).toBeCalledWith("deal", expect.any(Function));
        });

        it("should register collect event", () => {
            // Assert
            expect(socketClient.on).toBeCalledWith("collect", expect.any(Function));
        });
    });

    describe("handleDeal", () => {
        describe("when have error", () => {
            it("should logError", async () => {
                // Arrange
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
                router.gameData = { realPlayers: {} };
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
                router.gameData = { realPlayers: { [player1.socketId]: {} } };
                router.socketClient = { id: player1.socketId };

                spyOn(router, "verify").and.returnValue(true);

                // Act
                await router.handleDeal();

                // Assert
                expect(router.dealConsumer.consume).toHaveBeenCalledWith({}, undefined);
            });
        });
    });

    describe("handleCollect", () => {
        describe("when have error", () => {
            it("should logError", async () => {
                // Arrange
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
                router.gameData = { realPlayers: {} };
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
                router.gameData = { realPlayers: { [player1.socketId]: {} } };
                router.socketClient = { id: player1.socketId };

                spyOn(router, "verify").and.returnValue(true);

                // Act
                await router.handleCollect();

                // Assert
                expect(router.collectConsumer.consume).toHaveBeenCalledWith({});
            });
        });
    });
});
