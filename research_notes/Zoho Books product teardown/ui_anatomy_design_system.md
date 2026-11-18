# Zoho Books web app: screen anatomy, reusable UI patterns and visual design system (as of Nov 2026)

Read this first (method and dating):
- Sources are Zoho's official help center (US edition, www.zoho.com/us/books/help/), the official "What's New" changelog, Zoho community announcements, and the help-center screenshots. I downloaded and inspected the screenshots myself; local copies are in /tmp/claude-0/-home-user-Apps/b158bf16-7102-5661-a48b-1d8b5b0e6ef4/scratchpad/zoho_imgs_ui/.
- The help center mixes screenshots from three UI generations. Each screenshot is tagged with its generation below:
  - **Gen-1, before Dec 2022.** White/light-grey shell, light-grey sidebar, theme-colored primary buttons (red in the default theme), uppercase grey column headers, a Proxima-Nova-like font (inferred).
  - **Gen-2, the "Refreshed Design" of 30 Dec 2022 / Jan 2023.** Blue/Green/Red/Yellow/custom accent themes with a Light Pane or Dark Pane, and a reorganized top band and sidebar with redesigned icons and tooltips.
  - **Current, about 2024 to 2026.** Dark navy top band, a light sidebar with a blue active pill, blue #408dfb accent, and an Inter-like font (inferred).
- Hex values marked "(pixel-sampled)" were read by me from PNG pixels of official screenshots. They are close approximations of the product's rendered colors, not values from Zoho's CSS. I could not read the product's own CSS because the web app (books.zoho.com/app) redirects to the Zoho Accounts sign-in.
- Measurements in "px" are inferred from screenshots assuming a 2x (retina) capture. They are approximate.

---

## Global app shell (top band, sidebar, right-side widgets pane): what frames every screen?

