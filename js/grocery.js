const STORAGE_KEY = "grocery_bill_pdf_v1";

const DEFAULT_PLACE_OF_SUPPLY =
  "Mediversal Simran Multi Super Speciality Hospital\nUlao Rd, Singhaul Dih, Begusarai, Bihar 851134";

function $(id) {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing element: #${id}`);
  return el;
}

function n2(v) {
  const num = Number(v);
  return Number.isFinite(num) ? num : 0;
}

function money(v) {
  return n2(v).toFixed(2);
}

function todayISO() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatDateHuman(iso) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-").map((x) => Number(x));
  if (!y || !m || !d) return iso;
  return `${String(d).padStart(2, "0")}-${String(m).padStart(2, "0")}-${String(y).slice(-2)}`;
}

function makeItem(id, data = {}) {
  return {
    id,
    name: data.name ?? "",
    uom: data.uom ?? "KG",
    qty: data.qty ?? 1,
    rate: data.rate ?? 0,
  };
}

function uuid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

const state = {
  items: [],
  returnItems: [],
};

function defaultDoc() {
  return {
    sellerName: "NIKITA TRADERS",
    sellerGstin: "21AIQPK9098N1ZD",
    sellerAddress: "WARD NO-09, HOUSE NO-003, PAIKARAYPUR\nNEAR NISER JATNI\nKHORDHA, ODISHA - 752050\nINDIA",
    sellerState: "21-ODISHA",
    billToName: "M/S PERFECTION",
    billToGstin: "19AAOCP8586B1ZT",
    billToAddress: "Kheyadaha road, Deora, South 24Parganas\nSTATE WEST BENGAL, CODE 19",
    placeOfSupply: DEFAULT_PLACE_OF_SUPPLY,
    invoiceNo: "01",
    invoiceDate: todayISO(),
    charges: 200,
    discount: 0,
    taxPct: 0,
    bankName: "HDFC",
    bankAcc: "50100319579456",
    bankIfsc: "HDFC0009686",
    bankHolder: "MANISH KUMAR",
    items: [
      { name: "Amul Gold (Tetra Pack)", uom: "PKT", qty: 12, rate: 80 },
  
    ],
    returnItems: [],
  };
}

function readForm() {
  return {
    sellerName: $("sellerName").value.trim(),
    sellerGstin: $("sellerGstin").value.trim(),
    sellerAddress: $("sellerAddress").value,
    sellerState: $("sellerState").value.trim(),
    billToName: $("billToName").value.trim(),
    billToGstin: $("billToGstin").value.trim(),
    billToAddress: $("billToAddress").value,
    placeOfSupply: $("placeOfSupply").value.trim(),
    invoiceNo: $("invoiceNo").value.trim(),
    invoiceDate: $("invoiceDate").value,
    charges: n2($("charges").value),
    discount: n2($("discount").value),
    taxPct: n2($("taxPct").value),
    bankName: $("bankName").value.trim(),
    bankAcc: $("bankAcc").value.trim(),
    bankIfsc: $("bankIfsc").value.trim(),
    bankHolder: $("bankHolder").value.trim(),
    items: state.items.map((x) => ({ name: x.name, uom: x.uom, qty: n2(x.qty), rate: n2(x.rate) })),
    returnItems: state.returnItems.map((x) => ({ name: x.name, uom: x.uom, qty: n2(x.qty), rate: n2(x.rate) })),
  };
}

