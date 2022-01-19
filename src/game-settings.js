export default {
    id: 45,
    name: "Hilo",
    durations: {
        wholeRound: 60,
        placingBets: 40, // time for bot place bet
        lockingBet: 5, // time for bot place bet
    },
    choices: ["h", "l"],
    newGameChoice: "amount",
    hiChoice: "h",
    loChoice: "l",
    tieResult: "t",
    turnTime: 120,
    actions: {
        bet: "bet",
        deal: "deal",
        collect: "collect",
    },
};
