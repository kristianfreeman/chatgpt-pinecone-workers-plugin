# local-indexing

this directory shows how to index a notion workspace into a pinecone db locally. if you do not want to use workers unbound, which unlocks additional subrequests and allows the workers function to fully index most notion databases, you can use the code in this directory to index a notion workspace locally.

## instructions

```bash
$ npm install
$ cp env.example .env
$ vi .env # fill in the values
$ npm start
```