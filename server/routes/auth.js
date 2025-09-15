/**
 * Rotas de Autenticação
 * 
 * Este módulo gerencia todos os endpoints relacionados à autenticação:
 * - Login e logout de usuários
 * - Registro de usuários (apenas admin)
 * - Gerenciamento de perfil
 * 
 * @author Webhook Redistributor Team
 * @version 1.0.0
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const { db } = require('../database/init');
const messages = require('../config/messages');
const { 
  authenticateToken, 
  requireAdmin, 
  generateToken, 
  updateLastLogin,
  authRateLimiter,
  validatePassword,
  isIPBlocked,
  recordLoginAttempt,
  generateTemporaryPassword,
  clearIPBlock,
  clearAllBlocks
} = require('../middleware/auth');
const { requirePermission, auditLog } = require('../middleware/permissions');

const router = express.Router();

/**
 * POST /api/autenticacao/login
 * Autenticar usuário com email e senha
 */
router.post('/login', authRateLimiter, (req, res) => {
  const { email, password, rememberMe = false } = req.body;
  const clientIP = req.ip || req.connection.remoteAddress;

  // Verificar se o IP está bloqueado
  if (isIPBlocked(clientIP)) {
    return res.status(429).json({
      error: 'Muitas tentativas de login. Tente novamente em 15 minutos',
      code: 'IP_BLOCKED'
    });
  }

  // Validar entrada
  if (!email || !password) {
    recordLoginAttempt(clientIP, false);
    return res.status(400).json({
      error: messages.ERROR.MISSING_CREDENTIALS,
      code: 'MISSING_CREDENTIALS'
    });
  }

  // Buscar usuário por email usando tabela em português
  db.get(
    'SELECT id, nome, email, hash_senha, funcao, ativo FROM usuarios WHERE email = ?',
    [email],
    (err, user) => {
      if (err) {
        console.error('Erro no banco de dados durante login:', err);
        return res.status(500).json({
          error: messages.ERROR.DATABASE_ERROR,
          code: 'LOGIN_ERROR'
        });
      }

      if (!user) {
        recordLoginAttempt(clientIP, false);
        return res.status(401).json({
          error: messages.ERROR.INVALID_CREDENTIALS,
          code: 'INVALID_CREDENTIALS'
        });
      }

      if (!user.ativo) {
        recordLoginAttempt(clientIP, false);
        return res.status(401).json({
          error: messages.ERROR.ACCOUNT_DEACTIVATED,
          code: 'ACCOUNT_DEACTIVATED'
        });
      }

      // Verificar senha
      bcrypt.compare(password, user.hash_senha, (err, isMatch) => {
        if (err) {
          console.error('Erro na comparação de senha:', err);
          return res.status(500).json({
            error: messages.ERROR.DATABASE_ERROR,
            code: 'PASSWORD_ERROR'
          });
        }

        if (!isMatch) {
          recordLoginAttempt(clientIP, false);
          return res.status(401).json({
            error: messages.ERROR.INVALID_CREDENTIALS,
            code: 'INVALID_CREDENTIALS'
          });
        }

        // Login bem-sucedido
        recordLoginAttempt(clientIP, true);

        // Gerar token JWT
        const token = generateToken({
          id: user.id,
          email: user.email,
          role: user.funcao
        }, rememberMe);

        // Atualizar último login
        updateLastLogin(user.id);

        // Retornar resposta de sucesso
        res.json({
          success: true,
          message: messages.SUCCESS.LOGIN_SUCCESS,
          data: {
            token,
            user: {
              id: user.id,
              name: user.nome,
              email: user.email,
              role: user.funcao
            }
          }
        });
      });
    }
  );
});

/**
 * POST /api/autenticacao/registrar
 * Registrar novo usuário (apenas admin)
 */
