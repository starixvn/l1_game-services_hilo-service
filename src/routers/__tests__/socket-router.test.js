import { Core } from 'sc-game-base';
import { helpers } from 'sc-common';
import { SocketRouter } from '../index';
import gameSettings from '../../game-settings';

describe('socket-router', () => {
    describe('extends', () => {
        it('inherit Core.Routers.BaseSocketRouter', () => {
            // act
            const cron = new SocketRouter({});

            //assert
            expect(cron instanceof Core.Routers.BaseSocketRouter);
        });
    });

    describe('init', () => {
        it('should register correct events', () => {
            // arrange
            const gameSocketRouter = new SocketRouter({});
            const socketClient = { on: jest.fn() };

            // act
            gameSocketRouter.init(socketClient);

            //assert
            expect(socketClient.on).toBeCalledWith('newGame', expect.any(Function));
            expect(socketClient.on).toBeCalledWith('anNon', expect.any(Function));
        });
    });

    describe('handleNewGame', () => {
        // arrange
        const gameData = {
            realPlayers: {
                m1: { UID: 'm1' },
                m2: { UID: 'm2' },
                m3: { UID: 'm3', profile: { name: 'm3' } },
                m4: { UID: 'm4', profile: { name: 'm4' }, session: {} },
            },
            runningRounds: { m1: { uid: 'm1' } },
            ingame: { m1: { betQueue: [] }, m3: { betQueue: [] } },
        };

        it('when has error should log error', async () => {
            // arrange
            const logService = { logError: jest.fn() };
            const gameSocketRouter = new SocketRouter({ logService });
            gameSocketRouter.verify = () => {
                throw 'Error';
            };

            // act
            await gameSocketRouter.handleNewGame();

            //assert
            expect(logService.logError).toBeCalled();
        });

        it('when not has payload should not validateNewGame', async () => {
            // arrange
            const logService = { logError: jest.fn() };
            const gameSocketRouter = new SocketRouter({ logService });
            spyOn(gameSocketRouter, 'verify').and.returnValue(true);
            spyOn(gameSocketRouter, 'validateNewGame');
            const payload = null;

            // act
            await gameSocketRouter.handleNewGame(payload);

            //assert
            expect(gameSocketRouter.validateNewGame).not.toBeCalled();
        });

        it('when not has amount should not validateNewGame', async () => {
            // arrange
            const logService = { logError: jest.fn() };
            const gameSocketRouter = new SocketRouter({ logService });
            spyOn(gameSocketRouter, 'verify').and.returnValue(true);
            spyOn(gameSocketRouter, 'validateNewGame');
            const payload = { amount: 0 };

            // act
            await gameSocketRouter.handleNewGame(payload);

            //assert
            expect(gameSocketRouter.validateNewGame).not.toBeCalled();
        });

        it('when has running round should not validateNewGame', async () => {
            // arrange
            const logService = { logError: jest.fn() };
            const definition = {};
            const gameSocketRouter = new SocketRouter({ logService, gameData, definition });
            gameSocketRouter.socketClient = { id: 'm1', emit: jest.fn() };
            spyOn(gameSocketRouter, 'verify').and.returnValue(true);
            spyOn(gameSocketRouter, 'validateNewGame');
            const payload = { amount: 10 };

            // act
            await gameSocketRouter.handleNewGame(payload);

            //assert
            expect(gameSocketRouter.validateNewGame).not.toBeCalled();
        });

        it('when validateNewGame failed should endBet', async () => {
            // arrange
            const logService = { logError: jest.fn() };
            const definition = { name: 'Hilo' };
            const gameSocketRouter = new SocketRouter({ logService, gameData, definition });
            gameSocketRouter.socketClient = { emit: jest.fn(), id: 'm2' };
            spyOn(gameSocketRouter, 'verify').and.returnValue(true);
            spyOn(gameSocketRouter, 'validateNewGame').and.returnValue({ failed: true });
            const payload = { amount: 10 };

            // act
            await gameSocketRouter.handleNewGame(payload);

            //assert
            expect(gameSocketRouter.socketClient.emit).toBeCalledWith('Hilo', expect.objectContaining({ endBet: -1, failed: true }));
        });

        it('when validateNewGame pass but player already ingame should keep old ingame info', async () => {
            // arrange
            const logService = { logError: jest.fn() };
            const gameData = { realPlayers: { m1: { profile: { name: 'm1' } } }, ingame: { m1: { profile: {} } } };
            const gameSocketRouter = new SocketRouter({ logService, gameData });
            gameSocketRouter.socketClient = { id: 'm1', emit: jest.fn() };
            spyOn(gameSocketRouter, 'verify').and.returnValue(true);
            spyOn(gameSocketRouter, 'validateNewGame').and.returnValue(null);
            const payload = { amount: 10 };
            const expectedInfo = { profile: {} };

            // act
            await gameSocketRouter.handleNewGame(payload);

            //assert
            expect(gameData.ingame['m1']).toStrictEqual(expectedInfo);
        });

        it('when validateNewGame pass and player not ingame should add player to ingame', async () => {
            // arrange
            const logService = { logError: jest.fn() };
            const gameSocketRouter = new SocketRouter({ logService, gameData });
            gameSocketRouter.socketClient = { id: 'm4', emit: jest.fn() };
            spyOn(gameSocketRouter, 'verify').and.returnValue(true);
            spyOn(gameSocketRouter, 'validateNewGame').and.returnValue(null);
            const payload = { amount: 10 };

            // act
            await gameSocketRouter.handleNewGame(payload);

            //assert
            expect(gameData.ingame['m4']).not.toBeUndefined();
        });

        it('when validateNewGame pass and player has betQueue should not add new betQueue', async () => {
            // arrange
            const logService = { logError: jest.fn() };
            const gameData = {
                realPlayers: { m1: { profile: { name: 'm1' }, session: {} } },
                ingame: { m1: { betQueue: [{}] } },
            };

            const gameSocketRouter = new SocketRouter({ logService, gameData });
            gameSocketRouter.socketClient = { id: 'm1', emit: jest.fn() };
            spyOn(gameSocketRouter, 'verify').and.returnValue(true);
            spyOn(gameSocketRouter, 'validateNewGame').and.returnValue(null);
            const payload = { amount: 10 };

            // act
            await gameSocketRouter.handleNewGame(payload);

            //assert
            expect(gameData.ingame['m1'].betQueue.length).toBe(1);
        });

        it('when validateNewGame pass and player does not have betQueue should not add new betQueue', async () => {
            // arrange
            const logService = { logError: jest.fn() };
            const gameSocketRouter = new SocketRouter({ logService, gameData });
            gameSocketRouter.socketClient = { id: 'm4', emit: jest.fn() };
            spyOn(gameSocketRouter, 'verify').and.returnValue(true);
            spyOn(gameSocketRouter, 'validateNewGame').and.returnValue(null);
            const payload = { amount: 10 };

            // act
            await gameSocketRouter.handleNewGame(payload);

            //assert
            expect(gameData.ingame['m4'].betQueue.length).toBe(1);
        });
    });

    describe('handleAnNon', () => {
        it('when has error should log error', async () => {
            // arrange
            const logService = { logError: jest.fn() };
            const gameSocketRouter = new SocketRouter({ logService });
            gameSocketRouter.verify = () => {
                throw 'Error';
            };

            // act
            await gameSocketRouter.handleAnNon();

            //assert
            expect(logService.logError).toBeCalled();
        });

        it('when verify failed should not validateNewGame', async () => {
            // arrange
            const logService = { logError: jest.fn() };
            const gameSocketRouter = new SocketRouter({ logService });
            spyOn(gameSocketRouter, 'verify').and.returnValue(false);
            spyOn(gameSocketRouter, 'validateAnNon');
            const payload = null;

            // act
            await gameSocketRouter.handleAnNon(payload);

            //assert
            expect(gameSocketRouter.validateAnNon).not.toBeCalled();
        });

        it('when validateAnNon failed should return error', async () => {
            // arrange
            const logService = { logError: jest.fn() };
            const gameData = { realPlayers: { m1: { UID: 'm1' } }, runningRounds: {} };
            const definition = { name: 'Hilo' };
            const gameSocketRouter = new SocketRouter({ logService, gameData, definition });
            gameSocketRouter.socketClient = { emit: jest.fn(), id: 'm1' };
            spyOn(gameSocketRouter, 'verify').and.returnValue(true);
            spyOn(gameSocketRouter, 'validateAnNon').and.returnValue({ failed: true });
            const payload = { amount: 10 };

            // act
            await gameSocketRouter.handleAnNon(payload);

            //assert
            expect(gameSocketRouter.socketClient.emit).toBeCalledWith('Hilo', expect.objectContaining({ isAnNon: false, failed: true }));
        });

        it('when validateAnNon pass should set an non flag', async () => {
            // arrange
            const logService = { logError: jest.fn() };
            const gameData = { realPlayers: { m1: { UID: 'm1' } }, runningRounds: { m1: {} } };
            const gameSocketRouter = new SocketRouter({ logService, gameData });
            gameSocketRouter.socketClient = { emit: jest.fn(), id: 'm1' };
            spyOn(gameSocketRouter, 'verify').and.returnValue(true);
            spyOn(gameSocketRouter, 'validateAnNon').and.returnValue(null);
            const payload = { amount: 10 };

            // act
            await gameSocketRouter.handleAnNon(payload);

            //assert
            expect(gameData.runningRounds['m1'].anNon).toBeTruthy();
        });
    });
    describe('validateNewGame', () => {
        it('when game not enabled should return invalidBet', () => {
            // arrange
            const gameData = { gameConfigs: { enabled: false } };
            const gameSocketRouter = new SocketRouter({ gameData });
            const expectedValue = { errorCode: helpers.noticeHelper.invalidBet };
            const player = {};
            const amount = 10;

            // act
            const actualValue = gameSocketRouter.validateNewGame(player, amount);

            //assert
            expect(actualValue).toStrictEqual(expectedValue);
        });

        it('when maxBetPerChoice < amount should return helpers.noticeHelper.maxBetForChoice', () => {
            // arrange
            const gameData = {
                gameConfigs: { enabled: true },
                currencyGroupGames: [{ groupId: 1, maxBetPerChoices: { newGameChoice: 100 } }],
            };
            const gameSocketRouter = new SocketRouter({ gameData });
            const expectedValue = { errorCode: helpers.noticeHelper.maxBetForChoice, maxBet: 5 };
            const player = { session: { currencyGroupId: '1' }, profile: { maxBet: 5 } };
            const amount = 10;

            // act
            const actualValue = gameSocketRouter.validateNewGame(player, amount);

            //assert
            expect(actualValue).toStrictEqual(expectedValue);
        });

        it('when amount < minBet should return helpers.noticeHelper.minBet', () => {
            // arrange
            const gameData = {
                gameConfigs: { enabled: true },
                currencyGroupGames: [{ groupId: 1, maxBetPerChoices: { newGameChoice: 100 }, minBet: 30 }],
            };
            const gameSocketRouter = new SocketRouter({ gameData });
            const expectedValue = { errorCode: helpers.noticeHelper.minBet, minBet: 30 };
            const player = { session: { currencyGroupId: '1' }, profile: { minBet: 20, maxBet: 100 } };
            const amount = 10;

            // act
            const actualValue = gameSocketRouter.validateNewGame(player, amount);

            //assert
            expect(actualValue).toStrictEqual(expectedValue);
        });

        it('when maxBet < amount should return helpers.noticeHelper.maxBet', () => {
            // arrange
            const gameData = {
                gameConfigs: { enabled: true },
                currencyGroupGames: [{ groupId: 1, maxBetPerChoices: { newGameChoice: 100 }, minBet: 1, maxBet: 4 }],
            };
            const gameSocketRouter = new SocketRouter({ gameData });
            const expectedValue = { errorCode: helpers.noticeHelper.maxBet, maxBet: 4 };
            const player = { session: { currencyGroupId: '1' }, profile: { minBet: 1, maxBet: 100 } };
            const amount = 10;

            // act
            const actualValue = gameSocketRouter.validateNewGame(player, amount);

            //assert
            expect(actualValue).toStrictEqual(expectedValue);
        });

        it('when not has error should return null', () => {
            // arrange
            const gameData = {
                gameConfigs: { enabled: true },
                currencyGroupGames: [{ groupId: 1, maxBetPerChoices: { newGameChoice: 100 }, minBet: 1, maxBet: 100 }],
            };
            const gameSocketRouter = new SocketRouter({ gameData });
            const player = { session: { currencyGroupId: '1' }, profile: { minBet: 1, maxBet: 100 } };
            const amount = 10;

            // act
            const actualValue = gameSocketRouter.validateNewGame(player, amount);

            //assert
            expect(actualValue).toBeNull();
        });
    });

    describe('validateAnNon', () => {
        // arrange
        const testCases = [
            { runningRound: null, expectedValue: { notice: 'Phiên chơi đã kết thúc...' } },
            { runningRound: { stepCount: 0 }, expectedValue: { notice: 'Chưa đủ điều kiện ăn non...' } },
            { runningRound: { stepCount: 10 }, expectedValue: null },
        ];

        it.each(testCases)('should return correct value', (testCase) => {
            // arrange
            const gameSocketRouter = new SocketRouter({});

            // act
            const actualValue = gameSocketRouter.validateAnNon(testCase.runningRound);

            //assert
            expect(actualValue).toStrictEqual(testCase.expectedValue);
        });
    });
});
