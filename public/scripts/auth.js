const PUBLIC_PAGES = ["./login.html", "./cadastro.html"];
function parseJwt(token) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => `%${("00" + c.charCodeAt(0).toString(16)).slice(-2)}`)
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}
function isTokenValid(token) {
  const payload = parseJwt(token);
  if (!payload) return false;
  const now = Math.floor(Date.now() / 1000);
  return payload.exp && payload.exp > now;
}

(function () {
  const token = localStorage.getItem("token");
  const path = window.location.pathname;

  if (PUBLIC_PAGES.some((p) => path.endsWith(p))) {
    document.getElementById("user-info")?.style?.setProperty("display", "none");
    return;
  }

  if (!token || !isTokenValid(token)) {
    localStorage.removeItem("token");
    window.location.href = "./login.html";
    return;
  }

  const payload = parseJwt(token);
  const nameEl = document.getElementById("user-name");
  const avatarEl = document.getElementById("user-avatar");
  const userInfoEl = document.getElementById("user-info");
  if (nameEl) nameEl.textContent = payload.nome || "Usuário";
  if (avatarEl)
    avatarEl.src = payload.avatar || "./assets/img/default-avatar.png";
  if (userInfoEl) userInfoEl.style.display = "flex";
})();
