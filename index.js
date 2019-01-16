const fs = require('fs')
const path = require('path')
const shell = require('shelljs')








let repoPath = ''
repoPath = 'test-repo'

let branch = 'master'





console.log(`Starting analysis on ${repoPath} at commit ${branch} ...`)
console.log('----------------')


let scores = countScoresForRepo(repoPath, branch)


let motherDict = {}
let i = 0
for (let file in scores) {
  let scrDict = scores[file]
  for (let s in scrDict) {
    if (motherDict[s] === undefined) motherDict[s] = 0
    motherDict[s] += scrDict[s]
  }
  console.log(`${i+1}. \t${file}`);
  console.log(scrDict);
  i++;
}


console.log('----------------')
console.log(`Cumulative score`)
console.log(motherDict);








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
    return fileScores;
  }
}





function countScoresForFile(fPath, commit='HEAD') {
  let fileBlameReport = shell.exec(`git blame --line-porcelain -w -M -e ${commit} ${fPath}`, {silent:true})
  if(fileBlameReport.code == 0) {
    let fileBlameRes = fileBlameReport.stdout
    let scoreDict = {}
    let bl, n;
    let t = 0;
    let blameLines = fileBlameRes.split('\n')
    for (let i = 0; i < blameLines.length; i++) {
      bl = blameLines[i]
      if (bl.indexOf('author ') == 0) {
        n = bl.substring(bl.indexOf(' ')+1)
        if (scoreDict[n] === undefined) scoreDict[n] = 0;
        scoreDict[n]++;
        t++;
      }
    }
    scoreDict['_'] = t
    return scoreDict;
  }
  return {}
}