const { QubicTransaction } = require("@qubic-lib/qubic-ts-library/dist/qubic-types/QubicTransaction");
const { PublicKey } = require("@qubic-lib/qubic-ts-library/dist/qubic-types/PublicKey");
const { Long } = require("@qubic-lib/qubic-ts-library/dist/qubic-types/Long");
const { DynamicPayload } = require("@qubic-lib/qubic-ts-library/dist/qubic-types/DynamicPayload");
const { Signature } = require("@qubic-lib/qubic-ts-library/dist/qubic-types/Signature");
const { PUBLIC_KEY_LENGTH, SIGNATURE_LENGTH } = require("@qubic-lib/qubic-ts-library/dist/crypto");
const { QubicHelper } = require("@qubic-lib/qubic-ts-library/dist/qubicHelper");

const qHelper = new QubicHelper();

// Convert Uint8Array to hex string
const byteArrayToHexString = (byteArray) => {
  const hexString = Array.from(byteArray, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return hexString;
};

const uint8ArrayToBase64 = (uint8Array) => {
  const binaryString = String.fromCharCode.apply(null, Array.from(uint8Array));
  return btoa(binaryString);
};

const base64ToUint8Array = (base64) => {
  const binaryString = atob(base64);
  return new Uint8Array(binaryString.split("").map((char) => char.charCodeAt(0)));
};

const createDataView = (size) => {
  const buffer = new ArrayBuffer(size);
  return { buffer, view: new DataView(buffer) };
};

const decodeUint8ArrayTx = (tx) => {
  const new_tx = new QubicTransaction();
  const inputSize =
    new DataView(tx.slice(PUBLIC_KEY_LENGTH * 2 + 14, PUBLIC_KEY_LENGTH * 2 + 16).buffer).getUint16(0, true) || 0;
  const payloadStart = PUBLIC_KEY_LENGTH * 2 + 16;
  const payloadEnd = payloadStart + inputSize;
  const signatureEnd = payloadEnd + SIGNATURE_LENGTH;

  new_tx
    .setSourcePublicKey(new PublicKey(tx.slice(0, PUBLIC_KEY_LENGTH)))
    .setDestinationPublicKey(new PublicKey(tx.slice(PUBLIC_KEY_LENGTH, PUBLIC_KEY_LENGTH * 2)))
    .setAmount(new Long(tx.slice(PUBLIC_KEY_LENGTH * 2, PUBLIC_KEY_LENGTH * 2 + 8)))
    .setTick(new DataView(tx.slice(PUBLIC_KEY_LENGTH * 2 + 8, PUBLIC_KEY_LENGTH * 2 + 12).buffer).getUint32(0, true))
    .setInputType(
      new DataView(tx.slice(PUBLIC_KEY_LENGTH * 2 + 12, PUBLIC_KEY_LENGTH * 2 + 14).buffer).getUint16(0, true),
    )
    .setInputSize(inputSize);

  if (inputSize > 0) {
    const payload = new DynamicPayload(inputSize);
    payload.setPayload(tx.slice(payloadStart, payloadEnd));
    new_tx.setPayload(payload);
  }
  new_tx.signature = new Signature(tx.slice(payloadEnd, signatureEnd));

  return new_tx;
};

const createPayload = (data) => {
  const TYPE_SIZES = {
    uint8: 1,
    uint16: 2,
    uint32: 4,
    bigint64: 8,
    id: 32,
  };

  const totalSize = data.reduce((acc, { type }) => acc + TYPE_SIZES[type], 0);
  const dynamicPayload = new DynamicPayload(totalSize);

  const { buffer, view } = createDataView(totalSize);

  let offset = 0;
  const setters = {
    uint8: (v, o, d) => {
      v.setUint8(o, d);
      return 1;
    },
    uint16: (v, o, d) => {
      v.setUint16(o, d, true);
      return 2;
    },
    uint32: (v, o, d) => {
      v.setUint32(o, d, true);
      return 4;
    },
    bigint64: (v, o, d) => {
      v.setBigUint64(o, BigInt(d), true);
      return 8;
    },
    id: (v, o, d) => {
      let bytes;
      if (typeof d === "string") {
        bytes = qHelper.getIdentityBytes(d);
      } else {
        bytes = new Uint8Array(d);
      }
      for (let i = 0; i < 32; i++) {
        v.setUint8(o + i, bytes[i] || 0);
      }
      return 32;
    },
  };

  data.forEach(({ type, data: value }) => {
    if (type === "id") {
      offset += setters[type](view, offset, value);
    } else {
      offset += setters[type](view, offset, value);
    }
  });

  const result = new Uint8Array(buffer);
  dynamicPayload.setPayload(result);

  return dynamicPayload;
};

const generateSeed = () => {
  const letters = "abcdefghijklmnopqrstuvwxyz";
  const letterSize = letters.length;
  let seed = "";
  for (let i = 0; i < 55; i++) {
    seed += letters[Math.floor(Math.random() * letterSize)];
  }
  return seed;
};

/**
 * Converts an asset name between string <-> number representation.
 * - If input is a string: encodes as ASCII bytes in *little-endian* order (first char is lowest byte).
 * - If input is a number: decodes as ASCII bytes in *little-endian* order (lowest byte is first char),
 *   and stops at the first null-byte (0), to avoid doubling/trailing chars.
 */
function assetNameConvert(input) {
  // String to BigInt logic
  if (typeof input === 'string') {
    if (input.length > 7) {
      throw new Error('Input string is too long');
    }
    const buffer = new ArrayBuffer(8);
    const view = new DataView(buffer);
    for (let i = 0; i < input.length; i++) {
      view.setUint8(i, input.charCodeAt(i)); // Little-endian order
    }
    return view.getBigUint64(0, true); // Return as BigInt
  }
  // BigInt to String logic
  if (typeof input === 'bigint') {
    const buffer = new ArrayBuffer(8);
    const view = new DataView(buffer);
    view.setBigUint64(0, input, true); // little-endian
    let result = '';
    for (let i = 0; i < 8; i++) {
      const charCode = view.getUint8(i);
      if (charCode === 0) break;
      result += String.fromCharCode(charCode);
    }
    return result;
  }
  throw new Error('Invalid input type, expected string or bigint');
}

module.exports = {
  byteArrayToHexString,
  uint8ArrayToBase64,
  base64ToUint8Array,
  createDataView,
  decodeUint8ArrayTx,
  createPayload,
  generateSeed,
  assetNameConvert
};
