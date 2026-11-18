# Zoho Books: end-to-end workflows and document lifecycles (state machines), as of Nov 2026

Method note: Most material comes from the current official Zoho Books help center (US edition pages under `/us/books/help/`, India pages under `/in/books/help/`), fetched 18 Nov 2026, and the official API v3 reference (`/books/api/v3/`), which lists status enums and action endpoints for each resource. Some statements below are labelled as API-only or screenshot-only. Help screenshots were downloaded and viewed to confirm the guided-next-step banners. "Region" means the regional edition (Global, US, India and others). Help pages show an "Available Plans" widget, but the plan names did not appear in the fetched text, so plan gating is mostly listed under Gaps.

Notation: `FROM --[action/trigger]--> TO (side effects)`.

---

## 1. Sales flow: Quote → Sales Order → (Delivery Challan, India) → Invoice → Payment Received → Credit Note, plus Retainer, Recurring, Reminders, Late Fees, Debit Notes, Sales Receipts, Payment Links

### Takeaway
On the sales side, each document has its own small state machine. They are linked by explicit "Convert to X" actions (Quote→SO/Invoice/Retainer/Project, SO→Invoice/PO, Delivery Challan→Invoice, Invoice→Credit Note). Payments and credits are separate records that are "applied" to invoices, and applying them moves the invoice through Partially Paid and Paid. Automation hooks run around the lifecycle: auto-convert on quote acceptance, auto-retainer on portal acceptance, recurring child generation at 6 AM, automatic payment reminders, late-fee invoices, and auto-charge with retries. Optional approval states (Pending Approval/Approved/Rejected) can be inserted before a document goes out.

### Cited Findings

