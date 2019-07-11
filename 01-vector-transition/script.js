console.clear()

function load(cb){
times = `
2018100900 2018100906 2018100912 2018100918
2018101000 2018101006
`
  .replace(/\n/g, ' ')
  .trim()
  .split(' ')

times = _.flatten(times.map(d => [d, d + 'f3']))


  d3.loadData(
    '../00-arrows/earth.json', 
    ...times.map(d => `../raw-data-f/${d}.json`), 
    (err, res) => {
      [earth, ...gribs] = res

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
    layers: 'scc'
  })

  ;[svg, ctx0, ctxBot] = c.layers
  var {width, height} = c

  var extent = [[360-95.028,19.2],[360 -83.59,34.2]]
  var proj = d3.geoTransverseMercator().rotate([-84, 0, -170])
    .fitSize([c.width, c.height], {type: "MultiPoint", coordinates: extent})    

  d3.geoPath().context(ctx0).projection(proj)
    (topojson.mesh(earth, earth.objects.coastline_50m))
  ctx0.strokeStyle = "rgba(255,255,0,.4)"
  ctx0.stroke()

  var s = 20
  var t0 = makeGrid(width, height, s, proj, gribs[0])
  var t1 = makeGrid(width, height, s, proj, gribs[1])

  console.time('parse gribs')
  var parsedGribs = gribs.map(d => makeGrid(width, height, s, proj, d))
  console.timeEnd('parse gribs')


  var pathStr = d => 'M 0 0 L' + [d.u*.8, -d.v*.8]

  var pointsSel = svg.appendMany('g', t0.points)
    .translate(d => proj([d.lng, d.lat]))
    .append('circle')
    .at({r: 2,fill: 'none',strokeWidth: .5,stroke: '#f0f',})
    .parent().append('path').at({d: pathStr, stroke: '#f0f'})

  var gridSel = svg.appendMany('g', t0.grid)
    .translate(d => [d.px, d.py])
    .append('circle')
    .at({r: 2,fill: 'none',strokeWidth: .3, stroke: '#fff',})
    .parent().append('path').at({d: pathStr, stroke: '#fff'})


  var frameIndex = 0
  var frameRate = 1000
  if (window.interval) window.interval.stop()
  window.interval = d3.interval(step, frameRate)

  step()
  function step(){
    var t1 = parsedGribs[frameIndex++ % parsedGribs.length]

    pointsSel.data(t1.points)
      .transition().ease(d3.easeLinear).duration(frameIndex ? frameRate : 0).at({d: pathStr})

    gridSel.data(t1.grid)
      .transition().ease(d3.easeLinear).duration(frameIndex ? frameRate : 0).at({d: pathStr})
  }

}


init()