router.post('/registrar', authenticateToken, requireAdmin, authRateLimiter, (req, res) => {
  const { name, email, password, role = 'user' } = req.body;

  // Validar entrada
  if (!name || !email || !password) {
    return res.status(400).json({
      error: messages.ERROR.MISSING_FIELDS,
      code: 'MISSING_FIELDS'
    });
  }

  // Validar formato do email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      error: messages.ERROR.INVALID_EMAIL,
      code: 'INVALID_EMAIL'
    });
  }

  // Validar força da senha
  if (password.length < 6) {
    return res.status(400).json({
      error: messages.ERROR.WEAK_PASSWORD,
      code: 'WEAK_PASSWORD'
    });
  }

  // Validar função
  if (!['admin', 'user'].includes(role)) {
    return res.status(400).json({
      error: messages.ERROR.INVALID_ROLE,
      code: 'INVALID_ROLE'
    });
  }

  // Verificar se usuário já existe usando tabela em português
  db.get('SELECT id FROM usuarios WHERE email = ?', [email], (err, existingUser) => {
    if (err) {
      console.error('Erro no banco de dados durante verificação de registro:', err);
      return res.status(500).json({
        error: messages.ERROR.DATABASE_ERROR,
        code: 'REGISTRATION_ERROR'
      });
    }

    if (existingUser) {
      return res.status(409).json({
        error: messages.ERROR.USER_EXISTS,
        code: 'USER_EXISTS'
      });
    }

    // Fazer hash da senha
    const saltRounds = 10;
    bcrypt.hash(password, saltRounds, (err, hashedPassword) => {
      if (err) {
        console.error('Erro ao fazer hash da senha:', err);
        return res.status(500).json({
          error: messages.ERROR.DATABASE_ERROR,
          code: 'HASH_ERROR'
        });
      }

      // Criar usuário usando tabela em português
      db.run(
        'INSERT INTO usuarios (nome, email, hash_senha, funcao) VALUES (?, ?, ?, ?)',
        [name, email, hashedPassword, role],
        function(err) {
          if (err) {
            console.error('Erro no banco de dados durante criação do usuário:', err);
            return res.status(500).json({
              error: messages.ERROR.DATABASE_ERROR,
              code: 'CREATION_ERROR'
            });
          }

          res.status(201).json({
            message: messages.SUCCESS.USER_CREATED,
            user: {
              id: this.lastID,
              name,
              email,
              role
            }
          });
        }
      );
    });
  });
});

/**
 * POST /api/autenticacao/logout
 * Logout do usuário (remoção do token no lado do cliente)
 */
router.post('/logout', authenticateToken, (req, res) => {
  res.json({
    message: messages.SUCCESS.LOGOUT_SUCCESS
  });
});

/**
 * GET /api/autenticacao/perfil
 * Obter informações do perfil do usuário atual
 */
router.get('/perfil', authenticateToken, (req, res) => {
  res.json({
    user: req.user
  });
});

/**
 * PUT /api/autenticacao/perfil
 * Atualizar informações do perfil do usuário atual
 */
router.put('/perfil', authenticateToken, (req, res) => {
  const { name, email } = req.body;
  const userId = req.user.id;

  // Validar entrada
  if (!name || !email) {
    return res.status(400).json({
      error: messages.ERROR.MISSING_FIELDS,
      code: 'MISSING_FIELDS'
    });
  }

  // Validar formato do email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      error: messages.ERROR.INVALID_EMAIL,
      code: 'INVALID_EMAIL'
    });
  }

  // Verificar se email já está sendo usado por outro usuário
  db.get(
    'SELECT id FROM usuarios WHERE email = ? AND id != ?',
    [email, userId],
    (err, existingUser) => {
      if (err) {
        console.error('Erro no banco de dados durante verificação de email:', err);
        return res.status(500).json({
          error: messages.ERROR.DATABASE_ERROR,
          code: 'UPDATE_ERROR'
        });
      }

      if (existingUser) {
        return res.status(409).json({
          error: messages.ERROR.EMAIL_TAKEN,
          code: 'EMAIL_TAKEN'
        });
      }

      // Atualizar perfil do usuário
      db.run(
        'UPDATE usuarios SET nome = ?, email = ? WHERE id = ?',
        [name, email, userId],
        function(err) {
          if (err) {
            console.error('Erro no banco de dados durante atualização do perfil:', err);
            return res.status(500).json({
              error: messages.ERROR.DATABASE_ERROR,
              code: 'UPDATE_ERROR'
            });
          }

          res.json({
            message: messages.SUCCESS.PROFILE_UPDATED,
            user: {
              id: userId,
              name,
              email,
              role: req.user.role
            }
          });
        }
      );
    }
  );
});

