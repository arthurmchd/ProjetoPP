document.addEventListener("DOMContentLoaded", function () {
  const productList =
    document.getElementById("product-list") ||
    document.getElementById("favorites-list");
  const isFavoritesPage = productList.id === "favorites-list";
  const totalCostElement = document.getElementById("total-cost");
  const customItemForm = document.getElementById("custom-item-form");
  const noFavoritesMessage = document.getElementById("no-favorites-message");

  const TARIFA_KWH = 1.17;
  const DIAS_MES = 30;

  function getFavorites() {
    return JSON.parse(localStorage.getItem("favorites") || "[]");
  }
  function setFavorites(favorites) {
    localStorage.setItem("favorites", JSON.stringify(favorites));
  }
  function getCustomProducts() {
    return JSON.parse(localStorage.getItem("customProducts") || "[]");
  }
  function setCustomProducts(products) {
    localStorage.setItem("customProducts", JSON.stringify(products));
  }

  function calculateCost(potenciaW, horasDia) {
    const consumoKWhDia = (potenciaW * horasDia) / 1000;
    const custoDia = consumoKWhDia * TARIFA_KWH;
    const custoMes = custoDia * DIAS_MES;
    return { custoDia, custoMes };
  }
  function updateGlobalCost() {
    if (!totalCostElement) return;
    let totalCost = 0;

    const allProducts = Array.from(
      productList.querySelectorAll(".item-card")
    ).map((card) => {
      const id = card.dataset.id;
      const potencia = parseFloat(card.dataset.potencia);
      const horas = parseFloat(card.querySelector(".hours-input").value) || 0;
      return { id, potencia, horas };
    });
    allProducts.forEach((product) => {
      if (!isFavoritesPage || getFavorites().includes(product.id)) {
        totalCost += calculateCost(product.potencia, product.horas).custoDia;
      }
    });
    const totalCostMensal = totalCost * DIAS_MES;
    totalCostElement.textContent = totalCostMensal.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function createProductCard(product, isCustom = false) {
    const isFavorite = getFavorites().includes(product.id);
    const card = document.createElement("article");
    card.className = "item-card";
    card.dataset.id = product.id;
    card.dataset.potencia = product.potencia_w;
    card.dataset.isCustom = isCustom;

    const initialHours = product.horas_dia || 0;
    const { custoDia: initialCostDay, custoMes: initialCostMonth } =
      calculateCost(product.potencia_w, initialHours);

    const deleteButton = isCustom
      ? `<button class="delete-btn" aria-label="Excluir produto personalizado">🗑️</button>`
      : "";
    card.innerHTML = `
      <div class="card-header">
        <img src="${
          product.imagem || "./assets/img/default-product.png"
        }" alt="${product.nome}" class="item-img img-${product.id}">
        ${deleteButton}
        <button class="favorite-btn" aria-label="Adicionar aos favoritos">
          ${isFavorite ? "★" : "☆"}
        </button>
      </div>
      <div class="item-info">
        <span class="item-nome">${product.nome}</span>
        <p class="item-potencia">Potência: ${product.potencia_w} W</p>
        
        <div class="daily-cost-container">
          <label for="horas-${product.id}">Horas/Dia:</label>
          <input type="number" id="horas-${
            product.id
          }" class="hours-input" min="0" max="24" step="0.5" value="${initialHours}">
        </div>
        <div class="daily-cost-result">
          Gasto Diário: 
          <strong class="daily-cost-value" data-cost="${initialCostDay.toFixed(
            2
          )}">
            ${initialCostDay.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
          </strong>
        </div>
        
        <!--->
        <div class="monthly-cost-result">
          Gasto Mensal: 
          <strong class="monthly-cost-value">
            ${initialCostMonth.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
          </strong>
    `;

    const hoursInput = card.querySelector(".hours-input");
    const costValueElement = card.querySelector(".daily-cost-value");
    hoursInput.addEventListener("input", function () {
      const horas = parseFloat(this.value) || 0;
      const { custoDia: newCostDay, custoMes: newCostMonth } = calculateCost(
        product.potencia_w,
        horas
      );
      costValueElement.textContent = newCostDay.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      });
      costValueElement.dataset.cost = newCostDay.toFixed(2);

      card.querySelector(".monthly-cost-value").textContent =
        newCostMonth.toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        });

      if (isCustom) {
        const customProducts = getCustomProducts();
        const index = customProducts.findIndex((p) => p.id === product.id);
        if (index !== -1) {
          customProducts[index].horas_dia = horas;
          setCustomProducts(customProducts);
        }
      }

      updateGlobalCost();
    });

    const favoriteBtn = card.querySelector(".favorite-btn");
    favoriteBtn.addEventListener("click", function () {
      let favorites = getFavorites();
      const productId = product.id;
      if (favorites.includes(productId)) {
        favorites = favorites.filter((id) => id !== productId);
        this.textContent = "☆";

        if (isFavoritesPage) {
          card.remove();
          if (productList.children.length === 0) {
            noFavoritesMessage.style.display = "block";
          }
        }
      } else {
        favorites.push(productId);
        this.textContent = "★";
      }
      setFavorites(favorites);
      updateGlobalCost();
    });

    if (isCustom) {
      const deleteBtn = card.querySelector(".delete-btn");
      deleteBtn.addEventListener("click", function () {
        const confirmar = confirm(
          `Tem certeza que deseja excluir o produto personalizado "${product.nome}"?`
        );
        if (confirmar) {
          let customProducts = getCustomProducts();
          customProducts = customProducts.filter((p) => p.id !== product.id);
          setCustomProducts(customProducts);

          let favorites = getFavorites();
          favorites = favorites.filter((id) => id !== product.id);
          setFavorites(favorites);

          card.remove();

          updateGlobalCost();

          if (isFavoritesPage && productList.children.length === 0) {
            noFavoritesMessage.style.display = "block";
          }
        }
      });
    }
    return card;
  }

  function renderProducts() {
    productList.innerHTML = "";

    const products = [
      {
        id: "geladeira",
        nome: "Geladeira",
        potencia_w: 150,
        imagem: "./assets/img/geladeira.png",
        descricao: "Geladeira Frost Free de baixo consumo.",
      },
      {
        id: "microondas",
        nome: "Micro-ondas",
        potencia_w: 1200,
        imagem: "./assets/img/micro-ondas.png",
        descricao: "Micro-ondas de 30 litros com diversas funções.",
      },
      {
        id: "televisao",
        nome: "Televisão",
        potencia_w: 100,
        imagem: "./assets/img/televisao.png",
        descricao: "Smart TV LED 4K de 50 polegadas.",
      },
    ];

    const customProducts = getCustomProducts().map((p) => ({
      ...p,
      isCustom: true,
    }));

    const allProducts = products
      .map((p) => {
        const storedProduct = customProducts.find((cp) => cp.id === p.id);
        return storedProduct ? { ...p, ...storedProduct } : p;
      })
      .concat(
        customProducts.filter((cp) => !products.some((p) => p.id === cp.id))
      );

    let productsToRender = allProducts;
    if (isFavoritesPage) {
      const favorites = getFavorites();
      productsToRender = allProducts.filter((p) => favorites.includes(p.id));

      if (productsToRender.length === 0) {
        noFavoritesMessage.style.display = "block";
      } else {
        noFavoritesMessage.style.display = "none";
      }
    }

    productsToRender.forEach((product) => {
      const isCustom = product.isCustom || false;
      productList.appendChild(createProductCard(product, isCustom));
    });

    updateGlobalCost();
  }

  if (customItemForm) {
    customItemForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const nome = document.getElementById("custom-nome").value.trim();
      const potencia = parseFloat(
        document.getElementById("custom-potencia").value
      );
      const horas = parseFloat(document.getElementById("custom-horas").value);
      const imagem = document.getElementById("custom-imagem").value.trim();
      const messageElement = document.getElementById("custom-item-message");
      messageElement.textContent = "";
      messageElement.classList.remove("erro", "sucesso");
      if (
        !nome ||
        isNaN(potencia) ||
        potencia <= 0 ||
        isNaN(horas) ||
        horas < 0 ||
        horas > 24
      ) {
        messageElement.textContent =
          "Por favor, preencha todos os campos obrigatórios corretamente.";
        messageElement.classList.add("erro");
        return;
      }
      const newProduct = {
        id: "custom-" + Date.now(),
        nome: nome,
        potencia_w: potencia,
        horas_dia: horas,
        imagem: imagem,
        isCustom: true,
      };
      const customProducts = getCustomProducts();
      customProducts.push(newProduct);
      setCustomProducts(customProducts);

      productList.appendChild(createProductCard(newProduct, true));

      let favorites = getFavorites();
      favorites.push(newProduct.id);
      setFavorites(favorites);
      customItemForm.reset();
      messageElement.textContent =
        "Aparelho personalizado adicionado com sucesso!";
      messageElement.classList.add("sucesso");

      updateGlobalCost();
    });
  }

  renderProducts();
});
