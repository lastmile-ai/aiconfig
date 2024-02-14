import S from "./__vite-browser-external-jWVCDlBL.js";
function z(s) {
  return s && s.__esModule && Object.prototype.hasOwnProperty.call(s, "default") ? s.default : s;
}
function gt(s) {
  if (s.__esModule)
    return s;
  var e = s.default;
  if (typeof e == "function") {
    var t = function r() {
      if (this instanceof r) {
        var i = [null];
        i.push.apply(i, arguments);
        var n = Function.bind.apply(e, i);
        return new n();
      }
      return e.apply(this, arguments);
    };
    t.prototype = e.prototype;
  } else
    t = {};
  return Object.defineProperty(t, "__esModule", { value: !0 }), Object.keys(s).forEach(function(r) {
    var i = Object.getOwnPropertyDescriptor(s, r);
    Object.defineProperty(t, r, i.get ? i : {
      enumerable: !0,
      get: function() {
        return s[r];
      }
    });
  }), t;
}
const { Duplex: yt } = S;
function Oe(s) {
  s.emit("close");
}
function vt() {
  !this.destroyed && this._writableState.finished && this.destroy();
}
function Qe(s) {
  this.removeListener("error", Qe), this.destroy(), this.listenerCount("error") === 0 && this.emit("error", s);
}
function St(s, e) {
  let t = !0;
  const r = new yt({
    ...e,
    autoDestroy: !1,
    emitClose: !1,
    objectMode: !1,
    writableObjectMode: !1
  });
  return s.on("message", function(n, o) {
    const l = !o && r._readableState.objectMode ? n.toString() : n;
    r.push(l) || s.pause();
  }), s.once("error", function(n) {
    r.destroyed || (t = !1, r.destroy(n));
  }), s.once("close", function() {
    r.destroyed || r.push(null);
  }), r._destroy = function(i, n) {
    if (s.readyState === s.CLOSED) {
      n(i), process.nextTick(Oe, r);
      return;
    }
    let o = !1;
    s.once("error", function(f) {
      o = !0, n(f);
    }), s.once("close", function() {
      o || n(i), process.nextTick(Oe, r);
    }), t && s.terminate();
  }, r._final = function(i) {
    if (s.readyState === s.CONNECTING) {
      s.once("open", function() {
        r._final(i);
      });
      return;
    }
    s._socket !== null && (s._socket._writableState.finished ? (i(), r._readableState.endEmitted && r.destroy()) : (s._socket.once("finish", function() {
      i();
    }), s.close()));
  }, r._read = function() {
    s.isPaused && s.resume();
  }, r._write = function(i, n, o) {
    if (s.readyState === s.CONNECTING) {
      s.once("open", function() {
        r._write(i, n, o);
      });
      return;
    }
    s.send(i, o);
  }, r.on("end", vt), r.on("error", Qe), r;
}
var Et = St;
const Vs = /* @__PURE__ */ z(Et);
var te = { exports: {} }, U = {
  BINARY_TYPES: ["nodebuffer", "arraybuffer", "fragments"],
  EMPTY_BUFFER: Buffer.alloc(0),
  GUID: "258EAFA5-E914-47DA-95CA-C5AB0DC85B11",
  kForOnEventAttribute: Symbol("kIsForOnEventAttribute"),
  kListener: Symbol("kListener"),
  kStatusCode: Symbol("status-code"),
  kWebSocket: Symbol("websocket"),
  NOOP: () => {
  }
}, bt, xt;
const { EMPTY_BUFFER: kt } = U, Se = Buffer[Symbol.species];
function wt(s, e) {
  if (s.length === 0)
    return kt;
  if (s.length === 1)
    return s[0];
  const t = Buffer.allocUnsafe(e);
  let r = 0;
  for (let i = 0; i < s.length; i++) {
    const n = s[i];
    t.set(n, r), r += n.length;
  }
  return r < e ? new Se(t.buffer, t.byteOffset, r) : t;
}
function Je(s, e, t, r, i) {
  for (let n = 0; n < i; n++)
    t[r + n] = s[n] ^ e[n & 3];
}
function et(s, e) {
  for (let t = 0; t < s.length; t++)
    s[t] ^= e[t & 3];
}
function Ot(s) {
  return s.length === s.buffer.byteLength ? s.buffer : s.buffer.slice(s.byteOffset, s.byteOffset + s.length);
}
function Ee(s) {
  if (Ee.readOnly = !0, Buffer.isBuffer(s))
    return s;
  let e;
  return s instanceof ArrayBuffer ? e = new Se(s) : ArrayBuffer.isView(s) ? e = new Se(s.buffer, s.byteOffset, s.byteLength) : (e = Buffer.from(s), Ee.readOnly = !1), e;
}
te.exports = {
  concat: wt,
  mask: Je,
  toArrayBuffer: Ot,
  toBuffer: Ee,
  unmask: et
};
if (!process.env.WS_NO_BUFFER_UTIL)
  try {
    const s = require("bufferutil");
    xt = te.exports.mask = function(e, t, r, i, n) {
      n < 48 ? Je(e, t, r, i, n) : s.mask(e, t, r, i, n);
    }, bt = te.exports.unmask = function(e, t) {
      e.length < 32 ? et(e, t) : s.unmask(e, t);
    };
  } catch {
  }
