(() => {
  const normalize = value => value.toLocaleLowerCase()
    .normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");

  // These MRP and offer values come from RATE LIST LB.xlsx. Keep only exact
  // catalog matches; products with blank rates or a different variant remain unpriced.
  const rows = [
    ["L'Oréal Paris Total Repair 5 Repairing Serum", 229, 138, "40 mL"],
    ["L'Oréal Paris Total Repair 5 Repairing Shampoo", 1250, 650, "1 L"],
    ["Clinic Plus Strong & Long Shampoo", 1250, 650, "1 L"],
    ["Tütots Bliss+ Baby Body Lotion", 500, 300, "200 mL"],
    ["L'Oréal Paris Dream Lengths Restoring Shampoo", 1300, 780, "1 L"],
    ["Park Avenue Beer Shampoo", 800, 480, "1 L"],
    ["Vitamin C Face Serum", 500, 250, "30 mL"],
    ["Johnson's Baby Cream", 175, 100, "100 g"],
    ["L'Oréal Paris Hyaluron Moisture Shampoo", 1479, 700, "1 L"],
    ["Sunsilk Flowy Silk & Smooth Shampoo", 982, 580, "650 mL"],
    ["Himalaya Baby Lotion", 425, 255, "400 mL"],
    ["TRESemmé Keratin Smooth Shampoo", 1762, 704, "1 L"],
    ["AquaLogica Sunscreen by the Sea", 599, 359, "80 g"],
    ["Biotique Fruit Brightening Face Wash", 400, 240, "200 mL"],
    ["Biotique Morning Nectar Moisturizer", 220, 132, "200 mL"],
    ["Biotique Ocean Kelp Anti-Dandruff Shampoo", 180, 108, "120 mL"],
    ["Biotique Papaya Face Wash", 415, 249, "200 mL"],
    ["Biotique Sandalwood Sunscreen", 550, 330, "120 mL"],
    ["CeraVe Hydrating Cream", 1900, 1100, "454 g"],
    ["Dewy Cucumber Pore Tightening Toner", 360, 216, "120 mL"],
    ["Wishful Honey Balm", 4050, 1999, "55 g"],
    ["Pond's Hyaluronic Moisturizer", 780, 468, "300 mL"],
    ["Cetaphil Moisturizing Cream", 1300, 750, "50 g"],
    ["Jovees Herbal Sunscreen", 345, 200, "50 g"],
    ["Neutrogena Ultra Sheer Sunscreen", 300, 180, "30 g"],
    ["DENVER Vogue Eau de Parfum", 225, 120, "20 mL"],
    ["Beardo Godfather Eau de Parfum", 190, 114, "20 mL"],
    ["The Man Company Joy Eau de Parfum", 200, 118, "20 mL"],
    ["SKINN Body Mist Apple Jasmine", 894, 530, "230 mL"],
    ["Wild Stone Code Terra EDP", 180, 108, "20 mL"],
    ["Bella Vita White Oud Eau de Parfum", 220, 132, "20 mL"],
    ["NIVEA Soft Spa Glow Moisturizer", 660, 380, "300 mL"],
    ["Sonata Black Dial Analog Watch with Yellow Accents", 795, 470, ""],
    ["Sonata Black Dial Analog Watch with Red Accents", 785, 460, ""],
    ["Sonata Black Dial Analog Watch with Blue Accents", 800, 480, ""],
    ["Oxyglow Herbals Papaya Anti Pollution Face Wash", 500, 250, "100 g"],
    ["Bombay Shaving Company Shaving Cream", 195, 114, "100 g"],
    ["Veet Pure Hair Removal Cream", 325, 195, "100 g"],
    ["Globus Naturals Aloe Vera Neem Tulsi Face Wash", 175, 105, "75 g"],
    ["Park Avenue Good Morning Lather Shaving Cream", 300, 180, "125 g"],
    ["Beardo Beard & Hair Growth Oil, 50 mL", 666, 400, "50 mL"],
    ["Muuchstac Ocean Face Wash, 100 mL", 300, 180, "100 mL"],
    ["Neutrogena Deep Clean Brightening Foaming Cleanser", 500, 300, "100 g"],
    ["Joy Skin Fruits Brightening Face Wash", 195, 117, "120 mL"],
    ["Himalaya Purifying Neem Face Wash", 275, 160, "150 mL"],
    ["Woodoo Hello, Clear Skin Face Wash", 492, 295, "100 mL"],
    ["Glow & Clean White & Bright Charcoal Face Wash", 499, 250, "100 mL"],
    ["Lakmé Blush & Glow Strawberry Face Wash", 490, 294, "150 g"],
    ["NEUD Skin Brightening Turmeric Face Wash", 190, 114, "70 mL"]
  ];
  const products = new Map(rows.map(([name, mrp, price, size]) => [normalize(name), { mrp, price, size }]));
  const get = name => products.get(normalize(name)) || null;
  const format = amount => `\u20B9${Math.round(amount).toLocaleString("en-IN")}`;

  const apply = (element, name) => {
    if (!element) return false;
    const product = get(name);
    if (!product) return false;
    element.replaceChildren();
    element.classList.add("has-sale-price");

    const salePrice = document.createElement("span");
    salePrice.className = "sale-price-current";
    salePrice.textContent = format(product.price);

    const details = document.createElement("span");
    details.className = "sale-price-meta";
    const mrp = document.createElement("s");
    mrp.textContent = `MRP ${format(product.mrp)}`;
    const discount = document.createElement("span");
    discount.className = "sale-price-discount";
    discount.textContent = `${Math.round((1 - product.price / product.mrp) * 100)}% OFF`;
    details.append(mrp, discount);
    if (product.size) {
      const size = document.createElement("span");
      size.className = "sale-price-size";
      size.textContent = product.size;
      details.append(size);
    }
    element.append(salePrice, details);
    element.setAttribute("aria-label", `${format(product.price)}, ${discount.textContent} from MRP ${format(product.mrp)}${product.size ? `, ${product.size}` : ""}`);
    return true;
  };

  window.LootboxProductPrices = { get, apply };
})();
