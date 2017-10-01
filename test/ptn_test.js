import { describe, it } from 'mocha';
import { expect } from 'chai';

import Ptn from '../source/ptn';

describe('Ptn', () => {
  describe('#properties', () => {
    it('recognizes a movement', () => {
      expect(
        Ptn.parse('3d3+111')
      ).to.include({
        ptn:          '3d3+111',
        pieceCount:   '3',
        column:       'd',
        row:          '3',
        movement:     '+111',
        direction:    '+',
        distribution: '111',
        x:            3,
        y:            2
      });
    });

    it('recognizes a capstone placement', () => {
      expect(
        Ptn.parse('Cd3')
      ).to.include({
        ptn:          'Cd3',
        specialPiece: 'C',
        column:       'd',
        row:          '3',
        x:            3,
        y:            2
      });
    });

    it('recognizes a wall placement', () => {
      expect(
        Ptn.parse('Sd3')
      ).to.include({
        ptn:          'Sd3',
        specialPiece: 'S',
        column:       'd',
        row:          '3',
        x:            3,
        y:            2
      });
    });

    it('recognizes a wall smash', () => {
      expect(
        Ptn.parse('3d3>111*')
      ).to.include({
        wallSmash: '*'
      });
    });

    it('throws an error for invalid PTN', () => {
      expect(() => {
        Ptn.parse('9z')
      }).to.throw('Invalid PTN format');
    });
  });

  describe('#fromMoveset', () => {
    it('converts from a moveset to ptn', () => {
      expect(Ptn.fromMoveset([
        { action: 'push', x: 2, y: 2 }
      ])).to.equal('c3');
    });

    it('converts from a special placement to ptn', () => {
      expect(Ptn.fromMoveset([
        { action: 'push', x: 2, y: 2, type: 'capstone' }
      ])).to.equal('Cc3');

      expect(Ptn.fromMoveset([
        { action: 'push', x: 2, y: 2, type: 'wall' }
      ])).to.equal('Sc3');
    });

    it('converts a movement PTN', () => {
      expect(Ptn.fromMoveset([{
        action: 'pop', count: 3, x: 2, y: 2
      }, {
        action: 'push', count: 1, x: 3, y: 2
      }, {
        action: 'push', count: 1, x: 4, y: 2
      }, {
        action: 'push', count: 1, x: 5, y: 2
      }])).to.equal('3c3>111');
    });

    it('converts a movement with a wall smash', () => {
      expect(Ptn.fromMoveset([{
        action: 'pop', count: 1, x: 2, y: 2
      }, {
        action: 'push', count: 1, flatten: true, x: 3, y: 2
      }])).to.equal('1c3>1*');
    });
  });

  describe('#toMoveset', () => {
    it('converts PTN to a moveset', () => {
      expect(
        Ptn.parse('c3').toMoveset()
      ).to.deep.equal([
        { action: 'push', x: 2, y: 2, type: 'flat' }
      ]);
    });

    it('converts a movement PTN', () => {
      expect(
        Ptn.parse('3c3>111').toMoveset()
      ).to.deep.equal([{
        action: 'pop', count: 3, x: 2, y: 2
      }, {
        action: 'push', count: 1, x: 3, y: 2
      }, {
        action: 'push', count: 1, x: 4, y: 2
      }, {
        action: 'push', count: 1, x: 5, y: 2
      }]);
    });

    it('converts a movement with a wall smash', () => {
      expect(
        Ptn.parse('c3>*').toMoveset()
      ).to.deep.equal([{
        action: 'pop', count: 1, x: 2, y: 2
      }, {
        action: 'push', count: 1, flatten: true, x: 3, y: 2
      }]);
    });
  });

  describe('#toUndoMoveset', () => {
    it('converts PTN to a moveset', () => {
      expect(
        Ptn.parse('c3').toUndoMoveset()
      ).to.deep.equal([
        { action: 'pop', x: 2, y: 2, type: 'flat' }
      ]);
    });

    it('converts a movement PTN', () => {
      expect(
        Ptn.parse('3c3>111').toUndoMoveset()
      ).to.deep.equal([{
        action: 'pop', count: 1, x: 5, y: 2
      }, {
        action: 'pop', count: 1, x: 4, y: 2
      }, {
        action: 'pop', count: 1, x: 3, y: 2
      }, {
        action: 'push', count: 3, x: 2, y: 2
      }]);
    });

    it('converts a movement with a wall smash', () => {
      expect(
        Ptn.parse('c3>*').toUndoMoveset()
      ).to.deep.equal([{
        action: 'pop', count: 1, flatten: true, x: 3, y: 2
      }, {
        action: 'push', count: 1, x: 2, y: 2
      }]);
    });
  });

  describe('#stackTotal', () => {
    it('gives the total of pieces moved', () => {
      expect(
        Ptn.parse('3d3+111').stackTotal()
      ).to.equal(3);
    });

    it('returns 1 if there is no distribution', () => {
      expect(
        Ptn.parse('d3').stackTotal()
      ).to.equal(1);
    });
  });

  describe('#isValidStackDistribution', () => {
    it('checks if the piece count and stack total match', () => {
      expect(
        Ptn.parse('3d3+111').isValidStackDistribution()
      ).to.equal(true);
    });

    it('will be false if the counts are different', () => {
      expect(
        Ptn.parse('3d3+1111').isValidStackDistribution()
      ).to.equal(false);
    });

    it('will return true if there are no pieces and no distribution', () => {
      expect(
        Ptn.parse('d3').isValidStackDistribution()
      ).to.equal(true);
    });
  });

  describe('#isMovement', () => {
    it('looks for a movement', () => {
      expect(
        Ptn.parse('d3+').isMovement()
      ).to.equal(true);
    });

    it('can detect more complicated movements', () => {
      expect(
        Ptn.parse('d3+*').isMovement()
      ).to.equal(true);
    });

    it('will return false if no move is made', () => {
      expect(
        Ptn.parse('d3').isMovement()
      ).to.equal(false);
    });
  });

  describe('#isPlacement', () => {
    it('looks for a placement', () => {
      expect(
        Ptn.parse('d3').isPlacement()
      ).to.equal(true);
    });

    it('can detect a special placement', () => {
      expect(
        Ptn.parse('Cd3').isPlacement()
      ).to.equal(true);
    });

    it('will return false for a non placement', () => {
      expect(
        Ptn.parse('3d3').isPlacement()
      ).to.equal(false);
    });
  });

  describe('#isValid', () => {
    it('checks to see if the PTN is valid', () => {
      const ptn = Ptn.parse('3d3+1111');

      expect(ptn.isValid()).to.equal(false);
      expect(ptn.errors[0]).to.include('PTN does not contain a valid stack distribution');
    });
  });

  describe('#rowTrajectory', () => {
    it('will return the row number if it is a placement', () => {
      expect(
        Ptn.parse('d3').rowTrajectory()
      ).to.equal(2);
    });

    it('will ignore a column movement', () => {
      expect(
        Ptn.parse('3d3>111').rowTrajectory()
      ).to.equal(2);
    });

    it('will return the trajectory row of a movement up', () => {
      expect(
        Ptn.parse('3d3+111').rowTrajectory()
      ).to.equal(5);
    });

    it('will return the trajectory row of a movement down', () => {
      expect(
        Ptn.parse('2d3-11').rowTrajectory()
      ).to.equal(0);
    });
  });

  describe('#columnTrajectory', () => {
    it('will return the column number if it is a placement', () => {
      expect(
        Ptn.parse('d3').columnTrajectory()
      ).to.equal(3);
    });

    it('will ignore a row movement', () => {
      expect(
        Ptn.parse('3d3+111').columnTrajectory()
      ).to.equal(3);
    });

    it('will return the trajectory column of a movement left', () => {
      expect(
        Ptn.parse('3d3<111').columnTrajectory()
      ).to.equal(0);
    });

    it('will return the trajectory column of a movement right', () => {
      expect(
        Ptn.parse('2d3>11').columnTrajectory()
      ).to.equal(5);
    });
  });
});
