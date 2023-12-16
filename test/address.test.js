import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { hex } from '@scure/base';

import { Address } from 'cashaddr';

const { p2pkh: P2PKH, p2sh: P2SH } = JSON.parse(await fs.readFile('./test/data/cashaddrlegacy.json'));

describe('Address', () => {
  describe('cashaddr', () => {
    for (const test of P2PKH) {
      const addressWithoutPrefix = test.cashaddr.split(':')[1];

      it(`should encode p2pkh cashaddr ${test.cashaddr}`, () => {
        const address = Address().encode({
          type: 'pkh',
          format: 'cashaddr',
          hash: hex.decode(test.hash),
        });
        assert.equal(address, test.cashaddr);
      });

      it(`should encode p2pkh cashaddr ${addressWithoutPrefix} without prefix`, () => {
        const address = Address().encode({
          type: 'pkh',
          format: 'cashaddr',
          hash: hex.decode(test.hash),
        }, false);
        assert.equal(address, addressWithoutPrefix);
      });

      it(`should decode p2pkh cashaddr ${test.cashaddr}`, () => {
        const res = Address().decode(test.cashaddr);
        assert.equal(res.type, 'pkh');
        assert.equal(res.format, 'cashaddr');
        assert.deepEqual(res.hash, hex.decode(test.hash));
      });

      it(`should decode p2pkh cashaddr ${addressWithoutPrefix} without prefix`, () => {
        const res = Address().decode(addressWithoutPrefix);
        assert.equal(res.type, 'pkh');
        assert.equal(res.format, 'cashaddr');
        assert.deepEqual(res.hash, hex.decode(test.hash));
      });
    }

    for (const test of P2SH) {
      const addressWithoutPrefix = test.cashaddr.split(':')[1];

      it(`should encode p2sh cashaddr ${test.cashaddr}`, () => {
        const address = Address().encode({
          type: 'sh',
          format: 'cashaddr',
          hash: hex.decode(test.hash),
        });
        assert.equal(address, test.cashaddr);
      });

      it(`should encode p2sh cashaddr ${addressWithoutPrefix} without prefix`, () => {
        const address = Address().encode({
          type: 'sh',
          format: 'cashaddr',
          hash: hex.decode(test.hash),
        }, false);
        assert.equal(address, addressWithoutPrefix);
      });

      it(`should decode p2sh cashaddr ${test.cashaddr}`, () => {
        const res = Address().decode(test.cashaddr);
        assert.equal(res.type, 'sh');
        assert.equal(res.format, 'cashaddr');
        assert.deepEqual(res.hash, hex.decode(test.hash));
      });

      it(`should decode p2sh cashaddr ${addressWithoutPrefix} without prefix`, () => {
        const res = Address().decode(addressWithoutPrefix);
        assert.equal(res.type, 'sh');
        assert.equal(res.format, 'cashaddr');
        assert.deepEqual(res.hash, hex.decode(test.hash));
      });
    }
  });

  describe('legacy', () => {
    for (const test of P2PKH) {
      it(`should encode p2pkh legacy address ${test.legacy}`, () => {
        const address = Address().encode({
          type: 'pkh',
          format: 'legacy',
          hash: hex.decode(test.hash),
        });
        assert.equal(address, test.legacy);
      });

      it(`should decode p2pkh legacy address ${test.legacy}`, () => {
        const res = Address().decode(test.legacy);
        assert.equal(res.type, 'pkh');
        assert.equal(res.format, 'legacy');
        assert.deepEqual(res.hash, hex.decode(test.hash));
      });
    }

    for (const test of P2SH) {
      it(`should encode p2sh legacy address ${test.legacy}`, () => {
        const address = Address().encode({
          type: 'sh',
          format: 'legacy',
          hash: hex.decode(test.hash),
        });
        assert.equal(address, test.legacy);
      });

      it(`should decode p2sh legacy address ${test.legacy}`, () => {
        const res = Address().decode(test.legacy);
        assert.equal(res.type, 'sh');
        assert.equal(res.format, 'legacy');
        assert.deepEqual(res.hash, hex.decode(test.hash));
      });
    }
  });

  describe('conversion', () => {
    for (const test of P2PKH) {
      it(`should convert p2pkh legacy address ${test.legacy} to cashaddr ${test.cashaddr}`, () => {
        const address = Address().toCashAddress(test.legacy);
        assert.equal(address, test.cashaddr);
      });

      it(`should convert p2pkh cashaddr ${test.cashaddr} to legacy address ${test.legacy}`, () => {
        const address = Address().toLegacyAddress(test.cashaddr);
        assert.deepEqual(address, test.legacy);
      });
    }

    for (const test of P2SH) {
      it(`should convert p2sh legacy address ${test.legacy} to cashaddr ${test.cashaddr}`, () => {
        const address = Address().toCashAddress(test.legacy);
        assert.equal(address, test.cashaddr);
      });

      it(`should convert p2sh cashaddr ${test.cashaddr} to legacy address ${test.legacy}`, () => {
        const address = Address().toLegacyAddress(test.cashaddr);
        assert.deepEqual(address, test.legacy);
      });
    }
  });
});
