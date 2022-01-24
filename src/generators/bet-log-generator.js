export const createBetLog = (gameData, runningRound, currentCard, resultCard, choice, betWin) => {
    const player = Object.values(gameData.realPlayers).find((p) => p.UID === runningRound.uid);
    const rate = player.session.multiplier * gameData.exchangeRates.code[player.session.currencyCode];

    return {
        uid: runningRound.uid,
        name: runningRound.name,
        roundId: runningRound.id,

        time: new Date(),
        amount: runningRound.betWin,
        betwin: betWin,
        choice,

        memberId: player.session.memberId,
        siteId: player.session.siteId,
        partnerId: player.session.partnerId,
        currency: player.session.currencyName,
        rate: rate,

        order: runningRound.totalTurns + 1,
        cards: [currentCard, resultCard],
    };
};
