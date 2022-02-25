import { choiceNames } from "../../src/game-settings";
import { drawCard } from "../../src/helpers/deck-helper";
import SettleTurnConsumer from "../../src/event-consumers/settle-turn-consumer";
import { odds } from "../../src/__tests__/test-data";
import { calculateWinAmounts } from "./helpers";
import { cardRanks } from "../../src/cards";

function run() {
    const totalRounds = 100_000;
    let totalBetAmount = 0;
    let totalWinAmount = 0;
    let winCount = 0;
    const settleTurnConsumer = new SettleTurnConsumer({});
    const cardsStatistics = {
        A: { h: 0, l: 0 },
        2: { h: 0, l: 0 },
        3: { h: 0, l: 0 },
        4: { h: 0, l: 0 },
        5: { h: 0, l: 0 },
        6: { h: 0, l: 0 },
        7: { h: 0, l: 0 },
        8: { h: 0, l: 0 },
        9: { h: 0, l: 0 },
        10: { h: 0, l: 0 },
        J: { h: 0, l: 0 },
        Q: { h: 0, l: 0 },
        K: { h: 0, l: 0 },
    };

    for (let index = 0; index < totalRounds; index++) {
        let betAmount = 1;
        totalBetAmount += betAmount;

        const firstCard = drawCard();
        if (firstCard.rank === cardRanks.two || firstCard.rank === cardRanks.ace) {
            totalWinAmount += betAmount;
            winCount++;
            continue;
        }

        const cardsStatistic = cardsStatistics[firstCard.rank];
        const resultCard = drawCard(firstCard);
        const choice = cardsStatistic[choiceNames.h] > cardsStatistic[choiceNames.l] ? choiceNames.l : choiceNames.h;
        const estimatedWin = calculateWinAmounts(odds, firstCard, 1, betAmount, resultCard);
        const settlementResult = settleTurnConsumer.getSettlementResult(firstCard, resultCard);
        cardsStatistic[settlementResult]++;

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
