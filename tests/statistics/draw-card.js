import { baseCards, cardRanks } from "../../src/cards";
import { drawCard } from "../../src/helpers/deck-helper";

const drawsNo = Math.pow(10, 5);
const cardFrequency = 1 / 52;

const randomMode = 1;
function runBaseCardStatisticsByCards() {
    // Arrange
    const drawnCards = null;
    const resultCards = [];
    const expectValue = cardFrequency * drawsNo;
    const acceptedDiff = 200;

    // Act
    for (let i = 0; i < drawsNo; i++) {
        resultCards[i] = drawCard(randomMode, drawnCards);
    }

    // Assert
    const counts = [];
    const logs = [];

    baseCards.forEach((c, i) => {
        counts[i] = resultCards.filter((x) => x.rank === c.rank && x.suit === c.suit).length;
        logs.push(c.rank + "|" + c.suit + "|" + counts[i]);
    });

    console.log(logs.join("\n"));

    const isFailed = counts.some((c) => Math.abs(c - expectValue) > acceptedDiff);
    console.log(isFailed ? "Has card frequency too high/low." : "All card frequency is balance.");
}

function runBaseCardStatisticsByRanks() {
    for (var j = 0; j < 10; j++) {
        // Arrange
        const drawnCards = null;
        const resultCards = [];
        const expectValue = cardFrequency * 4 * drawsNo;
        const acceptedDiff = 400;

        // Act
        for (let i = 0; i < drawsNo; i++) {
            resultCards[i] = drawCard(randomMode, drawnCards);
        }

        // Assert
        const counts = [];
        const logs = [];

        Object.values(cardRanks).forEach((c, i) => {
            counts[i] = resultCards.filter((x) => x.rank === c).length;
            logs.push(c + "|" + (counts[i] / drawsNo) * 100);
        });

        console.log(logs.join("\n"));

        const isFailed = counts.some((c) => Math.abs(c - expectValue) > acceptedDiff);
        console.log(isFailed ? "Has rank frequency too high/low." : "All rank frequency is balance.");
    }
}

runBaseCardStatisticsByCards();
runBaseCardStatisticsByRanks();
