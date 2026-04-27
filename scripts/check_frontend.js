const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function checkCommand(command) {
    try {
        execSync(command, { stdio: 'ignore' });
        return true;
    } catch (e) {
        return false;
    }
}

console.log("--- Frontend Environment Check ---");

// Check Node.js
console.log(`[*] Node.js Version: ${process.version}`);

// Check npm
if (checkCommand('npm --version')) {
    console.log("[+] npm is installed.");
} else {
    console.log("[-] npm is NOT installed.");
}

// Check if frontend directory exists and has package.json
const frontendPath = path.join(__dirname, '../frontend');
if (fs.existsSync(frontendPath)) {
    console.log("[+] Frontend directory found.");
    const pkgJsonPath = path.join(frontendPath, 'package.json');
    if (fs.existsSync(pkgJsonPath)) {
        console.log("[+] package.json found.");
        const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
        const deps = ['react', 'react-router-dom', 'lucide-react', 'typescript'];
        deps.forEach(dep => {
            const isListed = (pkg.dependencies && pkg.dependencies[dep]) || (pkg.devDependencies && pkg.devDependencies[dep]);
            const isInstalled = fs.existsSync(path.join(frontendPath, 'node_modules', dep));

            if (isInstalled) {
                console.log(`[+] Dependency '${dep}' is INSTALLED in node_modules.`);
            } else if (isListed) {
                console.log(`[-] Dependency '${dep}' is in package.json but NOT INSTALLED.`);
            } else {
                console.log(`[-] Dependency '${dep}' is MISSING from package.json and node_modules.`);
            }
        });
    } else {
        console.log("[-] package.json NOT found.");
    }
    
    // Check for TS config
    if (fs.existsSync(path.join(frontendPath, 'tsconfig.json'))) {
        console.log("[+] tsconfig.json found.");
    } else {
        console.log("[-] tsconfig.json NOT found.");
    }
} else {
    console.log("[-] Frontend directory NOT found.");
}

console.log("\n[TIP] Run 'npm install' in the frontend directory if dependencies are missing.");
