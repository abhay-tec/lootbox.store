(() => {
  if (document.getElementById("lootbox-help-bot")) return;

  const root = document.createElement("section");
  root.className = "help-bot";
  root.id = "lootbox-help-bot";
  root.setAttribute("aria-label", "Lootbox store help chat");
  root.innerHTML = `
    <button class="help-bot-launcher" type="button" aria-expanded="false" aria-controls="help-bot-panel">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 11.5a8.5 8.5 0 0 1-12.7 7.4L3 20l1.1-4.3a8.5 8.5 0 1 1 16.4-4.2Z"/><path d="M8 10h.01M12 10h.01M16 10h.01"/></svg>
      <span>Need help?</span>
    </button>
    <div class="help-bot-panel" id="help-bot-panel" hidden>
      <header class="help-bot-header"><div><strong>Lootbox Help</strong><small>Quick answers about the store</small></div><button class="help-bot-close" type="button" aria-label="Close help chat">×</button></header>
      <div class="help-bot-messages" role="log" aria-live="polite" aria-relevant="additions text"></div>
      <div class="help-bot-suggestions" aria-label="Common questions">
        <button type="button">How do I order?</button><button type="button">How do I check price?</button><button type="button">Where are my orders?</button>
      </div>
      <form class="help-bot-form"><label class="visually-hidden" for="help-bot-input">Ask a store question</label><input id="help-bot-input" maxlength="240" autocomplete="off" placeholder="Ask about the store…" required><button type="submit" aria-label="Send question">Send</button></form>
    </div>`;
  document.body.append(root);

  const launcher = root.querySelector(".help-bot-launcher");
  const panel = root.querySelector(".help-bot-panel");
  const closeButton = root.querySelector(".help-bot-close");
  const messages = root.querySelector(".help-bot-messages");
  const form = root.querySelector(".help-bot-form");
  const input = root.querySelector("#help-bot-input");
  const instagram = "https://www.instagram.com/lootbox.storee/";

  const addMessage = (text, sender = "bot", linkText = "", linkHref = "") => {
    const bubble = document.createElement("p");
    bubble.className = `help-bot-message is-${sender}`;
    bubble.textContent = text;
    if (linkText && linkHref) {
      const link = document.createElement("a");
      link.href = linkHref;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = linkText;
      bubble.append(document.createElement("br"), link);
    }
    messages.append(bubble);
    messages.scrollTop = messages.scrollHeight;
  };

  const answerFor = question => {
    const q = question.toLowerCase();
    if (/^(hi|hello|hey|namaste|hii)\b/.test(q)) return ["Hi! I can help with products, prices, orders, your account, and shopping on Lootbox."];
    if (/what.*(lootbox|store)|is.*(store|website)|sell|selling|about.*store/.test(q)) return ["Yes. Lootbox is an online resale and liquidation store for branded finds. You can browse products and send an order request; the seller confirms current stock and price."];
    if (/price|cost|kitna|rate|stock|available|availability/.test(q)) return ["Product prices and stock are confirmed for each order request. Open a product’s details and message us to check its current price, condition, and availability.", "Contact Lootbox Store on Instagram", instagram];
    if (/payment|pay|cash|upi|card|checkout method/.test(q)) return ["The website submits an order request and the seller confirms the price and availability. Ask the store directly about payment options before sending money.", "Contact Lootbox Store on Instagram", instagram];
    if (/how.*order|order.*how|buy|purchase|checkout|place.*order|kaise.*order/.test(q)) return ["Open a product and read its details, then tap Buy Now or Add to Cart. Sign in with Google, save your delivery details, and submit the order request. The seller will confirm availability and price."];
    if (/login|sign.?in|google|account|profile|address|details save/.test(q)) return ["Use the account menu and choose Continue with Google. Once signed in, save your name, phone number, and delivery address in Profile. Your profile and order history are linked to that account."];
    if (/cart|basket|add.*item/.test(q)) return ["Tap Add to Cart on a product. Open the account menu and choose Cart to review items; you can continue to checkout from there."];
    if (/track|order status|my order|orders|order panel|cancel|cancel.*order/.test(q)) return ["Sign in with the same Google account, open the account menu, and choose Orders to see your requests. Pending orders can be cancelled there; if a seller cancels an order, it is marked out of stock."];
    if (/delivery|shipping|ship|return|refund/.test(q)) return ["Delivery timing, coverage, and return options depend on the item and are confirmed by the seller. Please check before ordering.", "Ask Lootbox Store on Instagram", instagram];
    if (/detail|ingredient|size|condition|authentic|original|before.*buy/.test(q)) return ["Please read the product’s Description and Details before buying. Photos, size, ingredients, condition, and packaging can vary by item; message us if anything needs confirmation.", "Contact Lootbox Store on Instagram", instagram];
    if (/review|rating|comment/.test(q)) return ["Open a product and choose Reviews & comments to see shopper feedback or leave a rating and comment."];
    if (/category|find|search|shampoo|perfume|fragrance|watch|shoe|clothes|t.?shirt/.test(q)) return ["Browse Shop by Category or use the search bar. Search accepts product types and keywords as well as full product names.", "Browse all finds", "store.html#collection"];
    if (/instagram|contact|message|seller|help.*person/.test(q)) return ["For item-specific questions or help from the store, message Lootbox Store on Instagram.", "Open @lootbox.storee", instagram];
    return ["I can help with browsing, product details, prices and availability, your cart, Google sign-in, orders, and reviews. For item-specific questions, message the store directly.", "Contact Lootbox Store on Instagram", instagram];
  };

  const openPanel = () => {
    panel.hidden = false;
    launcher.setAttribute("aria-expanded", "true");
    input.focus();
  };
  const closePanel = () => {
    panel.hidden = true;
    launcher.setAttribute("aria-expanded", "false");
    launcher.focus();
  };
  const submitQuestion = question => {
    const cleanQuestion = question.trim();
    if (!cleanQuestion) return;
    addMessage(cleanQuestion, "user");
    const [answer, linkText, linkHref] = answerFor(cleanQuestion);
    addMessage(answer, "bot", linkText, linkHref);
  };

  launcher.addEventListener("click", () => panel.hidden ? openPanel() : closePanel());
  closeButton.addEventListener("click", closePanel);
  root.querySelectorAll(".help-bot-suggestions button").forEach(button => button.addEventListener("click", () => submitQuestion(button.textContent)));
  form.addEventListener("submit", event => {
    event.preventDefault();
    submitQuestion(input.value);
    input.value = "";
    input.focus();
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !panel.hidden) closePanel();
  });
  addMessage("Hi! Ask me a basic question about shopping on Lootbox. For exact stock or product details, contact the store.");
})();
