/**
 * Backup Manager Component
 * 
 * This component provides backup and restore functionality:
 * - Export complete configuration
 * - Import configuration from backup
 * - Validate configuration before import
 * - Download configuration as JSON file
 * 
 * @author Webhook Redistributor Team
 * @version 1.0.0
 */

import React, { useState } from 'react';
import api from '../api';
import './BackupManager.css';

const BackupManager = ({ onMessage }) => {
  const [loading, setLoading] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importOptions, setImportOptions] = useState({
    overwriteExisting: false,
    skipInactive: false,
    validateUrls: true
  });
  const [validationResult, setValidationResult] = useState(null);

  const handleExport = async (includeStats = false, includeLogs = false) => {
    try {
      setLoading(true);
      
      const response = await api.get('/api/export/config', {
        params: { includeStats, includeLogs }
      });
      
      if (response.data.success) {
        // Create and download file
        const dataStr = JSON.stringify(response.data.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `webhook-config-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        onMessage('success', 'Configuração exportada com sucesso!');
      } else {
        throw new Error(response.data.message || 'Erro ao exportar configuração');
      }
    } catch (error) {
      console.error('Error exporting configuration:', error);
      onMessage('error', `Erro ao exportar: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/json') {
      setImportFile(file);
      setValidationResult(null);
    } else {
      onMessage('error', 'Por favor, selecione um arquivo JSON válido');
    }
  };

  const handleValidate = async () => {
    if (!importFile) {
      onMessage('error', 'Por favor, selecione um arquivo para validar');
      return;
    }

    try {
      setLoading(true);
      const fileContent = await readFileContent(importFile);
      const config = JSON.parse(fileContent);
      
      const response = await api.post('/api/export/validate', { config });
      
      if (response.data.success) {
        setValidationResult(response.data.validation);
        onMessage('success', 'Validação concluída!');
      } else {
        throw new Error(response.data.message || 'Erro na validação');
      }
    } catch (error) {
      console.error('Error validating configuration:', error);
      onMessage('error', `Erro na validação: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      onMessage('error', 'Por favor, selecione um arquivo para importar');
      return;
    }

    if (!validationResult || !validationResult.valid) {
      onMessage('error', 'Por favor, valide o arquivo antes de importar');
      return;
    }

    try {
      setLoading(true);
      const fileContent = await readFileContent(importFile);
      const config = JSON.parse(fileContent);
      
      const response = await api.post('/api/export/config', {
        config,
        options: importOptions
      });
      
      if (response.data.success) {
        onMessage('success', `Importação concluída! ${response.data.summary.totalProcessed} itens processados.`);
        setImportFile(null);
        setValidationResult(null);
        // Reset file input
        const fileInput = document.getElementById('import-file');
        if (fileInput) fileInput.value = '';
      } else {
        throw new Error(response.data.message || 'Erro na importação');
      }
    } catch (error) {
      console.error('Error importing configuration:', error);
      onMessage('error', `Erro na importação: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const readFileContent = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  };

  return (
    <div className="backup-manager">
      <div className="backup-header">
        <h2>💾 Backup e Restauração</h2>
        <p>Exporte e importe a configuração completa do sistema</p>
      </div>

      <div className="backup-content">
        {/* Export Section */}
        <div className="backup-section">
          <h3>📤 Exportar Configuração</h3>
          <p>Baixe um arquivo JSON com toda a configuração atual</p>
          
          <div className="export-options">
            <div className="option-group">
              <label>
                <input
                  type="checkbox"
                  id="include-stats"
                  onChange={(e) => {/* Handle stats option */}}
                />
                Incluir estatísticas de uso
              </label>
            </div>
            <div className="option-group">
              <label>
                <input
                  type="checkbox"
                  id="include-logs"
                  onChange={(e) => {/* Handle logs option */}}
                />
                Incluir logs recentes
              </label>
            </div>
          </div>

          <div className="export-buttons">
            <button
              className="btn btn-primary"
              onClick={() => handleExport(false, false)}
              disabled={loading}
            >
              {loading ? '⏳ Exportando...' : '📥 Exportar Básico'}
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => handleExport(true, true)}
              disabled={loading}
            >
              {loading ? '⏳ Exportando...' : '📊 Exportar Completo'}
            </button>
          </div>
        </div>

        {/* Import Section */}
        <div className="backup-section">
          <h3>📥 Importar Configuração</h3>
          <p>Restore a configuração a partir de um arquivo de backup</p>
          
          <div className="import-form">
            <div className="file-input-group">
              <label htmlFor="import-file" className="file-input-label">
                <span className="file-input-text">
                  {importFile ? importFile.name : 'Selecionar arquivo JSON...'}
                </span>
                <span className="file-input-button">📁 Escolher Arquivo</span>
              </label>
              <input
                id="import-file"
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
            </div>

            {importFile && (
              <div className="import-actions">
                <button
                  className="btn btn-outline"
                  onClick={handleValidate}
                  disabled={loading}
                >
                  {loading ? '⏳ Validando...' : '🔍 Validar Arquivo'}
                </button>
              </div>
            )}

            {validationResult && (
              <div className={`validation-result ${validationResult.valid ? 'valid' : 'invalid'}`}>
                <h4>Resultado da Validação</h4>
                <div className="validation-summary">
                  <span className={`status ${validationResult.valid ? 'success' : 'error'}`}>
                    {validationResult.valid ? '✅ Válido' : '❌ Inválido'}
                  </span>
                  <span className="counts">
                    {validationResult.summary.endpoints} endpoints, {validationResult.summary.destinations} destinos
                  </span>
                </div>
                
                {validationResult.errors.length > 0 && (
                  <div className="validation-errors">
                    <h5>Erros:</h5>
                    <ul>
                      {validationResult.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {validationResult.warnings.length > 0 && (
                  <div className="validation-warnings">
                    <h5>Avisos:</h5>
                    <ul>
                      {validationResult.warnings.map((warning, index) => (
                        <li key={index}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {validationResult && validationResult.valid && (
              <div className="import-options">
                <h4>Opções de Importação</h4>
                <div className="options-grid">
                  <label className="option-item">
                    <input
                      type="checkbox"
                      checked={importOptions.overwriteExisting}
                      onChange={(e) => setImportOptions(prev => ({
                        ...prev,
                        overwriteExisting: e.target.checked
                      }))}
                    />
                    <span>Sobrescrever itens existentes</span>
                  </label>
                  <label className="option-item">
                    <input
                      type="checkbox"
                      checked={importOptions.skipInactive}
                      onChange={(e) => setImportOptions(prev => ({
                        ...prev,
                        skipInactive: e.target.checked
                      }))}
                    />
                    <span>Pular itens inativos</span>
                  </label>
                  <label className="option-item">
                    <input
                      type="checkbox"
                      checked={importOptions.validateUrls}
                      onChange={(e) => setImportOptions(prev => ({
                        ...prev,
                        validateUrls: e.target.checked
                      }))}
                    />
                    <span>Validar URLs</span>
                  </label>
                </div>
                
                <button
                  className="btn btn-success"
                  onClick={handleImport}
                  disabled={loading}
                >
                  {loading ? '⏳ Importando...' : '📥 Importar Configuração'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Help Section */}
        <div className="backup-section help-section">
          <h3>❓ Ajuda</h3>
          <div className="help-content">
            <div className="help-item">
              <h4>Exportar</h4>
              <ul>
                <li><strong>Básico:</strong> Inclui apenas endpoints e destinos</li>
                <li><strong>Completo:</strong> Inclui estatísticas e logs recentes</li>
                <li>O arquivo será baixado automaticamente</li>
              </ul>
            </div>
            <div className="help-item">
              <h4>Importar</h4>
              <ul>
                <li>Sempre valide o arquivo antes de importar</li>
                <li>O backup substitui a configuração atual</li>
                <li>Itens duplicados podem ser sobrescritos ou ignorados</li>
              </ul>
            </div>
            <div className="help-item">
              <h4>Formato</h4>
              <ul>
                <li>Arquivo JSON com estrutura padronizada</li>
                <li>Inclui metadados de exportação</li>
                <li>Compatível com versões futuras</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackupManager;
