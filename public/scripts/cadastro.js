document
  .getElementById("cadastroForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();
    const nome = document.getElementById("nomeCad").value.trim();
    const email = document.getElementById("emailCad").value.trim();
    const senha = document.getElementById("senhaCad").value.trim();

    const avatar = "";
    const msg = document.getElementById("mensagem-cad");
    msg.classList.remove("erro", "sucesso");
    msg.textContent = "";
    try {
      const resposta = await fetch("http://localhost:3001/cadastro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha, nome }),
      });
      const resultado = await resposta.json();
      if (resposta.ok) {
        msg.textContent = resultado.mensagem;
        msg.classList.add("sucesso");
        document.getElementById("cadastroForm").reset();
        window.location.href = "login.html";
      } else {
        msg.textContent = resultado.mensagem || "Erro ao cadastrar.";
        msg.classList.add("erro");
      }
    } catch (erro) {
      msg.textContent = "Erro de conexão. Tente novamente.";
      msg.classList.add("erro");
    }
  });
