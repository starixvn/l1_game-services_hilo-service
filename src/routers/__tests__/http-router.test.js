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
    describe("extends", () => {
        it("inherit Core.Routers.HttpRouter", () => {
            // act
            const cron = new HttpRouter();

            // assert
            expect(cron instanceof Core.Routers.HttpRouter);
        });
    });

    describe("init", () => {
        it("should call supper init", () => {
            // arrange
            const router = new HttpRouter();
            spyOn(HttpRouter.prototype, "init");

            // act
            router.init(app);

            // assert
            expect(HttpRouter.prototype.init).toHaveBeenCalled();
        });

        it("should call app.post", () => {
            // arrange
            app.calledPost = false;
            const router = new HttpRouter(appConfigs);
            spyOn(app, "calledPost").and.callThrough();
            spyOn(router, "handleSetResult");

            // act
            router.init(app);

            // assert
            expect(router.handleSetResult).toHaveBeenCalled();
        });
    });

    describe("handleSetResult", () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });

        describe("when params are invalid", () => {
            const testCases = [{ param: null }, { param: {} }, { param: { roundId: 1 } }];
            it.each(testCases)("should logError ", async (testCase) => {
                // arrange
                const router = new HttpRouter(appConfigs, null, null, null, null, logService);
                const res = { send: jest.fn() };

                // act
                await router.handleSetResult(testCase.param, res);

                // assert
                expect(logService.logError).toHaveBeenCalled();
                expect(res.send).toHaveBeenCalledWith([]);
            });
        });

        describe("when params are valid", () => {
            it("should logWarning", async () => {
                // arrange
                const gameData = { settlementResultFromAdmin: {} };
                const router = new HttpRouter(appConfigs, gameData, null, null, null, logService);
                const res = { send: jest.fn() };
                const param = { name: "player", result: ["A", "2", "3"] };

                // act
                await router.handleSetResult(param, res);

                // assert
                expect(logService.logWarning).toHaveBeenCalled();
            });
        });

        describe("when have error", () => {
            it("should logError", async () => {
                // arrange
                const gameData = { settlementResultFromAdmin: null };
                const router = new HttpRouter(appConfigs, gameData, null, null, null, logService);
                const res = { send: jest.fn() };
                const param = { name: "player", result: [] };

                // act
                await router.handleSetResult(param, res);

                // assert
                expect(logService.logWarning).toHaveBeenCalled();
                expect(logService.logError).toHaveBeenCalled();
            });
        });
    });
});
