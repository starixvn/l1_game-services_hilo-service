import { Core } from "sc-game-base";
import { InjectionMode } from "awilix";
import ServiceContainerRegistry from "../service-container-registry";

jest.mock(
    "awilix",
    () => {
        return {
            asClass: (t) => {
                return {
                    proxy: () => t,
                    singleton: () => {
                        return { proxy: jest.fn(() => t) };
                    },
                };
            },
            asValue: jest.fn((t) => t),
            InjectionMode: jest.fn(() => {}),
            createContainer: jest.fn(() => {}),
        };
    },
    { virtual: true }
);

describe("service-container-registry", () => {
    const defaultInjectionMode = InjectionMode.CLASSIC;
    let containerRegistry;

    beforeEach(() => {
        // Arrange
        containerRegistry = new ServiceContainerRegistry(defaultInjectionMode);
        containerRegistry.container = { register: jest.fn() };
    });

    describe("extends", () => {
        it("inherit Core.ContainerRegistry", () => {
            // Assert
            expect(containerRegistry instanceof Core.ContainerRegistry);
        });
    });

    describe("registerModels", () => {
        it("should register correct Models", () => {
            // Act
            containerRegistry.registerModels();

            // Assert
            expect(containerRegistry.container.register).toBeCalledWith({
                roundsRepository: expect.any(Function),
                betLogsRepository: expect.any(Function),
            });
        });
    });

    describe("registerConsumers", () => {
        it("should register correct consumers", () => {
            // Act
            containerRegistry.registerConsumers();

            // Assert
            expect(containerRegistry.container.register).toBeCalledWith({
                inGameConsumer: expect.any(Object),
                placeBetConsumer: expect.any(Object),
                settleGameRoundConsumer: expect.any(Function),
                dealConsumer: expect.any(Object),
                collectConsumer: expect.any(Object),
                settleTurnConsumer: expect.any(Function),
            });
        });
    });

    describe("registerRouters", () => {
        it("should register correct routers", () => {
            // Act
            containerRegistry.registerRouters();

            // Assert
            expect(containerRegistry.container.register).toBeCalledWith({
                socketRouter: expect.any(Function),
                httpRouter: expect.any(Object),
            });
        });
    });

    describe("registerCrons", () => {
        it("should register correct Crons", () => {
            // Act
            containerRegistry.registerCrons();

            // Assert
            expect(containerRegistry.container.register).toBeCalledWith({
                gameCron: expect.any(Function),
                processBetQueue: expect.any(Function),
                bot: expect.any(Object),
            });
        });
    });

    describe("registerApis", () => {
        it("should register correct query apis", () => {
            // Arrange
            containerRegistry.container = { register: jest.fn() };

            // Act
            containerRegistry.registerApis();

            // Assert
            expect(containerRegistry.container.register).toBeCalledWith({
                roundQuery: expect.any(Object),
                historyQuery: expect.any(Object),
            });
        });
    });
});
