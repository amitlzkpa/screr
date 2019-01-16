const fs = require('fs')
const path = require('path')
const shell = require('shelljs')









let branch = 'master'

let repoPath = ''
repoPath = '<repo>'


shell.cd(repoPath)
console.log('----------------')
let lsTreeReport = shell.exec(`git ls-tree --full-tree -r --name-only ${branch}`, {silent:true})

if (lsTreeReport.code == 0) {
  let files = lsTreeReport.stdout.split('\n')
  let fileScores = {}
  let motherDict = {}
  for (let i = 0; i < files.length; i++) {
    let scrDict = countScoresForFile(files[i])
    fileScores[files[i]] = scrDict
    for (let s in scrDict) {
      if (motherDict[s] === undefined) motherDict[s] = 0
      motherDict[s] += scrDict[s]
    }
    console.log(files[i]);
    console.log(scrDict);
    console.log('-');
  }

  console.log('==========');
  console.log(motherDict);

}

console.log('----------------')





function countScoresForFile(fPath) {
  let fileBlameReport = shell.exec(`git blame --line-porcelain -w -M -e ${branch} ${fPath}`, {silent:true})
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