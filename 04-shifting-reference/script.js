console.clear()

var maxAge = 100

function load(cb){
  d3.loadData('../00-arrows/earth.json', `points.csv`, (err, res) => {
    [earth, points] = res

    cb()
  })
}

function init(){
  // load data if we haven't yet
  if (!window.earth) return load(init)

  var sel = d3.select('#graph').html('')

  var c = d3.conventions({
    sel, 
    margin: {top: 0, bottom: 0, left: 0, right: 0},
    layers: 'sccd'
  })

  ;[svg, ctx0, ctxBot, divSel] = c.layers
  var {width, height} = c

  var timeSel = divSel.append('div')
    .st({right: 10, top: 10, fontSize: 25, color: '#000', position: 'absolute'})

  var extent = [[360-95.028,19.2],[360 -83.59,34.2]]
  var proj = d3.geoTransverseMercator().rotate([-84, 0, -170])
    .fitSize([c.width, c.height], {type: "MultiPoint", coordinates: extent})    

  d3.geoPath().context(ctx0).projection(proj)
    (topojson.mesh(earth, earth.objects.coastline_50m))
  ctx0.strokeStyle = "rgba(255,0,255,.4)"
  ctx0.stroke()

  var s = 10
  frames = d3.nestBy(points, d => d.date).map(d => {
    var frame = makeGrid(width, height, s, proj, d)
    frame.date = d3.timeParse('%Y%m%d%H')(d.key)
    // silly hack to find center
    frame.center = _.maxBy(frame.grid, d => d.u)

    return frame
  })

  var pathStr = d => 'M 0 0 L' + [d.u*.8, -d.v*.8]


  var frameRate = 2000

  dots = d3.range(5000).map(d => randomDot())

  function randomDot(d = {}){
    d.px = Math.random()*width
    d.py = Math.random()*height
    d.u = d.v = 0 
    d.age = d.age ? 0 : Math.random()*maxAge

    return d
  }

  var gridWidth = Math.ceil(width/s)

  if (window.timer) window.timer.stop()
  window.timer = d3.timer(t => {

    // vector fields to interpolate between
    var frameIndex = Math.floor(t/frameRate) % frames.length
    var frame0 = frames[frameIndex]
    var frameIndexNext = (frameIndex + 1) % frames.length
    var frame1 = frames[frameIndexNext]

    // how far we are between 0 and 1
    var gt = t/frameRate % 1
    var isLastFrame = frameIndex == frames.length - 1
    if (isLastFrame) gt = 1 // no animation on last frame

    var time = d3.interpolate(frame0.date, frame1.date)(gt)
    timeSel.text(d3.timeFormat('%Y-%m-%d %H:%M')(time))

    var dpx = Math.floor((frame0.center.px - frame1.center.px)/s)
    var dpy = Math.floor((frame0.center.py - frame1.center.py)/s)

    dots.forEach(d => {
      var px = Math.floor(d.px/s - dpx*(1 - gt))
      var py = Math.floor(d.py/s - dpy*(1 - gt))

      // A     B
      //
      //
      // D     C
      var [A, B, C, D] = [
        [px + 0, py + 0],
        [px + 1, py + 0],
        [px + 1, py + 1],
        [px + 0, py + 1],
      ].map(([px, py]) => {
        var index = px + py*gridWidth

        var v0 = frame0.grid[px + py*gridWidth]
        var v1 = frame1.grid[px - dpx + (py - dpy)*gridWidth]
        // var v1 = frame1.grid[px + py*gridWidth]

        if (!v0 || !v1) return null

        return {
          u: v0.u + gt*(v1.u - v0.u),
          v: v0.v + gt*(v1.v - v0.v),
        }
      })

      if (!A || !B || !C || !D || d.age++ > maxAge) return randomDot(d)

      // https://en.wikipedia.org/wiki/Bilinear_interpolation
      var tx = d.px/s - px
      var ty = d.py/s - py
      
      var u = A.u*(1 - tx)*(1 - ty) + B.u*(tx - 0)*(1 - ty) + C.u*(tx - 0)*(ty - 0) + D.u*(1 - tx)*(ty - 0) 
      var v = A.v*(1 - tx)*(1 - ty) + B.v*(tx - 0)*(1 - ty) + C.v*(tx - 0)*(ty - 0) + D.v*(1 - tx)*(ty - 0) 

      d.u = u/10
      d.v = v/10
      d.px += d.u
      d.py += -d.v
      d.mag = Math.sqrt(d.u*d.u + d.v*d.v)
    })

    ctxBot.globalCompositeOperation = 'destination-in'
    ctxBot.fillStyle = isLastFrame ? 'rgba(0, 0, 0, 0)' : 'rgba(0, 0, 0, 0.96)'
    ctxBot.fillRect(0, 0, width, height)
    ctxBot.globalCompositeOperation = 'source-over'


    var opacityFn = d => Math.round(d.mag*(1 - Math.abs(d.age - maxAge/2)/maxAge))
    var opacityFn = d => Math.round(d.mag)
    var opacityScale = d3.scaleLinear().domain([-1, 3]).range([.15, 1])

    d3.nestBy(dots, opacityFn).forEach(bucket => {
      ctxBot.beginPath()
      bucket.forEach(d => {
        ctxBot.moveTo(d.px, d.py)
        ctxBot.lineTo(d.px + d.u, d.py + -d.v)
      })

      // var color = bucket.key < 1 ? '0,0,0' : bucket.key < 2 ? '255,255,0' :'255,0,0'
      color = '0,0,0'
      ctxBot.strokeStyle = `rgba(${color},${opacityScale(bucket.key)})`
      ctxBot.stroke()
    })
  })
}

init()