var { execSync } = require('child_process')
var fs = require('fs')


var cmdStr = fs.readFileSync(__dirname + '/download.sh', 'utf8')

execSync(cmdStr.replace(/20181006/g, '20181007'))
execSync(cmdStr.replace(/20181006/g, '20181008'))
execSync(cmdStr.replace(/20181006/g, '20181009'))
execSync(cmdStr.replace(/20181006/g, '20181010'))



// var out = ''

// out = out + cmdStr.replace(/20181006/g, '20181009')


// fs.writeFileSync(__dirname + '/download.sh', out)



