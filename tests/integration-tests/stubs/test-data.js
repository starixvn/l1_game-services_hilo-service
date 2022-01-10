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
    odds: { 3: 5, 4: 10, 5: 28, 6: 44, 7: 83, 8: 90, 9: 127, 10: 183, 11: 276, 12: 452, 13: 1020 },
};

const currencyData = { code: 'USD', name: '$US' };

const rounds = [
    {
        uid: '61dd4c8a4cd022afdc871b0f',
        name: 'NormalUser',
        phien: 2,
        amount: 10,

        thanhtoan: true,
        betwin: 0,
        time: '2022-01-07T04:03:43.252+00:00',
        endTime: '2022-01-07T04:03:43.252+00:00',
        odds: { 3: 5, 4: 10, 5: 28, 6: 44, 7: 83, 8: 90, 9: 127, 10: 183, 11: 276, 12: 452, 13: 1020 },

        memberId: 1001051,
        siteId: '4100300',
        freeBet: false,

        currency: '$US',
        rate: 1,
        partnerId: 'ONEworks1',

        totalAmount: 10,
        totalTurns: 1,
        result: [
            { rank: 3, suit: 2 },
            { rank: 4, suit: 0 },
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
