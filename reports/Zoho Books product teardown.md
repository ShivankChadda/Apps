# One Document Engine Runs All of Zoho Books

Zoho Books is built from a small set of generic parts that it reuses dozens of times. There is one fixed application shell: a 48px dark-navy top band, a 220px left sidebar grouped by business function, and an optional right-hand widgets pane. There are four screen templates: a list table, a split list-plus-record view, a full-page create form, and a full-screen settings "takeover". There is one document pattern: a header plus line items that moves through a short status sequence (Draft, Sent or Open, Partially Paid, Paid or Closed, Void) and links to neighbouring documents through "Convert to…" actions. On top of these sit one per-module settings tab set (Fields, Validation Rules, Record Locking, Buttons, Related Lists, Approvals, Statuses) and one automation pattern, in which workflow rules bind a trigger and criteria to a library of reusable actions ([Zoho Books demo](https://www.zoho.com/us/books/accounting-software-demo/#/invoices); [Workflow Rules help](https://www.zoho.com/us/books/help/settings/automation/workflow-rules.html)). Everything lives inside an **organization**, the tenant boundary that owns the data, users, plan and country edition. The public REST API mirrors the screens action by action: it has **885 operations across 44 resource groups**, and every call names its `organization_id` ([Zoho Books API OpenAPI bundle](https://www.zoho.com/books/api/v3/openapi-all.zip); [API introduction](https://www.zoho.com/books/api/v3/introduction/)). Six plans, from Free to Ultimate (USD 0–275 per organization per month in the US), switch modules and limits on in a strict ladder. Regional editions insert local tax rules and document types into a few fixed slots without changing the shell ([US plan comparison](https://www.zoho.com/us/books/pricing/pricing-comparison.html)). In Zoho's public demo, the web client is an **Ember.js 3.28** single-page app. It is styled with Bootstrap 5 variables renamed with a `--zf-` prefix, **Inter at 13px**, and one accent blue, **#408dfb**. Zoho runs it in its own data centers on Linux and PostgreSQL rather than on public clouds ([Business Today](https://www.businesstoday.in/latest/corporate/story/we-dont-use-aws-or-azure-sridhar-vembu-clears-air-on-arattai-zohos-desi-tech-backbone-496250-2025-09-30)). Native iOS, Android, Mac and Windows apps cover daily transactions and data capture, while design and configuration stay on the web. Most visual measurements below come from Zoho's no-login demo, rendered on 18 Nov 2026. The demo runs on mock data and may differ from the signed-in production app, but where older help-center screenshots disagree with it, this report treats the demo as current.

## A fixed shell and a three-layer menu frame every screen

Think of the web app as a picture frame that never changes, with the module you are working in shown inside it. The frame has three permanent parts: a dark top band across the full width, a left sidebar listing the modules, and, since July 2025, a slim rail on the far right that opens help and add-on panels ([Navigating Zoho Books](https://www.zoho.com/us/books/help/getting-started/navigating-zoho-books.html); [What's New](https://www.zoho.com/us/books/whats-new.html)). In a 1440px-wide browser window the top band is **48px tall in #21263c**, the sidebar is **220px wide** (72px collapsed), and the right rail takes about 43px. That leaves roughly 1,177px of canvas for content ([demo, Invoices](https://www.zoho.com/us/books/accounting-software-demo/#/invoices)).

### The top band carries only actions that apply everywhere

From left to right, the band holds the Books logo, a clock icon for **Recent Activities** (recently visited records), and a 300×36px search box. The search box's placeholder names the current module and its hotkey ("Search in Invoices ( / )"). A small ▾ inside the box switches the search scope among 25 entities, from Customers and Items through every sales and purchase document to Projects, Timesheet, Documents and Tasks. The scope menu's footer offers "Advanced Search (Alt + /)" and "Search across Zoho (Cmd + /)" ([US demo](https://www.zoho.com/us/books/accounting-software-demo/)). Advanced Search opens a 1,030px modal with a two-column grid of right-aligned labels (number, date range, status, item, account, total range, customer, salesperson, tax, address) and a centered Search/Cancel footer ([demo, Invoices](https://www.zoho.com/us/books/accounting-software-demo/#/invoices)).

The right side of the band holds:

- a "This is a Test organization" label, shown for sandbox orgs;
- the organization name, which opens a right-hand switcher;
- a blue square **"+" Quick Create** button;
- a referral icon, a notifications bell and a settings gear;
- the user's avatar;
- a 3×3 grid that launches other Zoho apps.

([Navigating Zoho Books](https://www.zoho.com/us/books/help/getting-started/navigating-zoho-books.html); [US demo](https://www.zoho.com/us/books/accounting-software-demo/)). In May 2023 Zoho moved Help & Support out of the band and into the profile menu, so the band now carries only global actions ([What's New](https://www.zoho.com/us/books/whats-new.html)).

Quick Create is a 1,036px mega-menu with five columns under uppercase group headers, and every item has a ⊕ icon ([demo, Invoices](https://www.zoho.com/us/books/accounting-software-demo/#/invoices)).

| Group | Items |
|---|---|
| GENERAL | Add User, Item, Journal Entry, Log Time, Weekly Log |
| INVENTORY | Inventory Adjustments |
| SALES | Customer, Quotes, Invoices, Recurring Invoice, Retainer Invoices, Sales Order, Customer Payment, Credit Notes |
| PURCHASES | Vendor, Expenses, Recurring Expense, Bill, Recurring Bill, Purchase Order, Vendor Payment, Vendor Credit |
| BANKING | Bank Transfer, Card Payment, Owner Drawings, Other Income |

Regional editions add entries here: India adds Delivery Challan and Bills of Supply, and the UAE adds Retail Invoice and Employee Reimbursement. A Custom Modules group arrived in June 2024 ([India demo](https://www.zoho.com/in/books/accounting-software-demo/); [UAE demo](https://www.zoho.com/ae/books/accounting-software-demo/); [What's New](https://www.zoho.com/us/books/whats-new.html)).

The bell, the avatar and record comments all open the same component: a **400px white flyout docked to the right edge**, with a title and a red ✕. The notifications flyout has All and Mentions tabs. The profile flyout contains, from top to bottom ([demo, Invoices](https://www.zoho.com/us/books/accounting-software-demo/#/invoices)):

- the user's name and email;
- the User ID and Organization ID;
- My Account and Sign Out;
- help links: Help Documents, FAQs, Forum, Video Tutorials, Explore Features and Migration Guide;
- Accessibility Preferences;
- a "Need Assistance?" block;
- What's New;
- a link to keyboard shortcuts.

The right rail holds icons for Instant Helper, Announcements, Webinars, Zoho Notebook and "All Sidebar Widgets". Each icon opens a **360px pane that pushes the content narrower instead of covering it**, and a pin icon keeps the pane open. Instant Helper follows the page you are on. On Invoices it shows a help search box, a header reading "Invoices", the video "Learn how to create your first invoice 4:12" and FAQs about invoices ([demo, Invoices](https://www.zoho.com/us/books/accounting-software-demo/#/invoices)). Zoho's help also places an "Ask Zia" AI chat icon in this rail ([AI Features help](https://www.zoho.com/us/books/help/ai-features/ai-features.html)).

### The sidebar groups document lists under business functions

| Sidebar entry (US demo order) | Kind | Children |
|---|---|---|
| Home | Link | Dashboard, Getting Started and Recent Updates tabs |
| Items | Group | Items, Price Lists (Composite Items with the Inventory add-on) |
| Sales | Group | Customers, Quotes, Retainer Invoices, Sales Orders, Invoices, Recurring Invoices, Payments Received, Credit Notes (plus Sales Receipts where enabled) |
| Purchases | Group | Vendors, Expenses, Recurring Expenses, Purchase Orders, Bills, Recurring Bills, Payments Made, Vendor Credits |
| Time Tracking | Group | Projects, Timesheet |
| Banking | Link | One screen for all accounts |
| Filing & Compliance | Group | Country-specific: Sales Tax and Form 1099 in the US; VAT Filing, VAT Payments and Income Tax in the UK |
| Accountant | Group | Manual Journals, Bulk Update, Tax Payments, Tax Adjustments, Currency Adjustments, Transaction Locking (help adds Chart of Accounts, Recurring Journals, Budgets, Fixed Assets, Netting) |
| Reports | Link | Reports Center |
| Documents | Link | File inbox |
| Conditional groups | Group | Inventory (add-on), More (custom modules), Web Tabs, Payroll (India), E-Invoicing (UAE) |
| Configure Features | Button | Modal that switches modules on |

The table draws on the [US demo](https://www.zoho.com/us/books/accounting-software-demo/#/home/dashboard), [Sales Receipts help](https://www.zoho.com/us/books/help/sales-receipts/), [Chart of Accounts help](https://www.zoho.com/us/books/help/accountant/chart-of-accounts.html), [Netting help](https://www.zoho.com/us/books/help/accountant/netting.html), [Custom Modules basics](https://www.zoho.com/us/books/help/custom-modules/basic-functions.html), [Web Tabs help](https://www.zoho.com/us/books/help/web-tabs.html), [India Payroll help](https://www.zoho.com/in/books/help/payroll/) and [UAE e-Invoicing help](https://www.zoho.com/ae/books/help/e-invoicing/).

The structure has three layers:

1. Groups named after a business function.
2. One list page per document type.
3. Individual record pages.

Areas that are a single screen (Home, Banking, Reports, Documents) are plain links instead of groups. Groups behave as an accordion: opening one closes the others. Hovering any child shows a "+" that creates a record of that type without visiting the list first. The active item is a **filled #408dfb rounded pill with white text**, and sub-items are indented 40px. Rows are 200×30px with 6px corners, 13px text and line icons. A button at the bottom collapses the sidebar to a 72px icon rail. In the rail, labels shrink and get cut off ("Purchas…", "Docume…"), and a small corner triangle marks modules that have children ([demo, Invoices](https://www.zoho.com/us/books/accounting-software-demo/#/invoices)).

Users cannot reorder or pin groups. Four things decide which entries appear: plan, add-ons, the user's role, and the "Configure Features" modal ([US demo](https://www.zoho.com/us/books/accounting-software-demo/); [General preferences](https://www.zoho.com/us/books/help/settings/preferences.html)). The modal has toggles for Quotes, Retainer Invoices, Timesheet, Price List, Sales Orders, Purchase Orders and Inventory. It notes that invoices, credit notes, expenses, bills and recurring invoices are always on. A disabled module disappears from the sidebar but stays reachable through the API ([General preferences](https://www.zoho.com/us/books/help/settings/preferences.html)). Branding settings choose a **Dark Pane or Light Pane** and an accent color: Blue by default, or Green, Yellow, or a custom hex value. The accent carries over to the customer and vendor portals ([Change Theme help](https://www.zoho.com/us/books/help/personalize/change-theme.html)).

The keyboard is a second navigation system ([Keyboard Shortcuts](https://www.zoho.com/us/books/help/getting-started/keyboard-shortcuts.html); [demo, Invoices](https://www.zoho.com/us/books/accounting-software-demo/#/invoices)).

| Keys | Action |
|---|---|
| Shift+1 to Shift+7 | Jump to Dashboard, Items, Banking, Customers, Vendors, Reports, Documents |
| Shift + letter | Open a document list (Shift+I invoices, Shift+B bills) |
| C, then a letter | Create a record (C then I for a new invoice) |
| N | New record in the current list |
| E, M, P, D | Edit, mail, print or download the open record |
| / | Focus search |
| S | Open Settings |
| O | Open the organization list |
| Shift+? | 840px overlay where every binding can be edited, disabled or reset |

### Home, Reports and Documents work as hubs rather than lists

**Home** opens on a header with the org's logo tile, "Hello, <user>" and the org name over a faint line-art pattern. Below it are tabs for Dashboard, Getting Started and Recent Updates. The help also lists an Announcements tab, but the 2026 demo no longer shows it ([Home help](https://www.zoho.com/us/books/help/home/); [demo, Dashboard](https://www.zoho.com/us/books/accounting-software-demo/#/home/dashboard)).

The default dashboard has eight fixed panels, and every figure drills through to the report behind it ([Home help](https://www.zoho.com/us/books/help/home/)).

| Panel | What it shows |
|---|---|
| Total Receivables | Current versus overdue amounts, with a stacked bar and a "+ New" shortcut |
| Total Payables | Current versus overdue amounts, with a stacked bar and a "+ New" shortcut |
| Cash Flow | Line chart of start, incoming, outgoing and end balances |
| Income and Expense | Bar chart with a cash/accrual toggle |
| Top Expenses | Pie chart |
| Projects | Unbilled hours and expenses |
| Bank and Credit Cards | Account balances |
| Account Watchlist | Chosen accounts |

Dashboard cards are white, with a 1px #e9eaf5 border, **12px corners** and a 48px #f7f8fc header strip ([demo, Dashboard](https://www.zoho.com/us/books/accounting-software-demo/#/home/dashboard)). On Elite and Ultimate, users can build extra dashboards from predefined panels, report panels and marketplace widgets. Panels reorder by dragging, report panels resize from the corners, and each panel sets its own period, chart type (pie, bar, line), axes, sort and maximum number of data points. Dashboards can be shared as Only Me, Everyone, or with selected users and roles, with view or manage rights. The default dashboard itself can never be edited ([Custom Dashboards help](https://www.zoho.com/us/books/help/home/custom-dashboards.html)). The Getting Started tab is an onboarding page: a centered welcome, a wide video card, and a two-column grid of task cards ("Configure Chart of Accounts", "Enter Opening Balances"). Each card has an icon, a description, a tinted "Configure" button and a "Watch & Learn" link ([Getting Started screenshot](https://www.zoho.com/us/books/help/images/home/getting-started-tab/getting-started-tab.png)). Some modules have their own small dashboards: the Invoices list opens with a Payment Summary strip, and Banking has a dashboard of its own ([demo, Invoices](https://www.zoho.com/us/books/accounting-software-demo/#/invoices); [Banking Dashboard help](https://www.zoho.com/us/books/help/banking/dashboard.html)).

**Reports** opens the Reports Center, rebuilt in May 2024. A left pane lists Home, Favorites, Shared Reports and the report categories. The main table has columns for Report Name, Category, Created By, Last Visited and Schedule, plus a favourite star and a search bar ([demo, Reports](https://www.zoho.com/us/books/accounting-software-demo/#/reports); [What's New](https://www.zoho.com/us/books/whats-new.html)). The demo lists 60 reports in 12 categories: Business Overview, Sales, Inventory, Receivables, Payments Received, Recurring Invoices, Payables, Purchases and Expenses, Projects and Timesheet, Accountant, Currency, and Activity. Zoho's store listings advertise "70+ reports", and plan-gated and regional reports account for the difference ([demo, Reports](https://www.zoho.com/us/books/accounting-software-demo/#/reports); [Microsoft Store listing](https://storeedgefd.dsx.mp.microsoft.com/v9.0/products/9WZDNCRDFD1F?market=US&locale=en-US&deviceFamily=Windows.Desktop)).

Every report page uses the same layout ([demo, Profit and Loss](https://www.zoho.com/us/books/accounting-software-demo/#/reports/profitandloss); [Business Overview reports](https://www.zoho.com/us/books/help/reports/business-overview.html); [Sales reports](https://www.zoho.com/us/books/help/reports/sales.html)):

- a category breadcrumb, title and date range;
- an Export menu;
- a filter bar: Date Range, Report Basis (cash or accrual), More Filters (reporting tags, branches, projects) and Run Report;
- a Table View / Chart View toggle;
- Compare With, for comparing periods or years;
- Customize Report Columns, a chooser that moves columns between an Available list and a Selected list;
- Group By, on some reports.

Users can save any customized report as a custom report. The allowance is none on Free, then 10, 25 and 50 on Standard, Professional and Premium, and unlimited above that. Users can also schedule email delivery, share a report with View or View-and-Export rights, and set a PDF layout covering paper size, orientation, fonts, margins and table density ([US plan comparison](https://www.zoho.com/us/books/pricing/pricing-comparison.html); [Manage Reports](https://www.zoho.com/us/books/help/reports/manage-reports.html); [Custom Reports](https://www.zoho.com/us/books/help/reports/custom-reports.html)). Exports run instantly up to 5,000 records as PDF, or 20,000 as CSV, XLS or XLSX. Larger exports run in the background, up to 100,000 records (1,000,000 on Elite and Ultimate) ([US pricing](https://www.zoho.com/us/books/pricing/)). Draft documents never appear in reports ([Reports help](https://www.zoho.com/us/books/help/reports/)).

**Documents** is an inbox for files waiting to become records. Files arrive in several ways ([Documents help](https://www.zoho.com/us/books/help/documents/documents.html)):

- upload or drag-and-drop;
- cloud import from Google Drive, Dropbox, Box, OneDrive and others;
- the mobile apps;
- email to an address unique to the organization;
- bank statements auto-forwarded to a dedicated inbox.

An OCR (text-recognition) feature called Autoscan reads the date, amount, merchant and line items in 15 languages. It marks each file "Scan in progress", "Processed" or "Unreadable". A file leaves the inbox once it is attached to or matched with an expense, bill or bank transaction, or once it is filed into a folder. Folders have their own user permissions ([Documents help](https://www.zoho.com/us/books/help/documents/documents.html)). The screen has a left pane (All Documents, Inboxes, Folders, Trash) and a file table with columns for File Name, extracted Details, Uploaded By and Uploaded On, plus an "Add to" action ([demo, Documents](https://www.zoho.com/us/books/accounting-software-demo/#/documents/inbox)). Scans are metered: 50 a month on Free, 200 on Standard and Professional, and 1,000 on Premium and above ([US pricing](https://www.zoho.com/us/books/pricing/)).

The organization sits above all of this. Each business is a separate organization with its own data, settings, plan, users and country edition, and each is priced separately. The org name in the top band opens a switcher. Its "Manage" link opens a page where you can create a new org, either blank or by cloning another org's settings, and mark one org as the default ([More Actions help](https://www.zoho.com/us/books/help/personalize/more-actions.html); [US pricing](https://www.zoho.com/us/books/pricing/)).

## Six plans and regional editions switch modules on without rearranging them

Zoho sells Books per organization per month in six tiers, and features unlock in a strict ladder. Navigation follows the same ladder: a higher plan adds sidebar entries and settings tabs, never new kinds of screen.

| | Free | Standard | Professional | Premium | Elite | Ultimate |
|---|---|---|---|---|---|---|
| USD per org per month (monthly / yearly billing) | 0 | 20 / 15 | 50 / 40 | 70 / 60 | 150 / 120 | 275 / 240 |
| Users included | 1 + 1 accountant | 3 | 5 | 10 | 10 | 15 |
| Invoices per year | 1,000 | 5,000 | 10,000 | 25,000 | 100,000 | 100,000 |
| API requests per day | 1,000 | 2,000 | 5,000 | 10,000 | 10,000 | 10,000 |
| Workflow rules | – | – | 10 | 200 | 200 | 200 |
| Custom modules | – | – | – | 10 | 10 | 25 |
| Locations | – | – | – | 3 | 8 | 8 |
| What the tier adds | Quotes, invoices, recurring invoices, credit notes, expenses, bank reconciliation, reports, custom views, customer portal, documents | Bank feeds, custom fields, reporting tags, custom reports, transaction locking, recurring expenses | Sales and purchase orders, bills, vendor credits, multi-currency, stock tracking, projects and timesheets, custom roles, workflow rules, approvals, tasks | Custom modules, validation rules, buttons, related lists, record locking, functions, webhooks, schedulers, web tabs, vendor portal, budgets, fixed assets, Zia AI, report builder | Blueprints, dashboard customization, warehouses, serial and batch tracking, marketplace sales channels | Zoho Analytics-based BI |

Figures are for the US edition, from [US pricing](https://www.zoho.com/us/books/pricing/) and the [US plan comparison](https://www.zoho.com/us/books/pricing/pricing-comparison.html).

A 14-day trial covers every paid plan and **puts new orgs on Premium by default**. Plans are changed under Settings > Manage Subscriptions, which opens the Zoho Store ([Plans help](https://www.zoho.com/us/books/help/plan/)). Add-ons are priced per unit ([US pricing](https://www.zoho.com/us/books/pricing/)):

| Add-on (US) | Price |
|---|---|
| Extra user | USD 3 per user per month |
| 50 more autoscans | USD 10 |
| Extra location | USD 12 each |
| BillPay (vendor payments and PO matching) | USD 69 |

The Free plan can't buy add-ons other than autoscans. The US Free plan stays free only while annual revenue is under USD 50K. Help articles carry an "Available Plans" badge, so the documentation tracks the gating ([Web Tabs help](https://www.zoho.com/us/books/help/web-tabs.html)). Some published limits disagree. The comparison page lists scheduled reports as 5/5/50/200/200/200, while the pricing FAQ gives 5, 50 and 200, so the Standard-plan figure is uncertain ([US plan comparison](https://www.zoho.com/us/books/pricing/pricing-comparison.html); [US pricing](https://www.zoho.com/us/books/pricing/)).

Zoho runs dedicated editions for the US, UK, India, UAE, Saudi Arabia, Australia, Bahrain, Canada, France, Germany, Kenya, Kuwait, Mexico, Nigeria, Oman, Qatar, Singapore and South Africa. A Global edition with generic tax rates and tax groups covers everyone else ([Global pricing](https://www.zoho.com/books/pricing/); [US pricing](https://www.zoho.com/us/books/pricing/)). All editions share the shell, Home, Reports and Documents. Regional differences land in five fixed slots ([India demo](https://www.zoho.com/in/books/accounting-software-demo/); [UK demo](https://www.zoho.com/uk/books/accounting-software-demo/); [UAE demo](https://www.zoho.com/ae/books/accounting-software-demo/)):

1. Extra entries under Sales: Delivery Challans and e-Way Bills in India, and Delivery Challans in the UK, UAE and KSA.
2. The entries under the Filing & Compliance group.
3. Settings > Taxes & Compliance.
4. Extra Quick Create items.
5. Extra report categories.

| Edition | What it adds | Sources |
|---|---|---|
| US | Sales Tax, Form 1099 and W-9, check printing, Avalara | [US plan comparison](https://www.zoho.com/us/books/pricing/pricing-comparison.html); [Form 1099 help](https://www.zoho.com/us/books/help/1099/1099.html) |
| UK | VAT Filing, VAT Payments and Making Tax Digital income tax under Filing & Compliance; CIS; CT600 corporation tax | [UK demo](https://www.zoho.com/uk/books/accounting-software-demo/); [UK MTD for Income Tax help](https://www.zoho.com/uk/books/help/mtd-it/making-tax-digital.html); [UK plan comparison](https://www.zoho.com/uk/books/pricing/pricing-comparison.html) |
| India | GST returns, e-invoicing through the government IRP, e-Way Bills, TDS, a Payroll sidebar entry; sales orders, purchase orders and stock tracking on the Free plan (Professional in the US) | [India plan comparison](https://www.zoho.com/in/books/pricing/pricing-comparison.html); [India help contents](https://www.zoho.com/in/books/help/getting-started/welcome.html); [India Payroll help](https://www.zoho.com/in/books/help/payroll/) |
| UAE | Tax items under Accountant; a top-level E-Invoicing entry on the Peppol network (voluntary pilot from 1 Jul 2026, mandatory for businesses above AED 50M from 1 Jan 2027); e-invoicing sold in transaction packs | [UAE demo](https://www.zoho.com/ae/books/accounting-software-demo/); [UAE e-Invoicing help](https://www.zoho.com/ae/books/help/e-invoicing/); [UAE plan comparison](https://www.zoho.com/ae/books/pricing/pricing-comparison.html) |
| Saudi Arabia | Phase-2 e-invoicing: invoices pushed to ZATCA's Fatoora portal | [KSA Phase-2 help](https://www.zoho.com/sa/books/help/e-invoicing/phase-2.html) |

Prices are set locally rather than converted. The Standard plan costs ₹899 a month in India, £12 in the UK, 69 dirhams or riyals in the UAE and KSA, and USD 12 in the Global edition, against USD 20 in the US ([India plan comparison](https://www.zoho.com/in/books/pricing/pricing-comparison.html); [UK plan comparison](https://www.zoho.com/uk/books/pricing/pricing-comparison.html); [UAE plan comparison](https://www.zoho.com/ae/books/pricing/pricing-comparison.html); [Global pricing](https://www.zoho.com/books/pricing/)).

## Four screen templates repeat across every module

Almost every page in Zoho Books uses one of four templates:

1. a list;
2. a split view, with the list on one side and the open record on the other;
3. a full-page form;
4. a full-screen settings page.

A shared kit of dropdowns, flyouts and modals sits on top of these templates. The measurements below are computed values taken from the live demo at 1440×900 ([demo, Invoices](https://www.zoho.com/us/books/accounting-software-demo/#/invoices); [demo, invoice detail](https://www.zoho.com/us/books/accounting-software-demo/#/invoices/2); [demo, New Invoice](https://www.zoho.com/us/books/accounting-software-demo/#/invoices/new)).

| Template element | Measured specification |
|---|---|
| List header | 65px tall; view-switcher title 18px/600 in #212529 with a blue chevron; "+ New" split button 69×33px in #408dfb; "•••" button 32×32px in #f5f5f5 with a #dddddd border |
| Summary strip | Card in #f9f9fb with a 1px #ebeaf2 border and 10px radius; heading 12px/500, uppercase, grey |
| Table header row | 39px tall; #f9f9fb; 11px/600 uppercase in #6c718a; padding 10px 15px |
| Table body row | 51px tall; 13px/400 black text on a 20.8px line height; record-number link 13px/500 in #1c5bd9; status in 12px uppercase colored text |
| Row hover / selected | Inset tint #f6f6fa / background #f1f1fa |
| Split view | List pane 360px wide with 92px three-line cards; detail pane about 817px |
| Detail header and toolbar | Header 66px, white, title 18px/600; toolbar 40px in #f7f8fc, 13px items divided by 1×20px hairlines |
| Document preview | Max width 8.27in (A4 paper width); 1px #e9eaf5 border; 114×114px diagonal status ribbon |
| Form | Title 22.1px/400; 180px label column; 329px fields; 34px inputs with a 1px #d7d5e2 border and 6px radius |
| Form footer | Sticky bar 67px tall; shadow `0 -4px 5px -3px rgba(0,0,0,.1)` |
| Modal | Attached to the top edge of the window; width tokens of 500, 700, 840 and 1,030px (a 600px modal was also seen); header 52px in #f9f9fb; backdrop #191c29 at 70% |
| Flyout / widget pane | Flyout 400px from the right edge; widget pane 360px, pushes content aside |

### List pages turn the title into a view switcher

The list template has a 65px header, and its title is itself a dropdown. Clicking "All Invoices ▾" opens a searchable menu with collapsible groups (Favorites, Default Filters, Created By Me), each showing a count badge. Each view has a star for marking it a favourite, and a "+ New View" link stays fixed at the bottom ([demo, Invoices](https://www.zoho.com/us/books/accounting-software-demo/#/invoices)). The Invoices module ships with twelve system views: All, Draft, Pending, Pending Approval, Approved, Client Viewed, Partially Paid, Unpaid, Overdue, Payment Initiated, Paid and Void. Each is a saved filter on the status field. A custom view is a short form with four parts:

1. A name, with a favourite checkbox.
2. Criteria rows of field, comparator and value, with "+ Add Criterion" for more.
3. A column chooser that moves fields from Available to Selected and orders them by drag.
4. Visibility: Only Me, Selected Users & Roles, or Everyone.

Custom views are available on every plan, including Free ([Views help](https://www.zoho.com/us/books/help/settings/customization/custom-views.html)).

Two buttons sit on the right of the header. The first is a blue "+ New" split button whose caret offers related creations such as New Recurring Invoice and New Credit Note. The second is a grey "•••" More menu ([demo, Invoices](https://www.zoho.com/us/books/accounting-software-demo/#/invoices)), which holds:

- Sort by ›
- Import
- Export › (the whole module or the current view)
- Preferences
- Manage Custom Fields
- Online Payments
- Refresh List
- Reset Column Width

Some modules put a summary card below the header. On Invoices, "Payment Summary" shows Total Outstanding Receivables, Due Today, Due Within 30 Days, Overdue and Average Days to Get Paid. Bills has no summary card ([demo, Invoices](https://www.zoho.com/us/books/accounting-software-demo/#/invoices); [demo, Bills](https://www.zoho.com/us/books/accounting-software-demo/#/bills)).

The table has three kinds of column. At the far left, a pinned 60px column holds a sliders icon (for Customize Columns and Wrap Text) and a select-all checkbox. Data columns follow at a default width of 150px. At the far right, a 50px column holds a magnifier that opens Advanced Search ([demo, Invoices](https://www.zoho.com/us/books/accounting-software-demo/#/invoices)). Column headers are uppercase and grey, and clicking one sorts by it, with an arrow showing the direction. Columns can be dragged wider, up to 420px. When a list has more than eight columns, up to two can be pinned ([What's New](https://www.zoho.com/us/books/whats-new.html)). Customize Columns is a 500px modal that lists every available field, custom fields included. Each field has a drag handle and a checkbox, except mandatory columns, which show a lock. A counter reads, for example, "8 of 19 Selected". In the rows, record numbers are blue links, amounts are right-aligned, and status shows as **colored uppercase text, not a filled pill** ([demo, Invoices](https://www.zoho.com/us/books/accounting-software-demo/#/invoices)).

Hovering a row tints it, but no buttons appear on the row. To act on records you select them. Selecting rows hides the summary strip and replaces the header with a bulk-action bar ([demo, Invoices](https://www.zoho.com/us/books/accounting-software-demo/#/invoices)) that holds:

- Print;
- Download ▾, as one PDF or a ZIP of separate PDFs;
- actions specific to the module, such as "Mark As Sent";
- Delete;
- a round count badge reading "N Selected";
- "Esc ✕" to clear the selection.

Bulk Update opens a modal that sets one field across all the selected records ([Other Actions in Invoices](https://www.zoho.com/us/books/help/invoice/other-actions.html); [bulk-update modal screenshot](https://www.zoho.com/books/help/images/payments-made/update-payment-fields-in-bulk.png)). A sticky footer shows "Total Count: View", which counts only when clicked, a per-page selector (10, 25, 50, 100 or 200, default 50) and a "‹ 1 – 18 ›" pager. The same template serves very different records by changing only the columns. Customers lists Name, Company, Email, Work Phone, Receivables and Unused Credits. Recurring Invoices lists Profile Name, Frequency, Last and Next Invoice Date, and an Active/Stopped status ([demo, Customers](https://www.zoho.com/us/books/accounting-software-demo/#/contacts); [demo, Recurring Invoices](https://www.zoho.com/us/books/accounting-software-demo/#/recurringinvoices)).

### Opening a record splits the page into list and document

Clicking a row keeps the list on screen but shrinks it to a 360px column. Each row becomes a 92px card with three lines: name and amount, then number and date, then status and icons. The record opens in a pane of about 817px on the right ([demo, invoice detail](https://www.zoho.com/us/books/accounting-software-demo/#/invoices/2)). The pane stacks five layers ([demo, invoice detail](https://www.zoho.com/us/books/accounting-software-demo/#/invoices/2)):

1. A 66px header with the record number, a Comments button and a red ✕.
2. A 40px light-grey toolbar of text-and-icon actions separated by hairlines. The invoice toolbar is shown below.
3. Contextual cards. First a credits line ("Credits Available … Apply Now"). Then a **"WHAT'S NEXT?" card** with a thick left border, a sparkle icon, one sentence naming the next step and a small primary button. Then a promotional strip for setting up payment gateways.
4. The document itself: a white "paper" the width of an A4 page, with a diagonal ribbon in the corner in the status color. Hovering over it shows a "Customize ▾" button for its PDF template.
5. A dashed sub-tab strip for related data such as the Journal.

| Invoice toolbar button | Menu contents |
|---|---|
| Edit | (none) |
| Send Email | (none) |
| Share | (none) |
| PDF/Print ▾ | PDF, Print, Delivery Note, Packing Slip |
| Record Payment ▾ | Record Payment, Write Off |
| ••• | Make Recurring, Create Credit Note, Clone, View Journal, Delete, Invoice Preferences |

Share opens a 600px modal that creates a public link with an expiry date. By default the link expires 90 days after the due date ([demo, invoice detail](https://www.zoho.com/us/books/accounting-software-demo/#/invoices/2); [Other Actions in Invoices](https://www.zoho.com/us/books/help/invoice/other-actions.html)).

Toolbars change by document type and status, which is how one template carries every lifecycle ([demo, Quote](https://www.zoho.com/us/books/accounting-software-demo/#/quotes/2); [demo, Sales Order](https://www.zoho.com/us/books/accounting-software-demo/#/salesorders/4000000079701); [demo, Bills](https://www.zoho.com/us/books/accounting-software-demo/#/bills)).

| Document | Toolbar actions that differ from the invoice |
|---|---|
| Quote | Convert ▾ (to invoice or sales order), Mark as Declined |
| Sales order | Mark as Confirmed, Convert to Purchase Order |
| Draft bill | Convert to Open |

Zoho is moving this template to a new design one module at a time. Quotes already use the newer layout, on a #fafafc background ([demo, Quote](https://www.zoho.com/us/books/accounting-software-demo/#/quotes/2)). It is a single white card containing:

- "Quote Details" and "Activity" tabs;
- a segmented "Details | PDF" toggle;
- a filled green status badge in place of the ribbon;
- a two-column grid of labels and values;
- the customer, items, totals, notes and terms.

Sales orders use an in-between design with a "Show PDF View" switch ([demo, Sales Order](https://www.zoho.com/us/books/accounting-software-demo/#/salesorders/4000000079701)).

Contact records, for customers and vendors, use a separate "profile" template that appears in help screenshots ([contact detail screenshot](https://www.zoho.com/books/help/images/contacts/contact-transaction.png); [Other Actions for Customers/Vendors](https://www.zoho.com/us/books/help/contacts/other-actions.html)). Its header has an Edit button, an attachment button and a primary "New Transaction ▾" button. Below that are tabs for Overview, Comments, Transactions, Related Lists, Mails and Statement. The Overview tab has two columns. The left column is grey and holds a contact card plus collapsible sections for address and other details. The right column holds a table of receivables by currency and a six-month income chart. The demo's mock backend did not render contact details, so this layout comes from a 2023–2024 screenshot, not from live inspection ([demo, customer](https://www.zoho.com/us/books/accounting-software-demo/#/contacts/7000000007971)).

### Create forms are label-left grids that end in a sticky save bar

"New Invoice" fills the whole content area. Its header has a 22px regular-weight title, a gear for numbering settings, and a close ✕ ([demo, New Invoice](https://www.zoho.com/us/books/accounting-software-demo/#/invoices/new)).

The customer selector comes first, in a light-grey band. It is a 509×34px searchable picker with a blue search button attached. Its dropdown lists each customer with an initial avatar, name and company, filters as you type, and ends with a pinned "⊕ New Customer" link. Choosing a customer expands the band to show:

- a currency chip;
- editable billing and shipping addresses;
- the tax setting;
- a "Customer's Details ›" tab docked at the edge;
- links that pull in related open work, such as "Include 2 Confirmed Sales Orders" or "Include Unbilled Items".

The rest of the header is a grid with a **180px label column and 329px fields**. In order, it holds:

1. Invoice#, numbered automatically. Its gear opens a modal for choosing between automatic numbering (prefix plus next number) and manual entry.
2. Order Number.
3. Invoice Date, Terms and Due Date, on one row.
4. Salesperson.

Required labels are **red (#d6141d) with an asterisk**. Inputs are 34px tall with a 6px radius. On focus they get a blue border and a 3px pale-blue ring ([demo, New Invoice](https://www.zoho.com/us/books/accounting-software-demo/#/invoices/new)).

The line items sit in a card titled "Item Table", which has Scan Item and Bulk Actions links. Each row has a drag handle and six columns: Item Details, Quantity, Rate, Discount (switchable between percent and amount), Tax (grouped options) and Amount. Below the rows are "Add New Row ▾" and "Add Items in Bulk" ([demo, New Invoice](https://www.zoho.com/us/books/accounting-software-demo/#/invoices/new)). A row menu can insert header rows and subtotal rows, and the rate field accepts arithmetic such as 10*12 ([Invoices help](https://www.zoho.com/us/books/help/invoice/); [What's New](https://www.zoho.com/us/books/whats-new.html)). Under the table, Customer Notes sits on the left. On the right is a grey totals block with 10px corners, listing Sub Total, Shipping Charges, Adjustment (its label can be renamed), Round Off and a bold Total.

A full-width grey band below holds:

- Terms & Conditions;
- attachments, labelled "maximum of 10 files, 10MB each" (older help says 5 files of 5MB);
- a prompt to set up a payment gateway;
- an "I have received the payment" checkbox;
- email recipients;
- a pointer to where custom fields are defined.

The footer is a **67px sticky bar** ([demo, New Invoice](https://www.zoho.com/us/books/accounting-software-demo/#/invoices/new)). On the left it has three buttons:

- Save as Draft (secondary);
- Save and Send (primary), whose caret offers Save and Print, Save and Share, and Save and Send Later;
- Cancel.

On the right it shows a "Make Recurring" link and live totals.

Validation runs when you save. Errors don't appear beside each field. Instead, a pale-red alert at the top of the form lists every problem, such as "Select a customer." and "Enter the valid item name or description." Simpler forms such as New Customer use the same grid. They add a tab strip inside the form (Other Details, Address, Contact Persons, Custom Fields, Reporting Tags, Remarks) and end with a Save/Cancel footer ([New Customer screenshot](https://www.zoho.com/books/help/images/contacts/new-customer-us.png)).

### Overlays share one dropdown, flyout and modal language

Every menu uses the same component ([demo, Invoices](https://www.zoho.com/us/books/accounting-software-demo/#/invoices)):

- a white card with a 1px #ebeaf2 border, 6px radius and 4px padding;
- a soft lavender shadow, `0 7px 12px #d7d5e2`;
- 35px items that turn **solid #408dfb with white text** on hover;
- uppercase grey group headers;
- a maximum height of 400px;
- a search box at the top when the list is long.

Modals drop from the **top edge of the window, not the center**. They have no shadow and sit over a navy backdrop at 70% opacity. Each modal has a 52px grey header with a regular-weight 17px title and a red ✕, a white body, and a footer with the primary and secondary buttons aligned left. Widths come from fixed tokens of 500, 700, 840 and 1,030px ([demo, New Invoice](https://www.zoho.com/us/books/accounting-software-demo/#/invoices/new)). Multi-step modals add a numbered stepper, such as "(1) Panel Details › (2) Preferences" ([stepper modal screenshot](https://www.zoho.com/books/help/images/custom-dashboards/new-panel-details.png)).

The remaining overlays follow the same restrained style:

- **Tooltips** are navy pills with 12px white text.
- **Side panels** for comments, notifications and the profile are 400px flyouts with a heavier shadow. The comments panel has a small rich-text box (bold, italic, underline) and an "Add Comment" button ([demo, invoice detail](https://www.zoho.com/us/books/accounting-software-demo/#/invoices/2)).
- **Empty panels** show short, friendly lines such as "No comments yet." and "Uhh... There are no notifications at the moment." ([demo, Invoices](https://www.zoho.com/us/books/accounting-software-demo/#/invoices)).
- **The date picker** is a 256×294px calendar. The selected day is a red-orange square (#b93a25), left over from an older red theme ([demo, New Invoice](https://www.zoho.com/us/books/accounting-software-demo/#/invoices/new)).

Toast notifications could not be triggered in the read-only demo, although the code includes a notification component.

### Settings takes over the full screen and reuses one tab set

Settings replaces both the sidebar and the content area. Its home page, "All Settings", is a searchable grid of cards grouped as Organization Settings, Module Settings, and Extension and Developer Data. Zoho introduced this card layout and search bar in September 2023 ([demo, Settings](https://www.zoho.com/us/books/accounting-software-demo/#/settings); [What's New](https://www.zoho.com/us/books/whats-new.html)). Each individual settings page has three parts ([Invoice Preferences screenshot](https://www.zoho.com/books/help/images/invoice/invoice-preferences.png); [Invoice Preferences help](https://www.zoho.com/us/books/help/invoice/invoice-preferences.html)):

1. A header with "‹ Back to All Settings" on one side and a "✕ Close Settings" button on the other.
2. A left nav, about 230px wide, with its own search box and collapsible groups (for example, Sales ▸ Quotes, Invoices).
3. A content area with the page title, then a tab strip (General, Field Customization, Validation Rules, Custom Buttons, Related Lists), then sections divided by hairlines.

The sections hold checkboxes, radio buttons, and feature rows that pair a grey description with a "Disabled ◯" toggle on the right. A sticky Save button sits at the bottom. The same tab set repeats for every module, and each module's ••• menu links straight to its preferences ([demo, invoice detail](https://www.zoho.com/us/books/accounting-software-demo/#/invoices/2)).

### The web app assumes a desktop window

The web client has no layout for phone screens. The demo page lacks a viewport meta tag, the line of code that tells phone browsers to size a page to the screen ([demo, Invoices](https://www.zoho.com/us/books/accounting-software-demo/#/invoices)). At 390px wide:

- the sidebar collapses to 72px on its own;
- the top band gets cut off;
- table columns shrink to about one character wide;
- the detail toolbar is cut off after Share.

Zoho points small-screen users to its native apps instead ([Invoices help](https://www.zoho.com/us/books/help/invoice/)).

## Thirteen-pixel Inter and one accent blue define the visual system

The look is a "cool neutral" system: dark navy chrome, near-white greys with a faint lavender tint, one saturated blue for anything you can click, and a few colors that signal status. The values below are computed CSS from the demo. The stylesheet takes Bootstrap 5's variables and renames them with a `--zf-` prefix. It injects the user's chosen accent color at runtime as `--primary-color`, so **#408dfb is the default Blue theme, not a fixed brand color** ([demo, Invoices](https://www.zoho.com/us/books/accounting-software-demo/#/invoices)).

| Role | Value |
|---|---|
| Top band and tooltips | #21263c (border #181c2e, text #f0f0f0) |
| Search field on the band | #333850 with a #6c718a border |
| Accent: primary buttons, active nav, focus rings, checked controls, menu hover | #408dfb |
| Text links | #1c5bd9 (hover #1a4291) |
| Sidebar background / hover | #f7f7fe / #eaeafb |
| Content background | #ffffff |
| Subtle surfaces (table header, summary card, totals block, modal header) | #f9f9fb |
| Detail toolbar and dashboard card header | #f7f8fc |
| Borders | #ebeaf2 (cards, menus); #d7d5e2 (inputs); #e9eaf5 (document paper, dashboard cards) |
| Primary text / headings | #000000 / #212529 |
| Secondary text and table headers | #6c718a |
| Required-field label | #d6141d |
| Secondary button | #f5f5f5 fill with a #dddddd border |
| Semantic set | success #22b378; danger #f7525a; warning #fd9134; info #408dfb |
| Chart colors | #64abfd, #61c691, #ef9d65; pie charts #1b6de0, #1fc281, #f9b21d, #9858b8, #ff7a1a |

Status is shown two ways: as colored uppercase text in list rows, and as a filled diagonal ribbon on the document preview ([demo, Invoices](https://www.zoho.com/us/books/accounting-software-demo/#/invoices); [demo, invoice detail](https://www.zoho.com/us/books/accounting-software-demo/#/invoices/2)).

| Status | List text color | Detail ribbon color |
|---|---|---|
| Draft | #879697 | #94a5a6 |
| Open / Sent | #408dfb | #268ddd |
| Overdue | #f76831 | #f59d00 |
| Pending / Pending Approval | #eb6100 | #f59d00 |
| Approved | #31708f | not observed |
| Paid / Partially Paid / Accepted | #22b378 | #1fcd6d |
| Void | #777777 | #474747 |

### Inter at 13px carries the whole type hierarchy

Every element renders in **Inter**, falling back to Source Sans Pro, Helvetica and Arial. The base size is 13px with a 1.6 line height, and the font loads from Zoho's own font server. The CSS defines a size scale of 11, 12, 13, 14, 15, 16, 18 and 22px ([demo, Invoices](https://www.zoho.com/us/books/accounting-software-demo/#/invoices)). Hierarchy comes from size and weight rather than color:

| Text | Size and weight |
|---|---|
| List and detail titles | 18px semibold |
| Form titles | 22px regular |
| Modal titles | 17px regular |
| Dashboard card headers | 16px medium |
| Table headers and section labels | 11–12px uppercase semibold, grey |

Zoho's in-house typeface, ZohoPuvi, is still declared in a variable and downloaded, but the text actually renders in Inter. The sign-in page in front of the app does use ZohoPuvi, with a brighter #159aff button, so it is a separate design surface ([demo, Invoices](https://www.zoho.com/us/books/accounting-software-demo/#/invoices); [books.zoho.com sign-in](https://books.zoho.com/app)).

### Small radii and soft shadows keep surfaces flat

Corners are small and consistent: about 5px on buttons, 6px on inputs, menus and nav pills, and 10–12px on cards. The full radius scale is 2, 4, 6, 10, 15, 16 and 24px, plus a fully rounded pill. Standard heights are listed below ([demo, Invoices](https://www.zoho.com/us/books/accounting-software-demo/#/invoices)).

| Element | Height |
|---|---|
| Button | 33px (27px small) |
| Input | 34px |
| Menu item | 35px |
| Sidebar row | 30px |
| Table row | 51px |

Depth is used sparingly and always soft ([demo, Invoices](https://www.zoho.com/us/books/accounting-software-demo/#/invoices)).

| Surface | Shadow |
|---|---|
| Menus | `0 7px 12px #d7d5e2` |
| Popovers | `0 2px 4px`, 20% grey |
| Flyouts | `-2px 5px 10px`, heavier |
| Document paper | `0 5px 10px`, 8% navy |
| Sticky footer | Cast upward |
| Modals | None |

Icons are thin (about 1.5px) outline icons served as SVG sprites. Illustration is limited to a faint line-art doodle pattern behind page headers and flat two-tone blue drawings in help banners ([shell screenshot](https://www.zoho.com/us/books/help/images/getting-started/zb-dashboard.png); [expense banner](https://www.zoho.com/books/help/images/expense/banner/expense-banner.png)).

### Themes recolor the accent and the sidebar, not the canvas

Users can switch the sidebar between Light Pane and Dark Pane and pick a Blue, Green, Yellow or Red accent, or any hex color. Zoho documents no full dark mode for the web content canvas, which stays white. The mobile apps do offer System, Light and Dark settings ([Change Theme help](https://www.zoho.com/us/books/help/personalize/change-theme.html); [Refreshed Design announcement](https://help.zoho.com/portal/en/community/topic/introducing-a-refreshed-design-to-enhance-your-user-experience-in-zoho-books); [Accounting on the Go Series-22](https://help.zoho.com/portal/en/community/topic/accounting-on-the-go-series-22)). Accessibility Preferences, added in April 2026, can increase text spacing, underline links and strike through disabled buttons. The demo has two of these on by default (0.32px letter spacing and link underlines), which is why its screenshots look slightly airier than the stock app ([What's New](https://www.zoho.com/us/books/whats-new.html); [demo, Invoices](https://www.zoho.com/us/books/accounting-software-demo/#/invoices)). The markup labels its controls for screen readers throughout, using ARIA attributes for sortable headers, comboboxes and expanded or collapsed states. A "Navigate To" shortcut (Alt+0) skips straight to the main content ([What's New](https://www.zoho.com/us/books/whats-new.html)).

### Three design generations still show in the help center

The current look is the third generation ([What's New](https://www.zoho.com/us/books/whats-new.html); [Refreshed Design announcement](https://help.zoho.com/portal/en/community/topic/introducing-a-refreshed-design-to-enhance-your-user-experience-in-zoho-books); [older list screenshot](https://www.zoho.com/books/help/images/purchase-order/new-po.png)):

1. **Before December 2022:** a white shell, a light-grey sidebar, primary buttons in the theme color (often red), and a typeface that resembles Proxima Nova.
2. **The refresh of 30 December 2022:** a reorganized top band and sidebar, redrawn icons, and the accent-plus-pane themes.
3. **Since about 2024:** the navy band, lavender sidebar, Inter and #408dfb.

Traces of the old red default remain in the code. The base `.btn-primary` rule still defines #d64830 before the runtime override replaces it, and the date picker stays red-orange. Zoho evidently restyles through variables and overrides rather than by rewriting components ([demo, Invoices](https://www.zoho.com/us/books/accounting-software-demo/#/invoices)). Many help-center screenshots still show the older generations. They are a reliable guide to structure, but not to current colors.

## Every document follows a short status sequence and converts into the next

Each record has a fixed set of statuses and actions that move it between them; software designers call this a state machine. Zoho Books gives each document type its own small one, and connects them with explicit "Convert to…" actions. A sale flows Quote → Sales Order → Invoice → Payment, and a purchase flows Purchase Order → Bill → Payment. Payments, credits and refunds are separate records that are "applied" to documents, and applying them changes the document's status ([Invoices help](https://www.zoho.com/us/books/help/invoice/); [Invoices API](https://www.zoho.com/books/api/v3/invoices/)).

| Document | Statuses (help and API) | Typical next steps |
|---|---|---|
| Quote (called "estimate" in the API) | Draft, Sent, Accepted, Declined, Expired, Invoiced, Partially Invoiced, plus approval states | Convert to invoice, sales order, retainer invoice or project |
| Sales Order | Draft, Open, Partially Invoiced, Invoiced/Closed, Void, plus custom sub-statuses | Convert to invoice or purchase order |
| Delivery Challan (India) | Draft, Open, Delivered, Returned, Partially Invoiced, Invoiced | Convert to invoice |
| Invoice | Draft, Pending Approval, Approved, Sent, Viewed, Overdue, Partially Paid, Paid, Void, plus a write-off action | Record payment, apply credits, create credit note, make recurring |
| Retainer Invoice | Draft, Sent, Paid, Partially Paid, Partially Drawn, Drawn, Void | Apply to invoices, refund |
| Recurring profile | Active, Stopped, Expired | Generates child invoices, bills or expenses |
| Credit Note / Vendor Credit | Draft, Pending Approval, Open, Closed, Void | Apply to invoices or bills, refund |
| Payment Link | Generated, Viewed, Paid, Expired, Canceled | Creates a payment record |
| Purchase Order | Draft, Open, Partially Billed, Billed, Closed, Cancelled | Convert to bill |
| Bill | Draft, Pending Approval, Open/Unpaid, Overdue, Partially Paid, Paid, Void | Record payment, apply vendor credits, invoice billable lines |
| Payment Made | Draft, Pending Approval, Approval Rejected, Approved, Paid, Void | Apply to bills; excess becomes a vendor credit |
| Expense | Unbilled, Invoiced, Reimbursed, Non-billable | Convert to invoice |
| Bank statement line | Uncategorized, Matched, Categorized, Excluded, Manually Added | Reconciliation |
| Time entry | Unbilled, then optional internal and customer approval, then Invoiced | Pulled onto an invoice |
| Journal | Draft, Published | Reverse |

The table combines the [Estimates API](https://www.zoho.com/books/api/v3/estimates/), [Sales Orders API](https://www.zoho.com/books/api/v3/sales-order/), [Delivery Challans API](https://www.zoho.com/books/api/v3/delivery-challans/), [Invoices API](https://www.zoho.com/books/api/v3/invoices/), [Manage retainers](https://www.zoho.com/us/books/help/retainer-invoice/manage-retainer-invoice.html), [Recurring Invoices API](https://www.zoho.com/books/api/v3/recurring-invoices/), [Credit Notes API](https://www.zoho.com/books/api/v3/credit-notes/), [Manage payment links](https://www.zoho.com/us/books/help/payment-links/manage-links.html), [Manage POs](https://www.zoho.com/us/books/help/purchase-order/manage-po.html), [Manage bills](https://www.zoho.com/us/books/help/bills/manage-bills.html), [Vendor payments](https://www.zoho.com/us/books/help/payments-made/vendor-payments.html), [Manage expenses](https://www.zoho.com/us/books/help/expense/manage-expenses.html), [Bank Transactions API](https://www.zoho.com/books/api/v3/bank-transactions/), [Time Entries API](https://www.zoho.com/books/api/v3/time-entries/) and [Journals API](https://www.zoho.com/books/api/v3/journals/).

### The sales chain runs through the invoice

A quote starts as Draft, which "will not be included in the reports". It becomes Sent when it is emailed or marked as sent. It then becomes Accepted or Declined, either through a user or when the customer clicks Accept in the customer portal or on a public link ([Quotes help](https://www.zoho.com/us/books/help/quote/); [Quote preferences](https://www.zoho.com/us/books/help/quote/preferences.html)). Acceptance can trigger automation. A preference converts accepted quotes into draft invoices, or into invoices that are emailed immediately. A checkbox on the quote creates a retainer (advance-payment) invoice automatically when the customer accepts in the portal ([Quote preferences](https://www.zoho.com/us/books/help/quote/preferences.html); [Retainer functions](https://www.zoho.com/us/books/help/retainer-invoice/functions.html)). Progress invoicing lets one quote be invoiced in parts, by percentage or amount. The quote stays Partially Invoiced until someone chooses "Invoice the Remaining Balance" ([Progress Invoice](https://www.zoho.com/us/books/help/quote/progress-invoice.html)).

Every conversion works the same way. It opens a pre-filled New page, which the user reviews and saves as Draft or with Save and Send. The next document is never created silently ([Convert to Invoice](https://www.zoho.com/us/books/help/quote/convert-to-inv.html); [Sales Order → Invoice](https://www.zoho.com/us/books/help/sales-order/convert-to-invoice.html)). A sales order must be switched to Open before it counts in reports. It closes once it is fully invoiced, and it can cancel items that have not been delivered. Sales orders also support user-defined statuses, each placed under a standard parent status (for example "To be shipped" under Open) ([Sales Order help](https://www.zoho.com/us/books/help/sales-order/); [Sales Order other actions](https://www.zoho.com/us/books/help/sales-order/other-actions.html)).

The invoice is the hub of the sales chain. It moves through these statuses:

1. **Draft → Sent.** The invoice is sent by email, SMS or postal mail, or with "Mark as Sent". **Sent is the gate to money**: payments can be recorded, and public links shared, only after this point ([Invoice other actions](https://www.zoho.com/us/books/help/invoice/other-actions.html)).
2. **Viewed**, when the customer first opens it.
3. **Overdue**, when the due date passes.
4. **Partially Paid**, then **Paid**, as payments or credits are applied.

Sources: [Invoices help](https://www.zoho.com/us/books/help/invoice/); [Invoices API](https://www.zoho.com/books/api/v3/invoices/). An invoice can also be created as Paid in one step by ticking "I have received the payment", unless approvals are switched on. Write Off moves an unpaid balance to bad debt and can be cancelled. Void keeps the record but removes it from reports, and a voided invoice can be turned back into a draft by giving a reason ([Invoice other actions](https://www.zoho.com/us/books/help/invoice/other-actions.html)).

Three scheduled automations run around the invoice:

- **Payment reminders.** There are three by default, set relative to the due date (before, on and after), and they stop once the invoice is paid ([Reminders](https://www.zoho.com/us/books/help/settings/reminders.html)).
- **Late-fee invoices.** These are generated N days after an invoice goes overdue, either as drafts or sent automatically ([Late Fees](https://www.zoho.com/us/books/help/invoice/late-fees.html)).
- **Recurring profiles.** These generate child invoices at **6 AM in the organization's time zone**. A child can be a draft, a sent invoice, or an invoice that is charged to a stored card and then sent. A failed charge is retried up to three times before the profile is suspended ([Recurring invoice details](https://www.zoho.com/us/books/help/recurring-invoice/ri-details.html); [Recurring invoice preferences](https://www.zoho.com/us/books/help/recurring-invoice/preferences.html)).

Payments received are records in their own right. One payment can be split across a customer's open invoices. Any excess is stored as an unused amount that can be applied later or refunded. Deleting a payment restores the invoice balance ([Payments Received basics](https://www.zoho.com/us/books/help/payments-received/basic-functions.html)). Standalone payment links move from Generated to Viewed to Paid, Expired or Canceled, and create a payment record when paid ([Manage payment links](https://www.zoho.com/us/books/help/payment-links/manage-links.html)).

### The purchase chain mirrors the sales chain

Purchase orders move Draft → Open → Partially Billed → Billed. A preference decides whether a PO closes when goods are received, when it is billed, or when both have happened. Only open POs can be cancelled, and cancellation is final ([Manage POs](https://www.zoho.com/us/books/help/purchase-order/manage-po.html); [PO preferences](https://www.zoho.com/us/books/help/purchase-order/preferences.html); [PO functions](https://www.zoho.com/us/books/help/purchase-order/functions.html)). Bills follow the invoice pattern almost exactly: Draft or Open, then Overdue, Partially Paid, Paid, or Void. Saving a bill as Open "creates a corresponding journal", an entry in the accounting ledger. Bills are settled by Payments Made, and any excess "will now be stored as vendor credits" ([Bills basics](https://www.zoho.com/us/books/help/bills/basic-functions.html); [Manage bills](https://www.zoho.com/us/books/help/bills/manage-bills.html); [Vendor payments](https://www.zoho.com/us/books/help/payments-made/vendor-payments.html)). Expenses track billing rather than payment. An expense tagged to a customer stays Unbilled until it is pulled onto that customer's invoice, optionally with a markup. Billable lines on a bill can also become customer invoices, so costs flow back into sales ([Manage expenses](https://www.zoho.com/us/books/help/expense/manage-expenses.html); [Bills functions](https://www.zoho.com/us/books/help/bills/functions.html)). Mileage expenses are calculated from distance × rate, or from odometer readings ([Mileage help](https://www.zoho.com/us/books/help/expense/mileage-expenses.html)).

### Approvals, banking, projects and portals layer onto the core

Approvals are optional and set per module ([Configure approvals](https://www.zoho.com/us/books/help/transaction-approval/configure-approvals.html); [Custom approval](https://www.zoho.com/us/books/help/transaction-approval/custom-approval.html); [Multi-level approval](https://www.zoho.com/us/books/help/transaction-approval/multi-level-approval.html)).

| Approval type | How it works |
|---|---|
| No Approval | Documents skip approval |
| Simple | Any one approver can approve |
| Multi-Level | Up to 10 ordered levels; an admin "Final Approve" can skip the remaining levels |
| Custom | Criteria such as "total ≥ $10,000" send the document to specific approvers, in priority order |

When approvals are on, Pending Approval → Approved or Rejected is inserted between Draft and Sent. Approvers can reject with a reason, and submitters can resubmit or convert the document back to Draft. Email and in-app notifications keep everyone informed ([Approval workflow](https://www.zoho.com/us/books/help/transaction-approval/transaction-approval-workflow.html)). Fourteen modules support approvals, including custom modules ([Configure approvals](https://www.zoho.com/us/books/help/transaction-approval/configure-approvals.html)).

Banking runs its own status sequence. Statement lines arrive from bank feeds or imported files. Feeds come from Yodlee, Token, Plaid or PayPal and refresh every 24 hours for banks that don't require multi-factor sign-in. Imports accept CSV, OFX, QIF, CAMT, MT940 and PDF ([Bank feeds](https://www.zoho.com/us/books/help/banking/feeds.html); [Add bank transactions](https://www.zoho.com/us/books/help/banking/add-transactions.html)). Each line starts as Uncategorized and is then:

- **Matched** to existing transactions. Several transactions can add up to one line, with an adjustment for fees.
- **Categorized**, which creates a new transaction, either inline or in a quick grid of up to 50 lines.
- **Excluded.**

Sources: [Matching](https://www.zoho.com/us/books/help/banking/matching-transactions.html); [Quick categorize](https://www.zoho.com/us/books/help/banking/quick-categorize.html). Transaction rules look at payee, description, reference and amount. They either suggest a category ("Recognized") or apply it automatically ("Categorized") ([Transaction rules](https://www.zoho.com/us/books/help/banking/transaction-rule.html)). Reconciliation compares the statement's closing balance with the cleared amount. A reconciliation can be saved as a draft, and only the latest one can be undone ([Reconciliation](https://www.zoho.com/us/books/help/banking/reconciliation.html)).

Projects link a customer, a billing method, users, tasks and budgets. The billing method is fixed cost, project hours, staff hours, task hours or daily rate. Time entries are logged by hand or with a timer, and stay Unbilled until they are invoiced. Before that, they can optionally require approval from a manager and then from the customer in the portal ([Projects basics](https://www.zoho.com/us/books/help/projects/basic-functions.html); [Projects API](https://www.zoho.com/books/api/v3/projects/); [Internal approval](https://www.zoho.com/us/books/help/timesheet-approval/internal-approval.html); [Customer approval](https://www.zoho.com/us/books/help/timesheet-approval/customer-approval.html)). The portals are self-service views of the same records ([Customer Portal](https://www.zoho.com/us/books/help/customer-portal/); [Vendor Portal](https://www.zoho.com/us/books/help/vendor-portal/)).

| Portal | What the outside party can do |
|---|---|
| Customer portal | Accept quotes, pay invoices, save cards for automatic charging, approve timesheets, download statements, comment |
| Vendor portal | Accept purchase orders; upload invoices, which become bills once the business accepts them |

### Shared rules make every document behave alike

Every transaction record shares one toolkit:

- **Clone** opens a pre-filled New page.
- **Convert** turns the record into the next document type.
- **Void** is usually reversible. **Delete** is blocked while child records exist, such as an invoice with payments, a quote with an invoice, or a credit note with applied credits.
- **Mark as Sent.**
- **Email** with editable templates and a PDF.
- **Share links** are either Public, or Private and Secure (the viewer must verify an email address or phone number), and expire after 90 days by default.
- **Comments & History**, **attachments** and **PDF templates**.
- **Custom statuses**, **validation rules**, **custom buttons** and **workflow automation**.

Sources: [Invoice other actions](https://www.zoho.com/us/books/help/invoice/other-actions.html); [Quote other actions](https://www.zoho.com/us/books/help/quote/other-actions.html); [Delete invoice](https://www.zoho.com/us/books/help/invoice/delete-invoice.html).

Two kinds of locking protect finished work. **Transaction locking** freezes everything dated before a chosen date. It can be set per module group (Sales, Purchases, Banking, Accounts) or for everything, and can be partially unlocked for a set window ([Transaction Lock](https://www.zoho.com/us/books/help/accountant/transaction-lock.html)). **Record locking** freezes individual records under named configurations that block chosen actions or fields for chosen roles ([Record Locking](https://www.zoho.com/us/books/help/settings/customization/record-locking.html)). Numbering is automatic per module, as a prefix plus the next number, and can be overridden on a record. On Premium and above, several number series can be assigned to different locations ([General preferences](https://www.zoho.com/us/books/help/settings/preferences.html); [Locations basics](https://www.zoho.com/us/books/help/settings/organization/locations/basic-functions.html)).

The "What's Next" banner turns each status into a one-click prompt ([Mark as Sent screenshot](https://www.zoho.com/books/help/images/invoice/mark-as-sent.png); [demo, invoice detail](https://www.zoho.com/us/books/accounting-software-demo/#/invoices/2); [demo, Sales Order](https://www.zoho.com/us/books/accounting-software-demo/#/salesorders/4000000079701); [demo, Bills](https://www.zoho.com/us/books/accounting-software-demo/#/bills)).

| Record and status | Banner prompt | Buttons |
|---|---|---|
| Draft invoice | "Invoice has been created. You can email it to your customer or mark it as sent." | Send Invoice, Mark as Sent |
| Partially paid invoice | Asks for the remaining payment | Record Payment |
| Draft sales order | Send it or mark it confirmed | Send Sales Order, Mark as Confirmed |
| Draft bill | Convert it to open | Convert to Open |

Some transitions are inferred rather than documented. Current help doesn't say whether a quote turns Expired automatically on its expiry date, what status a quote takes after it is converted to a sales order, or what label an invoice shows after a write-off ([Estimates API](https://www.zoho.com/books/api/v3/estimates/)).

## A configurable platform layer sits on top of the modules

Beyond the modules, Zoho Books contains a second product: a toolkit for administrators to reshape modules, add new ones and automate them. Most of it needs Premium or above. Almost all of it reuses the same three patterns: a list of rules that can each be marked Active or Inactive, a criteria builder, and a tab on each module's settings page.

### Settings splits into organization-wide and per-module halves

| Half | Group | Contents |
|---|---|---|
| Organization Settings | Organization | Profile, Branding, Custom Domain, Locations, AI Preferences, AI Control Center |
| | Users & Roles | Users, Roles, User Preferences |
| | Taxes & Compliance | Tax rates, tax settings, sales tax automation, e-invoicing (varies by region) |
| | Setup & Configurations | General, Currencies, Opening Balances, Payment Terms, Customer Portal, Vendor Portal |
| | Customization | Transaction Number Series, PDF Templates, Email Notifications, Reporting Tags, Web Tabs |
| | Automation | Workflow Rules, Workflow Actions (Email Alerts, In-app Notifications, Field Updates, Webhooks, Functions, Schedules), Workflow Logs |
| | Reminders & Notifications | Reminders, email and SMS notifications |
| | Online Payments; Integrations & Marketplace | Payment gateways; Zoho apps, WhatsApp, other apps, installed extensions |
| | Developer Data | Incoming Webhooks, Connections, API Usage, Signals, Web Forms, Data Management |
| Module Settings | General | Customers and Vendors, Items, Accountant, Projects, Timesheet, Tasks |
| | Sales; Purchases | One page per document type |
| | Custom Modules | Create Module, plus one entry per custom module |

The tree is assembled from the [Settings help index](https://www.zoho.com/us/books/help/settings/), [General preferences](https://www.zoho.com/us/books/help/settings/preferences.html), [Invoice Preferences](https://www.zoho.com/us/books/help/invoice/invoice-preferences.html) and the [demo Settings page](https://www.zoho.com/us/books/accounting-software-demo/#/settings).

Every module page reuses one tab set: Preferences, Approvals, Fields, Validation Rules, Record Locking, Buttons, Related Lists and, on some modules, Statuses. Each module enables only the tabs it needs ([Invoice Preferences](https://www.zoho.com/us/books/help/invoice/invoice-preferences.html); [Sales Order preferences](https://www.zoho.com/us/books/help/sales-order/preferences.html)). The General page holds the global switches: which modules are enabled, where discounts apply (each line, the whole transaction, or both), additional charges, the salesperson field, the first day of the week, and identity checks for secure links ([General preferences](https://www.zoho.com/us/books/help/settings/preferences.html)).

### Roles combine a permission grid with data segmentation

Every organization comes with four default roles ([Users & Roles](https://www.zoho.com/us/books/help/settings/users.html)).

| Default role | Access |
|---|---|
| Admin | Everything |
| Staff | All modules except Reports, Settings and Accountant |
| Staff (Assigned Customers Only) | All modules, but only data for their assigned customers |
| Timesheet Staff | Logging time only |

On top of these, the org's creator holds a single Super Admin privilege, and an Accountant user type gets a "Manage Clients" console ([Users & Roles](https://www.zoho.com/us/books/help/settings/users.html); [Manage Clients](https://www.zoho.com/us/books/help/accountant/manage-clients.html)). Custom roles (Professional and above) are a grid with one row per module. The base columns are Full, View, Create, Edit and Delete. Transaction modules add Approve and Edit Locked Records, and master records (such as customers and items) add Assign Owner. Each row also has a "More Permissions" pop-over for actions such as Void or Write Off ([custom role screenshot](https://www.zoho.com/books/help/images/settings/custom-role.png); [approver role screenshot](https://www.zoho.com/books/help/images/transaction-approval-new-flow/users-and-roles/new-role-for-approvers.png)).

A second tab, "Segmented Access Control", limits which records a role can see. The limit can be by location, by one access-controlled reporting tag, or by bank account. Each invited user is then tied to specific values and sees only records that match all of them ([Users & Roles](https://www.zoho.com/us/books/help/settings/users.html)). Each custom field can also be set per role to Read and Write, Read Only or Hidden ([Fields help](https://www.zoho.com/us/books/help/settings/customization/custom-fields.html)). Sign-in, two-factor authentication and SAML single sign-on (logging in through a company's own identity system) are handled by the shared Zoho Accounts service, not inside Books ([Access Zoho Books](https://www.zoho.com/books/help/getting-started/access-zb.html); [Zoho Security](https://www.zoho.com/security.html)).

### Fields, rules, buttons and related lists customize each module

The Fields tab (Standard and above) adds custom fields, with about 20 standard data types and 3 AI types ([Field Data Types](https://www.zoho.com/us/books/help/settings/customization/custom-field-data-types.html)).

| Category | Data types |
|---|---|
| Text | Single-line (255 characters), multi-line (36,000 characters), email, URL, phone |
| Numbers | Number, decimal, amount, percent |
| Dates | Date, date-time |
| Choices | Checkbox, dropdown (options can be colored), multi-select (up to 30 picks) |
| Links | Lookup and multi-select lookup to other modules (these create related lists automatically), external lookup to other Zoho apps |
| Other | Auto-number with prefix and suffix, attachment, image, formula |
| AI | Keyword extraction, sentiment, image-to-text |

Each field takes these settings ([Fields help](https://www.zoho.com/us/books/help/settings/customization/custom-fields.html)):

- help text;
- a privacy class: PII (personal data), stored encrypted or plain, or ePHI (health data);
- a uniqueness flag;
- an input format written as a regular expression (a text pattern);
- a default value, either fixed or inherited from a related record;
- toggles for mandatory and for showing on the PDF;
- access per role;
- an API name, assigned automatically.

The number of fields allowed per type grows by plan; for example, 20 text fields on Standard and 50 on Premium ([US plan comparison](https://www.zoho.com/us/books/pricing/pricing-comparison.html)).

On Premium and above, four more tabs unlock ([Validation Rules](https://www.zoho.com/us/books/help/settings/customization/validation-rules.html); [Record Locking](https://www.zoho.com/us/books/help/settings/customization/record-locking.html); [Buttons](https://www.zoho.com/us/books/help/settings/customization/custom-buttons.html); [Related Lists](https://www.zoho.com/us/books/help/settings/customization/related-lists.html)).

| Tab | What it does |
|---|---|
| Validation Rules | Blocks a save that breaks field conditions and shows a custom alert message; can apply only to records that match criteria |
| Record Locking | Named configurations that freeze records |
| Buttons | Up to 10 per module. Each runs a Deluge script, opens a URL with placeholders, or converts a custom-module record into another document. Buttons sit on the detail page, the list action menu or the bulk-action menu, and can show only when criteria match |
| Related Lists | Up to 10 per module. Each shows records linked by a lookup, or a script's output returned as a header-and-data map |

Layouts, and Layout Rules that show, enable, fill or require fields based on conditions, exist only for custom modules ([Layout Rules](https://www.zoho.com/us/books/help/custom-modules/layout-rules.html)).

### Custom modules hand the document engine to users

Custom modules are the clearest sign that Books runs on a generic engine. Premium and Elite allow 10, and Ultimate allows 25. An admin defines a module name, a plural name and a primary field. Then the admin lays out a form in a drag-and-drop builder, using one- or two-column sections, fields, and line-item **tables** with summary totals and formulas ([Custom Modules](https://www.zoho.com/us/books/help/custom-modules/); [Custom Modules basics](https://www.zoho.com/us/books/help/custom-modules/basic-functions.html)). The new module appears under **More** in the sidebar and in Quick Create. It immediately gets the same features as the built-in modules ([Custom Modules basics](https://www.zoho.com/us/books/help/custom-modules/basic-functions.html); [Custom modules in portals](https://www.zoho.com/us/books/help/custom-modules/custom-modules-in-customer-and-vendor-portals.html); [Web Forms](https://www.zoho.com/us/books/help/settings/developer-and-data/web-forms.html); [Custom Modules API](https://www.zoho.com/books/api/v3/custom-modules/)):

- list views, import and export;
- approvals;
- validation and layout rules;
- buttons and related lists;
- record locking;
- visibility in the customer and vendor portals;
- public web forms, with CAPTCHA and a queue for approving submissions;
- HTML PDF templates;
- workflow rules;
- its own REST endpoints (`/books/v3/cm_<name>`).

On Elite and Ultimate, **Blueprints** add a configurable status sequence to a custom module ([Blueprints](https://www.zoho.com/us/books/help/custom-modules/blueprints.html)):

- The options of a dropdown field become the states.
- Transitions link the states. A transition can be simple, sequential or parallel, and is triggered by a button or through the API.
- Each transition can require fields, checklists or messages, and can run actions afterwards.
- Each state can carry an SLA (a time limit) with escalation.
- Blueprints are drafted and then published.
- Zia, Zoho's AI assistant, can generate a blueprint from a prompt.

### Workflow rules connect triggers to a library of reusable actions

Automation separates "what to do" from "when to do it". Actions are defined once per module in a library, and rules then point to them ([Workflow Rules](https://www.zoho.com/us/books/help/settings/automation/workflow-rules.html); [Email Alerts](https://www.zoho.com/us/books/help/settings/automation/workflow-actions/email-alerts.html); [Field Updates](https://www.zoho.com/us/books/help/settings/automation/workflow-actions/field-updates.html); [Webhooks](https://www.zoho.com/us/books/help/settings/automation/workflow-actions/webhooks.html)).

| Action type | What it does | Limit per rule |
|---|---|---|
| Email Alert | Templated email to chosen recipients, with attachments | 5 |
| In-app Notification | Message inside Books | (not stated) |
| Field Update | Sets a field's value | 3 |
| Webhook | Sends the record to another system's URL | 1 |
| Function | Runs custom code | (not stated) |

A rule is built in four steps ([Workflow Rules](https://www.zoho.com/us/books/help/settings/automation/workflow-rules.html)):

1. **Name and module.**
2. **Trigger**, which is one of two kinds:
   - *Event-based:* Created, Edited, Created or Edited, Deleted, Submitted, Approved or Rejected. It can fire only when up to three chosen fields change.
   - *Date-based:* N days before or after a date field, at a set time, once or repeating.
3. **Criteria:** up to 10 groups of 10 conditions each, with an editable AND/OR pattern.
4. **Actions:** run immediately, or after a delay.

Rules run in the background against daily quotas. Workflow Logs record each run with its response, failure reason and retries. Admins can set failure digests and retry policies that are fixed, additive or multiplicative ([Workflow Logs](https://www.zoho.com/us/books/help/settings/automation/workflow-logs.html)).

A webhook sends a message to another system's web address when something happens. In Zoho Books, a webhook ([Webhooks](https://www.zoho.com/us/books/help/settings/automation/workflow-actions/webhooks.html)):

- sends the record as JSON, or as a form or raw body;
- can be signed with HMAC-SHA256 in an `X-Zoho-Webhook-Signature` header, a signature the receiver uses to confirm the message came from Zoho;
- times out after 5 seconds to connect or 10 seconds to read;
- retries 5 times by default, or up to 20;
- raises an alert after 20 consecutive failures.

Code runs in **Deluge**, Zoho's own scripting language. A Deluge function receives the record, the user and the organization as inputs. It can call outside services through named "Connections", which store the sign-in permission (OAuth) for each service ([Functions](https://www.zoho.com/us/books/help/settings/automation/workflow-actions/custom-functions.html); [Connections](https://www.zoho.com/us/books/help/settings/connections.html)). Functions can also be written in Java, Node.js or Python with the `@zohofinance/cli` command-line tool. These get a context object that offers logging, a cache, a queue, file storage and scheduling ([Zoho Finance CLI](https://www.zoho.com/us/books/help/settings/custom-functions-using-zoho-finance-cli.html); [Context Methods](https://www.zoho.com/us/books/help/settings/custom-functions-context-methods.html)).

Three more tools run code or deliver events without a workflow rule ([Schedules](https://www.zoho.com/us/books/help/settings/automation/schedules.html); [Incoming Webhooks](https://www.zoho.com/us/books/help/settings/developer-and-data/incoming-webhooks.html); [Signals](https://www.zoho.com/us/books/help/settings/developer-and-data/signals.html)).

| Tool | What it does |
|---|---|
| Schedules | Run a function on a recurring timetable (20 at most) |
| Incoming Webhooks | Give other systems an authenticated URL that runs a function when called |
| Signals | Turn outside events into in-app notifications |

Plan gating is steep. Professional gets 10 workflow rules, with email, in-app and field-update actions. Premium gets 200, plus functions, webhooks, schedules, incoming webhooks and signals ([US plan comparison](https://www.zoho.com/us/books/pricing/pricing-comparison.html)). An older knowledge-base article cites different limits (workflows only on Professional, Elite and Ultimate, 10 per module). It appears to be out of date ([Workflow limits KB](https://www.zoho.com/books/kb/automation/number-of-workflows.html)).

### Templates and messages send documents out of the app

PDF templates are edited in a form-driven designer with six tabs ([PDF Templates](https://www.zoho.com/us/books/help/settings/pdf-templates/edit-templates.html)).

| Tab | What it controls |
|---|---|
| General | Paper, orientation, margins, font, background |
| Header & Footer | Page header and footer |
| Transaction Details | Which fields appear, and their labels (each can be hidden or renamed) |
| Table | The line-item table |
| Total | The totals section |
| Other Details | Notes, bank details, QR code, signature, annexures |

The designer also offers color themes, cloning a template to another module, and default templates per contact. Custom modules can instead use hand-written HTML/CSS templates. These are rendered by the open-source **Flying Saucer** engine, which supports XHTML and CSS 2.1 only, with no flexbox or grid. Templates use Mustache-style placeholders such as `${invoice.customer_name}`, plus conditionals and loops ([HTML PDF Template](https://www.zoho.com/us/books/help/settings/html-pdf-templates.html)). The demo's on-screen invoice preview isolates its template CSS in a Shadow DOM block labelled "Flying saucer css". That suggests the same markup produces both the on-screen preview and the PDF ([demo, invoice detail](https://www.zoho.com/us/books/accounting-software-demo/#/invoices/2)).

Each module has email templates with placeholders, and Zia can draft them. Senders are verified with DKIM (a check that proves the email really comes from your domain), or mail can be routed through a custom mail server. Open-tracking pixels set a "Client Viewed" status ([Emails](https://www.zoho.com/us/books/help/settings/emails.html); [AI Features](https://www.zoho.com/us/books/help/ai-features/ai-features.html)). SMS goes through Twilio on Premium and above, and WhatsApp messages use credits bought in advance ([Twilio](https://www.zoho.com/us/books/help/integrations/twilio.html); [WhatsApp](https://www.zoho.com/us/books/help/integrations/whatsapp/integrate-with-whatsapp.html)).

### Organization-level switches, several of them one-way

The organization profile sets base currency, fiscal year, report basis, language (about 30 are available), time zone and date format. These settings carry over to the same organization in Zoho's other finance apps ([Organization Profile](https://www.zoho.com/us/books/help/settings/organization/organization-profile.html)). Reporting tags are user-defined dimensions. Their options nest up to five levels deep, attach to a whole document or to individual lines, and act as report filters ([Reporting Tags](https://www.zoho.com/us/books/help/settings/reporting-tag.html)). Locations add up to five levels of business locations plus warehouses, each with its own number series, price list and user access ([Locations](https://www.zoho.com/us/books/help/settings/organization/locations/)).

Four switches cannot be undone once set ([Locations](https://www.zoho.com/us/books/help/settings/organization/locations/); [Reporting Tags](https://www.zoho.com/us/books/help/settings/reporting-tag.html); [Field Data Types](https://www.zoho.com/us/books/help/settings/customization/custom-field-data-types.html); [Organization Profile](https://www.zoho.com/us/books/help/settings/organization/organization-profile.html)):

- enabling Locations;
- enabling advanced reporting tags;
- backfilling an auto-number field onto existing records;
- the organization's country edition.

Several more settings cover data, history and privacy:

- **Exchange rates** update from Open Exchange Rates by default ([Currencies](https://www.zoho.com/us/books/help/settings/currencies.html)).
- **Backups:** Data Management produces a password-protected full backup, at most once every 15 days ([Data Management](https://www.zoho.com/us/books/help/settings/developer-and-data/backup.html)).
- **Exports** from a module stop at 25,000 rows; beyond that, use a backup ([Export help](https://www.zoho.com/us/books/help/import-export/export.html)).
- **Activity Log:** records every create, update and delete. In some regions it also shows each record's past versions side by side ([Activity Logs](https://www.zoho.com/books/help/reports/activity.html)).
- **Privacy settings** restrict personal data (PII) to the roles allowed to see it ([Privacy and Security](https://www.zoho.com/us/books/help/settings/privacy.html)).

The AI layer is off by default. Admins pick a provider and model for each feature ([AI Features](https://www.zoho.com/us/books/help/ai-features/ai-features.html); [Claude Agents](https://www.zoho.com/us/books/help/ai-features/claude-agents.html); [Zoho Books MCP](https://www.zoho.com/us/books/help/mcp/zoho-books-mcp.html)):

- Ask Zia, a chat assistant;
- a "CoCreate" agent that fills in forms on screen;
- report forecasting and anomaly detection;
- AI fields.

An AI Control Center connects Anthropic's Claude agents through an official Zoho Books MCP server, a standard interface that lets AI agents use the app's data and actions.

## An organization-scoped data model sits behind a uniform REST API

An API is the set of web addresses other programs use to read and write the same data the screens show. Zoho publishes a machine-readable specification of the Books API. Parsing it gives **885 operations across 44 resource groups**, and its shape is the clearest map of how the product's data is organized ([OpenAPI bundle](https://www.zoho.com/books/api/v3/openapi-all.zip)).

### Records follow a header, lines, links and attachments pattern

The organization is the root. Every record belongs to one, identified by `organization_id`, and each organization has its own base currency, time zone, language and fiscal year ([API introduction](https://www.zoho.com/books/api/v3/introduction/); [Organizations API](https://www.zoho.com/books/api/v3/organizations/)). Under it sit the master records ([Contacts API](https://www.zoho.com/books/api/v3/contacts/); [Items API](https://www.zoho.com/books/api/v3/items/)):

- **Contacts:** one entity for both customers and vendors, holding contact persons, addresses, payment terms, a price list, a default template for each document type, and custom fields.
- **Items:** goods or services, each with sales, purchase and inventory accounts.
- **Accounts, taxes, currencies, locations, reporting tags and users.**

Transaction documents are a header plus a list of lines (`line_items[]`). An invoice needs only a `customer_id` and line items, and each line references an `item_id`. A line can point back to where it came from through `salesorder_item_id`, `time_entry_ids`, `expense_id` or `bill_item_id`. The server calculates totals, balance, payments, credits applied, viewed flags and timestamps, and returns them as read-only fields ([Invoices API](https://www.zoho.com/books/api/v3/invoices/)).

Money moving between documents is stored in linking records, each with its own ID. A customer payment carries `invoices[{invoice_id, amount_applied}]`, and similar links exist as `bill_payment_id` and `creditnote_invoice_id`. This is what lets one payment cover many invoices, and one invoice receive many payments ([Customer Payments API](https://www.zoho.com/books/api/v3/customer-payments/); [Invoices API](https://www.zoho.com/books/api/v3/invoices/)).

Comments, attachments, custom fields and extension data can attach to any document, identified by its transaction ID and type. **System history and user comments share one stream**, told apart by a `comment_type` field ([Invoices API](https://www.zoho.com/books/api/v3/invoices/); [Extension components](https://www.zoho.com/books/developer/extensions/extension-components.html)). Behind every posted document, the server writes an entry in the accounting ledger. Users can open it with "View Journal", and the API exposes it for each transaction ([Bills help](https://www.zoho.com/books/help/bills/basic-functions.html); [Journals API](https://www.zoho.com/books/api/v3/journals/)).

| Relationship | How the API stores it |
|---|---|
| Organization → every record | `organization_id` on every request |
| Quote → Sales Order → Invoice | `estimate_id`, `invoiced_estimate_id`, line `salesorder_item_id` |
| Sales Order → Purchase Order → Bill | `salesorder_id`, `purchaseorder_ids`, line `purchaseorder_item_id` |
| Payments and credits ↔ invoices and bills | Linking records with `amount_applied` |
| Recurring profile → generated documents | `recurring_invoice_id`, `recurring_bill_id` |
| Project → task → time entry → invoice line | `project_id`, `task_id`, `time_entry_ids` |
| Any document → comments, files, custom fields | `transaction_id` plus `transaction_type` |

The relationships come from the [Invoices API](https://www.zoho.com/books/api/v3/invoices/), [Sales Orders API](https://www.zoho.com/books/api/v3/sales-order/), [Purchase Orders API](https://www.zoho.com/books/api/v3/purchase-order/), [Bills API](https://www.zoho.com/books/api/v3/bills/), [Projects API](https://www.zoho.com/books/api/v3/projects/) and [Time Entries API](https://www.zoho.com/books/api/v3/time-entries/).

### The API mirrors the interface action by action

The API lives at `https://www.zohoapis.com/books/v3`. Eight other domains serve Zoho's other data centers: EU, India, Australia, Japan, Canada, China, Saudi Arabia and the UAE. Every call must include `organization_id` ([API introduction](https://www.zoho.com/books/api/v3/introduction/)). Programs authenticate with OAuth 2.0 tokens issued by Zoho Accounts. Access tokens last one hour, refresh tokens last much longer, and scopes take the form `ZohoBooks.invoices.CREATE` ([OAuth](https://www.zoho.com/books/api/v3/oauth/)). The conventions are the same everywhere ([HTTP methods](https://www.zoho.com/books/api/v3/http-methods/); [Response format](https://www.zoho.com/books/api/v3/response/); [Pagination](https://www.zoho.com/books/api/v3/pagination/); [Errors](https://www.zoho.com/books/api/v3/errors/); [Invoices API](https://www.zoho.com/books/api/v3/invoices/)).

| Convention | How it works |
|---|---|
| Methods | GET reads; POST creates and performs actions; PUT updates; DELETE deletes |
| Responses | Data wrapped as `{"code":0,"message":"success","invoice":{…}}` |
| Lists | Up to 200 items per page, with `page_context.has_more_page` |
| Filters | `filter_by=Status.Overdue`, `search_text`, sort columns, and suffix operators such as `date_start` |
| Errors | An HTTP status code paired with a numeric Books error code |

Every button in the interface has a matching endpoint ([Invoices API](https://www.zoho.com/books/api/v3/invoices/); [Response format](https://www.zoho.com/books/api/v3/response/)).

| Interface action | Endpoint |
|---|---|
| Status changes and other record actions | `POST /invoices/{id}/status/sent`, `/void`, `/submit`, `/approve`, `/writeoff`, `/email`, `/paymentreminder`, `/credits` |
| Conversions | `/invoices/fromsalesorder` |
| Bulk actions | `POST /invoices/email` |
| PDF output | `?accept=pdf` |

The limits are 100 requests per minute per organization, a daily quota set by plan (1,000 to 10,000), and 5 to 10 calls running at once. Every limit returns HTTP 429 when exceeded ([API introduction](https://www.zoho.com/books/api/v3/introduction/)). There is no idempotency key, a token that stops a retried request from being processed twice. Instead, a set of upsert headers (`X-Unique-Identifier-Key`, `-Value` and `X-Upsert`) matches records by a unique custom field, creating the record if no match exists, on 15 resources ([Invoices API](https://www.zoho.com/books/api/v3/invoices/); [OpenAPI bundle](https://www.zoho.com/books/api/v3/openapi-all.zip)). Outgoing events come only from workflow-rule webhooks. Incoming automation uses incoming webhooks or the REST API ([Webhooks](https://www.zoho.com/us/books/help/settings/automation/workflow-actions/webhooks.html); [Incoming Webhooks](https://www.zoho.com/us/books/help/settings/developer-and-data/incoming-webhooks.html)). An API Usage dashboard in Settings shows daily calls and the top modules, apps, IP addresses and users ([API Usage](https://www.zoho.com/us/books/help/settings/developer-and-data/api-usage.html)).

### Organizations, not users, are the tenant and data boundary

In software sold to many customers, a tenant is the walled-off unit that holds one customer's data. In Zoho Books that unit is the organization. Each one "is an independent Zoho Books Organization with it's own organization ID, base currency, time zone, language, contacts, reports". One Zoho login can belong to many organizations. Because the organization is passed as a parameter on each request, one access token can work across all of them ([API introduction](https://www.zoho.com/books/api/v3/introduction/)). Sign-in redirects to Zoho Accounts (`accounts.zoho.com/signin?servicename=ZohoBooks`), which provides social login, the OneAuth MFA app and SAML ([Access Zoho Books](https://www.zoho.com/books/help/getting-started/access-zb.html); [Zoho Security](https://www.zoho.com/security.html)). Organizations live in one of nine regional data centers that match the API domains ([API introduction](https://www.zoho.com/books/api/v3/introduction/)). Zoho does not publish whether tenants are kept apart by separate databases, separate schemas, or rows tagged with an organization key.

## Zoho builds the whole stack itself, from Ember client to owned data centers

### The web client is an Ember single-page app

A single-page application loads the program once and then redraws screens in the browser, instead of fetching a new page for each click. The public demo exposes `window.Ember.VERSION = "3.28.10"` under an application namespace called "zb". It is built with Embroider and webpack, which split the code into chunks loaded per route ([demo, Invoices](https://www.zoho.com/us/books/accounting-software-demo/#/invoices)). It also loads several standard libraries:

| Library | Job |
|---|---|
| jQuery 2.1.0 | General page scripting |
| moment 2.24.0 | Dates |
| Mousetrap | Keyboard shortcuts |
| interact.js | Dragging and resizing |
| NProgress | Loading bar |
| A Bootstrap-style date picker | Calendar fields |

The module registry holds about 23,500 modules. Of these, 17,924 are app code under `zb/` and 4,923 are SVG icons loaded through `ember-svg-jar` ([demo, Invoices](https://www.zoho.com/us/books/accounting-software-demo/#/invoices)). A family of private `@zoho/ember-*` add-ons supplies the component kit:

- dropdowns and autocompletes;
- type-ahead and multi-select pickers;
- date and date-range pickers;
- tooltips, popovers and notifications;
- rich-text editors for comments and email;
- accordions and drag-and-drop;
- a dashboard grid layout (`ember-gridstack`);
- product tours;
- accessibility preferences and focus traps;
- charts.

Styling uses Bootstrap 5 class names (`d-flex`, `btn btn-primary`, `modal fade show`), with Bootstrap's CSS variables renamed to a `--zf-` prefix. The stylesheet defines a full color ramp of 9 color families with 22 steps each. It also has its own app classes, such as `details-menu-bar`, `fixed-actions-bottom` and `ribbon-<status>` ([demo, Invoices](https://www.zoho.com/us/books/accounting-software-demo/#/invoices)).

The bundle contains no React, Vue or Angular. It also contains no Lyte, the in-house front-end framework that Zoho publishes as Lyte/sLyte and uses in Zoho CRM ([demo, Invoices](https://www.zoho.com/us/books/accounting-software-demo/#/invoices); [npm @slyte/core](https://www.npmjs.com/package/@slyte/core); [SlyteUI](https://www.zoho.com/crm/developer/docs/slyteui/)). Two caveats apply. First, the demo includes `ember-cli-mirage`, a library that imitates a server, and it regenerates its placeholder data on every load, so it likely runs against a mock backend. Second, there was no way to check without logging in whether the signed-in app at books.zoho.com runs the same bundle.

### The server side runs on Zoho's own hardware

Zoho says its products "doesn't run on AWS, Microsoft Azure, or Google Cloud". They run on "Zoho's own hardware and software stack, built on top of open-source frameworks like Linux and Postgres", with public clouds used only for regional traffic-switching nodes ([Business Today](https://www.businesstoday.in/latest/corporate/story/we-dont-use-aws-or-azure-sridhar-vembu-clears-air-on-arattai-zohos-desi-tech-backbone-496250-2025-09-30); [Digit](https://www.digit.in/features/general/how-arattai-zoho-apps-are-made-in-india-sridhar-vembu-explains-in-detail.html)). The company describes itself as vertically integrated "from applications to app infrastructure to operating systems to network infrastructure all the way down to data centers". It sells the same internal services to outside developers as **Catalyst**, which offers functions, "Stratus" object storage, an event bus and job scheduling ([Zoho newsroom, Catalyst launch](https://www.zoho.com/news/zoho-opens-up-infrastructure-launches-catalyst.html); [Catalyst](https://catalyst.zoho.com/)). The context object in Books functions offers Stratus storage and Docket scheduling, which points to the same Catalyst-family services ([Context Methods](https://www.zoho.com/us/books/help/settings/custom-functions-context-methods.html)).

Zoho does not say what language the Books backend is written in, but two clues strongly suggest Java. books.zoho.com sets a `JSESSIONID` cookie, the default session cookie of Java web servers, and the function SDK uses the Java namespace `com.zoho.cloud.function` ([books.zoho.com](https://books.zoho.com/app); [Zoho Finance CLI](https://www.zoho.com/us/books/help/settings/custom-functions-using-zoho-finance-cli.html)).

Zoho's security documentation lists these protections ([Zoho Security](https://www.zoho.com/security.html)):

- TLS 1.2/1.3 encryption in transit, with HSTS;
- AES-256 encryption at rest, with an in-house key management service;
- incremental backups every day and full backups every week, kept for three months;
- near-real-time replication to a secondary data center;
- audit logs that customers can see.

Certifications include ISO 27001, 27017, 27018 and 27701; SOC 2 Type 2; a SOC 1 Type 2 report that names Books; PCI DSS for the finance apps; and GoBD, Germany's standard for digital accounting records ([Zoho Compliance](https://www.zoho.com/compliance.html)). Zoho also commits to having no advertising trackers ([Zoho Privacy Commitment](https://www.zoho.com/privacy-commitment.html)), and a scan of the Android app found zero known trackers ([Exodus Privacy](https://reports.exodus-privacy.eu.org/en/reports/com.zoho.books/latest/)).

### Extensions plug into seventeen marked locations

Extensions, whether built by Zoho or by others, are made on Zoho's **Sigma** platform and published after a Zoho Marketplace review. Their on-screen pieces are "widgets". A widget is a small web app that renders inside an iframe (an embedded frame) and talks to Books through a JavaScript SDK called `ZFAPPS`. The SDK loads from `static.zohocdn.com/zohofinance/v1.0/zf_sdk.js`, and widgets can be written in any framework ([Extension components](https://www.zoho.com/books/developer/extensions/extension-components.html); [Widgets framework and hosting](https://www.zoho.com/books/developer/widgets/framework-and-hosting.html)). The SDK defines **17 places a widget can appear** ([Widget locations](https://www.zoho.com/finance/developer/widget-sdk-documentation/books/v1/locations/overview/)):

| Area | Widget locations |
|---|---|
| Sidebars | All pages, new-record page, details page, list page |
| Buttons | List-page bulk actions, details page, list page |
| Custom actions | Custom action widget, custom action list |
| Other | Attachment picker, blueprint, dashboard, add-line-item plugin, global fields, user e-signature, background, web tabs |

Web Tabs (Premium and above) embed any HTTPS page in the sidebar. They can pass a signed JWT, a token that tells the embedded page which organization and user are viewing it ([Web Tabs](https://www.zoho.com/us/books/help/settings/customization/web-tabs.html)). The Zoho CRM integration syncs accounts, contacts, vendors and items in both directions ([CRM integration](https://www.zoho.com/us/books/help/integrations/crm-integration.html)).

### Books is one view of a shared finance platform

Zoho's own help says Books and Zoho Inventory "have the same core". An organization keeps one ID in both, and enabling the Inventory add-on brings packages, shipments, picklists and transfer orders "all within Zoho Books" ([Inventory accounting integration](https://www.zoho.com/inventory/help/integrations/accounting-integrations.html); [Advanced Inventory](https://www.zoho.com/us/books/help/items/advanced-inventory.html)). Other signs point the same way:

- The Books API can downgrade an organization to Zoho Invoice, or upgrade it back to Books ([Organizations API](https://www.zoho.com/books/api/v3/organizations/)).
- The Super Admin privilege covers about ten finance apps ([Users & Roles](https://www.zoho.com/us/books/help/settings/users.html)).
- The widget SDK, the command-line tool and the compliance scope are all branded "Zoho Finance" ([npm @zohofinance/cli](https://www.npmjs.com/package/@zohofinance/cli); [Zoho Compliance](https://www.zoho.com/compliance.html)).

Together these suggest that Invoice, Books and Inventory are feature tiers over one data platform keyed by organization. Zoho has not published an architecture statement saying so.

## Native apps handle doing and reviewing while the web handles configuring

Zoho ships separate native apps instead of a responsive website. Each platform uses its own navigation conventions but keeps the web's vocabulary of modules, statuses and actions.

| Platform | Navigation model | Notes (Nov 2026) |
|---|---|---|
| iPhone | Floating bottom tab bar: Home, Customers, Invoices, Expenses, More. Users can rearrange the tabs | v5.2.15; Liquid Glass design; a running timer shows in the tab-bar accessory |
| Android | Hamburger drawer plus a dashboard; no tab bar for modules | v6.4.1; 5M+ downloads; 4.8 rating |
| iPad | Icon rail, list column and detail pane; menu bar and multiple windows since iPadOS 26 | Same app as iPhone |
| Mac | Grouped sidebar (Sales, Purchases, Time Tracking, Others), list and detail | Mac Catalyst port (`maccatalyst.com.zoho.zbooks`); v5.4.8 |
| Windows | Web-style left nav, list and detail panes | Full-trust Store package; about 604MB |
| Apple Watch and widgets | Counts of unpaid invoices and bills; timers; home-screen widgets | Requires watchOS 10.5 |

The table draws on the [Zoho mobile apps page](https://www.zoho.com/books/accounting-mobile-apps/), [Accounting on the Go Series-22](https://help.zoho.com/portal/en/community/topic/accounting-on-the-go-series-22), the [Google Play listing](https://play.google.com/store/apps/details?id=com.zoho.books&hl=en_US&gl=US), the [App Store listing](https://apps.apple.com/us/app/accounting-app-zoho-books/id710446064), the [Mac App Store listing](https://apps.apple.com/us/app/zoho-books-accounting-app/id1476500403?mt=12), the [Microsoft Store listing](https://storeedgefd.dsx.mp.microsoft.com/v9.0/products/9WZDNCRDFD1F?market=US&locale=en-US&deviceFamily=Windows.Desktop) and the [WWDC 2025 blog](https://blog.zoho.com/books/wwdc-25-blog.html).

### Phone screens compress the web templates into native patterns

The iPhone dashboard is a trimmed version of the web dashboard. From top to bottom it shows:

1. The organization switcher ("Zylker Inc ⌄") and a bell.
2. A row of text tabs: Dashboard, Announcements, Help.
3. A 2×2 block with Total Receivables and Total Payables next to red tiles counting overdue invoices and overdue bills.
4. A customizable **Quick Create** row of four icons.
5. A Cash Flow chart.

The iPad shows the fuller set of cards ([iPhone dashboard image](https://www.zoho.com/books/mobile-app/mobile-features/section-3/ios/realtime-insights-2x.png); [App Store listing](https://apps.apple.com/us/app/accounting-app-zoho-books/id710446064); [Series-41: mobile revamp](https://help.zoho.com/portal/en/community/topic/accounting-on-the-go-series-41-zoho-books-mobile-app-revamp)).

List screens use a large title with search and sort icons, a row of horizontal filter chips (All, Unpaid, Overdue, ⌄), two-line rows with colored status, and a floating "+" button. Android remembers the last filter you used ([iPhone Customers image](https://www.zoho.com/books/mobile-app/mobile-features/section-3/ios/all-customer-one-view-2x.png); [iPad invoice screenshot](https://is1-ssl.mzstatic.com/image/thumb/PurpleSource221/v4/23/34/28/233428aa-32e0-885b-3e8d-90240306fb91/9450d996-edef-4f1d-b6c4-a9c75b56771e_invoice.png/552x414bb.png); [Series-41](https://help.zoho.com/portal/en/community/topic/accounting-on-the-go-series-41-zoho-books-mobile-app-revamp)).

A record screen on iPhone has, from top to bottom:

1. A tinted summary header with the document number, a large amount and the contact's name, which you can tap.
2. A row of four round actions: Edit, Email, View PDF, More.
3. An activity line with a "View History" link.
4. A diagonal status ribbon.
5. **The document, redrawn natively for the phone.**

The real PDF template is one tap away. The iPad describes its view as "a preview optimized for your device and is not related to the template you have chosen" ([iPhone invoice image](https://www.zoho.com/books/mobile-app/mobile-features/section-2/ios/financial-security-2x.png); [iPad invoice screenshot](https://is1-ssl.mzstatic.com/image/thumb/PurpleSource221/v4/23/34/28/233428aa-32e0-885b-3e8d-90240306fb91/9450d996-edef-4f1d-b6c4-a9c75b56771e_invoice.png/552x414bb.png)). Android instead uses Material-style top app bars and tabs for DETAILS, PAYMENTS, and COMMENTS & HISTORY ([Android invoice image](https://www.zoho.com/books/mobile-app/mobile-features/section-1/android/receivables-2x.png)). Create forms are native grouped rows: the label on the left, the value or "Tap to Select ›" on the right. Required labels are red, and Save sits at the top right ([iPhone expense form image](https://www.zoho.com/books/mobile-app/mobile-features/section-4/ios/track-and-convert-2x.png)).

### Capture, location, time and payment features exist only on phones

The features found only on phones fall into a few groups ([Google Play listing](https://play.google.com/store/apps/details?id=com.zoho.books&hl=en_US&gl=US); [WWDC 2025 blog](https://blog.zoho.com/books/wwdc-25-blog.html); [WWDC 2026 blog](https://www.zoho.com/blog/books/wwdcblog2026.html); [Tap to Pay blog](https://www.zoho.com/blog/books/tap-to-pay-on-the-zoho-books-app.html); [App Store listing](https://apps.apple.com/us/app/accounting-app-zoho-books/id710446064); [Series-46: iMessage](https://help.zoho.com/portal/en/community/topic/effortless-sharing-send-invoices-quotes-and-statements-from-imessage); [Microsoft Store listing](https://storeedgefd.dsx.mp.microsoft.com/v9.0/products/9WZDNCRDFD1F?market=US&locale=en-US&deviceFamily=Windows.Desktop)).

| Group | Features |
|---|---|
| Capture | Document scanner (Quick Scan, Single and Multipage modes) with blur detection; business-card and barcode scanning; photographing items to add them as invoice lines |
| Location | GPS mileage tracking, with a map and a "Convert to Expense" button |
| Time | Timers in widgets, in the iPhone tab bar, in the Mac's Dynamic Island and on Apple Watch |
| Payment | Stripe **Tap to Pay**: the phone itself accepts cards, in 18 countries |
| Apple system hooks | Siri (create invoices, expenses and payments, or approve pending invoices, by voice); Spotlight search; Apple Intelligence report summaries from plain-language questions; an iMessage app for sending invoices and statements; home-screen widgets up to Extra-Large |
| Windows system hooks | Live Tiles, Cortana, Windows Hello, Ink (some date from older Windows versions) |

The split of work between phone and web is explicit. Phones handle transactions, approvals, capture, payments and key reports, and the reports can be downloaded as PDF:

- balance sheet;
- profit and loss;
- sales;
- receivables aging;
- vendor balances;
- expenses by category.

Phones also carry a subset of settings: organization profile, invoice templates and numbering, payment gateways, taxes and user invitations. Zoho's FAQ sends users to the web for template design and email-template editing ([Mobile FAQ](https://www.zoho.com/books/kb/mobile-faq/); [Series-14: reports](https://help.zoho.com/portal/en/community/topic/accounting-on-the-go-series-14-unlock-business-insights-anytime-anywhere-reports-in-zoho-books-mobile-app)). Custom modules reached the Android app only in May 2026. This suggests modules defined on the web are being brought to mobile step by step ([May 2026 product updates](https://help.zoho.com/portal/en/community/topic/zoho-books-product-updates-may-2026)). No Zoho source found for this report documents an offline mode or swipe actions on list rows. The 2024 revamp mentions context menus instead ([Series-41](https://help.zoho.com/portal/en/community/topic/accounting-on-the-go-series-41-zoho-books-mobile-app-revamp)).

### Store data confirms a Catalyst Mac app and points to native builds

Store data confirms two things. The Mac app's bundle ID (`maccatalyst.com.zoho.zbooks`) shows it is the iPad app compiled for Mac with Apple's Catalyst tool. The iOS app is a single universal iPhone and iPad app with a watch companion ([iTunes Mac search](https://itunes.apple.com/search?term=zoho+books&entity=macSoftware&country=us&limit=5); [iTunes lookup](https://itunes.apple.com/lookup?id=710446064&country=us)). The rest is inference ([WWDC 2025 blog](https://blog.zoho.com/books/wwdc-25-blog.html); [Google Play listing](https://play.google.com/store/apps/details?id=com.zoho.books&hl=en_US&gl=US); [Microsoft Store listing](https://storeedgefd.dsx.mp.microsoft.com/v9.0/products/9WZDNCRDFD1F?market=US&locale=en-US&deviceFamily=Windows.Desktop)):

- **iOS:** the app adopts Apple-only frameworks in the same week Apple releases them (WidgetKit, App Intents, Foundation Models, Liquid Glass, Tap to Pay on iPhone). That points to native development in Swift.
- **Android:** it is on a separate version track (6.x, against 5.x on iOS) and uses different navigation, which points to a separate native codebase.
- **Windows:** its layout is identical to the web app and it ships as a full-trust package, which suggests a desktop wrapper around the web UI.

Zoho has not published which frameworks any of the apps use. Current releases are below ([iTunes lookup](https://itunes.apple.com/lookup?id=710446064&country=us); [Mac App Store listing](https://apps.apple.com/us/app/zoho-books-accounting-app/id1476500403?mt=12); [Google Play listing](https://play.google.com/store/apps/details?id=com.zoho.books&hl=en_US&gl=US); [Microsoft Store listing](https://storeedgefd.dsx.mp.microsoft.com/v9.0/products/9WZDNCRDFD1F?market=US&locale=en-US&deviceFamily=Windows.Desktop)).

| Platform | Version | Details |
|---|---|---|
| iOS | 5.2.15 (11 Nov 2026) | Rated 4.8 from 5,344 ratings; 479MB; requires iOS 17+ |
| Mac | 5.4.8 | |
| Android | 6.4.1 (10 Nov 2026) | |
| Windows | Updated 17 Nov 2026 | |

## Conclusion

Zoho Books looks large: dozens of modules, 885 API operations, hundreds of settings. Underneath, it reduces to about seven reusable parts:

1. the shell;
2. four screen templates;
3. the header-plus-lines document, with its status sequence and conversion actions;
4. linking records that move money between documents;
5. the per-module settings tab set;
6. automation that ties rules to a library of reusable actions;
7. a REST resource pattern scoped to the organization.

Custom modules and blueprints are Zoho handing that engine directly to users. That is the strongest evidence the engine is generic, and that the accounting-specific logic is confined to a narrow band: ledger postings, tax and e-invoicing compliance, bank reconciliation, and the catalogue of financial reports. In practice, someone who reproduces those seven parts reproduces most of the product's structure, because the modules are mostly configurations of them.

The evidence also shows how Zoho evolves the system. It changes design variables and migrates one module at a time, rather than doing big redesigns. Three leftovers show this:

- the quote's newer card layout sits beside the invoice's older paper layout;
- red theme values from before 2022 survive under a blue override;
- the API still says "estimates" three years after the module was renamed Quotes.

The sources each disagree with one another in predictable places, so each is good for a different thing. The help center is accurate on structure and behaviour, but its screenshots are often outdated. The demo is accurate on visuals, but it runs on mock data. The API specification is the most reliable view of the data model. Public sources leave four questions open: whether the production web client matches the demo's Ember bundle, the exact ledger entries each document type creates, how tenant data is physically separated, and whether the mobile apps work offline.
