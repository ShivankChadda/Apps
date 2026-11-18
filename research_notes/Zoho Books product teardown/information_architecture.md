# Zoho Books: information architecture, navigation, plans, editions and reports (state as of Nov 2026)

Method note: the main sources are Zoho's public help center (US edition unless stated), the public pricing and plan-comparison pages for the US, IN, UK, AE, SA and Global editions, the public What's New log, and Zoho's public **no-login demo account** (https://www.zoho.com/us/books/accounting-software-demo/ and its /in/, /uk/, /ae/ variants). I rendered the demo in headless Chrome on 18 Nov 2026 and read the sidebar, menus and pages straight from the page DOM. I did not log in anywhere or use any connected account. The demo org is limited to sample data on one plan. It shows **fewer** modules and reports than a full Elite/Ultimate org, so items the help docs mention but the demo lacks are marked "(help-documented)". Local screenshots from the demo are in /tmp/claude-0/-home-user-Apps/b158bf16-7102-5661-a48b-1d8b5b0e6ef4/scratchpad/zoho_imgs_nav/ (demo_dashboard.png, sidebar_expanded.png, page_reports.png, hdr_*.png, mont_a/b/c.png, configure_features.png, qc_in/uk/ae.png).

## 1. Left sidebar: order, children, collapse/customization, recent redesigns

### Takeaway
The 2026 web app uses a dark or light left sidebar with these top-level entries in order: **Home, Items, Sales, Purchases, Time Tracking, Banking, Filing & Compliance, Accountant, Reports, Documents**, then a **Configure Features** link. Other groups appear only when a plan or region switches them on: **Inventory** (with the Inventory add-on), **More** (custom modules), **Web Tabs**, **Payroll** (India), and **E-Invoicing** (UAE). Groups are accordions, and opening one closes the others. Each child link shows a "+" on hover for quick create. The whole sidebar collapses to an icon rail. You can't reorder groups by hand. What appears is driven by "Configure Features" toggles, plan, edition and role permissions. The last broad visual redesign of the sidebar and top band was announced 30 Dec 2022. Since then Zoho has made smaller, incremental UI changes (Settings 2023, Reports 2024, right-hand Widgets Pane 2025, Accessibility Preferences 2026).