#### 1a. Quote (formerly "Estimate")
- The module was renamed from Estimates to Quotes. Organizations created before 31 Mar 2023 still show "Estimates" unless renamed, and the PDF title and number prefix must be updated manually after renaming — [Quote help](https://www.zoho.com/us/books/help/quote/other-actions.html). The API resource is still `/estimates` — [API Estimates](https://www.zoho.com/books/api/v3/estimates/).
- Status enum (API): `draft, sent, invoiced, accepted, declined, expired`. List filters: Status.All/Sent/Draft/Invoiced/Accepted/Declined/Expired — [API Estimates](https://www.zoho.com/books/api/v3/estimates/). Approval states (Pending Approval/Approved/Rejected) are added when approvals are on (see §6). Progress invoicing adds "Partially Invoiced" — [Progress Invoice](https://www.zoho.com/us/books/help/quote/progress-invoice.html).
- API actions: `POST /estimates/{id}/status/sent`, `/status/accepted`, `/status/declined`, `/submit`, `/approve`, `/email`, bulk `/estimates/email`, comments, templates, PDF/print — [API Estimates](https://www.zoho.com/books/api/v3/estimates/).
- Creation fields: customer, auto-numbered Quote#, reference, quote date, **Expiry Date** ("until which the quote is valid"), salesperson, project (or create a new one inline), price list, item table (header/subtotal rows; subtotals only in Global, Canada and US editions), shipping, adjustment, notes, T&C, and the checkbox "Create a retainer invoice for this quote automatically" with a % to collect — [Quotes](https://www.zoho.com/us/books/help/quote/).
- Transitions:
  - `(new) --[Save as Draft]--> Draft` (a draft "will not be included in the reports") — [Quotes](https://www.zoho.com/us/books/help/quote/)
  - `(new) --[Save and Send (email)]--> Sent` — [Quotes](https://www.zoho.com/us/books/help/quote/)
  - `Draft --[Send Quote (email, optional PDF attachment)]--> Sent` — [Quotes](https://www.zoho.com/us/books/help/quote/)
  - `Draft --[More › Mark as Sent]--> Sent` (when sent by other means) — [Quotes](https://www.zoho.com/us/books/help/quote/)
  - `Sent --[customer clicks Accept in Customer Portal, or via public link if the preference "Allow customers to accept or decline the quotes via a public link" is on]--> Accepted` (org gets a notification; if auto-retainer is ticked, a retainer invoice is created automatically on portal acceptance and the customer can pay it then or later) — [Quote preferences](https://www.zoho.com/us/books/help/quote/preferences.html); [Retainer functions](https://www.zoho.com/us/books/help/retainer-invoice/functions.html); [Customer Portal](https://www.zoho.com/us/books/help/customer-portal/)
  - `Sent --[More › Mark as Accepted]--> Accepted` — [Quotes](https://www.zoho.com/us/books/help/quote/)
  - `Sent --[customer Decline / More › Mark as Declined]--> Declined` (customers can negotiate through comments that are marked "Display in portal") — [Quotes](https://www.zoho.com/us/books/help/quote/); [Customer Portal](https://www.zoho.com/us/books/help/customer-portal/)
  - `Sent --[expiry]--> Expired`: "expired" is an API status, and the Expiry Date field exists. That the change happens automatically on the date is inferred, not stated — [API Estimates](https://www.zoho.com/books/api/v3/estimates/)
  - `Accepted --[auto-conversion preference]--> Invoiced` (the preference has three options: don't convert; convert accepted quotes to **draft invoices**; convert to invoices **and email** them) — [Quote preferences](https://www.zoho.com/us/books/help/quote/preferences.html)
  - `Accepted --[Convert › Convert to Invoice]--> Invoiced` (opens a pre-filled New Invoice page that the user saves as Draft or Save and Send) — [Convert to Invoice](https://www.zoho.com/us/books/help/quote/convert-to-inv.html)
  - `Accepted --[Convert to Invoice with Progress Invoicing: custom amount/%, per-line amount/%]--> Partially Invoiced --[... "Invoice the Remaining Balance"]--> Invoiced`. Editing an invoiced quote to add items reverts it to Partially Invoiced. Progress invoicing requires auto-convert to be OFF and blocks direct invoicing of a quote already converted to a sales order. "Amount-Based Progress Invoice" applies the % to the rate of service lines instead of the quantity — [Progress Invoice](https://www.zoho.com/us/books/help/quote/progress-invoice.html)
  - `Accepted --[Convert › Convert to Sales Order]--> (creates SO; pre-filled New Sales Order page)` — [Convert to SO](https://www.zoho.com/us/books/help/quote/convert-to-so.html). The quote's own status after SO conversion is not documented (see Gaps).
  - `Accepted --[More › Create Retainer Invoice]--> (creates Retainer Invoice)`; `Any --[More › Create Project]--> (new Project pre-filled with customer and tasks from the quote's services)` — [Quote other actions](https://www.zoho.com/us/books/help/quote/other-actions.html)
  - `Draft --[Submit for approval]--> Pending Approval --[Approve]--> Approved` (approval types for Quotes: No Approval, Simple, Multi-Level, Custom) — [Quote preferences](https://www.zoho.com/us/books/help/quote/preferences.html)
- Rules: accepted quotes cannot be edited unless "Allow editing of accepted quotes" is enabled, and edits do not change the status. Conversion can carry over Customer Notes, T&C and Address (preference). Zero-value lines can be hidden in the PDF and portal — [Quote preferences](https://www.zoho.com/us/books/help/quote/preferences.html). A quote cannot be deleted once an invoice or retainer invoice exists for it. To change the customer on a converted invoice you must delete the invoice, edit the quote, and re-convert — [Quote other actions](https://www.zoho.com/us/books/help/quote/other-actions.html); [Convert to Invoice](https://www.zoho.com/us/books/help/quote/convert-to-inv.html).
- Sharing: "Share" generates a link with visibility **Public** or **Private and Secure** (portal only) and a link expiry (default 90 days). With Secure Link Sharing, the recipient must verify an email or phone number to see the full quote, otherwise they can only Accept/Reject — [Quote other actions](https://www.zoho.com/us/books/help/quote/other-actions.html).

#### 1b. Sales Order
- Must be enabled (Settings › General › Sales Orders) — [Sales Order](https://www.zoho.com/us/books/help/sales-order/).
- Standard statuses in help: Draft, Open, Void, Closed, plus **user-defined custom statuses**, each with a parent standard status (e.g. "To be shipped" under Open). A custom status is applied from the More menu while the order is in its parent status — [SO other actions](https://www.zoho.com/us/books/help/sales-order/other-actions.html). API filter values: Status.All/Open/Draft/OverDue/PartiallyInvoiced/Invoiced/Void/Closed; search values `draft, open, invoiced, partially_invoiced, void, overdue` — [API Sales Orders](https://www.zoho.com/books/api/v3/sales-order/).
- API actions: `/status/open`, `/status/void`, `/substatus/{status_code}`, `/submit`, `/approve`, `/email` — [API Sales Orders](https://www.zoho.com/books/api/v3/sales-order/).
- Transitions:
  - `(new | from Quote) --[Save as Draft]--> Draft`; `--[Save and Send]--> sent to customer` — [Sales Order](https://www.zoho.com/us/books/help/sales-order/)
  - `Draft --[Convert to Open]--> Open` ("active and shows up in your sales reports") — [Sales Order](https://www.zoho.com/us/books/help/sales-order/)
  - `Open --[Convert to Invoice (delete lines to invoice partially)]--> Partially Invoiced / Closed`: "After a sales order is invoiced, it will be converted to the Closed status." Invoices appear in the SO's Invoices tab — [SO → Invoice](https://www.zoho.com/us/books/help/sales-order/convert-to-invoice.html)
  - `Partially invoiced --[More › Cancel Items]--> remaining items cancelled (Canceled Items tab)`; `--[Reopen Canceled Items]-->` reverses this — [SO other actions](https://www.zoho.com/us/books/help/sales-order/other-actions.html)
  - `Open --[More › Convert to Purchase Order]--> (creates PO; lines editable)` (for low stock) — [SO → PO](https://www.zoho.com/us/books/help/sales-order/convert-to-po.html)
  - `Any --[More › Void]--> Void` (alternative to deleting) — [SO other actions](https://www.zoho.com/us/books/help/sales-order/other-actions.html)
  - `Parent status --[More › <custom status>]--> custom sub-status` — [SO other actions](https://www.zoho.com/us/books/help/sales-order/other-actions.html)
  - Approvals for SOs: "Simple and Multi-Level" (Custom is not listed on this page) — [SO preferences](https://www.zoho.com/us/books/help/sales-order/preferences.html)
- Rules: an invoiced SO cannot be deleted until its invoice is deleted — [Delete SO](https://www.zoho.com/us/books/help/sales-order/delete-so.html). Invoice Order Number can use the SO number or the SO reference number — [Invoice preferences](https://www.zoho.com/us/books/help/invoice/invoice-preferences.html). Invoice import can link invoices to SOs — [Invoices](https://www.zoho.com/us/books/help/invoice/). Customers see SOs in the portal only if "Allow customers to view Sales Orders" is on, and the org is notified on first view — [Portal preferences](https://www.zoho.com/us/books/help/customer-portal/preferences.html); [Customer Portal](https://www.zoho.com/us/books/help/customer-portal/).
- Packages and shipments from an SO exist only with the Zoho Inventory add-on (see §3) — [Advanced Inventory](https://www.zoho.com/us/books/help/items/advanced-inventory.html).

#### 1c. Delivery Challan (India edition)
- Purpose: a document that goes with goods in transit "which may or may not result in a sale" (e.g. quantity unknown at dispatch). It has a Challan Type field (purpose) — [DC overview](https://www.zoho.com/in/books/help/delivery-challan/); [DC basic functions](https://www.zoho.com/in/books/help/delivery-challan/basic-functions.html).
- Help statuses: Draft, Open (dispatched), Delivered, Returned — [Manage DCs](https://www.zoho.com/in/books/help/delivery-challan/manage-delivery-challans.html). API filters: Draft, Open, Returned, Delivered, Invoiced, PartiallyInvoiced. API actions: `/status/open`, `/status/delivered`, `/status/returned`, `/status/undelivered`, `PUT /deliverychallans/return`, `/undo/return` — [API Delivery Challans](https://www.zoho.com/books/api/v3/delivery-challans/).
- Transitions:
  - `(new) --[Save]--> Draft`; `Draft --[Convert to Open (goods dispatched)]--> Open` — [DC basic functions](https://www.zoho.com/in/books/help/delivery-challan/basic-functions.html)
  - `Open --[Mark as Delivered]--> Delivered` — [DC functions](https://www.zoho.com/in/books/help/delivery-challan/functions.html)
  - `Delivered --[Convert to Invoice (all items)]--> Invoiced` (invoice visible under Invoices on the DC) — [DC functions](https://www.zoho.com/in/books/help/delivery-challan/functions.html)
  - `Delivered --[Convert to Invoice (some items)]--> Partially Invoiced` — [DC functions](https://www.zoho.com/in/books/help/delivery-challan/functions.html)
  - `Open --[Mark as Returned]--> Returned` (Returned Items tab) — [DC functions](https://www.zoho.com/in/books/help/delivery-challan/functions.html)
  - `Partially Invoiced --[Record Partial Return (remaining items)]--> partially returned` (only one return per DC; undo it to re-record) `--[Undo Partial Return]--> original state` — [DC functions](https://www.zoho.com/in/books/help/delivery-challan/functions.html)
- e-Way Bill details can be attached to a DC — [DC overview](https://www.zoho.com/in/books/help/delivery-challan/).

#### 1d. Invoice
- Types: Regular, Recurring, Retainer — [Invoices](https://www.zoho.com/us/books/help/invoice/).
- Status enum (API search): `sent, draft, overdue, paid, void, unpaid, partially_paid, viewed` — [API Invoices](https://www.zoho.com/books/api/v3/invoices/). Approval states Pending Approval/Approved/Rejected are added when approvals are on (§6). Write-off is an action (API `/writeoff`, `/writeoff/cancel`). The help does not name the resulting status (see Gaps).
- API actions (selection): `/status/sent`, `/status/void`, `/status/draft`, `/submit`, `/approve`, `/approve/final`, `/reject`, `/email`, `/email/schedule`, `/paymentreminder` (+ `enable`/`disable` per invoice), `/writeoff`, `/writeoff/cancel`, `/credits` (apply credits), `/payments`, `/fromsalesorder`, `/fromestimates`, `/fromprojects`, `/mapwithorder`, `/markasshipped`, `/unship`, `/deliverynote/print`, `/packingslip/print`, `/snailmail`, `/sms`, `/forcepay`, `/onlinepayments/*`, `/substatus/{id}`, `/einvoice/*`, `/qrcode`, `/dsign` (digital signature), `GET /share/paymentlink` — [API Invoices](https://www.zoho.com/books/api/v3/invoices/).
- Narrative lifecycle: "save it as a draft ... or send it right away ... If the invoice goes past its due date, its status will change to Overdue. When the customer makes a payment, the status will update to Paid, or you can manually record the payment" — [Invoices](https://www.zoho.com/us/books/help/invoice/).
- Transitions:
  - `(new) --[Save as Draft]--> Draft`; `--[Save and Send]--> Sent`; `--[Save and Send Later (schedule date)]--> scheduled email` — [Invoices](https://www.zoho.com/us/books/help/invoice/)
  - `(new) --[tick "I have received the payment" + method/deposit account, optional split payment]--> Paid` (only when Sales Approval is disabled) — [Invoices](https://www.zoho.com/us/books/help/invoice/)
  - `(from Quote / SO / Delivery Challan / Project / billable Expense / billable Bill line / Recurring profile) --[convert/create]--> Draft or Sent` — [Quote→Inv](https://www.zoho.com/us/books/help/quote/convert-to-inv.html); [SO→Inv](https://www.zoho.com/us/books/help/sales-order/convert-to-invoice.html); [DC functions](https://www.zoho.com/in/books/help/delivery-challan/functions.html); [Projects functions](https://www.zoho.com/us/books/help/projects/functions.html); [Expense other actions](https://www.zoho.com/us/books/help/expense/other-actions.html); [Bills functions](https://www.zoho.com/us/books/help/bills/functions.html)
  - `Draft --[Mail/SMS (or snail mail with purchased credits)]--> Sent` — [Invoice other actions](https://www.zoho.com/us/books/help/invoice/other-actions.html)
  - `Draft --[Mark as Sent]--> Sent` ("This allows you to record payments for the invoice") — [Invoice other actions](https://www.zoho.com/us/books/help/invoice/other-actions.html)
  - `Draft --[Submit]--> Pending Approval --[Approve]--> Approved --[Send / Mark as Sent]--> Sent`; `Pending Approval --[Reject + reason]--> Rejected --[Resubmit]--> Pending Approval` (see §6) — [Approval workflow](https://www.zoho.com/us/books/help/transaction-approval/transaction-approval-workflow.html)
  - `Sent --[customer first opens it in portal/link]--> Viewed` (org notified on first portal view; "Viewed" icon) — [Customer Portal](https://www.zoho.com/us/books/help/customer-portal/); [API Invoices](https://www.zoho.com/books/api/v3/invoices/)
  - `Sent/Viewed --[due date passes]--> Overdue` (side effects: automated overdue reminders; late-fee invoice after N days if enabled) — [Invoices](https://www.zoho.com/us/books/help/invoice/); [Reminders](https://www.zoho.com/us/books/help/settings/reminders.html); [Late Fees](https://www.zoho.com/us/books/help/invoice/late-fees.html)
  - `Sent/Overdue --[Record Payment (amount < due) / TDS-only payment]--> Partially Paid` (creates a Payment Received record. A TDS-only payment with amount 0 is available in the Global and India editions only) — [Record Payment](https://www.zoho.com/us/books/help/invoice/record-payment-for-invoice.html)
  - `Sent/Overdue/Partially Paid --[Record Payment in full | Charge Customer (stored card via Authorize.net, Payflow Pro, Payments Pro, Razorpay, Paytm) | customer Pay Now online | apply credits/retainers/excess payments]--> Paid` — [Record Payment](https://www.zoho.com/us/books/help/invoice/record-payment-for-invoice.html); [Apply credits](https://www.zoho.com/us/books/help/credit-note/apply-credits.html); [Retainer functions](https://www.zoho.com/us/books/help/retainer-invoice/functions.html)
  - `Unpaid --[Record Payment › Write Off + reason]--> written off` (amount goes to the Bad Debt account) `--[Cancel Write Off]--> previous state` — [Invoice other actions](https://www.zoho.com/us/books/help/invoice/other-actions.html)
  - `Any --[••• › Void + reason]--> Void` ("will not reflect on any of your sales transactions or reports") `--[Convert to Draft + reason]--> Draft` — [Invoice other actions](https://www.zoho.com/us/books/help/invoice/other-actions.html)
  - `Any --[More › Create Credit Note]--> (new Credit Note pre-filled from invoice)` — [Credit Notes](https://www.zoho.com/us/books/help/credit-note/)
- Rules: Delete requires deleting recorded payments first and is irreversible ("void it" is the suggested alternative) — [Delete Invoice](https://www.zoho.com/us/books/help/invoice/delete-invoice.html). Editing a sent invoice is controlled by the preference "Allow editing of Sent invoice" — [Invoice preferences](https://www.zoho.com/us/books/help/invoice/invoice-preferences.html). A public share link requires the invoice to be in Sent status first. Link visibility is Public or Private and Secure, default expiry is 90 days, and a link recipient can Accept, Decline or Pay Now (full view after identity verification) — [Invoice other actions](https://www.zoho.com/us/books/help/invoice/other-actions.html).
- Delivery notes and packing slips can be printed from an invoice, with configurable fields — [Invoice preferences](https://www.zoho.com/us/books/help/invoice/invoice-preferences.html).
- Payment preferences: notify the org when customers pay online, auto-send a thank-you note on online payment, attach the payment receipt to the thank-you note — [Invoice preferences](https://www.zoho.com/us/books/help/invoice/invoice-preferences.html).

#### 1e. Payment reminders (dunning)
- Two manual reminder types: for **overdue** invoices and for **sent** invoices (due date approaching) — [Reminders](https://www.zoho.com/us/books/help/settings/reminders.html).
- Automated reminders "Based on Invoice Due Date": three by default (e.g. R1 a few days before due, R2 on the due date, R3 after). Each has a name, a recipient (you, the customer, or both) and an offset before or after the due date. Reminders stop once payment is received — [Reminders](https://www.zoho.com/us/books/help/settings/reminders.html).
- "Based on Expected Payment Date": notifies org users that a payment is due — [Reminders](https://www.zoho.com/us/books/help/settings/reminders.html).
- Bill reminders: users get emails on or before a bill's due date or expected payment date — [Reminders](https://www.zoho.com/us/books/help/settings/reminders.html).
- Per-invoice controls: a "Reminders" dropdown in the invoice toolbar (screenshot) — [screenshot](https://www.zoho.com/books/help/images/invoice/record-payment.png). API `POST /invoices/{id}/paymentreminder`, `/paymentreminder/disable|enable`, bulk `/invoices/paymentreminder` — [API Invoices](https://www.zoho.com/books/api/v3/invoices/).

#### 1f. Late fees
- Enabled in Settings › Invoices. Options: Percentage (of due amount) or Fixed; "Invoice Overdue By" N days; amount or %; "Generate late fee invoices as drafts" (otherwise they are generated **and sent** by default); default account "Late Fee Income" — [Late Fees](https://www.zoho.com/us/books/help/invoice/late-fees.html).
- Side effect: `Invoice Overdue for N days --> new Late Fee Invoice (prefix LF-xxxx), Draft or Sent`. The customer can pay the late-fee invoice separately, or pay invoice plus late fee together via the invoice payment link. A per-customer "Late Fee" toggle excludes that customer — [Late Fees](https://www.zoho.com/us/books/help/invoice/late-fees.html).

#### 1g. Payments Received
- Types: Invoice Payments and Retainer Payments — [PR basic functions](https://www.zoho.com/us/books/help/payments-received/basic-functions.html).
- Recording: customer, amount ("Pay full amount"), Deposit To account, tax deducted. The amount is split across the customer's outstanding invoices in full or in part ("Clear applied amount", "Pay in Full"). Totals show Amount Received, Amount used for payments, and Amount in excess. The excess is saved as an **over/excess payment** (list shows Amount vs **Unused Amount**). An optional thank-you note can be sent — [PR basic functions](https://www.zoho.com/us/books/help/payments-received/basic-functions.html).
- `Payment with unused amount --[More › Refund (full/partial)]--> refund recorded` — [PR basic functions](https://www.zoho.com/us/books/help/payments-received/basic-functions.html). API sub-resource `/customerpayments/{id}/refunds` — [API Customer Payments](https://www.zoho.com/books/api/v3/customer-payments/).
- Deleting a payment reverts the invoice balance. It can be done from the invoice's Payments Received tab or the module ("More › Delete" when there are excess payments) — [PR other actions](https://www.zoho.com/us/books/help/payments-received/other-actions.html); [Invoice payments](https://www.zoho.com/us/books/help/invoice/payments-received.html).
- Excess payments and credit notes can be auto-applied to recurring invoices before sending (excess payments first, then credit notes) — [RI preferences](https://www.zoho.com/us/books/help/recurring-invoice/preferences.html).
- Payment Received records support PDF receipt templates, email, print, attachments and record locking — [PR functions](https://www.zoho.com/us/books/help/payments-received/functions.html); [PR preferences](https://www.zoho.com/us/books/help/payments-received/preferences.html).
- Online payments: once a gateway is integrated, it is shown as a payment option on the invoice. If several are configured, you pick one per invoice (when more than two are selected, the most recently integrated is used). Customers pay from the portal or link, and the payment is recorded automatically. Partial online payment is allowed only if enabled on that invoice — [Record Payment](https://www.zoho.com/us/books/help/invoice/record-payment-for-invoice.html); [Customer Portal](https://www.zoho.com/us/books/help/customer-portal/). Gateway pages listed for the US edition: Authorize.net, Braintree, CSG Forte, Payflow Pro, PayPal, Square, Stripe, Verifone, Zoho Payments — [US help index](https://www.zoho.com/us/books/help/online-payments/).

#### 1h. Payment Links (standalone)
- A customer, amount, expiry (default 15 days) and description generate a short URL and auto Reference#. The link is shared by email or copy — [Payment Links basic](https://www.zoho.com/us/books/help/payment-links/basic-functions.html).
- States: Generated, Viewed, Paid, Expired, Canceled — [Manage links](https://www.zoho.com/us/books/help/payment-links/manage-links.html).
- Transitions: `Generated --[customer opens]--> Viewed (eye icon)`; `Generated/Viewed --[customer pays via most-recently-integrated gateway]--> Paid (auto-creates a Payment Received entry, applicable to invoices later; link no longer accessible)`; `--[expiry date]--> Expired`; `--[Cancel]--> Canceled (cannot be re-activated)`; `--[change expiry]--> new URL generated (must re-send)`; `--[Delete]--> removed` (to change the amount: delete and recreate) — [Manage links](https://www.zoho.com/us/books/help/payment-links/manage-links.html); [Other actions](https://www.zoho.com/us/books/help/payment-links/other-actions.html); [Receive payment](https://www.zoho.com/us/books/help/payment-links/receive-payment.html).

#### 1i. Credit Note
- Statuses: `open, closed, void, draft` (API). API also has `/submit`, `/approve`, `/approve/final`, `/reject`, refunds, `/invoices` (apply), `/substatus`, e-invoice actions — [API Credit Notes](https://www.zoho.com/books/api/v3/credit-notes/).
- Transitions:
  - `(new | from Invoice "Create Credit Note") --[Save as Draft]--> Draft`; `--[Save as Open]--> Open` — [Credit Notes](https://www.zoho.com/us/books/help/credit-note/)
  - `Draft --[Convert to Open]--> Open` (active, shows in sales reports) — [CN other actions](https://www.zoho.com/us/books/help/credit-note/other-actions.html)
  - `Open --[Apply to Invoice (partial)]--> Open`; `Open --[apply all remaining credits]--> Closed` (applied from the CN or from the invoice's "Credits Available") — [Apply credits](https://www.zoho.com/us/books/help/credit-note/apply-credits.html)
  - `Closed/Open --[remove applied credit in "Credit Applied Invoices" tab]--> credit available again` — [Apply credits](https://www.zoho.com/us/books/help/credit-note/apply-credits.html)
  - `Open --[More › Refund (full/partial)]--> refund recorded (Refund History)` — [Refund credits](https://www.zoho.com/us/books/help/credit-note/refund-credits.html)
  - `Any --[Void + reason]--> Void --[Convert to Draft + reason]--> Draft` (must Convert to Open again to reactivate) — [CN other actions](https://www.zoho.com/us/books/help/credit-note/other-actions.html)
- Rule: cannot be deleted while credits are applied or refunds recorded — [Delete CN](https://www.zoho.com/us/books/help/credit-note/delete-cn.html). The Invoice# association lists only Sent invoices of the customer — [Credit Notes](https://www.zoho.com/us/books/help/credit-note/). Approval types: No, Simple, Multi-Level, Custom — [CN preferences](https://www.zoho.com/us/books/help/credit-note/preferences.html).

#### 1j. Retainer Invoice (advance payment)
- Enable it in Settings › General and pick a liability account (Unearned Revenue suggested) — [Retainer basic](https://www.zoho.com/us/books/help/retainer-invoice/basic-functions.html).
- Help statuses: Draft, Sent, Paid, Pending Approval, Approved, Partially Drawn, Drawn, Void. The help defines Drawn and Partially Drawn as amount (partially) **refunded**. Partially Paid is available in the Global, UK and US editions — [Manage retainers](https://www.zoho.com/us/books/help/retainer-invoice/manage-retainer-invoice.html); [Retainer basic](https://www.zoho.com/us/books/help/retainer-invoice/basic-functions.html). API filters: Sent, Draft, OverDue, Paid, Void, Unpaid, PartiallyPaid, Viewed — [API Retainer Invoices](https://www.zoho.com/books/api/v3/retainer-invoices/).
- Transitions:
  - `(new | from accepted Quote | from Project "New Transaction" | auto on portal quote acceptance) --[Save]--> Draft` — [Retainer basic](https://www.zoho.com/us/books/help/retainer-invoice/basic-functions.html); [Retainer functions](https://www.zoho.com/us/books/help/retainer-invoice/functions.html)
  - `Draft --[Email / API status/sent]--> Sent` — [Retainer other actions](https://www.zoho.com/us/books/help/retainer-invoice/other-actions.html); [API](https://www.zoho.com/books/api/v3/retainer-invoices/)
  - `Sent --[Record Payment / Charge Customer / portal payment]--> Paid` (partial gives Partially Paid) — [Retainer basic](https://www.zoho.com/us/books/help/retainer-invoice/basic-functions.html)
  - `Paid --[Apply to Invoice (full/partial, several invoices)]--> retainer balance reduced; invoice balance reduced ("Invoices Applied" tab)`. Also from an invoice: "Retainers Available › Apply Now" or More › Use Retainers. From a project invoice: tick "apply the retainers collected" — [Retainer functions](https://www.zoho.com/us/books/help/retainer-invoice/functions.html)
  - `Paid --[More › Refund]--> Partially Drawn / Drawn (Refund History)` — [Retainer functions](https://www.zoho.com/us/books/help/retainer-invoice/functions.html); [Manage retainers](https://www.zoho.com/us/books/help/retainer-invoice/manage-retainer-invoice.html)
  - `Any --[Void]--> Void`; `Void --[status/draft]--> Draft` (API) — [API](https://www.zoho.com/books/api/v3/retainer-invoices/)
- Shipping charges and adjustments are not shown on retainer invoices or payments received — [Invoice other actions](https://www.zoho.com/us/books/help/invoice/other-actions.html). Retainer invoices support custom Statuses and approvals (No, Simple, Multi-Level, Custom) — [Retainer preferences](https://www.zoho.com/us/books/help/retainer-invoice/preferences.html).

#### 1k. Recurring Invoice (profile → child invoices)
- The profile has a customer, Profile Name, "Repeat Every" (week, month, year or Custom), start/end or never expires, salesperson, project hours and items — [RI create](https://www.zoho.com/us/books/help/recurring-invoice/ri-createsend.html).
- Profile statuses: Active, Stopped, Expired (API). Actions: `/status/stop`, `/status/resume`, bulk stop/resume, `/autobill/enable|disable`, card or bank-account association — [API Recurring Invoices](https://www.zoho.com/books/api/v3/recurring-invoices/).
- Transitions:
  - `(new) --[Save]--> Active`. A backdated profile generates children only after the current date — [RI create](https://www.zoho.com/us/books/help/recurring-invoice/ri-createsend.html)
  - `Active --[schedule tick, at 6 AM org timezone]--> child Invoice created` as Draft (optional email notice to customer), or Sent ("Create and Send"; "Create, Auto-approve and Send" when approvals are on), or Charged+Sent ("Create, Charge and Send"; "Create, Auto-approve, Charge and Send") — [RI details](https://www.zoho.com/us/books/help/recurring-invoice/ri-details.html); [RI preferences](https://www.zoho.com/us/books/help/recurring-invoice/preferences.html)
  - Auto-charge outcome. On success: do nothing, or send a thank-you note with the invoice. On failure: notify, notify and retry, or retry silently. Up to 3 retries N days apart. Options: "After all retries, suspend the recurring invoice" or "After failure, suspend" — [RI preferences](https://www.zoho.com/us/books/help/recurring-invoice/preferences.html)
  - `Active --[More › Stop]--> Stopped --[More › Resume]--> Active` — [RI details](https://www.zoho.com/us/books/help/recurring-invoice/ri-details.html)
  - `Active --[end date passes]--> Expired`: inferred from the API enum plus the end date. Not stated in help.
  - `Active --[Create Invoice (manual, off-schedule)]--> child invoice listed under All Child Invoices` — [RI details](https://www.zoho.com/us/books/help/recurring-invoice/ri-details.html)
- Rules: edits apply only to upcoming invoices. Deleting a profile does not delete its children. The organization-level preference can be overridden per profile — [RI other actions](https://www.zoho.com/us/books/help/recurring-invoice/other-actions.html); [RI preferences](https://www.zoho.com/us/books/help/recurring-invoice/preferences.html). Auto-charge needs the card or direct debit associated with **both** the contact and the profile. Customers can save a card or bank account in the portal ("Use this card for future transactions"). GoCardless needs explicit authorization — [RI receive payments](https://www.zoho.com/us/books/help/recurring-invoice/receive-payments.html).

#### 1l. Debit Notes, Sales Receipts
- Customer Debit Note: "a document sent to your client that indicates additional charges or adjustments to be made to the original invoice". In the API it lives on the `/invoices` endpoint, and statuses mirror invoices (`sent, draft, overdue, paid, void, unpaid, partially_paid, viewed`) — [API Customer Debit Notes](https://www.zoho.com/books/api/v3/customer-debit-notes/). Debit Notes are locked under the Sales module in transaction locking — [Transaction Lock](https://www.zoho.com/us/books/help/accountant/transaction-lock.html). India e-invoicing covers DBN documents — [India e-invoicing functions](https://www.zoho.com/in/books/help/e-invoicing/functions-einvoice.html).
- Sales Receipt: "records the sale and payment in one step" (payment mode, deposit account). Statuses Draft/Sent (API filter). It can be voided, but "you cannot undo" a void. Clone and bulk update are available — [Sales Receipts](https://www.zoho.com/us/books/help/sales-receipts/); [API Sales Receipt](https://www.zoho.com/books/api/v3/sales-receipt/).

#### 1m. India compliance overlays on sales documents
- e-Way Bill: the module is enabled, then Zoho is registered as GSP and connected to the EWB portal. With a state threshold configured, invoices, credit notes and delivery challans over the threshold appear as **Not Generated** in the e-Way Bill module. e-Way Bills can be generated from Books or entered manually and fetched. Statuses mentioned: Not Generated, Generated, Part-A Generated, Expired, Cancelled. Cancellation is allowed within 24 hours, then the bill can be regenerated. Validity can be extended within 8 hours of expiry. From 1 Jan 2025 there is no generation for invoices older than 180 days and no extension beyond 360 days — [Generate EWB](https://www.zoho.com/in/books/help/e-way-bill/generate-eway-bills/generate-ewb.html); [EWB functions](https://www.zoho.com/in/books/help/e-way-bill/functions.html).
- e-Invoicing (IRP): statuses Yet-to-be Pushed, Push Initiated (bulk), Pushed (IRN + QR returned), Failed, Cancelled (in both Books and IRP), Marked as Cancelled (Books only). An invoice "must" be pushed before sending to the customer. With approvals on, the invoice must be approved before the push. Turnover above ₹10 crore requires a push within 30 days. The same flow applies to credit and debit notes — [e-Invoicing functions](https://www.zoho.com/in/books/help/e-invoicing/functions-einvoice.html). The API exposes `/einvoice/push|cancel|fetch|status/*` on invoices and credit notes — [API Invoices](https://www.zoho.com/books/api/v3/invoices/).

### Inferences
- The help repeatedly uses one "document → convert → pre-filled New X page → user saves as Draft or Save and Send" pattern for every conversion. Conversions are user-confirmed forms, not silent creations. The exceptions are the explicitly automated ones: quote auto-convert, retainer on portal acceptance, recurring children, and late-fee invoices.
- "Sent" works as the gate to money states. An invoice must be Sent (emailed or marked) before payments can be recorded or a public link shared.
- Void is reversible on invoices, credit notes, bills and vendor credits (Void → Draft, with a reason), but irreversible on sales receipts and cancelled POs and payment links.

### Gaps
- No current help page lists the invoice statuses in a table. The list here comes from the API enum plus the narrative. The status label after Write Off (e.g. "Written Off") was not confirmed in current help.
- The quote's status after Convert to Sales Order was not found. Whether quote expiry to Expired happens automatically on the date is inferred.
- No status lifecycle was found documented for Payments Received (beyond unused/excess amounts and refunds).
- Debit notes: no current help page was located (an India help URL guess returned 404). Regional availability is not confirmed from help.
- SO invoiced/shipped sub-status fields were not confirmed from the fetched API text.
- Plan names per feature (the "Available Plans" widget did not render) are unknown.

---

## 2. Purchase flow: Purchase Order → (Purchase Receive) → Bill → Payment Made → Vendor Credit; Recurring Bills/Expenses; Expenses

### Takeaway
The purchase side mirrors the sales side. A PO (Draft → Open → Partially Billed/Billed/Closed, or Cancelled) converts to Bills. Bills (Draft/Open → Overdue → Partially Paid → Paid, or Void) are settled by Payments Made, which can carry approval states and excess amounts stored as vendor credits. Vendor Credits are Open → Closed as applied. Expenses carry a billing state (Unbilled → Invoiced) or a reimbursement state, which lets costs flow back onto customer invoices.

### Cited Findings

#### 2a. Purchase Order
- Help statuses: Draft, Partially Billed, Billed, Closed, Cancelled — [Manage PO](https://www.zoho.com/us/books/help/purchase-order/manage-po.html). API: `draft, open, billed, cancelled`. Actions `/status/open`, `/status/billed`, `/status/cancelled`, `/submit`, `/approve`, `/reject`, `/email` — [API Purchase Orders](https://www.zoho.com/books/api/v3/purchase-order/). Custom statuses are supported — [PO preferences](https://www.zoho.com/us/books/help/purchase-order/preferences.html).
- Transitions:
  - `(new | from Vendor record | from Sales Order) --[Save as Draft]--> Draft`. The "Deliver To" field takes the Organization or a Customer address — [PO basic](https://www.zoho.com/us/books/help/purchase-order/basic-functions.html); [SO→PO](https://www.zoho.com/us/books/help/sales-order/convert-to-po.html)
  - `Draft --[Submit]--> Pending Approval --[Approve]--> Approved / --[Reject]--> Rejected` (No, Simple, Multi-Level, Custom) — [PO preferences](https://www.zoho.com/us/books/help/purchase-order/preferences.html); [API](https://www.zoho.com/books/api/v3/purchase-order/)
  - `Draft --[send / status/open]--> Open` — [API](https://www.zoho.com/books/api/v3/purchase-order/)
  - `Open --[vendor Accept/Decline via public link (preference) or vendor portal review]--> accepted/declined flag` — [PO preferences](https://www.zoho.com/us/books/help/purchase-order/preferences.html); [Vendor Portal](https://www.zoho.com/us/books/help/vendor-portal/)
  - `Open --[Convert to Bill (some items)]--> Partially Billed --[remaining billed]--> Billed` — [Manage PO](https://www.zoho.com/us/books/help/purchase-order/manage-po.html); [PO functions](https://www.zoho.com/us/books/help/purchase-order/functions.html)
  - `--> Closed` per the preference "When do you want your Purchase Orders to be closed?": when a Purchase Receive is recorded, when a Bill is created, or when both are recorded — [PO preferences](https://www.zoho.com/us/books/help/purchase-order/preferences.html)
  - `Open --[Mark as Cancelled]--> Cancelled` ("Only Open Purchase Order can be cancelled", "cannot be reopened") — [PO functions](https://www.zoho.com/us/books/help/purchase-order/functions.html)
  - `Open/Partially Billed --[Cancel Items (unbilled goods only; service items cannot be cancelled)]--> items cancelled --[Reopen Cancelled Items]--> reopened` — [PO functions](https://www.zoho.com/us/books/help/purchase-order/functions.html)
- An Expected Delivery Date is set per PO. Sharing: public link with expiry plus optional secure (identity-verified) links for vendors — [PO other actions](https://www.zoho.com/us/books/help/purchase-order/other-actions.html).

#### 2b. Bill
- Statuses: Draft, Pending Approval, Overdue, Unpaid, Partially Paid, Paid, Void — [Manage bills](https://www.zoho.com/us/books/help/bills/manage-bills.html). API filters: All, PartiallyPaid, Paid, Overdue, Void, Open. Actions `/status/open`, `/status/void`, `/submit`, `/approve`, `/credits`, `GET /bills/editpage/frompurchaseorders` — [API Bills](https://www.zoho.com/books/api/v3/bills/).
- Transitions:
  - `(new | from PO "Convert to Bill" | include open POs via "purchase order option") --[Save as Draft]--> Draft`; `--[Save as Open]--> Open/Unpaid` ("a corresponding journal will be created") — [Bills basic](https://www.zoho.com/us/books/help/bills/basic-functions.html)
  - `Draft --[Submit]--> Pending Approval --[Approve]--> Open` — [Manage bills](https://www.zoho.com/us/books/help/bills/manage-bills.html)
  - `Open --[due date passes]--> Overdue` — [Manage bills](https://www.zoho.com/us/books/help/bills/manage-bills.html)
  - `Open/Overdue --[Record Payment (manual | bulk payments across vendors | check, "To Be Printed" if printed later | ACH via CSG Forte)]--> Partially Paid / Paid` — [Bills basic](https://www.zoho.com/us/books/help/bills/basic-functions.html)
  - `Open --[Use Credits / apply vendor credits]--> Partially Paid / Paid` — [Bills functions](https://www.zoho.com/us/books/help/bills/functions.html); [VC functions](https://www.zoho.com/us/books/help/vendor-credits/functions.html)
  - `Open --[Create Vendor Credit from bill (all items)]--> Paid` (the credit is auto-applied; any excess stays as the vendor credit balance) — [Bills functions](https://www.zoho.com/us/books/help/bills/functions.html)
  - `Any --[Void]--> Void --[mark active]--> active` (must delete payments and credits first) — [Bills other actions](https://www.zoho.com/us/books/help/bills/other-actions.html)
  - `Bill with billable lines --[Create Invoice]--> customer Invoice (markup % applied)` — [Bills functions](https://www.zoho.com/us/books/help/bills/functions.html)
  - `Bill --[Make Recurring]--> Recurring Bill profile` — [Bills other actions](https://www.zoho.com/us/books/help/bills/other-actions.html)
- Other: landed costs (needs inventory tracking) can be allocated by value or quantity, including from a separate freight bill — [Bills functions](https://www.zoho.com/us/books/help/bills/functions.html). Overdue bills have a calendar view — [Manage bills](https://www.zoho.com/us/books/help/bills/manage-bills.html).

#### 2c. Payments Made (vendor payments)
- Statuses: Draft; Pending Approval; Approval Rejected; Approved ("can now be applied to bills"); Paid; Void. The three approval statuses apply only when approvals are enabled — [Vendor payments](https://www.zoho.com/us/books/help/payments-made/vendor-payments.html). List filters also cover check states: Paid via Check, To Be Printed, Uncleared, Cleared, Void Checks — [PM preferences](https://www.zoho.com/us/books/help/payments-made/preferences.html). Approval types: No, Simple, Multi-Level — [PM preferences](https://www.zoho.com/us/books/help/payments-made/preferences.html).
- Behaviours: entering an amount prompts "apply to the bill?" (Yes, or No to keep it as excess). Excess "will now be stored as vendor credits". A refund is possible only when an unused amount exists. A payment with refunds cannot be deleted until the refunds are deleted. Bulk submit for approval is available — [Vendor payments](https://www.zoho.com/us/books/help/payments-made/vendor-payments.html); [Bulk actions](https://www.zoho.com/us/books/help/payments-made/payments-made-operations/bulk-actions-payments-made.html). Payments show history, journal and void — [Manage payments made](https://www.zoho.com/us/books/help/payments-made/payments-made-operations/manage-payments-made.html).

#### 2d. Vendor Credit
- Statuses: Draft, Pending Approval, Open (API), Closed, Void — [Manage credits](https://www.zoho.com/us/books/help/vendor-credits/manage-credits.html); [API Vendor Credits](https://www.zoho.com/books/api/v3/vendor-credits/).
- `Draft --[status/open | approve]--> Open --[apply to bills (split across bills)]--> Closed when fully used`; `--[Refund (full/partial)]-->` refund recorded; `--[Void]--> Void --[make active]-->` active again — [VC functions](https://www.zoho.com/us/books/help/vendor-credits/functions.html); [VC other actions](https://www.zoho.com/us/books/help/vendor-credits/other-actions.html).

#### 2e. Recurring Bills and Recurring Expenses
- Recurring bills: statuses active, stopped, expired. Actions `/status/stop`, `/status/resume` — [API Recurring Bills](https://www.zoho.com/books/api/v3/recurring-bills/).
- Recurring expenses: Active, Expired, Stopped. Stop/resume; the generated expenses are listable. The profile has a name, start/end or "Never Expires", and a repeat interval — [API Recurring Expenses](https://www.zoho.com/books/api/v3/recurring-expenses/); [Expense other actions](https://www.zoho.com/us/books/help/expense/other-actions.html).

#### 2f. Expenses
- Statuses: Unbilled (billable but not invoiced), Invoiced, Reimbursed. API filters also include Billable and Nonbillable — [Manage expenses](https://www.zoho.com/us/books/help/expense/manage-expenses.html); [API Expenses](https://www.zoho.com/books/api/v3/expenses/).
- Flow: `Expense (customer + Billable, optional markup %) --> Unbilled --[Convert to Invoice / appears as an unbilled item when invoicing that customer]--> Invoiced` — [Expense basic](https://www.zoho.com/us/books/help/expense/basic-functions.html); [Expense other actions](https://www.zoho.com/us/books/help/expense/other-actions.html).
- Receipts can be attached from desktop, cloud or Documents. Employees can be associated (preference "Associate employees to expenses") — [Expense basic](https://www.zoho.com/us/books/help/expense/basic-functions.html); [Expense preferences](https://www.zoho.com/us/books/help/expense/preferences.html).
- Mileage: by distance × rate, or odometer start/end. Mobile apps add GPS tracking and Maps. Mileage rates are date-effective and vehicles are configurable. Paid Through is credited and Fuel/Mileage Expense is debited — [Mileage](https://www.zoho.com/us/books/help/expense/mileage-expenses.html); [Expense preferences](https://www.zoho.com/us/books/help/expense/preferences.html).
- The module description says expenses "can be recorded, marked billable, converted to an invoice and be reimbursed by users" — [Expenses](https://www.zoho.com/us/books/help/expense/).

### Inferences
- Bill and vendor-credit lifecycles mirror invoice and credit-note lifecycles almost exactly (Draft/Open/Overdue/Partially Paid/Paid/Void; Open/Closed/Void). The PO's billing state works like the SO's invoicing state.

### Gaps
- The UI label "Issued" for Open POs (common in Zoho UI) was not found in the fetched current help. The help status table omits "Open", but the API includes it.
- The mechanics of marking an expense **Reimbursed**, and receipt **autoscan** for expenses, were not found in the fetched pages. Autoscan was found only for vendor-portal uploads (§7). Zoho Expense integration exists ([integration page link](https://www.zoho.com/us/books/help/integrations/expense-integration.html)) but was not read.

---

## 3. Inventory inside Zoho Books (and the Zoho Inventory add-on boundary)

### Takeaway
Core Books handles goods and service items, a per-item "Track Inventory" flag, opening stock, reorder points, quantity and value adjustments, FIFO valuation, price lists and Locations (business and warehouse). Packages, shipments, picklists, purchase receives and returns, transfer orders, composite items and replenishments need the paid **Zoho Inventory add-on** enabled inside Books.

### Cited Findings
- Items: goods or services, with sales and purchase info (COGS account) and the checkbox "Track Inventory for this item". Opening Stock quantity and rate on the opening balance date. Stock auto-adjusts with sales and purchases. A Reorder Point triggers a notification — [Items](https://www.zoho.com/us/books/help/items/). API item statuses: Active/Inactive (+ Lowstock, Grouped/Ungrouped for variants) — [API Items](https://www.zoho.com/books/api/v3/items/).
- Adjustments: **Quantity Adjustment** (e.g. damage, free goods) and **Value Adjustment** — [Item adjustments](https://www.zoho.com/us/books/help/items/item-adjustments.html). Inventory Adjustments are an approvable module — [Approvals](https://www.zoho.com/us/books/help/transaction-approval/configure-approvals.html).
- Valuation: Books "works on the First In First Out (FIFO)" principle. Reports include Inventory Valuation and FIFO Cost Lot Tracking — [Item reports](https://www.zoho.com/us/books/help/items/reports-for-items.html). Item export includes Inventory Account, Inventory Valuation Method, Bin Tracking — [Item other actions](https://www.zoho.com/us/books/help/items/other-actions.html). Adjustment exports include Batch Numbers (batch ID, mfg/expiry date, MRP) and Serial Numbers — [Item adjustments](https://www.zoho.com/us/books/help/items/item-adjustments.html).
- Price lists exist (enable first, then apply per transaction or per line) — [Price list](https://www.zoho.com/us/books/help/items/price-list.html); [Quotes](https://www.zoho.com/us/books/help/quote/).
- Locations: an "upgraded version" of Branches/Warehouses (migration banner). Business Locations take up to a 5-level hierarchy. Warehouse Locations are for stock and cannot have sub-locations. Each location has its own transaction number series. Once enabled, Locations **cannot be disabled** — [Locations](https://www.zoho.com/us/books/help/settings/organization/locations/); [Locations basic](https://www.zoho.com/us/books/help/settings/organization/locations/basic-functions.html).
- Boundary: "The default inventory management feature in Zoho Books lets you track stock, set preferred vendors to items, set reorder points, and adjust inventory. With the Zoho Inventory add-on, you can perform advanced inventory management using modules like Composite Items, Packages, Shipments" and it requires "a paid Zoho Inventory organization". Modules described: Composite Items (Assemblies, Kits), Packages, Picklists, Shipments (carrier rates and tracking), Purchase Receives, Purchase Returns, Transfer Orders, Replenishments (Pending Replenishments → create PO or TO) — [Advanced Inventory](https://www.zoho.com/us/books/help/items/advanced-inventory.html) (same on [India](https://www.zoho.com/in/books/help/items/advanced-inventory.html)).
- Package states: Not Shipped → (create shipment) Shipped → Delivered (or manually mark delivered for manual shipments). Packages can be created from Sales Orders — [Advanced Inventory](https://www.zoho.com/us/books/help/items/advanced-inventory.html).
- Purchase Returns (API): Draft, Confirmed, Void, Closed, plus shipped/refunded/packed/picked sub-filters. Actions open, void, fulfilled, unfulfilled, close, reopen — [API Purchase Returns](https://www.zoho.com/books/api/v3/purchase-returns/).
- Invoices without the add-on can still print a delivery note and packing slip, and the API has `/markasshipped` and `/unship` on invoices — [Invoice preferences](https://www.zoho.com/us/books/help/invoice/invoice-preferences.html); [API Invoices](https://www.zoho.com/books/api/v3/invoices/).

### Inferences
- Inventory postings are a side effect of sales and purchase documents (invoice or bill quantities change stock) rather than of separate stock documents, unless the add-on is on.

### Gaps
- Whether serial, batch and bin tracking need the add-on or a plan tier is not stated in the fetched pages.
- An older PO screenshot says "create bills and receives (in any sequence)" without mentioning the add-on ([screenshot](https://www.zoho.com/books/help/images/purchase-order/convert-to-bill.png), undated older UI). Current help ties Purchase Receives to the add-on, so there may be an edition or historical difference.

---

## 4. Projects and time tracking

### Takeaway
A project links a customer, a billing method, users, and tasks or services. Time entries (manual or timer) are Unbilled until they are pulled into an invoice. Optional internal (manager) and customer (portal) approval stages gate which entries can be invoiced. Profitability comes from associating transactions with projects.

### Cited Findings
- Billing methods (API `billing_type`): `fixed_cost_for_project, based_on_project_hours, based_on_staff_hours, based_on_task_hours` — [API Projects](https://www.zoho.com/books/api/v3/projects/). Help also documents a **Daily Rate** method (Full or Half Day entries, invoice quantity in days). It cannot be switched to or from Hourly, and daily and hourly timesheets cannot be invoiced together — [Projects basic](https://www.zoho.com/us/books/help/projects/basic-functions.html).
- Budgets: Cost Budget, Revenue Budget, budget hours (overall or per user), and account-level budgets with a Budget vs Actuals report — [Projects basic](https://www.zoho.com/us/books/help/projects/basic-functions.html).
- Services vs tasks: a Service is a sellable item usable across projects. A Task exists only inside its project and appears grouped under a project section on the invoice — [Projects basic](https://www.zoho.com/us/books/help/projects/basic-functions.html).
- Project states: active, inactive (API `/active`, `/inactive`); the help also has "mark as completed". Actions include clone, users, invite, comments, tasks — [API Projects](https://www.zoho.com/books/api/v3/projects/); [Projects other actions](https://www.zoho.com/us/books/help/projects/other-actions.html).
- Time entries: `billed_status` is unbilled or invoiced. Timer API: `/timer/start`, `/timer/stop`, `runningtimer/me` — [API Time Entries](https://www.zoho.com/books/api/v3/time-entries/). The timer runs in the sidebar with Stop, Pause and Discard. On stop, a popup collects the project details. A Chrome extension timer is also available — [Timesheet basic](https://www.zoho.com/us/books/help/timesheet/basic-functions.html); [Chrome extension](https://www.zoho.com/us/books/help/timesheet/chrome-extension.html).
- Invoicing: from the project, New Transaction › Create Invoice. The options depend on billing method (Fixed Cost: single line only; Task or Staff Hours: no "Group by users"; Project Hours: all options). Multiple projects can go on one invoice, and collected retainers can be applied — [Projects functions](https://www.zoho.com/us/books/help/projects/functions.html). The API has `POST /invoices/fromprojects` — [API Invoices](https://www.zoho.com/books/api/v3/invoices/). Quotes, invoices, bills, retainer invoices and expenses can be created from a project — [Timesheet basic](https://www.zoho.com/us/books/help/timesheet/basic-functions.html).
- Internal approval: enabled per project. Time entries are bundled into an approval for one approver, who approves or rejects, and can reject even after approving. An approved approval cannot be edited, and once approved it can be invoiced or sent to the customer for approval — [Internal approval](https://www.zoho.com/us/books/help/timesheet-approval/internal-approval.html).
- Customer approval: needs the customer portal and is enabled per project. Invoiced entries cannot be included. The customer approves or rejects (with reason) in the portal Timesheet tab, or the org marks Approved or Rejected (only submitted ones can be rejected). The org is notified. A status filter includes "Approval Overdue". Only approved entries can be invoiced — [Customer approval](https://www.zoho.com/us/books/help/timesheet-approval/customer-approval.html). Timesheet preferences: "Enable approval for timesheet" and "Enable customer approval" — [Timesheet preferences](https://www.zoho.com/us/books/help/timesheet/preferences.html).
- Profitability: the project Overview has a Profitability Summary chart and a link to the project P&L. Other reports: Timesheet Profitability by item, project cost summary (bills, vendor credits, expenses, journals, self-billed invoices) and project revenue summary — [Projects functions](https://www.zoho.com/us/books/help/projects/functions.html).
- Tasks module (general to-dos linked to records, e.g. an invoice follow-up): predefined statuses Yet to Start, In Progress, Completed, plus custom sub-statuses. A sub-status under Completed suppresses notifications. Only admins, the assignee or the creator can change status — [Tasks](https://www.zoho.com/us/books/help/tasks/). API task statuses: open, ongoing, completed (+ custom) — [API Tasks](https://www.zoho.com/books/api/v3/tasks/).

### Inferences
- A time entry's effective lifecycle is: Logged (Unbilled) → [optional Submitted → Approved/Rejected internally] → [optional Submitted to customer → Approved/Rejected] → Invoiced.

### Gaps
- Explicit internal and customer approval status names (beyond "Approval Overdue", Submitted for Approval and Received for Approval filters) were not fully captured.

---

## 5. Banking

### Takeaway
Bank and card statement lines arrive through feeds (Yodlee, Token, Plaid, PayPal) or imports. Each line sits in a state (Uncategorized, then Matched, Categorized, or Excluded). Transaction rules can mark lines Recognized or auto-categorize them. Matched, categorized and manually added items then feed a reconciliation that is saved as a draft or completed as Reconciled.

### Cited Findings
- Feeds: connect through Yodlee or Token (and Plaid in the US), or PayPal feeds. Feeds are fetched every 24 h for non-MFA banks. MFA banks need a manual refresh (once a day), and feeds show the previous day's transactions — [Add accounts](https://www.zoho.com/us/books/help/banking/add-accounts.html); [Feeds](https://www.zoho.com/us/books/help/banking/feeds.html).
- Imports: CSV, TSV, OFX, QIF, CAMT.053/054, MT940 and PDF (listed US banks). Statements can be auto-forwarded by email ("Bank Statements From Inbox"). The last import can be undone. Manual entries are labelled "Manually Added" — [Add transactions](https://www.zoho.com/us/books/help/banking/add-transactions.html).
- Statement line states (API): Uncategorized, Categorized, ManuallyAdded, Excluded, Matched. Actions: match, unmatch, exclude, restore, categorize (as expense, vendor payment, customer payment, credit-note refund, vendor-credit refund, payment refund), uncategorize — [API Bank Transactions](https://www.zoho.com/books/api/v3/bank-transactions/). Dashboard buckets: Autocategorized, Recognized, Best Matches, Uncategorized, Duplicates (auto-excluded) — [Banking dashboard](https://www.zoho.com/us/books/help/banking/dashboard.html).
- Transitions:
  - `Uncategorized --["Match found" / Possible Matches, select transactions summing to the amount, optionally add an adjustment such as a gateway fee]--> Matched` — [Matching](https://www.zoho.com/us/books/help/banking/matching-transactions.html)
  - `Uncategorized --[Categorize (create a new transaction inline) / Quick Categorize grid, up to 50 at once]--> Categorized` — [Matching](https://www.zoho.com/us/books/help/banking/matching-transactions.html); [Quick categorize](https://www.zoho.com/us/books/help/banking/quick-categorize.html)
  - `Matched --[Unmatch]--> Uncategorized (the Books transaction reverts to Manually Added)`; `Categorized --[Uncategorize]--> Uncategorized (the created transaction is deleted)` — [Matching](https://www.zoho.com/us/books/help/banking/matching-transactions.html)
  - `Uncategorized --[Exclude]--> Excluded --[Restore]--> Uncategorized` — [Banking other actions](https://www.zoho.com/us/books/help/banking/other-actions.html)
  - Rule engine: criteria on Payee, Description, Reference (is, contains, starts with, is empty) and Amount. The target is "Recognized" (suggest; the user confirms) or "Categorized" (automatic). Rules targeting Categorized cannot be deleted until switched to Recognized — [Transaction rules](https://www.zoho.com/us/books/help/banking/transaction-rule.html)
- Reconciliation: only matched, categorized and manually added lines appear. Closing Balance minus Cleared Amount must equal zero. "Reconcile", or "Save and Reconcile Later" (API `/reconciliations/{id}/draft`), ends in status "Reconciled". Undo works only on the most recent reconciliation, so earlier ones need the later ones deleted first. Opening balance is not editable after reconciling — [Reconciliation](https://www.zoho.com/us/books/help/banking/reconciliation.html); [API Bank Accounts](https://www.zoho.com/books/api/v3/bank-accounts/).
- Deposits and transfers: cash-to-bank deposit slips (with bank charges) are recorded and then matched against the statement — [Deposits](https://www.zoho.com/us/books/help/banking/deposits.html). Bank and card accounts can be marked inactive instead of deleted — [Banking other actions](https://www.zoho.com/us/books/help/banking/other-actions.html).

### Inferences
- The banking state machine is separate from the document state machines. Matching a deposit to an existing customer payment does not change the invoice status. Categorizing as a customer payment creates the payment, which then updates the invoice.

### Gaps
- Credit-card-specific flows (card payments, statements) beyond "Add Credit Card Accounts Manually" were not read in detail.

---

## 6. Transaction approvals

### Takeaway
Approvals are configured per module, choosing No Approval, Simple (any one approver), Multi-Level (up to 10 ordered levels, with admin "Final Approve") or Custom (criteria-routed). They insert Pending Approval, Approved and Rejected states between Draft and the sent or open state, with email and in-app notifications and a reject-with-reason / resubmit loop.

### Cited Findings
- Modules with approvals: Quotes, Sales Orders, Invoices, Retainer Invoices, Credit Notes, Sales Returns, Purchase Orders, Purchase Receives, Bills, Payments Made, Vendor Credits, Transfer Orders, Inventory Adjustments, Custom Modules — [Approvals overview](https://www.zoho.com/us/books/help/transaction-approval/); [Configure](https://www.zoho.com/us/books/help/transaction-approval/configure-approvals.html). Module preference pages limit types: SOs and Payments Made list Simple and Multi-Level, without Custom — [SO preferences](https://www.zoho.com/us/books/help/sales-order/preferences.html); [PM preferences](https://www.zoho.com/us/books/help/payments-made/preferences.html).
- Types: Simple ("Any admin or approver can approve ... Further actions can be performed only after the transaction is approved"); Multi-Level ("Set up to 10 levels"); Custom (criteria such as invoice total ≥ $10,000 route to a specific approver, with priority ordering when several rules match) — [Configure](https://www.zoho.com/us/books/help/transaction-approval/configure-approvals.html); [Custom approval](https://www.zoho.com/us/books/help/transaction-approval/custom-approval.html); [Multi-level](https://www.zoho.com/us/books/help/transaction-approval/multi-level-approval.html).
- State machine:
  - `(new) --[Save and Submit]--> Pending Approval`; `Draft --[Submit for Approval]--> Pending Approval` — [Approval workflow](https://www.zoho.com/us/books/help/transaction-approval/transaction-approval-workflow.html)
  - `Pending Approval --[Approve (Simple: any one approver)]--> Approved` — [same](https://www.zoho.com/us/books/help/transaction-approval/transaction-approval-workflow.html)
  - `Pending Approval (Level n) --[Level n approves]--> Pending Approval (Level n+1) ... --[final level approves]--> Approved`; `--[admin Final Approve]--> Approved` (bypasses the hierarchy) — [same](https://www.zoho.com/us/books/help/transaction-approval/transaction-approval-workflow.html); [Multi-level](https://www.zoho.com/us/books/help/transaction-approval/multi-level-approval.html)
  - `Pending Approval --[Reject + reason]--> Rejected` (in multi-level, any level's rejection rejects the whole transaction) `--[submitter edits, Resubmit]--> Pending Approval` — [Approval workflow](https://www.zoho.com/us/books/help/transaction-approval/transaction-approval-workflow.html)
  - `Pending Approval --[Convert to Draft + reason]--> Draft` (the pro-tip alternative to rejecting) — [same](https://www.zoho.com/us/books/help/transaction-approval/transaction-approval-workflow.html)
  - `Approved --[send / mark as sent / open]--> normal lifecycle`. Recurring profiles can auto-approve children ("Create, Auto-approve and Send") — [RI preferences](https://www.zoho.com/us/books/help/recurring-invoice/preferences.html). With approvals on, India e-invoices can only be pushed after approval — [e-Invoicing](https://www.zoho.com/in/books/help/e-invoicing/functions-einvoice.html). With Sales Approval on, the "I have received the payment" shortcut on invoices is unavailable — [Invoices](https://www.zoho.com/us/books/help/invoice/)
- Bulk approve is available (in Multi-Level via the "My Approvals" filter). List, custom-view and advanced-search filters cover approval status: Draft, Pending Approval, Approved, Rejected — [Approval workflow](https://www.zoho.com/us/books/help/transaction-approval/transaction-approval-workflow.html).
- Who approves: admins by default. A role with the per-module "Approve" permission can be created, optionally with edit and delete of approved transactions — [Users and roles](https://www.zoho.com/us/books/help/transaction-approval/users-and-roles.html).
- Preferences: "Allow approvers to approve the transactions they create". Notifications by email and in-app (Simple: notify all approvers when a non-approver submits / when anyone submits / a specific email address; Multi-Level: notify level by level). "Notify the submitter when a transaction is approved or rejected" — [Simple approval](https://www.zoho.com/us/books/help/transaction-approval/simple-approval.html); [Multi-level](https://www.zoho.com/us/books/help/transaction-approval/multi-level-approval.html).
- API mirrors this with `/submit`, `/approve`, `/approve/final`, `/reject` and bulk `/invoices/submit`, `/invoices/approve` — [API Invoices](https://www.zoho.com/books/api/v3/invoices/); [API Credit Notes](https://www.zoho.com/books/api/v3/credit-notes/).
- Workflow rules can trigger on Submitted, Approved and Rejected events — [Workflow rules](https://www.zoho.com/us/books/help/settings/automation/workflow-rules.html).

### Inferences
- Before mid-2020s versions there were only Simple and Multi-Level types. This is not confirmed by a dated source here; the current docs show all four options.

### Gaps
- No dated changelog was fetched to establish when Custom Approval or Final Approve were introduced.

---

## 7. Customer portal and vendor portal

### Takeaway
The customer portal is a self-service surface onto the same records. Customers can accept or decline quotes (triggering conversions and retainers), pay invoices and retainers, save cards or bank accounts for auto-charge, approve timesheets, view SOs and projects (if enabled), generate statements, comment, review and forward documents. The vendor portal lets vendors view POs, accept or decline them, upload invoice documents that become Bills after the org accepts them, see payments and generate statements.

### Cited Findings
- Access is enabled per contact person (an email is required) via Invite to Portal, with Reinvite and disable options. MFA (TOTP) can be enabled for both portals — [Customer Portal](https://www.zoho.com/us/books/help/customer-portal/); [MFA](https://www.zoho.com/us/books/help/customer-portal/multi-factor-authentication.html).
- Customer dashboard: Outstanding Invoices (Pay Now for the whole amount), Available Credits, Outstanding Retainer Invoices, Available Retainer Payments, Last Payment, Quotes awaiting approval, Timesheets awaiting approval — [Customer Portal](https://www.zoho.com/us/books/help/customer-portal/).
- Customer actions: accept or decline quotes (Zoho Sign signature possible); comment (org replies marked "Display in portal"); pay invoices (full, or partial if enabled per invoice) by card or ACH; save cards; view the payment history and receipts; view SOs (preference); view projects, tasks and time entries and comment (preference); approve or reject timesheet approvals; generate a statement of accounts; print, download or forward quotes, invoices and SOs (forwarded recipients are added as contact persons, if the preference allows); update their profile and cards; email the business; write a review (shown under Customer Reviews) — [Customer Portal](https://www.zoho.com/us/books/help/customer-portal/); [Portal preferences](https://www.zoho.com/us/books/help/customer-portal/preferences.html).
- Org-side signals: email notification when a customer accepts or declines a quote, comments, or pays; a "Viewed" icon when they view a quote or invoice; notification on first view of an SO or invoice — [Customer Portal](https://www.zoho.com/us/books/help/customer-portal/).
- Secure Public Links: recipients verify an email or mobile number before viewing invoices, quotes or retainer invoices shared by link — [Portal preferences](https://www.zoho.com/us/books/help/customer-portal/preferences.html).
- Custom modules can appear in the portals, and portal users can create records, submit them for approval, edit them and comment if allowed — [Portal custom modules](https://www.zoho.com/us/books/help/customer-portal/custom-modules.html).
- Vendor portal: dashboard (Outstanding Bills, Available Credits, Last Payment Received, My Account Details). Vendors view POs, comment and filter (All, Billed, Partially Billed, Cancelled). They can accept or decline POs that users "submit for review", which an admin must enable first, and the org is notified. They upload invoice documents (images or PDF, ≤5 MB), which start as **Pending** and can be autoscanned (a Failed status exists). `Pending --[org accepts]--> Bill created in Books` (shown as an invoice in the vendor portal); `--[org rejects]--> rejected`. Vendors also generate a consolidated statement of accounts — [Vendor Portal](https://www.zoho.com/us/books/help/vendor-portal/).

### Gaps
- The complete list of autoscan statuses for vendor-uploaded documents was not captured beyond Pending and Failed.

---

## 8. Cross-cutting behaviours

### Takeaway
Every transactional record shares the same toolkit: Clone, Convert-to, Void (often reversible) vs Delete (blocked by linked children), Mark as Sent, email with templates and PDF, share links, Comments & History, attachments, PDF templates, custom statuses, validation rules, custom buttons, record locking, period transaction locking, numbering series and workflow-rule automation.

### Cited Findings
- **Delete blocked by links** (the child must be deleted first): quote with an invoice or retainer — [Quote other actions](https://www.zoho.com/us/books/help/quote/other-actions.html); invoiced SO — [Delete SO](https://www.zoho.com/us/books/help/sales-order/delete-so.html); invoice with payments — [Delete invoice](https://www.zoho.com/us/books/help/invoice/delete-invoice.html); credit note with applied credits or refunds — [Delete CN](https://www.zoho.com/us/books/help/credit-note/delete-cn.html); bill with payments or credits (also blocks void) — [Bills other actions](https://www.zoho.com/us/books/help/bills/other-actions.html); vendor payment with refunds — [Manage payments made](https://www.zoho.com/us/books/help/payments-made/payments-made-operations/manage-payments-made.html); recurring profile deletion leaves its children — [RI other actions](https://www.zoho.com/us/books/help/recurring-invoice/other-actions.html).
- **Void vs Delete**: void keeps the record but removes it from reports. Invoice, credit note, bill and vendor credit can return to Draft or active. Sales receipt void cannot be undone. PO cancel is irreversible — see §1d, §1i, §2b, §2d, [Sales Receipts](https://www.zoho.com/us/books/help/sales-receipts/), [PO functions](https://www.zoho.com/us/books/help/purchase-order/functions.html).
- **Clone** exists on quotes, SOs, invoices, retainer invoices, recurring invoices, POs, bills, vendor credits and sales receipts (opens a pre-filled New page) — [Quote other actions](https://www.zoho.com/us/books/help/quote/other-actions.html); [Invoice other actions](https://www.zoho.com/us/books/help/invoice/other-actions.html); [SO other actions](https://www.zoho.com/us/books/help/sales-order/other-actions.html).
- **Comments & History**: a per-record pane with internal comments plus a change/audit trail. Retainer, PO and vendor-credit comments are not visible to the counterparty. Payment history pane on payments made — [Quote other actions](https://www.zoho.com/us/books/help/quote/other-actions.html); [Retainer functions](https://www.zoho.com/us/books/help/retainer-invoice/functions.html); [Manage payments made](https://www.zoho.com/us/books/help/payments-made/payments-made-operations/manage-payments-made.html).
- **Attachments**: quote up to 10 files × 10 MB; invoice, SO, credit note and payments 5 × 5 MB. Sources: drag-drop, cloud, or the Documents module. "Remove" keeps the file in Documents while "Delete" erases it — [Quote other actions](https://www.zoho.com/us/books/help/quote/other-actions.html); [Invoice other actions](https://www.zoho.com/us/books/help/invoice/other-actions.html).
- **Email / PDF / print**: send with an editable email template and an "Attach PDF" checkbox. The invoice toolbar has Mails/SMS, Share, Reminders, PDF/Print and Record Payment ([screenshot](https://www.zoho.com/books/help/images/invoice/record-payment.png)). Bulk PDF (one file) or ZIP of PDFs. Scheduled send. Email Insights tracks notification-email status icons on Invoices, Retainer Invoices and Quotes lists — [Invoice other actions](https://www.zoho.com/us/books/help/invoice/other-actions.html); [Invoices](https://www.zoho.com/us/books/help/invoice/); [Emails settings](https://www.zoho.com/us/books/help/settings/emails.html).
- **Statement of accounts**: Statement tab on a customer or vendor for a chosen period, with PDF, print or email. Customers and vendors can also generate it in their portals — [Contacts other actions](https://www.zoho.com/us/books/help/contacts/other-actions.html); [Customer Portal](https://www.zoho.com/us/books/help/customer-portal/).
- **Transaction locking** (period close): lock by module (Sales: invoices, credit notes, invoice and customer payments, bills of supply, debit notes, retainer invoices; Purchases: expenses, bills, vendor credits, vendor and bill payments; Banking: deposits, transfers, and more) or lock everything at once, with a lock date and reason. Unlock requires a reason. **Partial unlock** for a date window — [Transaction Lock](https://www.zoho.com/us/books/help/accountant/transaction-lock.html); [API Transaction Locking](https://www.zoho.com/books/api/v3/transaction-locking/).
- **Record locking** (per record): available in Items, Invoices, Quotes, Sales Orders, Credit Notes and Custom Modules. Lock configurations restrict or allow actions or fields for all roles or all-except-some. A locked record shows a lock icon with reason, user and time. Users with permission can unlock — [Record Locking](https://www.zoho.com/us/books/help/settings/customization/record-locking.html). Module preference pages describe locking "after they reach a specific status" — [Quote preferences](https://www.zoho.com/us/books/help/quote/preferences.html).
- **Numbering**: auto-numbered per module, with manual override via the gear icon. Transaction Number Series (prefix + starting number) can be selected per transaction and per location — [Quotes](https://www.zoho.com/us/books/help/quote/); [Invoices](https://www.zoho.com/us/books/help/invoice/); [Locations basic](https://www.zoho.com/us/books/help/settings/organization/locations/basic-functions.html).
- **Custom statuses**: SO (parent-status model), PO, Retainer Invoice ("Statuses" in preferences), Tasks (sub-statuses). The API exposes `/substatus/{id}` on SOs, invoices and credit notes — [SO other actions](https://www.zoho.com/us/books/help/sales-order/other-actions.html); [PO preferences](https://www.zoho.com/us/books/help/purchase-order/preferences.html); [API Invoices](https://www.zoho.com/books/api/v3/invoices/).
- **Workflow rules**: event-based triggers (Created, Edited, Created or Edited, Deleted, Submitted, Approved, Rejected) with field conditions, or Date Based triggers. Actions: email alerts, field updates, webhooks, custom functions (Deluge), in-app notifications. Rules run in the background — [Workflow rules](https://www.zoho.com/us/books/help/settings/automation/workflow-rules.html). Validation rules and custom buttons exist per module — [Quote preferences](https://www.zoho.com/us/books/help/quote/preferences.html).
- **Bulk list actions**: bulk update a field, bulk PDF, print, delete; Export (CSV, XLS, XLSX; max 10,000 rows; optional PII; password) — [Quote other actions](https://www.zoho.com/us/books/help/quote/other-actions.html).

### Gaps
- Custom-module **Blueprints** (a configurable state machine for custom modules) exist ([Blueprints](https://www.zoho.com/us/books/help/custom-modules/blueprints.html)) but the page was not read.

---

## 9. "What's next?" guided prompts after each step

### Takeaway
Zoho Books shows a contextual banner on a record's detail page that names the next lifecycle step and gives one-click buttons. Confirmed examples are a draft invoice (Send / Mark as Sent), an open invoice (Record payment, with credits and gateway prompts) and an older PO screen (Convert to Bill). Prompts for other modules were not confirmed from current sources.

### Cited Findings
- Draft invoice detail page banner: **"Send the invoice. Invoice has been created. You can email it to your customer or mark it as sent."** with buttons **[Send Invoice] [Mark as Sent]** (current UI, toolbar Edit, Mails/SMS, Share, PDF/Print, Record Payment, •••) — [screenshot](https://www.zoho.com/books/help/images/invoice/mark-as-sent.png).
- Unpaid invoice detail page: **"Credits Available: Rs.23,540.00, Apply Now"** prompt, then **"Get paid faster with online payment gateways"** (configured gateways listed, "Change"), then primary button **[Record Offline Payment ▾]**. The Record Payment dropdown offers Record Payment, Charge Customer and Write Off — [screenshot](https://www.zoho.com/books/help/images/invoice/record-payment.png).
- Invoice with unused retainers: "Retainers Available" notification with **Apply Now** — [Retainer functions](https://www.zoho.com/us/books/help/retainer-invoice/functions.html).
- Purchase order (older UI, undated screenshot): a **"WHAT'S NEXT"** tab next to "COMMENTS & HISTORY" and "BILLS", reading **"Complete Your Purchase. You can create bills and receives (in any sequence) with this order to complete your purchase."** with **[Convert to Bill]** — [screenshot](https://www.zoho.com/books/help/images/purchase-order/convert-to-bill.png).
- Draft sales order and credit note: a top-level **Convert to Open** button is described in help (not a banner) — [Sales Order](https://www.zoho.com/us/books/help/sales-order/); [CN other actions](https://www.zoho.com/us/books/help/credit-note/other-actions.html).

### Inferences
- The banner content tracks the record's status (Draft → "send", Sent/Open → "record payment / apply credits", Open PO → "convert to bill or receive"). It works as a status-driven next-action hint rather than a fixed wizard.

### Gaps
- Exact current banner text for quotes, sales orders, bills, retainers and credit notes was not found in the fetched help text or downloaded screenshots. The PO screenshot is from an older UI (the help page does not date it).
