import { Address as BTCAddress } from '@scure/btc-signer';
import { cashaddr } from 'bech32cashaddr';

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
    } catch {
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
