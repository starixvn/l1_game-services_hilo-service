import { baseCards, cardRanks } from "../../cards";
import { drawCard } from "../deck-helper";

describe("deck-helper", () => {
    describe("drawCard", () => {
        describe("with 100,000 draws", () => {
            it("frequency of all cards should be around 1/52 * 100000, different is 200 times", () => {
                // Arrange
                const drawnCards = null;
                const drawsNo = Math.pow(10, 5);
                const resultCards = [];
                const expectValue = (1 / 52) * drawsNo;
                const acceptedDiff = 200;

                // Act
                for (let i = 0; i < drawsNo; i++) {
                    resultCards[i] = drawCard(drawnCards);
                }

                // Assert
                const counts = [];
                const logs = [];

                baseCards.forEach((c, i) => {
                    counts[i] = resultCards.filter((x) => x.rank === c.rank && x.suit === c.suit).length;
                    logs.push(c.rank + "|" + c.suit + "|" + counts[i]);
                });

                console.log(logs.join("\n"));
                expect(counts.some((c) => Math.abs(c - expectValue) > acceptedDiff)).toBeFalsy();
            });

            it("frequency of all ranks should be around 1/13 * 100000, different is 200 times", () => {
                for (var j = 0; j < 10; j++) {
                    // Arrange
                    const drawnCards = null;
                    const drawsNo = Math.pow(10, 5);
                    const resultCards = [];
                    const expectValue = (1 / 13) * drawsNo;
                    const acceptedDiff = 400;

                    // Act
                    for (let i = 0; i < drawsNo; i++) {
                        resultCards[i] = drawCard(drawnCards);
                    }

                    // Assert
                    const counts = [];
                    const logs = [];

                    Object.values(cardRanks).forEach((c, i) => {
                        counts[i] = resultCards.filter((x) => x.rank === c).length;
                        logs.push(c + "|" + (counts[i] / drawsNo) * 100);
                    });

                    console.log(logs.join("\n"));
                    expect(counts.some((c) => Math.abs(c - expectValue) > acceptedDiff)).toBeFalsy();
                }
            });
        });
    });
});
