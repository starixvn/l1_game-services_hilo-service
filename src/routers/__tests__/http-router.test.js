import { stub } from "jest-micro-auto-stub";
import { Core } from "sc-game-base";
import { logger } from "sc-common";
import { HttpRouter } from "../index";

jest.mock("sc-common");

describe("http-router", () => {
    const app = {
        get: jest.fn(),
        post: (url, authenticate, callBack) => {
            callBack({}, {});
        },
        calledPost: false,
    };
    const appConfigs = {
        apiSettings: {
            authUrl: "http://localhost",
        },
        authenticateSettings: {
            audiences: [],
        },
    };
    const logService = stub(logger);
    const gameData = {};
    const historyQuery = {};
    const userSessionsRepository = {};
    const metricQuery = {};
    const res = { send: jest.fn() };

    let router;
    beforeEach(() => {
        // Arrange
        jest.clearAllMocks();

        router = new HttpRouter(appConfigs, gameData, historyQuery, userSessionsRepository, metricQuery, logService);
    });

    describe("extends", () => {
        it("inherit Core.Routers.HttpRouter", () => {
            // Assert
            expect(router instanceof Core.Routers.HttpRouter);
        });
    });

    describe("init", () => {
        it("should call supper init", () => {
            // Arrange
            spyOn(HttpRouter.prototype, "init");

            // Act
            router.init(app);

            // Assert
            expect(HttpRouter.prototype.init).toHaveBeenCalledWith(app);
        });
    });

    describe("handleSetResult", () => {
        describe("when params are invalid", () => {
            const testCases = [{ param: null }, { param: {} }, { param: { roundId: 1 } }];
            it.each(testCases)("should return [] ", async (testCase) => {
                // Arrange

                // Act
                await router.handleSetResult(testCase.param, res);

                // Assert
                expect(res.send).toHaveBeenCalledWith([]);
            });
        });

        describe("when params are valid", () => {
            it("should logWarning", async () => {
                // Arrange
                gameData.settlementResultFromAdmin = {};
                const param = { Name: "player", Result: ["A", "2", "3"] };

                // Act
                await router.handleSetResult(param, res);

                // Assert
                expect(logService.logWarning).toHaveBeenCalledWith(
                    'receives a result cheating call {"Name":"player","Result":["A","2","3"]}.'
                );
            });
        });

        describe("when have error", () => {
            it("should logError", async () => {
                // Arrange
                gameData.settlementResultFromAdmin = null;
                const param = { Name: "player", Result: [] };

                // Act
                await router.handleSetResult(param, res);

                // Assert
                expect(logService.logError).toHaveBeenCalledWith(new TypeError("Cannot set property 'player' of null"));
            });
        });
    });
});
