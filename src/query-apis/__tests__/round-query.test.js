import mongoose from "mongoose";
import { stubMongoose } from "jest-micro-auto-stub";
import { Core } from "sc-game-base";
import { RoundQuery } from "../index";

describe("RoundQuery", () => {
    let roundsRepository;
    let query;

    beforeEach(() => {
        // Arrange
        roundsRepository = stubMongoose(mongoose.Model);
        query = new RoundQuery(roundsRepository);
    });

    it("inherit Core.QueryApis.RoundQuery", () => {
        // Assert
        expect(query instanceof Core.QueryApis.RoundQuery);
    });

    describe("getList", () => {
        it("should return result from roundsRepository", async () => {
            // Arrange
            const rounds = [{ id: 1 }];
            roundsRepository.find().lean().exec.mockReturnValueOnce(rounds);
            const expectedValue = [{ roundId: 1, result: undefined, settlementResult: undefined }];

            // Act
            const actualValue = await query.getList();

            // Assert
            expect(actualValue).toStrictEqual(expectedValue);
        });
    });

    describe("countDocuments", () => {
        it("should return result from roundsRepository", async () => {
            // Arrange
            roundsRepository.countDocuments.mockReturnValue({ exec: jest.fn() });
            roundsRepository.countDocuments().exec.mockReturnValueOnce(1);
            const player = {};

            // Act
            const actualValue = await query.countDocuments(player);

            // Assert
            expect(actualValue).toStrictEqual(1);
        });
    });

    describe("getPlayerRounds", () => {
        it("should return result from roundsRepository", async () => {
            // Arrange
            const bets = [];
            roundsRepository.find().lean().exec.mockReturnValueOnce(bets);
            const player = {};

            // Act
            const actualValue = await query.getPlayerRounds(player);

            // Assert
            expect(actualValue).toStrictEqual(bets);
        });
    });
});
