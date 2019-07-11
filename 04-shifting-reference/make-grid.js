function makeGrid(width, height, s, proj, points){
  var lnglat2uv = {} // TODO this is sloopy, fix

  points.forEach(d => {
    lnglat2uv[d.lng + '' + d.lat] = d
  })

  var grid = d3.range(width*height/s/s).map(i => {
    var px = i*s % width
    var py = Math.floor(i*s / width)*s

    var [lng, lat] = proj.invert([px, py])
    lng = lng + 360

    var rlng = Math.floor(lng)
    var rlat = Math.floor(lat)

    var x0y0 = lnglat2uv[(rlng + 0) + '' + (rlat + 0)]
    var x1y0 = lnglat2uv[(rlng + 1) + '' + (rlat + 0)]
    var x1y1 = lnglat2uv[(rlng + 1) + '' + (rlat + 1)]
    var x0y1 = lnglat2uv[(rlng + 0) + '' + (rlat + 1)]

    if (!x0y0 || !x1y0 || !x1y1 || !x0y1) return {px, py, lng, lat, u: 0, v: 0}

    // https://en.wikipedia.org/wiki/Bilinear_interpolation
    var tx = lng - rlng
    var ty = lat - rlat
    var u = x0y0.u*(1 - tx)*(1 - ty)
          + x1y0.u*(tx - 0)*(1 - ty) 
          + x1y1.u*(tx - 0)*(ty - 0) 
          + x0y1.u*(1 - tx)*(ty - 0) 

    var v = x0y0.v*(1 - tx)*(1 - ty)
          + x1y0.v*(tx - 0)*(1 - ty) 
          + x1y1.v*(tx - 0)*(ty - 0) 
          + x0y1.v*(1 - tx)*(ty - 0) 

    return {px, py, lng, lat, u, v}
  })

  return {grid, points}
}


if (window.init) init()
