import { baseCards } from "../../cards";
import { drawCard, getCardFromAdmin } from "../deck-helper";

describe("deck-helper", () => {
    describe("drawCard", () => {
        describe("when already drawn all cards", () => {
            it("should also return card, card can be duplicate", () => {
                // Arrange
                const drawnCards = baseCards;

                // Act
                const actualValue = drawCard(drawnCards);

                // Assert
                expect(actualValue).not.toBeNull();
            });
        });

        describe("when 1st draw", () => {
            it("should return card", () => {
                // Arrange
                const drawnCards = [];

                // Act
                const actualValue = drawCard(drawnCards);

                // Assert
                expect(actualValue).not.toBeNull();
            });
        });
    });

    describe("getCardFromAdmin", () => {
        const testCases = [{ drawnCards: [] }, { drawnCards: [{ rank: "2", suit: 0 }] }];
        it.each(testCases)("should pick correct card", (testCase) => {
            // Arrange
            const cardRank = "2";

            // Act
            const actualValue = getCardFromAdmin(cardRank, testCase.drawnCards);

            // Assert
            expect(actualValue.rank).toBe("2");
        });
    });
});
