import mongoose from "mongoose";
import { stubMongooseModelStupidly } from "jest-micro-auto-stub";
import { Core } from "sc-game-base";
import { RoundQuery } from "../index";

describe("round-query", () => {
    let roundsRepository;
    let query;

    beforeEach(() => {
        // arrange
        roundsRepository = stubMongooseModelStupidly(mongoose.Model);
        query = new RoundQuery(roundsRepository);
    });

    describe("extends", () => {
        it("inherit Core.QueryApis.RoundQuery", () => {
            // assert
            expect(query instanceof Core.QueryApis.RoundQuery);
        });
    });

    describe("getList", () => {
        it("should return result from roundsRepository", async () => {
            // arrange
            const rounds = [{ id: 1 }];
            roundsRepository.find().lean().exec.mockReturnValueOnce(rounds);
            const expectedValue = [{ roundId: 1, result: undefined, settlementResult: undefined }];

            // act
            const actualValue = await query.getList();

            // assert
            expect(actualValue).toStrictEqual(expectedValue);
        });
    });

    describe("countDocuments", () => {
        it("should return result from roundsRepository", async () => {
            // arrange
            roundsRepository.countDocuments.mockReturnValue({ exec: jest.fn() });
            roundsRepository.countDocuments().exec.mockReturnValueOnce(1);
            const player = {};

            // act
            const actualValue = await query.countDocuments(player);

            // assert
            expect(actualValue).toStrictEqual(1);
        });
    });

    describe("getPlayerRounds", () => {
        it("should return result from roundsRepository", async () => {
            // arrange
            const bets = [];
            roundsRepository.find().lean().exec.mockReturnValueOnce(bets);
            const player = {};

            // act
            const actualValue = await query.getPlayerRounds(player);

            // assert
            expect(actualValue).toStrictEqual(bets);
        });
    });
});
