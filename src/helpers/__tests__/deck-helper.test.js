import { baseCards } from "../../cards";
import { drawCard, getCardFromAdmin } from "../deck-helper";

describe("deck-helper", () => {
    describe("drawCard", () => {
        it("when already drawn all cards should also return card, card can be duplicate", () => {
            // arrange
            const drawnCards = baseCards;

            // act
            const actualValue = drawCard(drawnCards);

            //assert
            expect(actualValue).not.toBeNull();
        });

        it("when 1st draw should return card", () => {
            // arrange
            const drawnCards = [];

            // act
            const actualValue = drawCard(drawnCards);

            //assert
            expect(actualValue).not.toBeNull();
        });
    });

    describe("getCardFromAdmin", () => {
        const testCases = [{ drawnCards: [] }, { drawnCards: [{ rank: "2", suit: 0 }] }];
        it.each(testCases)("should pick correct card", (testCase) => {
            // arrange
            const cardRank = "2";

            // act
            const actualValue = getCardFromAdmin(cardRank, testCase.drawnCards);

            //assert
            expect(actualValue.rank).toBe("2");
        });
    });
});
