'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Ptn = function () {
  function Ptn(notation) {
    _classCallCheck(this, Ptn);

    var matchData = notation.match(/(\d)?([CS])?([a-h])([1-8])(([<>+-])([1-8]+)?(\*)?)?/i);

    if (!matchData) {
      throw new Error('Invalid PTN format');
    }

    var _matchData = _slicedToArray(matchData, 9);

    this.ptn = _matchData[0];
    this.pieceCount = _matchData[1];
    this.specialPiece = _matchData[2];
    this.column = _matchData[3];
    this.row = _matchData[4];
    this.movement = _matchData[5];
    this.direction = _matchData[6];
    this.distribution = _matchData[7];
    this.wallSmash = _matchData[8];


    this.pieceType = this.specialPiece === 'C' ? 'capstone' : 'piece';

    this.x = parseInt(this.row, 10) - 1;
    this.y = 'abcdefgh'.indexOf(this.column);

    if (this.movement && !this.pieceCount) {
      this.pieceCount = '' + (this.distribution || 1);
    }

    if (this.movement && !this.distribution) {
      this.distribution = '' + (this.pieceCount || 1);
    }
  }

  /**
   * Converts PTN into an OpenTak standard moveset
   *
   * @example
   *   Ptn.parse('3c3>111') // => [{
   *     action: 'pop', count: 3, x: 2, y: 2
   *   }, {
   *     action: 'push', count: 1, x: 3, y: 2
   *   }, {
   *     action: 'push', count: 1, x: 4, y: 2
   *   }, {
   *     action: 'push', count: 1, x: 5, y: 2
   *   }]
   *
   * @param  {Boolean} reverse Whether or not this is an undo action
   *
   * @return {Array}   Set of moves that can be applied
   */


  _createClass(Ptn, [{
    key: 'toMoveset',
    value: function toMoveset() {
      var _this = this;

      var reverse = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

      if (!this.isValid()) return [{ errors: this.errors }];

      if (this.isPlacement()) return [{
        action: reverse ? 'pop' : 'push',
        x: this.x,
        y: this.y
      }];

      var firstMove = {
        action: reverse ? 'push' : 'pop',
        count: parseInt(this.pieceCount, 10),
        x: this.x,
        y: this.y
      };

      var _directionModifier = this.directionModifier(),
          _directionModifier2 = _slicedToArray(_directionModifier, 2),
          xOffset = _directionModifier2[0],
          yOffset = _directionModifier2[1];

      var moveSet = this.stackDistribution().map(function (n, i) {
        return {
          action: reverse ? 'pop' : 'push',
          count: n,
          x: _this.x + xOffset * (i + 1),
          y: _this.y + yOffset * (i + 1)
        };
      });

      if (this.wallSmash) {
        moveSet[moveSet.length - 1].flatten = true;
      }

      return [firstMove].concat(_toConsumableArray(moveSet));
    }

    /**
     * Converts Ptn into an OpenTak standard undo moveset
     *
     * @return {Array} Set of moves used to undo a movement when applied
     */

  }, {
    key: 'toUndoMoveset',
    value: function toUndoMoveset() {
      return this.toMoveset(true).reverse();
    }
  }, {
    key: 'isValid',


    /**
     * Checks for the validity of a PTN sequence outside of the
     * above regex match.
     *
     * @note This explicitly avoids bounds checking and other
     *       behavior that should be exclusively the knowledge
     *       of a board
     *
     * @mutates [this.errors] Records errors
     *
     * @return {Boolean} Whether or not the PTN is valid
     */
    value: function isValid() {
      this.errors = [];

      if (this.isMovement() && !this.isValidStackDistribution()) {
        this.errors.push('PTN does not contain a valid stack distribution');
      }

      if (!this.isMovement() && !this.isPlacement()) {
        this.errors.push('PTN is not a movement or placement');
      }

      return !this.errors.length;
    }

    /**
     * Finds the distribution of a PTN stack
     *
     * @example Given '3c3>111', the distribution would be [1, 1, 1]
     *
     * @return {Array} Move distribution counts
     */

  }, {
    key: 'stackDistribution',
    value: function stackDistribution() {
      return this.distribution.split('').map(function (s) {
        return parseInt(s, 10);
      });
    }

    /**
     * Total number of tiles to be distributed
     *
     * @return {Integer}
     */

  }, {
    key: 'stackTotal',
    value: function stackTotal() {
      if (!this.distribution) {
        return 1;
      }

      return this.distribution.split('').reduce(function (a, i) {
        return a + parseInt(i, 10);
      }, 0);
    }

    /**
     * Validation method to check if a player is distrubuting more than
     * or less than the total tiles they've picked up.
     *
     * @return {Boolean}
     */

  }, {
    key: 'isValidStackDistribution',
    value: function isValidStackDistribution() {
      if (!this.pieceCount && !this.distribution) {
        return true;
      }

      return parseInt(this.pieceCount, 10) === this.stackTotal();
    }

    /**
     * Whether or not this PTN indicates a movement
     *
     * @return {Boolean}
     */

  }, {
    key: 'isMovement',
    value: function isMovement() {
      return !!this.movement;
    }

    /**
     * Whether or not this PTN indicates a placement
     *
     * @return {Boolean}
     */

  }, {
    key: 'isPlacement',
    value: function isPlacement() {
      return !this.isMovement() && !this.pieceCount;
    }

    /**
     * The final column this PTN would distribute to. Used for board
     * validation
     *
     * @return {Integer}
     */

  }, {
    key: 'columnTrajectory',
    value: function columnTrajectory() {
      var offset = this.directionModifier()[1] * this.stackTotal();

      return this.y + offset;
    }

    /**
     * The final row this PTN would distribute to. Used for board
     * validation
     *
     * @return {Integer}
     */

  }, {
    key: 'rowTrajectory',
    value: function rowTrajectory() {
      var offset = this.directionModifier()[0] * this.stackTotal();

      return this.x + offset;
    }

    /**
     * Offset modifiers used to calculate x and y coordinates over
     * distributions of pieces
     *
     * @return {Array} x and y offsets per direction
     */

  }, {
    key: 'directionModifier',
    value: function directionModifier() {
      switch (this.direction) {
        case '+':
          return [0, 1];
        case '-':
          return [0, -1];
        case '>':
          return [1, 0];
        case '<':
          return [-1, 0];
        default:
          return [0, 0];
      }
    }
  }], [{
    key: 'fromMoveset',
    value: function fromMoveset(moveSet) {
      // TODO
    }
  }, {
    key: 'fromUndoMoveset',
    value: function fromUndoMoveset(moveSet) {}
    // TODO


    /**
     * Static constructor
     *
     * @param  {String} notation PlayTak notation
     *
     * @return {Ptn}    Parsed PTN
     */

  }, {
    key: 'parse',
    value: function parse(notation) {
      return new Ptn(notation);
    }
  }]);

  return Ptn;
}();

exports.default = Ptn;