# Sistema de Versão Dinâmica

Este projeto implementa um sistema de versão dinâmica que exibe a versão atual da aplicação no sidebar.

## Como Funciona

### 1. Arquivo de Versão (`src/version.js`)
- Contém a versão atual da aplicação
- É atualizado automaticamente durante o build
- Inclui informações adicionais como data de build e ambiente

### 2. Configuração (`src/config.js`)
- Importa a versão do arquivo `version.js`
- Permite override via variável de ambiente `REACT_APP_VERSION`
- Usado em todo o sistema para acessar a versão

### 3. Sidebar (`src/components/Layout/Sidebar.js`)
- Exibe a versão dinamicamente no rodapé
- Formato: `v{config.version}`
- Só aparece quando o sidebar não está colapsado

### 4. Script de Atualização (`scripts/update-version.js`)
- Atualiza automaticamente o arquivo `version.js` com a versão do `package.json`
- Executado automaticamente durante o build
- Pode ser executado manualmente com `npm run update-version`

## Scripts Disponíveis

```bash
# Build normal (atualiza versão automaticamente)
npm run build

# Build de produção (atualiza versão automaticamente)
npm run build:prod

# Apenas atualizar versão
npm run update-version
```

## Como Atualizar a Versão

### Método 1: Atualizar package.json
1. Edite a versão no `package.json`
2. Execute `npm run build` ou `npm run update-version`
3. A versão será atualizada automaticamente no sidebar

### Método 2: Variável de Ambiente
1. Defina `REACT_APP_VERSION` no seu ambiente
2. A versão será usada em vez da do `package.json`

## Estrutura dos Arquivos

```
client/
├── src/
│   ├── version.js          # Arquivo de versão (atualizado automaticamente)
│   ├── config.js           # Configuração que importa a versão
│   └── components/Layout/
│       └── Sidebar.js      # Exibe a versão no rodapé
├── scripts/
│   └── update-version.js   # Script de atualização automática
└── package.json            # Versão fonte da aplicação
```

## Exemplo de Uso

```javascript
import config from './config';

// Acessar a versão
console.log(config.version); // "1.0.3"

// No componente
<div className="system-version">
  v{config.version}
</div>
```

## Benefícios

- ✅ Versão sempre sincronizada com o package.json
- ✅ Atualização automática durante o build
- ✅ Flexibilidade para override via variável de ambiente
- ✅ Informações adicionais de build (data, ambiente)
- ✅ Fácil manutenção e atualização