### Takeaway
Every screen sits inside a fixed shell:
- **Top band:** a full-width dark navy bar (about #21263c). Left: logo, a recent-history clock and a module-scoped global search. Right: org switcher, a blue "+" Quick Create button, people/referral, tasks, notifications, settings, avatar and the Zoho app grid.
- **Sidebar:** a left nav of module groups that expand into sub-modules, with the active item drawn as a filled accent-blue pill.
- **Widgets pane (since Jul 2025):** an optional right-hand pane.

### Cited Findings
- The official "Navigating Zoho Books" page names these shell parts: Dashboard; Sidebar ("Access different modules"); Recent History ("View recently visited transactions"); Search Bar (with Advanced Search filters per module); Organization (switch between orgs); Quick Create ("Create transactions with a single click"); Notifications; Settings; Profile and Help (Account info, Help Docs, FAQs, Forums, Video Tutorials, Migration Guides); and All Zoho Apps. — [Navigating Zoho Books](https://www.zoho.com/us/books/help/getting-started/navigating-zoho-books.html)
- The annotated official screenshot of the current shell is [zb-dashboard.png](https://www.zoho.com/us/books/help/images/getting-started/zb-dashboard.png). What it shows, by my inspection:
  - **Top band layout, left to right:**
    1. A Books logo block (icon + "Books") roughly the width of the sidebar.
    2. A circular-arrow "Recent History" icon.
    3. A rounded search field reading "Search in Customers ( / )". It has a magnifier with a small ▾ that switches the search module, and the field is slightly lighter than the bar (#41455d, pixel-sampled).
    4. A gap, then on the right: org name "Zylker Inc ▾", a thin vertical divider, a square blue "+" Quick Create button (#408dfb, pixel-sampled), a people icon, a bell, a gear, a round green avatar with a "Z" initial (#5cbb76), and a 3×3 dot app-grid icon.
  - **Sidebar** (light pane, about #f7f7ff, pixel-sampled) lists: Home (active: white text on a #408dfb rounded pill), Items ▸, Banking, Sales ▸, Purchases ▸, Time Tracking ▸, e-Way Bills, Accountant ▸, Reports, Documents.
    - Each item is a 16–18px line icon plus a label.
    - Groups with children show a ▸ caret at the right edge.
    - Extra vertical gaps separate clusters (Home/Items/Banking | Sales/Purchases | Time Tracking/e-Way Bills/Accountant/Reports | Documents).
- A second current-UI screenshot crops the top band alone: [tasks/right-corner.png](https://www.zoho.com/books/help/images/tasks/right-corner.png).
  - It shows the same order: logo glyph, history, "Search in Customers ( / )", then on the right a blue "+", a people icon, a tasks (clipboard-check) icon, a bell, a gear, "Zylker ▾", a green avatar and the app grid.
  - The Tasks help page says the tasks icon sits in the top-right band. — [Tasks help](https://www.zoho.com/us/books/help/tasks/)
- A 2024–2025 Home screenshot shows a sidebar variant whose expand chevrons sit to the **left** of the group labels (› Items, › Inventory, › Sales, › Purchases, › Time Tracking, › Filing & Compliance, › Accountant). Non-group items (Home, Banking, Reports) have no chevron. — [custom-dashboards/dashboard-list.png](https://www.zoho.com/books/help/images/custom-dashboards/dashboard-list.png)
- Gen-1 shell, for comparison: a white top band with the multicolor ZOHO logo + "Books ▾", a blue circular "+", a history clock, a pill search, then "Zylker ▾", a bell with a red count badge, a folder, a gear, a "?" and a photo avatar. The sidebar was light grey (#e8e8e8, pixel-sampled), and the active sub-item was a full-width blue bar (#2579d1) with a "+" quick-add at its right end. — [retainer-invoice/create-ri.png](https://www.zoho.com/books/help/images/retainer-invoice/create-ri.png) (2019 data); [purchase-order/new-po.png](https://www.zoho.com/books/help/images/purchase-order/new-po.png) (2018 data)
- The 30 Dec 2022 refresh: "We've reorganized the top band and sidebar with redesigned icons and tooltips, and added new themes … mapped to Blue, Green, Red, and Yellow accent colors and you can use them in light and dark panes. You can also select a custom c[olor]." — [What's New](https://www.zoho.com/us/books/whats-new.html)
  - The community announcement (posted about 10 Jan 2023) adds: "we have increased the contrast of grey widgets and fonts throughout the app for improved readability." — [Introducing a Refreshed Design (community)](https://help.zoho.com/portal/en/community/topic/introducing-a-refreshed-design-to-enhance-your-user-experience-in-zoho-books)
- 9 May 2023: "We've reorganized the top navigation bar! Click your organization's profile picture to view organization's details, reach out to support or find our help resources…" (Help & Support moved under Profile). — [What's New](https://www.zoho.com/us/books/whats-new.html)
- 3 Jul 2025, Widgets Pane: "Located on the right sidebar (RHS), this pane provides quick access to Announcements, Webinars, Page Tips, Extensions, Contextual Tasks and Chat, WhatsApp, and Zoho Notebook." — [What's New](https://www.zoho.com/us/books/whats-new.html)
- 17 Sep 2024: a minimized view for Web Tabs keeps them "accessible while navigating other modules". 19 Jun 2024: the Quick Create menu gained a Custom Modules group. — [What's New](https://www.zoho.com/us/books/whats-new.html)
- 14 Aug 2024: a "Navigate-to" accessibility feature jumps "straight to the main content, avoiding headers and sidebars" via Tab or Option/Alt+0. — [What's New](https://www.zoho.com/us/books/whats-new.html)
- Quick Create pro-tip: "To create an invoice directly from the Home page, click the Quick Create button in the top right corner and select Invoices from the dropdown." — [Invoices help](https://www.zoho.com/us/books/help/invoice/)

### Inferences
- Approximate proportions, measured from zb-dashboard.png and assuming 2x capture:
  - Top band about 42–44px tall.
  - Sidebar about 180–230px wide.
  - Sidebar rows about 35px apart.
  - Quick Create button about 30px square with a small radius.
  - The search field takes about 18% of the band width, starting just right of the sidebar.
- The search placeholder "Search in <Module> ( / )" shows the current module and the "/" hotkey, so search is context-scoped by default.

### Gaps
- I found no official screenshot of the **Dark Pane** variant in the current UI. Whether the dark pane darkens only the sidebar or the sidebar plus other surfaces is unconfirmed.
- I found no official description or screenshot of a sidebar collapse/minimize control for the main web app. The 8 Aug 2022 entry documents one only for the Client/Vendor Portal: "Minimize the sidebar in the Client and Vendor Portal by clicking the Hamburger icon next to your organization name." — [What's New](https://www.zoho.com/us/books/whats-new.html)

---

## LIST VIEW: what is the anatomy of a module list page (e.g., Invoices)?

### Takeaway
A list page has, top to bottom:
- **Header row:** a large view-switcher title ("All Invoices ▾") at left. At right, a primary "+ New" button and a "•••" More menu. The More menu holds sort options, Import/Export, Export Current View, Preferences and Refresh List.
- **Table:** full-width, with a customize-columns icon and a select-all checkbox at the far left of the header row. Column headers are uppercase grey and click to sort, record numbers are blue links, statuses are colored uppercase text, and amounts are right-aligned.
- **Bulk selection:** selecting rows swaps the header for a bulk action bar ("Bulk Update", "Delete"…, "N Selected").

### Cited Findings
**View switcher and custom views (current help text):**
- "Click the dropdown at the top of the page (for example, All Invoices)." The dropdown has sections "Favorites", "Default Filters: System-provided filters that vary by module. These cannot be edited or deleted", and "User-created views". There is a search bar at the top of the dropdown, and "+ New View at the bottom of the dropdown." — [Views help](https://www.zoho.com/us/books/help/settings/customization/custom-views.html)
- The New View page has four parts:
  1. **Name** with a "Mark as Favorite" checkbox.
  2. **"Define the criteria (if any)":** field → comparator → value rows, plus "+ Add Criterion".
  3. **"Columns Preference":** Available Columns → Selected Columns via a "+" icon, drag to reorder.
  4. **"Visibility Preference":** "Use Custom View In" (other Zoho Finance apps) and "Share With" (Only Me / Only Selected Users & Roles / Everyone).
  - Favorites are toggled with a "Star icon next to the view". Edit uses an "Edit icon next to the view name". Delete is at the "bottom right corner" of Edit View. — [Views help](https://www.zoho.com/us/books/help/settings/customization/custom-views.html)
- 3 Jan 2025: default filters can be marked favorites (per user). 12 Aug 2024: Advanced Search gained a "Filter" field to search within default/custom views. — [What's New](https://www.zoho.com/us/books/whats-new.html)
- Invoice status values (system filters map to these): "sent, draft, overdue, paid, void, unpaid, partially_paid and viewed". `filter_by` uses "Status.*" or "Date.PaymentExpectedDate". Sort columns are "customer_name, invoice_number, date, due_date, total, balance and created_time". — [Zoho Books API – Invoices](https://www.zoho.com/books/api/v3/invoices/)
- The current-UI view dropdown, by my inspection of [custom-module/custom-view.png](https://www.zoho.com/books/help/images/custom-module/custom-view.png) and [created-custom-view.png](https://www.zoho.com/books/help/images/custom-module/created-custom-view.png):
  - The title reads "All Debtors" in about 24px dark text with a small blue ▾ chevron.
  - The dropdown is a white card with a soft shadow and collapsible group headers in small uppercase grey: "▾ DEFAULT FILTERS" with a dark round count badge "1", and "▾ CREATED BY ME 1".
  - Items: "All"; a favorited custom view with a blue ★ ("Amount above 10000").
  - Footer link: a blue "⊕ New Custom View" separated by a divider.
- Gen-1 dropdown, from [contacts/filter-contacts.png](https://www.zoho.com/books/help/images/contacts/filter-contacts.png): header "DEFAULT FILTERS"; items All, Active, CRM, Duplicate, Inactive, Client Portal Enabled/Disabled, Overdue, Unpaid Customers; footer "+ New Custom View".
- Current-UI custom view editor pieces:
  - Criteria rows: [custom-view-criteria.png](https://www.zoho.com/books/help/images/custom-module/custom-view-criteria.png) shows a row number cell, a field select with red × clear and ▾, a comparator select ("greater than …"), a free-text value, then a trash icon and "+". Below is a blue-circle "⊕ Add Criterion" link.
  - Columns Preference: [custom-view-columns.png](https://www.zoho.com/books/help/images/custom-module/custom-view-columns.png) shows two bordered list boxes, "AVAILABLE COLUMNS" (with a search box) and "SELECTED COLUMNS", with a circled → arrow between them. Mandatory columns carry a red asterisk.
  - Visibility: [custom-view-visibility-preference.png](https://www.zoho.com/books/help/images/custom-module/custom-view-visibility-preference.png) shows radios "Only Me / Only Selected Users & Roles / Everyone" and a red required label "Select Users & Roles*" over a multi-select showing grey chips "Admin ×", "Manager ×".

**Header actions, More menu, sort, refresh:**
- "Click + New in the top right corner." Import is via "the More icon in the top right corner" → "Import Invoices". Export is via More → "Export Invoices". — [Invoices help](https://www.zoho.com/us/books/help/invoice/); [Other Actions in Invoices](https://www.zoho.com/us/books/help/invoice/other-actions.html)
- 20 Oct 2022: "Moved Preference under the More option in all the transaction's list pages." — [What's New](https://www.zoho.com/us/books/whats-new.html)
- "Export Current View": More icon → "Export Current View" exports the filtered or re-arranged view. — [Manage Purchase Orders](https://www.zoho.com/us/books/help/purchase-order/manage-po.html)
- Current-UI header actions and More menu, from [custom-module/sort.png](https://www.zoho.com/books/help/images/custom-module/sort.png):
  - A blue filled "+ New" button with a white plus, next to a square light-grey "•••" button.
  - The More dropdown starts with a "SORT BY" uppercase grey header. Options: Created Time, Last Modified Time, Debtor Name (the active sort is a full-width blue-filled row with an up/down sort glyph), Debtor Role, Debt Amount.
  - Then a divider, "⤓ Import Debtors" and "⤒ Export Debtors" with blue line icons, another divider, and "⟳ Refresh List".
- Gen-1 header: "All Purchase Orders ▾" at left. At right: a red "+ New" button, a gear button, a ≡ (hamburger) menu button, a divider, and "💡 Page Tips" as a blue link. — [purchase-order/new-po.png](https://www.zoho.com/books/help/images/purchase-order/new-po.png) (2018)

**Columns: sort, customize, resize, pin:**
- "Click the column which you want to sort… ascending or descending order (indicated by the arrow). Click the field again to change the sorting order." Rearrange via "the Table icon in the left side of the page… dragging and dropping." — [Manage Purchase Orders](https://www.zoho.com/us/books/help/purchase-order/manage-po.html)
- Current "Customize Columns" panel, from [customize-columns.png](https://www.zoho.com/books/help/images/custom-module/customize-columns.png):
  - Header: a sliders icon + "Customize Columns", right-aligned "4 of 4 Selected", a vertical divider and a red ✕.
  - A search box.
  - One row per column on a light-grey background (#f9f9fb, pixel-sampled). Each row has a ⠿ drag grip, then a 🔒 lock for the mandatory column or a blue checkbox, then the label.
  - Footer: blue "Save" and grey "Cancel".
  - The trigger is a small table icon at the far left of the column-header row, before the select-all checkbox: [table-icon.png](https://www.zoho.com/books/help/images/custom-module/table-icon.png).
- 19 Jun 2024, column resize: "if there are more than eight columns. When you hover over a column, the resize icon will appear… up to 420 pixels… restore columns to their original width." — [What's New](https://www.zoho.com/us/books/whats-new.html)
- 24 Feb 2025, pin columns: "pin up to two columns to the left… if you have more than 8 columns… click the Customize Columns icon, hover over the fields, click the pin icon." — [What's New](https://www.zoho.com/us/books/whats-new.html)

**Bulk selection and bulk action bar:**
- Invoices: select rows → "Bulk Update at the top of the page" opens a "Bulk Update Invoices popup" (choose field, enter value, Update). "Click the PDF icon at the top of the page" downloads one combined PDF. "Click the ZIP icon" downloads individual PDFs. — [Other Actions in Invoices](https://www.zoho.com/us/books/help/invoice/other-actions.html)
- Current bulk bar (screenshot data dated 27 Jun 2025), from [payments-made/bulk-update-button.png](https://www.zoho.com/books/help/images/payments-made/bulk-update-button.png):
  - It replaces the page header. Left to right: bordered light-grey buttons "Bulk Update" and "Delete", a thin vertical divider, a light circular badge holding the count "10" in blue, and the word "Selected".
  - The column-header row below has a light lavender-grey background (#f6f6fa, pixel-sampled), a select-all checkbox and uppercase grey headers (DATE, LOCATION, PAYMENT #).
  - Selected rows show filled blue checkboxes, and the record number is a blue link.
- The bulk-update modal: [update-payment-fields-in-bulk.png](https://www.zoho.com/books/help/images/payments-made/update-payment-fields-in-bulk.png). Its anatomy is described under Other components.
- Vendor credits: "select up to 25 vendor credits from the List view and update fields…" (22 Oct 2025). — [What's New](https://www.zoho.com/us/books/whats-new.html)
- Gen-1 bulk bar (contacts): icon buttons (email statement, print), then "Bulk Update", then "More Actions ▾" (Enable Portal, Mark as Active, Merge, Mark as Inactive, Delete), then "2 Contact(s) Selected". — [contacts/bulk-action.png](https://www.zoho.com/books/help/images/contacts/bulk-action.png)
- Keyboard equivalents at module level: N new; Option+M email multiple; Option+D download multiple as PDF; Option+I import; Option+E export; Option+A select all. — [Keyboard Shortcuts](https://www.zoho.com/us/books/help/getting-started/keyboard-shortcuts.html)

**Rows, status coloring, alternate views:**
- Gen-1 list row anatomy, from [purchase-order/new-po.png](https://www.zoho.com/books/help/images/purchase-order/new-po.png):
  - About 60px rows separated by hairlines.
  - Columns: checkbox | DATE | PURCHASE ORDER# (blue link #3576be, pixel-sampled) | REFERENCE# | VENDOR NAME | STATUS | BILLED STATUS | AMOUNT (right-aligned) | EXPECTED DELIVERY…
  - A 🔍 search icon at the far right of the header row (opens advanced search).
  - Status text is uppercase with no pill: OPEN blue (#2177d5), DRAFT grey (#738487), CLOSED and BILLED green (#387837) (pixel-sampled).
- Retainer invoice list (2019) uses SENT blue, PAID blue, PARTIALLY DRAWN green, DRAFT grey. — [retainer-invoice/create-ri.png](https://www.zoho.com/books/help/images/retainer-invoice/create-ri.png)
- Bills offer a list/calendar toggle (two icon buttons left of "Page Tips"). The calendar view, "Bills Summary", has month tabs (Mar–Jul 2019, current month red), a month-picker popover (« 2019 » with a Jan–Dec grid) and a "This Month" link. Amounts appear in orange in day cells. — [bills/calendar-view.png](https://www.zoho.com/books/help/images/bills/calendar-view.png) (Gen-1, 2019)

### Inferences
- Current list pages keep the Gen-1 structure (title-as-view-switcher at left, primary New + More at right, customize-columns icon at far left of the header row, uppercase column headers, link-colored record numbers). Only the colors, font and the Gen-1 gear/≡ buttons have changed: the gear/≡ were folded into the single "•••" More menu, consistent with the Oct 2022 "Preference moved under More" entry.
- When the bulk bar is active, the module title and New button disappear, so the header strip is reused rather than a floating toolbar appearing.

### Gaps
- I did not obtain a **current-UI** screenshot of the full Invoices list. I could not verify:
  - current per-status colors for invoices (Overdue, Paid, Partially Paid, Viewed, Void);
  - the exact system-view names in the invoice dropdown;
  - pagination controls and per-page counts;
  - any totals/summary strip;
  - row-hover quick actions;
  - the empty-state illustration and CTA copy.
- My unverified recollection (not confirmed by a source in this session): a bottom-right per-page selector (e.g., 25/50/100/200 per page) and an illustrated empty state with a "New Invoice" CTA.

---

## SPLIT VIEW / DETAIL VIEW: what happens when you open a record, and how are detail pages built?

### Takeaway
Clicking a row turns the list into a narrow left pane: the view-switcher title, a compact New/refresh/menu row, and rows reflowed into 2–3 line cards. The record opens on the right with:
- a header (record number at left; "Attach File(s)" with a count badge, "Comments & History" and a close ✕ at right);
- a grey action toolbar of divided text+icon buttons (Edit · Mails/SMS ▾ · Share · Reminders ▾ · PDF/Print ▾ · Record Payment ▾ · •••);
- a contextual banner card with a primary call-to-action;
- the rendered PDF template as a white "paper" card with a diagonal status ribbon.

Contact (customer/vendor) detail pages differ: a tabbed profile page (Overview, Comments, Transactions, Related Lists, Mails, Statement) with a two-column Overview.

### Cited Findings
**Split view (Gen-1, 2019 data):** [payments-received/view-pr.png](https://www.zoho.com/books/help/images/payments-received/view-pr.png)
- **Left pane** (about 28% of width):
  - Header "All Received Payme… ▾" (truncated with ellipsis), a red "+ New", a refresh-icon button and a ≡ menu button.
  - Each row has a checkbox and three lines. Left side: name; then "12 Feb 2019 | 10"; then "INV-000062". Right side, right-aligned: "$1,100.00"; then "Cash"; then "Invoice Payment".
  - The selected row has a light-grey background.
- **Right pane:**
  - An icon-only toolbar (pencil, PDF, print, envelope, paperclip) plus a "Delete" text button.
  - Below it, the payment-receipt document on a white card with a shadow. It includes a green "Amount Received $1,100.00" block.

**Invoice detail header and toolbar (Gen-1, India edition):** [invoice/void-invoice.png](https://www.zoho.com/books/help/images/invoice/void-invoice.png); [invoice/record-payment.png](https://www.zoho.com/books/help/images/invoice/record-payment.png); [invoice/charge-customer.png](https://www.zoho.com/books/help/images/invoice/charge-customer.png)
- Header row:
  - Left: bold "INV-000116".
  - Right: "📎 Attach File(s)" with a small blue circular count badge "1" above the paperclip, a vertical divider, "💬 Comments & History", a divider, and a large ✕.
- Toolbar row: light-grey band with buttons separated by vertical dividers:
  - "✎ Edit"
  - "✉ Mails / SMS ▾" (or "Mails ▾")
  - "Share"
  - "🔔 Reminders ▾"
  - "PDF / Print ▾"
  - "$ Record Payment ▾", with dropdown: Record Payment, Charge Customer, Write Off
  - "•••"
- ••• menu: Make Recurring, Create Credit Note, Create Debit Note, Add e-Way Bill Details, Clone, Void | View Journal, Delete | ⚙ Invoice Preferences, 💡 Page Tips. Hover/selected item is a full-width blue fill.
- Banner card below the toolbar: a bordered rounded card.
  - An optional row "Credits Available: Rs.23,540.00 Apply Now".
  - Then an icon tile ($), the bold line "Get paid faster with online payment gateways", gateway chips (WorldPay, 2Checkout, PayPal Payflow Pro) and a blue "Change" link.
  - Right-aligned: a primary split button "Record Offline Payment ▾".
- Document preview: a centered white sheet with a drop shadow. A diagonal ribbon at the top-left corner reads "Sent" (blue). Large "Invoice" title right-aligned, "# INV-000116", "Balance Due ₹25,960.00".

**Detail actions as documented in current help text:** [Other Actions in Invoices](https://www.zoho.com/us/books/help/invoice/other-actions.html)
- "Click the Edit icon"; "Click the Mail / SMS dropdown"; "Select Mark as Sent" (Draft only).
- "click Share at the top" opens a "Share Invoice Link popup" with Visibility (Public / Private and Secure) and Link Expiration Date (default 90 days), then "Generate Link" and "Copy Link".
- "Click the PDF/Print dropdown and select Print"; "Click ••• and select Clone"; "Click Attach File(s) on the top right corner" (up to 5 files of 5MB; options Drag & Drop / Cloud / Documents).
- "Click on ••• and select Void. Enter a reason and click Void it". A voided invoice offers "Convert to Draft".
- "Click Record Payment > Write Off… Click Write it off". Revert is via a "Cancel Write Off button in the top right corner".
- Detail-level hotkeys: E edit, M mail, P print, D download PDF. — [Keyboard Shortcuts](https://www.zoho.com/us/books/help/getting-started/keyboard-shortcuts.html)
- Clone (Gen-1 crops): [invoice/clone-invoice.png](https://www.zoho.com/books/help/images/invoice/clone-invoice.png). Share link popup: [invoice/generate-invoice-link.png](https://www.zoho.com/books/help/images/invoice/generate-invoice-link.png).

**"What's Next":**
- 7 Jan 2019, "Introducing What's Next": "navigational assistance at a user level for performing the most commonly performed actions that succeeds invoice creation." — [What's New](https://www.zoho.com/us/books/whats-new.html)

**Contact detail page (current UI, chart data Nov 2023–May 2024):** [contacts/contact-transaction.png](https://www.zoho.com/books/help/images/contacts/contact-transaction.png)
- Header:
  - Left: the contact name in large text.
  - Right: "Edit" (secondary), a paperclip icon button, a primary blue "New Transaction ▾", "More ▾" and ✕.
  - The New Transaction dropdown has a group header "SALES" and items Invoice, Customer Payment, Estimate, Retainer Invoice, Sales Order, Recurring Invoice, Expense, Recurring Expense, Journal, Credit Note, and more below a divider. The highlighted item is a blue filled rounded row.
- Tab strip: Overview (bold, blue underline) | Comments | Transactions | Related Lists | Mails | Statement. At the far right of the tab strip: a tasks (clipboard-check) icon and a chat-bubble icon.
- **Overview, left column** (about one-third width, light grey background):
  - Company name.
  - Contact card: avatar placeholder, bold name, orange "Portal invitation not accepted", and links "Edit | Send Email | Re-invite | Delete".
  - Collapsible sections with uppercase headings and a ⌃ toggle: "ADDRESS" (Billing Address / Shipping Address, with "Add new address" links) and "OTHER DETAILS" (label/value pairs: Customer Type, Default Currency, Payment Terms, Tax Preference, Portal Status "• Enabled (1 of 1 Contacts)" in green).
- **Overview, right column:**
  - "Payment due period: Due on Receipt".
  - A "Receivables" table: CURRENCY | OUTSTANDING RECEIVABLES | UNUSED CREDITS, one row per currency, plus a TOTAL (USD) row.
  - An "Income" bar chart: caption "This chart is displayed in the organization's base currency", a period dropdown, an "Accrual ▾" basis dropdown, 6 monthly bars, and the footer "Total Income ( Last 6 Months ) - $0.00".
- Help text for the same page:
  - "Click the Statement tab on the right side of the page. Select the time period… download the PDF, take a print-out or email the statement… by clicking the icons on top of the statement."
  - "Click the Mails tab…"; "Click the Comments tab… Enter a comment and click Add Comment" (comments are internal).
  - "view the recent activities of the customers/vendors as a timeline in the bottom right side of the page."
  - More menu items: "Merge…", "Mark as Inactive", "Stop all Reminders" / "Enable all Reminders".
  - — [Other Actions for Customers/Vendors](https://www.zoho.com/us/books/help/contacts/other-actions.html)
- 31 Jan 2023: "We have revamped the design of the Transaction List, Related List, Comments & History, and Mail sections in the details page for Customers, Vendors, and Projects." — [What's New](https://www.zoho.com/us/books/whats-new.html)
- 18 Oct 2022: Recurring Bill details gained "Overview, Next Bill and Recent Activities" tabs. — [What's New](https://www.zoho.com/us/books/whats-new.html)

### Inferences
- Transaction detail pages (invoice, PO, bill) follow a "document-centric" template: toolbar, then contextual banner(s), then the full PDF preview. Contact, item and project detail pages follow a "profile + tabs" template. Comments & History for transactions opens from a header link rather than a tab, apparently as a slide-out panel (inferred; not confirmed by a screenshot).
- The left list pane in split view reflows each row into a card with name, date and number on the left and amount and secondary attributes on the right, instead of showing table columns.

### Gaps
- I did not find a **current-UI** invoice detail screenshot. Unconfirmed:
  - current toolbar labels and colors;
  - the exact "WHAT'S NEXT?" banner wording (my unverified recollection: for Draft invoices, "Send this invoice to your customer or mark it as sent" with "Send Invoice" / "Mark As Sent" buttons);
  - how the Comments & History panel slides in;
  - payments/related-list sections under the PDF.
- Detail-page "newer/older" record navigation exists only as a community request topic ([community](https://help.zoho.com/portal/en/community/topic/invoice-detail-view-go-to-newer-older-button?page=1)), which I did not read.

---

## CREATE/EDIT FORM: how is a transaction form (e.g., New Invoice) laid out and how does it behave?

### Takeaway
Forms are single-column, label-left / field-right grids on a white page:
- a page title at top-left;
- required labels in red with an asterisk, and (i) tooltip icons after labels;
- the customer selector at top in a grey band;
- an auto-number field with a ⚙ gear for series settings;
- the date/terms/due date/salesperson fields;
- a grid line-item table (drag handle · item · qty · rate · discount · tax · amount · row menu/remove), with "+ Add another line / + Add items in bulk" below;
- a right-aligned totals block;
- a grey lower band for notes, terms and attachments;
- a sticky footer: "Save as Draft" | "Save and Send" (split ▾ "Save and Send Later") | "Cancel".

### Cited Findings
**Invoice fields, in order (current help text):** [Invoices help](https://www.zoho.com/us/books/help/invoice/)
- Customer Name; Invoice# ("The default transaction series will be used. Choose a different one from the dropdown… Click the Settings icon in the right of the field to enable or disable the option to auto-generate invoice numbers"); Order Number; Invoice Date; Terms; Due Date; Salesperson; Select Price List.
- Item Table: Quantity; Rate ("Click Apply Price List under this field"); Tax; Discount ("Percentage (%) or Amount").
- "Bulk Actions… Bulk Update Line Items… or select Show Additional Information."
- "Click + Add New Row… Add Items in Bulk."
- Row-level "More icon" → "Insert New Header" / "Insert New Subtotal"; also "the dropdown next to + New Row… New Header / New Subtotal".
- Shipping Charges ("Apply Tax on Shipping Charge"); Adjustment (negative allowed); Customer Notes; Terms and Conditions; "Attach File(s) to Invoice: Click Upload File".
- "I have received the payment" checkbox → Payment Method / Deposit Account table, "+ Add Split Payment", and the invoice is saved as Paid.
- "Click Save as Draft… or Save and Send." "Click the dropdown next to the Save and Send and select Save and Send Later" → "Schedule Mail page".
- Save hotkeys: Option+S "Save and Send", Option+P "Save and Print". — [Keyboard Shortcuts](https://www.zoho.com/us/books/help/getting-started/keyboard-shortcuts.html)
- Header rows (a group header line) remove via "the Remove icon to the right of it"; removing a header keeps its lines. — [Other Actions in Invoices](https://www.zoho.com/us/books/help/invoice/other-actions.html)

**Form-level history (What's New):** [What's New](https://www.zoho.com/us/books/whats-new.html)
- 8 May 2017: "The layout of line items for transaction creation has been done into a grid-like style."
- 14 Feb 2019: "View Customer Details from Invoice Creation Page."
- 14 Apr 2020: "Item Details sidebar in transaction creation page" (item details, previous transactions, stock location; edit item).
- 31 Jan 2023: "redesigned the Payment Gateway and Mail To sections in the creation page."
- Rate-field arithmetic "( ) + - / *" is supported; enhanced item search matches "keywords in any order".
- 29 Apr 2024: split invoice payment into three parts.

**Form layout, current UI:** [contacts/new-customer-us.png](https://www.zoho.com/books/help/images/contacts/new-customer-us.png)
- Page title "New Customer" at top-left, about 28px, with a hairline below.
- Label column about 19% of width. Fields start at a fixed x and are about 520px wide (image px).
- Labels are dark text with grey (i) circle icons. The required label "Customer Display Name*" is red (#e54543, pixel-sampled) and wraps to two lines.
- Composite row "Primary Contact": a Salutation select plus First and Last name inputs inline.
- Inputs with leading icons (envelope; phone / mobile in two half-width fields).
- A checkbox row with a grey helper paragraph indented under it.
- An in-form tab strip: Other Details (active, blue underline) | Address | Contact Persons | Custom Fields | Reporting Tags | Remarks.
- Selects show a red ✕ clear icon and a ▾ chevron separated by a thin divider.
- Sticky footer bar with a top border: blue "Save" + light-grey "Cancel", left-aligned.

**Gen-1 transaction form** (2019 data, red default theme): [purchase-order/create-po.png](https://www.zoho.com/books/help/images/purchase-order/create-po.png)
- Header: a module icon + "New Purchase Order".
- Top grey band holds "Vendor Name*" (red label): a select with ✕ ▾, an adjacent red square 🔍 advanced-search button and a green "USD" currency chip. Below: a warning-icon link "Open Purchase Orders" and "BILLING ADDRESS CHANGE" with an address block.
- White section below: radio "Deliver To*", "Change destination to deliver" link, "Purchase Order#*" with a blue ⚙ gear right of the field, Reference#, Date, Expected Delivery Date, Shipment Preference.
- Sticky footer: "Save as Draft" (grey) | "Save and Send" (red primary) | "Cancel".

**Line-item table and totals** (Gen-1/transitional bill form): [bills/new-bill2.png](https://www.zoho.com/books/help/images/bills/new-bill2.png)
- Above the table: an "Item Rates Are: Tax Exclusive ▾" selector.
- Bordered grid columns: Item Details | Account ▾ | Quantity (right-aligned, with "Stock on Hand: 968.00 ⓥ" under it) | Rate | Tax (select ✕ ▾) | Customer Details (select + "Non-Billable ✎") | Amount (right-aligned).
- The row has a ⠿ drag handle outside the left edge and, outside the right edge, a blue "⋯" circle (row menu) plus a red ⊗ (remove).
- The item cell shows a name with ✎ edit and ⊗ clear, plus a description line.
- Below the table, left: "+ Add another line | + Add items in bulk" in blue, then a pale-yellow strip "Include 2 Open Purchase Orders".
- Right-hand totals block (about 50% width):
  - Sub Total.
  - Discount: input + "$ ▾" unit toggle, with an "Apply after tax" link.
  - "Discount Account*" select.
  - Tax line "Reduced Rate [5%] 44.50".
  - "Adjustment": the label itself is an editable dashed-border box, plus an input and a (?) tooltip.
  - "Total ( $ ) 935.00" in a grey band.
- Lower grey band: "Attach File(s)" (📎 + "Upload File ▾", helper "You can upload a maximum of 5 files, 5MB each"), "Notes (For Internal Use)" textarea, "Template: 'Standard Template' ✎".

**Item picker and payment form:**
- Item picker dropdown (marketing render, current style): [features/images/invoice/minimize-invoicing-errors.png](https://www.zoho.com/books/features/images/invoice/minimize-invoicing-errors.png).
  - A list card under the item input. Each option shows two lines: the name; then "SKU: 456  Rate: 1,685.980", with right-aligned "Stock on Hand 55".
  - The highlighted option is a solid blue rounded block with white text.
- Record-payment form (2020 data): [us/books/help/images/invoice/payment.png](https://www.zoho.com/us/books/help/images/invoice/payment.png).
  - Title "Payment for INV-000126".
  - Two-column top: Customer Name* (read-only grey field) and Payment #* (with ⚙ gear).
  - A "View Customer Details" link with a contact-card icon (opens the customer side panel).
  - A bordered sub-box with a colored left accent bar grouping "Amount Received(USD)*" and "Bank Charges (if any)".
  - A three-column row: Payment Date* | Payment Mode | Deposit To*. Then Reference#, Notes and "Upload File ▾" (dashed border).
  - Footer: "Record Payment" (primary) + "Cancel".
- Gen-1 expense form with "Record Expense | Record Mileage | Bulk Add Expenses" tabs, a receipt drop-zone column at right, and a spreadsheet-like bulk-add grid with "+ Add More Expenses": [expense/new-expense1.png](https://www.zoho.com/books/help/images/expense/new-expense1.png); [expense/bulk-expenses.png](https://www.zoho.com/books/help/images/expense/bulk-expenses.png).

**Number series settings:**
- Transaction-series table (current UI): columns CUSTOMER PAYMENT | INVOICE | SALES ORDER | ESTIMATE. Hovering a row reveals a blue round ▾ button with the menu Edit / Mark as Default / Delete. — [settings/configure-series.png](https://www.zoho.com/books/help/images/settings/configure-series.png); [Preferences help](https://www.zoho.com/us/books/help/settings/preferences.html)

### Inferences
- The customer side panel (the "View Customer Details" link) and the item details sidebar are slide-in panels from the right edge of the form (inferred from the 2019/2020 What's New wording "sidebar" and the link placement).
- The totals block always occupies the right half under the item table, while add-row links and contextual notices occupy the left half.

### Gaps
- No official source found in this session for:
  - inline validation styling (error text placement and color, field outline on error);
  - the unsaved-changes warning dialog;
  - autosave behaviour;
  - the exact current New Invoice screenshot;
  - the "+ New Customer" inline creation modal inside the customer select.
- Rate-field arithmetic and item search entries have no exact date captured.

---

## Other components: modals, panels, notifications, tooltips, dropdowns, pickers, chips, badges, onboarding, help, shortcuts, theming, density

### Takeaway
The component kit is conventional and consistent:
- **Modals:** a grey header band with title and ✕, a white body, and a footer with primary + secondary buttons left-aligned. Multi-step modals add a numbered stepper.
- **Dropdowns:** white cards with uppercase group headers, a blue-filled highlight row, and often a search box at top.
- **Selects:** a red ✕ clear plus a ▾. **Multi-selects** use grey removable chips.
- **Settings controls:** toggles with a state word ("Disabled") to their left.
- **Help:** (i)/(?) tooltips, "Page Tips", and a right-side Widgets Pane.
- **Keyboard:** a Shift+? shortcut overlay with user-editable bindings.
- **Theming:** Light/Dark Pane plus accent colors (Blue default, Green, Yellow, Red, custom hex).
- **Accessibility (since Apr 2026):** text spacing, link underlines, strikethrough on disabled buttons.

### Cited Findings
**Modals and dialogs:**
- "Bulk Update Vendor Payment" (current UI): [update-payment-fields-in-bulk.png](https://www.zoho.com/books/help/images/payments-made/update-payment-fields-in-bulk.png)
  - Header band (light grey) with a 20px title and a bold black ✕ at right.
  - Body instruction "Choose a field from the dropdown and update with new information."
  - Two side-by-side controls: a field select ▾ and a resizable textarea.
  - A grey "Note: … you cannot undo this action."
  - Footer separated by a rule: blue "Update" + grey "Cancel".
- Stepper modal "New Panel" (current UI): [custom-dashboards/new-panel-details.png](https://www.zoho.com/books/help/images/custom-dashboards/new-panel-details.png)
  - Header "New Panel" with a red ✕.
  - Step tabs "(1) Panel Details  ›  (2) Preferences": the active step has a filled blue number circle and a blue underline; the inactive step has an outlined grey circle.
  - Label-left form rows; required labels red.
  - Footer "Next" (blue) + "Cancel".
- Confirmations: "Enter a reason and click Void it"; delete view → "Click Yes to confirm". — [Other Actions in Invoices](https://www.zoho.com/us/books/help/invoice/other-actions.html); [Views help](https://www.zoho.com/us/books/help/settings/customization/custom-views.html)

**Dropdowns:**
- Dropdown menus (current UI): uppercase grey section headers ("SORT BY", "DEFAULT FILTERS"), dividers between groups, and the active/hover item as a full-width blue (#408dfb) fill with white text. — [custom-module/sort.png](https://www.zoho.com/books/help/images/custom-module/sort.png); [contacts/contact-transaction.png](https://www.zoho.com/books/help/images/contacts/contact-transaction.png)
- Dropdowns with search: the views dropdown has "the search bar at the top". — [Views help](https://www.zoho.com/us/books/help/settings/customization/custom-views.html)
- Lookup fields can display as "a Pop-Up view or a Dropdown view" (What's New, 2025). — [What's New](https://www.zoho.com/us/books/whats-new.html)

**Chips, toggles, checkboxes, radios:**
- Chips / tag input: grey rounded-rect chips with "×" inside a select ("Admin ×", "Manager ×"). — [custom-view-visibility-preference.png](https://www.zoho.com/books/help/images/custom-module/custom-view-visibility-preference.png)
- Toggles (current settings): a grey (#dddddd) pill switch at the right edge of a section row, with the state word "Disabled" to its left. Checkboxes and radios are filled #3f8dfb when on (pixel-sampled). — [invoice/invoice-preferences.png](https://www.zoho.com/books/help/images/invoice/invoice-preferences.png)

**Badges:**
- A blue circular numeric badge on "Attach File(s)" (Gen-1). A blue square count badge "5" on the "Announcements" tab (current). A dark circular count on view-group headers (current). — [void-invoice.png](https://www.zoho.com/books/help/images/invoice/void-invoice.png); [getting-started-tab.png](https://www.zoho.com/us/books/help/images/home/getting-started-tab/getting-started-tab.png); [created-custom-view.png](https://www.zoho.com/books/help/images/custom-module/created-custom-view.png)
- Status badges on documents: a diagonal corner ribbon on the PDF preview ("Sent" in blue). — [void-invoice.png](https://www.zoho.com/books/help/images/invoice/void-invoice.png)

**Progress and status indicators:**
- Dashboard receivable/payable cards: a horizontal stacked bar (amber #ffb830 for overdue, blue for current, pixel-sampled) under "Total Unpaid Invoices $…". Below it, a two-cell split with "CURRENT" (blue, uppercase small) and "OVERDUE" (orange-red #f86a34, uppercase small) labels over large amounts, plus a ▾ for the aging breakdown. — [zb-dashboard.png](https://www.zoho.com/us/books/help/images/getting-started/zb-dashboard.png)

**Notifications and alerts:**
- After charging a card: "you will get an alert saying that the transaction has been processed… Else, you will get an error message." — [Record Payment for Invoice](https://www.zoho.com/us/books/help/invoice/record-payment-for-invoice.html)
- 31 Jan 2023: "redesigned the top band in the Notifications section to categorize your notifications better." — [What's New](https://www.zoho.com/us/books/whats-new.html)

**Onboarding and Home:**
- Home has tabs Dashboard | Getting Started | Announcements | Recent Updates. — [Navigating Zoho Books](https://www.zoho.com/us/books/help/getting-started/navigating-zoho-books.html); [zb-dashboard.png](https://www.zoho.com/us/books/help/images/getting-started/zb-dashboard.png)
- Custom dashboards appear as additional tabs ("Default Dashboard | Sales Dashboard | Purchases Dashboard | ⊕ New"), with a "🚀 Getting Started" link at the top right of the Home header. — [dashboard-list.png](https://www.zoho.com/books/help/images/custom-dashboards/dashboard-list.png); custom dashboards launched 1 Jul 2024 per [What's New](https://www.zoho.com/us/books/whats-new.html)
- Home header: an org logo tile, "Hello, <user>" and an org subtitle (with "• All Locations ▾" when locations are enabled), on a faint illustrated line-art pattern background. — [dashboard-list.png](https://www.zoho.com/books/help/images/custom-dashboards/dashboard-list.png)
- Getting Started tab (current UI): [getting-started-tab.png](https://www.zoho.com/us/books/help/images/home/getting-started-tab/getting-started-tab.png)
  - Centered "Welcome to Zoho Books" and the subtitle "Your journey to effortlessly manage your accounting starts here."
  - A wide lavender video card: thumbnail with play button and "10:55" duration, title, description, and "Find more videos on our YouTube channel ↗".
  - Below it, a 2-column grid of task cards. Each card has an icon tile, a bold title (e.g., "Configure Chart of Accounts", "Enter Opening Balances"), grey body text with a "Learn More" link, and actions: a pale-blue tinted "Configure" button plus a "▶ Watch & Learn" link.
  - The focused card has a blue 1px border.
- Announcements tab added 30 Aug 2023. — [What's New](https://www.zoho.com/us/books/whats-new.html)

**Contextual help:**
- "Page Tips" (💡) appears in the Gen-1 list header and the detail ••• menu. Since Jul 2025 it is also in the Widgets Pane. — [new-po.png](https://www.zoho.com/books/help/images/purchase-order/new-po.png); [What's New](https://www.zoho.com/us/books/whats-new.html)
- (i) icons next to form labels and (?) icons next to dashboard card titles. — [new-customer-us.png](https://www.zoho.com/books/help/images/contacts/new-customer-us.png); [zb-dashboard.png](https://www.zoho.com/us/books/help/images/getting-started/zb-dashboard.png)

**Keyboard shortcuts (verified)** — [Keyboard Shortcuts](https://www.zoho.com/us/books/help/getting-started/keyboard-shortcuts.html)
- **Overlay:** "press Shift + ? to view the keyboard shortcuts, or access them from the profile section by clicking Navigate faster with keyboard shortcuts". "You can create custom shortcut keys for any action by clicking the Edit icon next to the action." The 20 Jun 2024 entry adds the ability to disable and reset shortcuts ([What's New](https://www.zoho.com/us/books/whats-new.html)).
- **General:** Option+/ advanced search; S Settings; O Organizations list; Shift+/ shortcuts; Command+/ Zia search; Option+0 Navigate To; / Search.
- **Go-to:** Shift+I Invoices, Shift+J Journals, Shift+E Quotes, Shift+N Credit Notes, Shift+B Bills, Shift+X Expense, Shift+P Purchase Orders, Shift+S Sales Orders, Shift+Z Chart of Accounts, Shift+1 Dashboard, Shift+2 Items, Shift+3 Banking, Shift+4 Customers, Shift+5 Vendors, Shift+6 Reports, Shift+7 Documents, Shift+R Payments Received, Shift+M Payments Made.
- **Module-level:** N new; Option+M email multiple; Option+D download multiple PDF; Option+I import; Option+E export; Option+A select all.
- **Transaction-level:** E edit, M mail, P print, D download PDF.
- **Create (two-key sequences):** C+I invoice, C+J journal, C+E quote, C+N credit note, C+B bill, C+X expense, C+A account, C+T log time, C+5 vendor, C+4 customer, C+R retail invoice, C+1 customer payment, C+M vendor payment.
- **Save:** Option+S save and send; Option+P save and print.

**Themes and dark mode:**
- Settings → Branding (under Organization): "Appearance: Choose between Dark Pane and Light Pane. Accent Color: The default color is Blue. You can change it to Green, or Yellow… Custom Color… enter a hexadecimal code." "The color you select will also be applied to other Zoho Finance applications… as well as the customer and vendor portals." — [Change Theme](https://www.zoho.com/us/books/help/personalize/change-theme.html)
- The Jan 2023 announcement lists "red, blue, green and yellow accent colors in line with Zoho's branding". — [Refreshed Design announcement](https://help.zoho.com/portal/en/community/topic/introducing-a-refreshed-design-to-enhance-your-user-experience-in-zoho-books)
- Mobile apps have separate Appearance (System/Light/Dark) and text-size settings. — "Accounting on the Go Series-22: Tailoring Your Zoho Books Experience: Customizing, Theming, and Text Size" ([community](https://help.zoho.com/portal/fr/community/topic/accounting-on-the-go-series-22); title seen in search results only)

**Accessibility and density:**
- 8 Apr 2026, Accessibility Preferences: "adjust text spacing, underline links for better visibility, add strikethrough to disabled buttons, and quickly access keyboard shortcuts." — [What's New](https://www.zoho.com/us/books/whats-new.html)

**Other surfaces:**
- Contextual Chat (6 Jan 2022, powered by Zoho Cliq): "create chats around transactions and records". Contextual conversations for custom-module records arrived 22 Jul 2026. — [What's New](https://www.zoho.com/us/books/whats-new.html)

### Inferences
- A complete Light/Dark *app* theme (dark content area) is not documented for the web app. Only the pane (sidebar/shell) is switchable, and the content canvas appears to stay white in all documented states.
- The "Disabled ◯" toggle-with-state-word pattern is used for whole-feature switches in settings, while checkboxes are used for individual preference options.

### Gaps
- No source found for:
  - toast/snackbar styling (position, color, duration);
  - date-picker anatomy in the current UI (only the Gen-1 month picker in the bills calendar was seen);
  - progress spinners and loaders;
  - a density/compact-mode setting for the web app (none found; only "Spreadsheet – Compact" PDF *template*, 24 Feb 2022, which is a document template, not UI density).
- I did not confirm whether a Dark Pane also darkens the top band and sidebar only, or more.

---

## Visual design system: colors, typography, spacing, radius, icons, illustrations, status colors

### Takeaway
The current product, as rendered in official screenshots, uses:
- a dark navy chrome (#21263c) with one saturated accent blue (#408dfb) for primary buttons, active nav, tab underlines, checkboxes and links;
- near-white lavender-tinted neutrals (#f7f7ff sidebar, #f6f6fa table header, #f9f9fb card headers);
- blue-grey secondary text (#6c7184);
- red required labels (#e54543);
- orange-red for overdue (#f86a34) and amber for unpaid bars (#ffb830);
- a clean Inter-like sans-serif (inferred), thin-stroke line icons, small corner radii and generous whitespace.

Accent color is user-themeable (Blue default; Green, Yellow, Red, custom).

### Cited Findings
**Current-UI colors (pixel-sampled)** — from [zb-dashboard.png](https://www.zoho.com/us/books/help/images/getting-started/zb-dashboard.png), [invoice-preferences.png](https://www.zoho.com/books/help/images/invoice/invoice-preferences.png), [new-customer-us.png](https://www.zoho.com/books/help/images/contacts/new-customer-us.png) and [bulk-update-button.png](https://www.zoho.com/books/help/images/payments-made/bulk-update-button.png):

| Element | Hex |
|---|---|
| Top band | #21263c |
| Search field on top band | #41455d |
| Accent / primary (Quick Create, active sidebar pill, active tab underline, primary Save/Update, checked checkbox/radio, settings-nav active row) | #408dfb / #3f8dfb |
| Sidebar (light pane) background | #f7f7ff |
| Sidebar text | about #181c2e |
| Page header band | #fcfcfe with faint #efefff line-art pattern |
| Content background | #ffffff |
| Card header strip | #f9f9fb |
| Card/section dividers | about #ebeaf2 |
| Table header row | #f6f6fa |
| Primary text | #000000 / #21263c |
| Secondary / helper text | #6c7184 (#6c7183) |
| Inactive tab text | #4c526c |
| Required label red | #e54543 |
| Select clear "×" | #f9656c |
| "Close Settings" ✕ | #ff5272 |
| Input border | about #dfdde8–#e7e6ee |
| Select chevron | #838194 |
| Secondary (Cancel) button fill | #f5f5f5 |
| Toggle off track | #dddddd |
| Dashboard "OVERDUE" label | #f86a34 |
| "CURRENT" label | #408dfb |
| Unpaid bar (amber) | #ffb830 |
| Avatar green | #5cbb76 |

**Gen-1 colors (pixel-sampled):**
- Default-theme primary red (#ca3224) for "+ New" and "Save and Send"; link blue #3576be; light-grey sidebar #e8e8e8; active nav blue #2579d1.
- Status text: OPEN #2177d5, DRAFT #738487, CLOSED/BILLED #387837.
- — [purchase-order/new-po.png](https://www.zoho.com/books/help/images/purchase-order/new-po.png); [purchase-order/create-po.png](https://www.zoho.com/books/help/images/purchase-order/create-po.png)

**Theme mechanics:**
- Accent default Blue; Green and Yellow (and Red per the 2023 announcement); custom hex. The accent propagates to portals and other Zoho Finance apps. — [Change Theme](https://www.zoho.com/us/books/help/personalize/change-theme.html); [Refreshed Design announcement](https://help.zoho.com/portal/en/community/topic/introducing-a-refreshed-design-to-enhance-your-user-experience-in-zoho-books)
- The Gen-1 red buttons were the default theme color of that era, not a fixed brand color. The 2022 refresh "mapp[ed] your existing theme with the closest primary color theme". — [Refreshed Design announcement](https://help.zoho.com/portal/en/community/topic/introducing-a-refreshed-design-to-enhance-your-user-experience-in-zoho-books)

**Typography:**
- The Zoho Books help/marketing site computes `body { font-family: inter, Helvetica, Arial }` (Inter 400/600/700 loaded). This is MARKETING/HELP site CSS, not the product. — measured via headless Chromium on [Invoices help](https://www.zoho.com/us/books/help/invoice/)
- The Zoho Accounts sign-in page (the gate in front of books.zoho.com/app) uses "ZohoPuvi" (Zoho's in-house typeface), a primary button #159aff (rgb 21,154,255), 4px radius and 14px button text. This is NOT the Books app. — measured on [books.zoho.com/app → accounts.zoho.com/signin](https://books.zoho.com/app)
- The product screenshots' current font is a neo-grotesque visually consistent with Inter (inferred from glyph shapes in [new-customer-us.png](https://www.zoho.com/books/help/images/contacts/new-customer-us.png) and [zb-dashboard.png](https://www.zoho.com/us/books/help/images/getting-started/zb-dashboard.png)). Gen-1 screenshots use a different, Proxima-Nova-like humanist font (inferred).
- Type hierarchy observed in current screenshots (inferred):
  - Page/module titles and form titles: about 20–24px, regular weight (not bold).
  - Section headings: about 16–18px regular.
  - Body and field text: about 13–14px.
  - Column headers and group labels: about 11–12px uppercase, letter-spaced, grey.
  - Dashboard amounts: large, about 20–22px.
  - Bold is used sparingly (record numbers in the detail header, contact names, active tab).

**Spacing, radius, icons, illustration** (inferred from screenshots, 2x capture assumed):
- Settings left nav is about 230px wide with about 37px row pitch. Settings header band about 53px. Buttons about 30px high. Form rows pitch about 26px for checkbox lists and about 36–38px for input rows. List rows about 40–48px in the current UI (Gen-1 about 60px).
- Corner radius is small: about 3–6px on buttons, inputs and the sidebar active pill; cards about 6–8px. No large pill buttons except the search field.
- Icons are thin-stroke (about 1.5px) monoline outline icons: home, box, bank, cart, bag, stopwatch, person, chart, folder, bell, gear, clock. The 2022 refresh "redesigned icons and tooltips" ([What's New](https://www.zoho.com/us/books/whats-new.html)).
- Illustration style: a faint monochrome line-art doodle pattern (document, box, coin and chart glyphs) behind page header bands (Home and Settings headers). Flat, two-tone blue spot illustrations appear in help/marketing banners, e.g. [expense-banner.png](https://www.zoho.com/books/help/images/expense/banner/expense-banner.png).

**Design-system provenance:**
- Zoho's public "Lyte/Slyte" material concerns Zoho CRM's SlyteUI ("60+ ready to use UI components", components that "automatically inherit the CRM's theme"). I found nothing tying it to Zoho Books. — [SlyteUI in Zoho CRM](https://www.zoho.com/crm/developer/docs/slyteui/)

### Inferences
- **Status color mapping** for the current UI, inferred by combining the dashboard semantics with Gen-1 list colors:
  - Draft: grey.
  - Sent / Open / Viewed: blue.
  - Overdue: orange-red.
  - Paid / Closed / Billed: green.
  - Void: grey. Partially Paid: probably a lighter blue or green.
  - Statuses are shown as colored uppercase text rather than filled pills in tables, and as a diagonal ribbon on document previews.
- The palette is "cool neutral": all greys carry a slight blue/lavender tint (#f7f7ff, #f6f6fa, #6c7184), which keeps the single blue accent harmonious.

### Gaps
- Not available because the app requires sign-in:
  - exact CSS token names and values;
  - the product font file name;
  - base font-size;
  - a spacing scale.
- No public Zoho Books design-system documentation was found.
- No official current-UI status-badge color table was found.
- The values above are pixel samples from compressed PNGs and may deviate by a few units.

---

## Settings page layout pattern and per-module Preferences

### Takeaway
Settings is a full-screen takeover with its own chrome, and has two levels:
- **Home ("All Settings"):** a searchable, card-style grid of grouped categories (since 27 Sep 2023).
- **Leaf page:** a "‹ Back to All Settings" link and a "✕ Close Settings" button in the header, a left nav with a search box and collapsible groups (e.g., Sales ▸ Quotes, Invoices…), and a right content area with a page title and horizontal tabs (General | Field Customization | Validation Rules | Custom Buttons | Related Lists), sectioned forms and a sticky Save.

Module preferences are also reachable from list/detail "More" menus.

### Cited Findings
- 27 Sep 2023, "Fresh Look for Settings": "reorganized Settings with a new card-like interface so you can easily find all the available options at a glance… newly-introduced search bar." — [What's New](https://www.zoho.com/us/books/whats-new.html)
- Navigation wording: "Go to Settings. Under Module Settings, go to Sales and select Invoices." — [Invoice Preferences](https://www.zoho.com/us/books/help/invoice/invoice-preferences.html). Branding: "Go to Settings. Select Branding under Organization." — [Change Theme](https://www.zoho.com/us/books/help/personalize/change-theme.html)
- Settings leaf page (current UI): [invoice/invoice-preferences.png](https://www.zoho.com/books/help/images/invoice/invoice-preferences.png)
  - **Header band:** a faint pattern background; "‹ Back to All Settings" (blue chevron) at left; a bordered "✕ Close Settings" button at right with a red ✕.
  - **Left nav (about 15% width):**
    - A search input at top.
    - Group "🛒 Sales ⌄" (blue, expanded on a light lavender row) with sub-items Quotes, Retainer Invoices, Sales Orders, Delivery Challans, Invoices (active: white text on a solid blue rounded block), Recurring Invoices, Payments Received, Credit Notes, Delivery Note Settings, Packing Slip Settings.
    - Collapsed groups with › chevrons: Purchases, Reminders & Notifications, Users & Roles, Customisation.
    - A thin scrollbar.
  - **Content:** H1 "Invoices", then a tab strip General (bold, blue underline) | Field Customization | Validation Rules | Custom Buttons | Related Lists.
    - Sections are separated by full-width hairlines and each has a 18–20px regular heading ("Invoice Order Number", "Payments", "Invoice QR Code", "Record Locking"): checkbox lists, radio groups, and feature rows with a grey description paragraph plus a right-aligned "Disabled ◯" toggle.
    - Sticky footer with a blue "Save".
- Invoice Preferences content as documented:
  - Options: snail-mail stub/envelope options, "Allow editing of Sent invoice", "Associate and display expense receipts in invoice PDF", Invoice Order Number (SO number vs SO reference), Payments notifications and thank-you notes, Delivery Note and Packing Slip settings.
  - Plus Approvals, Fields, Validation Rules, Record Locking, Buttons, Related Lists.
  - — [Invoice Preferences](https://www.zoho.com/us/books/help/invoice/invoice-preferences.html)
- Per-module approvals: "go to Settings > Sales/Purchases > select a module > click the Approvals tab > select an Approval Type…" (2025). — [What's New](https://www.zoho.com/us/books/whats-new.html)
- Settings help sections (older index): Organization Profile, Opening Balances, Users, Online Payments, Preferences (General, Contacts, Items, Price Lists, Inventory), Sales (Quotes, Sales Orders, Invoices, Recurring Invoices, Credit Notes, Delivery Note Settings, Packing Slip Settings), Purchases, Currencies… — [Settings – Overview](https://www.zoho.com/us/books/help/settings/)
- Help sidebar groups for Settings (current docs): Organization (Organization Profile, Domain Mapping, Locations), Opening Balances, Users & Roles, Preferences, Currencies, Payment Terms, Taxes, Revenue Recognition, Sales Tax Automation, Emails, Reminders, Reporting Tags, Automation (Workflow Rules, Workflow Actions, Schedules, Workflow Logs), PDF Templates, Customization (Custom Fields, Validation Rules, Record Locking, Custom Buttons, Related Lists, Custom Views, Web Tabs), Integrations, Privacy and Security, Connections, Developer and Data (Incoming Webhooks, API Usage, Signals, Web Forms, Data Management). — sidebar of [Invoices help](https://www.zoho.com/us/books/help/invoice/)
- Module preferences shortcut from the record: the detail ••• menu ends with "⚙ Invoice Preferences". — [void-invoice.png](https://www.zoho.com/books/help/images/invoice/void-invoice.png)
- General preferences (Settings → Preferences → General) include module enablement, discount level (line item vs transaction vs both), additional charges (Shipping, Adjustment), salesperson field, and more. — [Preferences help](https://www.zoho.com/us/books/help/settings/preferences.html)

### Inferences
- Settings uses a "takeover" pattern: the global sidebar is replaced by the settings left nav and the header offers explicit Back and Close, so users always exit to the module they came from.
- Every module's settings page uses the same tab set (General / Field Customization / Validation Rules / Custom Buttons / Related Lists, plus Approvals where applicable). This makes the leaf page a reusable template.

### Gaps
- I did not obtain a screenshot of the card-grid Settings home (exact card grouping, card anatomy, icons). The official wording ("card-like interface… at a glance… search bar") is the only evidence.

---

## Responsive behavior at small widths (web)

### Takeaway
I found no official documentation of the web app's responsive breakpoints or small-width behavior. Zoho directs small-screen use to native iOS/Android/Windows apps. Documented web adaptations are limited to:
- horizontal scrolling with up to two pinned columns when a list has more than 8 columns;
- column-width resizing;
- a minimizable sidebar in the customer/vendor portal.

### Cited Findings
- Pinned columns stay "fixed while scrolling horizontally" (more than 8 columns, up to 2 pinned). Column widths adjust up to 420px when there are more than 8 columns. — [What's New](https://www.zoho.com/us/books/whats-new.html) (24 Feb 2025; 19 Jun 2024)
- The portal sidebar minimizes via a hamburger icon (8 Aug 2022). — [What's New](https://www.zoho.com/us/books/whats-new.html)
- The help footer promotes "Get the app on iOS, Android and Windows". Mobile apps have their own appearance and text-size settings. — [Invoices help](https://www.zoho.com/us/books/help/invoice/); [Accounting on the Go Series-22](https://help.zoho.com/portal/fr/community/topic/accounting-on-the-go-series-22)
- Split view reflows table rows into compact multi-line cards in a narrow left pane, a built-in narrow-width list representation. — [payments-received/view-pr.png](https://www.zoho.com/books/help/images/payments-received/view-pr.png)

### Inferences
- The web app is designed as a desktop-width application (sidebar plus wide tables). The split-view compact row is the closest thing to a narrow-layout list pattern.

### Gaps
- Breakpoints, sidebar auto-collapse, and mobile-browser behavior of books.zoho.com are undocumented in official sources found. They could not be tested without an account.

---

### Screenshot index
G1 = Gen-1, G2 = Gen-2, Cur = current UI; dates come from data shown in the screenshot.

**Current / Gen-2:**
- Shell and dashboard (Cur): https://www.zoho.com/us/books/help/images/getting-started/zb-dashboard.png
- Top band (Cur): https://www.zoho.com/books/help/images/tasks/right-corner.png
- Home with dashboard tabs (Cur, 2024+): https://www.zoho.com/books/help/images/custom-dashboards/dashboard-list.png
- Getting Started tab (Cur): https://www.zoho.com/us/books/help/images/home/getting-started-tab/getting-started-tab.png
- Settings leaf (Cur): https://www.zoho.com/books/help/images/invoice/invoice-preferences.png
- Form (Cur): https://www.zoho.com/books/help/images/contacts/new-customer-us.png
- Contact detail (Cur, ~2024): https://www.zoho.com/books/help/images/contacts/contact-transaction.png
- View dropdown, sort menu, customize columns, criteria, columns, visibility (Cur):
  - https://www.zoho.com/books/help/images/custom-module/custom-view.png
  - https://www.zoho.com/books/help/images/custom-module/created-custom-view.png
  - https://www.zoho.com/books/help/images/custom-module/sort.png
  - https://www.zoho.com/books/help/images/custom-module/customize-columns.png
  - https://www.zoho.com/books/help/images/custom-module/table-icon.png
  - https://www.zoho.com/books/help/images/custom-module/custom-view-criteria.png
  - https://www.zoho.com/books/help/images/custom-module/custom-view-columns.png
  - https://www.zoho.com/books/help/images/custom-module/custom-view-visibility-preference.png
- Bulk bar (Cur, 2025): https://www.zoho.com/books/help/images/payments-made/bulk-update-button.png
- Bulk modal (Cur): https://www.zoho.com/books/help/images/payments-made/update-payment-fields-in-bulk.png
- Stepper modal (Cur): https://www.zoho.com/books/help/images/custom-dashboards/new-panel-details.png
- Number series table (Cur): https://www.zoho.com/books/help/images/settings/configure-series.png

**Gen-1:**
- Invoice detail and More menu: https://www.zoho.com/books/help/images/invoice/void-invoice.png
- Record Payment dropdown and banner: https://www.zoho.com/books/help/images/invoice/record-payment.png
- Split view (2019): https://www.zoho.com/books/help/images/payments-received/view-pr.png
- List (2018): https://www.zoho.com/books/help/images/purchase-order/new-po.png
- Form (2019): https://www.zoho.com/books/help/images/purchase-order/create-po.png
- Item table and totals: https://www.zoho.com/books/help/images/bills/new-bill2.png
- Calendar view (2019): https://www.zoho.com/books/help/images/bills/calendar-view.png
- Payment form (2020): https://www.zoho.com/us/books/help/images/invoice/payment.png
- Old view dropdown: https://www.zoho.com/books/help/images/contacts/filter-contacts.png
- Old bulk bar: https://www.zoho.com/books/help/images/contacts/bulk-action.png
- Old custom view page: https://www.zoho.com/books/help/images/contacts/custom-view.png
- Retainer list with old shell (2019): https://www.zoho.com/books/help/images/retainer-invoice/create-ri.png
