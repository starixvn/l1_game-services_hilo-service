import { baseCards, cardRanks } from "../../src/cards";
import { choiceNames } from "../../src/game-settings";
import { drawCard } from "../../src/helpers/deck-helper";
import SettleTurnConsumer from "../../src/event-consumers/settle-turn-consumer";
import oddsGenerator from "../../src/generators/odds-generator";
import { odds } from "../../src/__tests__/test-data";

function run() {
    const totalRounds = 10;
    const amount = 1;
    let totalBetAmount = 0;
    let totalWinAmount = 0;
    let winCount = 0;
    const settleTurnConsumer = new SettleTurnConsumer({});

    for (let index = 0; index < totalRounds; index++) {
        totalBetAmount += 1;
        const firstCard = drawCard();
        const estimatedWin = calculateWinAmounts(odds, firstCard, 1, amount);

        const choice = estimatedWin[choiceNames.h] > estimatedWin[choiceNames.l] ? choiceNames.h : choiceNames.l;

        if (!settleTurnConsumer.isLose(choice, firstCard, drawCard(firstCard))) {
            totalWinAmount += estimatedWin[choice];
            winCount++;
        }
    }

    console.log(`TotalBet: ${totalBetAmount}`);
    console.log(`TotalWin: ${totalWinAmount}. Payout: ${(totalWinAmount / totalBetAmount) * 100}%`);
    console.log(`WinCount: ${winCount}`);
    console.log(`Payout: ${(totalWinAmount / totalBetAmount) * 100}%`);
}

const calculateWinAmounts = (oddsConfig, currentCard, totalTurns, currentAmount) => {
    const odds = oddsGenerator.generate(oddsConfig, currentCard.rank, totalTurns);

    return {
        [choiceNames.h]: parseFloat(((1 + odds[choiceNames.h]) * currentAmount).toFixed(2)),
        [choiceNames.l]: parseFloat(((1 + odds[choiceNames.l]) * currentAmount).toFixed(2)),
    };
};

run();
