import { baseCards } from "../../cards";
import { drawCard, getCardFromAdmin } from "../deck-helper";

describe("deck-helper", () => {
    describe("drawCard", () => {
        describe("when already drawn all cards", () => {
            it("should also return card, card can be duplicate", () => {
                // arrange
                const drawnCards = baseCards;

                // act
                const actualValue = drawCard(drawnCards);

                // assert
                expect(actualValue).not.toBeNull();
            });
        });

        describe("when 1st draw", () => {
            it("should return card", () => {
                // arrange
                const drawnCards = [];

                // act
                const actualValue = drawCard(drawnCards);

                // assert
                expect(actualValue).not.toBeNull();
            });
        });
    });

    describe("getCardFromAdmin", () => {
        const testCases = [{ drawnCards: [] }, { drawnCards: [{ rank: "2", suit: 0 }] }];
        it.each(testCases)("should pick correct card", (testCase) => {
            // arrange
            const cardRank = "2";

            // act
            const actualValue = getCardFromAdmin(cardRank, testCase.drawnCards);

            // assert
            expect(actualValue.rank).toBe("2");
        });
    });
});
