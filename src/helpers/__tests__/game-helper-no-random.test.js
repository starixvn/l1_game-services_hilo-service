import gameHelper from '../game-helper';

jest.mock('random-js', () => {
    return {
        Random: function () {
            return {
                integer: (_, max) => max, // not shuffle base card
            };
        },
        MersenneTwister19937: {
            autoSeed: () => {},
        },
    };
});

describe('game-helper-no-random-test', () => {
    describe('drawCard', () => {
        it('card previously drawn should return next card', () => {
            // arrange
            const drawnCards = [{ rank: 0, suit: 0 }];
            const expectedValue = { rank: 0, suit: 1 };

            // act
            const actualValue = gameHelper.drawCard(drawnCards);

            //assert
            expect(actualValue).toStrictEqual(expectedValue);
        });

        it('card not previously drawn should return first card', () => {
            // arrange
            const drawnCards = [{ rank: 0, suit: 1 }];
            const expectedValue = { rank: 0, suit: 0 };

            // act
            const actualValue = gameHelper.drawCard(drawnCards);

            //assert
            expect(actualValue).toStrictEqual(expectedValue);
        });
    });
});
