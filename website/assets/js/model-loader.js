/* model-loader.js - loads TensorFlow.js and the model files; reports when the model is ready.
   It also holds the shared settings. LOAD THIS FILE FIRST. */
(function () {
  var FSR = (window.FSR = window.FSR || {});
  FSR.config = {
    TFJS_URL: 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js',
    MODEL_URL: new URL('../../model/model.json', document.currentScript.src).href,
    // The model is kept in the browser (IndexedDB) after the first load, so moving between pages does not
    // download and rebuild it again. CHANGE MODEL_VERSION whenever the files in /model are replaced.
    MODEL_VERSION: '1',
    MODEL_CACHE_URL: 'indexeddb://fsr-model',
    MODEL_CACHE_FLAG: 'fsr-model-cache',
    INPUT_SIZE: 224,                            // MUST equal IMAGE_SIZE in notebook 02
    CLASS_ORDER: ['fire', 'smoke', 'neither'],  // MUST equal CLASS_ORDER in notebook 02
    THRESHOLD: 0.6,                             // REPLACE with the value chosen on VALIDATION data (notebook 02)
    ALLOWED_TYPES: ['image/jpeg', 'image/png'],
    MAX_FILE_BYTES: 5 * 1024 * 1024,
    LABELS: { fire: 'Fire', smoke: 'Smoke', neither: 'Neither', uncertain: 'Uncertain' },
    MESSAGES: {
      fire: 'Fire-like signs may have been recognized. If there may be a real danger, follow your local safety steps.',
      smoke: 'Smoke-like signs may have been recognized. This is information only.',
      neither: 'The model did not classify this picture as fire or smoke.',
      uncertain: 'The result is not clear. Try another picture.'
    }
  };
  FSR.userError = function (msg) { var e = new Error(msg); e.user = true; return e; };

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      if (window.tf) { resolve(); return; }
      var s = document.createElement('script');
      s.src = src; s.onload = resolve;
      s.onerror = function () { s.remove(); reject(new Error('tfjs script failed')); };
      document.head.appendChild(s);
    });
  }
  function checkShape(m) {
    var C = FSR.config, inShape = m.inputs[0].shape, outShape = m.outputs[0].shape;
    if (inShape[1] !== C.INPUT_SIZE || inShape[2] !== C.INPUT_SIZE || inShape[3] !== 3) throw new Error('input shape mismatch');
    if (outShape[outShape.length - 1] !== C.CLASS_ORDER.length) throw new Error('output size mismatch');
  }
  function flag(v) {
    try { if (v === undefined) return localStorage.getItem(FSR.config.MODEL_CACHE_FLAG); if (v === null) localStorage.removeItem(FSR.config.MODEL_CACHE_FLAG); else localStorage.setItem(FSR.config.MODEL_CACHE_FLAG, v); }
    catch (e) { return null; }
  }

  // One shared model for the whole page: load() is safe to call many times (it never starts a second load).
  FSR.modelLoader = {
    ready: false,
    model: null,
    _pending: null,
    // true when an earlier visit already stored a valid model in this browser (known before TensorFlow.js loads)
    cached: function () { return flag() === FSR.config.MODEL_VERSION; },
    load: function (onStatus) {
      var self = this;
      if (self.ready) return Promise.resolve(self.model);
      if (self._pending) return self._pending;
      self._pending = (async function () {
        var C = FSR.config, m = null;
        try {
          await loadScript(C.TFJS_URL);
          if (self.cached()) {                       // fast path: restore from this browser, no network
            try { m = await tf.loadLayersModel(C.MODEL_CACHE_URL); checkShape(m); }
            catch (e) { console.warn('Saved model not usable, loading it again.', e); m = null; flag(null); try { await tf.io.removeModel(C.MODEL_CACHE_URL); } catch (x) { /* nothing stored */ } }
          }
          if (!m) {                                  // first visit, new model version, or saved copy was bad
            if (onStatus) onStatus('Loading model...');
            m = await tf.loadLayersModel(C.MODEL_URL);
            checkShape(m);
            try { await m.save(C.MODEL_CACHE_URL); flag(C.MODEL_VERSION); }   // best effort: private mode or no space just skips it
            catch (e) { console.warn('Could not save the model for next time.', e); flag(null); }
          }
          tf.tidy(function () { m.predict(tf.zeros([1, C.INPUT_SIZE, C.INPUT_SIZE, 3])); }); // warm-up
          self.model = m; self.ready = true;
          console.log('model loaded');
          return m;
        } catch (e) {
          console.error(e);
          self.ready = false; self.model = null;
          throw FSR.userError('The model could not be loaded.');
        } finally {
          self._pending = null;                      // a failed load can be retried
        }
      })();
      return self._pending;
    }
  };
})();
