import { Address as BTCAddress } from '@scure/btc-signer';
import { utils } from '@scure/base';

const BECH_ALPHABET = utils.chain(
  utils.alphabet('qpzry9x8gf2tvdw0s3jn54khce6mua7l'),
  utils.join('')
);

/**
 * @typedef {Object} Network
 * @property {number} pubKeyHash
 * @property {number} scriptHash
 * @property {string} prefix
 */

/**
 * @typedef {Object} CashaddrDecoded
 * @property {string} prefix
 * @property {number[]} words
 */

/**
 * @typedef {Object} CashOutScript
 * @property {string} type
 * @property {Uint8Array} hash
 */

/**
 * @typedef {Object} OutScript
 * @property {string} type
 * @property {string} [format=cashaddr]
 * @property {Uint8Array} hash
 */

/**
 * @type {Network}
 */
export const NETWORK = {
  pubKeyHash: 0x00,
  scriptHash: 0x05,
  prefix: 'bitcoincash',
};

/**
 * @type {Network}
 */
export const TEST_NETWORK = {
  pubKeyHash: 0x6f,
  scriptHash: 0xc4,
  prefix: 'bchtest',
};

const POLYMOD_GENERATORS_CASHADDR = [
  0x98f2bc8e61n,
  0x79b76d99e2n,
  0xf33e5fb3c4n,
  0xae2eabe2a8n,
  0x1e4f43e470n,
];

/**
 * @param {bigint} pre
 * @returns {bigint}
 */
function cashaddrPolymod(pre) {
  const b = pre >> 35n;
  let chk = (pre & 0x07ffffffffn) << 5n;
  for (let i = 0; i < POLYMOD_GENERATORS_CASHADDR.length; i++) {
    if (((b >> BigInt(i)) & 1n) === 1n) chk ^= POLYMOD_GENERATORS_CASHADDR[i];
  }
  return chk;
}

/**
 * @param {string} prefix
 * @param {number[]} words
 * @returns {string}
 */
function cashaddrChecksum(prefix, words) {
  const len = prefix.length;
  let chk = 1n;
  for (let i = 0; i < len; i++) {
    const c = prefix.charCodeAt(i);
    if (c < 33 || c > 126) throw new Error(`Invalid prefix (${prefix})`);
    chk = cashaddrPolymod(chk) ^ (BigInt(c) & 0x1fn);
  }
  chk = cashaddrPolymod(chk);
  for (const v of words) chk = cashaddrPolymod(chk) ^ BigInt(v);
  for (let i = 0; i < 8; i++) chk = cashaddrPolymod(chk);
  chk ^= 1n;
  const checksumWords = utils.convertRadix([Number(chk % 2n ** 40n)], 2 ** 40, 2 ** 5);
  while (checksumWords.length < 8) checksumWords.unshift(0);
  return BECH_ALPHABET.encode(checksumWords);
}

function genCashaddr() {
  const _words = utils.radix2(5);

  /**
   * @param {string} prefix
   * @param {number[] | Uint8Array} words
   * @param {boolean} [includePrefix=true]
   * @returns {string}
   */
  function encode(prefix, words, includePrefix = true) {
    if (typeof prefix !== 'string') {
      throw new TypeError(`cashaddr.encode: prefix should be string, not ${typeof prefix}`);
    }
    if (!Array.isArray(words) || (words.length && typeof words[0] !== 'number')) {
      throw new TypeError(`cashaddr.encode: words should be array of numbers, not ${typeof words}`);
    }
    if (prefix.length === 0) {
      throw new TypeError(`cashaddr.encode: invalid prefix length ${prefix.length}`);
    }
    const lowered = prefix.toLowerCase();
    const sum = cashaddrChecksum(lowered, words);
    const payload = `${BECH_ALPHABET.encode(words)}${sum}`;
    return includePrefix ? `${lowered}:${payload}` : payload;
  }

  /**
   * @param {string} str
   * @returns {CashaddrDecoded}
   */
  function decode(str) {
    if (typeof str !== 'string') {
      throw new TypeError(`cashaddr.decode: input should be string, not ${typeof str}`);
    }
    const lowered = str.toLowerCase();
    if (str !== lowered && str !== str.toUpperCase()) {
      throw new TypeError('cashaddr.decode: string must be lowercase or uppercase');
    }
    const sepIndex = lowered.lastIndexOf(':');
    if (sepIndex === 0 || sepIndex === -1) {
      throw new TypeError('cashaddr.decode: symbol ":" must be present between prefix and data only');
    }
    const prefix = lowered.slice(0, sepIndex);
    const payload = lowered.slice(sepIndex + 1);
    if (payload.length < 8) throw new Error('Cashaddr data must be at least 8 characters long');
    const words = BECH_ALPHABET.decode(payload).slice(0, -8);
    const sum = cashaddrChecksum(prefix, words);
    if (!payload.endsWith(sum)) throw new Error(`Invalid cashaddr checksum in ${str}: expected "${sum}"`);
    return { prefix, words };
  }

  return { encode, decode, fromWords: _words.decode, toWords: _words.encode };
}

