const fs = require('fs-extra')
const path = require('path')
const shell = require('shelljs')
const createHTML = require('create-html')
const hash = require('object-hash')
const Handlebars = require('handlebars')
const removeTrailingPathSeparator = require('remove-trailing-path-separator')




let DEBUG = false




const baseTemplate = Handlebars.compile(fs.readFileSync(__dirname + '/templates/handlebars/base.html').toString())
const accordionWrapper = Handlebars.compile(fs.readFileSync(__dirname + '/templates/handlebars/accordion-wrapper.html').toString())
const scoreDataTemplate = Handlebars.compile(fs.readFileSync(__dirname + '/templates/handlebars/score-data.html').toString())


Handlebars.registerHelper('randomRGBA', function(items, options) {
  let r = `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 1)`;
  return r;
});



function debugLog(str) {
  if(DEBUG) console.log(str)
}



function makeHTML(scores, savePath, reportName) {
  let repKey = `_`
  let scoreDataStr = ''
  let contribs = []
  // for cumulative scores for the full repo
  for (let contributor in scores[repKey]) {
    if(contributor == repKey) continue
    let scoreData = {
      contributor: contributor,
      score: scores[repKey][contributor],
      percentage: ((scores[repKey][contributor]*100)/scores[repKey][repKey]).toFixed(2)
    }
    contribs.push(scores[repKey][contributor])
    let str = scoreDataTemplate(scoreData)
    scoreDataStr += str + '\n'
  }
  let cumulData = {
    id: 'overall',
    name: 'overall',
    content: scoreDataStr,
    contribs: contribs
  }
  let cumulDataStr = accordionWrapper(cumulData)

  let allFilesDataStr = ''
  for(let name in scores) {
    if(name == repKey) continue
    let id = hash(name)
    let content = ''
    let fileContribs = []
    for (let contributor in scores[name]) {
      if(contributor == repKey) continue
      let scoreData = {
        contributor: contributor,
        score: scores[name][contributor],
        percentage: ((scores[name][contributor]*100)/scores[name][repKey]).toFixed(2)
      }
      fileContribs.push(scores[name][contributor])
      let str = scoreDataTemplate(scoreData)
      content += str + '\n'
    }
    let fileData = {
      id: id,
      name: name,
      content: content,
      contribs: fileContribs
    }
    let fileDataStr = accordionWrapper(fileData)
    allFilesDataStr += fileDataStr + '\n'
  }

  let reportData = {
    reportName: reportName,
    cumulativeData: cumulDataStr,
    fileData: allFilesDataStr
  }
  let reportHTML = baseTemplate(reportData)

  reportLoc = path.resolve(path.join(savePath, reportName))
  let html = createHTML({
    title: `Contribution Report - ${reportName}`,
    css: ['./css/bootstrap.min.css', './css/style.css'],
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
  scores['_'] = collatedScores
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




async function test() {
  console.log('nothing...');
}



module.exports.test = test

module.exports.makeHTML = makeHTML
module.exports.createReport = createReport
module.exports.countScoresForRepo = countScoresForRepo
module.exports.countScoresForFile = countScoresForFile
