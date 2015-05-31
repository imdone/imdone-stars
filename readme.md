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
### clone.js
clones top repos and creates repos.json (Done)

### pull.js
- pulls the latest of each repo and get's change stats
- runs imdone to get task stats
- Stores stats in mongo pulls collection
- runs mapReduce on pulls collection and stores in repoStats collection

### index.js
The webapp

Display
----
Use [nuvo-dashing-js](https://www.npmjs.com/package/nuvo-dashing-js)
