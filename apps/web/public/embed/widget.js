/*!
 * 뜬이유 Embed Widget v0 (P0w)
 * Vanilla JS, no dependencies. Idempotent.
 *
 * Usage on installer's site:
 *   <script async
 *     src="https://tteuniyu.com/embed/widget.js"
 *     data-tteuniyu-widget
 *     data-size="medium"></script>
 *
 * - data-size: small | medium | large (default medium)
 * - data-host: optional override for analytics (auto-detect from location.host)
 *
 * Telemetry: fire-and-forget POST to /api/v1/embed/install on first mount
 * per (host, size). No cookies. No tracking. No PII.
 */
(function () {
  'use strict'
  if (typeof window === 'undefined' || typeof document === 'undefined') return

  // Origin discovery: find the script tag that loaded *this* file so we can
  // make iframe src + install URL portable across dev (localhost:3030) and
  // prod (tteuniyu.com).
  function originFromCurrentScript() {
    var current = document.currentScript
    if (current && current.src) {
      try {
        return new URL(current.src).origin
      } catch (_) {}
    }
    var scripts = document.getElementsByTagName('script')
    for (var i = scripts.length - 1; i >= 0; i--) {
      var src = scripts[i].src || ''
      if (src.indexOf('/embed/widget.js') !== -1) {
        try {
          return new URL(src).origin
        } catch (_) {}
      }
    }
    return ''
  }

  var SIZES = {
    small: { w: 300, h: 180 },
    medium: { w: 400, h: 320 },
    large: { w: 500, h: 480 },
  }

  var ORIGIN = originFromCurrentScript()
  if (!ORIGIN) {
    // Defensive — without origin we cannot point the iframe anywhere safe.
    if (window.console) console.warn('[tteuniyu/embed] could not resolve origin; aborting')
    return
  }

  function pickSize(raw) {
    var s = (raw || '').toLowerCase()
    return SIZES[s] ? s : 'medium'
  }

  function makeIframe(size, host) {
    var dim = SIZES[size]
    var url = ORIGIN + '/embed/iframe?size=' + encodeURIComponent(size) + '&host=' + encodeURIComponent(host)
    var iframe = document.createElement('iframe')
    iframe.src = url
    iframe.width = String(dim.w)
    iframe.height = String(dim.h)
    iframe.title = '뜬이유 실시간 이슈 위젯'
    iframe.loading = 'lazy'
    iframe.referrerPolicy = 'origin'
    iframe.setAttribute('frameborder', '0')
    iframe.setAttribute('scrolling', 'no')
    iframe.style.cssText =
      'border:0;border-radius:12px;overflow:hidden;display:block;max-width:100%;'
    return iframe
  }

  function reportInstall(host, size) {
    var url = ORIGIN + '/api/v1/embed/install'
    var body = JSON.stringify({
      host: host,
      size: size,
      user_agent: (navigator.userAgent || '').slice(0, 255),
    })
    // Prefer sendBeacon for fire-and-forget; fall back to fetch.
    if (navigator.sendBeacon) {
      try {
        var blob = new Blob([body], { type: 'application/json' })
        if (navigator.sendBeacon(url, blob)) return
      } catch (_) {}
    }
    if (window.fetch) {
      fetch(url, {
        method: 'POST',
        body: body,
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
        mode: 'cors',
      }).catch(function () {})
    }
  }

  function mountAll() {
    var nodes = document.querySelectorAll('script[data-tteuniyu-widget]')
    var host = (location && location.host) || 'unknown'
    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i]
      if (node.getAttribute('data-tteuniyu-mounted') === '1') continue
      node.setAttribute('data-tteuniyu-mounted', '1')

      var size = pickSize(node.getAttribute('data-size'))
      var hostOverride = node.getAttribute('data-host') || host
      var iframe = makeIframe(size, hostOverride)

      // Insert iframe immediately after the script tag.
      if (node.parentNode) {
        node.parentNode.insertBefore(iframe, node.nextSibling)
      }
      reportInstall(hostOverride, size)
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountAll, { once: true })
  } else {
    mountAll()
  }
})()
