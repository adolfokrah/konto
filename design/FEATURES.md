# Cahier prototype: feature list and audit report

Scope: `design/inventory-prototype.html`, the single-file mobile prototype of the Cahier shop app.
Audited on 11 Oct 2026 by driving the prototype in headless Chromium, starting from an empty account and growing one shop through every add-on.

Cahier is an AI sales agent for small shops. The agent answers customers on WhatsApp, Instagram, Facebook and TikTok and collects orders. The owner (or staff) closes the sale in the app. The app also runs the counter: till, stock, team, reports.

---

## Product vision

Cahier deeply integrates AI into the platform to help businesses drive more sales through social media. It also gives advanced business analytics, sales forecasting and actionable insights, so owners can decide and grow with evidence.

1. **Sell more on social media.** The agent answers customers on WhatsApp, Instagram, Facebook and TikTok. It knows the catalogue, prices and stock. It recommends products, collects order details and tells the seller, who closes the sale.
2. **Analytics.** Sales, profit, categories, channels, staff, branches and customers, in one place and in the shop's own terms.
3. **Forecasting.** Items likely to run out, reorder quantities, busy hours and expected demand, from sales and chat history.
4. **Actionable insights.** The app says what to do next: restock this, chase that unpaid sale, push this product on chat, follow up this lead.

The till, stock, team and reports are the data foundation. Their figures must be correct (see Part 2), because the AI and the forecasts read them.

Status in this prototype: the agent, channels, orders from chats, and the Insights and forecast screen exist as screens (see 3.10 and 3.11). Smarter forecasting and recommendations are a design direction, not built.

---

## Part 1. How the audit was run

One fictional business, grown in stages. Nothing was seeded: new account, empty storage.

| Stage | What was done |
|---|---|
| 0. Sign up | Email code sign-in, onboarding (Ama Provisions, grocery, GHS, WhatsApp + in-shop, 1 branch, products from scratch, only the Products add-on). |
| 1. Basic shop, cash only | Products (simple, variants, batches with expiry, selling units, product extras, serial numbers, weight), cash sales, discounts, hold, returns, void, part payment, customers, till, stock adjust/count/history, supplier + purchase order, team and roles. |
| 2. Add-ons as the shop grows | Mobile money, Card, Expenses, End of day, Tax invoices, Activity log, Loyalty, Gift cards, Devices, Offline and backup, Currency, Customer inbox (WhatsApp connected), Insights, Customer display, Restaurant tools, Services and bookings. All 17 add-ons were installed. |
| 3. Branches | Osu Branch (copy of products, stock 0, filled by transfer) and Labone Cafe (no products, a product sold only there). |
| 4. Cross-checks | Stock ledger vs on-hand for every product/variant/batch/branch, sale invariants, till drawer maths, day-end vs sales report vs exports, all-branches totals. |
| 5. Extras | Multi-shop, logout/login, import/undo, exports, remove/re-add an add-on, clear data, view-as for each role, smoke test of every More screen. |

Result: 21 fixes committed in this branch, one new feature (barcode labels) and 10 open items (plus a list of small ones) left for a decision (Part 2). A second full pass on a fresh account re-checked every fix, added input fuzzing and a 1,500-product load test. No JavaScript errors were raised by any of the roughly 40 top-level screens that were smoke tested.

---

## Part 2. Findings

### 2.1 Fixed in this branch

