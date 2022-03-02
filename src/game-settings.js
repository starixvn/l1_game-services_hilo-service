export const choiceNames = { h: "h", l: "l" };

export default {
    id: 45,
    name: "Hilo",
    durations: {
        wholeRound: 60,
        placingBets: 40, // time for bot place bet
        lockingBet: 5, // time for bot place bet
        turnTime: 121,
    },
    choices: [choiceNames.h, choiceNames.l],
    tieResult: "t",
    actions: {
        bet: "bet",
        deal: "deal",
        collect: "collect",
    },
};
