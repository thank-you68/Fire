/* prediction.js - turns the picture into model input, runs the model, maps scores to class names,
   applies the threshold, builds the response object. */
(function () {
  var FSR = (window.FSR = window.FSR || {});
  FSR.prediction = {
    // scores: array in CLASS_ORDER. Returns the response object (task 10.3.1).
    build: function (scores) {
      var C = FSR.config, classScores = {}, best = 0;
      C.CLASS_ORDER.forEach(function (n, i) { classScores[n] = scores[i]; });
      scores.forEach(function (s, i) { if (s > scores[best]) best = i; });
      var top = scores[best], topClass = C.CLASS_ORDER[best], cls, status;
      if (top < C.THRESHOLD) { cls = 'uncertain'; status = 'uncertain'; }
      else { cls = topClass; status = topClass === 'neither' ? 'normal' : 'warning'; }
      return { predictedClass: cls, topClass: topClass, classScores: classScores, confidence: top, resultStatus: status, message: C.MESSAGES[cls] };
    },
    run: async function (img) {
      if (!FSR.modelLoader.ready) throw FSR.userError('The model is not ready yet.');
      var input = null, output = null;
      try {
        input = FSR.imageProcessing.toTensor(img);
        output = FSR.modelLoader.model.predict(input);
        var scores = Array.from(await output.data());
        if (scores.length !== FSR.config.CLASS_ORDER.length || scores.some(function (s) { return !isFinite(s); })) throw new Error('bad output');
        return this.build(scores);
      } catch (e) {
        if (e && e.user) throw e;
        console.error(e);
        throw FSR.userError('The prediction did not finish. Try again.');
      } finally {
        if (input) input.dispose();
        if (output) output.dispose();
      }
    }
  };
})();