function writeForm(doc) {
  $("sellerName").value = doc.sellerName ?? "";
  $("sellerGstin").value = doc.sellerGstin ?? "";
  $("sellerAddress").value = doc.sellerAddress ?? "";
  $("sellerState").value = doc.sellerState ?? "";

  $("billToName").value = doc.billToName ?? "";
  $("billToGstin").value = doc.billToGstin ?? "";
  $("billToAddress").value = doc.billToAddress ?? "";
  $("placeOfSupply").value = doc.placeOfSupply ?? "";

  $("invoiceNo").value = doc.invoiceNo ?? "";
  $("invoiceDate").value = doc.invoiceDate ?? todayISO();

  $("charges").value = n2(doc.charges ?? 0);
  $("discount").value = n2(doc.discount ?? 0);
  $("taxPct").value = n2(doc.taxPct ?? 0);

  $("bankName").value = doc.bankName ?? "";
  $("bankAcc").value = doc.bankAcc ?? "";
  $("bankIfsc").value = doc.bankIfsc ?? "";
  $("bankHolder").value = doc.bankHolder ?? "";

  state.items = (doc.items ?? []).map((it) => makeItem(uuid(), it));
  if (state.items.length === 0) state.items = [makeItem(uuid())];

  state.returnItems = (doc.returnItems ?? []).map((it) => makeItem(uuid(), it));

  renderItemsEditor();
  renderReturnItemsEditor();
  renderPreview();
}

function sumLineItems(list) {
  return list.reduce((sum, it) => sum + n2(it.qty) * n2(it.rate), 0);
}

function compute() {
  const charges = n2($("charges").value);
  const discount = n2($("discount").value);
  const taxPct = n2($("taxPct").value);

  const subtotal = sumLineItems(state.items);
  const returnAmount = sumLineItems(state.returnItems);
  const afterReturns = subtotal - returnAmount;
  const taxableBase = Math.max(0, afterReturns + charges - discount);
  const tax = taxableBase * (taxPct / 100);
  const grand = taxableBase + tax;

  return { subtotal, returnAmount, afterReturns, charges, discount, tax, grand };
}

/** Summary display: returns shown as a negative deduction. */
function formatReturnAmountLine(returnAmount) {
  const n = n2(returnAmount);
  if (n <= 0) return "0.00";
  return `-${money(n)}`;
}

function renderReturnItems() {
  const section = document.getElementById("return-section");
  const hasReturns = state.returnItems.length > 0;
  if (section) {
    section.style.display = hasReturns ? "block" : "none";
  }
  const panelWrap = document.getElementById("return-panel-wrap");
  if (panelWrap) {
    panelWrap.style.display = hasReturns ? "block" : "none";
  }
  const summaryLine = document.getElementById("return-summary-line");
  if (summaryLine) {
    summaryLine.style.display = hasReturns ? "" : "none";
  }
}

function renderItemsEditor() {
  const body = $("itemsBody");
  body.innerHTML = "";

  for (const it of state.items) {
    const row = document.createElement("div");
    row.className = "itemrow";

    const name = document.createElement("input");
    name.className = "field__input";
    name.placeholder = "Item";
    name.value = it.name;
    name.addEventListener("input", () => {
      it.name = name.value;
      renderPreview();
    });

    const uom = document.createElement("input");
    uom.className = "field__input";
    uom.placeholder = "KG";
    uom.value = it.uom;
    uom.addEventListener("input", () => {
      it.uom = uom.value.toUpperCase();
      renderPreview();
    });

    const qty = document.createElement("input");
    qty.className = "field__input num";
    qty.type = "number";
    qty.step = "0.01";
    qty.min = "0";
    qty.value = String(it.qty);
    qty.addEventListener("input", () => {
      it.qty = n2(qty.value);
      renderItemsEditorAmountsOnly();
      renderPreview();
    });

    const rate = document.createElement("input");
    rate.className = "field__input num";
    rate.type = "number";
    rate.step = "0.01";
    rate.min = "0";
    rate.value = String(it.rate);
    rate.addEventListener("input", () => {
      it.rate = n2(rate.value);
      renderItemsEditorAmountsOnly();
      renderPreview();
    });

    const amount = document.createElement("input");
    amount.className = "field__input num";
    amount.type = "text";
    amount.value = money(n2(it.qty) * n2(it.rate));
    amount.readOnly = true;
    amount.dataset.amountFor = it.id;

    const del = document.createElement("button");
    del.className = "iconbtn";
    del.type = "button";
    del.title = "Remove";
    del.textContent = "×";
    del.addEventListener("click", () => {
      state.items = state.items.filter((x) => x.id !== it.id);
      if (state.items.length === 0) state.items = [makeItem(uuid())];
      renderItemsEditor();
      renderPreview();
    });

    row.append(name, uom, qty, rate, amount, del);
    body.append(row);
  }
}

