# Zoho Books live demo: current screens, measured visual tokens and front-end stack (observed 18 Nov 2026)

How this was observed. Zoho's public no-login demo at https://www.zoho.com/us/books/accounting-software-demo/ was rendered in headless Chromium (Playwright) at 1440x900 and deviceScaleFactor 1, plus one 390x844 phone-width render. Values come from `getComputedStyle`, `getBoundingClientRect`, `document.styleSheets` and `window` globals on the live page. Nothing was saved: "New" forms and modals were opened and then closed.

Screenshots are in `/tmp/claude-0/-home-user-Apps/b158bf16-7102-5661-a48b-1d8b5b0e6ef4/scratchpad/zoho_imgs_demo/`; filenames are cited below. The Playwright scripts are in the sibling folder `.../scratchpad/demo_scripts/`. The demo is a US-edition "Demo Org" ("This is a Test organization.") on an unspecified plan.

**Demo caveats that affect every observation:**
- The sample data is regenerated on each page load. Dates, amounts, customer names and statuses differ between loads, and lorem-ipsum words appear in names and templates (e.g. "accusamus", PDF template "ipsa").
- Document previews are a static "SAMPLE" image.
- Contact (customer/vendor) detail bodies did not render.
- The demo turns on two Accessibility Preferences by default: the `<body>` carries `zf-a11y-underline-links zf-a11y-text-spacing` with `--zf-a11y-text-spacing-value: 0.32px`. That is why links are underlined and all text has `letter-spacing: 0.32px` in most screenshots. With those classes removed, letter-spacing computes to `normal` and links lose their underline (`invoices_list_no_a11y.png`). — [Demo #/invoices](https://www.zoho.com/us/books/accounting-software-demo/#/invoices)

## Invoices LIST view (plus Customers, Bills, Quotes, Sales Orders lists)

### Takeaway
The Invoices list is a full-width table page with the following parts, top to bottom:
- **Header (65px):** a bold 18px view-switcher title at left; a blue "+ New" split button and a grey "•••" button at right.
- **Payment Summary card:** rounded, light grey, shown above the table.
- **Table:** 39px uppercase grey header and 51px rows. Statuses are colored 12px uppercase text, not pills. Hover tints the cells. Selected rows turn lavender.
- **Bulk-action bar:** replaces the header while rows are selected.
- **Sticky pagination footer:** "Total Count: View" at left; a "50 per page" selector and a "‹ 1 - 18 ›" pager at right.

### Cited Findings
**Header row**
- `#list-filter` is 65px tall on white. The title "All Invoices" is a dropdown trigger (button 140x33, radius 6px, padding 2px 10px) whose label computes to 18px / weight 600 / #212529 Inter, followed by a blue chevron. — [Demo #/invoices](https://www.zoho.com/us/books/accounting-software-demo/#/invoices) (`invoices_list.png`)
- Right side, left to right:
  - a primary split button: "+ New" is 69x33, background #408dfb, white 13px text, radius 4.875px on the left only; a separate ▾ caret button follows;
  - then a 32x32 secondary "•••" button (aria-label "More Actions"): background #f5f5f5, 1px #dddddd border, radius 4.875px, padding 8px.
  - — [Demo #/invoices](https://www.zoho.com/us/books/accounting-software-demo/#/invoices)
- **View-switcher dropdown** (`invoices_view_switcher.png`), top to bottom:
  - a search input;
  - collapsible group headers in uppercase with count badges: "FAVORITES 1" (grey badge), "DEFAULT FILTERS 12" (blue badge), "CREATED BY ME 3";
  - the default filters, each with a star icon to favourite it: All, Draft, Pending, PendingApproval, Approved, Client Viewed, Partially Paid, Unpaid, Overdue, Payment Initiated, Paid, Void;
  - a sticky footer link "+ New View".
  - — [Demo #/invoices](https://www.zoho.com/us/books/accounting-software-demo/#/invoices)
- **"New ▾" caret menu:** New Invoice · New Recurring Invoice · New Credit Note (`invoices_new_split.png`). — [Demo #/invoices](https://www.zoho.com/us/books/accounting-software-demo/#/invoices)
- **"•••" More menu** (`invoices_more_menu_hover.png`). Every item has a blue line icon; dividers separate the groups:
  - Sort by ›
  - Import Invoices
  - Export ›
  - Preferences
  - Manage Custom Fields
  - Online Payments
  - Refresh List
  - Reset Column Width
  - Submenus: "Sort by ›" opens Created Time, Last Modified Time, Date, Invoice#, Order Number, CustomerName, Due Date, Amount, Balance Due. "Export ›" opens Export Invoices, Export Current View.
  - — [Demo #/invoices](https://www.zoho.com/us/books/accounting-software-demo/#/invoices)
- **"New View" page:** Name, "Mark as Favorite", a criteria builder ("Select a field / Select a comparator / value", "+ Add Criterion"), a "Columns Preference" pair of lists (AVAILABLE COLUMNS ↔ SELECTED COLUMNS), and "Visibility Preference" radios (Only Me / Only Selected Users & Roles / Everyone), then Save / Cancel. — [Demo #/invoices → New View](https://www.zoho.com/us/books/accounting-software-demo/#/invoices) (`invoices_new_custom_view.png`)

**Summary strip above the table**
- The "PAYMENT SUMMARY" card is 1156x141.
  - Card styling: background #f9f9fb, 1px #ebeaf2 border, radius 10px, inset about 10px from the content edges.
  - Heading: 12px / weight 500 / uppercase / #6c718a.
  - Contents, left to right:
    - a round orange icon tile (↙) with "Total Outstanding Receivables" and "$672.19" (15px / 600), plus a "Refresh" link;
    - "Due Today" with an orange amount;
    - "Due Within 30 Days";
    - "Overdue Invoice";
    - "Average No. of Days for Getting Paid" ("0 Days").
  - Small dot separators sit between the tiles.
  - — [Demo #/invoices](https://www.zoho.com/us/books/accounting-software-demo/#/invoices)
- The Bills list showed no summary strip (`bills_list.png`). — [Demo #/bills](https://www.zoho.com/us/books/accounting-software-demo/#/bills)

**Table**
- Column set and order for Invoices:
  1. a pinned 60px selection column, holding a "customize" (sliders) icon and a select-all checkbox;
  2. DATE;
  3. INVOICE#;
  4. ORDER NUMBER;
  5. CUSTOMERNAME (sic, no space);
  6. STATUS (not sortable);
  7. DUE DATE;
  8. AMOUNT (right-aligned);
  9. BALANCE DUE (right-aligned);
  10. a 50px trailing column with a magnifier icon that opens Advanced Search.
  - Data columns default to 150px each. The table (1310px) is wider than the 1176px content area at 1440px, so BALANCE DUE is clipped and the table scrolls horizontally.
  - — [Demo #/invoices](https://www.zoho.com/us/books/accounting-software-demo/#/invoices)
- Header cells:
  - 39px tall; background #f9f9fb; padding 10px 15px; text 11px / weight 600 / uppercase / #6c718a.
  - Sortable headers are `<button class="srt-btn">` with `aria-sort`, and each has a drag-to-resize handle (`.cell-resizer`).
  - — [Demo #/invoices](https://www.zoho.com/us/books/accounting-software-demo/#/invoices)
- Body rows:
  - 51px tall; cells padded 12px 15px; text 13px / 400 / black; line-height 20.8px.
  - The invoice number is a link (13px / weight 500 / #1c5bd9) followed by a small grey bank icon.
  - 18 rows; "1 - 18" in the pager.
  - — [Demo #/invoices](https://www.zoho.com/us/books/accounting-software-demo/#/invoices)
- **Status display:** colored text only: 12px, weight 400, uppercase, transparent background, classes `list-status-column text-<status>`. Measured colors:

| Status | Color |
|---|---|
| DRAFT | rgb(135,150,151) #879697 |
| OPEN | #408dfb |
| OVERDUE | rgb(247,104,49) #f76831 |
| PAID | #22b378 |
| PARTIALLY PAID | #22b378 |
| PENDING / PENDING APPROVAL | rgb(235,97,0) #eb6100 |
| APPROVED | rgb(49,112,143) #31708f |
| VOID | #777777 |

  — [Demo #/invoices](https://www.zoho.com/us/books/accounting-software-demo/#/invoices)
- **Hover:** the row gets no background. Each cell gets `box-shadow: inset 0 0 0 9999px rgb(246,246,250)` (#f6f6fa). This is Bootstrap 5's `--zf-table-accent-bg` technique. No per-row action buttons appeared on hover; the trailing cell (`list-actions dropdown`) stayed empty (`invoices_row_hover.png`). — [Demo #/invoices](https://www.zoho.com/us/books/accounting-software-demo/#/invoices)
- **Selection:** a checked row gets class `selected` and background rgb(241,241,250) #f1f1fa. — [Demo #/invoices](https://www.zoho.com/us/books/accounting-software-demo/#/invoices)
- **Bulk-action bar** (`invoices_bulk_selected.png`):
  - It replaces the header and appears as a white rounded bar. The Payment Summary disappears and the table moves up.
  - Contents, left to right:
    - a Print icon button;
    - a Download icon ▾, whose menu holds Export as PDF and Export as ZIP (File);
    - a divider;
    - "Associate with Sales Orders" split ▾;
    - "Mark As Sent";
    - "Delete";
    - a divider;
    - a round light-blue count badge "2" with "Selected";
    - at far right, "Esc ✕" with a red ✕.
  - — [Demo #/invoices](https://www.zoho.com/us/books/accounting-software-demo/#/invoices)
- **Pagination footer** (`invoices_list_bottom.png`, `invoices_per_page.png`):
  - It is a sticky footer.
  - Left: "Total Count:" plus a "View" link, which loads the count on demand.
  - Right:
    - a "⚙ 50 per page" combobox (role=combobox; options 10, 25, 50, 100, 200 per page);
    - a bordered pager "‹ 1 - 18 ›" with Previous/Next icon buttons.
  - Font tokens are `--zf-pagination-font-size: 12px` and `--zf-pagination-font-weight: 600`.
  - — [Demo #/invoices](https://www.zoho.com/us/books/accounting-software-demo/#/invoices)
- **Customize menu (sliders icon):** "Customize Columns" and "Wrap Text". "Customize Columns" opens a 500px modal attached to the top of the viewport (`invoices_customize_columns.png`):
  - Header (52px, background #f9f9fb): a sliders icon with the title, the counter "8 of 19 Selected", and a red ✕.
  - A search field.
  - One row per column, on light-grey backgrounds, each with a ⋮⋮ drag handle. Date, Invoice#, Status and Amount show a lock icon instead of a checkbox (mandatory). The rest have checkboxes.
  - The 19 available columns: Date, Invoice#, Order Number, CustomerName, Status, Due Date, Amount, Balance Due, Adjustment, CRM Potential Name, Due Days, Project Name, Sales person, Shipping Charge, plus demo custom fields ddd, q, qe, qq, www.
  - Save / Cancel footer.
  - — [Demo #/invoices](https://www.zoho.com/us/books/accounting-software-demo/#/invoices)

**Other lists**
- Column sets:
  - **Customers:** NAME, COMPANY NAME, EMAIL, WORK PHONE, RECEIVABLES, UNUSED CREDITS. — [Demo #/contacts](https://www.zoho.com/us/books/accounting-software-demo/#/contacts) (`customers_list.png`)
  - **Bills:** DATE, BILL#, REFERENCE NUMBER, VENDOR NAME, STATUS, DUE DATE, AMOUNT, BALANCE DUE. — [Demo #/bills](https://www.zoho.com/us/books/accounting-software-demo/#/bills)
  - **Quotes:** title "All Estimates" although the nav says "Quotes". Columns DATE, ESTIMATE NUMBER, REFERENCE NUMBER, CUSTOMERNAME, STATUS, AMOUNT. — [Demo #/quotes](https://www.zoho.com/us/books/accounting-software-demo/#/quotes)
  - **Sales Orders:** DATE, SALES ORDER#, REFERENCE#, CUSTOMERNAME, STATUS, AMOUNT, INVOICED, PAYMENT. — [Demo #/salesorders](https://www.zoho.com/us/books/accounting-software-demo/#/salesorders)
  - **Recurring Invoices:** CUSTOMERNAME, PROFILE NAME, FREQUENCY, LAST INVOICE DATE, NEXT INVOICE DATE, STATUS (ACTIVE/STOPPED), AMOUNT. — [Demo #/recurringinvoices](https://www.zoho.com/us/books/accounting-software-demo/#/recurringinvoices)
  - **Payments Received:** DATE, BRANCH, PAYMENT #, TYPE, REFERENCE NUMBER, CUSTOMER NAME, INVOICE#, MODE, AMOUNT, UNUSED AMOUNT. — [Demo #/paymentsreceived](https://www.zoho.com/us/books/accounting-software-demo/#/paymentsreceived)
  - **Expenses:** has a "Receipts Inbox | All Expenses" tab pair above the list. — [Demo #/expenses](https://www.zoho.com/us/books/accounting-software-demo/#/expenses)
- **Empty state:** no empty list was found. Retainer Invoices, Credit Notes, Recurring Invoices, Vendor Credits, Payments Received, Expenses, Purchase Orders, Vendors and Items all had rows. The guessed hashes `#/projects` and `#/journals` returned "Page Not Found — You may have mistyped the address or the page may have been moved." — [Demo](https://www.zoho.com/us/books/accounting-software-demo/#/projects)

**Comparison with earlier notes**
- Confirmed:
  - the view-switcher title, "+ New" and "•••" More layout;
  - uppercase grey sortable headers, blue record links, colored uppercase status text and right-aligned amounts;
  - the customize-columns icon at the far left of the header;
  - the bulk bar replacing the header.
- Updated:
  - The More menu now also holds "Manage Custom Fields", "Online Payments" and "Reset Column Width". Export is a submenu of "Export Invoices / Export Current View".
  - The bulk bar holds Print, Download ▾, "Associate with Sales Orders", "Mark As Sent", Delete and "N Selected", with no "Bulk Update" in this demo.
  - Measured rows are 51px, against the earlier 40–48px estimate.

### Inferences
- The table header token `--zf-table-header-color: #757383` and the computed #6c718a differ. A more specific rule likely overrides the variable; the computed value is what renders.
- No hover row actions and no per-row "•••" menu appeared. In this build, row actions on the Invoices list seem to sit only in the bulk bar and on the detail page.

### Gaps
- No empty-list illustration or empty-state copy could be captured, because every reachable list contained sample rows.
- The demo regenerates data on every load, so row values in the screenshots are not stable.

## Invoice DETAIL / split view (plus Quote, Sales Order, Bill, Customer)

### Takeaway
Clicking a row turns the page into a split view:
- **Left:** a 360px list pane of 92px three-line cards.
- **Right:** an 817px detail pane, top to bottom:
  - a 66px header (record number, Comments icon, red ✕);
  - a 40px grey action toolbar of icon+label items separated by hairlines;
  - a "WHAT'S NEXT?" card;
  - the A4-width document "paper" with a diagonal status ribbon;
  - a dashed sub-tab strip ("Journal").

Comments open as a 400px right-hand flyout. Quotes use a newer card layout (Quote Details | Activity tabs, Details/PDF segmented toggle, filled status badge). Invoices, Sales Orders and Bills still use the paper-preview layout.

### Cited Findings
**Left list pane**
- The list column is 360px wide (x 220–580 at 1440px).
  - Its header (66px) holds "All Invoices ▾", a square blue "+" with a ▾ split, and "•••".
  - — [Demo #/invoices/2](https://www.zoho.com/us/books/accounting-software-demo/#/invoices/2) (`invoice_detail.png`)
- Each row is a 91–92px card: a 38px checkbox column, then three lines.
  - Line 1: the customer name (`.name`, 13px) with the amount floated right.
  - Line 2: the invoice-number link (color #4c526c, `text-dark-shade-blue`), a "•" dot separator and the date.
  - Line 3: the status as colored uppercase text, plus a small icon (bank icon on invoices, eye "viewed" on quotes, envelope on sales orders). Quote rows also show a paper-clip icon at right.
  - The selected row has a light-lavender background. Hover tints the cell with the same #f6f6fa inset shadow as the list.
  - — [Demo #/invoices/2](https://www.zoho.com/us/books/accounting-software-demo/#/invoices/2)
- The customer split list shows the name plus the receivables amount, and "INACTIVE" right-aligned for inactive contacts. — [Demo #/contacts/7000000007971](https://www.zoho.com/us/books/accounting-software-demo/#/contacts/7000000007971) (`customer_overview.png`)

**Record header and toolbar (Invoice, Partially Paid)**
- The header is 66px tall, white, with 0 20px padding.
  - Left: "Invoice2" at 18px / 600 / black.
  - Right: a Comments icon button (secondary style), a 1px vertical separator, then a red ✕ close.
  - — [Demo #/invoices/2](https://www.zoho.com/us/books/accounting-software-demo/#/invoices/2)
- The toolbar is `ul.details-menu-bar`:
  - 40px tall; background #f7f8fc; `box-shadow: 0 2px 4px rgba(33,38,60,.03)`;
  - items are 13px #222536 text with a leading line icon, padding 5px 7px, separated by 1x20px hairline `li.separationline`.
  - — [Demo #/invoices/2](https://www.zoho.com/us/books/accounting-software-demo/#/invoices/2)
- Invoice toolbar buttons and their menus:

| Button | Menu contents |
|---|---|
| Edit | — |
| Send Email | — |
| Share | — |
| PDF/Print ▾ | PDF · Print · Print Delivery Note · Print Packing Slip |
| Record Payment ▾ | Record Payment · Write Off |
| ••• | Make Recurring · Create Credit Note · Clone ‖ View Journal · Delete ‖ Invoice Preferences |

  — [Demo #/invoices/2](https://www.zoho.com/us/books/accounting-software-demo/#/invoices/2) (`invoice_detail_dd_PDF_Print.png`, `invoice_detail_dd_Record_Payment.png`, `invoice_detail_dd_more.png`)
- **Share** opens the "Share Invoice Link" modal (600px, top-attached; `invoice_share_modal.png`), top to bottom:
  - "Visibility: Public ▾" in red;
  - the copy "Select an expiration date and generate the link to share it with your customer. Remember that anyone who has access to this link can view, print or download it.";
  - a red required label "Link Expiration Date*" with a date input (e.g. 17 Apr 2027);
  - the helper "By default, the link is set to expire 90 days from the invoice due date.";
  - footer buttons "Generate Link" (primary) and "Disable All Active Links" (secondary).
  - — [Demo #/invoices/2](https://www.zoho.com/us/books/accounting-software-demo/#/invoices/2)

**Contextual cards**
- First line: "Credits Available: **$41219** Apply Now". — [Demo #/invoices/2](https://www.zoho.com/us/books/accounting-software-demo/#/invoices/2)
- Then the "WHAT'S NEXT?" block:
  - it sits in a 777px card with radius 3.9px and a thick left border (`bl-4`);
  - a sparkle icon precedes the heading "WHAT'S NEXT?" (12px / 600 / #222536);
  - copy for Partially Paid: "Invoice has been partially paid. Record payment for it as soon as you receive the full payment. Learn More";
  - a small primary "Record Payment" button (27px tall, 11.4px text, radius 6px).
  - — [Demo #/invoices/2](https://www.zoho.com/us/books/accounting-software-demo/#/invoices/2)
- Below it, a strip (background #f9f9fb, padding 10px 15px) reads "Get paid faster by setting up online payment gateways. Set Up Now ›". — [Demo #/invoices/2](https://www.zoho.com/us/books/accounting-software-demo/#/invoices/2)
- Right-aligned above the paper sit two items:
  - a "Payment Initiated" popover trigger. Its popover (179x105, 1px #ddd border, radius 6.5px, `box-shadow: 0 2px 4px rgba(141,141,141,.2)`) reads "Transaction Details / Gateway Transaction ID: / Payment Initiated:";
  - a "👁 Viewed" link.
  - — [Demo #/invoices/2](https://www.zoho.com/us/books/accounting-software-demo/#/invoices/2) (`invoice_payment_initiated_popover.png`)

**Document preview and below**
- The paper is `.details-container`: `max-width: 8.27in` (A4 width), 1px #e9eaf5 border, centered.
  - A 114x114 diagonal corner ribbon sits top-left (`ribbon-inner ribbon-success`, background #1fcd6d, white text "Partially Paid").
  - Hovering the paper reveals a primary "⚙ Customize ▾" button at its top-right corner (radius 0 0 0 5px) (`invoice_preview_hover.png`).
  - Below the paper: "PDF Template : 'ipsa' Change".
  - — [Demo #/invoices/2](https://www.zoho.com/us/books/accounting-software-demo/#/invoices/2)
- In the demo the paper shows a static image with a "SAMPLE" stamp and the text "This is a sample invoice PDF." The real template is rendered into an open Shadow DOM root `#template-html-shadow-host`, whose stylesheet begins with a CSS reset and a block labelled "/* Flying saucer css */". — [Demo #/invoices/2](https://www.zoho.com/us/books/accounting-software-demo/#/invoices/2)
- Under the paper is a dashed tab strip (`nav-tabs-dashed`) with one tab, "Journal" (13px / 600, blue underline). It shows "Journal entries will not be available for Invoices in the Partially Paid state." — [Demo #/invoices/2](https://www.zoho.com/us/books/accounting-software-demo/#/invoices/2) (`invoice_detail_bottom.png`)
- **Comments panel:** a flyout docked right, below the top band:
  - 400px wide; white; `box-shadow: -2px 5px 10px 1px rgba(0,0,0,.176)`;
  - title "Comments" with a red ✕;
  - a rich-text box with B / I / U and an "Add Comment" button (1px #d7d5e2 border, radius 6px);
  - an "ALL COMMENTS" divider with the empty text "No comments yet."
  - — [Demo #/invoices/2](https://www.zoho.com/us/books/accounting-software-demo/#/invoices/2) (`invoice_comments_panel.png`)

**Quote (newer detail design)**
- Toolbar and menus:

| Button | Menu contents |
|---|---|
| Edit | — |
| Mails ▾ | Send Email |
| Share | — |
| PDF/Print ▾ | PDF · Print |
| Convert ▾ | Convert to Invoice · Convert to Sales Order |
| ••• | Create Retainer Invoice · Create Project · Mark as Declined · Clone · Delete · Quote Preferences |

  - For an already-invoiced quote, the Convert menu is replaced by a direct "Convert to Invoice" button.
  - — [Demo #/quotes/2](https://www.zoho.com/us/books/accounting-software-demo/#/quotes/2) (`quote_detail.png`, `quote_dd_*.png`)
- **What's Next** is a single-line rounded card: "✦ WHAT'S NEXT? Convert this quote to an invoice or a sales order. [Convert ▾] [Create ▾]". — [Demo #/quotes/2](https://www.zoho.com/us/books/accounting-software-demo/#/quotes/2)
- **Body:** the body background is #fafafc (`bg-neutral-100`, padding 15px). On it sits a white card containing:
  - underline tabs "Quote Details | Activity" and, at right, a segmented "Details | PDF" toggle;
  - in Details:
    - a header "EST-23902" with a filled green "Accepted" badge (an invoiced quote shows a dark-green filled "Invoiced" badge), "Total : $281.00" below it and "👁 Viewed" at right;
    - a two-column label/value grid: Quote Number, Quote Date, Creation Date, Salesperson (initial-avatar chip), Expiry Date, Reference Number, PDF Template ⚙;
    - "Customer Details": Name with an avatar initial, Billing Address, Shipping Address;
    - "Items 7" with a count badge, then a table: S.NO, ITEM (link + description + SKU), QTY (with unit "Pcs"), PRICE, AMOUNT;
    - Sub Total / Adjustment / Total;
    - Notes;
    - Terms and Conditions.
  - The Activity tab showed "No history found."
  - — [Demo #/quotes/2](https://www.zoho.com/us/books/accounting-software-demo/#/quotes/2) (`quote_activity_tab.png`, `quote_pdf_toggle.png`)

**Sales Order**
- Toolbar and menus:

| Button | Menu contents |
|---|---|
| Edit | — |
| Send Email | — |
| PDF/Print ▾ | PDF · Print |
| Mark as Confirmed | — |
| ••• | Convert to Invoice · Convert to Purchase Order · Clone · Delete |

  — [Demo #/salesorders/4000000079701](https://www.zoho.com/us/books/accounting-software-demo/#/salesorders/4000000079701) (`salesorder_detail.png`)
- **What's Next:** "Send this Sales Order to your customer by email or mark it as Confirmed." with [Send Sales Order] (primary) and [Mark as Confirmed] (secondary). — [Demo #/salesorders/4000000079701](https://www.zoho.com/us/books/accounting-software-demo/#/salesorders/4000000079701)
- Below, in order:
  - an italic "Show PDF View" label with a blue toggle switch (on);
  - the paper with a grey "Draft" ribbon (#94a5a6);
  - "More Information" (Salesperson, E-Commerce Operator).
  - — [Demo #/salesorders/4000000079701](https://www.zoho.com/us/books/accounting-software-demo/#/salesorders/4000000079701)

**Bill**
- Toolbar: Edit · PDF/Print · Convert to Open · Record Payment · •••. — [Demo #/bills](https://www.zoho.com/us/books/accounting-software-demo/#/bills) (`bill_detail.png`)
- Below the toolbar, in order:
  - a "Review Unmatched Items — 1 items not associated with purchase orders. View Item Details" notice;
  - "Credits Available";
  - What's Next: "Bill has been created. Convert the bill to the open status to record payment." [Convert to Open];
  - "Show PDF View";
  - Notes;
  - a "Journal" tab.
  - — [Demo #/bills](https://www.zoho.com/us/books/accounting-software-demo/#/bills)

**Customer / Vendor detail**
- After 7–15s, only the record name ("Sophia Hall", "Isabella Perez") appeared in the detail pane: no tabs, no Overview and no toolbar. — [Demo #/contacts/7000000007971](https://www.zoho.com/us/books/accounting-software-demo/#/contacts/7000000007971); [Demo #/vendors/123765428845](https://www.zoho.com/us/books/accounting-software-demo/#/vendors/123765428845) (`customer_overview.png`, `vendor_detail.png`)

**Comparison with earlier notes**
- Confirmed:
  - the narrow left list pane with 2–3-line cards;
  - the grey divided text+icon toolbar;
  - the contextual call-to-action card;
  - the white paper with a diagonal ribbon.
- Contradicted or changed for this demo build:
  - The header carries only a Comments icon and ✕. There is no "Attach File(s)" button with a count badge, and no "Comments & History" label; the flyout is titled just "Comments".
  - The invoice toolbar shows "Send Email" (plain), not "Mails/SMS ▾", and has no "Reminders ▾".
  - Quotes use a newer Details/PDF card layout with an "Activity" tab and filled status badges. The earlier notes did not describe it.

### Inferences
- The "Flying saucer css" block in the preview's shadow root suggests the HTML templates are built for the Flying Saucer XHTML-to-PDF renderer, so the same markup drives both the on-screen preview and the PDF. This is inference from a CSS comment.
- The Quote page's Details/PDF toggle and filled badges look like a later redesign rolled out per module. The Sales Order's "Show PDF View" toggle is an intermediate form of the same idea. This is inference.

### Gaps
- The Customer Overview layout (tabs, two-column overview, statement) could not be observed: the demo renders only the name.
- No invoice in Draft or Sent state was opened, so their What's Next wording and toolbar variants were not captured. Only Partially Paid was, and its data is randomized per load.
- No "History" timeline appeared for invoices in this build. Quotes showed "No history found."

## NEW INVOICE form (and modal anatomy)

### Takeaway
The form is a full-page takeover of the content area. Top to bottom:
1. A header: document icon, "New Invoice" at 22px regular, a blue gear and ✕ at right.
2. A light-grey customer band.
3. A white label-left/field-right grid: 180px label column, 329px fields, 34px inputs with radius 6px.
4. A card-style "Item Table".
5. A 10px-radius grey totals block at right, with Customer Notes at left.
6. A grey lower band: Terms & Conditions, attachments, payment-gateway promo.
7. A sticky shadowed footer:
   - left: [Save as Draft] [Save and Send | ▴] [Cancel];
   - right: "Make Recurring" and running totals.

Required labels are red with an asterisk.

### Cited Findings
**Header and customer band**
- Header: a doc icon plus "New Invoice" (h3, 22.1px / weight 400 / black). Right: a blue gear (settings dropdown), a separator, and ✕ ("Close this Invoice"). — [Demo #/invoices/new](https://www.zoho.com/us/books/accounting-software-demo/#/invoices/new) (`new_invoice.png`, `new_invoice_tall.png`)
- Customer band (light-grey background, full width):
  - a red "Customer Name*" label;
  - a 509x34 select box (border 1px #d7d5e2, radius 6px on the left only) with the placeholder "Select or add a customer";
  - an attached 34px blue search button (radius 0 6px 6px 0) for advanced customer search.
  - — [Demo #/invoices/new](https://www.zoho.com/us/books/accounting-software-demo/#/invoices/new)
- **Customer picker** (`new_invoice_customer_picker.png`):
  - a dropdown panel with a "Search" input on top;
  - options with a grey circular initial avatar, the name, and a second line with a building icon plus the company name;
  - the highlighted option fills solid blue (#408dfb) with white text;
  - a sticky footer "⊕ New Customer" in blue;
  - typing filters live ("Soph" → Sophia Hall).
  - — [Demo #/invoices/new](https://www.zoho.com/us/books/accounting-software-demo/#/invoices/new)
- **After choosing a customer** (no save; `new_invoice_customer_selected.png`), the band expands:
  - a "USD" currency chip with a green dot;
  - BILLING ADDRESS ✎ and SHIPPING ADDRESS ✎ columns;
  - REMARKS;
  - "Tax: eius ( 1% ) ✎";
  - a dark pill tab "Sophia Hall's Details ›" docked at the right edge.
  - Further down the form also gains:
    - an exchange-rate line "(As on 17 Nov 2026) 1 USD = 182 USD";
    - "Tax Exclusive ▾" and "Select Price List ▾";
    - Terms becomes "Custom".
  - — [Demo #/invoices/new](https://www.zoho.com/us/books/accounting-software-demo/#/invoices/new)

**Field grid** (field order with measured label colors)
- Invoice#* (red), holding "Inv-0000" with a blue ⚙ inside the input. — [Demo #/invoices/new](https://www.zoho.com/us/books/accounting-software-demo/#/invoices/new)
- Order Number. — [Demo #/invoices/new](https://www.zoho.com/us/books/accounting-software-demo/#/invoices/new)
- One row of three fields:
  - Invoice Date* (red; "18 Nov 2026");
  - Terms ("Due on Receipt ▾");
  - Due Date, shown with a dashed border.
  - — [Demo #/invoices/new](https://www.zoho.com/us/books/accounting-software-demo/#/invoices/new)
- A horizontal rule, then Salesperson ("Select or Add Salesperson ▾"), then another rule. — [Demo #/invoices/new](https://www.zoho.com/us/books/accounting-software-demo/#/invoices/new)
- Labels are 13px / 400. Required labels compute to rgb(214,20,29) #d6141d with a trailing "*"; optional labels are black. — [Demo #/invoices/new](https://www.zoho.com/us/books/accounting-software-demo/#/invoices/new)
- Inputs and selects are 34px tall: border 1px #d7d5e2, radius 6px, padding 5px 8px, 13px text. Focus gives border #408dfb plus `box-shadow: 0 0 0 3px rgba(64,141,251,.16)`. — [Demo #/invoices/new](https://www.zoho.com/us/books/accounting-software-demo/#/invoices/new)

**Item Table**
- Card header "Item Table" at left; at right two blue links, "⧉ Scan Item" and "✓ Bulk Actions". The Bulk Actions menu offers Bulk Update Line Items and Show All Additional Information. — [Demo #/invoices/new](https://www.zoho.com/us/books/accounting-software-demo/#/invoices/new) (`new_invoice_bulk_actions.png`)
- Columns:
  - a ⋮⋮ drag handle outside the left edge (each row has `draggable="true"`);
  - ITEM DETAILS (textarea "Type or click to select an item.");
  - QUANTITY (1.00);
  - RATE (0.00, with a small calculator-style icon in the header);
  - DISCOUNT (value plus a "% ▾" unit toggle);
  - TAX ⓘ ("Select a Tax ▾"; groups Non-Taxable / Taxes / Tax Group, e.g. "CA STATE TAX [6%]", "CA GROUP TAX [7.25%]");
  - AMOUNT.
  - After a customer is chosen, an extra "COVERED BY CWT?" column appeared.
  - — [Demo #/invoices/new](https://www.zoho.com/us/books/accounting-software-demo/#/invoices/new) (`new_invoice_tax.png`)
- Below the table: "⊕ Add New Row ▾" (split) and "⊕ Add Items in Bulk". With a customer chosen, links to pull in existing work appear: "Include 2 Confirmed Sales Orders", "Include 2 Open Delivery Challans", and "Include Unbilled Items: 3 unbilled expenses, 3 unbilled projects". — [Demo #/invoices/new](https://www.zoho.com/us/books/accounting-software-demo/#/invoices/new)

**Totals and notes**
- Totals block: 509px wide, at right; background #f9f9fb; radius 10px; padding 10px 5px. Rows:
  - Sub Total;
  - Shipping Charges [input] (?);
  - [Adjustment] (an editable label box) [input] (?);
  - Round Off;
  - a divider, then "Total ( $ )" in large bold.
  - — [Demo #/invoices/new](https://www.zoho.com/us/books/accounting-software-demo/#/invoices/new)
- Left of the totals: "Customer Notes" textarea, prefilled "Thanks for your business.", with the helper "Will be displayed on the invoice". — [Demo #/invoices/new](https://www.zoho.com/us/books/accounting-software-demo/#/invoices/new)
- Lower band (full width, background #f9f9fb, padding 20px 20px 0):
  - "Terms & Conditions" textarea (placeholder "Enter the terms and conditions of your business to be displayed in your transaction");
  - a vertical divider, then "Attach File(s) to Invoice" with a "⤒ Upload File ▾" split and "You can upload a maximum of 10 files, 10MB each";
  - "Want to get paid faster?" with card-brand logos and "Set up Payment Gateway";
  - with a customer chosen, also "☐ I have received the payment" and "Email Communications ⊕ Add New — No contact persons found.";
  - "Additional Fields: Start adding custom fields for your invoices by going to Settings ➡ Sales ➡ Invoices."
  - — [Demo #/invoices/new](https://www.zoho.com/us/books/accounting-software-demo/#/invoices/new)

**Sticky footer**
- Footer: `fixed-actions-bottom`, 67px tall, `box-shadow: 0 -4px 5px -3px rgba(0,0,0,.1)`.
  - Left: "Save as Draft" (secondary: #f5f5f5, 1px #ddd border, 33px tall); "Save and Send" (primary) with an attached ▴ caret; "Cancel".
  - The caret menu: Save and Print · Save and Share · Save and Send Later.
  - Right: "⟳ Make Recurring" link, a divider, then "Total Amount: $ 0.000" with "Total Quantity: 0" beneath.
  - — [Demo #/invoices/new](https://www.zoho.com/us/books/accounting-software-demo/#/invoices/new) (`new_invoice_save_split.png`)
- **Validation:** clicking "Save as Draft" on the empty form saved nothing. A red alert box appeared at the top of the form: `alert alert-danger`, background rgb(254,237,238), radius 8px, padding 13px, listing "Select a customer." and "Enter the valid item name or description." — [Demo #/invoices/new](https://www.zoho.com/us/books/accounting-software-demo/#/invoices/new) (`toast_validation.png`)

**Modal anatomy ("Configure Invoice Number Preferences", opened from the ⚙ in Invoice#)**
- Placement: attached to the top of the viewport (y = 0), not vertically centered; 600px wide.
  - Backdrop: rgb(25,28,41) at opacity 0.7.
  - Content: radius 0 0 8px 8px; no shadow.
  - — [Demo #/invoices/new](https://www.zoho.com/us/books/accounting-software-demo/#/invoices/new) (`modal_configure_invoice_number.png`)
- Header: 52px; background #f9f9fb; padding 12px 20px; title 16.9px / 400 / #212529; a red ✕ at right. — [Demo #/invoices/new](https://www.zoho.com/us/books/accounting-software-demo/#/invoices/new)
- Body, top to bottom:
  - a bold "Associated Series" heading with the value "Default Transaction Series";
  - a rule;
  - the copy "Your invoice numbers are set on auto-generate mode to save your time. Are you sure about changing this setting?";
  - radio "Continue auto-generating invoice numbers ⓘ" (checked; 14px, filled #408dfb), with Prefix ("Inv-") and Next Number ("0000") inputs beneath;
  - radio "Enter invoice numbers manually".
  - — [Demo #/invoices/new](https://www.zoho.com/us/books/accounting-software-demo/#/invoices/new)
- Footer: border-top 1px #eeeeee; padding 20px; left-aligned [Save] (primary) [Cancel] (secondary). — [Demo #/invoices/new](https://www.zoho.com/us/books/accounting-software-demo/#/invoices/new)
- Modal width tokens: `--zf-modal-sm: 500px`, `--zf-modal-md: 700px`, `--zf-modal-lg: 840px`, `--zf-modal-xlg: 1030px`. The observed modals were Customize Columns 500, Share and Configure 600, Keyboard Shortcuts 840, and Advanced Search 1030. — [Demo #/invoices](https://www.zoho.com/us/books/accounting-software-demo/#/invoices)

**Comparison with earlier notes**
- Confirmed:
  - a single-column label-left grid with red required labels;
  - the customer selector in a grey band;
  - the auto-number ⚙;
  - the line-item table with a drag handle;
  - "+ Add New Row / + Add Items in Bulk" (wording now "Add New Row", not "Add another line");
  - right totals;
  - the grey lower band;
  - the sticky footer;
  - modals with a grey header and left-aligned footer buttons.
- Updated:
  - The Save and Send split also offers Save and Print and Save and Share.
  - The measured required-label red is #d6141d (not #e54543).
  - Inputs are 34px tall.
  - The footer carries "Make Recurring" and live totals.

### Inferences
- The dashed border on Due Date marks a value computed from Terms (derived field). This is inference from styling only.

### Gaps
- The inline "New Customer" modal was not opened. "⊕ New Customer" in the picker likely opens a large form; it was not clicked, to stay within the no-save constraint.
- Row-level controls on a filled line item (row ••• menu, remove ✕) were not captured, because no item was added.

## Visual tokens (computed CSS from the live demo)

### Takeaway
The app renders in **Inter** at a 13px base with 1.6 line-height (20.8px). Bootstrap 5's variable system has been re-prefixed `--zf-*`. The palette:
- dark navy chrome (#21263c) with a 48px top band;
- a lavender-white sidebar (#f7f7fe) 220px wide expanded and 72px collapsed;
- one accent blue (#408dfb) for primary buttons, active nav, menu highlights, focus rings and checked controls;
- a darker link blue (#1c5bd9);
- cool greys (#f9f9fb surfaces, #ebeaf2 / #d7d5e2 borders, #6c718a secondary text).

Radii are mostly 6px; cards use 10–12px. Dropdowns cast one soft lavender shadow, `0 7px 12px #d7d5e2`.

### Cited Findings
**Typography**
- Computed `font-family` on every inspected element is `Inter, "Source Sans Pro", Helvetica, Arial, sans-serif`.
  - Inter regular, medium and semibold load from `static.zohocdn.com/webfonts/inter*/font_latin.woff2`. A stylesheet from `webfonts.zoho.com` also requests Inter 400–700, Source Sans Pro and Open Sans.
  - The CSS variable `--zf-body-font-family` still declares `"ZohoPuvi", "Source Sans Pro", …`, and Zoho_Puvi_Regular.woff2 is also downloaded. The computed body font is nevertheless Inter.
  - — [Demo #/invoices](https://www.zoho.com/us/books/accounting-software-demo/#/invoices)
- Base text is 13px, line-height 20.8px, color #000. `--zf-font-size-base` is 14px, but the rendered base is 13px. — [Demo #/invoices](https://www.zoho.com/us/books/accounting-software-demo/#/invoices)
- Size utilities found in the CSS: `.font-xxs` 11px, `.font-xs` 12px, `.font-small` 13px, `.font-normal` 14px, `.font-medium` 15px, `.font-large` 16px, `.font-xlarge` 18px, `.font-xxlarge` 22px. — [Demo #/invoices](https://www.zoho.com/us/books/accounting-software-demo/#/invoices)
- Measured headings and text styles:

| Element | Size / weight / color |
|---|---|
| List title | 18px / 600 / #212529 |
| Detail title | 18px / 600 |
| Form title (h3) | 22.1px / 400 |
| Modal title (h4) | 16.9px / 400 |
| Dashboard card header | 16px / 500 / #222536 |
| Table header | 11px / 600 / uppercase |
| Section label "PAYMENT SUMMARY" | 12px / 500 / uppercase |
| Status | 12px / 400 / uppercase |
| Tooltip | 12px |

  — [Demo #/invoices](https://www.zoho.com/us/books/accounting-software-demo/#/invoices); [Demo #/invoices/new](https://www.zoho.com/us/books/accounting-software-demo/#/invoices/new); [Demo #/home/dashboard](https://www.zoho.com/us/books/accounting-software-demo/#/home/dashboard)

**Shell dimensions and colors**
- **Top band** (`header#top-band`): 48px tall (`--zf-topband-height: 48px`); background #21263c (`--topband-bg`); bottom border 1px #181c2e; text #f0f0f0. — [Demo #/invoices](https://www.zoho.com/us/books/accounting-software-demo/#/invoices)
- **Global search box:** 300x36; background #333850 (`--search-bg`); border 1px #6c718a; radius 8px. — [Demo #/invoices](https://www.zoho.com/us/books/accounting-software-demo/#/invoices)
- **Sidebar** (`nav`):
  - 220px expanded, 72px collapsed; background #f7f7fe (`--sidebar-bg`).
  - Items are 200x30: radius 6px, padding 5px, 13px #181c2e text, icons #4c526c.
  - The active item has background #408dfb and white text. Active sub-items are indented with padding-left 40px and show a white "+" at right.
  - Hover/expanded-group fill is #eaeafb (`--hover-bg`).
  - The collapse button is 39x39 at bottom-right.
  - — [Demo #/invoices](https://www.zoho.com/us/books/accounting-software-demo/#/invoices) (`shell_sidebar_collapsed.png`)
- **Content area:** 1177px wide at 1440 (x 220 → 1397). The right widget rail takes about 43px. — [Demo #/invoices](https://www.zoho.com/us/books/accounting-software-demo/#/invoices)
- **Demo-only banner** (not part of the product): 51px tall; background #fcffec; red "Sign Up Now" button. — [Demo #/invoices](https://www.zoho.com/us/books/accounting-software-demo/#/invoices)

**Accent, links and buttons**
- `<html>` carries an inline `--primary-color: #408dfb`, overriding the stylesheet's `#0080fe`. `--unifiedtheme-blue: #408dfb`, `--unifiedtheme-red: #f7525a`, `--unifiedtheme-green: #22b378`, `--unifiedtheme-yellow: #fd9134`. — [Demo #/invoices](https://www.zoho.com/us/books/accounting-software-demo/#/invoices)
- Links compute to #1c5bd9 (`--zf-link-color: var(--zf-color-blue-1400)`; hover blue-1600 #1a4291). Some inline links use `text-dodgerblue` #2098ff. — [Demo #/invoices](https://www.zoho.com/us/books/accounting-software-demo/#/invoices)
- Primary button:
  - background and border #408dfb, white 13px text;
  - padding 4.875px 9.75px; radius 4.875px; height 33px;
  - small variant: 27px tall, 11.4px text, radius 6px.
  - The base `.btn-primary` rule still defines `--zf-btn-bg: #d64830`, a red that is overridden to the accent at runtime.
  - — [Demo #/invoices](https://www.zoho.com/us/books/accounting-software-demo/#/invoices)
- Secondary button: background #f5f5f5, border 1px #dddddd, black text, radius 4.875px, height 33px. — [Demo #/invoices](https://www.zoho.com/us/books/accounting-software-demo/#/invoices)

**Inputs and controls**
- Form tokens:
  - `--zf-form-input-height: 34px`; `--zf-form-input-padding: 5px 10px`;
  - `--zf-form-input-border-color: #d7d5e2`; `--zf-form-input-border-radius: 6px`;
  - `--zf-form-input-focus-border-color: #288cf2`; `--zf-form-input-invalid-border-color: #ef5656`; `--zf-form-input-placeholder-color: #9194a1`.
  - Computed focus is border #408dfb with a 3px ring rgba(64,141,251,.16).
  - — [Demo #/invoices/new](https://www.zoho.com/us/books/accounting-software-demo/#/invoices/new)
- Checkbox: 14x14, radius 3px, border rgba(0,0,0,.25). Radio: 14x14; when checked, filled #408dfb. — [Demo #/invoices](https://www.zoho.com/us/books/accounting-software-demo/#/invoices)

**Tables**
- Header background #f9f9fb; header text #6c718a. Row hover #f6f6fa (inset shadow); row selected #f1f1fa. Row height 51px.
- Table tokens: `--zf-table-row-hover-bg-color: #f9f9fb`, `--zf-table-row-selected-bg-color: #f4f4f9`, `--zf-table-border-color: #ebedf6`, `--zf-table-header-font-size: 11px`, `--zf-status-column-font-size: 12px`, `--zf-status-column-text-transform: uppercase`.
- The computed hover and selected colors differ slightly from the tokens, which indicates later overrides.
- — [Demo #/invoices](https://www.zoho.com/us/books/accounting-software-demo/#/invoices)

**Cards and surfaces**
- Payment Summary: #f9f9fb, border #ebeaf2, radius 10px. — [Demo #/invoices](https://www.zoho.com/us/books/accounting-software-demo/#/invoices)
- Dashboard card: white, border 1px #e9eaf5, radius 12px, a faint shadow; header background #f7f8fc, 48px tall. — [Demo #/home/dashboard](https://www.zoho.com/us/books/accounting-software-demo/#/home/dashboard) (`home_dashboard.png`)
- Detail toolbar background #f7f8fc. Paper border #e9eaf5. `--zf-details-container-shadow: 0 5px 10px #2b3f5f14`. — [Demo #/invoices/2](https://www.zoho.com/us/books/accounting-software-demo/#/invoices/2)
- Radius utilities:

| Class | Radius |
|---|---|
| `rounded-xxs` | 2px |
| `rounded-xs` | 4px |
| `rounded-sm` | 0.2rem |
| `rounded-md` | 6px |
| `rounded-lg` | 0.3rem |
| `rounded-xlg` | 10px |
| `rounded-xxlg` | 15px |
| `rounded-corners` | 16px |
| `rounded-xxxlg` | 24px |
| pill | 10rem |

  — [Demo #/invoices](https://www.zoho.com/us/books/accounting-software-demo/#/invoices)

**Status and ribbon colors**
- List status text: see the table in the list section (draft #879697, open #408dfb, overdue #f76831, paid / partially paid / accepted / closed #22b378, pending #eb6100, approved #31708f, void #777777, rejected / danger #f7525a). — [Demo #/invoices](https://www.zoho.com/us/books/accounting-software-demo/#/invoices)
- Classes `text-sent`, `text-unpaid`, `text-viewed`, `text-invoiced`, `text-declined`, `text-expired` and `text-partially-paid` did not resolve to a color (they compute to inherited black). In the lists, Sent quotes rendered blue (`text-open`), Partially Paid used `text-success`, and Invoiced quotes rendered green. — [Demo #/quotes](https://www.zoho.com/us/books/accounting-software-demo/#/quotes)
- Ribbons:

| Class | Color |
|---|---|
| `ribbon-success` | #1fcd6d |
| `ribbon-draft` | #94a5a6 |
| `ribbon-open` | #268ddd |
| `ribbon-overdue` | #f59d00 |
| `ribbon-pending` | #f59d00 |
| `ribbon-void` | #474747 |

  — [Demo #/invoices/2](https://www.zoho.com/us/books/accounting-software-demo/#/invoices/2)
- Bootstrap semantic RGB tokens: `--zf-success-rgb: 34,179,120`, `--zf-danger-rgb: 247,82,90`, `--zf-warning-rgb: 253,145,52`, `--zf-info-rgb: 64,141,251`. — [Demo #/invoices](https://www.zoho.com/us/books/accounting-software-demo/#/invoices)

**Shadows**
- Dropdown menus: `0 7px 12px 0 #d7d5e2`, border 1px #ebeaf2, radius 6px, padding 4px.
- Popover: `0 2px 4px rgba(141,141,141,.2)`.
- Flyouts: `-2px 5px 10px 1px rgba(0,0,0,.176)`.
- Right widget panel: `0 4px 3px #e1e6fb`.
- Detail toolbar: `0 2px 4px rgba(33,38,60,.03)`.
- Sticky footer: `0 -4px 5px -3px rgba(0,0,0,.1)`.
- Modals: no shadow; backdrop #191c29 at 0.7.
- `--nav-dropdown-box-shadow: 0px 6px 18px 0px #21263c1f`.
- — [Demo #/invoices](https://www.zoho.com/us/books/accounting-software-demo/#/invoices); [Demo #/invoices/new](https://www.zoho.com/us/books/accounting-software-demo/#/invoices/new)

**Palette tokens**
- The stylesheets define a full ramp `--zf-color-{cyan,skyblue,purple,blue,orange,yellow,green,red,grey}-{100…2200}` (9 families × 22 steps), a second 11-step ramp `--zf-{family}-{100…1100}`, and chart colors:
  - `--zf-chart-blue-color` #64abfd;
  - `--zf-chart-green-color` #61c691;
  - `--zf-chart-orange-color` #ef9d65;
  - `--zf-bar-chart-color` #3198ff;
  - pie colors #1b6de0 / #1fc281 / #f9b21d / #9858b8 / #ff7a1a.
  - — [Demo #/invoices](https://www.zoho.com/us/books/accounting-software-demo/#/invoices)

**Comparison with earlier notes**
- Confirmed:
  - top band #21263c and accent #408dfb (exact);
  - sidebar about #f7f7ff (measured #f7f7fe);
  - secondary text about #6c7184 (measured #6c718a; `--lhs-customize-muted-text` is exactly #6c7184);
  - the overdue orange family (measured #f76831 vs #f86a34);
  - the Inter-like font (now confirmed as Inter).
- Corrected:
  - table header background is #f9f9fb, not #f6f6fa (that value is the hover tint);
  - required red is #d6141d in forms;
  - buttons are 33px, not about 30px;
  - list rows are 51px.
- The earlier statement that the sign-in page uses ZohoPuvi stands; the app itself computes Inter.

### Inferences
- The `--zf-*` re-prefixing of Bootstrap 5 variables, plus the leftover red `--zf-btn-bg: #d64830` and `--zf-primary-rgb: 214,72,48`, suggests the theme engine builds on a Bootstrap 5 base. The user-chosen accent (default Blue #408dfb) is injected at runtime via `--primary-color` and accent overrides. This is consistent with the Gen-1 red default theme described in the earlier notes. This is inference.
- The 0.32px letter-spacing seen everywhere is the demo's accessibility "text spacing" setting, not a default token. The demo shows the stock letter-spacing as `normal` once the class is removed.

### Gaps
- No dark-mode or alternative accent theme was inspected; the demo opens with `light-mode="true"`.
- No hover-state colors were measured for primary buttons. CSS shows `.btn-primary:hover` has `box-shadow: none`, but the hover background was not computed.

## Front-end technology (evidence and implications)

### Takeaway
The demo is an **Ember.js 3.28.10** single-page app (application namespace "zb"). It is built with **Embroider/webpack** route-split chunks and uses jQuery 2.1.0, moment 2.24.0, a large set of private `@zoho/ember-*` addons, `ember-svg-jar` icons and Bootstrap-5-style CSS. No Lyte framework, custom elements, React or Vue were found.

### Cited Findings
**Globals**
- `window.Ember.VERSION` = "3.28.10" (`Em` is the same object). `Ember.Namespace.NAMESPACES` = ["zb"]. — [Demo #/invoices](https://www.zoho.com/us/books/accounting-software-demo/#/invoices)
- `window.jQuery.fn.jquery` = "2.1.0"; `window.moment.version` = "2.24.0".
- Also present: `require`, `requirejs` and `define` (the Ember loader), `daterangepicker`, `NProgress`, `Mousetrap`, `interact` (interact.js), `md5`, jsbn RSA/BigInteger helpers (`RSAKey`, `BigInteger`), `zi18n`, `ZB_META`, `ORG_ID`, `ZUnifyImpl.UnifiedNavigation`, `ZApp`, `ZWidgetRuntime`, `$zoho`, `WmsliteImpl`, `webpackChunkzb` and `_embroiderRouteBundles_`.
- Absent: `window.Lyte`, `window.$L`, `React`, `Vue`, `angular`, `Highcharts`, `d3`, `Chart`, `Popper`, `DS` (Ember Data).
- — [Demo #/invoices](https://www.zoho.com/us/books/accounting-software-demo/#/invoices)
- `window.EmberENV`: `{"_JQUERY_INTEGRATION":true,"_TEMPLATE_ONLY_GLIMMER_COMPONENTS":true,"_DEFAULT_ASYNC_OBSERVERS":false,"EXTEND_PROTOTYPES":{"Date":false}}`. — [Demo #/invoices](https://www.zoho.com/us/books/accounting-software-demo/#/invoices)

**Module registry** (`requirejs.entries`)
- 23,474 modules: 17,924 under `zb/`, 4,923 under `ember-svg-jar`, and 6,963 component modules overall. — [Demo #/invoices](https://www.zoho.com/us/books/accounting-software-demo/#/invoices)
- Public addons: `ember-concurrency`, `ember-cli-mirage` (46 modules), `ember-in-viewport`, `ember-modifier`, `ember-resolver`, `ember-arg-types`, `ember-key-navigation`, `ember-cli-clipboard`, `@glimmer/component`, `@glimmer/tracking`, `@ember/legacy-built-in-components`, `@embroider/macros`. — [Demo #/invoices](https://www.zoho.com/us/books/accounting-software-demo/#/invoices)
- Private Zoho addons:
  - controls and inputs: `@zoho/ember-dropdown`, `ember-auto-complete`, `ember-multi-autocomplete`, `ember-type-ahead`, `ember-multiselect-checkbox`, `ember-radiogroup`, `ember-color-picker`, `ember-icon-button`, `ember-inline-edit`;
  - date pickers: `ember-datepicker`, `ember-daterangepicker`;
  - overlays and messages: `ember-tooltip-popover`, `ember-notification` (`notification-region`, `notification-message`), `zf-ember-notification`;
  - editors and comments: `ember-rich-comments`, `ember-html-editor`, `zf-ember-html-editor`, `ember-email-editor`;
  - layout and interaction: `ember-accordion`, `ember-draggable`, `ember-gridstack`, `ember-product-tour`;
  - accessibility: `ember-accessibility-preferences`, `ember-focus-trap`;
  - other: `zf-ember-charts`, `ember-model-library`, `ember-bundle-i18n`, `ember-blueprint-transitions`, `zf-products-menu`, `ember-zohoone-launcher`, `storefront-site-builder`.
  - — [Demo #/invoices](https://www.zoho.com/us/books/accounting-software-demo/#/invoices)

**DOM conventions**
- No custom elements: zero tag names containing "-".
- Ember classic markers:
  - 176 `.ember-view` elements with `id="emberNNN"`;
  - `data-ember-action` attributes;
  - `ember-checkbox` and `ember-text-field` inputs.
- Many elements use UUID ids, e.g. dropdown roots `dd-<uuid>`.
- `<body class="ember-application">`; `<html light-mode="true" lang="{{LANG_CODE}}">`. The language placeholder is left unrendered in the demo build.
- ARIA is widely used: `aria-haspopup`, `aria-expanded`, `aria-sort`, `role="combobox"`, and `aria-roledescription="Sortable Header"`.
- — [Demo #/invoices](https://www.zoho.com/us/books/accounting-software-demo/#/invoices)

**CSS conventions**
- Bootstrap 5 class names: `d-flex`, `align-items-center`, `ms-3` / `me-2` (logical spacing), `text-end`, `float-end`, `rounded-end-0`, `visually-hidden`, `btn btn-primary`, `dropdown-menu show`, `modal fade show`, `nav-tabs`.
- Bootstrap 5 component variables appear with a `--zf-` prefix (`--zf-btn-bg`, `--zf-dropdown-*`, `--zf-backdrop-*`, `--zf-popover-*`).
- App-specific classes: `zi-table`, `details-menu-bar`, `flyout flyout-sm`, `fixed-actions-bottom`, `list-status-column`, `text-<status>`, `ribbon-inner ribbon-<status>`, `lhs-accordion`, `rhs-sidebar`.
- — [Demo #/invoices](https://www.zoho.com/us/books/accounting-software-demo/#/invoices)

**Asset hosts and files**
- App assets: `www.zoho.com/books/accounting-software-demo/assets/`, as fingerprinted files:
  - CSS: `vendor-*.css`, `zb-*.css`, `chunk-*.css`;
  - JS: `vendor.*.js`, about 20 `zb.*.js` chunks, `models.*.js`, `svgs/books|erp|common.*.js`, `i18n/MessageResources_en-*.js`, `js/ZFramework-*.js`.
- Fonts from `static.zohocdn.com` and `webfonts.zoho.com`.
- Third-party embeds: Zoho SalesIQ chat widget (`salesiq.zohocorppublic.in`), Quartz feedback (`static.zohocdn.com/quartz`), and a Cloudflare challenge script.
- An unrendered script URL `%7B%7BZOHO_APPS_MENU_URL%7D%7D` is requested.
- — [Demo](https://www.zoho.com/us/books/accounting-software-demo/#/home/gettingstarted)
- The invoice preview uses an open Shadow DOM (`#template-html-shadow-host`) to isolate template CSS. — [Demo #/invoices/2](https://www.zoho.com/us/books/accounting-software-demo/#/invoices/2)

### Inferences
- Zoho Books' web client is an Ember (Octane-era 3.28) app mixing classic components with Glimmer components and tracked properties. It ships via Embroider with per-route bundles. Zoho's in-house Lyte framework (used in Zoho CRM) is not used here. This is supported directly by the globals and module registry; that the production app at books.zoho.com uses the same build is inference.
- `ember-cli-mirage` in the bundle, together with lorem-ipsum data regenerated per load, suggests the public demo runs against a Mirage mock API rather than a real backend. That would also explain why contact detail pages do not render. This is inference.
- The visible "Date" picker markup (`.datepicker.datepicker-dropdown`, `th.dow`, `td.day.old`) matches bootstrap-datepicker conventions wrapped by `@zoho/ember-datepicker`. This is inference from class names.

### Gaps
- Exact versions of the private `@zoho/*` addons are not exposed.
- Whether production books.zoho.com runs the identical bundle could not be verified without logging in.

## Other components observed (shell, menus, overlays, pickers, help, keyboard, widgets, phone width)

### Takeaway
All transient UI shares one dropdown language:
- white surface, 1px #ebeaf2 border, 6px radius, 4px inner padding;
- lavender shadow `0 7px 12px #d7d5e2`;
- 35px items with 6px-radius blue hover fill;
- uppercase grey group headers.

Side panels (Comments, Notifications, Profile) are 400px right flyouts. Help and widgets live in a 360px right-rail pane. Modals attach to the top edge. Tooltips are navy pills. There is no responsive layout below desktop width.

### Cited Findings
**Top band and its menus**
- Top band, left to right:
  - logo "Books";
  - a recent-activity clock;
  - search, with a module-scope ▾ and placeholder "Search in Invoices ( / )";
  - right side: "This is a **Test** organization.", the org link "Demo Org", a divider, a blue "+" quick-create, a people/referral icon, a bell, a gear, the avatar, and a 3x3 app grid.
  - — [Demo #/invoices](https://www.zoho.com/us/books/accounting-software-demo/#/invoices)
- **Quick create:** a 1036px five-column mega-menu with uppercase group headers (`shell_quick_create.png`):
  - GENERAL: Add User, Item, Journal Entry, Log Time, Weekly Log;
  - INVENTORY: Inventory Adjustments;
  - SALES: Customer, Quotes, Invoices, Recurring Invoice, Retainer Invoices, Sales Order, Customer Payment, Credit Notes;
  - PURCHASES: Vendor, Expenses, Recurring Expense, Bill, Recurring Bill, Purchase Order, Vendor Payment, Vendor Credit;
  - BANKING: Bank Transfer, Card Payment, Owner Drawings, Other Income.
  - Each item has a ⊕ icon.
  - — [Demo #/invoices](https://www.zoho.com/us/books/accounting-software-demo/#/invoices)
- **Search scope dropdown** (335px; `shell_search_scope.png`):
  - modules: Customers, Items, Price Lists, Banking, Transaction Rules, Quotes, Retainer Invoices, Sales Orders, Invoices, Credit Notes, Vendors, Expenses, Purchase Orders, Bills, Payments Made, Recurring Bills, Vendor Credits, Projects, Timesheet, Bill of Materials, Manufacturing Orders, Job Cards, Shopfloor, Documents, Tasks;
  - footer: "Advanced Search Alt + /" and "Search across Zoho Cmd + /".
  - — [Demo #/invoices](https://www.zoho.com/us/books/accounting-software-demo/#/invoices)
- **Advanced Search modal** (1030px, top-attached; `invoices_advanced_search.png`, `shell_advanced_search_modal.png`):
  - header row: "Search [Invoices ▾]" and "Filter [All ▾]";
  - a two-column grid with right-aligned labels: Invoice#, Order Number, Date Range (two dd MMM yyyy inputs), Created Between, Status, Item Name, Item Description, Account, Total Range, Customer Name, Project Name, Salesperson, Tax, and Address (radio Billing and Shipping / Billing / Shipping, plus an "Attention ▾" input and "+ Address Line");
  - centered footer [Search] [Cancel].
  - Opened from the table's trailing magnifier column or the scope menu.
  - — [Demo #/invoices](https://www.zoho.com/us/books/accounting-software-demo/#/invoices)
- **Recent Activities dropdown** (300x400): "RECENT ACTIVITIES", the empty-state copy "Your activities in Zoho Books will show up here! Create your first transaction to get started with Zoho Books.", and links Create Invoice / Create Bill / Create Expense. — [Demo #/invoices](https://www.zoho.com/us/books/accounting-software-demo/#/invoices) (`shell_recent_activities.png`)
- **Notifications flyout** (400px): title "Notifications", tabs "All | Mentions", empty text "Uhh... There are no notifications at the moment." — [Demo #/invoices](https://www.zoho.com/us/books/accounting-software-demo/#/invoices) (`shell_notifications.png`)
- **Profile flyout** (400px), top to bottom:
  - user name and email;
  - "User ID • Organization ID";
  - My Account | Sign Out;
  - help links: Help Documents, FAQs, Forum, Video Tutorials, Explore Features, Migration Guide;
  - Accessibility Preferences;
  - a "Need Assistance?" section with email, screen recording, webinars, find an accountant, and a toll-free number;
  - "What's New?";
  - "Navigate faster with keyboard shortcuts".
  - — [Demo #/invoices](https://www.zoho.com/us/books/accounting-software-demo/#/invoices) (`shell_profile.png`)

**Tooltips and keyboard shortcuts**
- **Tooltips:** `popper tooltip` styled as a navy pill: background #21263c, white 12px/16.8px text, radius 6px, padding 6.5px 10.4px. Examples: "Recent Activities", "Notifications", "More Actions", "Instant Helper". — [Demo #/invoices](https://www.zoho.com/us/books/accounting-software-demo/#/invoices) (`shell_tooltip.png`)
- **Keyboard Shortcuts** (Shift+?): an 840px top-attached modal (`shell_keyboard_shortcuts.png`).
  - Header: "Keyboard Shortcuts", a blue "Enabled" toggle, a "⟲ Reset" link, ✕.
  - A pale-yellow tip bar: "Change shortcuts for your favorite actions and personalize your Zoho Books experience."
  - Grouped cards with uppercase headers and bordered keycaps:
    - GO TO ACTIONS: Shift+I Invoices, Shift+J Journal, Shift+E Quotes, Shift+N Credit Notes, Shift+B Bills, Shift+X Expenses, Shift+P Purchase Orders, Shift+S Sales Orders, Shift+1 Dashboard, Shift+2 Items, Shift+3 Banking, Shift+4 Customers, Shift+5 Vendors, Shift+6 Reports, Shift+7 Documents, Shift+R Payments Received, Shift+M Payments Made;
    - GENERAL: Shift+/ Shortcuts, Alt+/ Advanced Search, S Settings, O Organizations, Window+/ Zia search, Alt+0 Navigate To, / Search;
    - SAVE ACTIONS: R T Save and Print, Alt+S Save and Send;
    - MODULE LEVEL ACTIONS: N new, Alt+M email, Alt+D download, Alt+I import, Alt+E export, Alt+A select all;
    - CREATION ACTIONS: C then I / J / E / N / B / X / P / S / T / 4 / 5;
    - TRANSACTION LEVEL ACTIONS: E edit, M email, P print, D download.
  - — [Demo #/invoices](https://www.zoho.com/us/books/accounting-software-demo/#/invoices)

**Pickers and dropdowns**
- **Date picker:** 256x294 popup; border 1px rgba(0,0,0,.15); radius 2px; the dropdown shadow.
  - Header: "« November 2026 »".
  - Weekday headers are 10px red #e54643. Days are 13px / 500 / #6c718a; other-month days #999.
  - Today/selected is a solid square rgb(185,58,37) #b93a25 with white text and a #922e1d border. This is a red-orange, not the blue accent.
  - — [Demo #/invoices/new](https://www.zoho.com/us/books/accounting-software-demo/#/invoices/new) (`new_invoice_datepicker.png`)
- **Dropdown with search:**
  - the view switcher, customer picker and Customize Columns all put a search input on top;
  - items are 35px tall, padding 7px 10px, radius 6px, color #333850;
  - hover/active is #408dfb with white text;
  - menu max-height 400px; the menu container text color is #6c718a.
  - — [Demo #/invoices](https://www.zoho.com/us/books/accounting-software-demo/#/invoices)

**Messages and empty states**
- **Toasts:** none observed. The addon modules `@zoho/ember-notification/components/notification-region` and `notification-message` exist. The only message seen was the inline red validation alert in the form. — [Demo #/invoices/new](https://www.zoho.com/us/books/accounting-software-demo/#/invoices/new)
- **Empty states seen in panels:**
  - Comments: "No comments yet."
  - Quote Activity: "No history found."
  - Notifications: "Uhh... There are no notifications at the moment."
  - Webinars: "There are no webinars from Zoho Books at the moment…"
  - Widgets: "You're yet to install an extension that can be used from the Widgets pane… Go to Zoho Marketplace"
  - — [Demo #/invoices](https://www.zoho.com/us/books/accounting-software-demo/#/invoices)

**Right-hand widgets pane**
- A rail of about 43px at the far right (x ≥ 1397) with icon buttons:
  - Instant Helper (orange "?");
  - Announcements;
  - Webinars;
  - a dotted divider;
  - Zoho Notebook;
  - All Sidebar Widgets;
  - a round "›" expand button at the bottom.
  - — [Demo #/invoices](https://www.zoho.com/us/books/accounting-software-demo/#/invoices) (`rhs_widget_0.png`–`rhs_widget_4.png`)
- Each icon opens a 360px pane (`rhs-sidebar-opened`, shadow `0 4px 3px #e1e6fb`) with a pin icon at top-left. The pane narrows the content and does not overlay it. Contents:
  - **Instant Helper:** a "Search Help…" box; a context header "☰ Invoices"; a video card "Learn how to create your first invoice 4:12"; "Frequently Asked Questions" with chevron rows; "Show More ▾"; "Help Documents".
  - **Announcements:** "This tab is your one-stop hub to keep track of our latest events, webinars, and important updates."
  - **Webinars:** empty state plus "View All Webinars".
  - **Zoho Notebook:** an install card.
  - **All Sidebar Widgets:** an empty state plus "Featured Extensions".
  - — [Demo #/invoices](https://www.zoho.com/us/books/accounting-software-demo/#/invoices)

**Sidebar (expanded and collapsed)**
- **Expanded** (`invoices_list.png`), top to bottom:
  - Home;
  - Items ›;
  - Sales ▾, with Customers, Quotes, Retainer Invoices, Sales Orders, Invoices, Recurring Invoices, Payments Received, Credit Notes;
  - Purchases ›; Time Tracking ›;
  - Banking;
  - Filing & Compliance ›; Accountant ›;
  - Reports; Documents;
  - then a lavender "Configure Features ›" button;
  - a "Webinar Alert!" promo card;
  - the collapse "⇤" button.
  - — [Demo #/invoices](https://www.zoho.com/us/books/accounting-software-demo/#/invoices)
- **Collapsed** (72px; `shell_sidebar_collapsed.png`):
  - icons with tiny labels below them, ellipsized ("Purchas…", "Complia…", "Docume…");
  - modules with children show a small corner triangle;
  - the active module (Sales) gets a lavender tile;
  - the collapse button becomes "⇥" at the bottom;
  - the top band's logo block shrinks to the icon only.
  - — [Demo #/invoices](https://www.zoho.com/us/books/accounting-software-demo/#/invoices)

**Phone width (390x844)**
- The page has no `<meta name="viewport">`. — [Demo #/invoices](https://www.zoho.com/us/books/accounting-software-demo/#/invoices) (`phone_invoices_list.png`)
- At 390px:
  - The sidebar automatically renders collapsed (72px, `tab-column-collapsed`), and the 43px right rail remains. That leaves a 275px content column.
  - The top band keeps its desktop items and clips them; the org text wraps.
  - The page does not scroll horizontally (scrollWidth 390). Instead the invoice table's columns are crushed to about one character wide, so text wraps letter by letter.
  - Opening an invoice shows the detail pane full-width with the list pane hidden. The toolbar is clipped after "Share", and the What's Next copy wraps into a narrow column (`phone_invoice_detail.png`).
  - — [Demo #/invoices](https://www.zoho.com/us/books/accounting-software-demo/#/invoices)

**Comparison with earlier notes**
- Confirmed:
  - dropdowns with uppercase group headers, a blue-filled highlight row and a search box at top;
  - the Shift+? shortcut overlay with user-editable bindings (Enabled toggle and Reset);
  - the right-side widgets pane;
  - modals with a grey header and left-aligned footer (except Advanced Search, whose footer is centered);
  - no responsive mobile layout (consistent with Zoho steering phone users to native apps).
- New detail:
  - the red-orange date-picker selection;
  - navy tooltips;
  - 400px flyouts for Comments, Notifications and Profile;
  - the Instant Helper contents;
  - automatic sidebar collapse at narrow widths.

### Inferences
- The date picker's red selected-day color (#b93a25) and red weekday headers look like a holdover from the Gen-1 red theme. They are not tied to the blue accent. This is inference.

### Gaps
- No toast/snackbar was triggered: every action that would produce one also saves or changes data.
- Regional demos (/in/, /uk/, /ae/) were not rendered in this pass, so edition-specific fields (e.g. GST, VAT) were not compared.
- The Customer Overview tabs and the "New Customer" form remain unobserved.
