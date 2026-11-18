# Zoho Books native apps (iOS, iPadOS, Android, macOS, Windows, Apple Watch, widgets): structure, navigation, screens, mobile-specific features and parity with the web (as of Nov 2026)

Research date: 2026-11-18. Data comes from the App Store and Google Play listings, the Microsoft Store API, Zoho's own pages and blogs, Zoho community posts (the "Accounting on the Go" series), and screenshots I downloaded and looked at myself.

Screenshots are saved locally under `/tmp/claude-0/-home-user-Apps/b158bf16-7102-5661-a48b-1d8b5b0e6ef4/scratchpad/zoho_imgs_mobile/`:
- iphone_01–10: App Store iPhone set
- ipad_01–06: App Store iPad set
- mac_01–07: Mac App Store set, from 2019
- android_01–10: Google Play set
- win_01–08: Microsoft Store set
- web/: Zoho's 2026 mobile marketing page images

Each image's source URL is in `.../scratchpad/zm_pages/screenshot_urls.txt`. The key URLs are also cited inline below.

Dating note: help.zoho.com community posts show only relative dates. "2 years ago" means about 2024 and "3 years ago" means about 2023, counted from Nov 2026. Older material is flagged where it is used.

---

## 1. Navigation model on iPhone, iPad, Android, Mac and Windows

### Takeaway
On iPhone, navigation runs through a bottom tab bar: **Home, Customers, Invoices, Expenses, More**. Users can rearrange the tabs through More > Customize, and every other module sits under More. Android does not use a tab bar for modules. It keeps a **hamburger / left side panel (navigation drawer)** plus a dashboard with a customizable Quick Create row.

iPad uses a collapsed icon sidebar with list and detail panes. Since iPadOS 26 it also has a menu bar. The Mac app is a Mac Catalyst port with a full grouped sidebar. The Windows app's UI is essentially the web app's left-nav layout. On both phone platforms the organization switcher is the org name with a chevron at the top of the dashboard.

