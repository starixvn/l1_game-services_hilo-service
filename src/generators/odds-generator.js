import { choiceNames } from "../game-settings";
import { rankValueMapper, cardRanks } from "../cards";

export default {
    generate: function (odds, rank, totalTurns) {
        if (rank === cardRanks.ace || rank === cardRanks.two) {
            return { [choiceNames.h]: 0, [choiceNames.l]: 0 };
        }

        const stepOdds = 6 / (5 + totalTurns);
        const hiOdds = odds[`h_${rankValueMapper[rank]}`] * stepOdds;
        const loOdds = odds[`l_${rankValueMapper[rank]}`] * stepOdds;

        return { [choiceNames.h]: hiOdds, [choiceNames.l]: loOdds };
    },
};
