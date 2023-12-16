# cashaddr

This is a JavaScript implementation for the [CashAddr address](https://github.com/bitcoincashorg/bitcoincash.org/blob/master/spec/cashaddr.md) format used in Bitcoin Cash. It serves as a glue to integrate the [@scure/btc-signer](https://github.com/paulmillr/scure-btc-signer) library with Bitcoin Cash.

This library depends on and is heavily coupled with the [@scure/base](https://github.com/paulmillr/scure-base) and [@scure/btc-signer](https://github.com/paulmillr/scure-btc-signer) libraries.

## Installation

```bash
npm install cashaddr
```

## Usage

```js
import { Address, NETWORK } from 'cashaddr';
import { hex } from '@scure/base';

const hash = hex.decode('f5bf48b397dae70be82b3cca4793f8eb2b6cdac9');

const address = Address(NETWORK).encode({
  format: 'cashaddr',
  type: 'pkh',
  hash,
});
console.log(address);
// bitcoincash:qr6m7j9njldwwzlg9v7v53unlr4jkmx6eylep8ekg2

const decoded = Address(NETWORK).decode('bitcoincash:qr6m7j9njldwwzlg9v7v53unlr4jkmx6eylep8ekg2');
console.log(decoded);
// { type: 'pkh', hash: Uint8Array(20) [...], format: 'cashaddr' }

const legacy = Address(NETWORK).encode({
  format: 'legacy',
  type: 'pkh',
  hash,
});
console.log(legacy);
// 1PQPheJQSauxRPTxzNMUco1XmoCyPoEJCp

const converted = Address(NETWORK).toCashAddress('1PQPheJQSauxRPTxzNMUco1XmoCyPoEJCp');
console.log(converted);
// bitcoincash:qr6m7j9njldwwzlg9v7v53unlr4jkmx6eylep8ekg2
```

## License

MIT
