import { baseCards } from "../../cards";
import { drawCard, getCardFromAdmin } from "../deck-helper";

describe("DeckHelper", () => {
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
                const drawnCards = null;

                // Act
                const actualValue = drawCard(drawnCards);

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
