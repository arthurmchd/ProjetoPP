document.addEventListener("DOMContentLoaded", function () {
  const loginForm = document.getElementById("loginForm");

  if (!loginForm) {
    console.error(
      "Erro: Formulário de login com ID 'loginForm' não foi encontrado."
    );
    return; 
  }
  loginForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    const email = document.getElementById("emailLogin").value.trim();
    const senha = document.getElementById("senhaLogin").value.trim();
    const nome = document.getElementById("nomeLogin").value.trim(); // opcional

    const msg = document.getElementById("mensagemLogin");

    msg.classList.remove("erro", "sucesso");
    msg.textContent = "";

    if (!email || !senha) {
      msg.textContent = "Por favor, preencha o e-mail e a senha.";
      msg.classList.add("erro");
      return;
    }
    try {
      const resposta = await fetch("http://localhost:3001/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha, nome }),
      });
      const resultado = await resposta.json();
      if (resposta.ok) {
        localStorage.setItem("token", resultado.token);
        localStorage.setItem("usuario", JSON.stringify(resultado.usuario));
        msg.textContent = resultado.mensagem;
        msg.classList.add("sucesso");

        setTimeout(() => {
          window.location.href = "./index.html";
        }, 1000);
      } else {
        msg.textContent = resultado.mensagem || "Erro ao fazer login.";
        msg.classList.add("erro");
      }
    } catch (erro) {
      console.error("Falha na requisição de login:", erro);
      msg.textContent =
        "Erro de conexão com o servidor. Tente novamente mais tarde.";
      msg.classList.add("erro");
    }
  });
});
