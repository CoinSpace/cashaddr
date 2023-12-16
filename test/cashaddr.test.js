import assert from 'node:assert/strict';
import { cashaddr } from 'cashaddr';

const CASHADDR_VALID = [{
  string: 'prefix:x64nx6hz',
  prefix: 'prefix',
  words: [],
}, {
  string: 'p:gpf8m4h7',
  prefix: 'p',
  words: [],
}, {
  string: 'bitcoincash:qpzry9x8gf2tvdw0s3jn54khce6mua7lcw20ayyn',
  prefix: 'bitcoincash',
  words: [
    0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17,
    18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31],
}, {
  string: 'bchtest:testnetaddress4d6njnut',
  prefix: 'bchtest',
  words: [11, 25, 16, 11, 19, 25, 11, 29, 13, 13, 3, 25, 16, 16],
}, {
  string: 'bchreg:555555555555555555555555555555555555555555555udxmlmrz',
  prefix: 'bchreg',
  words: [
    20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20,
    20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20,
    20],
}];

describe('cashaddr', () => {
  for (const v of CASHADDR_VALID) {
    describe(v.string, () => {
      it(`encode ${v.prefix} ${v.words}`, () => {
        assert.deepEqual(cashaddr.encode(v.prefix, v.words), v.string.toLowerCase());
      });

      it(`encode/decode ${v.prefix} ${v.words}`, () => {
        const expected = { prefix: v.prefix.toLowerCase(), words: v.words };
        assert.deepEqual(
          cashaddr.decode(cashaddr.encode(v.prefix, v.words)),
          expected
        );
      });

      it(`decode ${v.string}`, () => {
        const expected = { prefix: v.prefix.toLowerCase(), words: v.words };
        assert.deepEqual(cashaddr.decode(v.string), expected);
      });

      it(`throw on ${v.string} with 1 bit flipped`, () => {
        const buffer = Buffer.from(v.string, 'utf8');
        buffer[v.string.lastIndexOf(':') + 1] ^= 0x1; // flip a bit, after the prefix
        const str = buffer.toString('utf8');
        assert.throws(() => cashaddr.decode(str), {
          message: /^Invalid cashaddr checksum in/,
        });
      });
    });
  }
});