### Cited Findings
**iPhone, current (2026)**
- Zoho's 2026 mobile page shows the iPhone dashboard and a Customers list with a floating, pill-style bottom tab bar (Liquid Glass style): **Home** (selected, house icon), **Customers**, **Invoices**, **Expenses**, **More**. The tab bar appears in the screenshot images. — [Zoho Books mobile apps page](https://www.zoho.com/books/accounting-mobile-apps/); images: [realtime-insights-2x.png](https://www.zoho.com/books/mobile-app/mobile-features/section-3/ios/realtime-insights-2x.png), [all-customer-one-view-2x.png](https://www.zoho.com/books/mobile-app/mobile-features/section-3/ios/all-customer-one-view-2x.png)
- Tabs are user-configurable: "Navigate to 'More.' Click on 'Customize' at the top-right and rearrange the modules in the taskbar as per your preference. Click 'Done' to save." (iOS only, ~2024). — [Accounting on the Go Series-22](https://help.zoho.com/portal/en/community/topic/accounting-on-the-go-series-22)
- More is the catch-all. Help content repeatedly says "either tapping the [Contacts/Estimates/Expenses/Items/Projects/Timer/Settings] tab shown or by tapping on the More tab and then choosing [it]". This FAQ is undated and partly legacy: it refers to a "Timer" tab and iCloud. — [Zoho Books Mobile FAQ](https://www.zoho.com/books/kb/mobile-faq/)
- Reports are reached from More: "Tap the 'More' button. Scroll down and select 'Reports.'" (~2024). — [Series-14 Reports](https://help.zoho.com/portal/en/community/topic/accounting-on-the-go-series-14-unlock-business-insights-anytime-anywhere-reports-in-zoho-books-mobile-app)
- Settings are reached from More: "More >> Settings >> App Preferences". Tap to Pay is enabled through "Tap More. Go to Settings. Turn on Tap to Pay" (Apr 2026). — [Series-22](https://help.zoho.com/portal/en/community/topic/accounting-on-the-go-series-22); [Tap to Pay blog, Apr 22 2026](https://www.zoho.com/blog/books/tap-to-pay-on-the-zoho-books-app.html)
- On iOS 26, the tab bar has an **Accessory View** that shows the running project timer: "You can now see the running timer status of your projects directly in the Accessory View of the tab bar". — [Zoho blog: Zoho Books updates for Apple devices, Sep 15 2025](https://blog.zoho.com/books/wwdc-25-blog.html)
- The app adopted Liquid Glass on iOS 26, iPadOS 26, macOS 26 and watchOS 26. — [WWDC25 blog](https://blog.zoho.com/books/wwdc-25-blog.html)
- Top of the iPhone dashboard: an org name with a dropdown chevron ("Zylker Inc ⌄") at top-left, a bell icon at top-right (badge in the App Store shot), then a segmented text-tab row: **Dashboard | Announcements (red dot) | Help**. — [App Store screenshot 1](https://is1-ssl.mzstatic.com/image/thumb/PurpleSource211/v4/7b/45/1f/7b451f54-6873-5a6b-14c3-684522d5a307/5503ca11-998b-40e7-8f2f-b55be282f402_dashboard.png/392x696bb.png); [Zoho mobile page image](https://www.zoho.com/books/mobile-app/mobile-features/section-3/ios/realtime-insights-2x.png)
- The 2024 revamp added the Announcements tab ("a great way to share important updates non-intrusively") and a Help section ("access our support… links to help documents and guides"). — [Series-41: mobile app revamp](https://help.zoho.com/portal/en/community/topic/accounting-on-the-go-series-41-zoho-books-mobile-app-revamp)
- The quick-create (+) button on list screens is a floating circular "+" button at bottom-right (seen on the Customers list on iPhone, and on the Invoices and Expenses lists on iPad). Quick Create on the dashboard is a separate row of shortcuts (see section 2). — [Customers list image](https://www.zoho.com/books/mobile-app/mobile-features/section-3/ios/all-customer-one-view-2x.png); [iPad invoice screenshot](https://is1-ssl.mzstatic.com/image/thumb/PurpleSource221/v4/23/34/28/233428aa-32e0-885b-3e8d-90240306fb91/9450d996-edef-4f1d-b6c4-a9c75b56771e_invoice.png/552x414bb.png)
- Search appears in two places:
  - Each list header has a magnifier icon (Customers, Banking, Timesheets).
  - System-level search: Spotlight snippets let users "look up customers or transactions without opening the app" (iOS 26). Mac Spotlight can trigger actions such as starting a timer or opening invoice creation (macOS 26).

  Sources: [WWDC25 blog](https://blog.zoho.com/books/wwdc-25-blog.html); [App Store screenshots](https://apps.apple.com/us/app/accounting-app-zoho-books/id710446064)
- On iOS 26 the app has a microphone icon for voice-command invoice creation ("Go to your Zoho Books organization, click the microphone icon, and say a command like 'Create an invoice for Lucy with 5 Wooden Tables'"). — [WWDC25 blog](https://blog.zoho.com/books/wwdc-25-blog.html)

**Android**
- Navigation is a left side panel. To reach Reports: "Access the left side panel and select 'Reports.'" (~2024). — [Series-14](https://help.zoho.com/portal/en/community/topic/accounting-on-the-go-series-14-unlock-business-insights-anytime-anywhere-reports-in-zoho-books-mobile-app)
- Play Store screenshots, current 2024–2026 set:
  - Dashboard top bar: hamburger (≡) at left, org name "Zylker Corp" and a bell at right, then the same Dashboard | Announcements | Help tab row.
  - Time Entries screen: hamburger, title, search and ⋮ overflow menu.
  - The tablet master-detail screenshots are older and dated Nov 2021 in their content. They show a blue top app bar with "≡ All Invoices ▾" (view dropdown) and search, and on the detail side the actions edit, email, PAYMENTS, bell and ⋮.

  Source: [Google Play listing](https://play.google.com/store/apps/details?id=com.zoho.books&hl=en_US&gl=US) (screenshots android_01–10)
- The Android UI revamp was rolled out in phases (~2024) and covered the dashboard, module listing screens and the help section: "The Android UI revamp project is being phased out…" — [Series-41](https://help.zoho.com/portal/en/community/topic/accounting-on-the-go-series-41-zoho-books-mobile-app-revamp)
- I found no evidence of a bottom navigation bar for modules on Android in any screenshot.

**iPad**
- The iPad layout has three parts. The first is a narrow icon rail on the left: Z logo at top, then Home, Items, Banking, Contacts, Sales docs and more as icons, with a ">" at the bottom to expand it. The second is a list column with a large title, search, filter chips, a sort icon and a floating "+". The third is a detail pane with a toolbar of icon actions: edit, attach, PDF, payment, send, more. — [iPad screenshots ipad_01–04](https://is1-ssl.mzstatic.com/image/thumb/PurpleSource211/v4/b8/d5/39/b8d539a8-b36e-2cf3-cd8a-01e627dfa17b/a081e863-c736-4096-b3f9-50b3410167ce_dashboard.png/552x414bb.png)
- iPadOS 26 added a **Menu Bar** ("seamless navigation") and Flexible Window Management: resizable windows, "drag and drop fields between screens", and "multiple Zoho Books windows open simultaneously". — [WWDC25 blog](https://blog.zoho.com/books/wwdc-25-blog.html)
- iOS/iPadOS 27 brought adaptive layouts that respond "to changes in screen size, orientation, and window dimensions… iPhone, iPad, or split-screen view." — [Zoho Books levels up with Apple Intelligence, Sep 14 2026](https://www.zoho.com/blog/books/wwdcblog2026.html)
- The iPhone app releases 5.2.10–5.2.15 (Oct 22 – Nov 11 2026) say: "Introducing Zoho Books for iPhone Duo! Layouts adapt to the outer and inner displays. Fold or unfold anytime and continue exactly where you stopped." This is Zoho's wording for a foldable iPhone; I have not verified the device independently. — [App Store version history](https://apps.apple.com/us/app/accounting-app-zoho-books/id710446064)

**Mac**
- The Mac App Store screenshots date from 2019 and their content shows Sep 2019. They show a three-pane Mac layout:
  - Sidebar with a search field, then Dashboard, Items and Banking, followed by grouped sections:
    - **Sales:** Customers, Estimates, Retainer Invoices, Sales Orders, Invoices, Payments Received, Recurring Invoices, Credit Notes
    - **Purchases:** Vendors, Expenses, Purchase Orders, Bills, Payments Made, Vendor Credits
    - **Time Tracking:** Projects, Timesheets
    - **Others:** Documents, Reports, Settings, Notifications
    - The user avatar and org name sit at the bottom.
  - Middle list with a "Invoices ▾" view dropdown, refresh and "+".
  - Detail pane showing the rendered invoice template, with toolbar icons for edit, attach, PDF, payment, send and more.

  Source: [Mac App Store listing](https://apps.apple.com/us/app/zoho-books-accounting-app/id1476500403?mt=12) (mac_01–07)

**Windows**
- The Microsoft Store screenshots have content dated Sep 2023. They show a title bar holding a back arrow, "Zoho Books", a "New (Ctrl+Q)" button, search "(Ctrl+F)" with a module selector, and bell/settings/app icons. Below it is a left nav: Dashboard, Items, Banking, Sales (Customers, Estimates, Retainer Invoices, Sales Orders, Invoices, Payments Received, Recurring Invoices, Credit Notes), Purchases, Time Tracking, Accountant, Reports, Templates. Then come a list pane with checkboxes and a detail pane with Details | Comments & History tabs, a "What's Next" banner and "Change Template". — [Microsoft Store listing 9WZDNCRDFD1F](https://apps.microsoft.com/detail/9WZDNCRDFD1F) (images via [Store API](https://storeedgefd.dsx.mp.microsoft.com/v9.0/products/9WZDNCRDFD1F?market=US&locale=en-US&deviceFamily=Windows.Desktop))

### Inferences
- The iPhone tab bar follows a "4 pinned modules + More" pattern: Home (Dashboard), Customers, Invoices, Expenses, More. Everything else lives under More: Items, Estimates/Quotes, Sales Orders, Bills, Payments, Banking, Projects/Timesheets, Reports, Documents, Settings. Users can swap which modules are pinned.
- The org switcher is almost certainly the "Org name ⌄" control at the top of the dashboard on both platforms. Its behaviour (a sheet listing organizations) is not documented in the sources I found.
- The global "+" works per screen. The dashboard Quick Create row works as the global create entry point, and list screens use a FAB. I found no single global "+" in the tab bar.

### Gaps
- I found no official current documentation (2025–2026) listing the default iPhone tab set or the full contents of the iOS More menu and Android drawer. The tab set above comes from Zoho's 2026 marketing screenshots.
- The Android drawer's exact item list and order are not shown in any current screenshot.
- I found no evidence that Android adopted Material You / Material 3 Expressive; Zoho does not mention it.

---

## 2. Mobile dashboard: cards and charts

### Takeaway
The phone dashboard is a vertical stack:
1. A header (org switcher, bell, Dashboard/Announcements/Help tabs)
2. A 2x2 KPI block: Total Receivables and Total Payables, each with a dropdown, beside pink "N Overdue Invoices" and "N Overdue Bills" tiles with chevrons
3. A customizable **Quick Create** row of 4 icon shortcuts
4. A **Cash Flow** line chart with a "This Fiscal Year" period dropdown, with more cards below

The iPad dashboard shows the fuller web-style card set: receivables/payables bars, cash flow, income and expense, project summary with a timer, and top expenses.

### Cited Findings
- On iPhone (2026 marketing image) the order is:
  - Org header ("Zylker Inc ⌄", bell) and the Dashboard | Announcements• | Help tabs
  - Left card: "Total Receivables 2,280.00 ⌄" and "Total Payables 3,715.12 ⌄"
  - Right tiles: "7 Overdue Invoices ›" and "14 Overdue Bills ›"
  - "⚡ Quick Create" row: **Invoice, Customer, Expense, Item**
  - "Cash Flow" chart with a "This Fiscal Year ⌄" dropdown

  Source: [Zoho image realtime-insights-2x.png](https://www.zoho.com/books/mobile-app/mobile-features/section-3/ios/realtime-insights-2x.png)
- The App Store iPhone screenshot shows the same structure with Quick Create items **Estimates, Sales Order, Bills, Timesheets**. This shows the row scrolls or is customized. — [App Store screenshot 1](https://is1-ssl.mzstatic.com/image/thumb/PurpleSource211/v4/7b/45/1f/7b451f54-6873-5a6b-14c3-684522d5a307/5503ca11-998b-40e7-8f2f-b55be282f402_dashboard.png/392x696bb.png)
- On Android (Play screenshot) the dashboard reads "≡ Zylker Corp", bell, Dashboard/Announcements/Help, Total Receivables $5,231.00 ⌄, "7 Overdue Invoices ›", Total Payables $2,430.00 ⌄, "12 Overdue Bills ›". Quick Create shows **Customers, Invoices, Expenses, Items**, followed by Cash Flow "This Fiscal Year ⌄". The 2026 Zoho page Android image shows Quick Create as **New Customer, New Invoice, New Bill, New Expense**. — [Google Play](https://play.google.com/store/apps/details?id=com.zoho.books&hl=en_US&gl=US); [Zoho page Android image](https://www.zoho.com/books/mobile-app/mobile-features/section-3/android/realtime-insights-2x.png)
- Zoho's description of the revamped dashboard (~2024): "You can view cash flow trends, total accounts receivable (AR), accounts payable (AP), and overdue Invoices and Bills on a single screen… a Quick Create section… Users can also customize the Quick Create section to include the types of transactions they use most often." — [Series-41](https://help.zoho.com/portal/en/community/topic/accounting-on-the-go-series-41-zoho-books-mobile-app-revamp)
- The iPad dashboard (App Store) has these cards:
  - **Total Receivables** and **Total Payables**: amount, a two-colour progress bar, and Current vs Overdue ⌄ values
  - **Cash Flow** ("This Fiscal Year ⌄"): line chart and a table of "Cash as on 01 Jan 2024 / + Incoming / – Outgoing / = Cash as on 31 Dec 2024"
  - **Income & Expense** ("Last 12 Months ⌄"): Accrual/Cash toggle, monthly bar chart, Total Income / Total Expenses
  - **Project Summary**, with a "00:00:00" timer
  - **Top Expenses** ("Last 12 Months", Total Expense)

  Source: [iPad screenshot 1](https://is1-ssl.mzstatic.com/image/thumb/PurpleSource211/v4/b8/d5/39/b8d539a8-b36e-2cf3-cd8a-01e627dfa17b/a081e863-c736-4096-b3f9-50b3410167ce_dashboard.png/552x414bb.png)
- The Zoho mobile page's hero tiles also show a "Bank Summary tile with cash in hand, payment clearing and bank balance numbers". The Android Banking Overview shows a "Banking Summary" chart with Cash In Hand, Payment Clearing and Bank Balance. — [Zoho mobile page](https://www.zoho.com/books/accounting-mobile-apps/); [Android banking image](https://www.zoho.com/books/mobile-app/mobile-features/section-1/android/banking-2x.png)
- The Windows dashboard (2023 content) has a "Hi! Patricia" greeting card with "Getting started", Total Receivables and Total Payables with aging buckets (Current, 1–15, 16–30, 31–45, Above 45 days), and Cash Flow. — [Microsoft Store screenshots](https://apps.microsoft.com/detail/9WZDNCRDFD1F)

### Inferences
- The phone dashboard is a reduced set of the web dashboard's widgets: AR/AP, overdue counts and cash flow. Income & Expense, Top Expenses and Project Summary appear to be iPad-only or further down the phone scroll. The phone screenshots crop below Cash Flow, so this is unconfirmed.

### Gaps
- I could not see the full scroll of the phone dashboard below Cash Flow, and I did not find whether its cards can be reordered or hidden.

---

## 3. List, detail and create screens; PDF preview, swipe and context actions, filters, sorting, status, sharing, printing, payments

### Takeaway
Lists use a large title with search and sort icons, horizontal **filter chips** (All / Unpaid / Overdue, or Active / Unpaid / All, plus a "⌄" for more views), dense two-line rows with coloured status text, and a floating "+".

Detail screens open with a tinted header showing the document number, a big amount and a tappable contact name, followed by a row of 4 circular actions (Edit · Email · View PDF · More). The body below is a **native, device-optimized rendering** of the document; the real PDF template is one tap away. A diagonal status ribbon (DRAFT/SENT) marks state, and "View History" opens the comments and audit trail.

Create forms are native grouped rows: label on the left, value or "Tap to Select" with a chevron on the right, required labels in red, and Save at top-right.

### Cited Findings
**List screens**
- iPhone Customers list (2026): large title "Customers", search icon, filter chips **Active | Unpaid | All | ⌄**, sort icon (≡↓), rows with a coloured initial avatar, name, and two columns "Receivables / Credits", and a black floating "+" at bottom-right above the tab bar. — [all-customer-one-view-2x.png](https://www.zoho.com/books/mobile-app/mobile-features/section-3/ios/all-customer-one-view-2x.png)
- iPad Invoices list: title "Invoices", search, chips **All | Unpaid | Overdue | ⌄**, sort icon. Each row shows customer name, "date • INV-number", a status icon and label (green ✓ Paid, blue Sent, red Overdue), amount, "Due: $x" and a "…" row menu. — [iPad invoice screenshot](https://is1-ssl.mzstatic.com/image/thumb/PurpleSource221/v4/23/34/28/233428aa-32e0-885b-3e8d-90240306fb91/9450d996-edef-4f1d-b6c4-a9c75b56771e_invoice.png/552x414bb.png)
- iPad Expenses list: chips **All | Unbilled | Invoiced | ⌄**. Rows show category, amount, date, contact and a status (Invoiced / Unbilled / Non-Billable). — [iPad expenses screenshot](https://is1-ssl.mzstatic.com/image/thumb/PurpleSource211/v4/fd/95/4f/fd954f65-411a-675c-b4a7-d6f48d77ff3b/eed84781-de93-4543-b0a0-d7dda5ac0634_expenses.png/552x414bb.png)
- iPhone All Timesheets list: "…" and search in the header; filter pills "View by Status: All ⌄ | Period: All ⌄ | Select Customer"; rows show project, task • Unbilled (orange), date • user, and hours. A running entry is highlighted green with pause/stop buttons. — [App Store screenshot 6](https://is1-ssl.mzstatic.com/image/thumb/PurpleSource211/v4/b4/cf/5f/b4cf5fb4-6e37-a43f-a878-063cf021893b/a12189c6-14c0-44d8-85e2-504034980c46_timesheet.png/392x696bb.png)
- Android Time Entries: tabs **All | Billable | Yet-to-be I(nvoiced)** with a dropdown and a sort icon. — [Google Play screenshots](https://play.google.com/store/apps/details?id=com.zoho.books&hl=en_US&gl=US)
- Revamp description (~2024): on Android, "The listing screen now displays key transaction details and offers options to sort and filter them. The user's last viewed filter is automatically saved." On iOS, the listing "provides a concise summary of each transaction… users can sort and filter". — [Series-41](https://help.zoho.com/portal/en/community/topic/accounting-on-the-go-series-41-zoho-books-mobile-app-revamp)
- Filtering in the legacy FAQ: "Tap on the filter icon shown on the top bar… Choose a filter and a sort type… hit Apply." (undated) — [Mobile FAQ](https://www.zoho.com/books/kb/mobile-faq/)
- Context menus: the iOS revamp added "the all new context menu, users will be able to perform varied actions quickly with a single tap" (~2024). — [Series-41](https://help.zoho.com/portal/en/community/topic/accounting-on-the-go-series-41-zoho-books-mobile-app-revamp)

**Detail screens (iPhone, 2026)**
- Invoice detail:
  - Tinted header: back button, title "INV-000034", amount "566.93", contact "Harry ›"
  - Circular action buttons: **Edit · Email · View PDF · More**
  - Activity strip: "Invoice created for 566.93 By Patricia, few seconds ago" with a **View History** link
  - Diagonal **DRAFT** ribbon
  - Invoice #, Invoice Date and Due Date block; Billing Address; Shipping Address; line items ("iPhone 16 Pro Max, 1.0 x 566.93 … 66.93"); Sub Total; Total

  Source: [financial-security-2x.png](https://www.zoho.com/books/mobile-app/mobile-features/section-2/ios/financial-security-2x.png)
- Quote detail: "QT-000022", 936.00, "Henry ›". Actions: **Edit · Convert to Invoice · Mark as Accepted · More**. "Quote marked as sent By Hannah Prescott" with View History; a **SENT** ribbon; line items, Sub Total, Tax, Total, Notes. — [receivable-2x.png](https://www.zoho.com/books/mobile-app/mobile-features/section-1/receivable-2x.png)
- Expense detail: title "Office Supplies", "NON-BILLABLE", amount in red, date, a dashed receipt drop-zone ("Tap to attach receipt"), and a segmented **Expense Details | History** control. Fields: Paid Through, Tax [4.00%] with "Tax Amount 4.00 (Exclusive)", Notes. Bottom bar: **Edit** and **More Options**. — [office-supplies-2x.png](https://www.zoho.com/books/mobile-app/mobile-features/section-1/office-supplies-2x.png)
- App Store invoice detail (paid state): header "Invoice Details" with back and a history (clock) icon. A green check reads "You got fully paid! $1,180.00", followed by a customer row (avatar, name, phone ›), a "1 Payment Received ›" row, Invoice#/Invoice Date and "Items (2)". — [App Store screenshot 2](https://is1-ssl.mzstatic.com/image/thumb/PurpleSource211/v4/cf/ae/30/cfae30a9-7b4c-28ad-efad-7ed21d9939b1/InvoiceDetail.png/392x696bb.png)
- **Document preview**: in the iPad detail pane the invoice is rendered natively with the banner "This is a preview optimized for your device and is not related to the template you have chosen." The real template PDF is available through the "View PDF" action. — [iPad invoice screenshot](https://is1-ssl.mzstatic.com/image/thumb/PurpleSource221/v4/23/34/28/233428aa-32e0-885b-3e8d-90240306fb91/9450d996-edef-4f1d-b6c4-a9c75b56771e_invoice.png/552x414bb.png); [iPhone invoice image](https://www.zoho.com/books/mobile-app/mobile-features/section-2/ios/financial-security-2x.png)
- Comments: "The most recent comment will be shown upfront. Tapping on View History will reveal all the comments." — [Mobile FAQ](https://www.zoho.com/books/kb/mobile-faq/)

**Detail screens (Android, 2026)**
- Invoice detail:
  - Top app bar: ←, "Invoice", ✎ edit, ✉ email, ⋮
  - Big "INV-20340", "Balance Due 2000.00", a paperclip attachment button
  - Banner "Credits Available: 1,001.00 – **Apply Now**"
  - Tabs **DETAILS | PAYMENTS | COMMENTS & HISTORY**
  - Invoice Date, Terms and Due Date; collapsible "Billing & Shipping Address" and "More Information"
  - Items with a thumbnail, SKU and "1 x £100.00"; Sub Total "(Tax Inclusive)"

  Source: [android receivables-2x.png](https://www.zoho.com/books/mobile-app/mobile-features/section-1/android/receivables-2x.png)
- Payments Made detail: tabs DETAILS | PAYMENT HISTORY. A list of bills paid (as links) with amounts; More Information (Paid Through). — [android payable-2x.png](https://www.zoho.com/books/mobile-app/mobile-features/section-1/android/payable-2x.png)
- Customer detail: a header with Receivables and Unused Credits, and tabs DETAILS | TRANSACTIONS | COMMENTS & HISTORY. Receivables are shown per currency (INR/USD/SGD/SAR) with a Total, plus "Enter Opening Balance". The comments tab has a "Type to add a comment" composer and a send button. — [android account-access-2x.png](https://www.zoho.com/books/mobile-app/mobile-features/section-3/android/account-access-2x.png); [client-portal-2x.png](https://www.zoho.com/books/mobile-app/mobile-features/section-3/android/client-portal-2x.png)
- Manual Journal detail: Journal Date, Reporting Method, "Journal Entries (12)" debit/credit list, "View all Journal Entries", and a bottom action bar with a blue **Print** button, an edit icon and ⋮. — [android financial-security-2x.png](https://www.zoho.com/books/mobile-app/mobile-features/section-2/android/financial-security-2x.png)

**Create forms**
- iPhone **Add Expense** (mileage), 2026:
  - Nav bar: ‹ back, title, a blue pill **Save** at top-right
  - Grouped inset rows: Date ("17 Apr 2026 ›"), Employee ("Tap to Select ›"), "Calculate mileage using" radios (Distance travelled / Odometer reading), Distance(mile), Mileage Rate, Paid Through ›
  - Second group: Amount, Currency (USD ›), Vendor, Tax, Reference# ("Tap to Enter")
  - Required field labels are shown in red

  Source: [track-and-convert-2x.png](https://www.zoho.com/books/mobile-app/mobile-features/section-4/ios/track-and-convert-2x.png)
- Line items: iOS 26 added camera-based item entry: "See an item you need to invoice? Snap it. Have a handwritten list of services? Photograph it. Zoho Books will instantly scan, identify, and add every item to your transaction." Item creation suggests an AI category, and an image can be generated with Image Playground. — [WWDC25 blog](https://blog.zoho.com/books/wwdc-25-blog.html)
- Legacy FAQ create flows (undated): Add Contact can import from iPhone Contacts through a Contacts icon at top-right. Attachments are "More > View Attachments > +" (iCloud, gallery or camera; max 5 files of 5 MB each). Discount fields appear in Add Invoice once Invoice Preferences enable them, and the Payment Gateways section is toggled per invoice. — [Mobile FAQ](https://www.zoho.com/books/kb/mobile-faq/)
- Mac 4.11.21 (May 2024) added an "I have received the payment" option on invoice creation that records payment inline. — [Mac App Store version history](https://apps.apple.com/us/app/zoho-books-accounting-app/id1476500403?mt=12)

**Recording payments, converting, sharing, printing**
- Record payment: "on the invoice's detail page, tap on the Record Payment icon. Enter amount and tap Save." Multi-invoice payment goes through Contact > More > Invoice Payment > "+", where the amount can be split across unpaid invoices. Converting estimates and expenses: "Tap on Convert to Invoice" / "More Actions > Convert to Invoice". Billing a project: Project > More > Convert to Invoice. (Undated FAQ) — [Mobile FAQ](https://www.zoho.com/books/kb/mobile-faq/)
- Tap to Pay on an invoice: "Go to the Invoices module… Select the invoice… Click Tap to Pay. Enter the amount and tap Collect Payment… place their card in the 'Hold Here to Pay' area." — [Tap to Pay blog, Apr 2026](https://www.zoho.com/blog/books/tap-to-pay-on-the-zoho-books-app.html)
- Sharing: "Typically, in Zoho Books, you can share PDFs and data by downloading the documents or sharing them through platforms like WhatsApp." iOS also has an **iMessage app**: in a Messages thread, tap "+", choose Zoho Books, search the customer, then "Send Statement of Accounts," "Quotes," or "Invoices" (~2024). — [Series-46](https://help.zoho.com/portal/en/community/topic/effortless-sharing-send-invoices-quotes-and-statements-from-imessage)
- Email compose (older Android tablet screenshot, Nov 2021 content): From, To ("1 contact selected"), Cc, Bcc, Subject "Invoice - INV-000047 from Zylker", an HTML email body with an "Invoice #INV-000047" banner, an attach icon and a send icon. — [Google Play screenshots](https://play.google.com/store/apps/details?id=com.zoho.books&hl=en_US&gl=US)
- Printing: reports can be downloaded as PDF or printed from the top-right download button on iOS, or the ⋮ menu on Android (~2024). The Android Manual Journal detail has a Print button (2026 image). — [Series-14](https://help.zoho.com/portal/en/community/topic/accounting-on-the-go-series-14-unlock-business-insights-anytime-anywhere-reports-in-zoho-books-mobile-app); [android journal image](https://www.zoho.com/books/mobile-app/mobile-features/section-2/android/financial-security-2x.png)
- Banking on iPhone: "Banking" title with "…" and search. Each account card (e.g., "Bank of India XXXX 4764", with a warning badge "9" for items to categorize) shows "Amount in Zoho Books" against "Amount in Bank" and a "…" menu, followed by Petty Cash. A "Connect your bank for real-time feeds" screen shows a grid of bank tiles with "Credit Card" tags and a **Connect Now** button. — [App Store screenshot 4](https://is1-ssl.mzstatic.com/image/thumb/PurpleSource221/v4/7d/24/b8/7d24b800-4874-423b-a8e0-480df1fa6b81/34bfd4b1-6a76-4320-9a84-75e61a71db25_banking.png/392x696bb.png); [connect-your-bank-2x.png](https://www.zoho.com/books/mobile-app/mobile-features/section-1/connect-your-bank-2x.png)
- iPad Banking: master list of accounts (Bank of America with a red badge "10", Chase Bank, Chase Credit Card, Petty Cash, Undeposited Funds), each showing In Zoho Books and In Bank amounts. The detail pane shows the account's feed transactions with chips "Uncategorized | All | ⌄". — [iPad banking screenshot](https://is1-ssl.mzstatic.com/image/thumb/PurpleSource211/v4/94/99/a8/9499a8ce-31a9-593e-2fbd-3bdb4b411b74/8cef3440-5fee-4968-900a-519c1317b78a_banking.png/552x414bb.png)

### Inferences
- The mobile detail pattern is "summary header + quick actions + native body + history". The template-accurate PDF is a secondary view, not the default.
- Status is shown three ways: coloured text in lists, a ribbon on the detail, and a green "fully paid" success state.

### Gaps
- I found no Zoho Books source documenting **swipe actions** on list rows. The only swipe-action docs found are for Zoho CRM. The ~2024 revamp mentions a context menu, not swipes.
- I found no Books source on **signature capture** on mobile.
- The exact contents of the "More" action sheet on invoice detail (Record Payment, Share link, Print, Clone, Void, etc.) are not documented in the current sources.
- WhatsApp sharing is described only as general share-sheet behaviour. I found no dedicated WhatsApp button documented for Books (Zoho Invoice announced one separately).

---

## 4. Mobile-only and mobile-strong features

### Takeaway
The phone apps differ most from the web in four areas:
- **Capture**: receipt and document scanner (Quick Scan / Single / Multipage), smudge detection, business-card scanning, barcode scanning, camera-to-line-items
- **Location**: GPS mileage tracking with background location
- **Time**: timers in the tab bar accessory, widgets, Mac Dynamic Island and Apple Watch
- **Payments**: Stripe Tap to Pay on iPhone and Android

iOS adds a deep layer of Apple platform hooks: Siri/App Intents, Spotlight, Apple Intelligence (Foundation Models report assistant), widgets including Extra-Large, an iMessage app, Liquid Glass, and iPad windowing. Windows has its own hooks: Live Tiles, Cortana, Hello and Ink. I found no documented offline mode.

### Cited Findings
**Scanning and OCR**
- The Android/iOS scanner screen has an X close button, a crop-frame toggle and a flash toggle, with yellow corner guides around the receipt. A blue scan line moves over it. The bottom mode switcher reads **Quick Scan | Single | Multipage**, with a shutter button. The Play screenshot is titled "From receipt to expense in a jiffy". — [Google Play screenshot](https://play.google.com/store/apps/details?id=com.zoho.books&hl=en_US&gl=US); [Zoho image scan-and-save](https://www.zoho.com/books/mobile-app/mobile-features/section-4/ios/scan-and-save-ins-2x.png)
- "In-app document management… Enable the autoscan feature to extract information from your uploaded documents and create new transactions from them automatically." — [Google Play description](https://play.google.com/store/apps/details?id=com.zoho.books&hl=en_US&gl=US)
- Blur and smudge detection (iOS/iPadOS 26): "detects hazy or blurry captures… the app prompts you to retake it." — [WWDC25 blog](https://blog.zoho.com/books/wwdc-25-blog.html)
- Business card scanning (iOS 27, Sep 2026): "scan it and let Foundation Models extract the contact details… create a new customer or find a matching existing customer". — [WWDC 2026 blog](https://www.zoho.com/blog/books/wwdcblog2026.html)
- "Scan and Save Instantly: Scan barcodes and business cards to quickly capture and record information." — [Zoho mobile page](https://www.zoho.com/books/accounting-mobile-apps/)
- Siri document upload: "Ask Siri to upload documents to Zoho Books and add multiple files at once" (5.2.5, Sep 14 2026). — [App Store version history](https://apps.apple.com/us/app/accounting-app-zoho-books/id710446064)

**Mileage with GPS**
- "Track & Convert: Automatically track mileage distances with GPS and convert it to expenses." The Android screen shows a map with green start and red stop pins and a blue route, "Started at" and "Stopped at" addresses with timestamps, "Distance 5.4 km", and a **Convert to Expense** button. — [Zoho mobile page](https://www.zoho.com/books/accounting-mobile-apps/); [Play screenshot "Mileage Tracking with GPS"](https://play.google.com/store/apps/details?id=com.zoho.books&hl=en_US&gl=US)
- App Store disclaimer: "Continued use of GPS running in the background can dramatically decrease battery life." — [iTunes lookup](https://itunes.apple.com/lookup?id=710446064&country=us)
- Android permissions include ACCESS_BACKGROUND_LOCATION, ACCESS_FINE_LOCATION, FOREGROUND_SERVICE_LOCATION, ACTIVITY_RECOGNITION, REQUEST_IGNORE_BATTERY_OPTIMIZATIONS and RECEIVE_BOOT_COMPLETED (v6.3.5, Sep 2025). — [Exodus Privacy report](https://reports.exodus-privacy.eu.org/en/reports/com.zoho.books/latest/)
- Mac 5.0.43 (Mar 2025): "disable mileage tracking… Settings > Expense Preferences… Enable Mileage Tracking toggle". — [Mac version history](https://apps.apple.com/us/app/zoho-books-accounting-app/id1476500403?mt=12)

**Timers and time tracking**
- iOS widgets (Sep 2023):
  - **Receivable Summary**: Current and Overdue amounts; tapping opens the "AR Aging details by Invoice due date" report
  - **Invoice Details**: Overdue and/or Recent invoices
  - **Timer Widget**: start, pause, stop; runs in the background
  - **Log Time Widget**: enter time, project and task
  - **Timer Dashboard**: billed and unbilled hours for recent projects

  Source: [Series-1 widgets](https://help.zoho.com/portal/en/community/topic/accounting-on-the-go-series-1-effortless-accounting-with-ios-home-screen-widgets-7-9-2023)
- Running timer in the tab-bar accessory (iOS 26). Mac: "start or pause timers directly from your Mac's dynamic island" through iPhone Mirroring, and Spotlight actions such as "starting a timer". — [WWDC25 blog](https://blog.zoho.com/books/wwdc-25-blog.html)
- Legacy FAQ: Timer tab > Start > Stop > Submit, then choose the project and task and Save. — [Mobile FAQ](https://www.zoho.com/books/kb/mobile-faq/)

**Tap to Pay and card payments**
- Stripe users only. Setup: More > Settings > enable Tap to Pay > "+ Add New Location" (or select an existing Stripe location). Collect from an invoice. The feature launched first for Singapore (iPhone), then Malaysia, then "more countries on both Android and iOS" (Apr 22 2026). "Every Tap to Pay transaction is instantly recorded, matched to the right invoice." It also sends digital receipts. — [Tap to Pay blog](https://www.zoho.com/blog/books/tap-to-pay-on-the-zoho-books-app.html)
- Play screenshot "Where Tap to Pay is available" lists 18 countries: Malaysia, Denmark, Italy, Austria, Netherlands, Australia, UK, Ireland, Singapore, Germany, USA, New Zealand, Switzerland, Finland, France, Belgium, Sweden, Poland. The Play description labels it "(In early access)". — [Google Play](https://play.google.com/store/apps/details?id=com.zoho.books&hl=en_US&gl=US)
- Supported devices: "iPhone XS or later", plus a list of Android models (Pixel 6–10, Galaxy A/S/Z series, OnePlus, Xiaomi and others). — [Zoho KB: Supported Devices Tap to Pay](https://www.zoho.com/en-sg/books/kb/payments/supported-devices.html)
- Online payment gateways shown in store screenshots: Stripe, Authorize.net, Verifone, PayPal (Payflow Pro / Payments Pro), Worldpay, CSG Forte, Braintree, Square. Payment modes: Visa/Mastercard, NetBanking, ACH, Wallet. — [App Store screenshot 8](https://is1-ssl.mzstatic.com/image/thumb/PurpleSource211/v4/c7/12/60/c712601e-0a16-60c0-058f-7af89638aee3/cf40b904-e77e-4994-a1a1-6cd0a3a0bd22_payments.png/392x696bb.png); [Google Play](https://play.google.com/store/apps/details?id=com.zoho.books&hl=en_US&gl=US)
- The App Store info section lists "Supports Wallet". — [App Store page](https://apps.apple.com/us/app/accounting-app-zoho-books/id710446064)

**Siri, Apple Intelligence and Spotlight (iOS, iPadOS, macOS)**
- OS 26 (Sep 2025):
  - Voice-command invoice creation (mic icon)
  - Spotlight snippets for customers and transactions
  - Image Playground item images
  - Smart item category suggestions
  - Apple Intelligence summary at the top of the Notifications pane
  - Camera item scanning
  - Mac Spotlight actions

  Source: [WWDC25 blog](https://blog.zoho.com/books/wwdc-25-blog.html)
- OS 27 (Sep 14 2026):
  - "AI-Powered Reports: Describe the report you want in natural language… generates the relevant report with a summary of its key insights, right within the Reports module" (Foundation Models)
  - Siri: create invoices, expenses and payments by voice; invoice approvals ("approve them individually, or review and approve multiple pending transactions for a customer"); customer search; document upload
  - On-Screen Awareness ("Siri summarize what's currently displayed")
  - **Extra-Large Portrait Widget** showing invoice transactions with filters

  Sources: [App Store 5.2.5 notes](https://apps.apple.com/us/app/accounting-app-zoho-books/id710446064); [WWDC 2026 Books blog](https://www.zoho.com/blog/books/wwdcblog2026.html); [Zoho general Apple 2026 blog](https://www.zoho.com/blog/general/zoho-apps-apple-2026-updates.html)
- The Zoho page shows a "Report Assistance" chat sheet: the prompt "Where did I spend most over the last 4 months?" returns "Report summary: Total expenses: 3,154 / Top categories: Cost of Goods Sold: 500 | Travel: 332 | Rent: 60". A Siri result card reads "Invoices Approved – All pending invoices were approved – View Pending Invoices – Done". — [ai-powered-reports.png](https://www.zoho.com/books/mobile-app/and-lot-more/ai-powered-reports.png); [siri-image.png](https://www.zoho.com/books/mobile-app/and-lot-more/siri-image.png)

**Widgets**
- iOS: the 2023 set listed above, plus the Extra-Large Portrait widget (2026). The 2026 widget image shows a dashboard-like widget: org name, Dashboard/Announcements/Help, Total Receivables and Payables, Overdue Invoices and Bills. — [ios-widget.png](https://www.zoho.com/books/mobile-app/and-lot-more/ios-widget.png)
- Mac desktop widgets (macOS Sonoma, 4.11.3, Sep 2023): "Manage timers and send payment reminders to your customers directly from the Desktop page". — [Mac version history](https://apps.apple.com/us/app/zoho-books-accounting-app/id1476500403?mt=12)
- Android: the current Play description says "Handy widgets: Add a Zoho Books widget on your home screen to log time sheet entries, record expenses, and create invoices instantly." This contradicts a 2023 Zoho reply that "widgets are not available in the Zoho Books Android app due certain constraints". The Play listing is the current source. — [Google Play](https://play.google.com/store/apps/details?id=com.zoho.books&hl=en_US&gl=US); [Series-1 comments](https://help.zoho.com/portal/en/community/topic/accounting-on-the-go-series-1-effortless-accounting-with-ios-home-screen-widgets-7-9-2023)

**Apple Watch and Wear OS**
- The iOS listing requires "iOS 17.0 and watchOS 10.5 or later" and its device list includes Apple Watch. The App Store "Access Zoho Books across all devices" screenshot shows a watch screen: "Zoho Books 10:09 / Hi Boyle, / UNPAID Invoices 49 / UNPAID Bills 50". — [App Store page](https://apps.apple.com/us/app/accounting-app-zoho-books/id710446064); [App Store screenshot 10](https://is1-ssl.mzstatic.com/image/thumb/PurpleSource211/v4/84/d5/90/84d59016-39a2-a85d-2077-62b62d0854d2/eb07fd04-0a6b-41b8-bc97-0cef2067443c_access_all_device.png/392x696bb.png)
- Original watch app (Apr 2015): "time tracking can be done right from the watch. Start the timer… The time is automatically recorded as part of the task or project." — [Zoho blog, 2015](https://blog.zoho.com/expense/introducing-zoho-business-apps-for-apple-watch.html)
- Liquid Glass was applied on watchOS 26. — [WWDC25 blog](https://blog.zoho.com/books/wwdc-25-blog.html)
- The Zoho mobile page's Android section ("SEAMLESS NAVIGATION — Business updates on your wrist") shows a round Wear-OS-style watch displaying a Zoho Books notification "Invoice Created – INV-000056". — [android-watch.png](https://www.zoho.com/books/mobile-app/and-lot-more-android/android-watch.png)

**Notifications, security, appearance and accessibility**
- "Stay Notified: Get real-time push notifications for payments, approvals, and key updates." The lock-screen example reads "Invoice #INV-1023 for 12,500 is due today. Send a reminder to avoid payment delays." The Android example reads "New Zoho Books Notification – Invoice Created – INV-000056". — [Zoho mobile page](https://www.zoho.com/books/accounting-mobile-apps/); [ios-home-screen-2x.png](https://www.zoho.com/books/mobile-app/mobile-features/section-4/ios/ios-home-screen-2x.png)
- Android "PASSCODE LOCK: Secure things with our code and your own code." Android permissions include USE_BIOMETRIC and USE_FINGERPRINT. — [Zoho mobile page](https://www.zoho.com/books/accounting-mobile-apps/); [Exodus](https://reports.exodus-privacy.eu.org/en/reports/com.zoho.books/latest/)
- iOS appearance: More > Settings > App Preferences > Appearance (System Default / Light / Dark). Dynamic font follows the OS setting (iOS and Android). VoiceOver support was added in the revamp (~2024). The Mac app follows the system dark mode. — [Series-22](https://help.zoho.com/portal/en/community/topic/accounting-on-the-go-series-22); [Series-41](https://help.zoho.com/portal/en/community/topic/accounting-on-the-go-series-41-zoho-books-mobile-app-revamp); [Mac listing](https://itunes.apple.com/lookup?id=1476500403&entity=macSoftware)
- The Android app contains 0 known trackers (static analysis of v6.3.5). — [Exodus](https://reports.exodus-privacy.eu.org/en/reports/com.zoho.books/latest/)

**Mac**
- "Ease your eyes with Dark Mode… Save time with Keyboard Shortcuts". Other Mac features are Spotlight actions, timers controlled through iPhone Mirroring (macOS 26), and desktop widgets (Sonoma). — [Mac App Store listing](https://apps.apple.com/us/app/zoho-books-accounting-app/id1476500403?mt=12)

**Windows**
- The store "Features" list includes:
  - **Cortana** ("Talk to Cortana and account your finances")
  - **Live Tiles** ("Pin important customers or projects to the Start menu")
  - **Windows Hello**
  - **Notifications**
  - **Keyboard Shortcuts**
  - **Windows Ink** ("Jot down important notes on a report and save it as an image")
  - Plus Dashboard, Customers & Vendors, Items, Invoices, Estimates, Credit Notes, Expenses, Bills, Payments Made/Received, Projects & Timesheet, Chart of Accounts

  The screenshots advertise "70+ reports". — [Microsoft Store API](https://storeedgefd.dsx.mp.microsoft.com/v9.0/products/9WZDNCRDFD1F?market=US&locale=en-US&deviceFamily=Windows.Desktop)

**iMessage**
- iMessage app for sending statements, quotes and invoices from inside a conversation (~2024). — [Series-46](https://help.zoho.com/portal/en/community/topic/effortless-sharing-send-invoices-quotes-and-statements-from-imessage)

### Inferences
- The Windows feature list appears partly legacy. Cortana and Live Tiles are Windows 10-era UWP features that Microsoft has since deprecated; that is general knowledge, not from a Zoho source. The listing text has probably not been rewritten since the UWP era.
- On Android, Wear OS support appears to be notification mirroring only. I found no standalone Wear OS app documented.
- For Face ID / Touch ID on iOS, Zoho documents the Android passcode lock, and Windows Hello is listed. iOS biometric lock is likely but not confirmed in the sources I fetched.

### Gaps
- **Offline mode**: no Zoho Books source (help, FAQ, store listings, blogs) describes offline capability or sync conflict handling for the mobile apps. Searches only returned offline docs for other Zoho products (Zoho FSM). I treat this as undocumented, which probably means it is not supported. That conclusion is unconfirmed.
- Barcode scanning is mentioned only as "scan barcodes", with an Android barcode-scanner illustration. Its exact use (item lookup in line items, or a search field) is not documented in what I found.
- Apple Watch: I found no current feature list. A search-result snippet attributed to the Zoho mobile page said "view outstanding invoices, send payment reminders, and track time"; I could not see that text on the fetched page. A single App Store user review said there is no complication (from a search snippet; not verified).
- Live Activities / Dynamic Island on iPhone are not documented. Only the Mac "Dynamic Island" through iPhone Mirroring is mentioned.
- Siri Shortcuts (App Shortcuts) as a separate user-facing gallery is not documented beyond the Siri and Spotlight intents above.

---

## 5. Feature parity with the web; reports on mobile

### Takeaway
The phone apps cover the transactional core:
- Contacts, items, quotes, sales orders, invoices, recurring invoices, credit notes, payments, expenses, bills, POs, vendor credits
- Banking feeds and categorization, manual journals
- Projects and timesheets, documents
- A subset of settings: org profile, invoice preferences, template selection, taxes, gateways, users, app preferences

Design and administration stay on the web. Zoho's own FAQ points users to the web app for template customization and email-template editing. Mobile reports cover the key financial statements and AR/AP summaries, can be customized for date range and basis, and can be downloaded or printed. Custom Modules reached Android only in May 2026.

### Cited Findings
- Web-only (FAQ, undated): "As of now, you will not be able to customize your templates through our iOS application. You can make use of our web application to do so." For changing the default email content: "As of now, you will not be able to do this through our iOS application." Older FAQ text also said users could not view their own logged timesheets ("We will provide this option soon"); the current App Store timesheet screenshot shows an All Timesheets list. — [Mobile FAQ](https://www.zoho.com/books/kb/mobile-faq/); [App Store screenshot 6](https://is1-ssl.mzstatic.com/image/thumb/PurpleSource211/v4/b4/cf/5f/b4cf5fb4-6e37-a43f-a878-063cf021893b/a12189c6-14c0-44d8-85e2-504034980c46_timesheet.png/392x696bb.png)
- Settings available on mobile (FAQ): Organization Profile (date format, logo), Invoice Templates (choose, preview, add from gallery, set default), Invoice Preferences (numbering, discount level), Online Payment Gateways, Taxes and Tax Groups, Users (invite an accountant), Sign Out. Tap to Pay is enabled in Settings (2026). On Mac: Expense Preferences (mileage) and General Preferences (first day of week, Aug 2024). — [Mobile FAQ](https://www.zoho.com/books/kb/mobile-faq/); [Tap to Pay blog](https://www.zoho.com/blog/books/tap-to-pay-on-the-zoho-books-app.html); [Mac version history](https://apps.apple.com/us/app/zoho-books-accounting-app/id1476500403?mt=12)
- Mobile reports (~2024): Balance Sheet, Profit & Loss, Sales Reports, Customer Balances, Accounts Receivable Aging, Vendor Balances, Expense by Category. They are grouped into categories, have a "Customize" option (date range, reporting basis; "Run Report" on Android), and can be downloaded as PDF or printed. — [Series-14](https://help.zoho.com/portal/en/community/topic/accounting-on-the-go-series-14-unlock-business-insights-anytime-anywhere-reports-in-zoho-books-mobile-app)
- The Zoho mobile page claims mobile users can "Access 50+ reports for real-time visibility". The Play description says "over 50 reports… schedule report distributions through email" (this describes the product overall). — [Zoho mobile page](https://www.zoho.com/books/accounting-mobile-apps/); [Google Play](https://play.google.com/store/apps/details?id=com.zoho.books&hl=en_US&gl=US)
- iPhone Cash Flow Statement report screen: "‹ Back | Cash Flow Statement | [PDF icon] [filter icon]". Org name "Zylker Fitness – US", "From 01 Jan 2024 To 31 Mar 2024", Beginning Cash Balance, then sections such as "Cash Flow from Operating Activities" with line items. — [App Store screenshot 5](https://is1-ssl.mzstatic.com/image/thumb/PurpleSource221/v4/fb/cf/cd/fbcfcd14-c6da-931c-2f47-c82237d72c42/34676887-2d0b-45c3-8818-177752468c07_reports.png/392x696bb.png)
- Windows Reports center (2023 content): General Reports | Custom Reports tabs, a search box, and categories (Business Overview, Sales, Inventory, Receivables, Payments Received, Recurring Invoices…) with star (favourite) icons. The P&L view has a "This Week" period, Customize Report, Schedule Report, share, print and Export As. — [Microsoft Store screenshots](https://apps.microsoft.com/detail/9WZDNCRDFD1F)
- Custom Modules: "Custom Modules are now available on the Zoho Books Android app" (May 2026 product update). — [Zoho Books Product updates May 2026](https://help.zoho.com/portal/en/community/topic/zoho-books-product-updates-may-2026)
- The mobile apps also expose a range of features:
  - Transaction approval (Siri approvals, 2026)
  - Branches on transactions
  - Reporting tags on transactions, customers and items
  - Customer and vendor numbers
  - Address formats
  - Price-list line discounts
  - Documents-tab attachments
  - Regional compliance: XRechnung/ZUGFeRD export and VAT groups (Germany); correction invoices (Germany); m-pesa (Kenya); UK VAT exempt/out of scope; India TCS on sales orders; e-way bills and e-invoicing (India)

  Sources: [Mac version history](https://apps.apple.com/us/app/zoho-books-accounting-app/id1476500403?mt=12); [Zoho mobile page](https://www.zoho.com/books/accounting-mobile-apps/)
- Customer portal management from mobile: enable Portal Status per contact (FAQ), and "Allow portal access for this customer" checkbox shown in the Play screenshot. — [Mobile FAQ](https://www.zoho.com/books/kb/mobile-faq/); [Google Play](https://play.google.com/store/apps/details?id=com.zoho.books&hl=en_US&gl=US)
- Revamp intent (~2024): "Our next focus will be on making the app even more intuitive and simplifying the process of creating transactions." — [Series-41](https://help.zoho.com/portal/en/community/topic/accounting-on-the-go-series-41-zoho-books-mobile-app-revamp)
- The Mac and Windows apps carry close to full web module sets in their navigation (see section 1). Windows includes an Accountant section (Chart of Accounts, journals), Templates and Custom Reports. — [Mac listing](https://apps.apple.com/us/app/zoho-books-accounting-app/id1476500403?mt=12); [Microsoft Store](https://apps.microsoft.com/detail/9WZDNCRDFD1F)

### Inferences
- Parity follows a tiered pattern:
  - The phone apps handle "do and review": transactions, approvals, capture, payments and key reports.
  - Configuration-heavy work stays on the web: template design, email templates, automation and workflow rules, custom functions, integrations setup, most advanced settings.
  - The Mac (Catalyst) and Windows apps sit close to web parity.
- Custom Modules arriving on Android in 2026 suggests web-defined, metadata-driven modules are being progressively rendered on mobile.

### Gaps
- I found no authoritative 2025–2026 list of web features that are absent or read-only on mobile. Examples would be workflow rules, custom functions, web tabs, field customization, role management, report scheduling, budgets and fixed assets.
- I found no confirmation of whether Custom Modules are on iOS (only the Android release was found), or whether custom reports or scheduling are available on phones.
- A post found only as a search snippet (Series-57) says US and Canada users can add and manage bank accounts from the mobile app. I did not fetch it.

---

## 6. Store information, release notes 2025–2026, companion apps

### Takeaway
All four store listings were updated in late 2026:

| Platform | Version | Updated | Rating | Size | Minimum OS |
|---|---|---|---|---|---|
| iOS / iPadOS / watchOS | 5.2.15 | Nov 11 | 4.8 (5,344 US ratings) | 479 MB | iOS 17, watchOS 10.5 |
| Mac | 5.4.8 | Sep 22 | — | 135 MB | macOS 13 |
| Android | 6.4.1 (parsed) | Nov 10 | 4.8, 31.4K reviews, 5M+ downloads | — | Android 8.0 (parsed) |
| Windows | — | Nov 17 | 4.8 (588) | ~604 MB | Windows 10 18362 |

The 2025–2026 release notes are dominated by Apple OS integrations (OS 26 in Sep 2025, OS 27 in Sep 2026), foldable "iPhone Duo" layouts (Oct–Nov 2026), and Tap to Pay expansion (Apr 2026). Most other entries are bug-fix-only releases on a roughly weekly cadence.

### Cited Findings
**iOS (iPhone, iPad, Apple Watch)**
- Name: "Accounting App - Zoho Books"
- App ID 710446064, bundle com.zoho.zbooks
- Version 5.2.15, released 2026-11-11; first released 2014-01-02
- Rating 4.80837 from 5,344 ratings (US store)
- Size 478,918,656 bytes; minimum iOS 17.0 and "watchOS 10.5 or later"
- English plus 26 languages; universal app (iPhone + iPad)
- Free with in-app purchases: Standard Monthly $19.99, Basic Monthly $8.99, Professional Monthly $49.99, Standard Yearly $179.99, among other price points
- Seller URL: zoho.com/books/accounting-mobile-apps/

Sources: [iTunes lookup](https://itunes.apple.com/lookup?id=710446064&country=us); [App Store page](https://apps.apple.com/us/app/accounting-app-zoho-books/id710446064)

**Mac**
- Name: "Zoho Books - Accounting App"
- App ID 1476500403, bundle **maccatalyst.com.zoho.zbooks**
- Version 5.4.8, 2026-09-22; first released 2019-10-07
- macOS 13.0 or later; 134.6 MB; "Only for Mac"

Sources: [iTunes Mac lookup](https://itunes.apple.com/lookup?id=1476500403&country=us&entity=macSoftware); [Mac App Store](https://apps.apple.com/us/app/zoho-books-accounting-app/id1476500403?mt=12)

**Android**
- Name: "Zoho Books - Accounting App" (com.zoho.books)
- Updated Nov 10, 2026; 4.8 stars; 31.4K reviews; 5M+ downloads; rated Everyone; in-app purchases
- The page data includes version "6.4.1" alongside "36" (likely the target SDK) and "8.0" (likely the minimum Android version). These were parsed from the embedded data and are not labelled on the page.

Source: [Google Play](https://play.google.com/store/apps/details?id=com.zoho.books&hl=en_US&gl=US)
- Earlier build: v6.3.5 scanned Sep 2, 2025, with 28 permissions and 0 trackers. — [Exodus](https://reports.exodus-privacy.eu.org/en/reports/com.zoho.books/latest/)
- Zoho's page claims "4.8/5 App Store, 4.6/5 Play Store". The live Play rating is 4.8. — [Zoho mobile page](https://www.zoho.com/books/accounting-mobile-apps/)

**Windows**
- Name: "Zoho Books - Accounting Software for Businesses", product 9WZDNCRDFD1F, publisher Zoho Corp
- First released 2014-04-29; last updated 2026-11-17
- 4.8 from 588 ratings; about 604 MB
- Windows 10 version 18362.0 or higher; x86, x64, ARM64
- Package family "ZohoCorp.ZohoBooks-Accountingonthego"; capabilities runFullTrust and internetClient
- Store text: "Available on PC, Mobile, Surface Hub, HoloLens"

Source: [Microsoft Store API](https://storeedgefd.dsx.mp.microsoft.com/v9.0/products/9WZDNCRDFD1F?market=US&locale=en-US&deviceFamily=Windows.Desktop)

**iOS release notes 2026 (App Store version history)**
- 5.1.31–5.1.39 (Jun 8 – Jul 14 2026), 5.2.0–5.2.4 (Aug 3 – Sep 10): bug fixes and performance only
- **5.2.5 (Sep 14 2026)**: Apple OS 27. AI-Powered Reports; Business Card Scanning; Voice-Powered Transactions (Siri creates invoices, expenses and payments); Invoice Approvals with Siri; Siri Customer Search; Document Upload with Siri; Extra-Large Portrait Widget
- 5.2.6–5.2.9 (Sep 21 – Oct 20): fixes
- **5.2.10–5.2.12 (Oct 22–24)**: "Zoho Books is now optimized for iPhone Duo! Experience optimized layouts on both the outer and inner screens."
- **5.2.13–5.2.15 (Oct 28 – Nov 11)**: "Introducing Zoho Books for iPhone Duo!"

Source: [App Store page](https://apps.apple.com/us/app/accounting-app-zoho-books/id710446064)

**Mac release notes 2024–2026**
- 4.11.3 (Sep 2023): Sonoma desktop widgets
- 4.11.21 (May 2024): Documents attachments, numbering placeholders, customer numbers, address format, "I have received the payment", price-list discounts, m-pesa, UK VAT, Arabic language, India TCS, branches
- 5.0.9 (Jul 2024): German correction invoices, plan comparison, PO/bill discount account
- 5.0.14 (Aug 2024): reporting tags, first day of week
- 5.0.43 (Mar 22 2025): disable mileage tracking, XRechnung/ZUGFeRD, German VAT groups
- **5.1.0/5.1.1 (Sep 13–15 2025)**: OS 26. Voice commands, smart category suggestions, AI item images with Image Playground, interactive Spotlight snippets, Spotlight on Mac, timer control through iPhone Mirroring
- 5.4.0–5.4.6 (Jan–Jun 2026): fixes
- 5.4.7 (Sep 14 2026): OS 27 notes, same as iOS 5.2.5
- 5.4.8 (Sep 22 2026): fixes

Source: [Mac App Store](https://apps.apple.com/us/app/zoho-books-accounting-app/id1476500403?mt=12)

**Other 2026 items**
- Tap to Pay expanded to more countries on iOS and Android (Apr 22 2026). — [Tap to Pay blog](https://www.zoho.com/blog/books/tap-to-pay-on-the-zoho-books-app.html)
- Custom Modules on Android (May 2026). — [May 2026 updates](https://help.zoho.com/portal/en/community/topic/zoho-books-product-updates-may-2026)

**Companion Zoho apps (US App Store unless noted, as of Nov 2026)**

| App | Version | Updated | Rating |
|---|---|---|---|
| Zoho Invoice Maker App | 5.3.3 | 2026-10-28 | 4.86 (15,247) |
| Zoho Expense: Travel & Expense | 4.1.5 | 2026-11-04 | 4.84 (8,318) |
| Zoho Inventory Management App | 3.5.47 | 2026-11-06 | 4.75 (1,049) |
| Zoho Payroll – Employee Portal (India store) | 1.9.25 | 2026-10-30 | 4.91 (4,220) |
| Zoho Daybook – Ledger Book | 1.0.22 | 2026-09-21 | — |
| Zoho Spend | 3.14 | 2026-03-13 | — |

- Zoho Invoice also has a Mac Catalyst app (maccatalyst.com.zoho.zinvoice, v4.15.2, 2026-11-09). Zoho Expense, Invoice and Inventory each shipped matching iOS 27 updates (Sep 2026).

Sources: [iTunes search](https://itunes.apple.com/search?term=zoho+books&entity=software&country=us&limit=10); [iTunes Mac search](https://itunes.apple.com/search?term=zoho+books&entity=macSoftware&country=us&limit=5); [iTunes India search](https://itunes.apple.com/search?term=zoho+payroll&entity=software&country=in&limit=5); [Zoho general Apple 2026 blog](https://www.zoho.com/blog/general/zoho-apps-apple-2026-updates.html)

### Inferences
- Version numbers differ by platform: iOS 5.2.x, Mac 5.4.x, Android 6.4.x. This suggests separate release trains, with the Mac Catalyst build versioned separately from the iPhone/iPad build.
- Most 2026 "What's New" entries are generic. Substantive changes cluster around Apple's September OS launches.

### Gaps
- Google Play does not expose a version history publicly. I found no Android release notes for 2025–2026 beyond the Play description, the Tap to Pay blog and the May 2026 Custom Modules note.
- The Microsoft Store does not expose the version number or release notes.
- No ratings were available for the Mac app (0 in the API).

---

## 7. How the apps are built (confirmed vs inferred)

### Takeaway
**Confirmed**:
- The Mac app is a **Mac Catalyst** build of the iPad app (bundle ID prefix `maccatalyst.`).
- The iOS app is a single universal iPhone and iPad binary with Apple Watch support.
- The Windows app is an MSIX/Store package with `runFullTrust`, so it is a full-trust desktop app rather than a sandboxed UWP-only app.

**Strongly inferred**:
- iOS is native, given its deep use of Apple-only frameworks (WidgetKit widgets, App Intents/Siri, iMessage extension, Foundation Models, Image Playground, Liquid Glass, tab-bar accessory, Tap to Pay on iPhone).
- The Windows UI appears to wrap the web app.

I found no public source naming the languages (Swift/SwiftUI/UIKit, Kotlin/Compose) or evidence of a cross-platform framework.

### Cited Findings
- Mac bundle ID `maccatalyst.com.zoho.zbooks`, minimum macOS 13.0. Zoho Invoice's Mac app uses the same pattern (`maccatalyst.com.zoho.zinvoice`). — [iTunes Mac search](https://itunes.apple.com/search?term=zoho+books&entity=macSoftware&country=us&limit=5)
- The iOS app has the feature flag "iosUniversal" and its device list includes Apple Watch. — [iTunes lookup](https://itunes.apple.com/lookup?id=710446064&country=us)
- iOS features that rely on Apple-only system frameworks:
  - Home Screen widgets including the Extra-Large size; Mac desktop widgets
  - Siri intents, On-Screen Awareness and Spotlight snippets
  - Apple Foundation Models, Image Playground and Apple Intelligence notification summary
  - Liquid Glass and the tab-bar Accessory View
  - iPad Menu Bar and multi-window
  - An iMessage app
  - Tap to Pay on iPhone

  Sources: [WWDC25 blog](https://blog.zoho.com/books/wwdc-25-blog.html); [WWDC 2026 blog](https://www.zoho.com/blog/books/wwdcblog2026.html); [Series-46](https://help.zoho.com/portal/en/community/topic/effortless-sharing-send-invoices-quotes-and-statements-from-imessage)
- Windows package capabilities `runFullTrust` and `internetClient`; installer type WindowsUpdate; IsUniversal: false; about 604 MB; x86/x64/ARM64. — [Microsoft Store API](https://storeedgefd.dsx.mp.microsoft.com/v9.0/products/9WZDNCRDFD1F?market=US&locale=en-US&deviceFamily=Windows.Desktop)
- The Windows screenshots (2023) show UI identical in structure to the web app: the same left nav, "New" button, search with module dropdown, "What's Next" banner, "Change Template", Comments & History tab, and Reports center with General/Custom tabs. — [Microsoft Store screenshots](https://apps.microsoft.com/detail/9WZDNCRDFD1F)
- Android: permissions only (location, activity recognition, camera, contacts, biometrics, billing, notifications); the page data suggests target SDK 36. — [Exodus](https://reports.exodus-privacy.eu.org/en/reports/com.zoho.books/latest/); [Google Play](https://play.google.com/store/apps/details?id=com.zoho.books&hl=en_US&gl=US)
- Zoho hires iOS developers in Chennai and Madurai (aggregator listings). These are not specific to Books and name no stack. — [career.io listing](https://career.io/job/ios-developer-madurai-zoho-9a914d18f8769a637072e3c6c3011dc4); [myinternships listing](https://myinternships.in/job/zoho-is-hiring-ios-developer-intern-chennai-q27hy)

### Inferences
- iOS/iPadOS/Mac are one Apple codebase: iPhone and iPad universal, with Mac produced through Catalyst. The rate of same-week adoption of new Apple APIs points to native Swift development (UIKit and/or SwiftUI); the specific UI framework is unconfirmed.
- Android looks like a separate native codebase: different version numbering (6.x), a different navigation model (drawer) and a different detail-screen layout (Material-style tabs). I found no evidence of Flutter, React Native or Kotlin Multiplatform.
- The Windows app is probably a full-trust desktop shell around the web UI (a WebView-style wrapper). This is inferred from the web-identical UI and the `runFullTrust` capability; it is not confirmed. Its listing still advertises legacy UWP-era integrations (Cortana, Live Tiles).

### Gaps
- No engineering blog, conference talk or job post found that states the Zoho Books mobile tech stack. No public binary-analysis report naming the frameworks either; Exodus reports trackers and permissions only.
- The Windows app's runtime (WebView2, Electron, or WinUI wrapping web content) is unconfirmed.
