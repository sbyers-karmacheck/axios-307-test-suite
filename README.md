# Axios 307 Redirect testing harness
Quickly verify different versions of Axios / Node runtime correctly follow 307 responses without additional configuration.

# Approach
Jest is used as a harness to create a simple Express server. Tests are then leveraged against the webserver which responds with standard 307 redirects to another endpoint. Inquirer is used to select which configuration(s) and actions to perform.

# Requirements
Docker

# Setup
The test harness is written in TypeScript, so before starting it is important to `npm install` in the root of the project.

There are Dockerfiles set up for specific Node/Axios versions to override the internally configured version of Axios and test against the desired Node runtime. More can be added with different variations of NodeJs / Axios by following this pattern in the project root:

`Dockerfile-nodexx_y.y.y`

Examples:
```
Dockerfile-node14-0.20.1 - Node14, Axios 0.20.1
Dockerfile-node20-1.5.1  - Node20, Axios 1.5.1
```

# Running tests
`npm start` will kick off a series of questions allowing you to build & run, just build, or just run any of the configured Dockerfiles. Once the prompts are complete all of selected files are built, images tagged, and then run. The output will show success/failure of each configured version.

# Cleanup
By selecting `Y` at the Cleanup option the test harness will issue a `docker system prune -a` command that requires confirmation. This command removes all unused docker resources and is helpful to run from time to time to reclaim space.

> IMPORTANT: The cleanup routine will clean ALL unused/dangling resources NOT just the resources created by this harness. Be sure you understand the implications of a system prune before selecting yes to the cleanup option.