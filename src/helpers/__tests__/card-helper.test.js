import baseCards from '../../constants/cards';
import cardHelper from '../card-helper';

describe('game-cron', () => {
    describe('shuffle', () => {
        it('should return enough cards', () => {
            // arrange
            const cards = baseCards;
            const expectedCards = 52;

            // act
            const actualValue = cardHelper.shuffle(cards);

            //assert
            expect(actualValue.length).toBe(expectedCards);
        });
    });

    describe('isDrawnCard', () => {
        // arrange
        const testCases = [
            { card: { card: 3, type: 2 }, expectedValue: true },
            { card: { card: 6, type: 2 }, expectedValue: false },
        ];

        it.each(testCases)('should return correct value', (testCase) => {
            // arrange
            const drawnCards = [{ card: 3, type: 2 }];

            // act
            const actualValue = cardHelper.isDrawnCard(testCase.card, drawnCards);

            //assert
            expect(actualValue).toBe(testCase.expectedValue);
        });
    });

    describe('drawCard', () => {
        it('when already drawn all cards should return null', () => {
            // arrange
            const drawnCards = baseCards;

            // act
            const actualValue = cardHelper.drawCard(drawnCards);

            //assert
            expect(actualValue).toBeNull();
        });

        it('when 1st draw should return card', () => {
            // arrange
            const drawnCards = [];

            // act
            const actualValue = cardHelper.drawCard(drawnCards);

            //assert
            expect(actualValue).not.toBeNull();
        });
    });

    describe('calculateOdd', () => {
        // arrange
        const testCases = [
            { card: 0, expectedValue: { hi: 0, lo: 0 } },
            { card: 1, expectedValue: { hi: 0, lo: 0 } },
            { card: 10, expectedValue: { hi: 2.76, lo: 0.28 } },
        ];

        it.each(testCases)('should return correct odds', (testCase) => {
            // arrange
            const odds = { ['11']: 276, ['5']: 28 };
            const stepCount = 1;

            // act
            const actualValue = cardHelper.calculateOdd(odds, testCase.card, stepCount);

            //assert
            expect(actualValue).toStrictEqual(testCase.expectedValue);
        });
    });

    describe('isWin', () => {
        // arrange
        const testCases = [
            { previousCard: { card: 0 }, expectedValue: true },
            { previousCard: { card: 1 }, expectedValue: true },
            { nextCard: { card: 0 }, previousCard: { card: 3 }, choice: 'hi', expectedValue: true },
            { nextCard: { card: 3 }, previousCard: { card: 3 }, choice: 'hi', expectedValue: true },
            { nextCard: { card: 3 }, previousCard: { card: 2 }, choice: 'hi', expectedValue: true },
            { nextCard: { card: 3 }, previousCard: { card: 4 }, choice: 'hi', expectedValue: false },
            { nextCard: { card: 1 }, previousCard: { card: 3 }, choice: 'lo', expectedValue: true },
            { nextCard: { card: 3 }, previousCard: { card: 3 }, choice: 'lo', expectedValue: true },
            { nextCard: { card: 3 }, previousCard: { card: 2 }, choice: 'lo', expectedValue: false },
            { nextCard: { card: 3 }, previousCard: { card: 4 }, choice: 'lo', expectedValue: true },
        ];

        it.each(testCases)('should return correct value', (testCase) => {
            // act
            const actualValue = cardHelper.isWin(testCase.choice, testCase.previousCard, testCase.nextCard);

            //assert
            expect(actualValue).toStrictEqual(testCase.expectedValue);
        });
    });

    describe('getSettlementResult', () => {
        // arrange
        const testCases = [
            { nextCard: { card: 3 }, previousCard: { card: 3 }, expectedValue: 'tie' },
            { nextCard: { card: 3 }, previousCard: { card: 2 }, expectedValue: 'hi' },
            { nextCard: { card: 3 }, previousCard: { card: 4 }, expectedValue: 'lo' },
        ];

        it.each(testCases)('should return correct value', (testCase) => {
            // act
            const actualValue = cardHelper.getSettlementResult(testCase.previousCard, testCase.nextCard);

            //assert
            expect(actualValue).toStrictEqual(testCase.expectedValue);
        });
    });
});
