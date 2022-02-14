import mongoose from "mongoose";
import { stubMongooseModelStupidly, stub } from "jest-micro-auto-stub";
import { Core } from "sc-game-base";
import { HistoryQuery } from "../index";
import { RoundQuery } from "../round-query";

describe("history-query", () => {
    let query;
    let roundQuery;
    let betLogsRepository;
    beforeEach(() => {
        // Arrange
        roundQuery = stub(RoundQuery);
        betLogsRepository = stubMongooseModelStupidly(mongoose.Model);

        query = new HistoryQuery(roundQuery, null, betLogsRepository);
    });

    describe("extends", () => {
        it("inherit Core.QueryApis.HistoryQuery", () => {
            // Assert
            expect(query instanceof Core.QueryApis.HistoryQuery);
        });
    });

    describe("getBetLogDetails", () => {
        it("should return result from betLogsRepository", () => {
            // Arrange
            const logs = [];
            betLogsRepository.find().lean().exec.mockReturnValueOnce(logs);
            const player = {};

            // Act
            const actualValue = query.getBetLogDetails(player);

            // Assert
            expect(actualValue).toStrictEqual(logs);
        });
    });

    describe("queryHistory tests", () => {
        describe("when page < 1", () => {
            it("should return empty", async () => {
                var actualResult = await query.queryHistory({}, 0, 10);

                expect(actualResult).toBeEmpty();
            });
        });

        const testCases = [
            { betLogsRepository: null, expectedBetLogs: [] },
            { betLogsRepository: stubMongooseModelStupidly(mongoose.Model), expectedBetLogs: [] },
            { betLogsRepository, bets: [], expectedBetLogs: [] },
            {
                betLogsRepository: stubMongooseModelStupidly(mongoose.Model),
                bets: [{ uid: 1, id: 1, amount: 100 }],
                expectedBetLogs: [
                    {
                        betLogDetails: undefined,
                        amount: 100,
                        id: 1,
                        result: undefined,
                        settlementResult: undefined,
                        uid: 1,
                    },
                ],
            },
            {
                betLogsRepository: null,
                bets: [{ uid: 1, id: 1, amount: 100 }],
                expectedBetLogs: [
                    {
                        betLogDetails: [],
                        amount: 100,
                        id: 1,
                        result: undefined,
                        settlementResult: undefined,
                        uid: 1,
                    },
                ],
            },
        ];
        describe("when page >= 1", () => {
            it.each(testCases)("should return data", async (testCase) => {
                // Arrange
                const historyQuery = new HistoryQuery(roundQuery, null, testCase.betLogsRepository);
                roundQuery.getOne.mockReturnValueOnce({
                    id: 1,
                    result: { red1: true, red2: false },
                    settlementResult: { odd: true, even: false },
                });
                roundQuery.countDocuments.mockReturnValue(1);
                roundQuery.getPlayerRounds.mockReturnValueOnce(testCase.bets);
                betLogsRepository
                    .find()
                    .lean()
                    .exec.mockReturnValueOnce([
                        { uid: 1, roundId: 1, choice: "h" },
                        { uid: 1, roundId: 1, choice: "l" },
                    ]);

                const expectedResult = {
                    history: {
                        page: 1,
                        pageSize: 10,
                        total: 1,
                        betLogs: testCase.expectedBetLogs,
                    },
                };

                // Act
                var actualResult = await historyQuery.queryHistory({ UID: 1 }, 1, 10);

                // Assert
                expect(actualResult).toStrictEqual(expectedResult);
            });
        });
    });
});
