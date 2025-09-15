#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Função para obter a versão do package.json
function getVersionFromPackage() {
  const packagePath = path.join(__dirname, '..', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  return packageJson.version;
}

// Função para atualizar o arquivo de versão
function updateVersionFile() {
  const version = getVersionFromPackage();
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
  console.log(`✅ Versão atualizada para: ${version}`);
}

// Executar se chamado diretamente
if (require.main === module) {
  updateVersionFile();
}

module.exports = { updateVersionFile, getVersionFromPackage };
