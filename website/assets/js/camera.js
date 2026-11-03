/* camera.js - asks for permission, starts/stops the camera, takes ONE still picture, reports camera errors. */
(function () {
  var FSR = (window.FSR = window.FSR || {});
  FSR.camera = {
    stream: null,
    start: async function (videoEl, facing) {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw FSR.userError('The camera is not available here. It needs a secure (https) address. You can upload a picture instead.');
      }
      try {
        this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: facing || 'environment' } }, audio: false });
      } catch (e) {
        if (e.name === 'NotAllowedError' || e.name === 'SecurityError') throw FSR.userError('Camera permission was denied. You can upload a picture instead.');
        if (e.name === 'NotFoundError' || e.name === 'OverconstrainedError' || e.name === 'DevicesNotFoundError') throw FSR.userError('No camera found.');
        throw FSR.userError('The camera could not be started. You can upload a picture instead.');
      }
      videoEl.srcObject = this.stream;
      await videoEl.play();
    },
    capture: async function (videoEl) {
      if (!this.stream || !videoEl.videoWidth) throw FSR.userError('The camera is not ready yet. Wait a moment and try again.');
      var c = document.createElement('canvas');
      c.width = videoEl.videoWidth; c.height = videoEl.videoHeight;
      c.getContext('2d').drawImage(videoEl, 0, 0);
      var blob = await new Promise(function (r) { c.toBlob(r, 'image/jpeg', 0.92); });
      if (!blob) throw FSR.userError('The photo could not be taken. Try again.');
      var url = URL.createObjectURL(blob);
      try {
        var img = await FSR.imageUpload.decode(url); // same kind of picture as an upload
        img._url = url;
        this.stop(videoEl);
        return img;
      } catch (e) {
        URL.revokeObjectURL(url);
        throw FSR.userError('The photo could not be read. Try again.');
      }
    },
    stop: function (videoEl) {
      if (this.stream) { this.stream.getTracks().forEach(function (t) { t.stop(); }); this.stream = null; }
      if (videoEl) videoEl.srcObject = null;
    }
  };
})();
