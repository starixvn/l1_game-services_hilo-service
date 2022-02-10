import { run } from "../app";

const mAppStatus = {
    started: false,
};

jest.mock("sc-game-base", () => {
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
            EventConsumers: {
                InGameConsumer: function () {},
            },
            GameData: function () {},
            GameDefinition: function () {},
        },
    };
});

jest.mock("../service-container-registry", () => {
    return function () {
        return {
            register: () => {
                return {
                    resolve: () => {
                        return { consume: jest.fn() };
                    },
                };
            },
        };
    };
});

describe("app", () => {
    afterAll(() => {
        jest.clearAllMocks();
    });

    describe("run", () => {
        it("should call app.run", async () => {
            // Arrange
            mAppStatus.started = false;

            // Act
            await run();

            // Assert
            expect(mAppStatus.started).toBe(true);
        });
    });
});
