import gameSettings from '../game-settings';

export default {
    generate: function (odds, rank, totalTurns) {
        if (rank <= 2) {
            return { [gameSettings.hiChoice]: 0, [gameSettings.loChoice]: 0 };
        }

        const stepOdds = 6 / (5 + totalTurns);
        const hiOdds = (odds[`h_${rank}`] / 100) * stepOdds;
        const loOdds = (odds[`l_${rank}`] / 100) * stepOdds;

        return { [gameSettings.hiChoice]: hiOdds, [gameSettings.loChoice]: loOdds };
    },
};
