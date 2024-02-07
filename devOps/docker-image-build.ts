import * as shell from 'shelljs';
import * as path from 'path';

import { DOCKER_IMAGE_PREFIX } from './constants';

export function buildImages(files: string[], workingFolder: string, debug = false) {
    for (const file of files) {
        try {
            const [, tagSuffix] = file.split('-') // Extract tag suffix from the filename
            const imageName = `${DOCKER_IMAGE_PREFIX}/${tagSuffix}`;
            const dockerfilePath = path.join(workingFolder, file);

            console.debug(`\n-----\nStarting Docker build: ${imageName}:latest\n-----\n`);

            // Build and tag the Docker image
            const { code } = shell.exec(`docker build -f ${dockerfilePath} -t ${imageName}:latest ${workingFolder}/.`, { silent: !debug });
            if (code !== 0) throw new Error(`Error building Docker image: ${imageName}`)

            console.info(`\n-----\nBuilt and tagged image: ${imageName}:latest\n`);
        }
        catch (exc) {
            console.error(exc);

            // don't keep building if one of them fails
            break;
        }
    }
}
