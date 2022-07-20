import { baseCards } from "../../cards";
import { drawCard, getCardFromAdmin } from "../deck-helper";

const chanceMock = { pickoneIndex: 0 };
jest.mock("chance", () => {
    return function () {
        const orig = {
            ...jest.requireActual("chance"),
        };

        return {
            shuffle: (arr) => {
                return new orig.Chance().shuffle(arr);
            },
            pickone: (arr) => arr[chanceMock.pickoneIndex],
        };
    };
});

describe("DeckHelper", () => {
    describe("drawCard", () => {
        const testCases = [
            { randomMode: 1, pickoneIndex: 0 },
            { randomMode: 2, pickoneIndex: 0 },
            { randomMode: 3, pickoneIndex: 0 },
            { randomMode: 3, pickoneIndex: 1 },
            { randomMode: 4, pickoneIndex: 0 },
        ];

        describe("when already drawn all cards", () => {
            it.each(testCases)("should also return card, card can be duplicate", (testCase) => {
                // Arrange
                const drawnCards = baseCards;
                chanceMock.pickoneIndex = testCase.pickoneIndex;

                // Act
                const actualValue = drawCard(testCase.randomMode, drawnCards);

                // Assert
                expect(actualValue).not.toBeNull();
            });
        });

        describe("when 1st draw", () => {
            it("should return card", () => {
                // Arrange
                const drawnCards = null;

                // Act
                const actualValue = drawCard(1, drawnCards);

                // Assert
                expect(actualValue).not.toBeNull();
            });
        });
    });

    describe("getCardFromAdmin", () => {
        describe("when not draw any card yet", () => {
            it("should pick card with expected rank", () => {
                // Arrange
                const cardRank = "2";
                const drawnCards = [];

                // Act
                const actualValue = getCardFromAdmin(cardRank, drawnCards);

                // Assert
                expect(actualValue.rank).toBe(cardRank);
            });
        });

        describe("when previous card rank = expected rank", () => {
            it("should able to pick card with expected rank", () => {
                // Arrange
                const cardRank = "2";
                const drawnCards = [{ rank: "2", suit: 0 }];

                // Act
                const actualValue = getCardFromAdmin(cardRank, drawnCards);

                // Assert
                expect(actualValue.rank).toBe(cardRank);
            });
        });
    });
});
