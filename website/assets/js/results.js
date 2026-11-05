/* results.js - shows the result word, score, warning, loading message and errors. Uses textContent only. */
(function () {
  var FSR = (window.FSR = window.FSR || {});
  function $(id) { return document.getElementById(id); }
  function f(n) { return Number(n).toFixed(3); }
  FSR.results = {
    setModelStatus: function (t) { var e = $('model-status'); e.textContent = t; e.setAttribute('data-tone', /ready/i.test(t) ? 'ok' : /loading/i.test(t) ? 'busy' : 'bad'); },
    showLoading: function (on) { $('loading').hidden = !on; },
    clear: function () {
      $('result-word').textContent = 'No prediction yet';
      $('result-word').className = 'result-word';
      $('result-score').textContent = '';
      $('result-banner').hidden = true;
      $('score-bars').textContent = '';
      this.hideSuccess();
    },
    showResult: function (r) {
      var C = FSR.config, label = C.LABELS[r.predictedClass], topLabel = C.LABELS[r.topClass];
      var w = $('result-word'); w.textContent = label; w.className = 'result-word is-' + r.predictedClass;
      var first = r.predictedClass === 'uncertain' ? 'Highest score: ' + topLabel + ' ' + f(r.confidence) : label + ' score: ' + f(r.confidence);
            $('result-score').textContent = first + '\nScores are not guarantees. Predictions can be wrong.';
      this.showBars(r);
      var b = $('result-banner'); b.textContent = r.message; b.className = 'banner banner-' + r.predictedClass; b.hidden = false;
    },
    showBars: function (r) {
      var C = FSR.config, box = $('score-bars'); box.textContent = '';
      box.style.setProperty('--thr', (C.THRESHOLD * 100) + '%');
      C.CLASS_ORDER.forEach(function (n) {
        var row = document.createElement('div'); row.className = 'bar' + (n === r.topClass ? ' is-top' : ''); row.setAttribute('data-class', n);
        var name = document.createElement('span'); name.className = 'bar-name'; name.textContent = C.LABELS[n];
        var track = document.createElement('span'); track.className = 'bar-track';
        var fill = document.createElement('i'); fill.style.setProperty('--w', (Math.max(0, Math.min(1, r.classScores[n])) * 100) + '%'); track.appendChild(fill);
        var val = document.createElement('span'); val.className = 'bar-val'; val.textContent = f(r.classScores[n]);
        row.appendChild(name); row.appendChild(track); row.appendChild(val); box.appendChild(row);
      });
      var note = document.createElement('p'); note.className = 'bar-note';
      note.textContent = 'The dark line is the threshold (' + C.THRESHOLD.toFixed(2) + '). If the highest score is below it, the result is Uncertain. Scores are not probabilities.';
      box.appendChild(note);
    },
    showSuccess: function (msg) { var e = $('success-box'); e.textContent = msg; e.hidden = false; },
    hideSuccess: function () { $('success-box').hidden = true; $('success-box').textContent = ''; },
    // Smoothly brings the result panel into view, only if it is not already fully visible
    // (on wide screens the panel is sticky and usually already on screen, so nothing moves).
    reveal: function () {
      var el = $('results'); if (!el || !el.scrollIntoView) return;
      var head = document.querySelector('.site-header'), nav = document.querySelector('nav');
      var top = head ? head.getBoundingClientRect().bottom : 0, bottom = window.innerHeight;
      if (nav && getComputedStyle(nav).position === 'fixed') bottom = nav.getBoundingClientRect().top;
      var r = el.getBoundingClientRect();
      if (r.top >= top && r.bottom <= bottom) return;
      var calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      el.scrollIntoView({ behavior: calm ? 'auto' : 'smooth', block: 'start' });
    },
    showError: function (msg) { var e = $('error-box'); e.textContent = msg; e.hidden = false; },
    hideError: function () { $('error-box').hidden = true; $('error-box').textContent = ''; }
  };
})();
