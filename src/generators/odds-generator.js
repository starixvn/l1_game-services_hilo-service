import gameSettings from "../game-settings";
import { rankValueMapper, cardRanks } from "../cards";

export default {
    generate: function (odds, rank, totalTurns) {
        if (rank === cardRanks.ace || rank === cardRanks.two) {
            return { [gameSettings.hiChoice]: 0, [gameSettings.loChoice]: 0 };
        }

        const stepOdds = 6 / (5 + totalTurns);
        const hiOdds = odds[`h_${rankValueMapper[rank]}`] * stepOdds;
        const loOdds = odds[`l_${rankValueMapper[rank]}`] * stepOdds;

        return { [gameSettings.hiChoice]: hiOdds, [gameSettings.loChoice]: loOdds };
    },
};
