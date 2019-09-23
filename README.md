# PTN Utility

A library used to parse PTN and generate OpenTak movesets for use in Tak
libraries.

## Usage

```javascript
import { Ptn } from 'ptn';

const ptn = Ptn.parse('3c3>111');

// Ptn {
//   ptn: '3c3>111',
//   pieceCount: '3',
//   specialPiece: undefined,
//   column: 'c',
//   row: '3',
//   movement: '>111',
//   direction: '>',
//   distribution: '111',
//   wallSmash: undefined,
//   pieceType: 'flat',
//   x: 2,
//   y: 2
// }

ptn.toMoveset();

// [{
//   action: 'pop', count: 3, x: 2, y: 2
// }, {
//   action: 'push', count: 1, x: 3, y: 2
// }, {
//   action: 'push', count: 1, x: 4, y: 2
// }, {
//   action: 'push', count: 1, x: 5, y: 2
// }]
```
