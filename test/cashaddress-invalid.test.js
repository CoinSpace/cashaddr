import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { hex } from '@scure/base';

import {
  CASHADDR_SIZE_BITS,
  CashAddress,
  NETWORK,
} from 'cashaddr';

const CASHADDR_INVALID_ENCODE = JSON.parse(await fs.readFile('./test/data/cashaddrinvalidencode.json'));
const CASHADDR_INVALID_DECODE = JSON.parse(await fs.readFile('./test/data/cashaddrinvaliddecode.json'));

describe('CashAddress (invalid)', () => {
  describe('invalid encode', () => {
    for (const test of CASHADDR_INVALID_ENCODE) {
      it(`"${test.note}" with invalid address: "${test.addr}"`, () => {
        assert.throws(() => {
          const hash = hex.decode(test.hash);
          CashAddress({
            ...NETWORK,
            prefix: test.prefix,
          }).encodeRaw({
            typeBits: test.type,
            sizeBits: CASHADDR_SIZE_BITS[hash.length],
            hash,
          });
        }, {
          message: RegExp(test.reason),
        });
      });
    }
  });

  describe('invalid decode', () => {
    for (const test of CASHADDR_INVALID_DECODE) {
      it(`"${test.note}" with invalid address: "${test.addr}"`, () => {
        assert.throws(() => {
          CashAddress({
            ...NETWORK,
            prefix: test.prefix,
          }).decode(test.addr);
        }, {
          message: RegExp(test.reason),
        });
      });
    }
  });
});
