import baseCards from '../constants/cards';
import Chance from 'chance';
import _ from 'lodash';

export default {
    drawCard: function (drawnCards) {
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
    },
};
