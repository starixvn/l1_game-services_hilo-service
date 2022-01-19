import { baseCards } from "../cards";
import Chance from "chance";
import _ from "lodash";

export const drawCard = (drawnCards) => {
    const rand = new Chance();
    let cards = [...baseCards];

    if (drawnCards.length > 0) {
        const excludedCard = drawnCards[drawnCards.length - 1];
        const index = _.findIndex(cards, excludedCard);
        cards.splice(index, 1);
    }

    const shuffleTimes = 3;
    for (let i = 0; i < shuffleTimes; i++) {
        cards = rand.shuffle(cards);
    }

    return cards[0];
};

export const getCardFromAdmin = (cardRank, drawnCards) => {
    const chance = new Chance();
    let cards = [...baseCards];

    if (drawnCards.length > 0) {
        const excludedCard = drawnCards[drawnCards.length - 1];
        cards = cards.filter((x) => x.rank !== excludedCard.rank || x.suit !== excludedCard.suit);
    }

    return chance.pickone(cards.filter((x) => x.rank === cardRank));
};
