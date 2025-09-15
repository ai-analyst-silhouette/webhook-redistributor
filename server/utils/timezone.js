/**
 * Utilitário para manipulação de timezone
 * Converte datas para o fuso horário brasileiro (America/Sao_Paulo)
 */

/**
 * Converte uma data para o fuso horário brasileiro
 * @param {Date} date - Data a ser convertida (opcional, usa data atual se não informada)
 * @returns {string} Data formatada no fuso horário brasileiro
 */
function toBrazilianTime(date = new Date()) {
  return date.toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
}

/**
 * Converte uma data para ISO string no fuso horário brasileiro
 * @param {Date} date - Data a ser convertida (opcional, usa data atual se não informada)
 * @returns {string} Data em formato ISO no fuso horário brasileiro
 */
function toBrazilianISOString(date = new Date()) {
  const brazilianDate = new Date(date.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
  return brazilianDate.toISOString();
}

/**
 * Obtém timestamp atual no fuso horário brasileiro
 * @returns {number} Timestamp em milissegundos
 */
function getBrazilianTimestamp() {
  return new Date().getTime();
}

/**
 * Converte timestamp para data brasileira
 * @param {number} timestamp - Timestamp em milissegundos
 * @returns {string} Data formatada no fuso horário brasileiro
 */
function timestampToBrazilian(timestamp) {
  return toBrazilianTime(new Date(timestamp));
}

module.exports = {
  toBrazilianTime,
  toBrazilianISOString,
  getBrazilianTimestamp,
  timestampToBrazilian
};
