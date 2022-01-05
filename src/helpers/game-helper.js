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
        if (drawnCards.length === 0) {
            return false;
        }

        const lastCard = drawnCards[drawnCards.length - 1];
        return lastCard.rank === card1.rank && lastCard.suit === card1.suit;
    },
    drawCard: function (drawnCards) {
        const shuffleTimes = 3;
        let cards = [...baseCards];
        for (let i = 0; i < shuffleTimes; i++) {
            cards = this.shuffle(cards);
        }

        const firstCard = cards[0];
        return this.isDrawnCard(firstCard, drawnCards) ? cards[1] : firstCard;
    },
    calculateOdd: function (odds, card, totalTurns) {
        if (card <= 1) {
            return { [gameSettings.hiChoice]: 0, [gameSettings.loChoice]: 0 };
        }

        const stepOdd = 6 / (5 + totalTurns);
        const hiOdd = (odds[(card + 1).toString()] / 100) * stepOdd;
        const loOdd = (odds[(15 - card).toString()] / 100) * stepOdd;

        return { [gameSettings.hiChoice]: hiOdd, [gameSettings.loChoice]: loOdd };
    },
    rankCardByValue: function (previousCard, nextCard) {
        const highestCardValue = 13;

        return {
            pCard: previousCard.rank === 0 ? highestCardValue : previousCard.rank,
            nCard: nextCard.rank === 0 ? highestCardValue : nextCard.rank,
        };
    },
    isWin: function (choice, previousCard, nextCard) {
        if (previousCard.rank <= 1 || previousCard.rank === nextCard.rank) {
            return true;
        }

        const r = this.rankCardByValue(previousCard, nextCard);

        return (choice === gameSettings.hiChoice && r.pCard < r.nCard) || (choice === gameSettings.loChoice && r.nCard < r.pCard);
    },
    getSettlementResult: function (previousCard, nextCard) {
        if (previousCard.rank === nextCard.rank) {
            return 't';
        }

        const r = this.rankCardByValue(previousCard, nextCard);

        return r.pCard < r.nCard ? gameSettings.hiChoice : gameSettings.loChoice;
    },
    isExpiredRound: (lastTime, wholeRound) => {
        const remainingTime = (lastTime - new Date()) / 1000 + wholeRound;

        return remainingTime < 0;
    },
};