| # | Area | Defect | Fix |
|---|---|---|---|
| 1 | End of day, Sales report, Sales export | "How it was paid" counted the change handed back on a take-payment as cash received. Cash was overstated by the change (GH₵ 10.00 in the test) and payments no longer summed to sales. | Per-payment change is now subtracted in all three places. |
| 2 | Sales report | Payment donut centre showed net sales, not the sum of the slices. | Centre shows money taken. |
| 3 | Sales report | Items with no category were labelled "Other" and collided with the "Other categories" roll-up, so the same amount was listed twice. | Uncategorised items are labelled "Uncategorised". |
| 4 | Tables | "N guest orders waiting" counted accepted and declined orders. | Only pending guest orders are counted. |
| 5 | Time clock | Every new shop got fake 8-hour shifts for yesterday and the day before ("16h this week" on an empty shop). | Only sample shops are seeded. |
| 6 | Stock levels, stock home | With several branches the quantities summed all branches while the branch picker said "Osu Branch". | The list follows the selected branch. |
| 7 | Void sale | Voiding a sale that was paid with a gift card or loyalty points did not restore the card balance or points, and told the cashier to hand the full amount back as cash. | Gift balance and points are restored, points earned are reversed, the cash refund covers money methods only. |
| 8 | Booking page | Once a confirmed booking was converted to a sale the slot became free again, so the same time could be booked twice. | Converted bookings keep blocking the slot (page and clash warning). |
| 9 | Till | Money taken for selling or topping up a gift card never reached the till, so the expected drawer cash was short and the close showed a false overage. | Gift sales and top-ups are recorded against the open shift. |
| 10 | Data tools | "Clear all data" replaced the whole shop state. Team, roles, add-ons, branches and devices were wiped, and More > Business then crashed (`Cannot read properties of undefined (reading 'printer')`). | Clears products, sales, customers, orders and history only. Team, branches, add-ons and settings stay. |
| 11 | Receipts | Serial-number items were assigned a serial at the sale but the receipt, sale page and shared text never showed it. | Receipt lines show `S/N …`. |
| 13 | Product, variant, unit and option forms | A product price of -5 was saved; so were a price of GH₵ 99,999,999,999 and a 300-character name. | Prices and costs must be 0 to GH₵ 100M, names 120 characters or fewer. |
| 14 | Expenses, stock, purchase orders, cart | An expense of GH₵ 1,000,000,000,000, a stock add of 1,000,000,000,000 pieces and a draft purchase order with quantity -3 were accepted. A cart line of 1,000,000 passed the line check. | Size caps and a non-negative check on all four. |
| 12 | Merge of `main` into this branch | Five conflicts in the filter sheets, expense list/form/actions and time clock. | Resolved keeping the shared filter pattern, branch filter inside the sheets, payment options from add-ons, POS-only expense entry and expense details from `main`; expense action gate moved to `posExpense`. |
| 15 | Discounts, returns, voids | Owner approval had no credential: a cashier tapped "Owner approves" on their own device. | Approval needs a manager or owner PIN (new "Approve discounts, returns and voids" permission, set on the role). Managers and owners approve without a prompt. Seed PINs: owner 1111, manager 4321, cashier 1234. The approver is written to the sale and the Activity log. |
| 16 | Till, sale taxes | Price override and tax removal had no permission and no log entry. | New permissions "Change item prices at the till" and "Add or remove taxes on a sale" (Manager on, Cashier off). Price changes and tax edits go to the Activity log. |
| 17 | Till | Cash expenses did not reduce the cash that should be in the drawer. | When the till is open and a new cash expense is saved for today, the app asks "Paid from the till?". Yes takes it off the expected cash and shows it on the till and close screens. No leaves the drawer alone. Mobile money, card, recurring and closed-till expenses never ask. The cash-out screen warns not to record them twice. |
| 18 | End of day | Closing the day did not stop later changes to its figures. | A closed day (or branch) blocks new sales, returns, voids and expense changes dated in it. A manager or owner can reopen it from End of day. Part payments on old credit sales are still allowed. |
| 19 | Stock value, stock levels | Archived products that still held stock vanished from the valuation. | They stay in Stock value (and its export) and Stock levels, marked Archived. The archive warning says so. |
| 20 | Sales report | Category donut and top items used pre-discount line amounts, so they did not add up to net sales. | Each sale's net (after discount, tax and refunds) is shared across its lines. Totals match net sales exactly (checked on 442 sample sales). |
| 21 | POS | Item cards counted expired and held batches as available (27 shown, 13 sellable). | Cards show sellable stock only. |

### 2.2 Open: needs a decision

Security and money controls (highest priority for production)

5. **Loyalty points are earned on unpaid sales.** A credit sale of GH₵ 41.40 awarded 41 points before any payment.

Reporting and stock

7. The Sales tab header says "Today · 22 sales" while the list header says "26 sales" (the list counts voided and quote rows).
9. After a partial return the sale page still shows "Cost of goods" for the original quantity while profit reflects the restocked cost.
11. Day-end "How it was paid" excludes gift cards sold (cash received for a gift card is in the drawer but not on the report).

Product and copy

12. The product form forces a base retail price even when every variant has its own price.
13. Receive-order confirm says "Cost price updates from GH₵ 55.00 to GH₵ 52.00 each" but the result is the landed weighted average (GH₵ 54.52).
14. A brand-new shop adds 15% "Standard rated" tax to every sale by default, even with the Tax invoices add-on off and no tax question in onboarding.

