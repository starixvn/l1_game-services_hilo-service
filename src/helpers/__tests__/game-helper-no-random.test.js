import baseCards from '../../constants/cards';
import gameHelper from '../game-helper';

jest.mock('random-js', () => {
    return {
        Random: function () {
            return {
                integer: (min, max) => max, // not shuffle base card
            };
        },
        MersenneTwister19937: {
            autoSeed: () => {},
        },
    };
});

describe('game-helper-no-random-test', () => {
    describe('drawCard', () => {
        it('cards previously drawn should return next card', () => {
            // arrange
            const drawnCards = [{ card: 0, type: 0 }];
            const expectedValue = { card: 0, type: 1 };

            // act
            const actualValue = gameHelper.drawCard(drawnCards);

            //assert
            expect(actualValue).toStrictEqual(expectedValue);
        });

        it('cards not previously drawn should return first card', () => {
            // arrange
            const drawnCards = [{ card: 0, type: 1 }];
            const expectedValue = { card: 0, type: 0 };

            // act
            const actualValue = gameHelper.drawCard(drawnCards);

            //assert
            expect(actualValue).toStrictEqual(expectedValue);
        });
    });
});
