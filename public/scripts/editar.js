document.addEventListener("DOMContentLoaded", function () {
  const formEdita = document.getElementById("editForm");
  const msg = document.getElementById("mensagemEdit");
  const cancelBtn = document.getElementById("cancelBtn");
  const deleteAccountBtn = document.getElementById("logoutBtn");

  if (!formEdita || !msg) {
    console.error("Erro: Elementos essenciais não foram encontrados no DOM.");
    return;
  }

  (function preencherCampos() {
    const token = localStorage.getItem("token");
    if (!token) {
      console.warn("Token não encontrado. Redirecionando para login...");
      window.location.href = "./login.html";
      return;
    }
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));

      document.getElementById("nomeEdit").value = payload.nome || "";

      const emailInput = document.getElementById("emailEdit");
      emailInput.value = payload.email || "";
      emailInput.dataset.originalEmail = payload.email || "";

      const deleteAccountBtn = document.getElementById("logoutBtn");
      if (deleteAccountBtn) {
        deleteAccountBtn.textContent = "❌ Excluir Conta";
      }
    } catch (error) {
      console.error("Erro ao decodificar token:", error);
      localStorage.removeItem("token");
      window.location.href = "./login.html";
    }
  })();

  formEdita.addEventListener("submit", async function (e) {
    e.preventDefault();
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "./login.html";
      return;
    }

    const emailInput = document.getElementById("emailEdit");
    const email = emailInput.value.trim();
    const emailOriginal = emailInput.dataset.originalEmail;
    const nome = document.getElementById("nomeEdit").value.trim();
    const senha = document.getElementById("senhaEdit").value.trim();

    msg.textContent = "";
    msg.className = "mensagem";

    if (!email) {
      msg.textContent = "O e-mail é obrigatório.";
      msg.classList.add("erro");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      msg.textContent = "Por favor, insira um e-mail válido.";
      msg.classList.add("erro");
      return;
    }

    const body = {
      emailOriginal: emailOriginal,
    };

    if (email !== emailOriginal) {
      body.email = email;
    }
    if (nome) {
      body.nome = nome;
    }
    if (senha) {
      body.senha = senha;
    }
    try {
      const response = await fetch("http://localhost:3001/editar", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, 
        },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (response.ok) {
        msg.textContent = data.mensagem || "Alterações salvas com sucesso!";
        msg.classList.add("sucesso");

        if (email !== emailOriginal) {
          msg.textContent +=
            " Você será redirecionado para fazer login com o novo e-mail.";
          setTimeout(() => {
            localStorage.removeItem("token");
            localStorage.removeItem("usuario");
            window.location.href = "./login.html";
          }, 2500);
        } else {
          try {
            const payload = JSON.parse(atob(token.split(".")[1]));
            const novoPayload = { ...payload };
            if (nome) novoPayload.nome = nome;

            const novoToken = `${btoa(
              JSON.stringify({ alg: "HS256", typ: "JWT" })
            )}.${btoa(JSON.stringify(novoPayload))}.mock_signature`;
            localStorage.setItem("token", novoToken);

            emailInput.dataset.originalEmail = email;
          } catch (error) {
            console.error("Erro ao atualizar token:", error);
          }
        }
      } else {
        msg.textContent = data.mensagem || "Erro ao salvar alterações.";
        msg.classList.add("erro");
      }
    } catch (error) {
      console.error("Falha na requisição:", error);
      msg.textContent = "Erro ao conectar com o servidor. Tente novamente.";
      msg.classList.add("erro");
    }
  });

  if (cancelBtn) {
    cancelBtn.addEventListener("click", function () {
      window.location.reload();
    });
  }

  if (deleteAccountBtn) {
    deleteAccountBtn.textContent = "Excluir Conta";
    deleteAccountBtn.addEventListener("click", async function () {
      const confirmar = confirm(
        "Tem certeza que deseja excluir sua conta? Esta ação é irreversível."
      );
      if (!confirmar) {
        return;
      }

      const email = document.getElementById("emailEdit").dataset.originalEmail;
      msg.textContent = "Excluindo conta...";
      msg.classList.add("erro");
      try {
        const response = await fetch("http://localhost:3001/excluir-conta", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: email }),
        });
        const data = await response.json();
        if (response.ok) {
          msg.textContent = "Conta excluída com sucesso! Redirecionando...";
          msg.classList.remove("erro");
          msg.classList.add("sucesso");

          setTimeout(() => {
            localStorage.removeItem("token");
            localStorage.removeItem("usuario");
            window.location.href = "./cadastro.html";
          }, 1500);
        } else {
          msg.textContent =
            data.mensagem || "Erro ao excluir a conta. Tente novamente.";
          msg.classList.add("erro");
        }
      } catch (error) {
        console.error("Falha na requisição de exclusão:", error);
        msg.textContent = "Erro de conexão com o servidor ao tentar excluir.";
        msg.classList.add("erro");
      }
    });
  }
});
