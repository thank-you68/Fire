/* model-loader.js - loads TensorFlow.js and the model files; reports when the model is ready.
   It also holds the shared settings. LOAD THIS FILE FIRST. */
(function () {
  var FSR = (window.FSR = window.FSR || {});
  FSR.config = {
    TFJS_URL: 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js',
    MODEL_URL: new URL('../../model/model.json', document.currentScript.src).href,
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
      s.src = src; s.onload = resolve; s.onerror = function () { reject(new Error('tfjs script failed')); };
      document.head.appendChild(s);
    });
  }

  FSR.modelLoader = {
    ready: false,
    model: null,
    load: async function () {
      var C = FSR.config;
      try {
        await loadScript(C.TFJS_URL);
        var m = await tf.loadLayersModel(C.MODEL_URL);
        var inShape = m.inputs[0].shape, outShape = m.outputs[0].shape;
        if (inShape[1] !== C.INPUT_SIZE || inShape[2] !== C.INPUT_SIZE || inShape[3] !== 3) throw new Error('input shape mismatch');
        if (outShape[outShape.length - 1] !== C.CLASS_ORDER.length) throw new Error('output size mismatch');
        tf.tidy(function () { m.predict(tf.zeros([1, C.INPUT_SIZE, C.INPUT_SIZE, 3])); }); // warm-up
        this.model = m; this.ready = true;
        console.log('model loaded');
        return m;
      } catch (e) {
        console.error(e);
        this.ready = false; this.model = null;
        throw FSR.userError('The model could not be loaded.');
      }
    }
  };
})();
