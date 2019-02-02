const fs = require('fs')
const path = require('path')
const shell = require('shelljs')
const createHTML = require('create-html')






let debug = true

let repoPath = ''
repoPath = 'test-repo'

let branch = 'master'
let format = 'json'
let saveLoc = 'G:/00\ \ \ \ CURRENT/Node/screr/reports'
let reportName = 'report'

createReport(repoPath, branch, format, saveLoc, reportName)







function debugLog(str) {
  if(debug) console.log(str)
}




function saveReport(scores, format, savePath, reportName) {
  let reportLoc = ''
  switch(format) {
    case (format.toLowerCase() == 'html'): {
      // burn
      break
    }
    default: {
        let reportJSON = JSON.stringify(scores, null, 4)
        if(!reportName.toLowerCase().endsWith('.json')) reportName += '.json'
        reportLoc = path.join(savePath, reportName)
        fs.writeFile(reportLoc, reportJSON, function(err) {
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