var ne = te.exports;
const Ce = Symbol("kDone"), ue = Symbol("kRun");
let Ct = class {
  /**
   * Creates a new `Limiter`.
   *
   * @param {Number} [concurrency=Infinity] The maximum number of jobs allowed
   *     to run concurrently
   */
  constructor(e) {
    this[Ce] = () => {
      this.pending--, this[ue]();
    }, this.concurrency = e || 1 / 0, this.jobs = [], this.pending = 0;
  }
  /**
   * Adds a job to the queue.
   *
   * @param {Function} job The job to run
   * @public
   */
  add(e) {
    this.jobs.push(e), this[ue]();
  }
  /**
   * Removes a job from the queue and runs it if possible.
   *
   * @private
   */
  [ue]() {
    if (this.pending !== this.concurrency && this.jobs.length) {
      const e = this.jobs.shift();
      this.pending++, e(this[Ce]);
    }
  }
};
var Tt = Ct;
const W = S, Te = ne, Lt = Tt, { kStatusCode: tt } = U, Nt = Buffer[Symbol.species], Pt = Buffer.from([0, 0, 255, 255]), se = Symbol("permessage-deflate"), w = Symbol("total-length"), V = Symbol("callback"), C = Symbol("buffers"), J = Symbol("error");
let K, Rt = class {
  /**
   * Creates a PerMessageDeflate instance.
   *
   * @param {Object} [options] Configuration options
   * @param {(Boolean|Number)} [options.clientMaxWindowBits] Advertise support
   *     for, or request, a custom client window size
   * @param {Boolean} [options.clientNoContextTakeover=false] Advertise/
   *     acknowledge disabling of client context takeover
   * @param {Number} [options.concurrencyLimit=10] The number of concurrent
   *     calls to zlib
   * @param {(Boolean|Number)} [options.serverMaxWindowBits] Request/confirm the
   *     use of a custom server window size
   * @param {Boolean} [options.serverNoContextTakeover=false] Request/accept
   *     disabling of server context takeover
   * @param {Number} [options.threshold=1024] Size (in bytes) below which
   *     messages should not be compressed if context takeover is disabled
   * @param {Object} [options.zlibDeflateOptions] Options to pass to zlib on
   *     deflate
   * @param {Object} [options.zlibInflateOptions] Options to pass to zlib on
   *     inflate
   * @param {Boolean} [isServer=false] Create the instance in either server or
   *     client mode
   * @param {Number} [maxPayload=0] The maximum allowed message length
   */
  constructor(e, t, r) {
    if (this._maxPayload = r | 0, this._options = e || {}, this._threshold = this._options.threshold !== void 0 ? this._options.threshold : 1024, this._isServer = !!t, this._deflate = null, this._inflate = null, this.params = null, !K) {
      const i = this._options.concurrencyLimit !== void 0 ? this._options.concurrencyLimit : 10;
      K = new Lt(i);
    }
  }
  /**
   * @type {String}
   */
  static get extensionName() {
    return "permessage-deflate";
  }
  /**
   * Create an extension negotiation offer.
   *
   * @return {Object} Extension parameters
   * @public
   */
  offer() {
    const e = {};
    return this._options.serverNoContextTakeover && (e.server_no_context_takeover = !0), this._options.clientNoContextTakeover && (e.client_no_context_takeover = !0), this._options.serverMaxWindowBits && (e.server_max_window_bits = this._options.serverMaxWindowBits), this._options.clientMaxWindowBits ? e.client_max_window_bits = this._options.clientMaxWindowBits : this._options.clientMaxWindowBits == null && (e.client_max_window_bits = !0), e;
  }
  /**
   * Accept an extension negotiation offer/response.
   *
   * @param {Array} configurations The extension negotiation offers/reponse
   * @return {Object} Accepted configuration
   * @public
   */
  accept(e) {
    return e = this.normalizeParams(e), this.params = this._isServer ? this.acceptAsServer(e) : this.acceptAsClient(e), this.params;
  }
  /**
   * Releases all resources used by the extension.
   *
   * @public
   */
  cleanup() {
    if (this._inflate && (this._inflate.close(), this._inflate = null), this._deflate) {
      const e = this._deflate[V];
      this._deflate.close(), this._deflate = null, e && e(
        new Error(
          "The deflate stream was closed while data was being processed"
        )
      );
    }
  }
  /**
   *  Accept an extension negotiation offer.
   *
   * @param {Array} offers The extension negotiation offers
   * @return {Object} Accepted configuration
   * @private
   */
  acceptAsServer(e) {
    const t = this._options, r = e.find((i) => !(t.serverNoContextTakeover === !1 && i.server_no_context_takeover || i.server_max_window_bits && (t.serverMaxWindowBits === !1 || typeof t.serverMaxWindowBits == "number" && t.serverMaxWindowBits > i.server_max_window_bits) || typeof t.clientMaxWindowBits == "number" && !i.client_max_window_bits));
    if (!r)
      throw new Error("None of the extension offers can be accepted");
    return t.serverNoContextTakeover && (r.server_no_context_takeover = !0), t.clientNoContextTakeover && (r.client_no_context_takeover = !0), typeof t.serverMaxWindowBits == "number" && (r.server_max_window_bits = t.serverMaxWindowBits), typeof t.clientMaxWindowBits == "number" ? r.client_max_window_bits = t.clientMaxWindowBits : (r.client_max_window_bits === !0 || t.clientMaxWindowBits === !1) && delete r.client_max_window_bits, r;
  }
  /**
   * Accept the extension negotiation response.
   *
   * @param {Array} response The extension negotiation response
   * @return {Object} Accepted configuration
   * @private
   */
  acceptAsClient(e) {
    const t = e[0];
    if (this._options.clientNoContextTakeover === !1 && t.client_no_context_takeover)
      throw new Error('Unexpected parameter "client_no_context_takeover"');
    if (!t.client_max_window_bits)
      typeof this._options.clientMaxWindowBits == "number" && (t.client_max_window_bits = this._options.clientMaxWindowBits);
    else if (this._options.clientMaxWindowBits === !1 || typeof this._options.clientMaxWindowBits == "number" && t.client_max_window_bits > this._options.clientMaxWindowBits)
      throw new Error(
        'Unexpected or invalid parameter "client_max_window_bits"'
      );
    return t;
  }
  /**
   * Normalize parameters.
   *
   * @param {Array} configurations The extension negotiation offers/reponse
   * @return {Array} The offers/response with normalized parameters
   * @private
   */
  normalizeParams(e) {
    return e.forEach((t) => {
      Object.keys(t).forEach((r) => {
        let i = t[r];
        if (i.length > 1)
          throw new Error(`Parameter "${r}" must have only a single value`);
        if (i = i[0], r === "client_max_window_bits") {
          if (i !== !0) {
            const n = +i;
            if (!Number.isInteger(n) || n < 8 || n > 15)
              throw new TypeError(
                `Invalid value for parameter "${r}": ${i}`
              );
            i = n;
          } else if (!this._isServer)
            throw new TypeError(
              `Invalid value for parameter "${r}": ${i}`
            );
        } else if (r === "server_max_window_bits") {
          const n = +i;
          if (!Number.isInteger(n) || n < 8 || n > 15)
            throw new TypeError(
              `Invalid value for parameter "${r}": ${i}`
            );
          i = n;
        } else if (r === "client_no_context_takeover" || r === "server_no_context_takeover") {
          if (i !== !0)
            throw new TypeError(
              `Invalid value for parameter "${r}": ${i}`
            );
        } else
          throw new Error(`Unknown parameter "${r}"`);
        t[r] = i;
      });
    }), e;
  }
  /**
   * Decompress data. Concurrency limited.
   *
   * @param {Buffer} data Compressed data
   * @param {Boolean} fin Specifies whether or not this is the last fragment
   * @param {Function} callback Callback
   * @public
   */
  decompress(e, t, r) {
    K.add((i) => {
      this._decompress(e, t, (n, o) => {
        i(), r(n, o);
      });
    });
  }
  /**
   * Compress data. Concurrency limited.
   *
   * @param {(Buffer|String)} data Data to compress
   * @param {Boolean} fin Specifies whether or not this is the last fragment
   * @param {Function} callback Callback
   * @public
   */
  compress(e, t, r) {
    K.add((i) => {
      this._compress(e, t, (n, o) => {
        i(), r(n, o);
      });
    });
  }
  /**
   * Decompress data.
   *
   * @param {Buffer} data Compressed data
   * @param {Boolean} fin Specifies whether or not this is the last fragment
   * @param {Function} callback Callback
   * @private
   */
  _decompress(e, t, r) {
    const i = this._isServer ? "client" : "server";
    if (!this._inflate) {
      const n = `${i}_max_window_bits`, o = typeof this.params[n] != "number" ? W.Z_DEFAULT_WINDOWBITS : this.params[n];
      this._inflate = W.createInflateRaw({
        ...this._options.zlibInflateOptions,
        windowBits: o
      }), this._inflate[se] = this, this._inflate[w] = 0, this._inflate[C] = [], this._inflate.on("error", Bt), this._inflate.on("data", st);
    }
    this._inflate[V] = r, this._inflate.write(e), t && this._inflate.write(Pt), this._inflate.flush(() => {
      const n = this._inflate[J];
      if (n) {
        this._inflate.close(), this._inflate = null, r(n);
        return;
      }
      const o = Te.concat(
        this._inflate[C],
        this._inflate[w]
      );
      this._inflate._readableState.endEmitted ? (this._inflate.close(), this._inflate = null) : (this._inflate[w] = 0, this._inflate[C] = [], t && this.params[`${i}_no_context_takeover`] && this._inflate.reset()), r(null, o);
    });
  }
  /**
   * Compress data.
   *
   * @param {(Buffer|String)} data Data to compress
   * @param {Boolean} fin Specifies whether or not this is the last fragment
   * @param {Function} callback Callback
   * @private
   */
  _compress(e, t, r) {
    const i = this._isServer ? "server" : "client";
    if (!this._deflate) {
      const n = `${i}_max_window_bits`, o = typeof this.params[n] != "number" ? W.Z_DEFAULT_WINDOWBITS : this.params[n];
      this._deflate = W.createDeflateRaw({
        ...this._options.zlibDeflateOptions,
        windowBits: o
      }), this._deflate[w] = 0, this._deflate[C] = [], this._deflate.on("data", Ut);
    }
    this._deflate[V] = r, this._deflate.write(e), this._deflate.flush(W.Z_SYNC_FLUSH, () => {
      if (!this._deflate)
        return;
      let n = Te.concat(
        this._deflate[C],
        this._deflate[w]
      );
      t && (n = new Nt(n.buffer, n.byteOffset, n.length - 4)), this._deflate[V] = null, this._deflate[w] = 0, this._deflate[C] = [], t && this.params[`${i}_no_context_takeover`] && this._deflate.reset(), r(null, n);
    });
  }
};
var oe = Rt;
function Ut(s) {
  this[C].push(s), this[w] += s.length;
}
function st(s) {
  if (this[w] += s.length, this[se]._maxPayload < 1 || this[w] <= this[se]._maxPayload) {
    this[C].push(s);
    return;
  }
  this[J] = new RangeError("Max payload size exceeded"), this[J].code = "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH", this[J][tt] = 1009, this.removeListener("data", st), this.reset();
}
function Bt(s) {
  this[se]._inflate = null, s[tt] = 1007, this[V](s);
}
var re = { exports: {} };
const $t = {}, Mt = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: $t
}, Symbol.toStringTag, { value: "Module" })), It = /* @__PURE__ */ gt(Mt);
var Le;
const { isUtf8: Ne } = S, Dt = [
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  // 0 - 15
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  // 16 - 31
  0,
  1,
  0,
  1,
  1,
  1,
  1,
  1,
  0,
  0,
  1,
  1,
  0,
  1,
  1,
  0,
  // 32 - 47
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  0,
  0,
  0,
  0,
  0,
  0,
  // 48 - 63
  0,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  // 64 - 79
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  0,
  0,
  0,
  1,
  1,
  // 80 - 95
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  // 96 - 111
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  1,
  0,
  1,
  0,
  1,
  0
  // 112 - 127
];
function Wt(s) {
  return s >= 1e3 && s <= 1014 && s !== 1004 && s !== 1005 && s !== 1006 || s >= 3e3 && s <= 4999;
}
function be(s) {
  const e = s.length;
  let t = 0;
  for (; t < e; )
    if (!(s[t] & 128))
      t++;
    else if ((s[t] & 224) === 192) {
      if (t + 1 === e || (s[t + 1] & 192) !== 128 || (s[t] & 254) === 192)
        return !1;
      t += 2;
    } else if ((s[t] & 240) === 224) {
      if (t + 2 >= e || (s[t + 1] & 192) !== 128 || (s[t + 2] & 192) !== 128 || s[t] === 224 && (s[t + 1] & 224) === 128 || // Overlong
      s[t] === 237 && (s[t + 1] & 224) === 160)
        return !1;
      t += 3;
    } else if ((s[t] & 248) === 240) {
      if (t + 3 >= e || (s[t + 1] & 192) !== 128 || (s[t + 2] & 192) !== 128 || (s[t + 3] & 192) !== 128 || s[t] === 240 && (s[t + 1] & 240) === 128 || // Overlong
      s[t] === 244 && s[t + 1] > 143 || s[t] > 244)
        return !1;
      t += 4;
    } else
      return !1;
  return !0;
}
re.exports = {
  isValidStatusCode: Wt,
  isValidUTF8: be,
  tokenChars: Dt
};
if (Ne)
  Le = re.exports.isValidUTF8 = function(s) {
    return s.length < 24 ? be(s) : Ne(s);
  };
else if (!process.env.WS_NO_UTF_8_VALIDATE)
  try {
    const s = It;
    Le = re.exports.isValidUTF8 = function(e) {
      return e.length < 32 ? be(e) : s(e);
    };
  } catch {
  }
