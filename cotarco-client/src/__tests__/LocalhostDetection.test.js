
const fs = require('fs');
const path = require('path');

function getAllFiles(dirPath, arrayOfFiles) {
    const files = fs.readdirSync(dirPath);

    arrayOfFiles = arrayOfFiles || [];

    files.forEach(function (file) {
        if (fs.statSync(dirPath + "/" + file).isDirectory()) {
            arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
        } else {
            arrayOfFiles.push(path.join(dirPath, "/", file));
        }
    });

    return arrayOfFiles;
}

describe('Frontend Codebase Safety', () => {
    it('should not contain hardcoded localhost or 127.0.0.1 strings', () => {
        const srcPath = path.join(__dirname, '..');
        const files = getAllFiles(srcPath);

        const forbiddenStrings = ['http://localhost', 'http://127.0.0.1', 'https://localhost'];
        const errors = [];

        files.forEach(file => {
            // Ignore this test file itself
            if (file.includes('LocalhostDetection.test.js')) return;

            // Ignore node_modules if somehow scanned (though scanning src/ prevents this)
            if (file.includes('node_modules')) return;

            // Read file content
            const content = fs.readFileSync(file, 'utf8');

            forbiddenStrings.forEach(forbidden => {
                if (content.includes(forbidden)) {
                    errors.push(`Found hardcoded '${forbidden}' in file: ${file}`);
                }
            });
        });

        if (errors.length > 0) {
            console.error(errors.join('\n'));
            throw new Error(`Found ${errors.length} files with hardcoded localhost URLs. Check console for details.`);
        }
    });
});
