const game = {
    id: 45,
    name: "Hilo",
};

const gameConfig = {
    type: 0,
    name: "hilo",
    minBet: 10,
    maxBet: 3000,
    maxBetPerChoices: { even: 3000, odd: 3000, red3: 3000, white3: 3000, red4: 1000, white4: 1000, red2: 3000 },
    odds: {
        high3: 5,
        high4: 10,
        high5: 28,
        high6: 44,
        high7: 83,
        high8: 90,
        high9: 127,
        high10: 183,
        high11: 276,
        high12: 452,
        high13: 1020,
        low13: 5,
        low12: 10,
        low11: 28,
        low10: 44,
        low9: 83,
        low8: 90,
        low7: 127,
        low6: 183,
        low5: 276,
        low4: 452,
        low3: 1020,
    },
};

const currencyData = { code: "USD", name: "$US" };

const rounds = [
    {
        uid: "61dd4c8a4cd022afdc871b0f",
        name: "NormalUser",
        id: 2,
        amount: 10,

        paid: true,
        time: "2022-01-07T04:03:43.252+00:00",
        endTime: "2022-01-07T04:03:43.252+00:00",
        odds: {
            high3: 5,
            high4: 10,
            high5: 28,
            high6: 44,
            high7: 83,
            high8: 90,
            high9: 127,
            high10: 183,
            high11: 276,
            high12: 452,
            high13: 1020,
            low13: 5,
            low12: 10,
            low11: 28,
            low10: 44,
            low9: 83,
            low8: 90,
            low7: 127,
            low6: 183,
            low5: 276,
            low4: 452,
            low3: 1020,
        },

        memberId: 1001051,
        siteId: "4100300",
        freeBet: false,

        currency: "$US",
        rate: 1,
        partnerId: "ONEworks1",

        betwin: 10,
        totalTurns: 1,
        result: [
            { rank: "4", suit: 2 },
            { rank: "5", suit: 0 },
        ],
        settlementResult: ["h"],
        exchangeRateId: 1282,
    },
];

const socketOptions = {
    socketUri: "http://localhost:5001/user/hilo",
    gameName: game.name,
    proxyRoute: "/socket.io",
};

export { game, gameConfig, currencyData, rounds, socketOptions };
