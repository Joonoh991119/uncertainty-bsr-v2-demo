// Uncertainty_BSR_v2 practice-only demo: a stand-in for jatos.js that keeps everything in this browser tab.
// No request leaves the page: every append, upload and end resolves at once and is dropped. The calls the
// page makes are those of tests/e2e/test_online.py MOCK_JATOS (jatos.js 3.11.3 signatures); no batch session,
// so the context comes from the address (?context=S or L) or is drawn here at random.
(function () {
  var params = new URLSearchParams(window.location.search);
  function hex(n) {
    var a = new Uint8Array(n);
    window.crypto.getRandomValues(a);
    return Array.prototype.map.call(a, function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
  }
  var context = params.get('context') === 'S' || params.get('context') === 'L' ? params.get('context') : (Math.random() < 0.5 ? 'S' : 'L');
  // a new demo visitor on every opening: a reload starts the demo again from the start
  var query = { PROLIFIC_PID: 'demo' + hex(10), STUDY_ID: 'demo', SESSION_ID: 'demo' + hex(6), study_key: 'pilot_bsr_v2_s1', wave: '1', context: context };
  var ended = false;
  var done = function () { return Promise.resolve('ok'); };
  window.jatos = {
    version: 'demo-stub',
    urlQueryParameters: query,
    studyResultId: 1,
    workerId: 1,
    componentResultId: 1,
    studySessionData: {},
    onLoad: function (cb) { setTimeout(cb, 20); },
    setStudySessionData: function (d) { window.jatos.studySessionData = d; return done(); },
    appendResultData: done,
    uploadResultFile: done,
    endStudyWithoutRedirect: function () {
      if (ended) return Promise.reject('Can end/abort study only once.');
      ended = true;
      return done();
    },
    endStudyAndRedirect: function () { throw new Error('endStudyAndRedirect must not be used'); },
    submitResultData: function () { throw new Error('submitResultData would overwrite the appended data'); },
  };

  // The demo ends where the first main block would start: the page marks the block of every screen on
  // <body data-block>, and the practice block is block 0. Only the screens that open a block count (its intro,
  // slides before it, its trials: data-screen ''): the stop and end screens carry the session's last block.
  var OPENING = ['block_intro', 'slide', 'walkthrough', 'estimation_walkthrough', 'stack_walkthrough', 'check', ''];
  var finished = false;
  function endDemo() {
    if (finished) return;
    finished = true;
    // the page would ask the browser to confirm leaving a run in progress: not here
    window.addEventListener('beforeunload', function (e) { e.stopImmediatePropagation(); }, true);
    try { if (document.pointerLockElement) document.exitPointerLock(); } catch (e) {}
    try { if (document.fullscreenElement) document.exitFullscreen(); } catch (e) {}
    window.location.replace('demo_end.html?ending=practice_done&context=' + context + '&at=' + encodeURIComponent(document.body.dataset.screen || 'trials'));
  }
  function watch() {
    var b = document.body;
    if (!b) return void setTimeout(watch, 50);
    var check = function () {
      if (b.dataset.block !== '' && Number(b.dataset.block) >= 1 && OPENING.indexOf(b.dataset.screen || '') >= 0) endDemo();
    };
    new MutationObserver(check).observe(b, { attributes: true, attributeFilter: ['data-block', 'data-screen'] });
    check();
  }
  watch();
})();
