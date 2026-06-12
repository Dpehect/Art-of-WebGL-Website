(function () {
  var startedAt = Date.now()
  var minimumTime = 1200
  var closingTime = 560
  var isClosing = false

  function createPreloader () {
    if (!document.body || document.querySelector('.softbridge-preloader')) {
      return
    }

    var preloader = document.createElement('div')
    preloader.className = 'softbridge-preloader'
    preloader.setAttribute('role', 'status')
    preloader.setAttribute('aria-live', 'polite')

    var panel = document.createElement('div')
    panel.className = 'softbridge-preloader__panel'

    var brand = document.createElement('p')
    brand.className = 'softbridge-preloader__brand'
    brand.textContent = 'SoftBridge Solutions'

    var byline = document.createElement('p')
    byline.className = 'softbridge-preloader__byline'
    byline.textContent = 'Yunus Emre G\u00fcrlek'

    var line = document.createElement('span')
    line.className = 'softbridge-preloader__line'
    line.setAttribute('aria-hidden', 'true')

    panel.appendChild(brand)
    panel.appendChild(byline)
    panel.appendChild(line)
    preloader.appendChild(panel)
    document.body.appendChild(preloader)
  }

  function closePreloader () {
    var preloader = document.querySelector('.softbridge-preloader')
    if (!preloader || isClosing) {
      return
    }
    isClosing = true

    var remainingTime = Math.max(0, minimumTime - (Date.now() - startedAt))
    window.setTimeout(function () {
      preloader.className += ' is-leaving'
      window.setTimeout(function () {
        if (preloader.parentNode) {
          preloader.parentNode.removeChild(preloader)
        }
      }, closingTime)
    }, remainingTime)
  }

  if (document.body) {
    createPreloader()
  } else {
    document.addEventListener('DOMContentLoaded', createPreloader)
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', closePreloader)
  } else {
    closePreloader()
  }

  window.setTimeout(closePreloader, 2600)
})()
