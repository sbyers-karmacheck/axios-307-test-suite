import * as shell from 'shelljs';import * as path from 'path';
import { DOCKER_IMAGE_PREFIX } from './constants';

export function runImages(files: string[], debug = false) {
    for (const file of files) {
        try {
            const [, tagSuffix] = file.split('-') // Extract tag suffix from the filename
            const imageName = `${DOCKER_IMAGE_PREFIX}/${tagSuffix}`;
            
            if (debug) console.debug(`\n-----\nStarting test: ${imageName}\n-----\n`);

            // run the image with interactive terminal - the dockerfile configures the startup command to begin the test
            const { code } = shell.exec(`docker run -t ${imageName}:latest`);
            if (code !== 0) throw new Error(`Test suite did not pass for image: ${imageName}`)

            console.info(`\n-----\nTest suite for ${imageName}:latest passed!\n`);
        }
        catch (exc) {
            console.error(exc);

            // don't keep building if one of them fails
            break;
        }
    }
}