import mongoose from "mongoose";
import { stubMongooseModelStupidly } from "jest-micro-auto-stub";
import { Core } from "sc-game-base";
import { HistoryQuery } from "../index";

describe("history-query", () => {
    describe("extends", () => {
        it("inherit Core.QueryApis.HistoryQuery", () => {
            // act
            const query = new HistoryQuery();

            //assert
            expect(query instanceof Core.QueryApis.HistoryQuery);
        });
    });

    describe("getBetLogDetails", () => {
        it("should return result from betLogsRepository", () => {
            // arrange
            const betLogsRepository = stubMongooseModelStupidly(mongoose.Model);
            const logs = [];
            betLogsRepository.find().lean().exec.mockReturnValueOnce(logs);
            const query = new HistoryQuery(null, null, betLogsRepository);
            const player = {};

            // act
            const actualValue = query.getBetLogDetails(player);

            // assert
            expect(actualValue).toStrictEqual(logs);
        });
    });

    describe("queryHistory tests", () => {
        const roundQuery = { getOne: jest.fn() };
        const roundsRepository = stubMongooseModelStupidly(mongoose.Model);
        const betLogsRepository = stubMongooseModelStupidly(mongoose.Model);

        it("should return empty when page < 1", async () => {
            const historyQuery = new HistoryQuery(roundQuery, roundsRepository, betLogsRepository);

            var actualResult = await historyQuery.queryHistory({}, 0, 10);

            expect(actualResult).toBeEmpty();
        });

        const testCases = [
            { betLogsRepository: null },
            { betLogsRepository },
            { betLogsRepository, bets: [] },
            { betLogsRepository, bets: [{ uid: 1, id: 1, odd: 100, even: 50 }] },
            { betLogsRepository: null, bets: [{ uid: 1, id: 1, odd: 100, even: 50 }] },
        ];
        it.each(testCases)("should return data when page >= 1", async (testCase) => {
            const historyQuery = new HistoryQuery(roundQuery, roundsRepository, testCase.betLogsRepository);
            roundQuery.getOne.mockReturnValueOnce({
                id: 1,
                result: { red1: true, red2: false },
                settlementResult: { odd: true, even: false },
            });
            roundsRepository.countDocuments.mockReturnValue({ exec: jest.fn() });
            roundsRepository.countDocuments().exec.mockReturnValueOnce(1);
            roundsRepository.find().lean().exec.mockReturnValueOnce(testCase.bets);
            betLogsRepository
                .find()
                .lean()
                .exec.mockReturnValueOnce([
                    { uid: 1, roundId: 1, choice: "odd" },
                    { uid: 1, roundId: 1, choice: "even" },
                ]);

            var actualResult = await historyQuery.queryHistory({ UID: 1 }, 1, 10);

            expect(actualResult).not.toBeEmpty();
            expect(actualResult.history.page).toEqual(1);
            expect(actualResult.history.pageSize).toEqual(10);
            expect(actualResult.history.total).toEqual(1);
        });
    });
});
