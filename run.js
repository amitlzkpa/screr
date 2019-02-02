const screr = require('./index.js')

console.log(screr);



let repoPath = ''
repoPath = 'test-repo'

let branch = 'master'
let format = 'html'
let saveLoc = 'G:/00\ \ \ \ CURRENT/Node/screr/reports'

screr.createReport(repoPath, branch, format, saveLoc)



