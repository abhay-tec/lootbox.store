(() => {
  const products = new Map([
    ["nivea cocoa nourish body lotion", { mrp: 849, size: "600 mL" }],
    ["beardo beard hair growth oil", { mrp: 666, size: "50 mL" }],
    ["l'oreal paris total repair 5 repairing serum", { mrp: 299, size: "80 mL" }],
    ["clinic plus strong long shampoo", { mrp: 871, size: "650 mL" }],
    ["l'oreal paris dream lengths restoring shampoo", { mrp: 189, size: "192.5 mL" }],
    ["bajaj almond drops anti hairfall shampoo", { mrp: 310, size: "340 mL" }],
    ["himalaya baby lotion", { mrp: 425, size: "400 mL" }],
    ["biotique fruit brightening face wash", { mrp: 400, size: "200 g" }],
    ["biotique morning nectar moisturizer", { mrp: 300, size: "120 mL" }],
    ["biotique papaya face wash", { mrp: 400, size: "200 mL" }],
    ["biotique sandalwood sunscreen", { mrp: 375, size: "50 mL" }],
    ["caffeine coffee face scrub", { mrp: 229, size: "75 g approx." }],
    ["cerave hydrating cream", { mrp: 1900, size: "450 g approx." }],
    ["pond's hyaluronic moisturizer", { mrp: 194, size: "50 mL" }],
    ["cetaphil moisturising cream", { mrp: 1499, size: "250 g" }],
    ["neutrogena ultra sheer sunscreen", { mrp: 299, size: "30 g" }],
    ["nivea soft moisturizer", { mrp: 290, size: "100 mL" }],
    ["beardo godfather eau de parfum", { mrp: 699, size: "50 mL" }],
    ["bella vita white oud eau de parfum", { mrp: 999, size: "100 mL" }],
    ["axe dark temptation body spray", { mrp: 390, size: "200 mL" }],
    ["muuchstac ocean face wash", { mrp: 449, size: "100 mL" }],
    ["lakme blush glow strawberry face wash", { mrp: 515, size: "150 g" }]
  ]);

  const normalize = value => value.toLocaleLowerCase()
    .normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
  const normalizedProducts = new Map([...products].map(([name, data]) => [normalize(name), data]));
  // Catalog titles may include punctuation (&, apostrophes, accents); compare their
  // normalized full names so unrelated sizes and variants stay unpriced.
  const get = name => {
    const key = normalize(name);
    if (normalizedProducts.has(key)) return normalizedProducts.get(key);
    const compact = key.replace(/\bl\s+oreal\b/g, "loreal");
    for (const [productKey, data] of normalizedProducts) {
      const comparableKey = productKey.replace(/\bl\s+oreal\b/g, "loreal");
      if (comparableKey === compact) return data;
      if (!data.size.includes("approx.") && normalize(`${productKey} ${data.size}`) === key) return data;
    }
    return null;
  };
  const format = amount => `\u20B9${Math.round(amount).toLocaleString("en-IN")}`;
  const apply = (element, name) => {
    if (!element) return false;
    const product = get(name);
    if (!product) return false;
    const sale = Math.round(product.mrp * 0.6);
    element.replaceChildren();
    element.classList.add("has-sale-price");
    const salePrice = document.createElement("span");
    salePrice.className = "sale-price-current";
    salePrice.textContent = format(sale);
    const details = document.createElement("span");
    details.className = "sale-price-meta";
    const mrp = document.createElement("s");
    mrp.textContent = `MRP ${format(product.mrp)}`;
    const discount = document.createElement("span");
    discount.className = "sale-price-discount";
    discount.textContent = "40% OFF";
    const size = document.createElement("span");
    size.className = "sale-price-size";
    size.textContent = product.size;
    details.append(mrp, discount, size);
    element.append(salePrice, details);
    element.setAttribute("aria-label", `${format(sale)}, 40 percent off MRP ${format(product.mrp)}, ${product.size}`);
    return true;
  };
  window.LootboxProductPrices = { get, apply };
})();
