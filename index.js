const fs = require('fs-extra')
const path = require('path')
const shell = require('shelljs')
const createHTML = require('create-html')
const hash = require('object-hash')





let debug = false





function debugLog(str) {
  if(debug) console.log(str)
}




function saveReport(scores, format, savePath, reportName) {
  let reportLoc = ''
  format = format.toLowerCase()
  switch(format) {
    case ('html'): {
      let reportHTML =
        `
        <div class="container">
          <p>Contribution Report</p>
          <hr>
          <h3>${reportName}</h3>
          <hr>
          <div id="accordion">
        `
      for(let fileData in scores) {
        let fNameHash = hash(fileData)
        let fScr = ''
        for (let contributor in scores[fileData]) {
          if(contributor == '_') continue
          fScr += `<p>${contributor}: ${scores[fileData][contributor]}(${((scores[fileData][contributor]*100)/scores[fileData]['_']).toFixed(2)}%)</p>`
        }
        let h =
          `
          <div class="card">
            <div class="card-header" id="h_${fNameHash}">
              <h5 class="mb-0">
                <button class="btn btn-link" data-toggle="collapse" data-target="#c_${fNameHash}" aria-expanded="false" aria-controls="c_${fNameHash}">
                  ${fileData}
                </button>
              </h5>
            </div>
            <div id="c_${fNameHash}" class="collapse" aria-labelledby="h_${fNameHash}" data-parent="#accordion">
              <div class="card-body">
                ${fScr}
              </div>
            </div>
          </div>
          `
        reportHTML += h
      }
      reportHTML +=
        `
          </div>
          <p>${new Date().toString()}</p>
        </div>
        `
      reportLoc = path.join(savePath, reportName)
      let html = createHTML({
        title: `Contribution Report - ${reportName}`,
        css: ['./css/bootstrap.min.css'],
        script: ['./js/jquery-3.3.1.min.js', './js/bootstrap.min.js'],
        body: reportHTML
      })
      let htmlFilePath = path.join(reportLoc, 'index.html')
      fs.outputFile(htmlFilePath, html, function (err) {
        if(err) {
          console.log(err)
          return
        }
        debugLog(`Report saved at: ${reportLoc}`)
      })
      let staticFilesPath = path.join(__dirname, 'templates')
      fs.copySync(staticFilesPath, reportLoc)
      break
    }
    default: {
      let reportJSON = JSON.stringify(scores, null, 4)
      if(!reportName.toLowerCase().endsWith('.json')) reportName += '.json'
      reportLoc = path.join(savePath, reportName)
      fs.outputFile(reportLoc, reportJSON, function(err) {
        if(err) {
          debugLog(err);
          return;
        }
        debugLog(`Report saved at: ${reportLoc}`)
      })
      break
    }
  }
}





function createReport(repoPath, branch, format, saveLoc) {
  let projName = repoPath.match(/([^\/]*)\/*$/)[1]
  let reportName = `${projName}[${branch}]`
  debugLog(`Starting analysis with following specs`)
  debugLog(`\tRepo: ${repoPath}`)
  debugLog(`\tBranch: ${branch}`)
  debugLog(`\tReport Format: ${format}`)
  debugLog(`\tSave Location: ${saveLoc}`)
  debugLog(`\tReport Name: ${reportName}`)

  let scores = countScoresForRepo(repoPath, branch)
  // let motherDict = getCumulativeScores(scores)
  saveReport(scores, format, saveLoc, reportName)

}





function getCumulativeScores(scores) {
  let motherDict = {}
  let i = 0
  for (let file in scores) {
    let scrDict = scores[file]
    for (let s in scrDict) {
      if (motherDict[s] === undefined) motherDict[s] = 0
      motherDict[s] += scrDict[s]
    }
    debugLog(`${i+1}. \t${file}`)
    debugLog(scrDict)
    i++
  }
  return motherDict
}





function countScoresForRepo(rPath, commit='HEAD') {
  shell.cd(rPath)
  let lsTreeReport = shell.exec(`git ls-tree --full-tree -r --name-only ${commit}`, {silent:true})

  if (lsTreeReport.code == 0) {
    let files = lsTreeReport.stdout.split('\n')
    let fileScores = {}
    for (let i = 0; i < files.length; i++) {
      let scrDict = countScoresForFile(files[i], commit)
      fileScores[files[i]] = scrDict
    }
    return fileScores
  }
}





function countScoresForFile(fPath, commit='HEAD') {
  let fileBlameReport = shell.exec(`git blame --line-porcelain -w -M -e ${commit} ${fPath}`, {silent:true})
  if(fileBlameReport.code == 0) {
    let fileBlameRes = fileBlameReport.stdout
    let scoreDict = {}
    let bl, n
    let t = 0
    let blameLines = fileBlameRes.split('\n')
    for (let i = 0; i < blameLines.length; i++) {
      bl = blameLines[i]
      if (bl.indexOf('author ') == 0) {
        n = bl.substring(bl.indexOf(' ')+1)
        if (scoreDict[n] === undefined) scoreDict[n] = 0
        scoreDict[n]++
        t++
      }
    }
    scoreDict['_'] = t
    return scoreDict
  }
  return {}
}





module.exports.createReport = createReport
module.exports.countScoresForRepo = countScoresForRepo
module.exports.countScoresForFile = countScoresForFile
module.exports.createReport = createReport
module.exports.createReport = createReport
module.exports.createReport = createReport