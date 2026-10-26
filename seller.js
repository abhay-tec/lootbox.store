(() => {
  const loginForm = document.getElementById("seller-login-form");
  const status = document.getElementById("seller-auth-status");
  const dashboard = document.getElementById("seller-orders");
  const list = document.getElementById("seller-order-list");
  const empty = document.getElementById("seller-orders-empty");
  const logoutButton = document.getElementById("seller-logout");
  const refreshButton = document.getElementById("seller-refresh");
  const backend = window.LootboxBackend;
  let productImages = new Map();
  let productImagesLoaded = false;

  const loadProductImages = async () => {
    if (productImagesLoaded) return;
    const response = await fetch("store.html", { cache: "force-cache" });
    if (!response.ok) return;
    const catalog = new DOMParser().parseFromString(await response.text(), "text/html");
    catalog.querySelectorAll(".store-card").forEach(card => {
      const name = card.querySelector("h3")?.textContent.trim();
      const image = card.querySelector(".store-image-wrap img")?.getAttribute("src");
      if (name && image?.startsWith("assets/")) productImages.set(name, image);
    });
    productImagesLoaded = true;
  };

  const renderOrders = rows => {
    list.replaceChildren();
    empty.hidden = rows.length > 0;
    rows.forEach(order => {
      const item = document.createElement("li");
      item.className = "seller-order-card";
      const heading = document.createElement("div");
      heading.className = "seller-order-title";
      const id = document.createElement("strong");
      id.textContent = `Order ${String(order.id).slice(0, 8).toUpperCase()}`;
      const date = document.createElement("time");
      date.dateTime = order.created_at;
      date.textContent = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(order.created_at));
      heading.append(id, date);

      const customer = document.createElement("p");
      customer.className = "seller-customer-details";
      customer.textContent = `${order.customer_name} · ${order.customer_phone} · ${order.customer_email}`;
      const address = document.createElement("p");
      address.textContent = `${order.delivery_address}, ${order.delivery_city} ${order.delivery_postal}`;
      const products = document.createElement("ul");
      products.className = "seller-product-list";
      (order.items || []).forEach(product => {
        const productRow = document.createElement("li");
        const productImage = product.image?.startsWith("assets/") ? product.image : productImages.get(product.name);
        if (productImage) {
          const image = document.createElement("img");
          image.className = "seller-product-image";
          image.src = productImage;
          image.alt = product.name;
          image.loading = "lazy";
          productRow.append(image);
        }
        const label = document.createElement("span");
        label.textContent = `${product.name} × ${product.quantity}`;
        productRow.append(label);
        products.append(productRow);
      });

      const footer = document.createElement("div");
      footer.className = "seller-order-footer";
      const state = document.createElement("span");
      state.className = `seller-order-status status-${order.status}`;
      state.textContent = order.status;
      const actions = document.createElement("div");
      actions.className = "seller-order-actions";
      const select = document.createElement("select");
      select.setAttribute("aria-label", `Update status for order ${String(order.id).slice(0, 8)}`);
      [["pending", "Pending"], ["contacted", "Contacted"], ["confirmed", "Confirmed"], ["fulfilled", "Fulfilled"], ["cancelled", "Cancel · Out of stock"]].forEach(([value, label]) => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = label;
        option.selected = value === order.status;
        select.append(option);
      });
      select.addEventListener("change", async () => {
        select.disabled = true;
        try {
          await backend.request(`store_orders?id=eq.${encodeURIComponent(order.id)}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
            body: JSON.stringify({ status: select.value, cancelled_by: select.value === "cancelled" ? "seller" : null })
          });
          order.status = select.value;
          order.cancelled_by = select.value === "cancelled" ? "seller" : null;
          state.className = `seller-order-status status-${order.status}`;
          state.textContent = order.status;
          if (order.status === "cancelled") await loadOrders();
          else status.textContent = "Order status updated.";
        } catch (error) {
          select.value = order.status;
          status.textContent = error.message;
        } finally { select.disabled = false; }
      });
      actions.append(state, select);
      footer.append(actions);
      item.append(heading, customer, address, products, footer);
      list.append(item);
    });
  };

  const loadOrders = async () => {
    status.textContent = "Loading order requests…";
    try {
      await loadProductImages();
      const rows = await backend.request("store_orders?select=*&status=neq.cancelled&order=created_at.desc");
      renderOrders(rows);
      status.textContent = `${rows.length} order ${rows.length === 1 ? "request" : "requests"} loaded.`;
      dashboard.hidden = false;
      loginForm.hidden = true;
      logoutButton.hidden = false;
    } catch (error) { status.textContent = error.message || "Could not load orders."; }
  };

  const confirmSeller = async () => {
    if (!backend.session?.user) return false;
    const result = await backend.request("rpc/is_seller", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    return result === true || result?.is_seller === true;
  };

  loginForm.addEventListener("submit", async event => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(loginForm).entries());
    status.textContent = "Signing in…";
    try {
      await backend.signInSeller(values.email, values.password);
      if (!await confirmSeller()) {
        await backend.signOut();
        status.textContent = "This login is not authorized for seller access.";
        return;
      }
      await loadOrders();
    } catch (error) { status.textContent = error.message || "Sign in failed."; }
  });
  logoutButton.addEventListener("click", async () => {
    await backend.signOut();
    dashboard.hidden = true;
    logoutButton.hidden = true;
    loginForm.reset();
    loginForm.hidden = false;
    status.textContent = "Signed out.";
  });
  refreshButton.addEventListener("click", loadOrders);

  backend.ready().then(async session => {
    if (!session?.user) return;
    try {
      if (await confirmSeller()) await loadOrders();
      else await backend.signOut();
    } catch { await backend.signOut(); }
  });
})();