### Cited Findings
**Observed sidebar tree (US demo, rendered 18 Nov 2026), with route hashes** — [US demo](https://www.zoho.com/us/books/accounting-software-demo/#/home/dashboard)
- **Home** (`#/home`): the Home page with Dashboard, Getting Started and Recent Updates tabs.
- **Items** (group): Items (`#/inventory/items`), Price Lists (`#/inventory/pricelists`).
- **Sales** (group): Customers (`#/contacts`), Quotes, Retainer Invoices, Sales Orders, Invoices, Recurring Invoices, Payments Received, Credit Notes.
- **Purchases** (group): Vendors, Expenses, Recurring Expenses, Purchase Orders, Bills, Recurring Bills, Payments Made, Vendor Credits.
- **Time Tracking** (group): Projects (`#/timesheet/projects`), Timesheet (`#/timesheet/alltimeentries`).
- **Banking** (single link, `#/banking`).
- **Filing & Compliance** (group): Sales Tax (`#/reports/salestax`) in the US demo.
- **Accountant** (group): Manual Journals, Bulk Update, Tax Payments, Tax Adjustments, Currency Adjustments, Transaction Locking.
- **Reports** (single link, `#/reports`). **Documents** (single link, `#/documents/inbox`).
- **Configure Features** (link at the bottom). It opens a modal titled "Enable the modules required for your business". Toggles: Quotes, Retainer Invoices, Timesheet, Price List, Sales Orders, Purchase Orders, and "I would like to enable Inventory" with an Inventory Start Date. The modal notes that "Invoices, Credit Notes, Expenses, Bills, Recurring Invoices and more are available by default" — [US demo](https://www.zoho.com/us/books/accounting-software-demo/)

**Sidebar items in the help docs that the demo does not show (they depend on plan, add-on or settings):**
- Sales > **Sales Receipts** ("Go to Sales on the left sidebar, and select Sales Receipts") — [Sales Receipts help](https://www.zoho.com/us/books/help/sales-receipts/)
- Accountant > **Chart of Accounts** — [Chart of Accounts help](https://www.zoho.com/us/books/help/accountant/chart-of-accounts.html); Accountant > **Fixed Assets** (Premium, Elite, Ultimate) — [Fixed Assets help](https://www.zoho.com/us/books/help/accountant/fixed-assets.html); Accountant > **Budgets** (Premium+) — [Budgets help](https://www.zoho.com/us/books/help/accountant/budgets.html); Accountant > **Recurring Journals** (Professional+) — [Recurring Journals help](https://www.zoho.com/us/books/help/accountant/recurring-journals.html); Accountant > **Netting** (offsets the balances of a linked customer and vendor, launched 08 Sep 2026) — [Netting help](https://www.zoho.com/us/books/help/accountant/netting.html), [What's New](https://www.zoho.com/us/books/whats-new.html)
- **Inventory** group (with the Zoho Inventory add-on): Packages, Picklists, Shipments, Transfer Orders. Items > **Composite Items**. Purchases > **Purchase Receives** and **Purchase Returns** — [Zoho Inventory Add-ons help](https://www.zoho.com/us/books/help/items/advanced-inventory.html)
- Filing & Compliance > **Form 1099** (US). The same help page also calls this group "**Taxes & Compliance**", which suggests the group was renamed recently — [Form 1099 help](https://www.zoho.com/us/books/help/1099/1099.html)
- **More** group: "The custom module will be listed under the More section on the left sidebar" — [Custom Modules basic functions](https://www.zoho.com/us/books/help/custom-modules/basic-functions.html)
- **Web Tabs** group (Premium, Elite, Ultimate). Embedded external pages over https: "you'll find Web Tabs in the sidebar of Zoho Books and the new web tab listed under it". Each tab can be shown to only me, to selected users and roles, or to everyone — [Web Tabs help](https://www.zoho.com/us/books/help/web-tabs.html)
- **Payroll** (India): "Go to Payroll from the left navigation pane of Zoho Books" (it links to Zoho Payroll) — [IN Payroll help](https://www.zoho.com/in/books/help/payroll/)

**Behaviour and customization**
- Accordion groups: in the demo, opening one group collapsed the previous one. Hovering a child link shows a "+" (for example, the "+" next to Manual Journals). The DOM title attributes include "New Invoice", "New Quote", "Record New Payment", "Log Time (c+t)" and similar — [US demo](https://www.zoho.com/us/books/accounting-software-demo/) (screenshot sidebar_expanded.png)
- A collapse/expand button (aria-label "Collapse/Expand") at the bottom of the sidebar shrinks it to a narrow icon rail with short labels (Home, Items, Sales, Purchas…, Time Tracking, Banking, Filing & Complia…, Account…, Reports, Docume…). This was observed in page_reports.png — [US demo](https://www.zoho.com/us/books/accounting-software-demo/)
- Theme and appearance: Settings > Branding offers **Dark Pane / Light Pane** and an accent colour (Blue default, Green, Yellow, or a custom hex). The same colour applies to the customer and vendor portals — [Change Theme help](https://www.zoho.com/us/books/help/personalize/change-theme.html)
- Keyboard: Shift+1…7 go to Dashboard, Items, Banking, Customers, Vendors, Reports and Documents. Option/Alt+0 is "Navigate To", which skips the header and sidebar to reach the main content (added 14 Aug 2024) — [Keyboard Shortcuts](https://www.zoho.com/us/books/help/getting-started/keyboard-shortcuts.html), [What's New](https://www.zoho.com/us/books/whats-new.html)

**Redesign timeline** (from [What's New](https://www.zoho.com/us/books/whats-new.html) unless noted)
- 30 Dec 2022, "Redesigned Color Themes": "We've reorganized the top band and sidebar with redesigned icons and tooltips, and added new themes". Old themes were mapped to Blue, Green, Red and Yellow accents, usable with light or dark panes. The matching community post adds that grey widgets and fonts got higher contrast — [Zoho community post](https://help.zoho.com/portal/en/community/topic/introducing-a-refreshed-design-to-enhance-your-user-experience-in-zoho-books)
- 31 Jan 2023: redesigned Notifications section. 9 May 2023: "Help & Support is Now Under Profile" (top navigation reorganized). 27 Sep 2023: "Fresh Look for Settings" (card layout plus a settings search bar). 8 May 2024: Reports page rebuilt with a list view, a sidebar and search. 3 Jul 2025: "Widgets Pane" added on the right-hand side. 8 Apr 2026: Accessibility Preferences (text spacing, underlined links, strikethrough on disabled buttons).
- 8 Aug 2022: the client and vendor portals got a hamburger icon that minimizes their sidebar.

### Inferences
- The menu has three layers: groups named after business functions (Sales, Purchases, Accountant), then document-type lists, then per-record pages. Single-screen areas (Home, Banking, Reports, Documents) are plain links rather than groups.
- The demo has no "Chart of Accounts" under Accountant, but the help docs place it there. The demo appears to trim modules, so the help docs should be treated as the source for the full tree.
- "Filing & Compliance" is a group whose children change by country: Sales Tax and Form 1099 in the US, VAT Filing/VAT Payments and Income Tax in the UK.

### Gaps
- I found no documentation of user-level reordering, pinning or hiding of sidebar groups. Visibility seems to be controlled only by Configure Features, plan, add-ons and role permissions. I could not confirm there is no hidden personalization option.
- The demo account would not open the organization switcher or the full Inventory or custom-module groups, so those children come from the help docs only.

## 2. Top header bar (top band)

### Takeaway
From left to right the top band holds: product logo/name; a Recent Activities (history) clock; global search with a module-scope dropdown; a "This is a … organization" label and the organization name/switcher; a blue "+" Quick Create button; a Refer-and-Earn (people) icon; a Notifications bell; a Settings gear; the profile avatar, which also holds help resources; and the All Zoho Apps grid. A separate right-hand **Widgets Pane** carries Instant Helper (contextual help), Announcements, Webinars, Zoho Notebook, Ask Zia and other widgets.

### Cited Findings
- Help-doc legend for the main screen: Dashboard; Sidebar; **Recent History** ("View recently visited transactions"); **Search Bar** (with Advanced Search to filter by module); **Organization** ("manage/switch between multiple Zoho Books organizations"); **Quick Create**; **Notifications**; **Settings**; **Profile and Help** ("Account Information, Help Docs, FAQs, Forums, Video Tutorials, and Migration Guides"); **All Zoho Apps**. Annotated screenshot: https://www.zoho.com/us/books/help/images/getting-started/zb-dashboard.png — [Navigating Zoho Books](https://www.zoho.com/us/books/help/getting-started/navigating-zoho-books.html)
- **Recent activities** dropdown in the demo, titled "RECENT ACTIVITIES" (it was empty for the demo user) — [US demo](https://www.zoho.com/us/books/accounting-software-demo/)
- **Search**: the placeholder text is "Search in Customers ( / )", and the scope follows the current module. The scope dropdown lists Customers, Items, Price Lists, Banking, Transaction Rules, Quotes, Retainer Invoices, Sales Orders, Invoices, Credit Notes, Vendors, Expenses, Purchase Orders, Bills, Payments Made, Recurring Bills, Vendor Credits, Projects, Timesheet, Bill of Materials, Manufacturing Orders, Job Cards, Shopfloor, Documents and Tasks. At the bottom: "Advanced Search (Alt + /)" and "Search across Zoho (Cmd + /)". The India demo also lists Delivery Challans — [US demo](https://www.zoho.com/us/books/accounting-software-demo/), [IN demo](https://www.zoho.com/in/books/accounting-software-demo/)
- Shortcuts: "/" Search, Option+/ Advanced search, Command+/ Zia search, S Settings, O Organizations list, Shift+? shortcut sheet (and custom shortcut keys can be set) — [Keyboard Shortcuts](https://www.zoho.com/us/books/help/getting-started/keyboard-shortcuts.html). Zia Search launched 7 May 2021. Advanced Search was extended over 2024–2026 to default filters, custom views, custom fields, transaction rules and recurring journals — [What's New](https://www.zoho.com/us/books/whats-new.html)
- **Quick Create "+"**: a multi-column menu with group headers (US demo):
  - GENERAL: Add User, Item, Journal Entry, Log Time, Weekly Log.
  - INVENTORY: Inventory Adjustments.
  - SALES: Customer, Quotes, Invoices, Recurring Invoice, Retainer Invoices, Sales Order, Customer Payment, Credit Notes.
  - PURCHASES: Vendor, Expenses, Recurring Expense, Bill, Recurring Bill, Purchase Order, Vendor Payment, Vendor Credit.
  - BANKING: Bank Transfer, Card Payment, Owner Drawings, Other Income — [US demo](https://www.zoho.com/us/books/accounting-software-demo/)
  - Regional additions: India adds Delivery Challan and Bills Of Supply under SALES. The UK adds Delivery Challan. The UAE adds Delivery Challan and Retail Invoice under SALES and Employee Reimbursement under BANKING — [IN demo](https://www.zoho.com/in/books/accounting-software-demo/), [UK demo](https://www.zoho.com/uk/books/accounting-software-demo/), [AE demo](https://www.zoho.com/ae/books/accounting-software-demo/)
  - A Custom Modules group was added to Quick Create on 19 Jun 2024. With the Inventory add-on, Purchase Receives also appears — [What's New](https://www.zoho.com/us/books/whats-new.html)
- **Organization name** in the top right opens a right-hand pane that lists the user's organizations. Its "Manage" entry leads to My Organizations (New Organization, Mark as Default) — [More Actions help](https://www.zoho.com/us/books/help/personalize/more-actions.html)
- **Refer and Earn** (people icon): a referral panel ("Know someone who would love Zoho Books?") — [US demo](https://www.zoho.com/us/books/accounting-software-demo/) (mont_a.png)
- **Notifications** bell: a right panel with "All" and "Mentions" tabs, a filter, and an "Enable Desktop Notifications" control — [US demo](https://www.zoho.com/us/books/accounting-software-demo/). In-app notifications are also a workflow-rule action — [More Actions help](https://www.zoho.com/us/books/help/personalize/more-actions.html)
- **Settings** gear: a full-screen "All Settings" page with a search box and "Close Settings". Card groups in the demo:
  - Organization Settings: Organization (Profile, Branding, Branches, Networking); Users & Roles; Taxes & Compliance; Setup & Configurations (General, Currencies, Payment Terms, Opening Balances, Customer Portal, Vendor Portal); Customization (Transaction Number Series, PDF Templates, Email Notifications, Reporting Tags).
  - Module Settings: per-module preference pages for General, Online Payments, Sales, Purchases and Custom Modules.
  - Extension and Developer Data: Integrations, Developer Data, API Usage, Data Management — [US demo](https://www.zoho.com/us/books/accounting-software-demo/#/settings)
  - The help TOC lists further Settings pages: Automation (Workflow Rules, Email Alerts, In-app Notifications, Field Updates, Webhooks, Functions, Schedules, Workflow Logs); Custom Fields, Validation Rules, Record Locking, Custom Buttons, Related Lists, Custom Views, Web Tabs; Privacy and Security; Connections; Incoming Webhooks, Signals, Web Forms; Revenue Recognition; Sales Tax Automation; Reminders; Domain Mapping; Locations; Manage Subscriptions — [Help TOC](https://www.zoho.com/us/books/help/getting-started/welcome.html)
- **Profile avatar** panel: user name and email, User ID and Organization ID, My Account, Sign Out. Help tiles: Help Documents, FAQs, Forum, Video Tutorials, Explore Features, Migration Guide. Also Accessibility Preferences — [US demo](https://www.zoho.com/us/books/accounting-software-demo/) (mont_b.png). The trial plan is switched from the org logo menu (top right) via "Change Trial Plan" — [Plans help](https://www.zoho.com/us/books/help/plan/)
- **Tasks**: "create a task by clicking the Task icon on the top right corner of any page", or from a transaction's menu bar (Professional+ per the comparison page) — [Tasks help](https://www.zoho.com/us/books/help/tasks/)
- **Right-hand Widgets Pane** (3 Jul 2025): "quick access to Announcements, Webinars, Page Tips, Extensions, Contextual Tasks and Chat, WhatsApp, and Zoho Notebook" — [What's New](https://www.zoho.com/us/books/whats-new.html). The demo showed Instant Helper (help search, a contextual video, FAQs), Announcements, a video/webinar icon, Zoho Notebook and "All Sidebar Widgets" — [US demo](https://www.zoho.com/us/books/accounting-software-demo/). "Click the Ask Zia icon in the right sidebar" — [AI Features help](https://www.zoho.com/us/books/help/ai-features/ai-features.html)

### Inferences
- Since 2023, help and support live in the profile menu and the right Widgets Pane. The top band now holds only global actions: history, search, org, create, notify, settings, profile, apps.
- The search scope list doubles as a list of every searchable entity, including manufacturing entities (Bill of Materials, Manufacturing Orders, Job Cards, Shopfloor) that never show in the demo sidebar. These are presumably add-on modules.

### Gaps
- The demo blocked the org-switcher and app-grid popups, so their exact contents come from the help text only.
- I found no public documentation of the manufacturing modules (Bill of Materials, Job Cards, Shopfloor) inside Books, including which plan or add-on enables them.
- The help TOC lists a "Claude Agents" article under AI Features (https://www.zoho.com/us/books/help/ai-features/claude-agents.html) and a "Set Up MCP Server" article. I did not read their contents.

## 3. Home dashboard

### Takeaway
Home opens with a greeting header ("Hello, <user>", org name, helpline) and tabs **Dashboard | Getting Started | Recent Updates**; the help docs also describe an Announcements tab. The default Dashboard has eight panels: Total Receivables, Total Payables, Cash Flow, Income and Expense, Top Expenses, Projects, Bank and Credit Cards, and Account Watchlist. The default dashboard can't be edited. Custom dashboards are available on the Elite and Ultimate plans. They are built from predefined panels, report panels (and, per the 1 Jul 2024 What's New entry, marketplace widgets), with drag-to-reorder and resizable panels, sharing permissions and favourites.

### Cited Findings
- Panels and their controls (from [Home help](https://www.zoho.com/us/books/help/home/)):
  - **Total Receivables**: Current/Overdue amounts (click through to the "AR Aging Details By Invoice Due Date" report). "+ New" creates an Invoice, Recurring Invoice or Customer Payment. A dropdown sets the overdue time range.
  - **Total Payables**: Current/Overdue (click through to "AP Aging Details By Bill Due Date"). "+ New" creates a Bill, Vendor Payment or Recurring Bill.
  - **Cash Flow**: a line graph using the direct method, with Cash as on start date, Incoming, Outgoing, and Cash as on end date. Period selector (default "This Fiscal Year").
  - **Income and Expense**: a bar chart with Total Income and Total Expenses, a Cash/Accrual toggle and a period selector. Clicking it opens Profit and Loss.
  - **Top Expenses**: a pie chart. Clicking a segment opens the matching report.
  - **Projects**: project names, clients, Unbilled Hours and Unbilled Expenses tabs, and "Show All Projects".
  - **Bank and Credit Cards**: the list of accounts. Clicking one opens its transactions.
  - **Account Watchlist**: balances of accounts flagged "Add to the watchlist on my dashboard" in Chart of Accounts, with an Accrual/Cash toggle.
  - **Getting Started** tab: set-up checklist (company profile, bank accounts, first invoice, tax settings).
  - **Announcements** tab and **Recent Updates** tab.
  - Help screenshots, for example https://www.zoho.com/us/books/help/images/home/dashboard-tab/total-receivables.png
- In the demo, the header showed three tabs (Dashboard, Getting Started, Recent Updates), with "* Income and expense values displayed are exclusive of taxes" under the chart. A mobile-app promo and footer sat below the panels — [US demo](https://www.zoho.com/us/books/accounting-software-demo/) (demo_dashboard.png)
- **Custom Dashboards** (Elite, Ultimate):
  - Create with "+ New Dashboard". Access can be Only Me, Everyone, or Selected Users & Roles, each with View Only or View and Manage permission.
  - Panel sources are **Predefined Panels** and **Report Panels**. Report panels can be built only from Profit and Loss, Sales by Customer/Item/Sales Person, Invoice Details, Sales Order Details, Delivery Challan Details, Quote Details, Receivable Summary/Details, Payments Received, Credit Note Details, Bills Details, Vendor Credits Details, Purchase Order Details, Purchase Orders by Vendor, Purchases by Vendor/Item, Expenses by Customer/Project, and Billable Expense Details, plus custom versions of these.
  - Panel settings: time period; chart type (pie, bar or line); X/Y data points; sort; maximum X points.
  - Panels can be reordered by dragging, resized from the corners (report panels only), edited or deleted.
  - The dashboard list is split into Created By Me, Shared With Me, Created By Other Users (admins only) and System. Up to 3 dashboards can be favourites, but only 2 show as tabs next to the Default dashboard.
  - "You will not be able to edit, reorder, or delete the default dashboard." — [Custom Dashboards help](https://www.zoho.com/us/books/help/home/custom-dashboards.html)
- What's New: "Create Custom Dashboards… using predefined components, marketplace widgets, and reports" (1 Jul 2024). "Sort and Limit Data Points in Report Panels", noted as Ultimate-only (19 Jun 2025). Inventory panels such as Sales Order Summary and Top Selling Items (10 Jun 2026, Inventory add-on). Role-based access to dashboard reports and watchlists (12 Sep 2019) — [What's New](https://www.zoho.com/us/books/whats-new.html)
- The US comparison table lists "Dashboard customization" for Elite and Ultimate only — [US plan comparison](https://www.zoho.com/us/books/pricing/pricing-comparison.html)
- Module-level "mini dashboards" also exist: the Invoices list page (receivables overview, 3 Sep 2020), Bills, and a Banking dashboard — [What's New](https://www.zoho.com/us/books/whats-new.html), [Banking Dashboard help](https://www.zoho.com/us/books/help/banking/dashboard.html)

### Inferences
- On plans below Elite the dashboard is fixed. You can only change each panel's period or basis, and items reach the Account Watchlist from Chart of Accounts.

### Gaps
- The full list of "Predefined Panels" offered in the custom-dashboard builder is not published in text.
- The help page and the demo disagree on the tabs: the help lists an Announcements tab, while the demo shows only Dashboard, Getting Started and Recent Updates (announcements now also sit in the right Widgets Pane).

## 4. Reports module

### Takeaway
Reports opens a **Reports Center**. A left pane holds Home, Favorites, Shared Reports and a REPORT CATEGORY folder list. The main list has the columns Report Name, Category, Created By, Last Visited, Schedule and More Actions, with a star for favourites, a search bar, and a "More" menu for the report PDF layout. Zoho markets "70+ built-in reports"; the demo org lists about 60 in 12 categories. Each report page has Export, a filter bar (Date Range, Report Basis, More Filters/Advanced Filters, Run Report), Table/Chart view, Compare With, Customize Report Columns, Group By (on some reports), Schedule, Share and Save as Custom Report.

### Cited Findings
**Reports Center layout (US demo)**: left pane Home, Favorites, Shared Reports; REPORT CATEGORY: Business Overview, Sales, Inventory, Receivables, Payments Received, Recurring Invoices, Payables, Purchases and Expenses, Projects and Timesheet, Accountant, Currency, Activity. "All Reports 60" with the columns REPORT NAME, REPORT CATEGORY, CREATED BY, LAST VISITED, SCHEDULE, MORE ACTIONS, and a favourite star per row — [US demo Reports](https://www.zoho.com/us/books/accounting-software-demo/#/reports) (page_reports.png). The redesign shipped 8 May 2024: "list view, sidebar, and search options… card-based design". The search bar in Reports dates from 31 Jan 2024 — [What's New](https://www.zoho.com/us/books/whats-new.html)

**Catalogue observed in the demo** (US, 60 reports; IN, UK and AE demos show 61, adding Delivery Challan Details under Receivables) — [US demo](https://www.zoho.com/us/books/accounting-software-demo/#/reports), [IN demo](https://www.zoho.com/in/books/accounting-software-demo/)

| Category | Reports |
|---|---|
| Business Overview | Profit and Loss; Cash Flow Statement; Balance Sheet; (demo custom: P and L Custom Report, Balance Sheet Custom Report) |
| Sales | Sales by Customer; Sales by Item; Sales by Sales Person |
| Inventory | Inventory Summary; Inventory Valuation Summary; FIFO Cost Lot Tracking; Profit By Item; Material Issue Summary; Material Issue Details; Material Request Summary; Material Request Details |
| Receivables | AR Aging Summary; AR Aging Details; Invoice Details; Retainer Invoice Details; Sales Order Details; (Delivery Challan Details in IN/UK/AE); Estimate Details; Customer Balance Summary |
| Payments Received | Payments Received; Time to Get Paid; Credit Note Details; Refund History |
| Recurring Invoices | Recurring Invoice Details |
| Payables | Vendor Balance Summary; AP Aging Summary; AP Aging Details; Bill Details; Vendor Credit Details; Payments Made; Refund History; Purchase Order Details; Purchase Orders by Vendor |
| Purchases and Expenses | Purchases by Vendor; Purchases by Item; Expense Details; Expenses by Category; Expenses by Customer; Expenses by Project; Expenses by Employee |
| Projects and Timesheet | Timesheet Details; Project Summary; Project Details |
| Accountant | Account Transactions; (demo custom: Account Transactions Custom Report); Account Type Summary; General Ledger; Detailed General Ledger; Journal Report; Trial Balance |
| Currency | Realized Gain or Loss |
| Activity | System Mails; Activity Logs & Audit Trail; Exception Report; Portal Activities; Customer Reviews |

**Further reports in the help docs (beyond the demo):**
- Business Overview: Business Performance Ratio (8 ratios, each with its own chart), **Cash Flow Forecasting** (Premium+; recurring profiles plus "Assumptions"), Movement of Equity — [Business Overview reports](https://www.zoho.com/us/books/help/reports/business-overview.html)
- Sales: Order Fulfillment by Item, Sales Summary, Profit by Item — [Sales reports](https://www.zoho.com/us/books/help/reports/sales.html)
- Inventory: Inventory Aging Summary, ABC Classification, Inventory Adjustment Summary and Details, Shipment by Item, Inventory Turnover By Quantity — [Inventory reports](https://www.zoho.com/us/books/help/reports/inventory.html). Inventory Valuation: FIFO Cost Lot Tracking, Inventory Turnover By Amount — [Inventory Valuation reports](https://www.zoho.com/us/books/help/reports/inventory-valuation-reports.html)
- Payables: Purchase Order By Item — [Payables reports](https://www.zoho.com/us/books/help/reports/payables.html)
- Tax (US): Sales Tax Liability, Reverse Charge Summary — [Tax Reports](https://www.zoho.com/us/books/help/reports/tax-reports.html)
- India "Direct Taxes": TDS Receivables Summary — [IN Reports](https://www.zoho.com/in/books/help/reports/)
- UK: CIS Reports, VAT MOSS Report, Self-Employment Summary, Tax Summary Report — [UK help TOC](https://www.zoho.com/uk/books/help/getting-started/welcome.html)
- Budget vs Actuals is reached from Accountant > Budgets ("View Budget Vs Actuals") — [Budgets help](https://www.zoho.com/us/books/help/accountant/budgets.html). A Zoho Analytics dashboard can be viewed inside Reports when the org is integrated (3 Feb 2021) — [What's New](https://www.zoho.com/us/books/whats-new.html)
- Draft transactions never appear in reports — [Reports help](https://www.zoho.com/us/books/help/reports/)

**Report screen anatomy**
- Profit and Loss in the demo: a category breadcrumb (Business Overview); title and date range; **Export** dropdown; a "Filters:" bar with Date Range (for example "This Month"), Report Basis (Cash/Accrual), More Filters (Filter Accounts; Advanced Filters on Reporting Tag, Branches, Projects); Run Report; **Table View / Chart View** toggle; Collapse Sub-Accounts; **Compare With**; Customize Report Columns — [US demo P&L](https://www.zoho.com/us/books/accounting-software-demo/#/reports/profitandloss)
- The Customize panel has "General" (Date Range including MTD/QTD/YTD, Report Basis, Filter Accounts, Compare by period/year, reporting tags or projects, Advanced Filters) and "Show/Hide Columns" (Available versus Selected columns, drag to reorder). Then "Run Report" or "Save as Custom Report" — [Business Overview reports](https://www.zoho.com/us/books/help/reports/business-overview.html). Some reports also have **Group By** with optional group totals — [Sales reports](https://www.zoho.com/us/books/help/reports/sales.html)
- Manage Reports covers: Configure Report Layout for PDF and print (org name and details, basis, page numbers, generated by/date/time, table density, table design, paper size, orientation, font, margins); View as Charts; Schedule Reports; view or deactivate schedules; a weekly summary email; role-based access; sharing with users as View only or View and Export, with an optional "Skip Module Access" — [Manage Reports](https://www.zoho.com/us/books/help/reports/manage-reports.html), [Sales reports](https://www.zoho.com/us/books/help/reports/sales.html)
- **Custom reports**: a four-step builder (General, Show/Hide Columns, Report Layout, Report Preferences). For P&L and Balance Sheet you can also add Account Groups, Text rows and Formula rows. Admins can edit, clone or delete other users' custom reports — [Custom Reports](https://www.zoho.com/us/books/help/reports/custom-reports.html). The "Report Builder" (reports built from scratch across related modules) is Premium+ — [US plan comparison](https://www.zoho.com/us/books/pricing/pricing-comparison.html)
- Export formats: PDF (up to 5,000 records instantly), and Zoho Sheet, CSV, XLS and XLSX (up to 20,000 instantly). Larger exports run asynchronously: up to 100,000 records on Free through Premium and 1,000,000 on Elite and Ultimate — [US pricing FAQ](https://www.zoho.com/us/books/pricing/). Reports can be password-protected and emailed — [Financial Reports feature page](https://www.zoho.com/us/books/accounting-software/accounting-financial-reports/)
- AI layer: "Visualize, Forecast, and Detect Anomalies in Reports" and "Monitor Reports Using Zia Insights" — [AI Features help](https://www.zoho.com/us/books/help/ai-features/ai-features.html)

**Limits by plan**: custom reports are 0 on Free, 10 on Standard, 25 on Professional, 50 on Premium and unlimited on Elite and Ultimate. Scheduled reports are listed as 5 / 5 / 50 / 200 / 200 / 200 — [US plan comparison](https://www.zoho.com/us/books/pricing/pricing-comparison.html). The US pricing FAQ conflicts with the second figure: it says "5 reports in the free plan, 50 reports in the Standard plan, 200 reports in the Professional, Premium, Elite, and Ultimate plans" — [US pricing FAQ](https://www.zoho.com/us/books/pricing/)

### Inferences
- The categories mirror the sidebar (Sales, Receivables and Payments Received correspond to the Sales group; Payables and Purchases and Expenses to Purchases), plus cross-cutting categories (Business Overview, Accountant, Currency, Activity, Taxes).

### Gaps
- No public page lists all "70+" reports with their categories. The table above combines the demo list and the help pages, so plan-gated reports (for example inventory add-on reports and region-specific tax reports such as GSTR summaries) may be incomplete.

## 5. Documents module

### Takeaway
Documents is a file inbox and repository. Files arrive by upload, drag and drop, cloud import, mobile photo, or email to an org-specific address. Autoscan (OCR) extracts the date, amount, merchant and line items so a file can become, or be matched to, an expense, bill or bank transaction. Files can be filed into permissioned folders.

### Cited Findings
- Purpose: "streamline and store all your documents in one place… attach them to transactions like expenses or bills. On enabling autoscan… new transactions can be created instantly." Highlights: clients email documents directly, autoscan, convert scans to transactions, folders, folder-level user permissions — [Documents help](https://www.zoho.com/us/books/help/documents/documents.html)
- Inbox and statuses: the Documents **Inbox** is the primary folder. Scan statuses are "Scan in progress", "Processed" and "Unreadable". A file leaves the Inbox once it is attached to or matched with a transaction, or moved to a folder. Autoscan supports 15 languages — [Documents help](https://www.zoho.com/us/books/help/documents/documents.html)
- Ways files arrive: upload or drag and drop; import from Evernote, Dropbox, Box, Google Drive, OneDrive or Zoho Docs; the mobile apps; a unique org email address (system-generated or "Choose your own") that customers, vendors and accountants can email or forward to. Bank statements can be **auto-forwarded** to a dedicated Bank Statements inbox in CSV, PDF, XLS, TSV, OFX, QIF or CAMT.053, with set-up steps for Zoho Mail, Gmail and Outlook — [Documents help](https://www.zoho.com/us/books/help/documents/documents.html). Upload from the customer and vendor portals was added 3 Feb 2022, and Documents with Autoscan launched 4 Jan 2017 — [What's New](https://www.zoho.com/us/books/whats-new.html)
- Demo layout: a left pane with All Documents; INBOXES (Bank Statements); FOLDERS; Trash. The file list has the columns File Name, Details (extracted vendor, date, ref, amount), Uploaded By, Uploaded On and Actions ("Add to"). The page has Configure, Upload File and a Status filter — [US demo Documents](https://www.zoho.com/us/books/accounting-software-demo/#/documents/inbox)
- Autoscan quotas: 50 scans a month on Free and trial, 200 on Standard and Professional, 1,000 on Premium and above — [US pricing FAQ](https://www.zoho.com/us/books/pricing/). The add-on (50 scans a month) costs USD 10 monthly or 8 billed annually in the US and Global editions, INR 499 or 419, GBP 8 or 6.5, and AED or SAR 36 or 30 — [Documents help](https://www.zoho.com/us/books/help/documents/documents.html)

### Inferences
- Documents works as a staging area: unassigned files sit in the Inbox as a to-do list until they are linked to a transaction record.

### Gaps
- None material.

## 6. Plans in 2026, user limits and feature gating

### Takeaway
The plan names are confirmed as **Free, Standard, Professional, Premium, Elite, Ultimate**, priced per organization per month with a monthly or yearly billing toggle. A 14-day trial covers all five paid plans and defaults to Premium. The main gates (US edition):
- Standard adds bank feeds, custom fields and reports, period locking and the API.
- Professional adds sales/purchase orders, bills, multi-currency, projects/timesheets, inventory tracking, approvals, custom roles and workflows.
- Premium adds budgets, fixed assets, cash-flow forecasting, vendor portal, custom modules, web tabs, functions, validation rules, the Zia AI features and the report builder.
- Elite adds dashboard customization, Blueprints and advanced inventory/warehouses.
- Ultimate adds Zoho Analytics-based BI.

### Cited Findings
**US prices and users** — [US pricing](https://www.zoho.com/us/books/pricing/), [US plan comparison](https://www.zoho.com/us/books/pricing/pricing-comparison.html)

| | Free | Standard | Professional | Premium | Elite | Ultimate |
|---|---|---|---|---|---|---|
| USD/org/month (monthly / billed yearly) | 0 | 20 / 15 | 50 / 40 | 70 / 60 | 150 / 120 | 275 / 240 |
| Users | 1 user + 1 accountant | 3 | 5 | 10 | 10 | 15 |
| Locations | – | – | – | 3 | 8 | 8 |
| Invoices/year | 1,000 | 5,000 | 10,000 | 25,000 | 100,000 | 100,000 |
| Expenses (+ bills)/year | 1,000 exp | 5,000 exp | 10,000 combined | 25,000 | 100,000 | 100,000 |
| Autoscans/month | 50 | 200 | 200 | 1,000 | 1,000 | 1,000 |
| API requests/day | 1,000 | 2,000 | 5,000 | 10,000 | 10,000 | 10,000 |
| Custom reports | – | 10 | 25 | 50 | Unlimited | Unlimited |
| Workflow rules | – | – | 10 | 200 | 200 | 200 |
| Custom approval workflows | – | – | – | 25 | 70 | 70 |
| Custom modules | – | – | – | 10 | 10 | 25 |
| Widgets | – | – | – | 20 | 30 | 50 |
| Support | Email | Email, voice, chat | same | same | same | same |

**Feature first available, by plan (US comparison table)** — [US plan comparison](https://www.zoho.com/us/books/pricing/pricing-comparison.html)
- **All plans incl. Free**:
  - Sales and contacts: customers, quotes, invoices, recurring invoices, credit notes, sales receipts, customer portal, payment reminders, online payments/payment links, retention payments.
  - Purchases and banking: mileage, vendors and expenses, bank accounts and statement import, bank reconciliation, transaction rules.
  - Accounting: chart of accounts and sub-accounts, manual journals, items.
  - Reporting and control: dashboard, reports and export, activity log, custom views.
  - Documents, comments.
  - US tax: W-9, 1099 tracking, prepare and file.
  - MCP client access, writing assistant.
  - Integrations: Google Workspace, Microsoft 365, Slack, Zapier (incoming), Zoho Payments/Stripe/PayPal, most Zoho app integrations.
- **Standard+**: progress invoicing; removal of Zoho branding; recurring expenses; bank and card feeds; bulk update of accounts; transaction locking; journal templates; custom fields; reporting tags; sales/use tax and the Sales Tax Liability report; IRS e-file of 1099-MISC/NEC; Avalara; Authorize.Net/Braintree/Square and other gateways; chat and voice support.
- **Professional+**:
  - Sales: sales orders, retainer invoices, sales/purchase approvals.
  - Purchases: bills, recurring bills, vendor credits, payments made, purchase orders, check printing, landed costs.
  - Accounting and currency: multi-currency with automatic exchange rates, base currency adjustments, recurring journals.
  - Inventory: stock tracking, reorder points, price lists.
  - Projects, timesheets and timesheet approvals (internal/customer), project budgeting and profitability.
  - Admin and automation: custom roles; workflow rules (email alerts, in-app notifications, field updates).
  - Collaboration: contextual chats, tasks.
  - Integrations: Zoho People, Zoho Projects.
- **Premium+**:
  - Sales and receivables: late fees, profit margin, revenue recognition (basic, 2 rules), multi-transaction number series.
  - Purchases and vendors: vendor portal, Twilio, Zoho Sign.
  - Accounting: account customization, budgeting, fixed assets.
  - Reporting: cash-flow forecasting, Report Builder.
  - AI: Zia insights, CoCreate, anomaly detection, forecasting, speech assistant and related features.
  - Controls: record locking, validation rules.
  - Customization and automation: related lists, WebTabs, custom modules, custom schedulers, custom buttons/links, custom domain, custom functions, webhooks, incoming webhooks, Signals, formula/unique/AI custom fields.
- **Elite+**: dashboard customization; Blueprints; user access control tags; reporting-tag visibility conditions; warehouses, barcodes, composite items, serial and batch tracking, shipping labels and tracking, Etsy/eBay/Amazon, Shopify (2 stores), bin locations (2,000 or 5,000 per warehouse); unlimited revenue-recognition rules.
- **Ultimate only**: advanced analytics (50+ pre-built visualizations, KPIs, blending with other sources via the Zoho Analytics add-on, collaborative reports, embedding, 3 million rows).

**Add-ons (US)**: additional users USD 3/user/month (2.5 billed annually); 50 autoscans USD 10 (8); locations USD 12 (10) per location per month; expense claims USD 9 (7) per active user; **BillPay** USD 69 (59) per month (100 ACH vendor payments, advanced purchase approvals, vendor onboarding and approval, PO advance payments, 2/3-way PO matching, batch payments). "Add-ons are not supported in the FREE plan, except for Document autoscans." — [US pricing](https://www.zoho.com/us/books/pricing/)
- The US Free plan stays free while annual revenue is under USD 50K — [US pricing FAQ](https://www.zoho.com/us/books/pricing/)
- Trial: 14 days, covering the Standard, Professional, Premium, Elite and Ultimate plans. "By default, the Premium plan is assigned when you create an organization." Subscriptions are managed in Settings > Manage Subscriptions > Change Plan, which opens the Zoho Store — [Plans help](https://www.zoho.com/us/books/help/plan/)
- Help articles carry an "Available Plans" badge, for example Web Tabs (Premium, Elite, Ultimate) and Custom Dashboards (Elite, Ultimate) — [Web Tabs help](https://www.zoho.com/us/books/help/web-tabs.html), [Custom Dashboards help](https://www.zoho.com/us/books/help/home/custom-dashboards.html)

**Other editions, prices per org per month (monthly / billed yearly)**
- India: Standard ₹899/₹749, Professional ₹1,799/₹1,499, Premium ₹3,599/₹2,999, Elite ₹5,999/₹4,999, Ultimate ₹9,599/₹7,999. Users 1+1/3/5/10/**15/25** — [IN plan comparison](https://www.zoho.com/in/books/pricing/pricing-comparison.html)
- UK: £12/£10, £24/£20, £30/£25, £99/£85, £199/£165. Users as in the US — [UK plan comparison](https://www.zoho.com/uk/books/pricing/pricing-comparison.html)
- UAE: AED 69/60, 129/90, 159/120, 349/280, 799/660 — [AE plan comparison](https://www.zoho.com/ae/books/pricing/pricing-comparison.html). KSA: the same figures in SAR — [SA plan comparison](https://www.zoho.com/sa/books/pricing/pricing-comparison.html)
- Global (USD): Standard $12/$10, Professional $24/$20, Premium $36/$30, Elite $129/$100, Ultimate $249/$200. Users 1+1/3/5/10/10/15. The Free plan adds "Manage tax rates and tax groups" and "Generate tax summary reports", and Standard adds "Early payment discount" — [Global pricing](https://www.zoho.com/books/pricing/) (shown to non-edition countries; US visitors are redirected to /us/)

### Inferences
- Plans add capability in a simple ladder: transactions first, then operations (orders, projects, inventory), then platform (custom modules, functions, AI), then advanced inventory/BI. Navigation follows the ladder: the Sales Orders, Purchase Orders, Bills and Projects sidebar entries exist only from Professional up in the US edition, and Web Tabs and More (custom modules) from Premium up.

### Gaps
- The India free-plan revenue/turnover threshold was not visible in the static pricing-page text I parsed.
- I did not collect Free-plan eligibility conditions for the Global, UAE and KSA editions, or add-on prices outside the US edition (except autoscan).

## 7. Regional editions (India, US, UK, UAE, KSA, Global)

### Takeaway
All editions share the same shell: sidebar, header, Home, Reports and Documents. They differ in (a) extra sales documents and modules (Delivery Challans in IN/UK/AE/SA; e-Way Bills and Bills of Supply in IN; Retail Invoice and Self-Billed Invoices in AE), (b) the children of "Filing & Compliance" or tax areas (Sales Tax and 1099 in the US; VAT Filing, VAT Payments, MTD Income Tax, CIS and CT600 in the UK; GST returns and TDS in IN; VAT, Corporate Tax and E-Invoicing in AE; ZATCA Phase-2 e-invoicing in SA), (c) plan gating (India puts sales and purchase orders and stock tracking on Free; the UK puts projects and SA100/MTD on Free), and (d) local payment gateways and bank integrations.

### Cited Findings
**India (in)**
- Sidebar (demo): Sales adds **Delivery Challans** and **e-Way Bills** (`#/ewaybills?entity_type=invoice&status=yet_to_generate`). Quick Create adds Delivery Challan and Bills Of Supply. Reports add Delivery Challan Details — [IN demo](https://www.zoho.com/in/books/accounting-software-demo/). **Payroll** sits in the left navigation (Zoho Payroll integration; Standard plan gets the free Payroll version) — [IN Payroll help](https://www.zoho.com/in/books/help/payroll/)
- Plan matrix:
  - All plans: E-Way Bills; GST tracking, returns, filing and payments; the Invoice Management System; connected banking with HSBC, Kotak, Standard Chartered, SBI and Axis; Bharat Connect; Razorpay; Zoho Payments. Sales orders, purchase orders, vendor credits, payments made, stock tracking and reorder points are included on all plans, Free too (in the US they start at Professional).
  - Standard+: **e-Invoicing**, ICICI, Paytm.
  - Professional+: Digital Signature (Windows app only); 2 Locations.
  - Premium+: Cheque printing.
  - Payroll employees: Premium 10, Elite/Ultimate 20.
  - Support: voice from Professional, chat from Premium.
  - [IN plan comparison](https://www.zoho.com/in/books/pricing/pricing-comparison.html)
- India-only help topics: GST Filing (GSTR-1, GSTR-3B, GSTR-9, GSTR-2/2B reconciliation, CMP-08, DRC-01B/01C, filing approval, Input Service Distributor, Invoice Management System); e-Invoicing (register on the IRP, set-up); e-Way Bills (including gold); Delivery Challans; Bills of Entry; Bill of Supply; Branches; Vendor Advances; TDS (challans, liabilities, Income TDS, GST TDS, the 2025 Income Tax Act rate updates); Direct Taxes reports; HSN/SAC codes; migration from Tally — [IN help TOC](https://www.zoho.com/in/books/help/getting-started/welcome.html)

**United States (us)**
- Filing & Compliance > Sales Tax (demo) and Form 1099 (help). Form W-9. Sales Tax Automation and Avalara. Check printing (Professional+). SurePayroll integration. 1099 e-filing with IRS (Standard+) — [US demo](https://www.zoho.com/us/books/accounting-software-demo/), [Form 1099 help](https://www.zoho.com/us/books/help/1099/1099.html), [US plan comparison](https://www.zoho.com/us/books/pricing/pricing-comparison.html)

**United Kingdom (uk)**
- Sidebar (demo): **Filing & Compliance > VAT Filing** (`#/vat-filing/unfiled`) and **VAT Payments**. Sales includes Delivery Challans — [UK demo](https://www.zoho.com/uk/books/accounting-software-demo/). MTD for Income Tax lives under "Filing & Compliance > Income Tax" — [UK MTD IT help](https://www.zoho.com/uk/books/help/mtd-it/making-tax-digital.html)
- Plan matrix:
  - All plans: SA100 filing; MTD for Income Tax; VAT tracking and returns; **MTD VAT filing**; CIS contractor tracking; managing UK and foreign properties; bank feeds (Free is limited to 1 bank account); projects and timesheets (Free and Standard limited to 3 projects).
  - Final Accounts and CT600 Corporation Tax filing: an add-on on Free, included from Standard.
  - EC Sales List: Standard+. CIS returns to HMRC: Professional+.
  - GoCardless.
  - [UK plan comparison](https://www.zoho.com/uk/books/pricing/pricing-comparison.html)
- UK-only help topics: VAT (sales, purchases, import VAT, adjustments, payments), VAT MOSS, IOSS, CIS, Corporation Tax, Final Accounts, Self Assessment, MTD-IT (quarterly updates, annual submission, BSAS, losses), Properties, BACS file generation, Early Payment Discount, KeyPay — [UK help TOC](https://www.zoho.com/uk/books/help/getting-started/welcome.html)

**UAE (ae)**
- Sidebar (demo): no Filing & Compliance group. VAT Payments and Tax Adjustments sit under Accountant (with Recurring Journals). Delivery Challans are under Sales. Quick Create adds Retail Invoice and Employee Reimbursement — [AE demo](https://www.zoho.com/ae/books/accounting-software-demo/). The help docs say "Go to E-Invoicing on the left sidebar", so E-Invoicing is its own top-level entry — [AE e-Invoicing help](https://www.zoho.com/ae/books/help/e-invoicing/)
- Plan matrix:
  - All plans: Delivery Challans; PayTabs.
  - Standard+: VAT tracking, VAT Audit, VAT returns, direct VAT filing, tax treatment for items.
  - Professional+: Profit Margin Scheme; Corporate Tax compliance.
  - e-Invoicing is an add-on sold in transaction packs (up to 100 transactions free; 100 for AED 41 … 100,000 for AED 20,000).
  - [AE plan comparison](https://www.zoho.com/ae/books/pricing/pricing-comparison.html)
- UAE e-invoicing runs over the **Peppol** network. Timeline per Zoho: voluntary pilot 1 Jul 2026; businesses with revenue over AED 50M must appoint an Accredited Service Provider by 30 Oct 2026; mandatory for them from 1 Jan 2027; smaller businesses and government follow later — [AE e-Invoicing help](https://www.zoho.com/ae/books/help/e-invoicing/). Other UAE topics: Designated Zones, Self-Billed Invoices, Corporate Tax (Professional+) — [AE help TOC](https://www.zoho.com/ae/books/help/getting-started/welcome.html), [AE Corporate Tax help](https://www.zoho.com/ae/books/help/corporate-tax/)

**Saudi Arabia (sa)**
- Plan matrix: Delivery Challans on all plans; e-Invoicing Standard+; VAT tracking, audit and returns Standard+; Profit Margin Scheme Professional+; PayTabs — [SA plan comparison](https://www.zoho.com/sa/books/pricing/pricing-comparison.html)
- ZATCA **Phase-2 e-invoicing**: invoices are pushed to the Fatoora portal from Sales > Invoices, and the CSID is renewed under Settings > Taxes & Compliance > e-Invoicing — [SA Phase-2 help](https://www.zoho.com/sa/books/help/e-invoicing/phase-2.html). Other topics: VAT set-up, VAT in transactions, tax payments, Branches — [SA help TOC](https://www.zoho.com/sa/books/help/getting-started/welcome.html)

**Global** — the generic edition for countries without a dedicated one. It has generic tax-rate and tax-group handling and tax summary reports. The language switcher offers English, Arabic, French, Dutch, German, Spanish and Portuguese. Dedicated editions are listed for Australia, Bahrain, Canada, France, Germany, India, Kenya, Kuwait, Mexico, Nigeria, Oman, Qatar, Saudi Arabia, Singapore, South Africa, UAE, UK and US — [Global pricing](https://www.zoho.com/books/pricing/), [US pricing edition selector](https://www.zoho.com/us/books/pricing/)

### Inferences
- The region-specific parts sit in a few fixed places: extra Sales children (challans, e-way bills), the "Filing & Compliance"/tax group, Settings > Taxes & Compliance, Quick Create entries, and extra report categories. The rest of the shell is identical.

### Gaps
- The India demo org did not show a Filing & Compliance/GST group (it is probably not GST-registered), so I could not observe the exact India GST sidebar children.
- I did not inspect editions other than US, IN, UK, AE, SA and Global (for example Australia's BAS or Canada's GST/HST).

## 8. Multiple organizations

### Takeaway
Each business is a separate Zoho Books **organization** under one Zoho login, priced per organization. The org name in the top band opens a right-hand switcher. "Manage" lists My Organizations, where you can create a new org (blank, or cloning settings from an existing org), mark one as default, or leave/delete an org. The "O" shortcut opens the organizations list.

### Cited Findings
- "You can have multiple businesses set up as different organizations associated with your Zoho Books account". Pricing is "Price/Org/Month" — [US pricing FAQ](https://www.zoho.com/us/books/pricing/)
- Add an org: "Click the Organization Name dropdown in the top right corner, and select Manage… click + New Organization… choose either Clone Settings… or Add New Organization". Switch: "Click the Organization Name in the top right corner. In the right pane that appears, select the organization". Default: under My Organizations, choose "Mark as Default" — [More Actions help](https://www.zoho.com/us/books/help/personalize/more-actions.html)
- Keyboard: "press the O key… to view the list of all the organizations you manage" — [Keyboard Shortcuts](https://www.zoho.com/us/books/help/getting-started/keyboard-shortcuts.html). Search organizations by Organization ID (26 Apr 2018). An option to leave an organization from Manage Organizations was also added (the entry sits next to the 3 Jan 2025 entries; its exact date is unconfirmed) — [What's New](https://www.zoho.com/us/books/whats-new.html); [Leave Organization help](https://www.zoho.com/us/books/help/personalize/leave-org.html)
- The profile panel shows the Organization ID. The top band shows a "This is a Test organization" label for test or sandbox orgs — [US demo](https://www.zoho.com/us/books/accounting-software-demo/)
- Inside one org, **Locations/Branches** (Premium+ in the US: 3 or 8; Professional+ in India: 2) split transactions by branch or warehouse. Accountants manage clients through "Manage Clients" and Zoho Practice — [US plan comparison](https://www.zoho.com/us/books/pricing/pricing-comparison.html), [Manage Clients help](https://www.zoho.com/us/books/help/accountant/manage-clients.html)
- Cross-org analysis is suggested through Zoho Analytics reports embedded as Web Tabs — [Web Tabs help](https://www.zoho.com/us/books/help/web-tabs.html)

### Inferences
- The organization is the top-level boundary. Data, settings, plan, users and edition (country) are all per org, which is why switching orgs sits in the global header rather than the sidebar.

### Gaps
- I did not verify whether one org can change edition or country after creation, or whether consolidated multi-org reporting exists natively without Zoho Analytics.
