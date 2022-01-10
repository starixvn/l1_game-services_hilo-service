import baseCards from '../../constants/cards';
import gameHelper from '../game-helper';

describe('game-helper', () => {
    describe('shuffle', () => {
        it('should return enough cards', () => {
            // arrange
            const cards = baseCards;
            const expectedCards = 52;

            // act
            const actualValue = gameHelper.shuffle(cards);

            //assert
            expect(actualValue.length).toBe(expectedCards);
        });
    });

    describe('isDrawnCard', () => {
        // arrange
        const testCases = [
            { card: { rank: 3, suit: 2 }, expectedValue: true },
            { card: { rank: 6, suit: 2 }, expectedValue: false },
        ];

        it.each(testCases)('should return correct value', (testCase) => {
            // arrange
            const drawnCards = [{ rank: 3, suit: 2 }];

            // act
            const actualValue = gameHelper.isDrawnCard(testCase.card, drawnCards);

            //assert
            expect(actualValue).toBe(testCase.expectedValue);
        });
    });

    describe('drawCard', () => {
        it('when already drawn all cards should also return card, card can be duplicate', () => {
            // arrange
            const drawnCards = baseCards;

            // act
            const actualValue = gameHelper.drawCard(drawnCards);

            //assert
            expect(actualValue).not.toBeNull();
        });

        it('when 1st draw should return card', () => {
            // arrange
            const drawnCards = [];

            // act
            const actualValue = gameHelper.drawCard(drawnCards);

            //assert
            expect(actualValue).not.toBeNull();
        });
    });

    describe('calculateOdds', () => {
        // arrange
        const testCases = [
            { rank: 0, expectedValue: { h: 0, l: 0 } },
            { rank: 1, expectedValue: { h: 0, l: 0 } },
            { rank: 10, expectedValue: { h: 2.76, l: 0.28 } },
        ];

        it.each(testCases)('should return correct odds', (testCase) => {
            // arrange
            const odds = { ['11']: 276, ['5']: 28 };
            const totalTurns = 1;

            // act
            const actualValue = gameHelper.calculateOdds(odds, testCase.rank, totalTurns);

            //assert
            expect(actualValue).toStrictEqual(testCase.expectedValue);
        });
    });
});