/**
 * PUT /api/autenticacao/alterar-senha
 * Alterar senha do usuário atual
 */
router.put('/alterar-senha', authenticateToken, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  // Validar entrada
  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      error: messages.ERROR.MISSING_FIELDS,
      code: 'MISSING_FIELDS'
    });
  }

  // Validar força da nova senha
  if (newPassword.length < 6) {
    return res.status(400).json({
      error: messages.ERROR.WEAK_PASSWORD,
      code: 'WEAK_PASSWORD'
    });
  }

  // Obter hash da senha atual do usuário
  db.get(
    'SELECT hash_senha FROM usuarios WHERE id = ?',
    [userId],
    (err, user) => {
      if (err) {
        console.error('Erro no banco de dados durante alteração de senha:', err);
        return res.status(500).json({
          error: messages.ERROR.DATABASE_ERROR,
          code: 'PASSWORD_CHANGE_ERROR'
        });
      }

      if (!user) {
        return res.status(404).json({
          error: messages.ERROR.USER_NOT_FOUND,
          code: 'USER_NOT_FOUND'
        });
      }

      // Verificar senha atual
      bcrypt.compare(currentPassword, user.hash_senha, (err, isMatch) => {
        if (err) {
          console.error('Erro na comparação de senha:', err);
          return res.status(500).json({
            error: messages.ERROR.DATABASE_ERROR,
            code: 'PASSWORD_ERROR'
          });
        }

        if (!isMatch) {
          return res.status(401).json({
            error: messages.ERROR.INVALID_CURRENT_PASSWORD,
            code: 'INVALID_CURRENT_PASSWORD'
          });
        }

        // Fazer hash da nova senha
        const saltRounds = 10;
        bcrypt.hash(newPassword, saltRounds, (err, hashedPassword) => {
          if (err) {
            console.error('Erro ao fazer hash da senha:', err);
            return res.status(500).json({
              error: messages.ERROR.DATABASE_ERROR,
              code: 'HASH_ERROR'
            });
          }

          // Atualizar senha
          db.run(
            'UPDATE usuarios SET hash_senha = ? WHERE id = ?',
            [hashedPassword, userId],
            function(err) {
              if (err) {
                console.error('Erro no banco de dados durante atualização da senha:', err);
                return res.status(500).json({
                  error: messages.ERROR.DATABASE_ERROR,
                  code: 'UPDATE_ERROR'
                });
              }

              res.json({
                message: messages.SUCCESS.PASSWORD_CHANGED
              });
            }
          );
        });
      });
    }
  );
});

// ========================================
// ROTAS DE GERENCIAMENTO DE USUÁRIOS
// ========================================

// Listar todos os usuários (apenas admin)
router.get('/users', authenticateToken, requireAdmin, auditLog('listar_usuarios', 'Listando usuários do sistema'), (req, res) => {
  db.all(
    'SELECT id, nome, email, funcao, ativo, ultimo_login, criado_em FROM usuarios ORDER BY criado_em DESC',
    [],
    (err, users) => {
      if (err) {
        console.error('Erro ao buscar usuários:', err);
        return res.status(500).json({
          error: messages.ERROR.DATABASE_ERROR,
          code: 'USERS_FETCH_ERROR'
        });
      }

      res.json({
        success: true,
        data: users
      });
    }
  );
});

