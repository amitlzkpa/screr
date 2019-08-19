# Screr
Create contribution reports for your git repository.


![Sample report](https://raw.githubusercontent.com/amitlzkpa/screr/master/files/images/sample.png)


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
let saveLoc = '<folder-to-save-in>'
let viewLogs = true


// Create the report
screr.createReport(repoPath, branch, format, saveLoc, viewLogs)

// Use defaults(branch='master', format='json', saveLoc='report', viewLogs=false)
// screr.createReport(repoPath)

```


# Requirments
Please make sure you have [git](https://git-scm.com/) installed on your computer and accessible from the shell.


# Reports
Screr will create reports for measuring contributions by each contributor.  
It supports creating reports in JSON and HTML.  
For the given repository and branch it goes through each file and counts the number of lines of commit by each contributor.  
The score is formatted and presented for view(HTML) or for machine consumption(JSON).  


# Samples
| Project        													| Report  																				| Date  			|
| ---																| ---																					| ---				|
| [Bitcoin](https://github.com/bitcoin/bitcoin)        				| [html](https://screr-website.herokuapp.com/reports/bitcoin[master]/index.html)  		| Jun 19 2019  		|
| [D3](https://github.com/d3/d3)	                  				| [html](https://screr-website.herokuapp.com/reports/d3[master]/index.html)  			| Jun 19 2019  		|
| [public-apis](https://github.com/public-apis/public-apis)     	| [html](https://screr-website.herokuapp.com/reports/public-apis[master]/index.html)  	| Jun 19 2019  		|
| [React](https://github.com/facebook/react)     					| [html](https://screr-website.herokuapp.com/reports/react[master]/index.html)  		| Jun 19 2019  		|
| [jQuery](https://github.com/jquery/jquery)     					| [html](https://screr-website.herokuapp.com/reports/jquery[master]/index.html)  		| Jun 19 2019  		|
| [scikit-learn](https://github.com/scikit-learn/scikit-learn)     	| [html](https://screr-website.herokuapp.com/reports/scikit-learn[master]/index.html)  	| Jun 19 2019  		|
| [three.js](https://github.com/mrdoob/three.js/tree/master)     	| [html](https://screr-website.herokuapp.com/reports/three.js[master]/index.html)  		| Aug 19 2019  		|


# Status
It is the first release and still in development.

