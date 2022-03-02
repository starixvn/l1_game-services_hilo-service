import { choiceNames } from "../../src/game-settings";
import { drawCard } from "../../src/helpers/deck-helper";
import SettleTurnConsumer from "../../src/event-consumers/settle-turn-consumer";
import { odds } from "../../src/__tests__/test-data";
import { calculateWinAmounts } from "./helpers";

function run() {
    const totalRounds = 52 * 51 * 10;
    let totalBetAmount = 0;
    let totalWinAmount = 0;
    let winCount = 0;
    const settleTurnConsumer = new SettleTurnConsumer({});
    const cardsStatistics = {
        A: { h: 4 * 51, l: 0 },
        2: { h: 4 * 51, l: 0 },
        3: { h: 4 * 4 * 11, l: 4 * 4 * 1 },
        4: { h: 4 * 4 * 10, l: 4 * 4 * 2 },
        5: { h: 4 * 4 * 9, l: 4 * 4 * 3 },
        6: { h: 4 * 4 * 8, l: 4 * 4 * 4 },
        7: { h: 4 * 4 * 7, l: 4 * 4 * 5 },
        8: { h: 4 * 4 * 6, l: 4 * 4 * 6 },
        9: { h: 4 * 4 * 5, l: 4 * 4 * 7 },
        10: { h: 4 * 4 * 4, l: 4 * 4 * 8 },
        J: { h: 4 * 4 * 3, l: 4 * 4 * 9 },
        Q: { h: 4 * 4 * 2, l: 4 * 4 * 10 },
        K: { h: 4 * 4 * 1, l: 4 * 4 * 11 },
    };

    for (let index = 0; index < totalRounds; index++) {
        const firstCard = drawCard();
        const cardsStatistic = cardsStatistics[firstCard.rank];
        const resultCard = drawCard(firstCard);
        const choice = cardsStatistic[choiceNames.h] > cardsStatistic[choiceNames.l] ? choiceNames.l : choiceNames.h;
        const betAmount = 1;
        totalBetAmount += betAmount;
        const estimatedWin = calculateWinAmounts(odds, firstCard, 1, betAmount, resultCard);
        const settlementResult = settleTurnConsumer.getSettlementResult(firstCard, resultCard);
        cardsStatistic[settlementResult]--;

        if (!settleTurnConsumer.isLose(choice, firstCard, resultCard)) {
            totalWinAmount += estimatedWin[choice];
            winCount++;
        }
    }

    console.log(`TotalBet: ${totalBetAmount}`);
    console.log(`TotalWin: ${totalWinAmount}. Payout: ${(totalWinAmount / totalBetAmount) * 100}%`);
    console.log(`WinCount: ${winCount}`);
    console.log(`Payout: ${(totalWinAmount / totalBetAmount) * 100}%`);
}

run();
