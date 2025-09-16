const { query } = require('../database/postgres');

/**
 * Utility functions for audit logging
 */

/**
 * Log an audit event
 * @param {Object} options - Audit log options
 * @param {number} options.usuario_id - User ID performing the action
 * @param {string} options.acao - Action performed (create, update, delete, login, logout, etc.)
 * @param {string} options.descricao - Description of the action
 * @param {string} options.recurso_tipo - Type of resource (redirecionamento, usuario, destino, etc.)
 * @param {number} options.recurso_id - ID of the resource
 * @param {string} options.ip - IP address of the user
 * @param {string} options.user_agent - User agent string
 * @param {Object} options.dados_anteriores - Previous data (for updates)
 * @param {Object} options.dados_novos - New data (for creates/updates)
 */
async function logAuditEvent({
  usuario_id,
  acao,
  descricao,
  recurso_tipo = null,
  recurso_id = null,
  ip = null,
  user_agent = null,
  dados_anteriores = null,
  dados_novos = null
}) {
  try {
    await query(`
      INSERT INTO audit_log (
        usuario_id, acao, descricao, recurso_tipo, recurso_id, 
        ip, user_agent, dados_anteriores, dados_novos
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [
      usuario_id,
      acao,
      descricao,
      recurso_tipo,
      recurso_id,
      ip,
      user_agent,
      dados_anteriores ? JSON.stringify(dados_anteriores) : null,
      dados_novos ? JSON.stringify(dados_novos) : null
    ]);
  } catch (error) {
    console.error('Erro ao registrar log de auditoria:', error);
    // Don't throw error to avoid breaking the main operation
  }
}

/**
 * Log user login
 */
async function logLogin(usuario_id, ip, user_agent) {
  await logAuditEvent({
    usuario_id,
    acao: 'login',
    descricao: 'Usuário fez login no sistema',
    ip,
    user_agent
  });
}

/**
 * Log user logout
 */
async function logLogout(usuario_id, ip, user_agent) {
  await logAuditEvent({
    usuario_id,
    acao: 'logout',
    descricao: 'Usuário fez logout do sistema',
    ip,
    user_agent
  });
}

/**
 * Log resource creation
 */
async function logCreate(usuario_id, recurso_tipo, recurso_id, descricao, dados_novos, ip, user_agent) {
  await logAuditEvent({
    usuario_id,
    acao: 'create',
    descricao,
    recurso_tipo,
    recurso_id,
    dados_novos,
    ip,
    user_agent
  });
}

/**
 * Log resource update
 */
async function logUpdate(usuario_id, recurso_tipo, recurso_id, descricao, dados_anteriores, dados_novos, ip, user_agent) {
  await logAuditEvent({
    usuario_id,
    acao: 'update',
    descricao,
    recurso_tipo,
    recurso_id,
    dados_anteriores,
    dados_novos,
    ip,
    user_agent
  });
}

/**
 * Log resource deletion
 */
async function logDelete(usuario_id, recurso_tipo, recurso_id, descricao, dados_anteriores, ip, user_agent) {
  await logAuditEvent({
    usuario_id,
    acao: 'delete',
    descricao,
    recurso_tipo,
    recurso_id,
    dados_anteriores,
    ip,
    user_agent
  });
}

/**
 * Log system action
 */
async function logSystemAction(usuario_id, acao, descricao, ip, user_agent) {
  await logAuditEvent({
    usuario_id,
    acao,
    descricao,
    ip,
    user_agent
  });
}

module.exports = {
  logAuditEvent,
  logLogin,
  logLogout,
  logCreate,
  logUpdate,
  logDelete,
  logSystemAction
};
