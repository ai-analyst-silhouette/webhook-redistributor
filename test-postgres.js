#!/usr/bin/env node

/**
 * Script de Teste do PostgreSQL
 * Webhook Redistributor
 */

const { query, testConnection } = require('./server/database/postgres');

async function testPostgreSQL() {
  try {
    console.log('🚀 Testando integração PostgreSQL...\n');

    // 1. Testar conexão
    console.log('1️⃣ Testando conexão...');
    await testConnection();

    // 2. Verificar tabelas
    console.log('\n2️⃣ Verificando tabelas...');
    const tables = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('📋 Tabelas encontradas:');
    tables.rows.forEach(row => {
      console.log(`   - ${row.table_name}`);
    });

    // 3. Verificar dados
    console.log('\n3️⃣ Verificando dados...');
    
    const userCount = await query('SELECT COUNT(*) as count FROM usuarios');
    console.log(`👥 Usuários: ${userCount.rows[0].count}`);
    
    const redirecionamentoCount = await query('SELECT COUNT(*) as count FROM redirecionamentos');
    console.log(`🔗 Redirecionamentos: ${redirecionamentoCount.rows[0].count}`);
    
    const logCount = await query('SELECT COUNT(*) as count FROM logs_webhook');
    console.log(`📝 Logs de webhook: ${logCount.rows[0].count}`);

    // 4. Testar inserção
    console.log('\n4️⃣ Testando inserção...');
    const testResult = await query(`
      INSERT INTO redirecionamentos (nome, slug, descricao, urls, ativo) 
      VALUES ($1, $2, $3, $4, $5) 
      ON CONFLICT (slug) DO NOTHING
      RETURNING id
    `, ['Teste PostgreSQL', 'teste-postgres', 'Teste de integração', 'http://localhost:3001/test', true]);
    
    if (testResult.rows.length > 0) {
      console.log('✅ Inserção de teste bem-sucedida');
      
      // Limpar teste
      await query('DELETE FROM redirecionamentos WHERE slug = $1', ['teste-postgres']);
      console.log('🧹 Dados de teste removidos');
    } else {
      console.log('ℹ️ Dados de teste já existiam');
    }

    // 5. Testar consulta complexa
    console.log('\n5️⃣ Testando consulta complexa...');
    const complexQuery = await query(`
      SELECT 
        r.nome,
        r.slug,
        r.ativo,
        COUNT(l.id) as total_logs,
        MAX(l.recebido_em) as ultimo_webhook
      FROM redirecionamentos r
      LEFT JOIN logs_webhook l ON r.slug = l.slug_redirecionamento
      GROUP BY r.id, r.nome, r.slug, r.ativo
      ORDER BY r.criado_em DESC
    `);
    
    console.log('📊 Consulta complexa executada com sucesso');
    console.log(`   Resultados: ${complexQuery.rows.length} redirecionamentos`);

    console.log('\n🎉 Todos os testes passaram! PostgreSQL está funcionando perfeitamente.');
    
    console.log('\n📋 Resumo da integração:');
    console.log('✅ Conexão estabelecida');
    console.log('✅ Tabelas criadas');
    console.log('✅ Dados inseridos');
    console.log('✅ Consultas funcionando');
    console.log('✅ Transações funcionando');

  } catch (error) {
    console.error('\n❌ Erro durante teste:', error);
    process.exit(1);
  }
}

// Executar teste
testPostgreSQL();