var ae = re.exports;
const { Writable: At } = S, Pe = oe, {
  BINARY_TYPES: Ft,
  EMPTY_BUFFER: Re,
  kStatusCode: jt,
  kWebSocket: Gt
} = U, { concat: de, toArrayBuffer: Vt, unmask: Ht } = ne, { isValidStatusCode: zt, isValidUTF8: Ue } = ae, X = Buffer[Symbol.species], A = 0, Be = 1, $e = 2, Me = 3, _e = 4, Yt = 5;
let qt = class extends At {
  /**
   * Creates a Receiver instance.
   *
   * @param {Object} [options] Options object
   * @param {String} [options.binaryType=nodebuffer] The type for binary data
   * @param {Object} [options.extensions] An object containing the negotiated
   *     extensions
   * @param {Boolean} [options.isServer=false] Specifies whether to operate in
   *     client or server mode
   * @param {Number} [options.maxPayload=0] The maximum allowed message length
   * @param {Boolean} [options.skipUTF8Validation=false] Specifies whether or
   *     not to skip UTF-8 validation for text and close messages
   */
  constructor(e = {}) {
    super(), this._binaryType = e.binaryType || Ft[0], this._extensions = e.extensions || {}, this._isServer = !!e.isServer, this._maxPayload = e.maxPayload | 0, this._skipUTF8Validation = !!e.skipUTF8Validation, this[Gt] = void 0, this._bufferedBytes = 0, this._buffers = [], this._compressed = !1, this._payloadLength = 0, this._mask = void 0, this._fragmented = 0, this._masked = !1, this._fin = !1, this._opcode = 0, this._totalPayloadLength = 0, this._messageLength = 0, this._fragments = [], this._state = A, this._loop = !1;
  }
  /**
   * Implements `Writable.prototype._write()`.
   *
   * @param {Buffer} chunk The chunk of data to write
   * @param {String} encoding The character encoding of `chunk`
   * @param {Function} cb Callback
   * @private
   */
  _write(e, t, r) {
    if (this._opcode === 8 && this._state == A)
      return r();
    this._bufferedBytes += e.length, this._buffers.push(e), this.startLoop(r);
  }
  /**
   * Consumes `n` bytes from the buffered data.
   *
   * @param {Number} n The number of bytes to consume
   * @return {Buffer} The consumed bytes
   * @private
   */
  consume(e) {
    if (this._bufferedBytes -= e, e === this._buffers[0].length)
      return this._buffers.shift();
    if (e < this._buffers[0].length) {
      const r = this._buffers[0];
      return this._buffers[0] = new X(
        r.buffer,
        r.byteOffset + e,
        r.length - e
      ), new X(r.buffer, r.byteOffset, e);
    }
    const t = Buffer.allocUnsafe(e);
    do {
      const r = this._buffers[0], i = t.length - e;
      e >= r.length ? t.set(this._buffers.shift(), i) : (t.set(new Uint8Array(r.buffer, r.byteOffset, e), i), this._buffers[0] = new X(
        r.buffer,
        r.byteOffset + e,
        r.length - e
      )), e -= r.length;
    } while (e > 0);
    return t;
  }
  /**
   * Starts the parsing loop.
   *
   * @param {Function} cb Callback
   * @private
   */
  startLoop(e) {
    let t;
    this._loop = !0;
    do
      switch (this._state) {
        case A:
          t = this.getInfo();
          break;
        case Be:
          t = this.getPayloadLength16();
          break;
        case $e:
          t = this.getPayloadLength64();
          break;
        case Me:
          this.getMask();
          break;
        case _e:
          t = this.getData(e);
          break;
        default:
          this._loop = !1;
          return;
      }
    while (this._loop);
    e(t);
  }
  /**
   * Reads the first two bytes of a frame.
   *
   * @return {(RangeError|undefined)} A possible error
   * @private
   */
  getInfo() {
    if (this._bufferedBytes < 2) {
      this._loop = !1;
      return;
    }
    const e = this.consume(2);
    if (e[0] & 48)
      return this._loop = !1, g(
        RangeError,
        "RSV2 and RSV3 must be clear",
        !0,
        1002,
        "WS_ERR_UNEXPECTED_RSV_2_3"
      );
    const t = (e[0] & 64) === 64;
    if (t && !this._extensions[Pe.extensionName])
      return this._loop = !1, g(
        RangeError,
        "RSV1 must be clear",
        !0,
        1002,
        "WS_ERR_UNEXPECTED_RSV_1"
      );
    if (this._fin = (e[0] & 128) === 128, this._opcode = e[0] & 15, this._payloadLength = e[1] & 127, this._opcode === 0) {
      if (t)
        return this._loop = !1, g(
          RangeError,
          "RSV1 must be clear",
          !0,
          1002,
          "WS_ERR_UNEXPECTED_RSV_1"
        );
      if (!this._fragmented)
        return this._loop = !1, g(
          RangeError,
          "invalid opcode 0",
          !0,
          1002,
          "WS_ERR_INVALID_OPCODE"
        );
      this._opcode = this._fragmented;
    } else if (this._opcode === 1 || this._opcode === 2) {
      if (this._fragmented)
        return this._loop = !1, g(
          RangeError,
          `invalid opcode ${this._opcode}`,
          !0,
          1002,
          "WS_ERR_INVALID_OPCODE"
        );
      this._compressed = t;
    } else if (this._opcode > 7 && this._opcode < 11) {
      if (!this._fin)
        return this._loop = !1, g(
          RangeError,
          "FIN must be set",
          !0,
          1002,
          "WS_ERR_EXPECTED_FIN"
        );
      if (t)
        return this._loop = !1, g(
          RangeError,
          "RSV1 must be clear",
          !0,
          1002,
          "WS_ERR_UNEXPECTED_RSV_1"
        );
      if (this._payloadLength > 125 || this._opcode === 8 && this._payloadLength === 1)
        return this._loop = !1, g(
          RangeError,
          `invalid payload length ${this._payloadLength}`,
          !0,
          1002,
          "WS_ERR_INVALID_CONTROL_PAYLOAD_LENGTH"
        );
    } else
      return this._loop = !1, g(
        RangeError,
        `invalid opcode ${this._opcode}`,
        !0,
        1002,
        "WS_ERR_INVALID_OPCODE"
      );
    if (!this._fin && !this._fragmented && (this._fragmented = this._opcode), this._masked = (e[1] & 128) === 128, this._isServer) {
      if (!this._masked)
        return this._loop = !1, g(
          RangeError,
          "MASK must be set",
          !0,
          1002,
          "WS_ERR_EXPECTED_MASK"
        );
    } else if (this._masked)
      return this._loop = !1, g(
        RangeError,
        "MASK must be clear",
        !0,
        1002,
        "WS_ERR_UNEXPECTED_MASK"
      );
    if (this._payloadLength === 126)
      this._state = Be;
    else if (this._payloadLength === 127)
      this._state = $e;
    else
      return this.haveLength();
  }
  /**
   * Gets extended payload length (7+16).
   *
   * @return {(RangeError|undefined)} A possible error
   * @private
   */
  getPayloadLength16() {
    if (this._bufferedBytes < 2) {
      this._loop = !1;
      return;
    }
    return this._payloadLength = this.consume(2).readUInt16BE(0), this.haveLength();
  }
  /**
   * Gets extended payload length (7+64).
   *
   * @return {(RangeError|undefined)} A possible error
   * @private
   */
  getPayloadLength64() {
    if (this._bufferedBytes < 8) {
      this._loop = !1;
      return;
    }
    const e = this.consume(8), t = e.readUInt32BE(0);
    return t > Math.pow(2, 21) - 1 ? (this._loop = !1, g(
      RangeError,
      "Unsupported WebSocket frame: payload length > 2^53 - 1",
      !1,
      1009,
      "WS_ERR_UNSUPPORTED_DATA_PAYLOAD_LENGTH"
    )) : (this._payloadLength = t * Math.pow(2, 32) + e.readUInt32BE(4), this.haveLength());
  }
  /**
   * Payload length has been read.
   *
   * @return {(RangeError|undefined)} A possible error
   * @private
   */
  haveLength() {
    if (this._payloadLength && this._opcode < 8 && (this._totalPayloadLength += this._payloadLength, this._totalPayloadLength > this._maxPayload && this._maxPayload > 0))
      return this._loop = !1, g(
        RangeError,
        "Max payload size exceeded",
        !1,
        1009,
        "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH"
      );
    this._masked ? this._state = Me : this._state = _e;
  }
  /**
   * Reads mask bytes.
   *
   * @private
   */
  getMask() {
    if (this._bufferedBytes < 4) {
      this._loop = !1;
      return;
    }
    this._mask = this.consume(4), this._state = _e;
  }
  /**
   * Reads data bytes.
   *
   * @param {Function} cb Callback
   * @return {(Error|RangeError|undefined)} A possible error
   * @private
   */
  getData(e) {
    let t = Re;
    if (this._payloadLength) {
      if (this._bufferedBytes < this._payloadLength) {
        this._loop = !1;
        return;
      }
      t = this.consume(this._payloadLength), this._masked && this._mask[0] | this._mask[1] | this._mask[2] | this._mask[3] && Ht(t, this._mask);
    }
    if (this._opcode > 7)
      return this.controlMessage(t);
    if (this._compressed) {
      this._state = Yt, this.decompress(t, e);
      return;
    }
    return t.length && (this._messageLength = this._totalPayloadLength, this._fragments.push(t)), this.dataMessage();
  }
  /**
   * Decompresses data.
   *
   * @param {Buffer} data Compressed data
   * @param {Function} cb Callback
   * @private
   */
  decompress(e, t) {
    this._extensions[Pe.extensionName].decompress(e, this._fin, (i, n) => {
      if (i)
        return t(i);
      if (n.length) {
        if (this._messageLength += n.length, this._messageLength > this._maxPayload && this._maxPayload > 0)
          return t(
            g(
              RangeError,
              "Max payload size exceeded",
              !1,
              1009,
              "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH"
            )
          );
        this._fragments.push(n);
      }
      const o = this.dataMessage();
      if (o)
        return t(o);
      this.startLoop(t);
    });
  }
  /**
   * Handles a data message.
   *
   * @return {(Error|undefined)} A possible error
   * @private
   */
  dataMessage() {
    if (this._fin) {
      const e = this._messageLength, t = this._fragments;
      if (this._totalPayloadLength = 0, this._messageLength = 0, this._fragmented = 0, this._fragments = [], this._opcode === 2) {
        let r;
        this._binaryType === "nodebuffer" ? r = de(t, e) : this._binaryType === "arraybuffer" ? r = Vt(de(t, e)) : r = t, this.emit("message", r, !0);
      } else {
        const r = de(t, e);
        if (!this._skipUTF8Validation && !Ue(r))
          return this._loop = !1, g(
            Error,
            "invalid UTF-8 sequence",
            !0,
            1007,
            "WS_ERR_INVALID_UTF8"
          );
        this.emit("message", r, !1);
      }
    }
    this._state = A;
  }
  /**
   * Handles a control message.
   *
   * @param {Buffer} data Data to handle
   * @return {(Error|RangeError|undefined)} A possible error
   * @private
   */
  controlMessage(e) {
    if (this._opcode === 8)
      if (this._loop = !1, e.length === 0)
        this.emit("conclude", 1005, Re), this.end();
      else {
        const t = e.readUInt16BE(0);
        if (!zt(t))
          return g(
            RangeError,
            `invalid status code ${t}`,
            !0,
            1002,
            "WS_ERR_INVALID_CLOSE_CODE"
          );
        const r = new X(
          e.buffer,
          e.byteOffset + 2,
          e.length - 2
        );
        if (!this._skipUTF8Validation && !Ue(r))
          return g(
            Error,
            "invalid UTF-8 sequence",
            !0,
            1007,
            "WS_ERR_INVALID_UTF8"
          );
        this.emit("conclude", t, r), this.end();
      }
    else
      this._opcode === 9 ? this.emit("ping", e) : this.emit("pong", e);
    this._state = A;
  }
};
var rt = qt;
function g(s, e, t, r, i) {
  const n = new s(
    t ? `Invalid WebSocket frame: ${e}` : e
  );
  return Error.captureStackTrace(n, g), n.code = i, n[jt] = r, n;
}
const qs = /* @__PURE__ */ z(rt), { randomFillSync: Kt } = S, Ie = oe, { EMPTY_BUFFER: Xt } = U, { isValidStatusCode: Zt } = ae, { mask: De, toBuffer: M } = ne, x = Symbol("kByteLength"), Qt = Buffer.alloc(4);
let Jt = class P {
  /**
   * Creates a Sender instance.
   *
   * @param {(net.Socket|tls.Socket)} socket The connection socket
   * @param {Object} [extensions] An object containing the negotiated extensions
   * @param {Function} [generateMask] The function used to generate the masking
   *     key
   */
  constructor(e, t, r) {
    this._extensions = t || {}, r && (this._generateMask = r, this._maskBuffer = Buffer.alloc(4)), this._socket = e, this._firstFragment = !0, this._compress = !1, this._bufferedBytes = 0, this._deflating = !1, this._queue = [];
  }
  /**
   * Frames a piece of data according to the HyBi WebSocket protocol.
   *
   * @param {(Buffer|String)} data The data to frame
   * @param {Object} options Options object
   * @param {Boolean} [options.fin=false] Specifies whether or not to set the
   *     FIN bit
   * @param {Function} [options.generateMask] The function used to generate the
   *     masking key
   * @param {Boolean} [options.mask=false] Specifies whether or not to mask
   *     `data`
   * @param {Buffer} [options.maskBuffer] The buffer used to store the masking
   *     key
   * @param {Number} options.opcode The opcode
   * @param {Boolean} [options.readOnly=false] Specifies whether `data` can be
   *     modified
   * @param {Boolean} [options.rsv1=false] Specifies whether or not to set the
   *     RSV1 bit
   * @return {(Buffer|String)[]} The framed data
   * @public
   */
  static frame(e, t) {
    let r, i = !1, n = 2, o = !1;
    t.mask && (r = t.maskBuffer || Qt, t.generateMask ? t.generateMask(r) : Kt(r, 0, 4), o = (r[0] | r[1] | r[2] | r[3]) === 0, n = 6);
    let l;
    typeof e == "string" ? (!t.mask || o) && t[x] !== void 0 ? l = t[x] : (e = Buffer.from(e), l = e.length) : (l = e.length, i = t.mask && t.readOnly && !o);
    let f = l;
    l >= 65536 ? (n += 8, f = 127) : l > 125 && (n += 2, f = 126);
    const a = Buffer.allocUnsafe(i ? l + n : n);
    return a[0] = t.fin ? t.opcode | 128 : t.opcode, t.rsv1 && (a[0] |= 64), a[1] = f, f === 126 ? a.writeUInt16BE(l, 2) : f === 127 && (a[2] = a[3] = 0, a.writeUIntBE(l, 4, 6)), t.mask ? (a[1] |= 128, a[n - 4] = r[0], a[n - 3] = r[1], a[n - 2] = r[2], a[n - 1] = r[3], o ? [a, e] : i ? (De(e, r, a, n, l), [a]) : (De(e, r, e, 0, l), [a, e])) : [a, e];
  }
  /**
   * Sends a close message to the other peer.
   *
   * @param {Number} [code] The status code component of the body
   * @param {(String|Buffer)} [data] The message component of the body
   * @param {Boolean} [mask=false] Specifies whether or not to mask the message
   * @param {Function} [cb] Callback
   * @public
   */
  close(e, t, r, i) {
    let n;
    if (e === void 0)
      n = Xt;
    else {
      if (typeof e != "number" || !Zt(e))
        throw new TypeError("First argument must be a valid error code number");
      if (t === void 0 || !t.length)
        n = Buffer.allocUnsafe(2), n.writeUInt16BE(e, 0);
      else {
        const l = Buffer.byteLength(t);
        if (l > 123)
          throw new RangeError("The message must not be greater than 123 bytes");
        n = Buffer.allocUnsafe(2 + l), n.writeUInt16BE(e, 0), typeof t == "string" ? n.write(t, 2) : n.set(t, 2);
      }
    }
    const o = {
      [x]: n.length,
      fin: !0,
      generateMask: this._generateMask,
      mask: r,
      maskBuffer: this._maskBuffer,
      opcode: 8,
      readOnly: !1,
      rsv1: !1
    };
    this._deflating ? this.enqueue([this.dispatch, n, !1, o, i]) : this.sendFrame(P.frame(n, o), i);
  }
  /**
   * Sends a ping message to the other peer.
   *
   * @param {*} data The message to send
   * @param {Boolean} [mask=false] Specifies whether or not to mask `data`
   * @param {Function} [cb] Callback
   * @public
   */
  ping(e, t, r) {
    let i, n;
    if (typeof e == "string" ? (i = Buffer.byteLength(e), n = !1) : (e = M(e), i = e.length, n = M.readOnly), i > 125)
      throw new RangeError("The data size must not be greater than 125 bytes");
    const o = {
      [x]: i,
      fin: !0,
      generateMask: this._generateMask,
      mask: t,
      maskBuffer: this._maskBuffer,
      opcode: 9,
      readOnly: n,
      rsv1: !1
    };
    this._deflating ? this.enqueue([this.dispatch, e, !1, o, r]) : this.sendFrame(P.frame(e, o), r);
  }
  /**
   * Sends a pong message to the other peer.
   *
   * @param {*} data The message to send
   * @param {Boolean} [mask=false] Specifies whether or not to mask `data`
   * @param {Function} [cb] Callback
   * @public
   */
  pong(e, t, r) {
    let i, n;
    if (typeof e == "string" ? (i = Buffer.byteLength(e), n = !1) : (e = M(e), i = e.length, n = M.readOnly), i > 125)
      throw new RangeError("The data size must not be greater than 125 bytes");
    const o = {
      [x]: i,
      fin: !0,
      generateMask: this._generateMask,
      mask: t,
      maskBuffer: this._maskBuffer,
      opcode: 10,
      readOnly: n,
      rsv1: !1
    };
    this._deflating ? this.enqueue([this.dispatch, e, !1, o, r]) : this.sendFrame(P.frame(e, o), r);
  }
  /**
   * Sends a data message to the other peer.
   *
   * @param {*} data The message to send
   * @param {Object} options Options object
   * @param {Boolean} [options.binary=false] Specifies whether `data` is binary
   *     or text
   * @param {Boolean} [options.compress=false] Specifies whether or not to
   *     compress `data`
   * @param {Boolean} [options.fin=false] Specifies whether the fragment is the
   *     last one
   * @param {Boolean} [options.mask=false] Specifies whether or not to mask
   *     `data`
   * @param {Function} [cb] Callback
   * @public
   */
  send(e, t, r) {
    const i = this._extensions[Ie.extensionName];
    let n = t.binary ? 2 : 1, o = t.compress, l, f;
    if (typeof e == "string" ? (l = Buffer.byteLength(e), f = !1) : (e = M(e), l = e.length, f = M.readOnly), this._firstFragment ? (this._firstFragment = !1, o && i && i.params[i._isServer ? "server_no_context_takeover" : "client_no_context_takeover"] && (o = l >= i._threshold), this._compress = o) : (o = !1, n = 0), t.fin && (this._firstFragment = !0), i) {
      const a = {
        [x]: l,
        fin: t.fin,
        generateMask: this._generateMask,
        mask: t.mask,
        maskBuffer: this._maskBuffer,
        opcode: n,
        readOnly: f,
        rsv1: o
      };
      this._deflating ? this.enqueue([this.dispatch, e, this._compress, a, r]) : this.dispatch(e, this._compress, a, r);
    } else
      this.sendFrame(
        P.frame(e, {
          [x]: l,
          fin: t.fin,
          generateMask: this._generateMask,
          mask: t.mask,
          maskBuffer: this._maskBuffer,
          opcode: n,
          readOnly: f,
          rsv1: !1
        }),
        r
      );
  }
  /**
   * Dispatches a message.
   *
   * @param {(Buffer|String)} data The message to send
   * @param {Boolean} [compress=false] Specifies whether or not to compress
   *     `data`
   * @param {Object} options Options object
   * @param {Boolean} [options.fin=false] Specifies whether or not to set the
   *     FIN bit
   * @param {Function} [options.generateMask] The function used to generate the
   *     masking key
   * @param {Boolean} [options.mask=false] Specifies whether or not to mask
   *     `data`
   * @param {Buffer} [options.maskBuffer] The buffer used to store the masking
   *     key
   * @param {Number} options.opcode The opcode
   * @param {Boolean} [options.readOnly=false] Specifies whether `data` can be
   *     modified
   * @param {Boolean} [options.rsv1=false] Specifies whether or not to set the
   *     RSV1 bit
   * @param {Function} [cb] Callback
   * @private
   */
  dispatch(e, t, r, i) {
    if (!t) {
      this.sendFrame(P.frame(e, r), i);
      return;
    }
    const n = this._extensions[Ie.extensionName];
    this._bufferedBytes += r[x], this._deflating = !0, n.compress(e, r.fin, (o, l) => {
      if (this._socket.destroyed) {
        const f = new Error(
          "The socket was closed while data was being compressed"
        );
        typeof i == "function" && i(f);
        for (let a = 0; a < this._queue.length; a++) {
          const c = this._queue[a], h = c[c.length - 1];
          typeof h == "function" && h(f);
        }
        return;
      }
      this._bufferedBytes -= r[x], this._deflating = !1, r.readOnly = !1, this.sendFrame(P.frame(l, r), i), this.dequeue();
    });
  }
  /**
   * Executes queued send operations.
   *
   * @private
   */
  dequeue() {
    for (; !this._deflating && this._queue.length; ) {
      const e = this._queue.shift();
      this._bufferedBytes -= e[3][x], Reflect.apply(e[0], this, e.slice(1));
    }
  }
  /**
   * Enqueues a send operation.
   *
   * @param {Array} params Send operation parameters.
   * @private
   */
  enqueue(e) {
    this._bufferedBytes += e[3][x], this._queue.push(e);
  }
  /**
   * Sends a frame.
   *
   * @param {Buffer[]} list The frame to send
   * @param {Function} [cb] Callback
   * @private
   */
  sendFrame(e, t) {
    e.length === 2 ? (this._socket.cork(), this._socket.write(e[0]), this._socket.write(e[1], t), this._socket.uncork()) : this._socket.write(e[0], t);
  }
};
var it = Jt;
const Ks = /* @__PURE__ */ z(it), { kForOnEventAttribute: F, kListener: pe } = U, We = Symbol("kCode"), Ae = Symbol("kData"), Fe = Symbol("kError"), je = Symbol("kMessage"), Ge = Symbol("kReason"), I = Symbol("kTarget"), Ve = Symbol("kType"), He = Symbol("kWasClean");
class B {
  /**
   * Create a new `Event`.
   *
   * @param {String} type The name of the event
   * @throws {TypeError} If the `type` argument is not specified
   */
  constructor(e) {
    this[I] = null, this[Ve] = e;
  }
  /**
   * @type {*}
   */
  get target() {
    return this[I];
  }
  /**
   * @type {String}
   */
  get type() {
    return this[Ve];
  }
}
Object.defineProperty(B.prototype, "target", { enumerable: !0 });
Object.defineProperty(B.prototype, "type", { enumerable: !0 });
class Y extends B {
  /**
   * Create a new `CloseEvent`.
   *
   * @param {String} type The name of the event
   * @param {Object} [options] A dictionary object that allows for setting
   *     attributes via object members of the same name
   * @param {Number} [options.code=0] The status code explaining why the
   *     connection was closed
   * @param {String} [options.reason=''] A human-readable string explaining why
   *     the connection was closed
   * @param {Boolean} [options.wasClean=false] Indicates whether or not the
   *     connection was cleanly closed
   */
  constructor(e, t = {}) {
    super(e), this[We] = t.code === void 0 ? 0 : t.code, this[Ge] = t.reason === void 0 ? "" : t.reason, this[He] = t.wasClean === void 0 ? !1 : t.wasClean;
  }
  /**
   * @type {Number}
   */
  get code() {
    return this[We];
  }
  /**
   * @type {String}
   */
  get reason() {
    return this[Ge];
  }
  /**
   * @type {Boolean}
   */
  get wasClean() {
    return this[He];
  }
}
Object.defineProperty(Y.prototype, "code", { enumerable: !0 });
Object.defineProperty(Y.prototype, "reason", { enumerable: !0 });
Object.defineProperty(Y.prototype, "wasClean", { enumerable: !0 });
class le extends B {
  /**
   * Create a new `ErrorEvent`.
   *
   * @param {String} type The name of the event
   * @param {Object} [options] A dictionary object that allows for setting
   *     attributes via object members of the same name
   * @param {*} [options.error=null] The error that generated this event
   * @param {String} [options.message=''] The error message
   */
  constructor(e, t = {}) {
    super(e), this[Fe] = t.error === void 0 ? null : t.error, this[je] = t.message === void 0 ? "" : t.message;
  }
  /**
   * @type {*}
   */
  get error() {
    return this[Fe];
  }
  /**
   * @type {String}
   */
  get message() {
    return this[je];
  }
}
Object.defineProperty(le.prototype, "error", { enumerable: !0 });
Object.defineProperty(le.prototype, "message", { enumerable: !0 });
class xe extends B {
  /**
   * Create a new `MessageEvent`.
   *
   * @param {String} type The name of the event
   * @param {Object} [options] A dictionary object that allows for setting
   *     attributes via object members of the same name
   * @param {*} [options.data=null] The message content
   */
  constructor(e, t = {}) {
    super(e), this[Ae] = t.data === void 0 ? null : t.data;
  }
  /**
   * @type {*}
   */
  get data() {
    return this[Ae];
  }
}
Object.defineProperty(xe.prototype, "data", { enumerable: !0 });
const es = {
  /**
   * Register an event listener.
   *
   * @param {String} type A string representing the event type to listen for
   * @param {(Function|Object)} handler The listener to add
   * @param {Object} [options] An options object specifies characteristics about
   *     the event listener
   * @param {Boolean} [options.once=false] A `Boolean` indicating that the
   *     listener should be invoked at most once after being added. If `true`,
   *     the listener would be automatically removed when invoked.
   * @public
   */
  addEventListener(s, e, t = {}) {
    for (const i of this.listeners(s))
      if (!t[F] && i[pe] === e && !i[F])
        return;
    let r;
    if (s === "message")
      r = function(n, o) {
        const l = new xe("message", {
          data: o ? n : n.toString()
        });
        l[I] = this, Z(e, this, l);
      };
    else if (s === "close")
      r = function(n, o) {
        const l = new Y("close", {
          code: n,
          reason: o.toString(),
          wasClean: this._closeFrameReceived && this._closeFrameSent
        });
        l[I] = this, Z(e, this, l);
      };
    else if (s === "error")
      r = function(n) {
        const o = new le("error", {
          error: n,
          message: n.message
        });
        o[I] = this, Z(e, this, o);
      };
    else if (s === "open")
      r = function() {
        const n = new B("open");
        n[I] = this, Z(e, this, n);
      };
    else
      return;
    r[F] = !!t[F], r[pe] = e, t.once ? this.once(s, r) : this.on(s, r);
  },
  /**
   * Remove an event listener.
   *
   * @param {String} type A string representing the event type to remove
   * @param {(Function|Object)} handler The listener to remove
   * @public
   */
  removeEventListener(s, e) {
    for (const t of this.listeners(s))
      if (t[pe] === e && !t[F]) {
        this.removeListener(s, t);
        break;
      }
  }
};
var ts = {
  CloseEvent: Y,
  ErrorEvent: le,
  Event: B,
  EventTarget: es,
  MessageEvent: xe
};
function Z(s, e, t) {
  typeof s == "object" && s.handleEvent ? s.handleEvent.call(s, t) : s.call(e, t);
}
const { tokenChars: j } = ae;
function k(s, e, t) {
  s[e] === void 0 ? s[e] = [t] : s[e].push(t);
}
function ss(s) {
  const e = /* @__PURE__ */ Object.create(null);
  let t = /* @__PURE__ */ Object.create(null), r = !1, i = !1, n = !1, o, l, f = -1, a = -1, c = -1, h = 0;
  for (; h < s.length; h++)
    if (a = s.charCodeAt(h), o === void 0)
      if (c === -1 && j[a] === 1)
        f === -1 && (f = h);
      else if (h !== 0 && (a === 32 || a === 9))
        c === -1 && f !== -1 && (c = h);
      else if (a === 59 || a === 44) {
        if (f === -1)
          throw new SyntaxError(`Unexpected character at index ${h}`);
        c === -1 && (c = h);
        const v = s.slice(f, c);
        a === 44 ? (k(e, v, t), t = /* @__PURE__ */ Object.create(null)) : o = v, f = c = -1;
      } else
        throw new SyntaxError(`Unexpected character at index ${h}`);
    else if (l === void 0)
      if (c === -1 && j[a] === 1)
        f === -1 && (f = h);
      else if (a === 32 || a === 9)
        c === -1 && f !== -1 && (c = h);
      else if (a === 59 || a === 44) {
        if (f === -1)
          throw new SyntaxError(`Unexpected character at index ${h}`);
        c === -1 && (c = h), k(t, s.slice(f, c), !0), a === 44 && (k(e, o, t), t = /* @__PURE__ */ Object.create(null), o = void 0), f = c = -1;
      } else if (a === 61 && f !== -1 && c === -1)
        l = s.slice(f, h), f = c = -1;
      else
        throw new SyntaxError(`Unexpected character at index ${h}`);
    else if (i) {
      if (j[a] !== 1)
        throw new SyntaxError(`Unexpected character at index ${h}`);
      f === -1 ? f = h : r || (r = !0), i = !1;
    } else if (n)
      if (j[a] === 1)
        f === -1 && (f = h);
      else if (a === 34 && f !== -1)
        n = !1, c = h;
      else if (a === 92)
        i = !0;
      else
        throw new SyntaxError(`Unexpected character at index ${h}`);
    else if (a === 34 && s.charCodeAt(h - 1) === 61)
      n = !0;
    else if (c === -1 && j[a] === 1)
      f === -1 && (f = h);
    else if (f !== -1 && (a === 32 || a === 9))
      c === -1 && (c = h);
    else if (a === 59 || a === 44) {
      if (f === -1)
        throw new SyntaxError(`Unexpected character at index ${h}`);
      c === -1 && (c = h);
      let v = s.slice(f, c);
      r && (v = v.replace(/\\/g, ""), r = !1), k(t, l, v), a === 44 && (k(e, o, t), t = /* @__PURE__ */ Object.create(null), o = void 0), l = void 0, f = c = -1;
    } else
      throw new SyntaxError(`Unexpected character at index ${h}`);
  if (f === -1 || n || a === 32 || a === 9)
    throw new SyntaxError("Unexpected end of input");
  c === -1 && (c = h);
  const p = s.slice(f, c);
  return o === void 0 ? k(e, p, t) : (l === void 0 ? k(t, p, !0) : r ? k(t, l, p.replace(/\\/g, "")) : k(t, l, p), k(e, o, t)), e;
}
function rs(s) {
  return Object.keys(s).map((e) => {
    let t = s[e];
    return Array.isArray(t) || (t = [t]), t.map((r) => [e].concat(
      Object.keys(r).map((i) => {
        let n = r[i];
        return Array.isArray(n) || (n = [n]), n.map((o) => o === !0 ? i : `${i}=${o}`).join("; ");
      })
    ).join("; ")).join(", ");
  }).join(", ");
}
var nt = { format: rs, parse: ss };
const is = S, ns = S, os = S, ot = S, as = S, { randomBytes: ls, createHash: fs } = S, { URL: me } = S, T = oe, hs = rt, cs = it, {
  BINARY_TYPES: ze,
  EMPTY_BUFFER: Q,
  GUID: us,
  kForOnEventAttribute: ge,
  kListener: ds,
  kStatusCode: _s,
  kWebSocket: y,
  NOOP: at
} = U, {
  EventTarget: { addEventListener: ps, removeEventListener: ms }
} = ts, { format: gs, parse: ys } = nt, { toBuffer: vs } = ne, Ss = 30 * 1e3, lt = Symbol("kAborted"), ye = [8, 13], O = ["CONNECTING", "OPEN", "CLOSING", "CLOSED"], Es = /^[!#$%&'*+\-.0-9A-Z^_`|a-z~]+$/;
let m = class d extends is {
  /**
   * Create a new `WebSocket`.
   *
   * @param {(String|URL)} address The URL to which to connect
   * @param {(String|String[])} [protocols] The subprotocols
   * @param {Object} [options] Connection options
   */
  constructor(e, t, r) {
    super(), this._binaryType = ze[0], this._closeCode = 1006, this._closeFrameReceived = !1, this._closeFrameSent = !1, this._closeMessage = Q, this._closeTimer = null, this._extensions = {}, this._paused = !1, this._protocol = "", this._readyState = d.CONNECTING, this._receiver = null, this._sender = null, this._socket = null, e !== null ? (this._bufferedAmount = 0, this._isServer = !1, this._redirects = 0, t === void 0 ? t = [] : Array.isArray(t) || (typeof t == "object" && t !== null ? (r = t, t = []) : t = [t]), ht(this, e, t, r)) : this._isServer = !0;
  }
  /**
   * This deviates from the WHATWG interface since ws doesn't support the
   * required default "blob" type (instead we define a custom "nodebuffer"
   * type).
   *
   * @type {String}
   */
  get binaryType() {
    return this._binaryType;
  }
  set binaryType(e) {
    ze.includes(e) && (this._binaryType = e, this._receiver && (this._receiver._binaryType = e));
  }
  /**
   * @type {Number}
   */
  get bufferedAmount() {
    return this._socket ? this._socket._writableState.length + this._sender._bufferedBytes : this._bufferedAmount;
  }
  /**
   * @type {String}
   */
  get extensions() {
    return Object.keys(this._extensions).join();
  }
  /**
   * @type {Boolean}
   */
  get isPaused() {
    return this._paused;
  }
  /**
   * @type {Function}
   */
  /* istanbul ignore next */
  get onclose() {
    return null;
  }
  /**
   * @type {Function}
   */
  /* istanbul ignore next */
  get onerror() {
    return null;
  }
  /**
   * @type {Function}
   */
  /* istanbul ignore next */
  get onopen() {
    return null;
  }
  /**
   * @type {Function}
   */
  /* istanbul ignore next */
  get onmessage() {
    return null;
  }
  /**
   * @type {String}
   */
  get protocol() {
    return this._protocol;
  }
  /**
   * @type {Number}
   */
  get readyState() {
    return this._readyState;
  }
  /**
   * @type {String}
   */
  get url() {
    return this._url;
  }
  /**
   * Set up the socket and the internal resources.
   *
   * @param {(net.Socket|tls.Socket)} socket The network socket between the
   *     server and client
   * @param {Buffer} head The first packet of the upgraded stream
   * @param {Object} options Options object
   * @param {Function} [options.generateMask] The function used to generate the
   *     masking key
   * @param {Number} [options.maxPayload=0] The maximum allowed message size
   * @param {Boolean} [options.skipUTF8Validation=false] Specifies whether or
   *     not to skip UTF-8 validation for text and close messages
   * @private
   */
  setSocket(e, t, r) {
    const i = new hs({
      binaryType: this.binaryType,
      extensions: this._extensions,
      isServer: this._isServer,
      maxPayload: r.maxPayload,
      skipUTF8Validation: r.skipUTF8Validation
    });
    this._sender = new cs(e, this._extensions, r.generateMask), this._receiver = i, this._socket = e, i[y] = this, e[y] = this, i.on("conclude", ks), i.on("drain", ws), i.on("error", Os), i.on("message", Cs), i.on("ping", Ts), i.on("pong", Ls), e.setTimeout(0), e.setNoDelay(), t.length > 0 && e.unshift(t), e.on("close", ut), e.on("data", fe), e.on("end", dt), e.on("error", _t), this._readyState = d.OPEN, this.emit("open");
  }
  /**
   * Emit the `'close'` event.
   *
   * @private
   */
  emitClose() {
    if (!this._socket) {
      this._readyState = d.CLOSED, this.emit("close", this._closeCode, this._closeMessage);
      return;
    }
    this._extensions[T.extensionName] && this._extensions[T.extensionName].cleanup(), this._receiver.removeAllListeners(), this._readyState = d.CLOSED, this.emit("close", this._closeCode, this._closeMessage);
  }
  /**
   * Start a closing handshake.
   *
   *          +----------+   +-----------+   +----------+
   *     - - -|ws.close()|-->|close frame|-->|ws.close()|- - -
   *    |     +----------+   +-----------+   +----------+     |
   *          +----------+   +-----------+         |
   * CLOSING  |ws.close()|<--|close frame|<--+-----+       CLOSING
   *          +----------+   +-----------+   |
   *    |           |                        |   +---+        |
   *                +------------------------+-->|fin| - - - -
   *    |         +---+                      |   +---+
   *     - - - - -|fin|<---------------------+
   *              +---+
   *
   * @param {Number} [code] Status code explaining why the connection is closing
   * @param {(String|Buffer)} [data] The reason why the connection is
   *     closing
   * @public
   */
  close(e, t) {
    if (this.readyState !== d.CLOSED) {
      if (this.readyState === d.CONNECTING) {
        b(this, this._req, "WebSocket was closed before the connection was established");
        return;
      }
      if (this.readyState === d.CLOSING) {
        this._closeFrameSent && (this._closeFrameReceived || this._receiver._writableState.errorEmitted) && this._socket.end();
        return;
      }
      this._readyState = d.CLOSING, this._sender.close(e, t, !this._isServer, (r) => {
        r || (this._closeFrameSent = !0, (this._closeFrameReceived || this._receiver._writableState.errorEmitted) && this._socket.end());
      }), this._closeTimer = setTimeout(
        this._socket.destroy.bind(this._socket),
        Ss
      );
    }
  }
  /**
   * Pause the socket.
   *
   * @public
   */
  pause() {
    this.readyState === d.CONNECTING || this.readyState === d.CLOSED || (this._paused = !0, this._socket.pause());
  }
  /**
   * Send a ping.
   *
   * @param {*} [data] The data to send
   * @param {Boolean} [mask] Indicates whether or not to mask `data`
   * @param {Function} [cb] Callback which is executed when the ping is sent
   * @public
   */
  ping(e, t, r) {
    if (this.readyState === d.CONNECTING)
      throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
    if (typeof e == "function" ? (r = e, e = t = void 0) : typeof t == "function" && (r = t, t = void 0), typeof e == "number" && (e = e.toString()), this.readyState !== d.OPEN) {
      ve(this, e, r);
      return;
    }
    t === void 0 && (t = !this._isServer), this._sender.ping(e || Q, t, r);
  }
  /**
   * Send a pong.
   *
   * @param {*} [data] The data to send
   * @param {Boolean} [mask] Indicates whether or not to mask `data`
   * @param {Function} [cb] Callback which is executed when the pong is sent
   * @public
   */
  pong(e, t, r) {
    if (this.readyState === d.CONNECTING)
      throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
    if (typeof e == "function" ? (r = e, e = t = void 0) : typeof t == "function" && (r = t, t = void 0), typeof e == "number" && (e = e.toString()), this.readyState !== d.OPEN) {
      ve(this, e, r);
      return;
    }
    t === void 0 && (t = !this._isServer), this._sender.pong(e || Q, t, r);
  }
  /**
   * Resume the socket.
   *
   * @public
   */
  resume() {
    this.readyState === d.CONNECTING || this.readyState === d.CLOSED || (this._paused = !1, this._receiver._writableState.needDrain || this._socket.resume());
  }
  /**
   * Send a data message.
   *
   * @param {*} data The message to send
   * @param {Object} [options] Options object
   * @param {Boolean} [options.binary] Specifies whether `data` is binary or
   *     text
   * @param {Boolean} [options.compress] Specifies whether or not to compress
   *     `data`
   * @param {Boolean} [options.fin=true] Specifies whether the fragment is the
   *     last one
   * @param {Boolean} [options.mask] Specifies whether or not to mask `data`
   * @param {Function} [cb] Callback which is executed when data is written out
   * @public
   */
  send(e, t, r) {
    if (this.readyState === d.CONNECTING)
      throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
    if (typeof t == "function" && (r = t, t = {}), typeof e == "number" && (e = e.toString()), this.readyState !== d.OPEN) {
      ve(this, e, r);
      return;
    }
    const i = {
      binary: typeof e != "string",
      mask: !this._isServer,
      compress: !0,
      fin: !0,
      ...t
    };
    this._extensions[T.extensionName] || (i.compress = !1), this._sender.send(e || Q, i, r);
  }
  /**
   * Forcibly close the connection.
   *
   * @public
   */
  terminate() {
    if (this.readyState !== d.CLOSED) {
      if (this.readyState === d.CONNECTING) {
        b(this, this._req, "WebSocket was closed before the connection was established");
        return;
      }
      this._socket && (this._readyState = d.CLOSING, this._socket.destroy());
    }
  }
};
Object.defineProperty(m, "CONNECTING", {
  enumerable: !0,
  value: O.indexOf("CONNECTING")
});
Object.defineProperty(m.prototype, "CONNECTING", {
  enumerable: !0,
  value: O.indexOf("CONNECTING")
});
Object.defineProperty(m, "OPEN", {
  enumerable: !0,
  value: O.indexOf("OPEN")
});
Object.defineProperty(m.prototype, "OPEN", {
  enumerable: !0,
  value: O.indexOf("OPEN")
});
Object.defineProperty(m, "CLOSING", {
  enumerable: !0,
  value: O.indexOf("CLOSING")
});
Object.defineProperty(m.prototype, "CLOSING", {
  enumerable: !0,
  value: O.indexOf("CLOSING")
});
Object.defineProperty(m, "CLOSED", {
  enumerable: !0,
  value: O.indexOf("CLOSED")
});
Object.defineProperty(m.prototype, "CLOSED", {
  enumerable: !0,
  value: O.indexOf("CLOSED")
});
[
  "binaryType",
  "bufferedAmount",
  "extensions",
  "isPaused",
  "protocol",
  "readyState",
  "url"
].forEach((s) => {
  Object.defineProperty(m.prototype, s, { enumerable: !0 });
});
["open", "error", "close", "message"].forEach((s) => {
  Object.defineProperty(m.prototype, `on${s}`, {
    enumerable: !0,
    get() {
      for (const e of this.listeners(s))
        if (e[ge])
          return e[ds];
      return null;
    },
    set(e) {
      for (const t of this.listeners(s))
        if (t[ge]) {
          this.removeListener(s, t);
          break;
        }
      typeof e == "function" && this.addEventListener(s, e, {
        [ge]: !0
      });
    }
  });
});
m.prototype.addEventListener = ps;
m.prototype.removeEventListener = ms;
var ft = m;
function ht(s, e, t, r) {
  const i = {
    protocolVersion: ye[1],
    maxPayload: 104857600,
    skipUTF8Validation: !1,
    perMessageDeflate: !0,
    followRedirects: !1,
    maxRedirects: 10,
    ...r,
    createConnection: void 0,
    socketPath: void 0,
    hostname: void 0,
    protocol: void 0,
    timeout: void 0,
    method: "GET",
    host: void 0,
    path: void 0,
    port: void 0
  };
  if (!ye.includes(i.protocolVersion))
    throw new RangeError(
      `Unsupported protocol version: ${i.protocolVersion} (supported versions: ${ye.join(", ")})`
    );
  let n;
  if (e instanceof me)
    n = e, s._url = e.href;
  else {
    try {
      n = new me(e);
    } catch {
      throw new SyntaxError(`Invalid URL: ${e}`);
    }
    s._url = e;
  }
  const o = n.protocol === "wss:", l = n.protocol === "ws+unix:";
  let f;
  if (n.protocol !== "ws:" && !o && !l ? f = `The URL's protocol must be one of "ws:", "wss:", or "ws+unix:"` : l && !n.pathname ? f = "The URL's pathname is empty" : n.hash && (f = "The URL contains a fragment identifier"), f) {
    const u = new SyntaxError(f);
    if (s._redirects === 0)
      throw u;
    ee(s, u);
    return;
  }
  const a = o ? 443 : 80, c = ls(16).toString("base64"), h = o ? ns.request : os.request, p = /* @__PURE__ */ new Set();
  let v;
  if (i.createConnection = o ? xs : bs, i.defaultPort = i.defaultPort || a, i.port = n.port || a, i.host = n.hostname.startsWith("[") ? n.hostname.slice(1, -1) : n.hostname, i.headers = {
    ...i.headers,
    "Sec-WebSocket-Version": i.protocolVersion,
    "Sec-WebSocket-Key": c,
    Connection: "Upgrade",
    Upgrade: "websocket"
  }, i.path = n.pathname + n.search, i.timeout = i.handshakeTimeout, i.perMessageDeflate && (v = new T(
    i.perMessageDeflate !== !0 ? i.perMessageDeflate : {},
    !1,
    i.maxPayload
  ), i.headers["Sec-WebSocket-Extensions"] = gs({
    [T.extensionName]: v.offer()
  })), t.length) {
    for (const u of t) {
      if (typeof u != "string" || !Es.test(u) || p.has(u))
        throw new SyntaxError(
          "An invalid or duplicated subprotocol was specified"
        );
      p.add(u);
    }
    i.headers["Sec-WebSocket-Protocol"] = t.join(",");
  }
  if (i.origin && (i.protocolVersion < 13 ? i.headers["Sec-WebSocket-Origin"] = i.origin : i.headers.Origin = i.origin), (n.username || n.password) && (i.auth = `${n.username}:${n.password}`), l) {
    const u = i.path.split(":");
    i.socketPath = u[0], i.path = u[1];
  }
  let _;
  if (i.followRedirects) {
    if (s._redirects === 0) {
      s._originalIpc = l, s._originalSecure = o, s._originalHostOrSocketPath = l ? i.socketPath : n.host;
      const u = r && r.headers;
      if (r = { ...r, headers: {} }, u)
        for (const [E, $] of Object.entries(u))
          r.headers[E.toLowerCase()] = $;
    } else if (s.listenerCount("redirect") === 0) {
      const u = l ? s._originalIpc ? i.socketPath === s._originalHostOrSocketPath : !1 : s._originalIpc ? !1 : n.host === s._originalHostOrSocketPath;
      (!u || s._originalSecure && !o) && (delete i.headers.authorization, delete i.headers.cookie, u || delete i.headers.host, i.auth = void 0);
    }
    i.auth && !r.headers.authorization && (r.headers.authorization = "Basic " + Buffer.from(i.auth).toString("base64")), _ = s._req = h(i), s._redirects && s.emit("redirect", s.url, _);
  } else
    _ = s._req = h(i);
  i.timeout && _.on("timeout", () => {
    b(s, _, "Opening handshake has timed out");
  }), _.on("error", (u) => {
    _ === null || _[lt] || (_ = s._req = null, ee(s, u));
  }), _.on("response", (u) => {
    const E = u.headers.location, $ = u.statusCode;
    if (E && i.followRedirects && $ >= 300 && $ < 400) {
      if (++s._redirects > i.maxRedirects) {
        b(s, _, "Maximum redirects exceeded");
        return;
      }
      _.abort();
      let q;
      try {
        q = new me(E, e);
      } catch {
        const L = new SyntaxError(`Invalid URL: ${E}`);
        ee(s, L);
        return;
      }
      ht(s, q, t, r);
    } else
      s.emit("unexpected-response", _, u) || b(
        s,
        _,
        `Unexpected server response: ${u.statusCode}`
      );
  }), _.on("upgrade", (u, E, $) => {
    if (s.emit("upgrade", u), s.readyState !== m.CONNECTING)
      return;
    if (_ = s._req = null, u.headers.upgrade.toLowerCase() !== "websocket") {
      b(s, E, "Invalid Upgrade header");
      return;
    }
    const q = fs("sha1").update(c + us).digest("base64");
    if (u.headers["sec-websocket-accept"] !== q) {
      b(s, E, "Invalid Sec-WebSocket-Accept header");
      return;
    }
    const D = u.headers["sec-websocket-protocol"];
    let L;
    if (D !== void 0 ? p.size ? p.has(D) || (L = "Server sent an invalid subprotocol") : L = "Server sent a subprotocol but none was requested" : p.size && (L = "Server sent no subprotocol"), L) {
      b(s, E, L);
      return;
    }
    D && (s._protocol = D);
    const ke = u.headers["sec-websocket-extensions"];
    if (ke !== void 0) {
      if (!v) {
        b(s, E, "Server sent a Sec-WebSocket-Extensions header but no extension was requested");
        return;
      }
      let he;
      try {
        he = ys(ke);
      } catch {
        b(s, E, "Invalid Sec-WebSocket-Extensions header");
        return;
      }
      const we = Object.keys(he);
      if (we.length !== 1 || we[0] !== T.extensionName) {
        b(s, E, "Server indicated an extension that was not requested");
        return;
      }
      try {
        v.accept(he[T.extensionName]);
      } catch {
        b(s, E, "Invalid Sec-WebSocket-Extensions header");
        return;
      }
      s._extensions[T.extensionName] = v;
    }
    s.setSocket(E, $, {
      generateMask: i.generateMask,
      maxPayload: i.maxPayload,
      skipUTF8Validation: i.skipUTF8Validation
    });
  }), i.finishRequest ? i.finishRequest(_, s) : _.end();
}
function ee(s, e) {
  s._readyState = m.CLOSING, s.emit("error", e), s.emitClose();
}
function bs(s) {
  return s.path = s.socketPath, ot.connect(s);
}
function xs(s) {
  return s.path = void 0, !s.servername && s.servername !== "" && (s.servername = ot.isIP(s.host) ? "" : s.host), as.connect(s);
}
function b(s, e, t) {
  s._readyState = m.CLOSING;
  const r = new Error(t);
  Error.captureStackTrace(r, b), e.setHeader ? (e[lt] = !0, e.abort(), e.socket && !e.socket.destroyed && e.socket.destroy(), process.nextTick(ee, s, r)) : (e.destroy(r), e.once("error", s.emit.bind(s, "error")), e.once("close", s.emitClose.bind(s)));
}
function ve(s, e, t) {
  if (e) {
    const r = vs(e).length;
    s._socket ? s._sender._bufferedBytes += r : s._bufferedAmount += r;
  }
  if (t) {
    const r = new Error(
      `WebSocket is not open: readyState ${s.readyState} (${O[s.readyState]})`
    );
    process.nextTick(t, r);
  }
}
function ks(s, e) {
  const t = this[y];
  t._closeFrameReceived = !0, t._closeMessage = e, t._closeCode = s, t._socket[y] !== void 0 && (t._socket.removeListener("data", fe), process.nextTick(ct, t._socket), s === 1005 ? t.close() : t.close(s, e));
}
function ws() {
  const s = this[y];
  s.isPaused || s._socket.resume();
}
function Os(s) {
  const e = this[y];
  e._socket[y] !== void 0 && (e._socket.removeListener("data", fe), process.nextTick(ct, e._socket), e.close(s[_s])), e.emit("error", s);
}
function Ye() {
  this[y].emitClose();
}
function Cs(s, e) {
  this[y].emit("message", s, e);
}
function Ts(s) {
  const e = this[y];
  e.pong(s, !e._isServer, at), e.emit("ping", s);
}
function Ls(s) {
  this[y].emit("pong", s);
}
function ct(s) {
  s.resume();
}
function ut() {
  const s = this[y];
  this.removeListener("close", ut), this.removeListener("data", fe), this.removeListener("end", dt), s._readyState = m.CLOSING;
  let e;
  !this._readableState.endEmitted && !s._closeFrameReceived && !s._receiver._writableState.errorEmitted && (e = s._socket.read()) !== null && s._receiver.write(e), s._receiver.end(), this[y] = void 0, clearTimeout(s._closeTimer), s._receiver._writableState.finished || s._receiver._writableState.errorEmitted ? s.emitClose() : (s._receiver.on("error", Ye), s._receiver.on("finish", Ye));
}
function fe(s) {
  this[y]._receiver.write(s) || this.pause();
}
function dt() {
  const s = this[y];
  s._readyState = m.CLOSING, s._receiver.end(), this.end();
}
function _t() {
  const s = this[y];
  this.removeListener("error", _t), this.on("error", at), s && (s._readyState = m.CLOSING, this.destroy());
}
const Xs = /* @__PURE__ */ z(ft), { tokenChars: Ns } = ae;
function Ps(s) {
  const e = /* @__PURE__ */ new Set();
  let t = -1, r = -1, i = 0;
  for (i; i < s.length; i++) {
    const o = s.charCodeAt(i);
    if (r === -1 && Ns[o] === 1)
      t === -1 && (t = i);
    else if (i !== 0 && (o === 32 || o === 9))
      r === -1 && t !== -1 && (r = i);
    else if (o === 44) {
      if (t === -1)
        throw new SyntaxError(`Unexpected character at index ${i}`);
      r === -1 && (r = i);
      const l = s.slice(t, r);
      if (e.has(l))
        throw new SyntaxError(`The "${l}" subprotocol is duplicated`);
      e.add(l), t = r = -1;
    } else
      throw new SyntaxError(`Unexpected character at index ${i}`);
  }
  if (t === -1 || r !== -1)
    throw new SyntaxError("Unexpected end of input");
  const n = s.slice(t, i);
  if (e.has(n))
    throw new SyntaxError(`The "${n}" subprotocol is duplicated`);
  return e.add(n), e;
}
var Rs = { parse: Ps };
const Us = S, ie = S, { createHash: Bs } = S, qe = nt, N = oe, $s = Rs, Ms = ft, { GUID: Is, kWebSocket: Ds } = U, Ws = /^[+/0-9A-Za-z]{22}==$/, Ke = 0, Xe = 1, pt = 2;
class As extends Us {
  /**
   * Create a `WebSocketServer` instance.
   *
   * @param {Object} options Configuration options
   * @param {Number} [options.backlog=511] The maximum length of the queue of
   *     pending connections
   * @param {Boolean} [options.clientTracking=true] Specifies whether or not to
   *     track clients
   * @param {Function} [options.handleProtocols] A hook to handle protocols
   * @param {String} [options.host] The hostname where to bind the server
   * @param {Number} [options.maxPayload=104857600] The maximum allowed message
   *     size
   * @param {Boolean} [options.noServer=false] Enable no server mode
   * @param {String} [options.path] Accept only connections matching this path
   * @param {(Boolean|Object)} [options.perMessageDeflate=false] Enable/disable
   *     permessage-deflate
   * @param {Number} [options.port] The port where to bind the server
   * @param {(http.Server|https.Server)} [options.server] A pre-created HTTP/S
   *     server to use
   * @param {Boolean} [options.skipUTF8Validation=false] Specifies whether or
   *     not to skip UTF-8 validation for text and close messages
   * @param {Function} [options.verifyClient] A hook to reject connections
   * @param {Function} [options.WebSocket=WebSocket] Specifies the `WebSocket`
   *     class to use. It must be the `WebSocket` class or class that extends it
   * @param {Function} [callback] A listener for the `listening` event
   */
  constructor(e, t) {
    if (super(), e = {
      maxPayload: 100 * 1024 * 1024,
      skipUTF8Validation: !1,
      perMessageDeflate: !1,
      handleProtocols: null,
      clientTracking: !0,
      verifyClient: null,
      noServer: !1,
      backlog: null,
      // use default (511 as implemented in net.js)
      server: null,
      host: null,
      path: null,
      port: null,
      WebSocket: Ms,
      ...e
    }, e.port == null && !e.server && !e.noServer || e.port != null && (e.server || e.noServer) || e.server && e.noServer)
      throw new TypeError(
        'One and only one of the "port", "server", or "noServer" options must be specified'
      );
    if (e.port != null ? (this._server = ie.createServer((r, i) => {
      const n = ie.STATUS_CODES[426];
      i.writeHead(426, {
        "Content-Length": n.length,
        "Content-Type": "text/plain"
      }), i.end(n);
    }), this._server.listen(
      e.port,
      e.host,
      e.backlog,
      t
    )) : e.server && (this._server = e.server), this._server) {
      const r = this.emit.bind(this, "connection");
      this._removeListeners = js(this._server, {
        listening: this.emit.bind(this, "listening"),
        error: this.emit.bind(this, "error"),
        upgrade: (i, n, o) => {
          this.handleUpgrade(i, n, o, r);
        }
      });
    }
    e.perMessageDeflate === !0 && (e.perMessageDeflate = {}), e.clientTracking && (this.clients = /* @__PURE__ */ new Set(), this._shouldEmitClose = !1), this.options = e, this._state = Ke;
  }
  /**
   * Returns the bound address, the address family name, and port of the server
   * as reported by the operating system if listening on an IP socket.
   * If the server is listening on a pipe or UNIX domain socket, the name is
   * returned as a string.
   *
   * @return {(Object|String|null)} The address of the server
   * @public
   */
  address() {
    if (this.options.noServer)
      throw new Error('The server is operating in "noServer" mode');
    return this._server ? this._server.address() : null;
  }
  /**
   * Stop the server from accepting new connections and emit the `'close'` event
   * when all existing connections are closed.
   *
   * @param {Function} [cb] A one-time listener for the `'close'` event
   * @public
   */
  close(e) {
    if (this._state === pt) {
      e && this.once("close", () => {
        e(new Error("The server is not running"));
      }), process.nextTick(G, this);
      return;
    }
    if (e && this.once("close", e), this._state !== Xe)
      if (this._state = Xe, this.options.noServer || this.options.server)
        this._server && (this._removeListeners(), this._removeListeners = this._server = null), this.clients ? this.clients.size ? this._shouldEmitClose = !0 : process.nextTick(G, this) : process.nextTick(G, this);
      else {
        const t = this._server;
        this._removeListeners(), this._removeListeners = this._server = null, t.close(() => {
          G(this);
        });
      }
  }
  /**
   * See if a given request should be handled by this server instance.
   *
   * @param {http.IncomingMessage} req Request object to inspect
   * @return {Boolean} `true` if the request is valid, else `false`
   * @public
   */
  shouldHandle(e) {
    if (this.options.path) {
      const t = e.url.indexOf("?");
      if ((t !== -1 ? e.url.slice(0, t) : e.url) !== this.options.path)
        return !1;
    }
    return !0;
  }
  /**
   * Handle a HTTP Upgrade request.
   *
   * @param {http.IncomingMessage} req The request object
   * @param {(net.Socket|tls.Socket)} socket The network socket between the
   *     server and client
   * @param {Buffer} head The first packet of the upgraded stream
   * @param {Function} cb Callback
   * @public
   */
  handleUpgrade(e, t, r, i) {
    t.on("error", Ze);
    const n = e.headers["sec-websocket-key"], o = +e.headers["sec-websocket-version"];
    if (e.method !== "GET") {
      R(this, e, t, 405, "Invalid HTTP method");
      return;
    }
    if (e.headers.upgrade.toLowerCase() !== "websocket") {
      R(this, e, t, 400, "Invalid Upgrade header");
      return;
    }
    if (!n || !Ws.test(n)) {
      R(this, e, t, 400, "Missing or invalid Sec-WebSocket-Key header");
      return;
    }
    if (o !== 8 && o !== 13) {
      R(this, e, t, 400, "Missing or invalid Sec-WebSocket-Version header");
      return;
    }
    if (!this.shouldHandle(e)) {
      H(t, 400);
      return;
    }
    const l = e.headers["sec-websocket-protocol"];
    let f = /* @__PURE__ */ new Set();
    if (l !== void 0)
      try {
        f = $s.parse(l);
      } catch {
        R(this, e, t, 400, "Invalid Sec-WebSocket-Protocol header");
        return;
      }
    const a = e.headers["sec-websocket-extensions"], c = {};
    if (this.options.perMessageDeflate && a !== void 0) {
      const h = new N(
        this.options.perMessageDeflate,
        !0,
        this.options.maxPayload
      );
      try {
        const p = qe.parse(a);
        p[N.extensionName] && (h.accept(p[N.extensionName]), c[N.extensionName] = h);
      } catch {
        R(this, e, t, 400, "Invalid or unacceptable Sec-WebSocket-Extensions header");
        return;
      }
    }
    if (this.options.verifyClient) {
      const h = {
        origin: e.headers[`${o === 8 ? "sec-websocket-origin" : "origin"}`],
        secure: !!(e.socket.authorized || e.socket.encrypted),
        req: e
      };
      if (this.options.verifyClient.length === 2) {
        this.options.verifyClient(h, (p, v, _, u) => {
          if (!p)
            return H(t, v || 401, _, u);
          this.completeUpgrade(
            c,
            n,
            f,
            e,
            t,
            r,
            i
          );
        });
        return;
      }
      if (!this.options.verifyClient(h))
        return H(t, 401);
    }
    this.completeUpgrade(c, n, f, e, t, r, i);
  }
  /**
   * Upgrade the connection to WebSocket.
   *
   * @param {Object} extensions The accepted extensions
   * @param {String} key The value of the `Sec-WebSocket-Key` header
   * @param {Set} protocols The subprotocols
   * @param {http.IncomingMessage} req The request object
   * @param {(net.Socket|tls.Socket)} socket The network socket between the
   *     server and client
   * @param {Buffer} head The first packet of the upgraded stream
   * @param {Function} cb Callback
   * @throws {Error} If called more than once with the same socket
   * @private
   */
  completeUpgrade(e, t, r, i, n, o, l) {
    if (!n.readable || !n.writable)
      return n.destroy();
    if (n[Ds])
      throw new Error(
        "server.handleUpgrade() was called more than once with the same socket, possibly due to a misconfiguration"
      );
    if (this._state > Ke)
      return H(n, 503);
    const a = [
      "HTTP/1.1 101 Switching Protocols",
      "Upgrade: websocket",
      "Connection: Upgrade",
      `Sec-WebSocket-Accept: ${Bs("sha1").update(t + Is).digest("base64")}`
    ], c = new this.options.WebSocket(null);
    if (r.size) {
      const h = this.options.handleProtocols ? this.options.handleProtocols(r, i) : r.values().next().value;
      h && (a.push(`Sec-WebSocket-Protocol: ${h}`), c._protocol = h);
    }
    if (e[N.extensionName]) {
      const h = e[N.extensionName].params, p = qe.format({
        [N.extensionName]: [h]
      });
      a.push(`Sec-WebSocket-Extensions: ${p}`), c._extensions = e;
    }
    this.emit("headers", a, i), n.write(a.concat(`\r
`).join(`\r
`)), n.removeListener("error", Ze), c.setSocket(n, o, {
      maxPayload: this.options.maxPayload,
      skipUTF8Validation: this.options.skipUTF8Validation
    }), this.clients && (this.clients.add(c), c.on("close", () => {
      this.clients.delete(c), this._shouldEmitClose && !this.clients.size && process.nextTick(G, this);
    })), l(c, i);
  }
}
var Fs = As;
function js(s, e) {
  for (const t of Object.keys(e))
    s.on(t, e[t]);
  return function() {
    for (const r of Object.keys(e))
      s.removeListener(r, e[r]);
  };
}
function G(s) {
  s._state = pt, s.emit("close");
}
function Ze() {
  this.destroy();
}
function H(s, e, t, r) {
  t = t || ie.STATUS_CODES[e], r = {
    Connection: "close",
    "Content-Type": "text/html",
    "Content-Length": Buffer.byteLength(t),
    ...r
  }, s.once("finish", s.destroy), s.end(
    `HTTP/1.1 ${e} ${ie.STATUS_CODES[e]}\r
` + Object.keys(r).map((i) => `${i}: ${r[i]}`).join(`\r
`) + `\r
\r
` + t
  );
}
function R(s, e, t, r, i) {
  if (s.listenerCount("wsClientError")) {
    const n = new Error(i);
    Error.captureStackTrace(n, R), s.emit("wsClientError", n, t, e);
  } else
    H(t, r, i);
}
const Zs = /* @__PURE__ */ z(Fs);
export {
  qs as Receiver,
  Ks as Sender,
  Xs as WebSocket,
  Zs as WebSocketServer,
  Vs as createWebSocketStream,
  Xs as default
};
