import { Table } from 'sc-game-base';
import { InjectionMode } from 'awilix';
import ServiceContainerRegistry from '../service-container-registry';

jest.mock(
    'awilix',
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

describe('service-container-registry', () => {
    // arrange
    const defaultInjectionMode = InjectionMode.CLASSIC;

    describe('extends', () => {
        it('inherit Table.TableContainerRegistry', () => {
            // arrange
            const containerRegistry = new ServiceContainerRegistry();

            //assert
            expect(containerRegistry instanceof Table.TableContainerRegistry);
        });
    });

    describe('registerModels', () => {
        it('should register correct Models', () => {
            // arrange
            const containerRegistry = new ServiceContainerRegistry(defaultInjectionMode);
            containerRegistry.container = { register: jest.fn() };

            // act
            containerRegistry.registerModels();

            //assert
            expect(containerRegistry.container.register).toBeCalledWith({
                roundsRepository: expect.any(Function),
                betsRepository: expect.any(Function),
                betLogsRepository: expect.any(Function),
            });
        });
    });

    describe('registerConsumers', () => {
        it('should register correct consumers', () => {
            // arrange
            const containerRegistry = new ServiceContainerRegistry(defaultInjectionMode);
            containerRegistry.container = { register: jest.fn() };

            // act
            containerRegistry.registerConsumers();

            //assert
            expect(containerRegistry.container.register).toBeCalledWith({
                placeBetConsumer: expect.any(Object),
                settleGameRoundConsumer: expect.any(Function),
                dealConsumer: expect.any(Object),
                collectConsumer: expect.any(Object),
            });
        });
    });

    describe('registerRouters', () => {
        it('should register correct routers', () => {
            // arrange
            const containerRegistry = new ServiceContainerRegistry(defaultInjectionMode);
            containerRegistry.container = { register: jest.fn() };

            // act
            containerRegistry.registerRouters();

            //assert
            expect(containerRegistry.container.register).toBeCalledWith({
                socketRouter: expect.any(Function),
                httpRouter: expect.any(Object),
            });
        });
    });

    describe('registerCrons', () => {
        it('should register correct Crons', () => {
            // arrange
            const containerRegistry = new ServiceContainerRegistry(defaultInjectionMode);
            containerRegistry.container = { register: jest.fn() };

            // act
            containerRegistry.registerCrons();

            //assert
            expect(containerRegistry.container.register).toBeCalledWith({
                gameCron: expect.any(Function),
                processBetQueue: expect.any(Function),
                bot: expect.any(Object),
            });
        });
    });

    describe('registerApis', () => {
        it('should register correct query apis', () => {
            // arrange
            const containerRegistry = new ServiceContainerRegistry(defaultInjectionMode);
            containerRegistry.container = { register: jest.fn() };

            // act
            containerRegistry.registerApis();

            //assert
            expect(containerRegistry.container.register).toBeCalledWith({
                roundQuery: expect.any(Object),
                historyQuery: expect.any(Object),
            });
        });
    });
});
