const fs = require('fs-extra')
const path = require('path')
const shell = require('shelljs')
const createHTML = require('create-html')
const hash = require('object-hash')
const removeTrailingPathSeparator = require('remove-trailing-path-separator')




let DEBUG = false





function debugLog(str) {
  if(DEBUG) console.log(str)
}



function makeHTML(scores, savePath, reportName) {
  let reportHTML =
    `
    <div class="container">
      <p>Contribution Report</p>
      <hr>
      <h3>${reportName}</h3>
      <hr>
    `
  let fScr = ''
  // for cumulative scores for the full repo
  for (let contributor in scores[reportName]) {
    if(contributor == '_') continue
    fScr += `<p>${contributor}: ${scores[reportName][contributor]}(${((scores[reportName][contributor]*100)/scores[reportName]['_']).toFixed(2)}%)</p>`
  }
  reportHTML += fScr
  reportHTML +=
    `
      <hr>
      <div id="accordion">
    `
  for(let fileData in scores) {
    let fNameHash = hash(fileData)
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
  reportLoc = path.resolve(path.join(savePath, reportName))
  let html = createHTML({
    title: `Contribution Report - ${reportName}`,
    css: ['./css/bootstrap.min.css'],
    script: ['./js/jquery-3.3.1.min.js', './js/bootstrap.min.js', './js/chart.min.js'],
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
}




function saveReport(scores, format, savePath, reportName) {
  let reportLoc = ''
  format = format.toLowerCase()
  switch(format) {
    case ('html'): {
      makeHTML(scores, savePath, reportName);
      break
    }
    default: {
      let reportJSON = JSON.stringify(scores, null, 4)
      if(!reportName.toLowerCase().endsWith('.json')) reportName += '.json'
      reportLoc = path.resolve(path.join(savePath, reportName))
      fs.outputFile(reportLoc, reportJSON, function(err) {
        if(err) {
          console.log(err);
          return;
        }
        debugLog(`Report saved at: ${reportLoc}`)
      })
      break
    }
  }
}




/**
 * Create and saves the contribution report for the given repo.
 * @param {string} repoPath               Path for repository.
 * @param {string} [branch='master']      Branch to create report for.
 * @param {string} [format='json']        Report out format (html/json).
 * @param {string} [saveLoc='report']     Path to save the report (Paths relative to project path).
 * @param {boolean} [debug=report]        Log generation report logs to console.
 */
function createReport(repoPath, branch='master', format='json', saveLoc='report', debug=false) {
  let cleanedRepoPath = removeTrailingPathSeparator(repoPath)
  let projName = cleanedRepoPath.match(/([^\/]*)\/*$/)[1]
  let reportName = `${projName}[${branch}]`
  DEBUG=debug
  if (!fs.existsSync(cleanedRepoPath) || !fs.existsSync(path.join(cleanedRepoPath, '.git'))) {
    throw new Error(`Directory doesn't exist or is not a git repository: ${cleanedRepoPath}`)
  }
  debugLog(`Starting analysis with following specs`)
  debugLog(`\tRepo: ${cleanedRepoPath}`)
  debugLog(`\tBranch: ${branch}`)
  debugLog(`\tReport Format: ${format}`)
  debugLog(`\tSave Location: ${saveLoc}`)
  debugLog(`\tReport Name: ${reportName}`)

  let scores = countScoresForRepo(repoPath, branch)
  debugLog(`Calculating collated scores...`)
  let collatedScores = getCumulativeScores(scores)
  scores[reportName] = collatedScores
  saveReport(scores, format, saveLoc, reportName)

}




// Go through given score and collate all contributions by contributors.
function getCumulativeScores(scores) {
  let motherDict = {}
  let i = 0
  for (let file in scores) {
    let scrDict = scores[file]
    for (let s in scrDict) {
      if (motherDict[s] === undefined) motherDict[s] = 0
      motherDict[s] += scrDict[s]
    }
    i++
  }
  return motherDict
}





/**
 * Create the contribution report object for the given repo.
 * @param {string} repoPath               Path for repository.
 * @param {string} [commit='HEAD']        Commit to create report for.
 * @returns {object}                      Object containing key-value pairs of all files with scores.
 */
function countScoresForRepo(repoPath, commit='HEAD') {
  shell.cd(repoPath)
  let lsTreeReport = shell.exec(`git ls-tree --full-tree -r --name-only ${commit}`, {silent:true})

  if (lsTreeReport.code == 0) {
    let files = lsTreeReport.stdout.split('\n')
    let fileScores = {}
    debugLog(`Counting scores for ${files.length} files...`)
    for (let i = 0; i < files.length; i++) {
      let scrDict = countScoresForFile(files[i], commit)
      fileScores[files[i]] = scrDict
      debugLog(`Completed ${i}/${files.length} files.`);
    }
    return fileScores
  }
}





/**
 * Create the contribution score for the given file.
 * @param {string} filePath               Path for file.
 * @param {string} [commit='HEAD']        Commit to calculate scores at.
 * @returns {object}                      Object containing key-value pairs of contributors and scores.
 */
function countScoresForFile(filePath, commit='HEAD') {
  let fileBlameReport = shell.exec(`git blame --line-porcelain -w -M -e ${commit} ${filePath}`, {silent:true})
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





module.exports.makeHTML = makeHTML
module.exports.createReport = createReport
module.exports.countScoresForRepo = countScoresForRepo
module.exports.countScoresForFile = countScoresForFile