export const cashaddr = genCashaddr();

export const CASHADDR_TYPE_BITS = ['pkh', 'sh'];
export const CASHADDR_SIZE_BITS = [20, 24, 28, 32, 40, 48, 56, 64];

/**
 * @param {Network} network
 */
export function CashAddress(network = NETWORK) {
  if (network.prefix?.length === 0) {
    throw new TypeError(`CashAddress: invalid prefix length ${network.prefix?.length}`);
  }
  const prefix = network.prefix.toLowerCase();
  if (network.prefix !== prefix && network.prefix !== network.prefix.toUpperCase()) {
    throw new TypeError(`CashAddress: invalid prefix, string must be lowercase or uppercase ${network.prefix}`);
  }

  function encodeRaw({ typeBits, sizeBits, hash }, includePrefix) {
    if ((typeBits >>> 0) !== typeBits || typeBits < 0b0000 || typeBits > 0b1111) {
      throw new Error(`Invalid type bits=${typeBits}`);
    }
    if ((sizeBits >>> 0) !== sizeBits || sizeBits < 0b0000 || sizeBits > 0b111) {
      throw new Error(`Invalid size bits=${sizeBits}`);
    }
    const versionByte = [(typeBits << 3) | sizeBits];
    const data = new Uint8Array(hash.length + 1);
    data.set(versionByte);
    data.set(hash, 1);
    return cashaddr.encode(prefix, cashaddr.toWords(data), includePrefix);
  }

  /**
   * @param {CashOutScript} from
   * @param {boolean} [includePrefix=true]
   * @returns {string}
   */
  function encode(from, includePrefix = true) {
    const typeBits = CASHADDR_TYPE_BITS.indexOf(from.type);
    if (typeBits === -1) throw new Error(`Invalid hash type=${from.type}`);
    const sizeBits = CASHADDR_SIZE_BITS.indexOf(from.hash.length);
    if (sizeBits === -1) throw new Error(`Invalid hash size=${from.hash.length}`);
    return encodeRaw({ typeBits, sizeBits, hash: from.hash }, includePrefix);
  }

  function decodeRaw(address) {
    const res = cashaddr.decode(address.includes(':') ? address : `${prefix}:${address}`);
    if (res.prefix !== prefix) throw new Error(`Invalid cashaddr prefix ${res.prefix}`);
    const data = cashaddr.fromWords(res.words);
    const versionByte = data[0];
    const hash = data.subarray(1);
    const typeBits = versionByte >>> 3;
    const sizeBits = versionByte & 0x07;
    if (typeBits < 0b0000 || typeBits > 0b1111) {
      throw new Error(`Invalid type bits=${typeBits}`);
    }
    if (sizeBits < 0b0000 || sizeBits > 0b111) {
      throw new Error(`Invalid size bits=${sizeBits}`);
    }
    return { typeBits, sizeBits, hash };
  }

  /**
     * @param {string} address
     * @returns {CashOutScript}
     */
  function decode(address) {
    const { typeBits, sizeBits, hash } = decodeRaw(address);
    const type = CASHADDR_TYPE_BITS[typeBits];
    if (!type) throw new Error('Invalid hash type');
    const size = CASHADDR_SIZE_BITS[sizeBits];
    if (!size) throw new Error('Invalid hash size');
    if (size !== hash.length) throw new Error('Invalid hash size');
    return { type, hash };
  }
  return { encode, encodeRaw, decode, decodeRaw };
}

/**
 * @param {Network} network
 */
export function Address(network = NETWORK) {
  /**
   * @param {OutScript} from
   * @param {boolean} [includePrefix=true]
   * @returns {string}
   */
  function encode(from, includePrefix = true) {
    const { type, format = 'cashaddr' } = from;
    if (!['pkh', 'sh'].includes(type)) throw new TypeError(`Unknown address type=${type}`);
    if (format === 'legacy') return BTCAddress(network).encode(from);
    if (format === 'cashaddr') return CashAddress(network).encode(from, includePrefix);
    throw new TypeError(`Unknown address format=${format}`);
  }

  /**
   * @param {string} address
   * @returns {OutScript}
   */
  function decode(address) {
    try {
      const res = BTCAddress(network).decode(address);
      return {
        ...res,
        format: 'legacy',
      };
    } catch (e) {
      const res = CashAddress(network).decode(address);
      return {
        ...res,
        format: 'cashaddr',
      };
    }
  }

  /**
   * @param {string} address
   * @param {boolean} [includePrefix=true]
   * @returns {string}
   */
  function toCashAddress(address, includePrefix = true) {
    const res = decode(address);
    return encode({
      ...res,
      format: 'cashaddr',
    }, includePrefix);
  }

  /**
   * @param {string} address
   * @returns {string}
   */
  function toLegacyAddress(address) {
    const res = decode(address);
    return encode({
      ...res,
      format: 'legacy',
    });
  }
  return { decode, encode, toCashAddress, toLegacyAddress };
}
