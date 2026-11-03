/* image-processing.js - checks a picture, resizes it, prepares the numbers EXACTLY like training. */
(function () {
  var FSR = (window.FSR = window.FSR || {});
  FSR.imageProcessing = {
    validate: function (img) {
      if (!img || !img.complete || !img.naturalWidth) throw FSR.userError('The picture could not be read. Try another one.');
    },
    // Returns a tensor [1, S, S, 3]. The caller MUST dispose it.
    // Training used: tf.image.resize (bilinear) then mobilenet_v2.preprocess_input = x / 127.5 - 1, RGB order.
    toTensor: function (img) {
      this.validate(img);
      var S = FSR.config.INPUT_SIZE;
      return tf.tidy(function () {
        var px = tf.browser.fromPixels(img, 3);                        // RGB, 0..255
        var resized = tf.image.resizeBilinear(px, [S, S], false, true); // halfPixelCenters=true = TF2 resize
        return resized.toFloat().div(127.5).sub(1).expandDims(0);
      });
    }
  };
})();
