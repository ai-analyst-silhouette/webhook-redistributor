#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Função para incrementar versão
function incrementVersion(version, type = 'patch') {
  const parts = version.split('.').map(Number);
  
  switch (type) {
    case 'major':
      parts[0]++;
      parts[1] = 0;
      parts[2] = 0;
      break;
    case 'minor':
      parts[1]++;
      parts[2] = 0;
      break;
    case 'patch':
    default:
      parts[2]++;
      break;
  }
  
  return parts.join('.');
}

// Função para atualizar package.json
function updatePackageVersion(version) {
  const packagePath = path.join(__dirname, '..', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  packageJson.version = version;
  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2) + '\n');
  
  console.log(`📦 package.json atualizado para versão: ${version}`);
  return version;
}

// Função para atualizar o arquivo de versão
function updateVersionFile(version) {
  const versionPath = path.join(__dirname, '..', 'src', 'version.js');
  
  const versionContent = `// Versão da aplicação - atualizada automaticamente durante o build
export const VERSION = '${version}';

// Informações adicionais da versão
export const VERSION_INFO = {
  version: VERSION,
  buildDate: new Date().toISOString(),
  environment: process.env.NODE_ENV || 'development'
};

export default VERSION;
`;

  fs.writeFileSync(versionPath, versionContent);
  console.log(`✅ version.js atualizado para: ${version}`);
}

// Função principal
function autoIncrementVersion() {
  const packagePath = path.join(__dirname, '..', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  const currentVersion = packageJson.version;
  const newVersion = incrementVersion(currentVersion, 'patch');
  
  console.log(`🔄 Incrementando versão: ${currentVersion} → ${newVersion}`);
  
  // Atualizar package.json
  updatePackageVersion(newVersion);
  
  // Atualizar version.js
  updateVersionFile(newVersion);
  
  console.log(`🚀 Versão ${newVersion} pronta para build!`);
  
  return newVersion;
}

// Executar se chamado diretamente
if (require.main === module) {
  autoIncrementVersion();
}

module.exports = { 
  autoIncrementVersion, 
  incrementVersion, 
  updatePackageVersion, 
  updateVersionFile 
};
