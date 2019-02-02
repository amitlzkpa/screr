const fs = require('fs-extra')
const path = require('path')
const shell = require('shelljs')
const createHTML = require('create-html')






let debug = true

let repoPath = ''
repoPath = 'test-repo'

let branch = 'master'
let format = 'html'
let saveLoc = 'G:/00\ \ \ \ CURRENT/Node/screr/reports'
let reportName = 'contribution-report'

createReport(repoPath, branch, format, saveLoc, reportName)







function debugLog(str) {
  if(debug) console.log(str)
}




function saveReport(scores, format, savePath, reportName) {
  let reportLoc = ''
  format = format.toLowerCase()
  switch(format) {
    case ('html'): {
      let reportHTML = '\t<div class="container">\n'
      for(let fileData in scores) {
        reportHTML += `\t\t<p>${fileData}</p>\n`
      }
      reportHTML += '\t</div>'
      reportLoc = path.join(savePath, reportName)
      let html = createHTML({
        title: `Contribution Report - ${reportName}`,
        css: ['./css/bootstrap.min.css', './css/bootstrap-grid.min.css'],
        script: ['./css/bootstrap.min.js'],
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





function createReport(repoPath, branch, format, saveLoc, reportName) {
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