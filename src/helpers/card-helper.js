import { Random as RandomJS, MersenneTwister19937 } from 'random-js';
import baseCards from '../constants/cards';
import gameSettings from '../game-settings';

export default {
    shuffle: function (array) {
        const random5 = new RandomJS(MersenneTwister19937.autoSeed());
        let noCards = array.length;
        while (noCards) {
            noCards--;
            const cardInd = random5.integer(0, noCards);
            const t = array[noCards];
            array[noCards] = array[cardInd];
            array[cardInd] = t;
        }

        return array;
    },
    isDrawnCard: function (card1, drawnCards) {
        return drawnCards.some((c) => c.card === card1.card && c.type === card1.type);
    },
    drawCard: function (drawnCards) {
        const shuffleTimes = 3;
        let cards = baseCards;
        for (let i = 0; i < shuffleTimes; i++) {
            cards = this.shuffle(cards);
        }

        for (let i = 0; i < cards.length; i++) {
            const c = cards[i];
            if (this.isDrawnCard(c, drawnCards)) {
                continue;
            }

            return c;
        }

        return null;
    },
    calculateOdd: function (odds, card, stepCount) {
        if (card <= 1) {
            return { [gameSettings.hiChoice]: 0, [gameSettings.loChoice]: 0 };
        }

        var up = (odds[(card + 1).toString()] / 100) * (6 / (5 + stepCount));
        var down = (odds[(15 - card).toString()] / 100) * (6 / (5 + stepCount));

        return { [gameSettings.hiChoice]: up, [gameSettings.loChoice]: down };
    },
    isWin: function (choice, previousCard, nextCard) {
        if (previousCard.card <= 1) {
            return true;
        }

        if (choice === gameSettings.hiChoice) {
            return nextCard.card === 0 || nextCard.card >= previousCard.card;
        }

        return nextCard.card === 1 || (nextCard.card >= 2 && nextCard.card <= previousCard.card);
    },
    getSettlementResult: function (previousCard, nextCard) {
        if (previousCard.card < nextCard.card) {
            return gameSettings.hiChoice;
        }

        if (nextCard.card < previousCard.card) {
            return gameSettings.loChoice;
        }

        return 'tie';
    },
};
