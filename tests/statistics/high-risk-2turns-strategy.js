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
    const cardPlayNextTurns = [
        cardRanks.two,
        cardRanks.ace,
        cardRanks.three,
        cardRanks.four,
        cardRanks.five,
        cardRanks.six,
        cardRanks.jack,
        cardRanks.queen,
        cardRanks.king,
    ];
    const maxTurn = 1;

    for (let index = 0; index < totalRounds; index++) {
        totalBetAmount += amount;
        let currentCard = drawCard(randomMode);
        let betwin = amount;
        let turnCount = 1;

        for (let i = 0; i < turnCount; i++) {
            if (currentCard.rank === cardRanks.two || currentCard.rank === cardRanks.ace) {
                if (i === maxTurn) {
                    totalWinAmount += betwin;
                    winCount++;
                    break;
                } else {
                    turnCount++;
                    currentCard = drawCard(randomMode, currentCard);
                    continue;
                }
            }

            const resultCard = drawCard(randomMode, currentCard);
            const estimatedWin = calculateWinAmounts(odds, currentCard, i + 1, betwin, resultCard);
            const choice = estimatedWin[choiceNames.h] > estimatedWin[choiceNames.l] ? choiceNames.l : choiceNames.h;
            const isLose = settleTurnConsumer.isLose(choice, currentCard, resultCard);
            if (isLose) {
                break;
            }

            if (i === maxTurn || cardPlayNextTurns.indexOf(resultCard.rank) === -1) {
                betwin = estimatedWin[choice];
                totalWinAmount += betwin;
                winCount++;
                break;
            }

            currentCard = resultCard;
            turnCount++;
        }
    }

    console.log(`TotalBet: ${totalBetAmount}`);
    console.log(`TotalWin: ${totalWinAmount}. Payout: ${(totalWinAmount / totalBetAmount) * 100}%`);
    console.log(`WinCount: ${winCount}`);
    console.log(`Payout: ${(totalWinAmount / totalBetAmount) * 100}%`);
}

run();
