const API_BASE_URL = "http://localhost:8000";

let allProducts = [];
let activeFilter = "all";
let currentDetailProduct = null;

document.addEventListener("DOMContentLoaded", () => {
  const productGrid = document.querySelector("#product-grid");
  const productDetail = document.querySelector("#product-detail");
  const chatForm = document.querySelector("#chat-form");
  const chatToggle = document.querySelector("#chat-toggle");

  if (productGrid) {
    setupProductFilters();
    loadProducts(productGrid);
  }

  if (productDetail) {
    loadProductDetail(productDetail);
  }

  if (chatForm && chatToggle) {
    setupChat(chatForm, chatToggle);
    setupAskAiButtons();
  }
});

async function loadProducts(container) {
  container.innerHTML = '<p class="status-message">Loading products...</p>';

  try {
    const response = await fetch(`${API_BASE_URL}/products`);

    if (!response.ok) {
      throw new Error("Could not load products.");
    }

    allProducts = await response.json();
    renderFilteredProducts(container);
  } catch (error) {
    container.innerHTML = '<p class="status-message error">Unable to load products. Please check that the backend is running.</p>';
  }
}

function setupProductFilters() {
  const searchInput = document.querySelector("#product-search");
  const filterChips = document.querySelectorAll(".filter-chip");

  searchInput.addEventListener("input", () => {
    renderFilteredProducts(document.querySelector("#product-grid"));
  });

  filterChips.forEach((chip) => {
    chip.addEventListener("click", () => {
      activeFilter = chip.dataset.filter;
      filterChips.forEach((item) => item.classList.remove("active"));
      chip.classList.add("active");
      renderFilteredProducts(document.querySelector("#product-grid"));
    });
  });
}

function renderFilteredProducts(container) {
  const searchValue = document.querySelector("#product-search")?.value.trim().toLowerCase() || "";
  const products = allProducts.filter((product) => {
    const matchesSearch = [product.name, product.description, product.category]
      .join(" ")
      .toLowerCase()
      .includes(searchValue);

    if (!matchesSearch) {
      return false;
    }

    if (activeFilter === "under-500") {
      return product.price < 500;
    }

    if (activeFilter === "under-1000") {
      return product.price < 1000;
    }

    if (activeFilter !== "all") {
      return product.category === activeFilter;
    }

    return true;
  });

  renderProductGrid(container, products);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getStockInfo(stock) {
  if (stock === 0) {
    return { label: "Out of stock", className: "out" };
  }

  if (stock <= 10) {
    return { label: "Low stock", className: "low" };
  }

  return { label: "In stock", className: "in" };
}

function renderProductGrid(container, products) {
  const productCount = document.querySelector("#product-count");

  if (productCount) {
    productCount.textContent = `${products.length} product${products.length === 1 ? "" : "s"} found`;
  }

  if (!products.length) {
    container.innerHTML = '<p class="status-message">No products match your search.</p>';
    return;
  }

  container.innerHTML = products
    .map((product) => {
      const stock = getStockInfo(product.stock);

      return `
        <article class="product-card">
          <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}">
          <div class="product-card-body">
            <div class="card-topline">
              <span class="category-pill">${escapeHtml(product.category)}</span>
              <span class="stock-status ${stock.className}">${stock.label}</span>
            </div>
            <h3>${escapeHtml(product.name)}</h3>
            <p class="product-description">${escapeHtml(product.description)}</p>
            <p class="price">₹${escapeHtml(product.price)}</p>
            <a class="button primary" href="product.html?id=${encodeURIComponent(product.id)}">View Details</a>
          </div>
        </article>
      `;
    })
    .join("");
}

async function loadProductDetail(container) {
  const params = new URLSearchParams(window.location.search);
  const productId = params.get("id");

  if (!productId) {
    container.innerHTML = '<p class="status-message error">Product ID is missing.</p>';
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/products/${productId}`);

    if (response.status === 404) {
      container.innerHTML = '<p class="status-message error">Product not found.</p>';
      return;
    }

    if (!response.ok) {
      throw new Error("Could not load product.");
    }

    const product = await response.json();
    currentDetailProduct = product;
    renderProductDetail(container, product);
  } catch (error) {
    container.innerHTML = '<p class="status-message error">Unable to load product. Please check that the backend is running.</p>';
  }
}

function renderProductDetail(container, product) {
  const stock = getStockInfo(product.stock);

  container.innerHTML = `
    <div class="detail-image-wrap">
      <img class="detail-image" src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}">
    </div>
    <div class="detail-content">
      <span class="category-pill">${escapeHtml(product.category)}</span>
      <h1>${escapeHtml(product.name)}</h1>
      <p class="detail-price">₹${escapeHtml(product.price)}</p>
      <p class="stock-status ${stock.className}">${stock.label}</p>
      <p class="detail-description">${escapeHtml(product.description)}</p>
      <dl class="product-meta">
        <div>
          <dt>Category</dt>
          <dd>${escapeHtml(product.category)}</dd>
        </div>
        <div>
          <dt>Available stock</dt>
          <dd>${escapeHtml(product.stock)}</dd>
        </div>
      </dl>
      <button id="ask-product-ai" class="button primary" type="button">Ask AI about this product</button>
    </div>
  `;

  document.querySelector("#ask-product-ai").addEventListener("click", () => {
    openChat(`Tell me about ${product.name}. Is it in stock and what is the price?`);
  });
}

function setupAskAiButtons() {
  document.querySelectorAll("#nav-ask-ai, #hero-ask-ai").forEach((button) => {
    button.addEventListener("click", () => {
      if (currentDetailProduct) {
        openChat(`Tell me about ${currentDetailProduct.name}.`);
        return;
      }

      openChat();
    });
  });
}

function openChat(prefillMessage = "") {
  const chatWindow = document.querySelector("#chat-window");
  const chatToggle = document.querySelector("#chat-toggle");
  const input = document.querySelector("#chat-input");

  chatWindow.hidden = false;
  chatToggle.setAttribute("aria-expanded", "true");

  if (prefillMessage) {
    input.value = prefillMessage;
  }

  input.focus();
}

function setupChat(form, toggleButton) {
  const chatWindow = document.querySelector("#chat-window");
  const closeButton = document.querySelector("#chat-close");
  const input = document.querySelector("#chat-input");
  const messages = document.querySelector("#chat-messages");

  toggleButton.addEventListener("click", () => {
    const isOpen = !chatWindow.hidden;
    chatWindow.hidden = isOpen;
    toggleButton.setAttribute("aria-expanded", String(!isOpen));

    if (!chatWindow.hidden) {
      input.focus();
    }
  });

  closeButton.addEventListener("click", () => {
    chatWindow.hidden = true;
    toggleButton.setAttribute("aria-expanded", "false");
    toggleButton.focus();
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const message = input.value.trim();
    if (!message) {
      return;
    }

    addChatMessage(messages, message, "user");
    input.value = "";
    input.focus();

    const loadingMessage = addChatMessage(messages, "Thinking...", "bot");

    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        throw new Error("Chat request failed.");
      }

      const data = await response.json();
      loadingMessage.textContent = data.answer;
    } catch (error) {
      loadingMessage.textContent = "Sorry, something went wrong. Please try again.";
      loadingMessage.classList.add("error-message");
    }
  });
}

function addChatMessage(container, text, sender) {
  const message = document.createElement("div");
  message.className = `message ${sender}`;
  message.textContent = text;
  container.appendChild(message);
  container.scrollTop = container.scrollHeight;
  return message;
}
