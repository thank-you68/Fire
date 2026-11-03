/* app.js - the conductor: starts the app, connects the buttons, remembers the state, shows errors.
   It does not do the work itself. LOAD THIS FILE LAST. */
(function () {
  var FSR = window.FSR;
  var S = { state: 'idle', img: null };
  function $(id) { return document.getElementById(id); }
  var video = $('camera-view');
  var facing = 'environment';

  function sync() {
    var busy = S.state === 'loading', cam = S.state === 'camera';
    $('btn-start-camera').disabled = busy || cam;
    $('btn-take-photo').disabled = !cam;
    $('btn-upload').disabled = busy;
    $('btn-analyze').disabled = !(FSR.modelLoader.ready && S.img && !busy && !cam);
    $('btn-stop-camera').disabled = !cam;
    $('btn-switch-camera').disabled = !cam;
    $('btn-remove').disabled = busy || cam || !S.img;
  }
  function setState(s) { S.state = s; document.body.setAttribute('data-state', s); sync(); }
  function showVideo(on) { video.hidden = !on; $('camera-text').hidden = on; }
  function restState() { setState(S.img ? 'ready' : 'idle'); }
  function fail(e, clearResult) {
    console.error(e);
    if (clearResult) FSR.results.clear();
    FSR.results.showError(e && e.user ? e.message : 'Something went wrong. Please try again.');
  }
  function setPicture(img) {
    if (S.img && S.img._url) URL.revokeObjectURL(S.img._url);
    S.img = img;
    var p = $('preview-img'); p.src = img.src; p.hidden = false; $('preview-text').hidden = true;
    FSR.results.clear(); FSR.results.hideError(); setState('ready');
  }
  function stopCamera() { FSR.camera.stop(video); showVideo(false); }

  $('btn-start-camera').addEventListener('click', async function () {
    FSR.results.hideError();
    showVideo(true);
    try { await FSR.camera.start(video, facing); setState('camera'); }
    catch (e) { stopCamera(); fail(e); restState(); }
  });
  $('btn-take-photo').addEventListener('click', async function () {
    try { var img = await FSR.camera.capture(video); showVideo(false); setPicture(img); }
    catch (e) { stopCamera(); fail(e); restState(); }
  });
  $('btn-stop-camera').addEventListener('click', function () { stopCamera(); restState(); });
  $('btn-switch-camera').addEventListener('click', async function () {
    facing = facing === 'environment' ? 'user' : 'environment';
    FSR.camera.stop(video);
    try { await FSR.camera.start(video, facing); } catch (e) { stopCamera(); fail(e); restState(); }
  });
  $('btn-remove').addEventListener('click', function () {
    if (S.img && S.img._url) URL.revokeObjectURL(S.img._url);
    S.img = null;
    var p = $('preview-img'); p.hidden = true; p.removeAttribute('src'); $('preview-text').hidden = false;
    FSR.results.clear(); FSR.results.hideError(); setState('idle');
  });
  $('btn-upload').addEventListener('click', function () { $('file-input').click(); });
  $('file-input').addEventListener('change', async function (ev) {
    var input = ev.target, file = input.files && input.files[0];
    if (!file) return;
    if (S.state === 'camera') { stopCamera(); restState(); }
    FSR.results.hideError();
    try { setPicture(await FSR.imageUpload.load(file)); }
    catch (e) { fail(e); }
    finally { input.value = ''; }
  });
  $('btn-analyze').addEventListener('click', async function () {
    $('btn-analyze').textContent = 'Analyzing...'; FSR.results.hideError(); FSR.results.clear(); setState('loading'); FSR.results.showLoading(true);
    try { var res = await FSR.prediction.run(S.img); FSR.results.showResult(res); $('result-score').textContent += '\nAnalyzed: ' + new Date().toLocaleString(); if (FSR.history) FSR.history.add(res); }
    catch (e) { fail(e, true); }
    finally { FSR.results.showLoading(false); $('btn-analyze').textContent = 'Analyze Image'; restState(); }
  });
  var stage = document.querySelector('.stage');
  ['dragenter', 'dragover'].forEach(function (t) { stage.addEventListener(t, function (e) { e.preventDefault(); stage.classList.add('drag'); }); });
  ['dragleave', 'drop'].forEach(function (t) { stage.addEventListener(t, function (e) { e.preventDefault(); stage.classList.remove('drag'); }); });
  stage.addEventListener('drop', async function (e) {
    var f = e.dataTransfer && e.dataTransfer.files[0];
    if (!f || S.state === 'loading') return;
    if (S.state === 'camera') { stopCamera(); restState(); }
    FSR.results.hideError();
    try { setPicture(await FSR.imageUpload.load(f)); } catch (err) { fail(err); }
  });
  window.addEventListener('pagehide', stopCamera);
  window.addEventListener('unhandledrejection', function (ev) { fail(ev.reason, false); });

  FSR.results.setModelStatus('Loading model...');
  setState('idle');
  FSR.modelLoader.load()
    .then(function () { FSR.results.setModelStatus('Model ready.'); sync(); })
    .catch(function (e) { FSR.results.setModelStatus(e.message + ' Analyze is switched off.'); fail(e); });
})();
