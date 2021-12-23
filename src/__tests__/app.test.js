import { loadRunningRound, run } from '../app';

const roundModel = {
    find: () => {
        return {
            lean: () => {
                return {
                    exec: async () => {
                        return [
                            { uid: 'm1', cards: [{ card: 1 }] },
                            { uid: 'm2', cards: [{ card: 1 }] },
                        ];
                    },
                };
            },
        };
    },
};

const mAppStatus = {
    started: false,
};

jest.mock('sc-game-base', () => {
    const mApp = {
        run: () => {
            mAppStatus.started = true;
        },
        startGame: () => {},
    };

    return {
        Core: {
            BaseGameApp: function () {
                return mApp;
            },
        },
        Table: {
            EventConsumers: {
                TableInGameConsumer: function () {},
            },
            TableGameData: function () {},
            TableGameDefinition: function () {},
        },
    };
});

jest.mock('../service-container-registry', () => {
    return function () {
        return {
            register: () => {
                return { resolve: jest.fn() };
            },
        };
    };
});

jest.mock('../models', () => {
    return { RoundModel: roundModel };
});

describe('app', () => {
    describe('loadRunningRound', () => {
        it('should load running rounds to game data', async () => {
            // arrange
            const gameData = { gameConfigs: {}, runningRounds: {} };
            const runningRounds = {
                m1: { uid: 'm1', cards: [{ card: 1 }], odds: { hi: 0, lo: 0 } },
                m2: { uid: 'm2', cards: [{ card: 1 }], odds: { hi: 0, lo: 0 } },
            };

            // act
            await loadRunningRound(gameData);

            // assert
            expect(gameData.runningRounds).toStrictEqual(runningRounds);
        });
    });
    describe('run', () => {
        it('should call app.run', async () => {
            // arrange
            mAppStatus.started = false;

            // act
            await run();

            //assert
            expect(mAppStatus.started).toBe(true);
        });
    });
});
