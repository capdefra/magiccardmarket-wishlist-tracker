function scrapeAndCopy() {
  const sellerCards = document.querySelectorAll(".detailed-result-card");
  const data = [];
  const today = new Date().toISOString().split("T")[0];

  for (const card of sellerCards) {
    // Extract shipping cost from the seller's summary dl
    let shippingCost = 0;
    const dtElements = card.querySelectorAll("dl dt");
    for (const dt of dtElements) {
      if (dt.textContent.includes("Shipping Cost")) {
        const dd = dt.nextElementSibling;
        if (dd) {
          const parsed = parsePrice(dd.textContent.trim());
          shippingCost = Number.isFinite(parsed) ? parsed : 0;
        }
        break;
      }
    }

    // Extract cards from the desktop table
    const tableRows = card.querySelectorAll("table tbody tr");
    const cardCount = tableRows.length;
    const deliveryPerCard = cardCount > 0 ? shippingCost / cardCount : 0;

    for (const row of tableRows) {
      const cardNameEl = row.querySelector(".card-name");
      const priceEl = row.querySelector("td.text-end");

      if (!cardNameEl || !priceEl) continue;

      const cardName = cardNameEl.textContent.trim();
      const price = parsePrice(priceEl.textContent.trim());
      if (!Number.isFinite(price)) continue;

      data.push({
        cardName,
        price: price.toFixed(2),
        delivery: deliveryPerCard.toFixed(2),
        date: today,
      });
    }
  }

  if (data.length === 0) {
    alert("No cards found on this page.");
    return;
  }

  let csv = "CardName,Price,Delivery,Date\n";
  data.forEach((row) => {
    csv += `"${row.cardName}","${row.price}","${row.delivery}","${row.date}"\n`;
  });

  const textarea = document.createElement("textarea");
  textarea.value = csv;
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
  alert(`Copied ${data.length} cards to clipboard.`);
}

scrapeAndCopy();
