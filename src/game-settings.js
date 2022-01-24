export default {
    id: 45,
    name: "Hilo",
    durations: {
        wholeRound: 60,
        placingBets: 40, // time for bot place bet
        lockingBet: 5, // time for bot place bet
        turnTime: 120,
    },
    choices: ["h", "l"],
    hiChoice: "h",
    loChoice: "l",
    tieResult: "t",
    actions: {
        bet: "bet",
        deal: "deal",
        collect: "collect",
    },
};
