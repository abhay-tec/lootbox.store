(() => {
  const config = window.RECLAIM_REVIEWS_CONFIG || {};
  const apiUrl = String(config.url || "").replace(/\/$/, "");
  const apiKey = String(config.anonKey || "");
  const configured = Boolean(apiUrl && apiKey);
  const reviewerStorageKey = "reclaim-edit-reviewer-id";
  const params = new URLSearchParams(window.location.search);
  const productName = params.get("name") || "";
  const slug = value => value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const marketReviews = {
    "l-oreal-paris-total-repair-5-repairing-serum": {
      rating: 4.4, count: 29700, retailer: "Myntra", url: "https://www.myntra.com/reviews/135681"
    },
    "johnson-s-baby-shampoo": {
      rating: 4.5, count: 1300, retailer: "Myntra", url: "https://www.myntra.com/baby-shampoo-and-conditioner/johnsons/johnsons-baby-no-more-tears-shampoo---500-ml/12277352/buy"
    },
    "clinic-plus-strong-and-long-shampoo": {
      rating: 4.6, count: 15200, retailer: "Myntra", url: "https://www.myntra.com/Shampoo/Clinic%2BPlus/Clinic-Plus-Strong--Long-Shampoo-with-Milk-Protein--Multivitamins---650ml/26664068/buy"
    },
    "l-oreal-paris-dream-lengths-restoring-shampoo": {
      rating: 4.4, count: 111151, retailer: "Nykaa", url: "https://www.nykaa.com/l-oreal-paris-dream-lengths-shampoo/p/1162179"
    },
    "bajaj-almond-drops-anti-hairfall-shampoo": {
      rating: 4.4, count: 323, retailer: "Flipkart", url: "https://www.flipkart.com/bajaj-almond-drops-anti-hairfall-shampoo/p/itmf1acb4faaecbd"
    },
    "johnson-s-baby-cream": {
      rating: 4.4, count: 306, retailer: "Nykaa", url: "https://www.nykaa.com/johnson-s-baby-cream/reviews/4687264"
    },
    "l-oreal-paris-hyaluron-moisture-shampoo": {
      rating: 4.4, count: 57937, retailer: "Nykaa", url: "https://www.nykaa.com/l-oreal-paris-hyaluron-moisture-72h-moisture-filling-shampoo-with-hyaluronic-acid/reviews/6671067"
    },
    "tresemme-keratin-smooth-shampoo": {
      rating: 4.4, count: 2637, retailer: "Purplle", url: "https://www.purplle.com/product/tresemme-keratin-smooth-shampoo-580-ml-16-15/reviews"
    },
    "himalaya-baby-lotion": {
      rating: 4.4, count: 37728, retailer: "FirstCry", url: "https://www.firstcry.com/reviews/himalaya-babycare/himalaya-herbal-baby-lotion-200-ml/755"
    },
    "biotique-morning-nectar-moisturizer": {
      rating: 4.5, count: 749, retailer: "Biotique", url: "https://www.biotique.com/products/morning-nectar-nourish-hydrate-moisturizer-190ml"
    },
    "biotique-papaya-face-wash": {
      rating: 4.6, count: 388, retailer: "Biotique", url: "https://www.biotique.com/products/papaya-deep-cleanse-face-wash?view=new-pdp"
    },
    "biotique-sandalwood-sunscreen": {
      rating: 4.2, count: 12728, retailer: "Flipkart", url: "https://www.flipkart.com/biotique-bio-sandalwood-sunscreen-spf-50/p/itm5cc27240276a7"
    },
    "caffeine-coffee-face-scrub": {
      rating: 4.5, count: 2045, retailer: "Purplle", url: "https://www.purplle.com/product/mcaffeine-naked-and-raw-tan-removal-coffee-face-scrub"
    },
    "wishful-honey-balm": {
      rating: 4.1, count: 28, retailer: "Picky", url: "https://gopicky.com/brand/3845/wishful/products"
    },
    "pond-s-hyaluronic-moisturizer": {
      rating: 4.6, count: 22, retailer: "Tata 1mg", url: "https://www.1mg.com/otc/pond-s-hyaluronic-super-light-gel-otc1015839"
    },
    "jovees-herbal-sunscreen": {
      rating: 4.3, count: 327, retailer: "Nykaa", url: "https://www.nykaa.com/jovees-sun-derma-care-spf-50-pa/reviews/475938"
    },
    "cetaphil-moisturizing-cream": {
      rating: 4.5, count: 166465, retailer: "Nykaa", url: "https://www.nykaa.com/cetaphil-moisturising-cream/p/392484"
    },
    "neutrogena-ultra-sheer-sunscreen": {
      rating: 4.4, count: 329945, retailer: "Nykaa", url: "https://www.nykaa.com/neutrogena-ultrasheer-dry-touch-sunblock-spf-50-2563/p/2563"
    },
    "himalaya-purifying-neem-face-wash": {
      rating: 4.4, count: 1270, retailer: "Tata 1mg", url: "https://www.1mg.com/otc/himalaya-herbals-purifying-neem-face-wash-for-acne-pimple-relief-paraben-and-soap-free-face-care-product-otc325809"
    },
    "nivea-soft-moisturizer": {
      rating: 4.4, count: 5364, retailer: "Purplle", url: "https://www.purplle.com/product/nivea-soft-creme-100-ml-13-72-82-12-45/reviews"
    },
    "beardo-godfather-eau-de-parfum": {
      rating: 4.7, count: 230, retailer: "Beardo", url: "https://beardo.in/pages/godfather-perfume"
    },
    "wild-stone-code-terra-edp": {
      rating: 4.5, count: 34, retailer: "Nykaa", url: "https://www.nykaa.com/wild-stone-code-terra-eau-de-parfum/reviews/12341387"
    },
    "bella-vita-white-oud-eau-de-parfum": {
      rating: 4.8, count: 1600, retailer: "Bella Vita", url: "https://bellavitaorganic.com/collections/white-oud-range"
    },
    "muuchstac-ocean-face-wash-100-ml": {
      rating: 4.2, count: 245, retailer: "Nykaa", url: "https://www.nykaaman.com/muuchstac-face-wash-100ml/p/493914"
    },
    "park-avenue-good-morning-lather-shaving-cream": {
      rating: 4.2, count: 426, retailer: "BigBasket", url: "https://www.bigbasket.com/product-reviews/290507/park-avenue-lather-shaving-cream-good-morning-84-g/"
    },
    "lakme-blush-and-glow-strawberry-face-wash": {
      rating: 4.4, count: 13938, retailer: "Nykaa", url: "https://www.nykaa.com/lakme-blush-glow-strawberry-creme-face-wash-70203/p/70203"
    },
    "woodoo-hello-clear-skin-face-wash": {
      rating: 3.7, count: 8729, retailer: "Flipkart", url: "https://www.flipkart.com/woodoo-hello-clear-skin-facewash-face-wash/product-reviews/itmdae71ce8ef700"
    }
  };

  // New Supabase publishable keys are API keys, not JWT bearer tokens.
  const headers = extra => ({ apikey: apiKey, ...(apiKey.startsWith("sb_") ? {} : { Authorization: `Bearer ${apiKey}` }), ...extra });
  const request = async (path, options = {}) => {
    const response = await fetch(`${apiUrl}/rest/v1/${path}`, { ...options, headers: headers(options.headers || {}) });
    if (!response.ok) throw new Error(`Reviews request failed (${response.status}).`);
    return response.status === 204 ? null : response.json();
  };
  const average = rows => rows.length ? (rows.reduce((sum, row) => sum + Number(row.rating), 0) / rows.length) : 0;
  const setProductSummary = (rating, count) => {
    const score = document.getElementById("lootbox-rating");
    const tally = document.getElementById("lootbox-rating-count");
    if (score) score.innerHTML = `${rating.toFixed(1)} <span>/ 5</span>`;
    if (tally) tally.textContent = count ? `${count} ${count === 1 ? "rating" : "ratings"}` : "No ratings yet";
  };

  const market = marketReviews[slug(productName)];
  const marketScore = document.getElementById("market-rating");
  const marketCount = document.getElementById("market-rating-count");
  const marketLink = document.getElementById("market-review-link");
  if (marketLink) {
    marketLink.href = market?.url || `https://www.google.com/search?q=${encodeURIComponent(`${productName} reviews rating India`)}`;
    marketLink.textContent = market ? `View ratings on ${market.retailer}` : "Search market reviews";
    if (market) {
      marketScore.textContent = `${market.rating.toFixed(1)} / 5`;
      marketCount.textContent = `${market.count.toLocaleString("en-IN")} marketplace ratings · ${market.retailer}`;
    }
  }

  document.querySelectorAll(".store-card").forEach(card => {
    const name = card.querySelector("h3")?.textContent.trim();
    if (!name) return;
    const key = slug(name);
    const external = marketReviews[key];
    const summary = document.createElement("div");
    summary.className = "store-review-summary";
    const marketRow = document.createElement("a");
    marketRow.href = external?.url || `https://www.google.com/search?q=${encodeURIComponent(`${name} reviews rating India`)}`;
    marketRow.target = "_blank";
    marketRow.rel = "noopener noreferrer";
    marketRow.textContent = external ? `Market ${external.rating.toFixed(1)}★ · ${external.retailer}` : "Market reviews · Search";
    const shopRow = document.createElement("span");
    shopRow.innerHTML = "Lootbox <strong>0.0★</strong> · No ratings";
    summary.append(marketRow, shopRow);
    const price = card.querySelector(".store-price");
    if (price) price.after(summary);
  });

  const commentList = document.getElementById("product-comment-list");
  if (!commentList) return;
  const form = document.getElementById("review-form");
  const formStatus = document.getElementById("review-form-status");
  const submit = document.getElementById("review-submit");
  const empty = document.getElementById("comments-empty");
  const commentCount = document.getElementById("comment-count");
  const displayComments = rows => {
    commentList.replaceChildren();
    rows.forEach(review => {
      const item = document.createElement("li");
      item.className = "product-comment";
      const heading = document.createElement("div");
      heading.className = "product-comment-heading";
      const name = document.createElement("strong");
      name.textContent = "Shopper";
      const stars = document.createElement("span");
      stars.className = "product-comment-stars";
      stars.setAttribute("aria-label", `${review.rating} out of 5 stars`);
      stars.textContent = `${"★".repeat(review.rating)}${"☆".repeat(5 - review.rating)}`;
      heading.append(name, stars);
      const body = document.createElement("p");
      body.textContent = review.comment;
      const date = document.createElement("time");
      date.dateTime = review.created_at;
      date.textContent = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(review.created_at));
      item.append(heading, body, date);
      commentList.append(item);
    });
    empty.hidden = rows.length > 0;
    commentCount.textContent = `${rows.length} ${rows.length === 1 ? "comment" : "comments"}`;
    setProductSummary(average(rows), rows.length);
  };

  const loadReviews = async () => {
    if (!configured) {
      formStatus.textContent = "Shared reviews will be available after the review database is connected.";
      submit.disabled = true;
      return [];
    }
    try {
      const rows = await request(`product_reviews?product_slug=eq.${encodeURIComponent(slug(productName))}&select=rating,comment,created_at&order=created_at.desc`);
      displayComments(rows);
      return rows;
    } catch {
      formStatus.textContent = "Could not load reviews. Please refresh and try again.";
      return [];
    }
  };

  if (!productName) return;
  loadReviews().then(rows => {
    if (!configured) return;
    try {
      const previous = JSON.parse(localStorage.getItem("reclaim-edit-reviewed-products") || "[]");
      if (previous.includes(slug(productName))) {
        formStatus.textContent = "You have already posted a review for this product on this browser.";
        submit.disabled = true;
      }
    } catch {}
  });

  form.addEventListener("submit", async event => {
    event.preventDefault();
    if (!configured) {
      formStatus.textContent = "Shared reviews are not connected yet.";
      return;
    }
    const rating = Number(new FormData(form).get("rating"));
    const comment = document.getElementById("review-comment").value.trim();
    if (!rating) {
      formStatus.textContent = "Choose a star rating first.";
      return;
    }
    if (!comment) return;
    submit.disabled = true;
    formStatus.textContent = "Posting your review…";
    let reviewerId = localStorage.getItem(reviewerStorageKey);
    if (!reviewerId) {
      reviewerId = crypto.randomUUID();
      localStorage.setItem(reviewerStorageKey, reviewerId);
    }
    try {
      await request("product_reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify({ product_slug: slug(productName), product_name: productName, reviewer_id: reviewerId, rating, comment })
      });
      const reviewed = JSON.parse(localStorage.getItem("reclaim-edit-reviewed-products") || "[]");
      localStorage.setItem("reclaim-edit-reviewed-products", JSON.stringify([...new Set([...reviewed, slug(productName)])]));
      form.reset();
      formStatus.textContent = "Your review is posted and shared with other shoppers.";
      await loadReviews();
    } catch {
      formStatus.textContent = "Could not post your review. Check your connection and try again.";
      submit.disabled = false;
    }
  });

  if (configured && document.querySelector(".store-card")) {
    request("rpc/get_product_review_summaries", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" })
      .then(summaries => {
        const byProduct = new Map(summaries.map(row => [row.product_slug, row]));
        document.querySelectorAll(".store-card").forEach(card => {
          const summary = byProduct.get(slug(card.querySelector("h3").textContent.trim()));
          const row = card.querySelector(".store-review-summary span:last-child");
          if (summary && row) row.innerHTML = `Lootbox <strong>${Number(summary.average_rating).toFixed(1)}★</strong> · ${summary.review_count} ${Number(summary.review_count) === 1 ? "rating" : "ratings"}`;
        });
      }).catch(() => {});
  }
})();
