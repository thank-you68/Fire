/* image-upload.js - checks file type and size, loads the chosen file as a picture, rejects broken files. */
(function () {
  var FSR = (window.FSR = window.FSR || {});
  FSR.imageUpload = {
    decode: function (url) {
      return new Promise(function (resolve, reject) {
        var img = new Image();
        img.onload = function () { resolve(img); };
        img.onerror = reject;
        img.src = url;
      });
    },
    load: async function (file) {
      var C = FSR.config;
      if (!file) throw FSR.userError('No file was chosen.');
      if (C.ALLOWED_TYPES.indexOf(file.type) === -1) throw FSR.userError('This file type is not supported. Please choose a JPG or PNG picture.');
      if (file.size > C.MAX_FILE_BYTES) throw FSR.userError('This file is too big. Please choose a picture under 5 megabytes.');
      var url = URL.createObjectURL(file); // stays in the browser; nothing is sent to a server
      try {
        var img = await this.decode(url);
        img._url = url;
        return img;
      } catch (e) {
        URL.revokeObjectURL(url);
        throw FSR.userError('This picture could not be read. Try another one.');
      }
    }
  };
})();
