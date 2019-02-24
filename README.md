# Screr
Create contribution reports for your git repository.


[!Sample report](/files/images/sample.png)


# Install
```
npm install screr
```


# Usage
```
// Load the package
const screr = require('screr')


// Specify values
let repoPath = '<path-to-repo>'
let branch = 'master'
let format = 'html'
let saveLoc = 'report'
let viewLogs = true


// Create the report
screr.createReport(repoPath, branch, format, saveLoc, viewLogs)

```


# Reports
Screr will create reports for measuring contributions by each contributor.  
It supports creating reports in JSON and HTML.  
For the given repository and branch it goes through each file and counts the number of lines of commit by each contributor.  
The score is formatted and presented for view(HTML) or for machine consumption(JSON).  


# Status
It is the first release and still in development.

