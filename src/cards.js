const cardSuits = {
    hearts: 0,
    diamonds: 1,
    clubs: 2,
    spades: 3,
};

const cardRanks = {
    ace: 'A',
    two: '2',
    three: '3',
    four: '4',
    five: '5',
    six: '6',
    seven: '7',
    eight: '8',
    nine: '9',
    ten: '10',
    jack: 'J',
    queen: 'Q',
    king: 'K',
};

const rankValueMapper = {
    A: 14,
    2: 2,
    3: 3,
    4: 4,
    5: 5,
    6: 6,
    7: 7,
    8: 8,
    9: 9,
    10: 10,
    J: 11,
    Q: 12,
    K: 13,
};

const baseCards = [];
Object.keys(cardRanks).forEach((rank) => {
    Object.values(cardSuits).forEach((suit) =>
        baseCards.push({
            suit,
            rank: cardRanks[rank],
        })
    );
});

export { baseCards, rankValueMapper, cardRanks };
