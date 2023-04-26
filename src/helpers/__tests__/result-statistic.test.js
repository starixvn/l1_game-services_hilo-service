import { randomModes, drawCard } from "../../../src/helpers/deck-helper";
import { baseCards } from "../../cards";

const rankMapper = {
    A: 0,
    2: 1,
    3: 2,
    4: 3,
    5: 4,
    6: 5,
    7: 6,
    8: 7,
    9: 8,
    10: 9,
    J: 10,
    Q: 11,
    K: 12,
};
function getCardIndex(rank, suit) {
    return rankMapper[rank] * 4 + suit;
}
describe("Result statistic: 100000 times", () => {
    Object.keys(randomModes).forEach((mode) => {
        it(`should generate results statistically correct with mode ${mode}`, () => {
            // Arrange
            const cardStat = {};
            const totalRounds = 100000;
            const cards = [...baseCards];
            // Act
            for (let i = 0; i < totalRounds; i++) {
                const firstCard = drawCard(mode);
                const resultCard = drawCard(mode, firstCard);
                const cardIndex = getCardIndex(resultCard.rank, resultCard.suit);
                cardStat[cardIndex] = cardStat[cardIndex] ?? {
                    count: 0,
                    ratio: 0,
                };

                cardStat[cardIndex].count++;
                cardStat[cardIndex].ratio = cardStat[cardIndex].count / (totalRounds * 9);
            }

            // Assert
            console.log(`======== Run ${totalRounds} rounds ========`);
            console.log(cardStat);
            Object.keys(cards).forEach((index) => {
                expect(cardStat[index].ratio).toBeGreaterThanOrEqual(0.0019);
            });
        });
    });
});
