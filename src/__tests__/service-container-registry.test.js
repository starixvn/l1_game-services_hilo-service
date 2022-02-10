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
    // arrange
    const defaultInjectionMode = InjectionMode.CLASSIC;
    let containerRegistry;

    beforeEach(() => {
        // arrange
        containerRegistry = new ServiceContainerRegistry(defaultInjectionMode);
        containerRegistry.container = { register: jest.fn() };
    });

    describe("extends", () => {
        it("inherit Core.ContainerRegistry", () => {
            // assert
            expect(containerRegistry instanceof Core.ContainerRegistry);
        });
    });

    describe("registerModels", () => {
        it("should register correct Models", () => {
            // act
            containerRegistry.registerModels();

            // assert
            expect(containerRegistry.container.register).toBeCalledWith({
                roundsRepository: expect.any(Function),
                betLogsRepository: expect.any(Function),
            });
        });
    });

    describe("registerConsumers", () => {
        it("should register correct consumers", () => {
            // act
            containerRegistry.registerConsumers();

            // assert
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
            // act
            containerRegistry.registerRouters();

            // assert
            expect(containerRegistry.container.register).toBeCalledWith({
                socketRouter: expect.any(Function),
                httpRouter: expect.any(Object),
            });
        });
    });

    describe("registerCrons", () => {
        it("should register correct Crons", () => {
            // act
            containerRegistry.registerCrons();

            // assert
            expect(containerRegistry.container.register).toBeCalledWith({
                gameCron: expect.any(Function),
                processBetQueue: expect.any(Function),
                bot: expect.any(Object),
            });
        });
    });

    describe("registerApis", () => {
        it("should register correct query apis", () => {
            // arrange
            const containerRegistry = new ServiceContainerRegistry(defaultInjectionMode);
            containerRegistry.container = { register: jest.fn() };

            // act
            containerRegistry.registerApis();

            // assert
            expect(containerRegistry.container.register).toBeCalledWith({
                roundQuery: expect.any(Object),
                historyQuery: expect.any(Object),
            });
        });
    });
});
