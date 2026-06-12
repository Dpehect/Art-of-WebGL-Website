(function () {
  const startedAt = Date.now()
  const minimumTime = 3600
  const closingTime = 760
  let isClosing = false
  let animationFrame = 0
  let resizeTimer = 0
  let particles = []
  let canvas
  let context
  let stage
  let width = 0
  let height = 0
  let pixelRatio = 1
  let textLayout = null

  // Inject Montserrat Google Font dynamically
  if (!document.getElementById('softbridge-font-link')) {
    const fontLink = document.createElement('link')
    fontLink.id = 'softbridge-font-link'
    fontLink.rel = 'stylesheet'
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;700;800;900&display=swap'
    document.head.appendChild(fontLink)
  }

  // Detect font loading to ensure accurate text boundaries
  if (document.fonts) {
    document.fonts.load('800 24px "Montserrat"').then(function () {
      if (canvas) {
        rebuildParticles()
      }
    })
  }

  function clamp (value, min, max) {
    return Math.max(min, Math.min(max, value))
  }

  function easeOutCubic (value) {
    return 1 - Math.pow(1 - value, 3)
  }

  function shuffle (items) {
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      const temp = items[i]
      items[i] = items[j]
      items[j] = temp
    }
    return items
  }

  function buildTextMap () {
    const maskCanvas = document.createElement('canvas')
    const maskContext = maskCanvas.getContext('2d')
    const maxParticles = Math.round(clamp((width * height) / 240, 1400, 4800))
    const sampleGap = width < 520 ? 3 : 4

    const brandLines = width < 560 ? ['SoftBridge', 'Solutions'] : ['SoftBridge Solutions']
    const brandSize = width < 560 ? clamp(width * 0.09, 28, 38) : clamp(width * 0.052, 42, 68)
    const bylineSize = width < 560 ? clamp(width * 0.05, 16, 22) : clamp(width * 0.022, 22, 30)
    const brandLineHeight = brandSize * 1.15
    const gap = bylineSize * 1.45
    const blockHeight = brandLines.length * brandLineHeight + gap + bylineSize
    const brandStartY = height / 2 - blockHeight / 2 + brandSize * 0.85
    const bylineY = brandStartY + brandLines.length * brandLineHeight + gap

    const brandSpacing = width < 560 ? '3px' : '6px'
    const bylineSpacing = width < 560 ? '4px' : '8px'

    maskCanvas.width = width
    maskCanvas.height = height
    maskContext.clearRect(0, 0, width, height)
    maskContext.textAlign = 'center'
    maskContext.textBaseline = 'alphabetic'
    maskContext.fillStyle = '#fff'

    maskContext.font = '800 ' + brandSize + 'px "Montserrat", "Segoe UI", Arial, sans-serif'
    if ('letterSpacing' in maskContext) {
      maskContext.letterSpacing = brandSpacing
    }

    for (let lineIndex = 0; lineIndex < brandLines.length; lineIndex++) {
      maskContext.fillText(brandLines[lineIndex], width / 2, brandStartY + lineIndex * brandLineHeight)
    }

    maskContext.font = '300 ' + bylineSize + 'px "Montserrat", "Segoe UI", Arial, sans-serif'
    if ('letterSpacing' in maskContext) {
      maskContext.letterSpacing = bylineSpacing
    }
    maskContext.fillText('Yunus Emre G\u00fcrlek', width / 2, bylineY)

    const imageData = maskContext.getImageData(0, 0, width, height).data
    const points = []
    for (let y = 0; y < height; y += sampleGap) {
      for (let x = 0; x < width; x += sampleGap) {
        const alpha = imageData[(y * width + x) * 4 + 3]
        if (alpha > 70) {
          points.push({ x, y, alpha: alpha / 255 })
        }
      }
    }

    shuffle(points)
    if (points.length > maxParticles) {
      points.length = maxParticles
    }

    textLayout = {
      brandLines,
      brandSize,
      bylineSize,
      brandStartY,
      brandLineHeight,
      bylineY,
      brandSpacing,
      bylineSpacing
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
    const targets = buildTextMap()
    const cx = width / 2
    const cy = height / 2

    particles = targets.map(function (point, index) {
      const orbitRadius = 60 + Math.random() * (Math.max(width, height) * 0.6)
      const orbitAngle = Math.random() * Math.PI * 2
      const orbitSpeed = (0.006 + Math.random() * 0.01) * (index % 2 === 0 ? 1 : -0.8)

      let colorStr = ''
      const rand = Math.random()
      let hue
      if (rand < 0.5) {
        hue = 184 + Math.random() * 26
        colorStr = 'hsla(' + hue + ', 95%, 66%, '
      } else if (rand < 0.78) {
        hue = 202 + Math.random() * 16
        colorStr = 'hsla(' + hue + ', 92%, 60%, '
      } else if (rand < 0.91) {
        hue = 40 + Math.random() * 10
        colorStr = 'hsla(' + hue + ', 94%, 72%, '
      } else {
        colorStr = 'hsla(0, 0%, 98%, '
      }

      const startX = cx + Math.cos(orbitAngle) * orbitRadius
      const startY = cy + Math.sin(orbitAngle) * orbitRadius

      return {
        x: startX,
        y: startY,
        vx: 0,
        vy: 0,
        orbitRadius,
        orbitAngle,
        orbitSpeed,
        seed: Math.random() * Math.PI * 2,
        tx: point.x,
        ty: point.y,
        size: 0.7 + point.alpha * 1.5 + Math.random() * 0.6,
        color: colorStr,
        alpha: 0.35 + point.alpha * 0.65
      }
    })
  }

  function drawTextLine (text, y, fontSize, weight, fillAlpha, spacing, isBrand, progress) {
    context.font = weight + ' ' + fontSize + 'px "Montserrat", "Segoe UI", Arial, sans-serif'

    if ('letterSpacing' in context) {
      context.letterSpacing = spacing
    }

    context.save()

    // 1. Draw a dark backdrop/stroke to separate text from background particles
    context.strokeStyle = 'rgba(2, 5, 9, ' + (fillAlpha * 0.85) + ')'
    context.lineWidth = Math.max(3, fontSize * 0.08)
    context.lineJoin = 'round'
    context.strokeText(text, width / 2, y)

    // 2. Draw a subtle, premium cyan/blue outer glow
    if (isBrand) {
      context.shadowColor = 'rgba(109, 211, 255, ' + (fillAlpha * 0.45) + ')'
      context.shadowBlur = fontSize * 0.22
    } else {
      context.shadowColor = 'rgba(0, 0, 0, 0.45)'
      context.shadowBlur = 6
    }

    // 3. Draw the main text with the linear sweep gradient!
    const textWidthEstimate = text.length * (fontSize * 0.6)
    const gradX = width / 2 - textWidthEstimate / 2
    const sweepProgress = clamp((progress - 0.45) / 0.45, 0, 1)
    const sweepX = gradX - 120 + sweepProgress * (textWidthEstimate + 240)

    const gradient = context.createLinearGradient(sweepX, 0, sweepX + 160, 0)
    gradient.addColorStop(0, 'rgba(255, 255, 255, ' + fillAlpha + ')')
    gradient.addColorStop(0.35, 'rgba(255, 255, 255, ' + fillAlpha + ')')
    gradient.addColorStop(0.5, 'rgba(174, 241, 255, ' + fillAlpha + ')') // Shimmer core
    gradient.addColorStop(0.65, 'rgba(255, 255, 255, ' + fillAlpha + ')')
    gradient.addColorStop(1, 'rgba(255, 255, 255, ' + fillAlpha + ')')

    context.fillStyle = isBrand ? gradient : 'rgba(255, 255, 255, ' + fillAlpha + ')'
    context.fillText(text, width / 2, y)

    context.restore()
  }

  function drawFinalText (progress) {
    if (!textLayout || progress < 0.45) {
      return
    }

    const alpha = clamp((progress - 0.45) / 0.4, 0, 1) // Fades in as progress goes 0.45 -> 0.85
    context.save()
    context.textAlign = 'center'
    context.textBaseline = 'alphabetic'

    for (let i = 0; i < textLayout.brandLines.length; i++) {
      drawTextLine(
        textLayout.brandLines[i],
        textLayout.brandStartY + i * textLayout.brandLineHeight,
        textLayout.brandSize,
        '800',
        alpha,
        textLayout.brandSpacing,
        true,
        progress
      )
    }

    drawTextLine(
      'Yunus Emre G\u00fcrlek',
      textLayout.bylineY,
      textLayout.bylineSize,
      '300',
      alpha,
      textLayout.bylineSpacing,
      false,
      progress
    )

    context.restore()
  }

  function drawBackground (time) {
    const sweep = (Math.sin(time * 0.0011) + 1) / 2
    const gradient = context.createRadialGradient(width * (0.35 + sweep * 0.22), height * 0.46, 0, width * 0.5, height * 0.5, Math.max(width, height) * 0.82)
    gradient.addColorStop(0, 'rgba(10, 36, 45, 0.96)') // Richer slate-cyan
    gradient.addColorStop(0.38, 'rgba(5, 14, 22, 0.98)')
    gradient.addColorStop(1, 'rgba(2, 4, 7, 1)')
    context.fillStyle = gradient
    context.fillRect(0, 0, width, height)

    context.save()
    context.globalAlpha = 0.14
    context.strokeStyle = 'rgba(109, 211, 255, 0.22)'
    context.lineWidth = 1
    for (let i = 0; i < 6; i++) {
      const y = height * (0.26 + i * 0.09) + Math.sin(time * 0.0008 + i) * 18
      context.beginPath()
      context.moveTo(width * 0.12, y)
      context.bezierCurveTo(width * 0.36, y - 42, width * 0.62, y + 42, width * 0.88, y)
      context.stroke()
    }
    context.restore()
  }

  function animate (time) {
    const elapsed = Date.now() - startedAt
    const progress = Math.min(elapsed / 2200, 1)

    drawBackground(time)

    const cx = width / 2
    const cy = height / 2

    const pullProgress = clamp((progress - 0.2) / 0.65, 0, 1)
    const pullStrength = easeOutCubic(pullProgress)

    context.save()
    context.globalCompositeOperation = 'lighter'
    for (let i = 0; i < particles.length; i++) {
      const particle = particles[i]

      // Orbit vortex calculations
      const currentAngle = particle.orbitAngle + time * 0.0008 * particle.orbitSpeed
      const radialOscillation = Math.sin(time * 0.002 + particle.seed) * 12 * (1 - pullStrength)
      const vortexX = cx + Math.cos(currentAngle) * (particle.orbitRadius + radialOscillation)
      const vortexY = cy + Math.sin(currentAngle) * (particle.orbitRadius + radialOscillation)

      // Target transition
      let targetX = (1 - pullStrength) * vortexX + pullStrength * particle.tx
      let targetY = (1 - pullStrength) * vortexY + pullStrength * particle.ty

      // Organic wind noise
      if (pullStrength < 0.95) {
        const noise = Math.sin(time * 0.003 + particle.seed) * 5 * (1 - pullStrength)
        targetX += noise
        targetY += noise
      }

      // Spring physics
      const dx = targetX - particle.x
      const dy = targetY - particle.y

      const spring = 0.022 + pullStrength * 0.12
      const friction = 0.82 - pullStrength * 0.08

      particle.vx += dx * spring
      particle.vy += dy * spring
      particle.vx *= friction
      particle.vy *= friction
      particle.x += particle.vx
      particle.y += particle.vy

      const size = particle.size * (1.25 - pullStrength * 0.25)
      const alpha = particle.alpha * (0.35 + pullStrength * 0.65)

      context.beginPath()
      context.fillStyle = particle.color + alpha + ')'
      context.arc(particle.x, particle.y, size, 0, Math.PI * 2)
      context.fill()
    }
    context.restore()

    drawFinalText(progress)
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

    const label = document.createElement('span')
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

    const remainingTime = Math.max(0, minimumTime - (Date.now() - startedAt))
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
