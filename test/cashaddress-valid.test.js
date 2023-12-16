import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { hex } from '@scure/base';

import {
  CASHADDR_TYPE_BITS,
  CashAddress,
  NETWORK,
} from 'cashaddr';

const CASHADDR_VALID = JSON.parse(await fs.readFile('./test/data/cashaddredge.json'));

describe('CashAddress (valid)', () => {
  describe('valid encode', () => {
    for (const test of CASHADDR_VALID) {
      it(`"${test.note}" with address: "${test.addr}"`, () => {
        const hash = hex.decode(test.hash);
        const address = CashAddress({
          ...NETWORK,
          prefix: test.prefix,
        }).encode({
          type: CASHADDR_TYPE_BITS[test.type],
          hash,
        });
        assert.equal(address, test.addr.toLowerCase());
      });
    }
  });

  describe('valid decode', () => {
    for (const test of CASHADDR_VALID) {
      it(`"${test.note}" with address: "${test.addr}"`, () => {
        const res = CashAddress({
          ...NETWORK,
          prefix: test.prefix,
        }).decode(test.addr);
        assert.equal(CASHADDR_TYPE_BITS.indexOf(res.type), test.type);
        assert.deepEqual(res.hash, hex.decode(test.hash));
      });
    }
  });
});
