import { execSync } from 'child_process';
console.log("Installing socket.io...");
execSync('npm install socket.io', { stdio: 'inherit' });
console.log("Installation complete.");
