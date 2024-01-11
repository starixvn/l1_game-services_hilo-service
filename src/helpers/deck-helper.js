import { baseCards } from "../cards";
import Chance from "chance";
import _ from "lodash";
import { shuffle as d3Shuffle } from "d3-array";
import { Random as RandomJS, MersenneTwister19937 } from "random-js";
import Random from "random";
import { randomInt } from "crypto";

const chance = new Chance();

export const mathRandom = () => {
    return Math.random(); // NOSONAR
};

const random1 = (max) => {
    return Math.floor(mathRandom() * max);
};

const random2 = (max) => {
    return chance.integer({ min: 0, max });
};

const random3 = (max) => {
    return Random.int(0, max);
};

const random4 = (max) => {
    const randomJS = new RandomJS(MersenneTwister19937.autoSeed());

    return randomJS.integer(0, max);
};

const random5 = (max) => {
    return randomInt(max + 1);
};

const random6 = (max) => {
    const seed = Math.floor(mathRandom() * 100000);
    const randomJS = new RandomJS(MersenneTwister19937.seed(seed));
    return randomJS.integer(0, max);
};

const randomFunctions = {
    1: [random1, random2, random3],
    2: [random4, random5, random6],
};

const randomCustomize = (mode, max) => {
    const functions = randomFunctions[mode];
    const selectedRandomMethodIndex = Math.floor(mathRandom() * functions.length);
    const randomFunction = functions[selectedRandomMethodIndex];

    return randomFunction(max);
};

const shuffle1 = (arr) => {
    return chance.shuffle(chance.shuffle(chance.shuffle(arr)));
};

const shuffle2 = (arr) => {
    return d3Shuffle(d3Shuffle(d3Shuffle(arr)));
};

const shuffle3 = (arr) => {
    let result = arr;
    const r = new RandomJS(MersenneTwister19937.autoSeed());

    for (let i = 0; i < 3; i++) {
        result = r.shuffle(arr);
    }

    return result;
};

const shuffle4 = (arr) => {
    return _.shuffle(_.shuffle(_.shuffle(arr)));
};

const shuffleCards2 = (array, mode) => {
    for (let i = 0; i < 3; i++) {
        let lastElementIndex = array.length - 1;

        while (lastElementIndex) {
            const randomIndex = randomCustomize(mode, array.length - 1);
            lastElementIndex--;
            const lastElement = array[lastElementIndex];

            array[lastElementIndex] = array[randomIndex];
            array[randomIndex] = lastElement;
        }
    }
    return array;
};

const shuffle5 = (arr) => {
    return shuffleCards2(arr, 1);
};

const shuffle6 = (arr) => {
    return shuffleCards2(arr, 2);
};

export const randomModes = {
    1: [shuffle1, shuffle2, shuffle3],
    2: [shuffle4, shuffle5, shuffle6],
    3: [shuffle1, shuffle3, shuffle5],
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