16. There is no tax-inclusive pricing. The inclusive path in the totals code is hard-coded off, so a shelf price of GH₵ 36.00 becomes GH₵ 41.40 at the till. Barcode labels therefore print the tax-included price by default (a toggle turns it off).
17. Zero prices and a cost above the price are accepted without a warning (a free item or a loss-maker can be saved).

Small items: Activity log files a void under "Catalog"; keypad in expense mode shows `Charge GH₵ 51.75` (tax added) while the expense cart has no tax; the split sale loses its table name; the customer page lists a converted quote as a second "Paid" row; the "Full" button on a split-payment row overwrites the other rows instead of filling the rest; the receipt shows tendered cash plus "Change given", so rows add up to more than the total on part payments; view-only product page says "Tap a branch to adjust it"; Agent order "Estimated total" excludes tax; warranty months is stored but never printed.

Demo data that does not match the shop

15. "Demo: a customer writes in" always uses two canned chats (Samsung A15 at GH₵ 2,200; a carton of Indomie at GH₵ 32). The WhatsApp channel page shows three fake "recent chats" older than the connection time. Insights shows "Sales from chats GH₵ 0.00" even though a WhatsApp order became a GH₵ 92.58 sale.

---

## Part 3. Feature list by area

Notation: **(add-on)** means the feature appears only after that add-on is installed. Everything else is in the base app.

### 3.1 Account, shops, onboarding

- Sign in with email (6-digit code; the prototype prints the code), Google or Apple. A new email creates the account on first confirmation.
- Onboarding, six steps, each on its own page:
  1. Your business: name, shop name, phone, business type (shop, restaurant/café, phones, fashion/beauty, salon/services, other), currency (GHS, NGN, KES, ZAR, USD, EUR, GBP).
  2. Where you sell: WhatsApp, Instagram, Facebook, TikTok, in my shop, markets/on the road.
  3. Branches: name the main branch, add more branches.
  4. Products: sample catalogue, start from scratch, or import from another system.
  5. Add-ons: recommended for the business type and pre-selected; any can be switched off.
  6. Review and open the shop.
- "Start over" at any step. Per-shop "Start over" in Data tools.
- Several shops per account: "Choose a shop" after login, add another shop (own products, stock, sales, team), switch from More > Your shops. Data is isolated per shop.
- Account page: name, email, log out. Logout returns to the welcome screen.

### 3.2 Navigation and personalisation

- Bottom bar with up to 3 tabs plus More. Tabs can be replaced from a catalogue of screens (POS, Sales, Services, Products, Stock, Discounts, Purchases, Suppliers, Expenses, Sales report, End of day, Notifications, Insights, Customers, Inbox, Team, Kitchen, Tables, Held sales, Till, Gift cards, Orders). Choice is per user; "Reset to usual".
- More groups: Whole business, This branch, Just for me, Data tools. Items appear only when the add-on is installed and the role allows them.
- Header branch switcher on branch-scoped tabs (POS, Stock, Services, Tables and others), with "All branches" where reports allow it.
- "View as": the owner previews the app as any accepted team member.
- Notifications with a bell badge and notification settings (new orders, bookings, kitchen, stock, money, deliveries) plus a "send a test order" button.
- Light and dark theme follow the viewer.

### 3.3 Catalogue

Product form (single page plus optional extras)

- Name, cost price (owners only), retail price, other price lists, profit and margin shown live.
- Sold as: piece, bottle, pack, box, sachet, bag, dozen, pair, or by weight, volume, length (kilogram, gram, litre and so on); decimal quantities.
- Track stock with opening stock (per branch when there are several), low-stock alert per product or branch.
- Serial numbers (one per line) and warranty months; the serial is assigned when sold and printed on the receipt.
- More details: photo or colour, category, brand, description, barcode, SKU (generated if empty), taxes, supplier.
- Sold at: all branches or a chosen set. Branch prices: a different price at one branch.
- Promo price: percent off, optional start and end dates; shown at the till as "20% off promo".
- Variants: attributes (for example Flavour: Cola), own price, cost, SKU, barcode, stock and alerts per variant; copy a variant.
- Batches: batch number, expiry, made-on, cost, opening stock; oldest expiry sells first; expired batches are skipped when "Block expired batches" is on; "Soon" and "Expired" flags; notification when a batch expires.
- Selling units: packs, cartons, dozens with a piece count, price, barcode, selling and buying use. Stock is held in the base unit.
- Product add-ons (extras and choices): groups such as Toppings, pick one or several, required or not, option price, option cost, "takes from stock", pre-selected.
- Save as active or draft. Duplicate, archive, restore, delete (blocked once sold; archive instead). Change history for each product.