// Criar novo usuário (apenas admin)
router.post('/users', authenticateToken, requireAdmin, auditLog('criar_usuario', 'Criando novo usuário', 'usuario'), (req, res) => {
  const { nome, email, password, role } = req.body;

  // Validações
  if (!nome || !email || !password) {
    return res.status(400).json({
      error: 'Nome, e-mail e senha são obrigatórios',
      code: 'MISSING_FIELDS'
    });
  }

  if (!['admin', 'user'].includes(role)) {
    return res.status(400).json({
      error: 'Tipo de usuário deve ser "admin" ou "user"',
      code: 'INVALID_ROLE'
    });
  }

  // Verificar se email já existe
  db.get(
    'SELECT id FROM usuarios WHERE email = ?',
    [email],
    (err, existingUser) => {
      if (err) {
        console.error('Erro ao verificar email existente:', err);
        return res.status(500).json({
          error: messages.ERROR.DATABASE_ERROR,
          code: 'EMAIL_CHECK_ERROR'
        });
      }

      if (existingUser) {
        return res.status(400).json({
          error: 'E-mail já está em uso',
          code: 'EMAIL_EXISTS'
        });
      }

      // Hash da senha
      bcrypt.hash(password, 10, (err, hash) => {
        if (err) {
          console.error('Erro ao gerar hash da senha:', err);
          return res.status(500).json({
            error: messages.ERROR.DATABASE_ERROR,
            code: 'PASSWORD_HASH_ERROR'
          });
        }

        // Inserir usuário
        db.run(
          'INSERT INTO usuarios (nome, email, hash_senha, funcao, ativo, criado_em) VALUES (?, ?, ?, ?, 1, CURRENT_TIMESTAMP)',
          [nome, email, hash, role],
          function(err) {
            if (err) {
              console.error('Erro ao criar usuário:', err);
              return res.status(500).json({
                error: messages.ERROR.DATABASE_ERROR,
                code: 'USER_CREATE_ERROR'
              });
            }

            res.status(201).json({
              success: true,
              message: 'Usuário criado com sucesso',
              data: {
                id: this.lastID,
                nome,
                email,
                role,
                ativo: true
              }
            });
          }
        );
      });
    }
  );
});

// Atualizar usuário (apenas admin)
router.put('/users/:id', authenticateToken, requireAdmin, auditLog('editar_usuario', 'Editando usuário', 'usuario'), (req, res) => {
  const { id } = req.params;
  const { nome, email, role, password } = req.body;

  // Validações
  if (!nome || !email) {
    return res.status(400).json({
      error: 'Nome e e-mail são obrigatórios',
      code: 'MISSING_FIELDS'
    });
  }

  if (role && !['admin', 'user'].includes(role)) {
    return res.status(400).json({
      error: 'Tipo de usuário deve ser "admin" ou "user"',
      code: 'INVALID_ROLE'
    });
  }

  // Verificar se usuário existe
  db.get(
    'SELECT id, email FROM usuarios WHERE id = ?',
    [id],
    (err, user) => {
      if (err) {
        console.error('Erro ao buscar usuário:', err);
        return res.status(500).json({
          error: messages.ERROR.DATABASE_ERROR,
          code: 'USER_FETCH_ERROR'
        });
      }

      if (!user) {
        return res.status(404).json({
          error: 'Usuário não encontrado',
          code: 'USER_NOT_FOUND'
        });
      }

      // Verificar se email já existe em outro usuário
      db.get(
        'SELECT id FROM usuarios WHERE email = ? AND id != ?',
        [email, id],
        (err, existingUser) => {
          if (err) {
            console.error('Erro ao verificar email existente:', err);
            return res.status(500).json({
              error: messages.ERROR.DATABASE_ERROR,
              code: 'EMAIL_CHECK_ERROR'
            });
          }

          if (existingUser) {
            return res.status(400).json({
              error: 'E-mail já está em uso por outro usuário',
              code: 'EMAIL_EXISTS'
            });
          }

          // Preparar query de atualização
          let updateQuery = 'UPDATE usuarios SET nome = ?, email = ?';
          let params = [nome, email];

          if (role) {
            updateQuery += ', funcao = ?';
            params.push(role);
          }

          if (password) {
            // Hash da nova senha
            bcrypt.hash(password, 10, (err, hash) => {
              if (err) {
                console.error('Erro ao gerar hash da senha:', err);
                return res.status(500).json({
                  error: messages.ERROR.DATABASE_ERROR,
                  code: 'PASSWORD_HASH_ERROR'
                });
              }

              updateQuery += ', hash_senha = ?';
              params.push(hash);
              params.push(id);

              db.run(updateQuery, params, function(err) {
                if (err) {
                  console.error('Erro ao atualizar usuário:', err);
                  return res.status(500).json({
                    error: messages.ERROR.DATABASE_ERROR,
                    code: 'USER_UPDATE_ERROR'
                  });
                }

                res.json({
                  success: true,
                  message: 'Usuário atualizado com sucesso',
                  data: {
                    id: parseInt(id),
                    nome,
                    email,
                    role: role || 'user'
                  }
                });
              });
            });
          } else {
            // Sem senha, apenas atualizar outros campos
            params.push(id);
            db.run(updateQuery, params, function(err) {
              if (err) {
                console.error('Erro ao atualizar usuário:', err);
                return res.status(500).json({
                  error: messages.ERROR.DATABASE_ERROR,
                  code: 'USER_UPDATE_ERROR'
                });
              }

              res.json({
                success: true,
                message: 'Usuário atualizado com sucesso',
                data: {
                  id: parseInt(id),
                  nome,
                  email,
                  role: role || 'user'
                }
              });
            });
          }
        }
      );
    }
  );
});

