const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const jwt = require("jsonwebtoken");

const app = express();
app.use(cors());
app.use(express.json());

app.use(express.static("public"));
app.use("/assets", express.static("assets"));

const JWT_SECRET = process.env.JWT_SECRET || "sua_chave_secreta_aqui";
const JWT_EXPIRES_IN = "2h";

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root",
  database: "cadastro_usuarios",
});
db.connect((err) => {
  if (err) {
    console.error("Erro ao conectar no MySQL:", err);
    process.exit(1);
  }
  console.log("Conectado ao banco de dados MySQL!");
});

function gerarToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

app.post("/cadastro", (req, res) => {
  const { email, senha, nome, avatar } = req.body;
  if (!email || !senha || !nome) {
    return res.status(400).json({ mensagem: "Preencha e‑mail, senha e nome." });
  }
  const sql =
    "INSERT INTO usuarios (email, senha, nome, avatar) VALUES (?, ?, ?, ?)";
  db.query(sql, [email, senha, nome, avatar || null], (err) => {
    if (err) {
      console.error("Erro ao cadastrar:", err);
      return res.status(500).json({ mensagem: "Erro ao cadastrar usuário." });
    }
    res.status(200).json({ mensagem: "Usuário cadastrado com sucesso!" });
  });
});

app.post("/login", (req, res) => {
  const { email, senha } = req.body;
  if (!email || !senha) {
    return res.status(400).json({ mensagem: "Preencha e‑mail e senha." });
  }
  const sql =
    "SELECT id, email, nome, avatar FROM usuarios WHERE email = ? AND senha = ?";
  db.query(sql, [email, senha], (err, resultados) => {
    if (err) {
      console.error("Erro ao logar:", err);
      return res.status(500).json({ mensagem: "Erro ao efetuar login." });
    }
    if (resultados.length === 0) {
      return res.status(401).json({ mensagem: "E‑mail ou senha inválidos." });
    }
    const usuario = resultados[0];
    const token = gerarToken({
      id: usuario.id,
      email: usuario.email,
      nome: usuario.nome,
      avatar: usuario.avatar,
    });
    res.status(200).json({
      mensagem: "Login bem‑sucedido!",
      token,
      usuario: {
        email: usuario.email,
        nome: usuario.nome,
        avatar: usuario.avatar,
      },
    });
  });
});

app.put("/editar", (req, res) => {
  const { emailOriginal, email, senha, nome, avatar } = req.body;

  if (!emailOriginal) {
    return res
      .status(400)
      .json({ mensagem: "E‑mail original é obrigatório para identificação." });
  }

  const campos = [];
  const valores = [];

  if (email && email !== emailOriginal) {
    const checkEmailSql =
      "SELECT id FROM usuarios WHERE email = ? AND email != ?";
    db.query(checkEmailSql, [email, emailOriginal], (err, results) => {
      if (err) {
        console.error("Erro ao verificar email:", err);
        return res
          .status(500)
          .json({ mensagem: "Erro ao verificar disponibilidade do e‑mail." });
      }
      if (results.length > 0) {
        return res
          .status(409)
          .json({ mensagem: "Este e‑mail já está em uso por outra conta." });
      }

      campos.push("email = ?");
      valores.push(email);

      adicionarOutrosCamposEAtualizar();
    });
    return;
  }

  adicionarOutrosCamposEAtualizar();
  function adicionarOutrosCamposEAtualizar() {
    if (senha) {
      campos.push("senha = ?");
      valores.push(senha);
    }
    if (nome) {
      campos.push("nome = ?");
      valores.push(nome);
    }
    if (avatar !== undefined) {
      campos.push("avatar = ?");
      valores.push(avatar);
    }
    if (campos.length === 0) {
      return res.status(400).json({ mensagem: "Nenhum campo para atualizar." });
    }
    const sql = `UPDATE usuarios SET ${campos.join(", ")} WHERE email = ?`;
    valores.push(emailOriginal);
    db.query(sql, valores, (err, result) => {
      if (err) {
        console.error("Erro ao editar:", err);

        if (err.code === "ER_DUP_ENTRY") {
          return res
            .status(409)
            .json({ mensagem: "Este e‑mail já está em uso." });
        }

        return res.status(500).json({ mensagem: "Erro ao atualizar dados." });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ mensagem: "Usuário não encontrado." });
      }

      res.json({
        mensagem: "Dados atualizados com sucesso!",
        emailAlterado: email && email !== emailOriginal,
      });
    });
  }
});

app.delete("/excluir-conta", (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res
      .status(400)
      .json({ mensagem: "E‑mail é obrigatório para exclusão." });
  }
  const sql = "DELETE FROM usuarios WHERE email = ?";
  db.query(sql, [email], (err, result) => {
    if (err) {
      console.error("Erro ao excluir conta:", err);
      return res.status(500).json({ mensagem: "Erro ao excluir a conta." });
    }
    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ mensagem: "Usuário não encontrado para exclusão." });
    }
    res.status(200).json({ mensagem: "Conta excluída com sucesso." });
  });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
