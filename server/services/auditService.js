const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database file path
const DB_PATH = path.join(__dirname, '../database/webhook_redistributor.db');

/**
 * Serviço de Auditoria
 * Gerencia logs de auditoria para rastrear ações dos usuários
 */
class AuditService {
  constructor() {
    this.db = new sqlite3.Database(DB_PATH);
  }

  /**
   * Registra uma ação de auditoria
   * @param {Object} auditData - Dados da auditoria
   * @param {number} auditData.usuario_id - ID do usuário
   * @param {string} auditData.acao - Ação realizada
   * @param {string} auditData.descricao - Descrição da ação
   * @param {string} auditData.recurso_tipo - Tipo do recurso (opcional)
   * @param {number} auditData.recurso_id - ID do recurso (opcional)
   * @param {string} auditData.ip - IP do usuário (opcional)
   * @param {string} auditData.user_agent - User Agent (opcional)
   * @returns {Promise<number>} - ID do log criado
   */
  async logAction(auditData) {
    return new Promise((resolve, reject) => {
      const {
        usuario_id,
        acao,
        descricao,
        recurso_tipo = null,
        recurso_id = null,
        ip = null,
        user_agent = null
      } = auditData;

      const sql = `
        INSERT INTO audit_log 
        (usuario_id, acao, descricao, recurso_tipo, recurso_id, ip, user_agent)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      this.db.run(sql, [usuario_id, acao, descricao, recurso_tipo, recurso_id, ip, user_agent], function(err) {
        if (err) {
          console.error('Erro ao registrar log de auditoria:', err);
          reject(err);
        } else {
          console.log(`🔍 AUDIT LOG: ${acao} - ${descricao} (Usuário: ${usuario_id})`);
          resolve(this.lastID);
        }
      });
    });
  }

  /**
   * Busca logs de auditoria com filtros
   * @param {Object} filters - Filtros de busca
   * @param {number} filters.usuario_id - ID do usuário (opcional)
   * @param {string} filters.acao - Ação específica (opcional)
   * @param {string} filters.recurso_tipo - Tipo de recurso (opcional)
   * @param {Date} filters.data_inicio - Data de início (opcional)
   * @param {Date} filters.data_fim - Data de fim (opcional)
   * @param {number} filters.limit - Limite de resultados (padrão: 100)
   * @param {number} filters.offset - Offset para paginação (padrão: 0)
   * @returns {Promise<Array>} - Lista de logs de auditoria
   */
  async getAuditLogs(filters = {}) {
    return new Promise((resolve, reject) => {
      let sql = `
        SELECT 
          al.*,
          u.nome as usuario_nome,
          u.email as usuario_email
        FROM audit_log al
        LEFT JOIN usuarios u ON al.usuario_id = u.id
        WHERE 1=1
      `;
      
      const params = [];

      if (filters.usuario_id) {
        sql += ' AND al.usuario_id = ?';
        params.push(filters.usuario_id);
      }

      if (filters.acao) {
        sql += ' AND al.acao = ?';
        params.push(filters.acao);
      }

      if (filters.recurso_tipo) {
        sql += ' AND al.recurso_tipo = ?';
        params.push(filters.recurso_tipo);
      }

      if (filters.data_inicio) {
        sql += ' AND al.timestamp >= ?';
        params.push(filters.data_inicio.toISOString());
      }

      if (filters.data_fim) {
        sql += ' AND al.timestamp <= ?';
        params.push(filters.data_fim.toISOString());
      }

      sql += ' ORDER BY al.timestamp DESC';
      
      const limit = filters.limit || 100;
      const offset = filters.offset || 0;
      sql += ' LIMIT ? OFFSET ?';
      params.push(limit, offset);

      this.db.all(sql, params, (err, rows) => {
        if (err) {
          console.error('Erro ao buscar logs de auditoria:', err);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  /**
   * Busca estatísticas de auditoria
   * @param {Object} filters - Filtros de busca
   * @returns {Promise<Object>} - Estatísticas de auditoria
   */
  async getAuditStats(filters = {}) {
    return new Promise((resolve, reject) => {
      let sql = `
        SELECT 
          COUNT(*) as total_acoes,
          COUNT(DISTINCT usuario_id) as usuarios_ativos,
          COUNT(CASE WHEN DATE(timestamp) = DATE('now') THEN 1 END) as acoes_hoje,
          COUNT(CASE WHEN DATE(timestamp) >= DATE('now', '-7 days') THEN 1 END) as acoes_semana
        FROM audit_log al
        WHERE 1=1
      `;
      
      const params = [];

      if (filters.usuario_id) {
        sql += ' AND al.usuario_id = ?';
        params.push(filters.usuario_id);
      }

      if (filters.data_inicio) {
        sql += ' AND al.timestamp >= ?';
        params.push(filters.data_inicio.toISOString());
      }

      if (filters.data_fim) {
        sql += ' AND al.timestamp <= ?';
        params.push(filters.data_fim.toISOString());
      }

      this.db.get(sql, params, (err, row) => {
        if (err) {
          console.error('Erro ao buscar estatísticas de auditoria:', err);
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  /**
   * Busca ações mais comuns
   * @param {Object} filters - Filtros de busca
   * @param {number} limit - Limite de resultados (padrão: 10)
   * @returns {Promise<Array>} - Lista de ações mais comuns
   */
  async getTopActions(filters = {}, limit = 10) {
    return new Promise((resolve, reject) => {
      let sql = `
        SELECT 
          acao,
          COUNT(*) as total,
          MAX(timestamp) as ultima_acao
        FROM audit_log al
        WHERE 1=1
      `;
      
      const params = [];

      if (filters.usuario_id) {
        sql += ' AND al.usuario_id = ?';
        params.push(filters.usuario_id);
      }

      if (filters.data_inicio) {
        sql += ' AND al.timestamp >= ?';
        params.push(filters.data_inicio.toISOString());
      }

      if (filters.data_fim) {
        sql += ' AND al.timestamp <= ?';
        params.push(filters.data_fim.toISOString());
      }

      sql += ' GROUP BY acao ORDER BY total DESC LIMIT ?';
      params.push(limit);

      this.db.all(sql, params, (err, rows) => {
        if (err) {
          console.error('Erro ao buscar ações mais comuns:', err);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  /**
   * Fecha a conexão com o banco de dados
   */
  close() {
    this.db.close();
  }
}

module.exports = new AuditService();