Lists and tools

- Products list: search, quick filters (All, Low stock, Out of stock, categories), filter sheet (status, branch, category, no barcode, no cost price, low margin), sort.
- Select several: change price (selling or cost; raise, lower or set; percent; round to none, 10 or 50 pesewas; preview and confirm), set category, set sold at, archive.
- Your lists: units, categories, brands, attributes, taxes (standard 15%, zero-rated, exempt, your own), write-off reasons.
- Price lists: Retail and Wholesale plus quick-add lists (Distributor, Staff, Member, Online) or your own. Each product chooses which lists it sells at. The cart switches the whole sale to a list.
- Saved discounts: percent or amount, applies to items, whole sale or both.
- Import: sources offered are Excel/Google Sheets CSV, photo of a notebook, Square, Shopify, QuickBooks, Zoho, Lightspeed/Vend or another system; kinds are products, customers, suppliers, past sales; template download; column matching; review (ready, already here, skipped); run; undo the import. Only the CSV products path was exercised in this audit.
- Export: products, sales, customers, stock value, expenses (CSV) and a full backup.
- Barcode labels: Products menu > Print barcode labels, a product's menu, Select several > Print labels, a batch or variant on the Stock item page, or the Batches page. Pick products, variants or batches (each batch is its own row), set copies per row or tap Use stock to print one label per unit on hand. Sizes: 40 × 25 mm, 50 × 30 mm and 60 × 40 mm rolls, or an A4 sheet of 3 × 7. Choose what shows: name (with variant), price (with tax added by default, so it matches the till), the code as text, expiry and lot on batch labels, shop name. A live preview shows the first label. Bars are Code 128 and encode the variant or product barcode, or the SKU when there is no barcode. Items with neither show "Make a barcode", which creates and saves a unique code. Printing opens a print-ready page sized to the label (set to the roll size or A4) for the label printer, or Save as PDF. Scanning a SKU at the till adds the item or variant, so SKU-only labels work. Settings (size, toggles) are remembered and each print is written to the Activity log.

### 3.4 Selling at the till