function renderItemsEditorAmountsOnly() {
  for (const it of state.items) {
    const el = document.querySelector(`[data-amount-for="${it.id}"]`);
    if (el) el.value = money(n2(it.qty) * n2(it.rate));
  }
}

function renderReturnItemsEditor() {
  const body = $("returnItemsBody");
  body.innerHTML = "";

  for (const it of state.returnItems) {
    const row = document.createElement("div");
    row.className = "itemrow";

    const name = document.createElement("input");
    name.className = "field__input";
    name.placeholder = "Return item";
    name.value = it.name;
    name.addEventListener("input", () => {
      it.name = name.value;
      renderPreview();
    });

    const uom = document.createElement("input");
    uom.className = "field__input";
    uom.placeholder = "KG";
    uom.value = it.uom;
    uom.addEventListener("input", () => {
      it.uom = uom.value.toUpperCase();
      renderPreview();
    });

    const qty = document.createElement("input");
    qty.className = "field__input num";
    qty.type = "number";
    qty.step = "0.01";
    qty.min = "0";
    qty.value = String(it.qty);
    qty.addEventListener("input", () => {
      it.qty = n2(qty.value);
      renderReturnItemsEditorAmountsOnly();
      renderPreview();
    });

    const rate = document.createElement("input");
    rate.className = "field__input num";
    rate.type = "number";
    rate.step = "0.01";
    rate.min = "0";
    rate.value = String(it.rate);
    rate.addEventListener("input", () => {
      it.rate = n2(rate.value);
      renderReturnItemsEditorAmountsOnly();
      renderPreview();
    });

    const amount = document.createElement("input");
    amount.className = "field__input num";
    amount.type = "text";
    amount.value = money(n2(it.qty) * n2(it.rate));
    amount.readOnly = true;
    amount.dataset.amountReturnFor = it.id;

    const del = document.createElement("button");
    del.className = "iconbtn";
    del.type = "button";
    del.title = "Remove";
    del.textContent = "×";
    del.addEventListener("click", () => {
      state.returnItems = state.returnItems.filter((x) => x.id !== it.id);
      renderReturnItemsEditor();
      renderPreview();
    });

    row.append(name, uom, qty, rate, amount, del);
    body.append(row);
  }
}

function renderReturnItemsEditorAmountsOnly() {
  for (const it of state.returnItems) {
    const el = document.querySelector(`[data-amount-return-for="${it.id}"]`);
    if (el) el.value = money(n2(it.qty) * n2(it.rate));
  }
}

function setText(id, value) {
  $(id).textContent = value && String(value).trim() ? String(value) : "—";
}

function setHtml(id, value) {
  const el = $(id);
  const v = value && String(value).trim() ? String(value) : "—";
  el.textContent = v;
}

/** One flowing line for preview (like printed invoice). */
function addressAsSingleLine(text) {
  if (!text || !String(text).trim()) return "";
  return String(text).trim().replace(/\s*\n+\s*/g, " ").replace(/\s+/g, " ");
}

