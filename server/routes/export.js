/**
 * Export Routes
 * 
 * Handles configuration export and import functionality
 * 
 * @author Webhook Redistributor Team
 * @version 1.0.0
 */

const express = require('express');
const router = express.Router();
const { query } = require('../database/postgres');
const { generateUsageReport } = require('../utils/endpointUsage');

/**
 * GET /api/export/config - Export complete configuration
 * @query {boolean} includeStats - Include usage statistics (default: false)
 */
router.get('/config', async (req, res) => {
  try {
    const includeStats = req.query.includeStats === 'true';
    
    // Get redirecionamentos
    const redirecionamentosResult = await query('SELECT * FROM redirecionamentos ORDER BY created_at');
    const redirecionamentos = redirecionamentosResult.rows;
    
    // Get usuarios
    const usuariosResult = await query('SELECT id, nome, email, funcao, ativo, created_at FROM usuarios ORDER BY created_at');
    const usuarios = usuariosResult.rows;
    
    const config = {
      version: '1.0.0',
      exported_at: new Date().toISOString(),
      redirecionamentos: redirecionamentos,
      usuarios: usuarios,
      stats: includeStats ? await generateUsageReport() : null
    };
    
    res.json({
      success: true,
      data: config
    });
    
  } catch (error) {
    console.error('Error exporting configuration:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export configuration',
      message: error.message
    });
  }
});

/**
 * POST /api/export/config - Import configuration
 */
router.post('/config', async (req, res) => {
  try {
    const { redirecionamentos, usuarios } = req.body;
    
    if (!redirecionamentos || !usuarios) {
      return res.status(400).json({
        success: false,
        error: 'Invalid configuration format'
      });
    }
    
    // Por enquanto, apenas retorna sucesso
    // TODO: Implementar importação real
    res.json({
      success: true,
      message: 'Configuration import not yet implemented for PostgreSQL'
    });
    
  } catch (error) {
    console.error('Error importing configuration:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to import configuration',
      message: error.message
    });
  }
});

/**
 * POST /api/export/validate - Validate configuration file
 */
router.post('/validate', (req, res) => {
  try {
    const { redirecionamentos, usuarios } = req.body;
    
    const errors = [];
    
    if (!redirecionamentos || !Array.isArray(redirecionamentos)) {
      errors.push('Redirecionamentos must be an array');
    }
    
    if (!usuarios || !Array.isArray(usuarios)) {
      errors.push('Usuarios must be an array');
    }
    
    if (errors.length > 0) {
      return res.json({
        success: false,
        errors: errors
      });
    }
    
    res.json({
      success: true,
      message: 'Configuration is valid'
    });
    
  } catch (error) {
    console.error('Error validating configuration:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate configuration',
      message: error.message
    });
  }
});

module.exports = router;