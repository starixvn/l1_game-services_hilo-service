import gameSettings from '../game-settings';

export default {
    generate: function (odds, card, totalTurns) {
        if (card <= 1) {
            return { [gameSettings.hiChoice]: 0, [gameSettings.loChoice]: 0 };
        }

        const stepOdds = 6 / (5 + totalTurns);
        const hiOdds = (odds[(card + 1).toString()] / 100) * stepOdds;
        const loOdds = (odds[(15 - card).toString()] / 100) * stepOdds;

        return { [gameSettings.hiChoice]: hiOdds, [gameSettings.loChoice]: loOdds };
    },
};
