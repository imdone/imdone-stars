imdone-stars
====
Hosting
----
[Simple Cloud Infrastructure for Developers | DigitalOcean](https://www.digitalocean.com/)

Epic
----
[As a user I would like to see how many tasks exist in the most stared repos on github +epic](#doing:0)

Stories
----
- [As a user I would like to see the number of current tasks in each list per day +story](#todo:0)
- [As a user I would like to see the number of tasks changes per day +story](#todo:0)
- [As a user I would like to see the number of changes (additions, deletions, files changed) each day +story](#doing:0)

Architecture
----
### db.js
- manages db connection

### bin/clone.js #DOING:20 Use [[lib/repos.js]] for cloning
- clones top repos and creates repos.json if it doesn't exist (Done)
- uses repos.json if it exists

### bin/pull.js
- pulls the latest of each repo

### bin/stats.js
- Gets a log of commits for repos going back up to a year
- runs imdone to get task stats
- Stores stats in mongo pulls collection including the hash and timestamp of commit
- runs mapReduce on pulls collection and stores in repoStats collection

### index.js
The webapp

Display
----
- Use [nuvo-dashing-js](https://www.npmjs.com/package/nuvo-dashing-js)
- or... [Freeboard/freeboard](https://github.com/Freeboard/freeboard)

Technical Debt
----
- [code quality - How can I quantify the amount of technical debt that exists in a project? - Programmers Stack Exchange](http://programmers.stackexchange.com/questions/135993/how-can-i-quantify-the-amount-of-technical-debt-that-exists-in-a-project)
- [How to Calculate Technical Debt - Deloitte CIO - WSJ](http://deloitte.wsj.com/cio/2015/01/21/how-to-calculate-technical-debt/)
