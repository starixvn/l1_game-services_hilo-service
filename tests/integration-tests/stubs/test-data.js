const game = {
    id: 45,
    name: 'Hilo',
};

const gameConfig = {
    type: 0,
    name: 'hilo',
    minBet: 10,
    maxBet: 3000,
    maxBetPerChoices: { even: 3000, odd: 3000, red3: 3000, white3: 3000, red4: 1000, white4: 1000, red2: 3000 },
    odds: {
        h_3: 5,
        h_4: 10,
        h_5: 28,
        h_6: 44,
        h_7: 83,
        h_8: 90,
        h_9: 127,
        h_10: 183,
        h_11: 276,
        h_12: 452,
        h_13: 1020,
        o_13: 5,
        o_12: 10,
        o_11: 28,
        o_10: 44,
        o_9: 83,
        h_8: 90,
        o_7: 127,
        o_6: 183,
        o_5: 276,
        o_4: 452,
        o_3: 1020,
    },
};

const currencyData = { code: 'USD', name: '$US' };

const rounds = [
    {
        uid: '61dd4c8a4cd022afdc871b0f',
        name: 'NormalUser',
        id: 2,
        amount: 10,

        paid: true,
        time: '2022-01-07T04:03:43.252+00:00',
        endTime: '2022-01-07T04:03:43.252+00:00',
        odds: {
            h_3: 5,
            h_4: 10,
            h_5: 28,
            h_6: 44,
            h_7: 83,
            h_8: 90,
            h_9: 127,
            h_10: 183,
            h_11: 276,
            h_12: 452,
            h_13: 1020,
            o_13: 5,
            o_12: 10,
            o_11: 28,
            o_10: 44,
            o_9: 83,
            h_8: 90,
            o_7: 127,
            o_6: 183,
            o_5: 276,
            o_4: 452,
            o_3: 1020,
        },

        memberId: 1001051,
        siteId: '4100300',
        freeBet: false,

        currency: '$US',
        rate: 1,
        partnerId: 'ONEworks1',

        betwin: 10,
        totalTurns: 1,
        result: [
            { rank: '4', suit: 2 },
            { rank: '5', suit: 0 },
        ],
        settlementResult: ['h'],
        exchangeRateId: 1282,
    },
];

const socketOptions = {
    socketUri: 'http://localhost:5001/user/hilo',
    gameName: game.name,
    proxyRoute: '/socket.io',
};

export { game, gameConfig, currencyData, rounds, socketOptions };
