import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { hex } from '@scure/base';

import {
  CASHADDR_SIZE_BITS,
  CashAddress,
  NETWORK,
} from 'cashaddr';

// https://github.com/bitcoincashorg/bitcoincash.org/blob/master/spec/cashaddr.md#larger-test-vectors
const CASHADDR_SIZES = JSON.parse(await fs.readFile('./test/data/cashaddrsizes.json'));

describe('CashAddress (sizes)', () => {
  for (const test of CASHADDR_SIZES) {
    describe(test.addr, () => {
      it(`should encode address ${test.addr} (${test.bytes} bytes)`, () => {
        const hash = hex.decode(test.hash);
        const sizeBits = CASHADDR_SIZE_BITS.indexOf(hash.length);
        const addr = CashAddress({
          ...NETWORK,
          prefix: test.prefix,
        }).encodeRaw({ typeBits: test.type, sizeBits, hash });
        assert.equal(addr, test.addr);
      });

      it(`should decode address ${test.addr} (${test.bytes} bytes)`, () => {
        const { typeBits, sizeBits, hash } = CashAddress({
          ...NETWORK,
          prefix: test.prefix,
        }).decodeRaw(test.addr);
        const size = CASHADDR_SIZE_BITS[sizeBits];
        assert.equal(typeBits, test.type);
        assert.equal(size, test.bytes);
        assert.deepEqual(hash, hex.decode(test.hash));
      });
    });
  }
});
