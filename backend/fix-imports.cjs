const fs = require('fs');
const path = require('path');

function fixImportsInFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const fixedContent = content.replace(/from\s+['"]([^'"]+)\.ts['"]/g, "from '$1'");
  
  if (content !== fixedContent) {
    fs.writeFileSync(filePath, fixedContent, 'utf8');
    console.log(`Fixed imports in: ${filePath}`);
  }
}

function walkDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      walkDirectory(filePath);
    } else if (file.endsWith('.ts')) {
      fixImportsInFile(filePath);
    }
  }
}

console.log('Fixing TypeScript imports...');
walkDirectory('./src');
console.log('Done!');