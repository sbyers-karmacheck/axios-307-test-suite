import * as fs from 'fs';
import { execFileSync } from 'child_process';

import { buildImages } from './docker-image-build';
import { runImages } from './docker-image-run';
import { prompt } from './inquirer';

(async () => {
    try {
        const dockerfilesDir = process.cwd();
        console.info(`Enumerating local Dockerfiles ...`);

        const { files, debug, action, cleanup } = await prompt(
            // Read the directory for Dockerfile.xxx files;
            fs.readdirSync(dockerfilesDir).filter(file => file.startsWith('Dockerfile-'))
        );

        const build = !action || action == 1;

        if (build) {
            buildImages(files, dockerfilesDir, debug);
            if (debug) console.debug(`Image build(s) complete. Starting tests.`);
        }

        if (!action || action == 2) {
            runImages(files, debug);
            console.log(`Test suite complete.`);
        }

        if (cleanup) {
            // use built-in exec here so that the command input can be captured (y/N)
            execFileSync("docker", ["system", "prune", "-a"], { stdio: 'inherit' });
        }
    }
    catch (exc) {
        console.error(`Test suite exited with error:`, exc);
    }
    finally {
        console.log(`Harness process exited.`);
    }
})();