// Ativar/Desativar usuário (apenas admin)
router.put('/users/:id/status', authenticateToken, requireAdmin, auditLog('alterar_status_usuario', 'Alterando status do usuário', 'usuario'), (req, res) => {
  const { id } = req.params;
  const { ativo } = req.body;

  if (typeof ativo !== 'boolean') {
    return res.status(400).json({
      error: 'Status deve ser true ou false',
      code: 'INVALID_STATUS'
    });
  }

  db.run(
    'UPDATE usuarios SET ativo = ? WHERE id = ?',
    [ativo ? 1 : 0, id],
    function(err) {
      if (err) {
        console.error('Erro ao atualizar status do usuário:', err);
        return res.status(500).json({
          error: messages.ERROR.DATABASE_ERROR,
          code: 'USER_STATUS_UPDATE_ERROR'
        });
      }

      if (this.changes === 0) {
        return res.status(404).json({
          error: 'Usuário não encontrado',
          code: 'USER_NOT_FOUND'
        });
      }

      res.json({
        success: true,
        message: `Usuário ${ativo ? 'ativado' : 'desativado'} com sucesso`
      });
    }
  );
});

// Deletar usuário (apenas admin)
router.delete('/users/:id', authenticateToken, requireAdmin, auditLog('excluir_usuario', 'Excluindo usuário', 'usuario'), (req, res) => {
  const { id } = req.params;

  // Não permitir deletar o próprio usuário
  if (parseInt(id) === req.user.id) {
    return res.status(400).json({
      error: 'Você não pode deletar seu próprio usuário',
      code: 'CANNOT_DELETE_SELF'
    });
  }

  db.run(
    'DELETE FROM usuarios WHERE id = ?',
    [id],
    function(err) {
      if (err) {
        console.error('Erro ao deletar usuário:', err);
        return res.status(500).json({
          error: messages.ERROR.DATABASE_ERROR,
          code: 'USER_DELETE_ERROR'
        });
      }

      if (this.changes === 0) {
        return res.status(404).json({
          error: 'Usuário não encontrado',
          code: 'USER_NOT_FOUND'
        });
      }

      res.json({
        success: true,
        message: 'Usuário deletado com sucesso'
      });
    }
  );
});

/**
 * PUT /api/autenticacao/change-password
 * Alterar senha do usuário logado
 */
