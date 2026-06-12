(function () {
  var startedAt = Date.now()
  var minimumTime = 3600
  var closingTime = 760
  var isClosing = false
  var animationFrame = 0
  var resizeTimer = 0
  var particles = []
  var canvas
  var context
  var stage
  var width = 0
  var height = 0
  var pixelRatio = 1
  var textLayout = null

  function clamp (value, min, max) {
    return Math.max(min, Math.min(max, value))
  }

  function easeOutCubic (value) {
    return 1 - Math.pow(1 - value, 3)
  }

  function shuffle (items) {
    for (var i = items.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1))
      var temp = items[i]
      items[i] = items[j]
      items[j] = temp
    }
    return items
  }

  function buildTextMap () {
    var maskCanvas = document.createElement('canvas')
    var maskContext = maskCanvas.getContext('2d')
    var maxParticles = Math.round(clamp((width * height) / 260, 1200, 4300))
    var sampleGap = width < 520 ? 3 : 4
    var brandLines = width < 560 ? ['SoftBridge', 'Solutions'] : ['SoftBridge Solutions']
    var brandSize = width < 560 ? clamp(width * 0.108, 34, 46) : clamp(width * 0.064, 52, 82)
    var bylineSize = width < 560 ? clamp(width * 0.044, 15, 19) : clamp(width * 0.018, 18, 24)
    var brandLineHeight = brandSize * 1.08
    var gap = bylineSize * 1.35
    var blockHeight = brandLines.length * brandLineHeight + gap + bylineSize
    var brandStartY = height / 2 - blockHeight / 2 + brandSize * 0.82
    var bylineY = brandStartY + brandLines.length * brandLineHeight + gap

    maskCanvas.width = width
    maskCanvas.height = height
    maskContext.clearRect(0, 0, width, height)
    maskContext.textAlign = 'center'
    maskContext.textBaseline = 'alphabetic'
    maskContext.fillStyle = '#fff'
    maskContext.font = '800 ' + brandSize + 'px "Segoe UI", Arial, sans-serif'
    for (var lineIndex = 0; lineIndex < brandLines.length; lineIndex++) {
      maskContext.fillText(brandLines[lineIndex], width / 2, brandStartY + lineIndex * brandLineHeight)
    }

    maskContext.font = '500 ' + bylineSize + 'px "Segoe UI", Arial, sans-serif'
    maskContext.fillText('Yunus Emre G\u00fcrlek', width / 2, bylineY)

    var imageData = maskContext.getImageData(0, 0, width, height).data
    var points = []
    for (var y = 0; y < height; y += sampleGap) {
      for (var x = 0; x < width; x += sampleGap) {
        var alpha = imageData[(y * width + x) * 4 + 3]
        if (alpha > 70) {
          points.push({ x: x, y: y, alpha: alpha / 255 })
        }
      }
    }

    shuffle(points)
    if (points.length > maxParticles) {
      points.length = maxParticles
    }

    textLayout = {
      brandLines: brandLines,
      brandSize: brandSize,
      bylineSize: bylineSize,
      brandStartY: brandStartY,
      brandLineHeight: brandLineHeight,
      bylineY: bylineY
    }

    return points
  }

  function resizeCanvas () {
    if (!canvas) {
      return
    }

    width = window.innerWidth || document.documentElement.clientWidth || 1280
    height = window.innerHeight || document.documentElement.clientHeight || 720
    pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = Math.round(width * pixelRatio)
    canvas.height = Math.round(height * pixelRatio)
    canvas.style.width = width + 'px'
    canvas.style.height = height + 'px'
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
    rebuildParticles()
  }

  function rebuildParticles () {
    var targets = buildTextMap()
    particles = targets.map(function (point, index) {
      var side = index % 4
      var startX = side === 0 ? -80 : side === 1 ? width + 80 : Math.random() * width
      var startY = side === 2 ? -80 : side === 3 ? height + 80 : Math.random() * height
      var hue = 188 + Math.random() * 36

      return {
        x: startX,
        y: startY,
        startX: startX,
        startY: startY,
        tx: point.x,
        ty: point.y,
        vx: (Math.random() - 0.5) * 1.4,
        vy: (Math.random() - 0.5) * 1.4,
        seed: Math.random() * Math.PI * 2,
        size: 0.85 + point.alpha * 1.45 + Math.random() * 0.7,
        color: 'hsla(' + hue + ', 94%, ' + (64 + Math.random() * 18) + '%, ',
        alpha: 0.46 + point.alpha * 0.54
      }
    })
  }

  function drawFinalText (progress) {
    if (!textLayout || progress < 0.68) {
      return
    }

    var alpha = Math.min(0.42, (progress - 0.68) / 0.32 * 0.42)
    context.save()
    context.textAlign = 'center'
    context.textBaseline = 'alphabetic'
    context.shadowBlur = 26
    context.shadowColor = 'rgba(109, 211, 255, 0.42)'
    context.fillStyle = 'rgba(255, 255, 255, ' + alpha + ')'
    context.font = '800 ' + textLayout.brandSize + 'px "Segoe UI", Arial, sans-serif'
    for (var i = 0; i < textLayout.brandLines.length; i++) {
      context.fillText(textLayout.brandLines[i], width / 2, textLayout.brandStartY + i * textLayout.brandLineHeight)
    }

    context.shadowBlur = 16
    context.fillStyle = 'rgba(216, 246, 255, ' + (alpha * 0.92) + ')'
    context.font = '500 ' + textLayout.bylineSize + 'px "Segoe UI", Arial, sans-serif'
    context.fillText('Yunus Emre G\u00fcrlek', width / 2, textLayout.bylineY)
    context.restore()
  }

  function drawBackground (time) {
    var sweep = (Math.sin(time * 0.0011) + 1) / 2
    var gradient = context.createRadialGradient(width * (0.35 + sweep * 0.22), height * 0.46, 0, width * 0.5, height * 0.5, Math.max(width, height) * 0.82)
    gradient.addColorStop(0, 'rgba(19, 56, 65, 0.96)')
    gradient.addColorStop(0.38, 'rgba(6, 16, 24, 0.98)')
    gradient.addColorStop(1, 'rgba(2, 5, 8, 1)')
    context.fillStyle = gradient
    context.fillRect(0, 0, width, height)

    context.save()
    context.globalAlpha = 0.16
    context.strokeStyle = 'rgba(109, 211, 255, 0.24)'
    context.lineWidth = 1
    for (var i = 0; i < 6; i++) {
      var y = height * (0.26 + i * 0.09) + Math.sin(time * 0.0008 + i) * 18
      context.beginPath()
      context.moveTo(width * 0.12, y)
      context.bezierCurveTo(width * 0.36, y - 42, width * 0.62, y + 42, width * 0.88, y)
      context.stroke()
    }
    context.restore()
  }

  function animate (time) {
    var elapsed = Date.now() - startedAt
    var progress = Math.min(elapsed / 2200, 1)
    var eased = easeOutCubic(progress)

    drawBackground(time)

    context.save()
    context.globalCompositeOperation = 'lighter'
    for (var i = 0; i < particles.length; i++) {
      var particle = particles[i]
      var flutter = Math.sin(time * 0.002 + particle.seed) * (1 - eased) * 42
      var orbit = Math.cos(time * 0.0017 + particle.seed) * (1 - eased) * 30
      var targetX = particle.tx + flutter
      var targetY = particle.ty + orbit
      var pull = 0.018 + eased * 0.07

      particle.vx += (targetX - particle.x) * pull
      particle.vy += (targetY - particle.y) * pull
      particle.vx *= 0.78
      particle.vy *= 0.78
      particle.x += particle.vx
      particle.y += particle.vy

      var alpha = particle.alpha * (0.38 + eased * 0.78)
      var size = particle.size * (1.35 - eased * 0.18)
      context.beginPath()
      context.fillStyle = particle.color + alpha + ')'
      context.arc(particle.x, particle.y, size, 0, Math.PI * 2)
      context.fill()
    }
    context.restore()

    drawFinalText(eased)
    animationFrame = window.requestAnimationFrame(animate)
  }

  function createPreloader () {
    if (!document.body || document.querySelector('.softbridge-preloader')) {
      return
    }

    stage = document.createElement('div')
    stage.className = 'softbridge-preloader softbridge-preloader--dust'
    stage.setAttribute('role', 'status')
    stage.setAttribute('aria-live', 'polite')
    stage.setAttribute('aria-label', 'SoftBridge Solutions - Yunus Emre G\u00fcrlek')

    canvas = document.createElement('canvas')
    canvas.className = 'softbridge-preloader__canvas'
    canvas.setAttribute('aria-hidden', 'true')

    var label = document.createElement('span')
    label.className = 'softbridge-preloader__label'
    label.textContent = 'SoftBridge Solutions - Yunus Emre G\u00fcrlek'

    stage.appendChild(canvas)
    stage.appendChild(label)
    document.body.appendChild(stage)

    context = canvas.getContext('2d')
    resizeCanvas()
    animationFrame = window.requestAnimationFrame(animate)

    window.addEventListener('resize', onResize)
  }

  function onResize () {
    window.clearTimeout(resizeTimer)
    resizeTimer = window.setTimeout(resizeCanvas, 120)
  }

  function closePreloader () {
    if (!stage || isClosing) {
      return
    }
    isClosing = true

    var remainingTime = Math.max(0, minimumTime - (Date.now() - startedAt))
    window.setTimeout(function () {
      stage.className += ' is-leaving'
      window.setTimeout(function () {
        window.cancelAnimationFrame(animationFrame)
        window.removeEventListener('resize', onResize)
        if (stage && stage.parentNode) {
          stage.parentNode.removeChild(stage)
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

  window.setTimeout(closePreloader, 5200)
})()