- Three modes: keypad (custom amount), item grid (category chips, search or scan a barcode, Enter adds the match) and favourites.
- Pickers for variant, selling unit, batch (auto or chosen), product extras and weight/quantity.
- Cart: quantity, line price override (warns if below cost), line note, line discount, whole-sale discount (saved or custom, percent or amount, with a reason), customer, order note, price list, taxes on this sale (remove or add), "Sale / Purchase / Expense" destination.
- Stock guard: "Only N available" blocks a sale at zero unless "Allow selling at zero stock" is on (stock then goes negative and shows as out).
- Hold with a name, resume, delete. Held items keep their stock when the setting is on. One cart per branch is kept when switching branches.
- Save as quote (due date from stock settings), view, edit, send as invoice, convert to sale, delete.
- Payment: pay in full, part payment (deposit, optional pay-by date), pay later (blocked above the customer's credit limit). Methods: cash (quick amounts, change), mobile money (network, number, prompt, demo approve/decline) **(Mobile money)**, card **(Card)**, gift card **(Gift cards)**, loyalty points **(Loyalty)**, split between methods. Tips can be added on a full payment when tips are on.
- Discounts above the role's limit need approval before payment.
- Time clock can be required before selling.
- Receipt: paid, part paid or quote; send, print **(Devices)**, company receipt (company name, TIN, address, reference, one-line description), refund slip. Tax header, invoice number and footer **(Tax invoices)**.
- Customer display (second screen next to the POS on wide screens) shows items, tax, total, payment prompts and thank-you **(Customer display)**.

### 3.5 Sales management

- Sales tab: today's takings, search, status and date filters, owed-to-you filter, per-sale rows with customer, channel, table and balance.
- Sale page: items, discounts, tax, payments, change, cost of goods and profit (owners), delivery status, company receipt.
- Take payment on a part-paid or credit sale (full or part, cash change), send reminder, send as invoice.
- Return items: any quantity or unit, reason, back to stock or write-off, refund by cash, shown as a refund on the sale and in the till.
- Void sale: stock returns, refund recorded in the till; gift card balance and points restored; needs approval when the setting is on.
- Mark delivered for delivery orders.
- Sales report: takings over time, how customers paid, sales by category, where sales came from (walk-in vs channels), tax, owed, profit, expenses and profit after expenses **(Expenses)**, returns and voids, top sellers; category and top-item totals are each sale's net share, so they add up to sales after refunds; periods today/7/30/90 days; branch or all branches.

### 3.6 Customers and credit

- Customers list, add inline from the cart, detail page (contact, bought, orders, owed, history, credit limit, points **(Loyalty)**), new sale for a customer, payment reminder.
- Credit limit per customer enforced on pay later and part payment.
- Loyalty **(Loyalty)**: earn rate, redeem rate, minimum to redeem; points shown on the customer; paid with at the till, remainder by another method.
- Gift cards **(Gift cards)**: sell at preset or any amount, buyer, paid by cash/mobile money/card, top up, history, pay at the till (full or partial).

### 3.7 Till, cash and time

- Till: open with opening cash, sales and cash taken in the shift, add cash, take cash out with a reason, no-sale (open drawer), close with a counted amount (expected, short or over shown, balanced), earlier shifts and shift detail.
- Expected cash = opening + cash sales − cash refunds + cash added − cash taken out − cash expenses marked "paid from the till" + gift card sales. Those are not entered again as "Take cash out".
- Time clock: clock in/out, clock in with a PIN kiosk, manager clocks others in/out, per-branch entries, hours this week, edit an entry, settings (use clock, require before selling, ask for PIN, till opens and closes link to clock, ask to clock out before logging out).
- Switching branch while clocked in asks to clock out first.

### 3.8 Stock

- Stock home: items, low and out counts, needs-attention list, reorder low items.
- Stock levels by item (variants and batches shown separately), search, filters, per-branch.
- Adjust: add, remove or set count with a reason (found, returned, correction, damaged, expired, lost, returned to supplier, other, plus your own).
- Take stock: blind count by category, review differences (missing and extra at cost), apply, save and finish later.
- Stock history (who, when, why) for all or one item; stock value at cost and selling price (archived products that still hold stock stay in, marked Archived); the POS card shows sellable stock only (expired and held batches excluded); stock report (lost stock by reason, items not moved in 30 days).
- Transfers between branches: draft, send (stock leaves), receive with arrived quantities and shortage reasons; works with batches and selling units.
- Suppliers: contact, phone, email, address, terms, lead time, account, notes.
- Purchase orders: draft, send, already received; per-line supplier, quantity, cost; shared extra costs (freight, duty); mark paid; receive (add to stock or not), cost updates to a weighted average that includes freight.
- Stock settings: default low-stock alert, quote validity, discount limit without the owner, held sales keep stock, returns and voids need the owner, cost method (average or latest), allow selling at zero stock, block expired batches, ask to open the till, tips, new services start tax-free.

### 3.9 Team, roles and branches

- Roles: Owner (locked), Manager, Cashier, Stock keeper, plus custom roles (start from a template, tick permissions by area and create/read/update/delete, special permissions: see cost and profit, reports, everyone's sales, till, everyone's shifts, import/export, settings, discount limit).
- Members: invite by phone, role, Till PIN, extra allow or block permissions, works at all branches or one, suspend, remove, resend invite, "mark invite as accepted (demo)", view as.
- Branch scope: a member limited to one branch sees "Showing <branch> only" and has no branch picker.
- Branches: add with copied or empty product list, per-branch stock, prices, tables, working hours, clock, till, kitchen; remove branch.

### 3.10 Add-ons

All 17 can be added from More > Add-ons (Get, Open, Remove). Removing hides the screens and tiles but keeps the data; adding back restores it.

| Add-on | What it adds |
|---|---|
| Products | Catalogue, stock, suppliers, purchase orders (everything in 3.3 and 3.8). |
| Mobile money | MTN, Telecel, AirtelTigo prompt at the till, split and refunds. |
| Card | Card payment tile and prompt. |
| Gift cards | See 3.6. |
| Loyalty points | See 3.6. |
| Expenses | Record on the POS (enter amount, add to cart, choose Expense), category, date, paid-with, note, receipt photo, repeating expenses (catch-up creates missed entries), expense details, edit, delete, filters (period, branch), export, profit after expenses. |
| End of day report | Sales, takings by method, discounts, refunds, tax, owed, expenses, tills closed, best sellers; close the day (a closed day blocks new sales, returns, voids and expense changes dated in it); managers and owners can reopen it; print and share. |
| Tax invoices | Shop details, TIN, address, footer, invoice number on every receipt, optional sending to the tax authority. |
| Activity log | Who changed what (prices, roles, voids, returns, tills, settings), filter by area, cannot be edited. |
| Printer and devices | Receipt printer, cash drawer, barcode scanner, weighing scale; print every receipt automatically; drawer opens on cash sales. |
| Offline and backup | Work offline (sales queue and sync), banner, daily backup, download a copy. |
| Currency | Seven currencies; changes every screen. |
| Customer inbox | Chats from channels in one list with Needs you, Agent and Closed; take over, reply, quick replies, mark won or lost. |
| Insights and forecast | Agent results, chat-to-sale funnel, items likely to run out with days left and reorder, busy hours. |
| Customer display | See 3.4. |
| Restaurant tools | Tables per branch, hold orders on a table, merge items onto one bill, hold and send to kitchen, hold and split, kitchen screen with per-item stages (new, cooking, ready, served) and print or reject, table QR codes with a guest ordering page (staff acceptance optional), delivery with address and status, tips, notifications for deliveries. |
| Services and bookings | Services (fixed, starts-from or quote-first price, duration, place, question the agent asks), booking page link and QR with free times from working hours, booking requests (new, confirmed, past), confirm, message, decline or cancel, convert to sale, working hours per branch. |

### 3.11 Channels and the agent

- Channels: WhatsApp Business, Instagram, Facebook Page, TikTok. Connect with a verification step; status, chats today, orders, reply time.
- Agent rules: replies, quotes prices from the catalogue, states stock, takes booking requests, which branch it sells from, hand over when the customer asks for a discount, a refund or complaint, or something it cannot answer; first message; pause; disconnect; send a test order. The agent never takes payment or changes prices.
- Orders: agent and table orders arrive in Orders (New, Sold, Closed; from channels or tables), open the chat, message, convert to sale (cart pre-filled with customer), close.

### 3.12 Public pages

- Table QR page: Ama Provisions banner and logo, menu by category, add to order with variants and extras, total with tax, place order; arrives as a guest order.
- Booking page: choose a service, day (only open days), time slot, name, phone, note; arrives as a booking request.

### 3.13 Data and safety

- Everything saves to local storage per shop. Export and full backup. Import with undo. Offline queue with sync.
- Data tools: Start over, Load sample products, Clear all data.
- Permission model: roles with C/R/U/D per area plus special permissions; discount limit; returns and voids approval by manager or owner PIN (permission "Approve discounts, returns and voids"; seed PINs owner 1111, manager 4321, cashier 1234); cashiers cannot change line prices or sale taxes unless given "Change item prices at the till" and "Add or remove taxes on a sale"; cost and profit hidden from roles without cost view.

---

## Part 4. Reconciliation evidence

After the full scenario (3 branches, 29 sales and quotes, 17 add-ons):

- Stock ledger: for every product, variant, batch and branch the sum of stock moves equals the on-hand quantity and the last "after" value.
- Every completed sale: sum of lines = subtotal; total = subtotal − discount + tax (+ tip); paid + due = total; sum of line paid = total.
- All-branches sales report = sum of branch reports = sales export (net of refunds).
- End of day payments (cash + mobile money + card) equal sales after the change fix; tax, discounts and gross match recomputation from the sale records.
- Till: opening 50, cash sale 8.86 and 6.33, cash return 4.43, void 6.33 gave an expected drawer of 54.43 and a balanced close.
- Barcode labels: 16 of 16 labels (4 sizes × a product, a batch, a variant and a SKU-only item) were rendered and decoded with an independent Code 128 reader and returned the exact code.
- Fuzzing: negative, text, zero and oversized values were tried on product prices, cart quantity and price, discounts, cash received, part payments, gift cards, customer phone, expenses, stock adjustments and purchase orders. After the fixes above every case is rejected with a message, except the zero-price and loss-making cases listed as open.
- Load: 1,500 products with history gave POS in 0.6 s, product list in 0.9 s, stock list in 0.5 s, 13,600 DOM nodes and 1.5 MB of storage. Lists are not virtualised and storage is limited to the browser's local storage, so the practical limit is a few thousand products.
- Stock value 899.50 at cost and 1,232.50 at retail matched manual computation before further activity.