function renderPreview() {
  const doc = readForm();

  setText("vSellerName", doc.sellerName);
  setText("vSignFor", doc.sellerName);
  setHtml("vSellerAddress", addressAsSingleLine(doc.sellerAddress));
  setText("vSellerGstin", doc.sellerGstin);
  setText("vSellerState", doc.sellerState);

  setText("vBillToName", doc.billToName);
  setHtml("vBillToAddress", doc.billToAddress);
  setText("vBillToGstin", doc.billToGstin);
  setHtml("vPlaceSupply", doc.placeOfSupply);

  setText("vInvoiceNo", doc.invoiceNo);
  setText("vInvoiceDate", formatDateHuman(doc.invoiceDate));

  const payToWrap = $("vPayToWrap");
  const hasPay =
    doc.bankName || doc.bankAcc || doc.bankIfsc || doc.bankHolder;
  payToWrap.style.display = hasPay ? "" : "none";
  setText("vBankName", doc.bankName);
  setText("vBankAcc", doc.bankAcc);
  setText("vBankIfsc", doc.bankIfsc);
  setText("vBankHolder", doc.bankHolder);

  const vItems = $("vItems");
  vItems.innerHTML = "";

  state.items.forEach((it, idx) => {
    const row = document.createElement("div");
    row.className = "table__row table__row--item";
    const amount = n2(it.qty) * n2(it.rate);

    row.innerHTML = `
      <div>${idx + 1}</div>
      <div>${escapeHtml(it.name || "")}</div>
      <div>${escapeHtml((it.uom || "").toUpperCase())}</div>
      <div class="num">${trimZeros(it.qty)}</div>
      <div class="num">${money(it.rate)}</div>
      <div class="num">${money(amount)}</div>
    `;
    vItems.append(row);
  });

  const vReturnItems = $("vReturnItems");
  vReturnItems.innerHTML = "";

  state.returnItems.forEach((it, idx) => {
    const row = document.createElement("div");
    row.className = "table__row table__row--item";
    const amount = n2(it.qty) * n2(it.rate);

    row.innerHTML = `
      <div>${idx + 1}</div>
      <div>${escapeHtml(it.name || "")}</div>
      <div>${escapeHtml((it.uom || "").toUpperCase())}</div>
      <div class="num">${trimZeros(it.qty)}</div>
      <div class="num">${money(it.rate)}</div>
      <div class="num">${money(amount)}</div>
    `;
    vReturnItems.append(row);
  });

  renderPreviewTotalsOnly();
  renderReturnItems();
}

function renderPreviewTotalsOnly() {
  const { subtotal, returnAmount, charges, discount, tax, grand } = compute();
  $("vSubtotal").textContent = money(subtotal);
  $("vReturnAmount").textContent = formatReturnAmountLine(returnAmount);
  $("vCharges").textContent = money(charges);
  $("vDiscount").textContent = money(discount);
  $("vTax").textContent = money(tax);
  $("vGrand").textContent = money(grand);
}

function trimZeros(v) {
  const num = n2(v);
  const s = num.toFixed(2);
  return s.replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function attachLivePreview() {
  const ids = [
    "sellerName",
    "sellerGstin",
    "sellerAddress",
    "sellerState",
    "billToName",
    "billToGstin",
    "billToAddress",
    "placeOfSupply",
    "invoiceNo",
    "invoiceDate",
    "charges",
    "discount",
    "taxPct",
    "bankName",
    "bankAcc",
    "bankIfsc",
    "bankHolder",
  ];

  for (const id of ids) {
    $(id).addEventListener("input", () => renderPreview());
    $(id).addEventListener("change", () => renderPreview());
  }
}

function save() {
  const doc = readForm();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(doc));
}

function load() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const doc = JSON.parse(raw);
    const pos = doc.placeOfSupply != null ? String(doc.placeOfSupply).trim() : "";
    if (!pos || pos === "Begusarai, Bihar") {
      doc.placeOfSupply = DEFAULT_PLACE_OF_SUPPLY;
    }
    return doc;
  } catch {
    return null;
  }
}

function newDoc() {
  localStorage.removeItem(STORAGE_KEY);
  writeForm(defaultDoc());
}

function init() {
  $("invoiceDate").value = todayISO();

  $("btnAddItem").addEventListener("click", () => {
    state.items.push(makeItem(uuid(), { uom: "KG", qty: 1, rate: 0 }));
    renderItemsEditor();
    renderPreview();
  });

  $("btnAddReturnItem").addEventListener("click", () => {
    state.returnItems.push(makeItem(uuid(), { uom: "KG", qty: 1, rate: 0 }));
    renderReturnItemsEditor();
    renderPreview();
  });

  $("btnPrint").addEventListener("click", () => {
    save();
    document.title = `invoice-${$("invoiceNo").value || "pdf"}`;
    window.print();
  });

  $("btnSave").addEventListener("click", () => save());
  $("btnNew").addEventListener("click", () => newDoc());

  attachLivePreview();

  const fromStorage = load();
  writeForm(fromStorage ?? defaultDoc());
}

init();
