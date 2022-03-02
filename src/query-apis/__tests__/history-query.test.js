import mongoose from "mongoose";
import { stubMongoose, stub } from "jest-micro-auto-stub";
import { Core } from "sc-game-base";
import { HistoryQuery } from "../index";
import { RoundQuery } from "../round-query";

describe("HistoryQuery", () => {
    let query;
    let roundQuery;
    let betLogsRepository;
    beforeEach(() => {
        // Arrange
        roundQuery = stub(RoundQuery);
        betLogsRepository = stubMongoose(mongoose.Model);

        query = new HistoryQuery(roundQuery, null, betLogsRepository);
    });

    it("inherit Core.QueryApis.HistoryQuery", () => {
        // Assert
        expect(query instanceof Core.QueryApis.HistoryQuery);
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

        describe("when page >= 1", () => {
            describe("when not have bet", () => {
                const testCases = [
                    { betLogsRepository: null },
                    { betLogsRepository: stubMongoose(mongoose.Model) },
                    { betLogsRepository, bets: [] },
                ];
                it.each(testCases)("should return empty", async (testCase) => {
                    // Arrange
                    const historyQuery = new HistoryQuery(roundQuery, null, testCase.betLogsRepository);
                    roundQuery.countDocuments.mockReturnValue(1);
                    roundQuery.getPlayerRounds.mockReturnValueOnce(testCase.bets);
                    const expectedResult = {
                        history: { page: 1, pageSize: 10, total: 1, betLogs: [] },
                    };

                    // Act
                    var actualResult = await historyQuery.queryHistory({ UID: 1 }, 1, 10);

                    // Assert
                    expect(actualResult).toStrictEqual(expectedResult);
                });
            });

            describe("when have bet logs", () => {
                it("should return data with bet log details", async () => {
                    // Arrange
                    roundQuery.countDocuments.mockReturnValue(1);

                    const bets = [{ uid: 1, id: 1, amount: 100, result: [], settlementResult: [] }];
                    roundQuery.getPlayerRounds.mockReturnValueOnce(bets);
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
                            betLogs: [
                                {
                                    betLogDetails: [
                                        { uid: 1, roundId: 1, choice: "h" },
                                        { uid: 1, roundId: 1, choice: "l" },
                                    ],
                                    amount: 100,
                                    id: 1,
                                    result: [],
                                    settlementResult: [],
                                    uid: 1,
                                },
                            ],
                        },
                    };

                    // Act
                    var actualResult = await query.queryHistory({ UID: 1 }, 1, 10);

                    // Assert
                    expect(actualResult).toStrictEqual(expectedResult);
                });
            });

            describe("when not have bet logs", () => {
                it("should return data with bet log details = empty", async () => {
                    // Arrange
                    roundQuery.countDocuments.mockReturnValue(1);

                    const bets = [{ uid: 1, id: 1, amount: 100, result: [], settlementResult: [] }];
                    roundQuery.getPlayerRounds.mockReturnValueOnce(bets);
                    betLogsRepository.find().lean().exec.mockReturnValueOnce(null);

                    const expectedResult = {
                        history: {
                            page: 1,
                            pageSize: 10,
                            total: 1,
                            betLogs: [
                                {
                                    betLogDetails: [],
                                    amount: 100,
                                    id: 1,
                                    result: [],
                                    settlementResult: [],
                                    uid: 1,
                                },
                            ],
                        },
                    };

                    // Act
                    var actualResult = await query.queryHistory({ UID: 1 }, 1, 10);

                    // Assert
                    expect(actualResult).toStrictEqual(expectedResult);
                });
            });
        });
    });
});
