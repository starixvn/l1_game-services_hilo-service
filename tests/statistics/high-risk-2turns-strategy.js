import { choiceNames } from "../../src/game-settings";
import { drawCard } from "../../src/helpers/deck-helper";
import SettleTurnConsumer from "../../src/event-consumers/settle-turn-consumer";
import { odds } from "../../src/__tests__/test-data";
import { calculateWinAmounts } from "./helpers";

function run() {
    const totalRounds = 100_000;
    const amount = 1;
    let totalBetAmount = 0;
    let totalWinAmount = 0;
    let winCount = 0;
    const settleTurnConsumer = new SettleTurnConsumer({});

    for (let index = 0; index < totalRounds; index++) {
        totalBetAmount += amount;
        let drawnCard = null;
        let betwin = amount;
        let turnCount = 1;

        for (let i = 0; i < turnCount; i++) {
            const currentCard = drawCard(drawnCard);
            const resultCard = drawCard(currentCard);
            const estimatedWin = calculateWinAmounts(odds, currentCard, i + 1, betwin, resultCard);
            const choice = estimatedWin[choiceNames.h] > estimatedWin[choiceNames.l] ? choiceNames.h : choiceNames.l;
            const isLose = settleTurnConsumer.isLose(choice, currentCard, resultCard);
            drawnCard = currentCard;
            if (currentCard.rank === "3" || currentCard.rank === "K") {
                turnCount++;
            }

            if (isLose) {
                break;
            }

            betwin = estimatedWin[choice];
            if (i == turnCount - 1) {
                totalWinAmount += betwin;
                winCount++;
            }
        }
    }

    console.log(`TotalBet: ${totalBetAmount}`);
    console.log(`TotalWin: ${totalWinAmount}. Payout: ${(totalWinAmount / totalBetAmount) * 100}%`);
    console.log(`WinCount: ${winCount}`);
    console.log(`Payout: ${(totalWinAmount / totalBetAmount) * 100}%`);
}

run();
