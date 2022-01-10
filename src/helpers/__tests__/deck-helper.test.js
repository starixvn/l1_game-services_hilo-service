import baseCards from '../../constants/cards';
import gameHelper from '../deck-helper';

describe('deck-helper', () => {
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
});
