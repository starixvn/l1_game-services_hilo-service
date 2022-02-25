import { choiceNames } from "../../src/game-settings";
import { drawCard } from "../../src/helpers/deck-helper";
import SettleTurnConsumer from "../../src/event-consumers/settle-turn-consumer";
import { odds } from "../../src/__tests__/test-data";
import { calculateWinAmounts } from "./helpers";

function run() {
    const totalRounds = 100_000;
    let totalBetAmount = 0;
    let totalWinAmount = 0;
    let winCount = 0;
    const settleTurnConsumer = new SettleTurnConsumer({});

    let loseCount = 0;
    const coverRatio = 200;

    for (let index = 0; index < totalRounds; index++) {
        const amount = coverRatio;
        totalBetAmount += amount;
        const firstCard = drawCard();
        const resultCard = drawCard(firstCard);
        const estimatedWin = calculateWinAmounts(odds, firstCard, 1, amount, resultCard);
        const choice = estimatedWin[choiceNames.h] > estimatedWin[choiceNames.l] ? choiceNames.h : choiceNames.l;

        if (settleTurnConsumer.isLose(choice, firstCard, resultCard)) {
            loseCount++;
        } else {
            totalWinAmount += estimatedWin[choice];
            winCount++;
            loseCount = 0;
        }
    }

    console.log(`TotalBet: ${totalBetAmount}`);
    console.log(`TotalWin: ${totalWinAmount}. Payout: ${(totalWinAmount / totalBetAmount) * 100}%`);
    console.log(`NetWin: ${totalWinAmount - totalBetAmount}.`);
    console.log(`WinCount: ${winCount}`);
    console.log(`Payout: ${(totalWinAmount / totalBetAmount) * 100}%`);
}

run();
