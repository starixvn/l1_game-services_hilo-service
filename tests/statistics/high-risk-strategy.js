import { choiceNames } from "../../src/game-settings";
import { drawCard } from "../../src/helpers/deck-helper";
import SettleTurnConsumer from "../../src/event-consumers/settle-turn-consumer";
import { odds } from "../../src/__tests__/test-data";
import { calculateWinAmounts } from "./helpers";
import { cardRanks } from "../../src/cards";

const randomMode = 1;
function run() {
    const totalRounds = 100_000;
    const amount = 1;
    let totalBetAmount = 0;
    let totalWinAmount = 0;
    let winCount = 0;
    const settleTurnConsumer = new SettleTurnConsumer({});

    for (let index = 0; index < totalRounds; index++) {
        totalBetAmount += 1;
        const firstCard = drawCard(randomMode);
        if (firstCard.rank === cardRanks.two || firstCard.rank === cardRanks.ace) {
            totalWinAmount += amount;
            winCount++;
            continue;
        }

        const resultCard = drawCard(randomMode, firstCard);
        const estimatedWin = calculateWinAmounts(odds, firstCard, 1, amount, resultCard);
        const choice = estimatedWin[choiceNames.h] > estimatedWin[choiceNames.l] ? choiceNames.h : choiceNames.l;

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
