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

    describe('calculateOdd', () => {
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
            const actualValue = gameHelper.calculateOdd(odds, testCase.rank, totalTurns);

            //assert
            expect(actualValue).toStrictEqual(testCase.expectedValue);
        });
    });

    describe('isWin', () => {
        // arrange
        const testCases = [
            { previousCard: { rank: 0 }, expectedValue: true },
            { previousCard: { rank: 1 }, expectedValue: true },
            { nextCard: { rank: 0 }, previousCard: { rank: 3 }, choice: 'h', expectedValue: true },
            { nextCard: { rank: 3 }, previousCard: { rank: 3 }, choice: 'h', expectedValue: true },
            { nextCard: { rank: 3 }, previousCard: { rank: 2 }, choice: 'h', expectedValue: true },
            { nextCard: { rank: 3 }, previousCard: { rank: 4 }, choice: 'h', expectedValue: false },
            { nextCard: { rank: 1 }, previousCard: { rank: 3 }, choice: 'l', expectedValue: true },
            { nextCard: { rank: 3 }, previousCard: { rank: 3 }, choice: 'l', expectedValue: true },
            { nextCard: { rank: 3 }, previousCard: { rank: 2 }, choice: 'l', expectedValue: false },
            { nextCard: { rank: 3 }, previousCard: { rank: 4 }, choice: 'l', expectedValue: true },
        ];

        it.each(testCases)('should return correct value', (testCase) => {
            // act
            const actualValue = gameHelper.isWin(testCase.choice, testCase.previousCard, testCase.nextCard);

            //assert
            expect(actualValue).toStrictEqual(testCase.expectedValue);
        });
    });

    describe('getSettlementResult', () => {
        // arrange
        const testCases = [
            { nextCard: { rank: 3 }, previousCard: { rank: 3 }, expectedValue: 't' },
            { nextCard: { rank: 3 }, previousCard: { rank: 0 }, expectedValue: 'l' },
            { nextCard: { rank: 1 }, previousCard: { rank: 0 }, expectedValue: 'l' },
            { nextCard: { rank: 1 }, previousCard: { rank: 2 }, expectedValue: 'l' },

            { nextCard: { rank: 0 }, previousCard: { rank: 1 }, expectedValue: 'h' },
            { nextCard: { rank: 0 }, previousCard: { rank: 2 }, expectedValue: 'h' },
            { nextCard: { rank: 2 }, previousCard: { rank: 1 }, expectedValue: 'h' },

            { nextCard: { rank: 3 }, previousCard: { rank: 2 }, expectedValue: 'h' },
            { nextCard: { rank: 3 }, previousCard: { rank: 4 }, expectedValue: 'l' },
        ];

        it.each(testCases)('should return correct value', (testCase) => {
            // act
            const actualValue = gameHelper.getSettlementResult(testCase.previousCard, testCase.nextCard);

            //assert
            expect(actualValue).toStrictEqual(testCase.expectedValue);
        });
    });

    describe('isExpiredRound', () => {
        // arrange
        const testCases = [
            { round: { turnTime: new Date() }, expectedValue: false },
            { round: { turnTime: new Date() - 200000 }, expectedValue: true },
        ];

        it.each(testCases)('should return correct value', (testCase) => {
            // act
            const actualValue = gameHelper.isExpiredRound(testCase.round.turnTime, 120);

            //assert
            expect(actualValue).toBe(testCase.expectedValue);
        });
    });
});
