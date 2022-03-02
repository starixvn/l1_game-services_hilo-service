import gameSettings, { choiceNames } from "../../src/game-settings";
import { drawCard } from "../../src/helpers/deck-helper";
import SettleTurnConsumer from "../../src/event-consumers/settle-turn-consumer";
import { odds } from "../../src/__tests__/test-data";
import { calculateWinAmounts } from "./helpers";
import { cardRanks } from "../../src/cards";

function isMatch(pattern, settlementResults) {
    if (settlementResults.length + 1 < pattern.length) {
        return false;
    }

    const l = pattern.length - 1;
    for (let i = 0; i < l; i++) {
        if (settlementResults[settlementResults.length - 1 - i] !== pattern[pattern.length - 2 - i]) {
            return false;
        }
    }

    return true;
}

function run() {
    const totalRounds = 100_000;
    const amount = 1;
    let totalBetAmount = 0;
    let totalWinAmount = 0;
    let winCount = 0;
    const settleTurnConsumer = new SettleTurnConsumer({});
    const patterns = [
        [choiceNames.h, choiceNames.h, choiceNames.h, choiceNames.l],
        [choiceNames.l, choiceNames.l, choiceNames.l, choiceNames.h],
        [choiceNames.h, choiceNames.h, choiceNames.l, choiceNames.h],
        [choiceNames.l, choiceNames.l, choiceNames.h, choiceNames.l],
    ];
    const settlementResults = [];

    for (let index = 0; index < totalRounds; index++) {
        totalBetAmount += 1;
        const firstCard = drawCard();
        if (firstCard.rank === cardRanks.two || firstCard.rank === cardRanks.ace) {
            totalWinAmount += amount;
            winCount++;
            continue;
        }

        const resultCard = drawCard(firstCard);
        const estimatedWin = calculateWinAmounts(odds, firstCard, 1, amount, resultCard);
        const pattern = patterns.find((p) => isMatch(p, settlementResults));
        const choice = pattern ? pattern[pattern.length - 1] : choiceNames.h;
        const settlementResult = settleTurnConsumer.getSettlementResult(firstCard, resultCard);

        if (settlementResult !== gameSettings.tieResult) {
            settlementResults.push(settlementResult);
        }

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
