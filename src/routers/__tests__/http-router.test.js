import { stub } from "jest-micro-auto-stub";
import { Core } from "sc-game-base";
import { logger } from "sc-common/logger";
import { HttpRouter } from "../index";

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

describe("http-router", () => {
    let router;
    beforeEach(() => {
        // Arrange
        router = new HttpRouter();
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

        it("should call app.post", () => {
            // Arrange
            app.calledPost = false;
            router.appConfigs = appConfigs;
            spyOn(app, "calledPost").and.callThrough();
            spyOn(router, "handleSetResult");

            // Act
            router.init(app);

            // Assert
            expect(router.handleSetResult).toHaveBeenCalledWith(undefined, {});
        });
    });

    describe("handleSetResult", () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });

        describe("when params are invalid", () => {
            const testCases = [{ param: null }, { param: {} }, { param: { roundId: 1 } }];
            it.each(testCases)("should return [] ", async (testCase) => {
                // Arrange
                router.appConfigs = appConfigs;
                router.logService = logService;
                const res = { send: jest.fn() };

                // Act
                await router.handleSetResult(testCase.param, res);

                // Assert
                expect(res.send).toHaveBeenCalledWith([]);
            });
        });

        describe("when params are valid", () => {
            it("should logWarning", async () => {
                // Arrange
                const gameData = { settlementResultFromAdmin: {} };
                router.appConfigs = appConfigs;
                router.gameData = gameData;
                router.logService = logService;
                const res = { send: jest.fn() };
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
            it("should warning cheating", async () => {
                // Arrange
                const gameData = { settlementResultFromAdmin: null };
                router.appConfigs = appConfigs;
                router.gameData = gameData;
                router.logService = logService;
                const res = { send: jest.fn() };
                const param = { Name: "player", Result: [] };

                // Act
                await router.handleSetResult(param, res);

                // Assert
                expect(logService.logWarning).toHaveBeenCalledWith('receives a result cheating call {"Name":"player","Result":[]}.');
            });
        });
    });
});
