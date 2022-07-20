import { baseCards } from "../cards";
import Chance from "chance";
import _ from "lodash";
import { shuffle as d3Shuffle } from "d3-array";
import { Random as RandomJS, MersenneTwister19937 } from "random-js";

const random1 = (arr) => {
    const chance = new Chance();
    return chance.shuffle(chance.shuffle(chance.shuffle(arr)));
};

const random2 = (arr) => {
    return d3Shuffle(d3Shuffle(d3Shuffle(arr)));
};

const random3 = (arr) => {
    let result = arr;
    const r = new RandomJS(MersenneTwister19937.autoSeed());

    for (let i = 0; i < 3; i++) {
        result = r.shuffle(arr);
    }

    return result;
};

const random4 = (arr) => {
    return _.shuffle(_.shuffle(_.shuffle(arr)));
};

const randomModes = {
    1: [random1],
    2: [random2],
    3: [random3, random4],
};

export const drawCard = (randomMode, excludedCard = null) => {
    const cards = [...baseCards];

    if (!!excludedCard) {
        const index = _.findIndex(cards, excludedCard);
        cards.splice(index, 1);
    }

    const randomShuffles = randomModes[randomMode] || randomModes[1];
    const chance = new Chance();
    const shuffle = chance.pickone(randomShuffles);
    const deck = shuffle(cards);

    return deck[0];
};

export const getCardFromAdmin = (cardRank, drawnCards) => {
    const chance = new Chance();
    const cards = [...baseCards];

    if (drawnCards.length > 0) {
        const excludedCard = drawnCards[drawnCards.length - 1];
        const index = cards.findIndex((x) => x.rank === excludedCard.rank && x.suit === excludedCard.suit);
        cards.splice(index, 1);
    }

    return chance.pickone(cards.filter((x) => x.rank === cardRank));
};
