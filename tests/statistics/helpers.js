import oddsGenerator from "../../src/generators/odds-generator";
import { choiceNames } from "../../src/game-settings";

const calculateWinAmounts = (oddsConfig, currentCard, totalTurns, currentAmount, resultCard) => {
    const odds =
        resultCard.rank === currentCard.rank
            ? { [choiceNames.h]: 0, [choiceNames.l]: 0 }
            : oddsGenerator.generate(oddsConfig, currentCard.rank, totalTurns);

    return {
        [choiceNames.h]: parseFloat(((1 + odds[choiceNames.h]) * currentAmount).toFixed(2)),
        [choiceNames.l]: parseFloat(((1 + odds[choiceNames.l]) * currentAmount).toFixed(2)),
    };
};

export { calculateWinAmounts };
