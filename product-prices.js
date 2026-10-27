(() => {
  // Exact product and pack matches only; leave ambiguous variants unpriced.
  const catalog = {
    "johnson's baby shampoo": { mrp: 467, size: "500 mL", source: "https://assets.ctfassets.net/za5qny03n4xo/hbcd8TdOf87oc1vobBe5N/172a5f8721de209ad90785a5890fd383/RevisedMRPList_Kenvue.pdf" },
    "t\u00fctots bliss+ baby body lotion": { mrp: 499, size: "200 mL", source: "https://tutots.com/products/tutots-baby-body-lotion-enriched-with-shea-butter-aloe-vera-coconut-oil-infused-with-jojoba-oil-baby-moisturizer-for-face-body-ideal-for-0-5-year-olds-gentle-skincare-for-kids" },
    "himalaya baby lotion": { mrp: 210, size: "200 mL", source: "https://himalayawellness.in/collections/winter-essentials/products/baby-lotion" },
    "biotique fruit brightening face wash": { mrp: 210, size: "100 mL", source: "https://www.biotique.com/products/fruit-brightening-face-wash-100ml" },
    "biotique morning nectar moisturizer": { mrp: 490, size: "190 mL", source: "https://www.biotique.com/products/morning-nectar-nourish-hydrate-moisturizer-190ml" },
    "biotique papaya face wash": { mrp: 320, size: "150 mL", source: "https://www.biotique.com/products/papaya-deep-cleanse-face-wash?view=new-pdp" },
    "caffeine coffee face scrub": { mrp: 349, size: "100 g", source: "https://www.mcaffeine.com/products/naked-raw-coffee-face-scrub-with-vitamin-e" },
    "wishful honey balm": { mrp: 4050, size: "55 g", source: "https://sephora.in/product/wishful-honey-balm-jelly-moisturizer-v-55g" },
    "park avenue good morning lather shaving cream": { mrp: 65, size: "84 g", source: "https://www.1mg.com/otc/park-avenue-good-morning-lather-shaving-cream-otc1005845" },
    "the man company joy eau de parfum": { mrp: 1499, size: "100 mL", source: "https://www.themancompany.com/products/eau-de-parfum-joy-100ml" },
    "ciccio for women luxe eau de parfum": { mrp: 1190, size: "100 mL", source: "https://www.myntra.com/perfume/ciccio/-ciccio--luxe-women-eau-de-parfum--100-ml/30253457/buy" },
    "muuchstac ocean face wash, 100 ml": { mrp: 299, size: "100 mL", source: "https://www.1mg.com/otc/muuchstac-ocean-face-wash-100ml-each-otc810223" },
    "globus naturals aloe vera neem tulsi face wash": { mrp: 175, size: "100 mL", source: "https://globusnaturals.com/products/globus-aloe-vera-neem-tulsi-acne-control-face-wash-100-ml" },
    "lakm\u00e9 blush & glow strawberry face wash": { mrp: 289, size: "100 g", source: "https://www.lakmeindia.com/products/lakme-blush-glow-strawberry-freshness-gel-face-wash-with-strawberry-extracts-100-g-2" }
  };

  const normalize = value => value.toLocaleLowerCase().replace(/\s+/g, " ").trim();
  const money = value => `\u20B9${Number(value).toLocaleString("en-IN", { minimumFractionDigits: Number.isInteger(value) ? 0 : 2, maximumFractionDigits: 2 })}`;
  const get = name => {
    const item = catalog[normalize(name)];
    return item ? { ...item, sale: Math.round(item.mrp * 60) / 100 } : null;
  };
  const markup = item => `<span class="price-reference"><del>${money(item.mrp)}</del></span><span class="price-sale">${money(item.sale)}</span><span class="price-discount">40% OFF</span><span class="price-pack">${item.size}</span>`;

  window.ReclaimProductPrices = { get, markup, money };
})();