router.put('/change-password', authenticateToken, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  // Validar entrada
  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      error: 'Senha atual e nova senha são obrigatórias',
      code: 'MISSING_PASSWORDS'
    });
  }

  // Validar nova senha
  const passwordValidation = validatePassword(newPassword);
  if (!passwordValidation.valid) {
    return res.status(400).json({
      error: passwordValidation.message,
      code: 'INVALID_PASSWORD'
    });
  }

  // Buscar usuário atual
  db.get(
    'SELECT hash_senha FROM usuarios WHERE id = ?',
    [userId],
    (err, user) => {
      if (err) {
        console.error('Erro ao buscar usuário:', err);
        return res.status(500).json({
          error: messages.ERROR.DATABASE_ERROR,
          code: 'USER_FETCH_ERROR'
        });
      }

      if (!user) {
        return res.status(404).json({
          error: 'Usuário não encontrado',
          code: 'USER_NOT_FOUND'
        });
      }

      // Verificar senha atual
      bcrypt.compare(currentPassword, user.hash_senha, (err, isMatch) => {
        if (err) {
          console.error('Erro na comparação de senha:', err);
          return res.status(500).json({
            error: messages.ERROR.DATABASE_ERROR,
            code: 'PASSWORD_ERROR'
          });
        }

        if (!isMatch) {
          return res.status(401).json({
            error: 'Senha atual incorreta',
            code: 'INVALID_CURRENT_PASSWORD'
          });
        }

        // Criptografar nova senha
        bcrypt.hash(newPassword, 10, (err, hashedPassword) => {
          if (err) {
            console.error('Erro ao criptografar nova senha:', err);
            return res.status(500).json({
              error: messages.ERROR.DATABASE_ERROR,
              code: 'PASSWORD_HASH_ERROR'
            });
          }

          // Atualizar senha no banco
          db.run(
            'UPDATE usuarios SET hash_senha = ? WHERE id = ?',
            [hashedPassword, userId],
            (err) => {
              if (err) {
                console.error('Erro ao atualizar senha:', err);
                return res.status(500).json({
                  error: messages.ERROR.DATABASE_ERROR,
                  code: 'PASSWORD_UPDATE_ERROR'
                });
              }

              res.json({
                success: true,
                message: 'Senha alterada com sucesso'
              });
            }
          );
        });
      });
    }
  );
});

/**
 * POST /api/autenticacao/forgot-password
 * Esqueci minha senha - gera nova senha temporária
 */
router.post('/forgot-password', authRateLimiter, (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      error: 'Email é obrigatório',
      code: 'MISSING_EMAIL'
    });
  }

  // Buscar usuário por email
  db.get(
    'SELECT id, nome, email FROM usuarios WHERE email = ? AND ativo = 1',
    [email],
    (err, user) => {
      if (err) {
        console.error('Erro ao buscar usuário:', err);
        return res.status(500).json({
          error: messages.ERROR.DATABASE_ERROR,
          code: 'USER_FETCH_ERROR'
        });
      }

      if (!user) {
        // Por segurança, não revelar se o email existe ou não
        return res.json({
          success: true,
          message: 'Se o email existir, uma nova senha temporária foi enviada'
        });
      }

      // Gerar senha temporária
      const tempPassword = generateTemporaryPassword();
      
      // Criptografar nova senha
      bcrypt.hash(tempPassword, 10, (err, hashedPassword) => {
        if (err) {
          console.error('Erro ao criptografar senha temporária:', err);
          return res.status(500).json({
            error: messages.ERROR.DATABASE_ERROR,
            code: 'PASSWORD_HASH_ERROR'
          });
        }

        // Atualizar senha no banco
        db.run(
          'UPDATE usuarios SET hash_senha = ? WHERE id = ?',
          [hashedPassword, user.id],
          (err) => {
            if (err) {
              console.error('Erro ao atualizar senha temporária:', err);
              return res.status(500).json({
                error: messages.ERROR.DATABASE_ERROR,
                code: 'PASSWORD_UPDATE_ERROR'
              });
            }

            // Em produção, aqui você enviaria um email com a nova senha
            console.log(`Nova senha temporária para ${user.email}: ${tempPassword}`);

            res.json({
              success: true,
              message: 'Nova senha temporária gerada com sucesso',
              data: {
                tempPassword: tempPassword // Em produção, remover esta linha
              }
            });
          }
        );
      });
    }
  );
});

/**
 * POST /api/autenticacao/clear-blocks
 * Limpar todos os bloqueios de IP (apenas para desenvolvimento)
 */
router.post('/clear-blocks', (req, res) => {
  clearAllBlocks();
  res.json({
    success: true,
    message: 'Todos os bloqueios de IP foram limpos'
  });
});

module.exports = router;