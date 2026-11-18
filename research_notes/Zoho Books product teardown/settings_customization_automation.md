# Zoho Books (2026): Settings, Administration, Customization and Automation Layer

Research date: 2026-11-18. Primary sources are the official Zoho Books help center, US edition (`zoho.com/us/books/help/...`), fetched live on that date. Each help page now carries "Explore With AI / View as Markdown" controls and a `.md` twin at the same URL. Plan names and limits come from the US pricing and plan comparison pages fetched the same day. Older or undated material is flagged where it is used. Screenshots were downloaded to `/tmp/claude-0/-home-user-Apps/b158bf16-7102-5661-a48b-1d8b5b0e6ef4/scratchpad/zoho_imgs_settings/` and viewed. Their public URLs are cited inline.

---

## 1. What is the full Settings tree today, and what does the Settings page look like?

### Takeaway
Settings is a full-page area opened from a gear icon at the top right. Current help text splits it into two top-level halves. **Organization Settings** holds the org-wide groups: Organization, Users & Roles, Taxes & Compliance, Setup & Configurations, Customization, Automation, Reminders & Notifications, Online Payments, Integrations & Marketplace, and Developer Space/Developer Data. **Module Settings** holds General, Sales, Purchases and Custom Modules. Each module there opens a tabbed page: Preferences, Approvals, Fields, Validation Rules, Record Locking, Buttons, Related Lists and Statuses, plus Blueprints, Layout Rules and Web Forms for custom modules. The exact visual layout of the 2026 page could not be verified from a current screenshot (see Gaps).

### Cited Findings
**Entry point and page chrome**
- The top bar has Settings ("Customize and configure your organization preferences"). Next to it are the Organization switcher, Quick Create, Notifications, Profile & Help and an All Zoho Apps launcher. A left sidebar gives access to the modules — [Navigating Zoho Books](https://www.zoho.com/us/books/help/getting-started/navigating-zoho-books.html)
- An undated help screenshot shows a full-page "Settings" header and a large **Search** box over a grid of grouped cards. The cards are: Reminders & Notifications (Reminders, Email Notifications, SMS Notifications); Users & Roles (Users, Roles, User Preferences); Customisation (Reporting Tags, Web Tabs, Digital Signature, Transaction Number Series, PDF Templates); Online Payments (Payment Gateways); and Integrations (SMS Integrations, Zoho Apps, Other Apps, Uber for Business, ZSC Key). The British spelling and the ZSC Key and Uber items suggest an older or regional build, so treat it as indicative only — [screenshot settings-zoho-apps.png](https://www.zoho.com/books/help/images/integrations/zoho-notebook/settings-zoho-apps.png)
- Current help pages consistently describe navigation as "Under **Organization Settings**, go to Setup & Configurations and select General". Similar strings include "Under Organization Settings, go to Customization and select Transaction Number Series" and "Under **Module Settings**, go to Sales and select Sales Order / go to Purchases and select Expenses". Others read "Navigate to Module Settings and select Accountant under General" — [General preferences](https://www.zoho.com/us/books/help/settings/preferences.html); [Invoice Preferences](https://www.zoho.com/us/books/help/invoice/invoice-preferences.md); [AI Features](https://www.zoho.com/us/books/help/ai-features/ai-features.html)
- The help center's own Settings section is organized as: Organization (Organization Profile, Domain Mapping, Locations), Opening Balances, Users & Roles, Preferences, Currencies, Payment Terms, Taxes, Revenue Recognition, Sales Tax Automation, Emails, Reminders, Reporting Tags, Automation (Workflow Rules; Workflow Actions = Email Alerts, In-app Notifications, Field Updates, Webhooks, Functions; Schedules; Workflow Logs), PDF Templates, Customization (Custom Fields, Validation Rules, Record Locking, Custom Buttons, Related Lists, Custom Views, Web Tabs), Integrations, Privacy and Security, Connections, Developer and Data (Incoming Webhooks, API Usage, Signals, Web Forms, Data Management) and AI Features (AI Features, Claude Agents) — [Settings help index nav](https://www.zoho.com/us/books/help/settings/)
- The legacy Settings overview page (old flat structure: Organization Profile, Opening Balances, Users, Online Payments, Preferences, Currencies, Taxes, Templates, Automation, ZSC) is still published but is outdated. The India version adds Razorpay and ICICI Bank eazypay gateways — [US Settings overview](https://www.zoho.com/us/books/help/settings/); [India Settings overview](https://www.zoho.com/in/books/help/settings/)

**Settings tree reconstructed from current help-page navigation strings (verified items only)**

| Top-level | Group | Items (as named in help text) | Source |
|---|---|---|---|
| Organization Settings | Organization | Profile; Branding; Custom Domain; Locations (formerly Warehouses/Branches); AI Preferences; AI Control Center | [Org Profile](https://www.zoho.com/us/books/help/settings/organization/organization-profile.html), [Domain Mapping](https://www.zoho.com/us/books/help/settings/organization/domain-mapping.html), [Locations](https://www.zoho.com/us/books/help/settings/organization/locations/), [AI Features](https://www.zoho.com/us/books/help/ai-features/ai-features.html), [Claude Agents](https://www.zoho.com/us/books/help/ai-features/claude-agents.html) |
| Organization Settings | Users & Roles | Users; Roles; User Preferences (custom fields for users) | [Users & Roles](https://www.zoho.com/us/books/help/settings/users.html) |
| Organization Settings | Taxes & Compliance | Taxes (Tax Rates, Tax Settings > Tax Registration Number, etc.) | [Taxes](https://www.zoho.com/us/books/help/settings/taxes.html), [Sales Tax Automation](https://www.zoho.com/us/books/help/settings/sales-tax-automation.html) |
| Organization Settings | Setup & Configurations | General; Currencies; Opening Balances; Payment Terms; Customer Portal; Vendor Portal | [General](https://www.zoho.com/us/books/help/settings/preferences.html), [Currencies](https://www.zoho.com/us/books/help/settings/currencies.html), [Customer Portal Prefs](https://www.zoho.com/us/books/help/customer-portal/preferences.md) |
| Organization Settings | Customization | Transaction Number Series; PDF Templates; Email Notifications; Reporting Tags; Web Tabs; (Digital Signature in the older screenshot) | [General](https://www.zoho.com/us/books/help/settings/preferences.html), [PDF Templates](https://www.zoho.com/us/books/help/settings/pdf-templates/edit-templates.html), [Reporting Tags](https://www.zoho.com/us/books/help/settings/reporting-tag.html), [Web Tabs](https://www.zoho.com/us/books/help/settings/customization/web-tabs.html) |
| Organization Settings | Automation | Workflow Rules; Workflow Actions (Email Alerts, In-app Notifications, Field Updates, Webhooks, Functions, Schedules); Workflow Logs | [Workflow Rules](https://www.zoho.com/us/books/help/settings/automation/workflow-rules.html), [Schedules](https://www.zoho.com/us/books/help/settings/automation/schedules.html) |
| Organization Settings | Reminders & Notifications | Reminders; Email Notifications (Sender Email Preferences, Email Relay, Email Insights, Templates); SMS Notifications | [Emails](https://www.zoho.com/us/books/help/settings/emails.html), [Reminders](https://www.zoho.com/us/books/help/settings/reminders.html) |
| Organization Settings | Online Payments | Payment Gateways (with Card Verification Settings) | [Integrations](https://www.zoho.com/us/books/help/settings/integrations.html) |
| Organization Settings | Integrations & Marketplace | Zoho Apps; WhatsApp; Other Apps; Marketplace; Installed Extensions | [Bird IVR extension](https://www.zoho.com/us/books/help/extensions/bird-ivr.html), [WhatsApp](https://www.zoho.com/us/books/help/integrations/whatsapp/integrate-with-whatsapp.html) |
| Organization Settings | Developer Space / Developer Data (also "Extension and Developer Data") | Incoming Webhooks; Connections (reached from the Deluge editor); API Usage; Signals; Web Forms; Data Management (Backup Data, Backup Documents, Backup Audit Trail, Import History) | [Incoming Webhooks](https://www.zoho.com/us/books/help/settings/developer-and-data/incoming-webhooks.html), [API Usage](https://www.zoho.com/us/books/help/settings/developer-and-data/api-usage.html), [Signals](https://www.zoho.com/us/books/help/settings/developer-and-data/signals.html), [Web Forms](https://www.zoho.com/us/books/help/settings/developer-and-data/web-forms.html), [Data Management](https://www.zoho.com/us/books/help/settings/developer-and-data/backup.html) |
| Module Settings | General | Customers and Vendors; Items; Accountant; Revenue Recognition; Projects; Timesheet; Tasks | [Accountant Prefs](https://www.zoho.com/us/books/help/accountant/preferences.html), [Item Prefs](https://www.zoho.com/us/books/help/items/item-preferences.html), [Contacts Prefs](https://www.zoho.com/us/books/help/contacts/contact-preferences.html), [Tasks](https://www.zoho.com/us/books/help/tasks/) |
| Module Settings | Sales | Quotes; Sales Orders; Invoices; Recurring Invoices; Retainer Invoices; Payments Received; Credit Notes; Delivery Note Settings; Packing Slip Settings | [Invoice Prefs](https://www.zoho.com/us/books/help/invoice/invoice-preferences.md), [Quote Prefs](https://www.zoho.com/us/books/help/quote/preferences.html) |
| Module Settings | Purchases | Expenses; Purchase Orders; Bills; Payments Made; Vendor Credits | [Expense Prefs](https://www.zoho.com/us/books/help/expense/preferences.html), [Bill Prefs](https://www.zoho.com/us/books/help/bills/preferences.html) |
| Module Settings | Custom Modules | Overview (Create Module) + one entry per custom module | [Custom Modules basics](https://www.zoho.com/us/books/help/custom-modules/basic-functions.html) |

**Per-module settings tabs (from each module's Preferences help page)**

| Module | Tabs/sections documented | Source |
|---|---|---|
| Invoices | Preferences (allow editing sent invoices; snail-mail payment stub; show expense receipts on PDF; invoice order number from SO number or SO ref; payment notifications; auto thank-you note; attach payment receipt), Approvals, Fields, Validation Rules, Record Locking, Buttons, Related Lists | [Invoice Prefs](https://www.zoho.com/us/books/help/invoice/invoice-preferences.md) |
| Quotes | Allow editing accepted quotes; accept/decline via public link; auto-convert accepted quotes (none / draft invoice / invoice + email); hide zero-value lines; retain notes/T&C/address on conversion; Approvals; Fields; Validation Rules; Record Locking; Buttons; Related Lists | [Quote Prefs](https://www.zoho.com/us/books/help/quote/preferences.html) |
| Sales Orders | Update SO fields in invoices; T&C; Notes; Approvals; Fields; Validation Rules; Record Locking; **Statuses** (custom statuses); Buttons; Related Lists | [SO Prefs](https://www.zoho.com/us/books/help/sales-order/preferences.html) |
| Recurring Invoices | Create as Drafts / Create and Send / Create, Charge and Send; Buttons | [Recurring Invoice Prefs](https://www.zoho.com/us/books/help/recurring-invoice/preferences.html) |
| Retainer Invoices | Preferences; T&C; Customer Notes; Approvals; Fields; Validation Rules; Buttons; Related Lists; Statuses | [Retainer Prefs](https://www.zoho.com/us/books/help/retainer-invoice/preferences.html) |
| Credit Notes | Preferences; T&C; Customer Notes; Approvals; Fields; Validation Rules; Record Locking; Buttons; Related Lists | [Credit Note Prefs](https://www.zoho.com/us/books/help/credit-note/preferences.html) |
| Payments Received | Fields; Record Locking; Buttons | [Payments Received Prefs](https://www.zoho.com/us/books/help/payments-received/preferences.html) |
| Purchase Orders | Accept/decline via public links; when to close POs; T&C; Notes; Approvals; Fields; Validation Rules; Buttons; Related Lists; Statuses | [PO Prefs](https://www.zoho.com/us/books/help/purchase-order/preferences.html) |
| Bills / Vendor Credits | Approvals; Fields; Validation Rules; Buttons; Related Lists | [Bill Prefs](https://www.zoho.com/us/books/help/bills/preferences.html), [Vendor Credit Prefs](https://www.zoho.com/us/books/help/vendor-credits/preferences.html) |
| Payments Made | Approvals; Fields; Buttons; list-view customization | [Payments Made Prefs](https://www.zoho.com/us/books/help/payments-made/preferences.html) |
| Expenses | Preferences; Associate Users to Expenses; Mileage Preferences; Vehicles; Fields; Buttons; Related Lists | [Expense Prefs](https://www.zoho.com/us/books/help/expense/preferences.html) |
| Customers/Vendors | Preferences (allow duplicate display names, credit limit, address format placeholders); Fields; Buttons; Related Lists; multi-currency per contact | [Contact Prefs](https://www.zoho.com/us/books/help/contacts/contact-preferences.html) |
| Items | Decimal quantity; duplicate item names; HSN/SAC; out-of-stock warning; reorder point; Fields; Record Locking; Buttons; Related Lists | [Item Prefs](https://www.zoho.com/us/books/help/items/item-preferences.html) |
| Accountant | Mandatory/unique account codes; auto-generated account code formats; default accounts (exchange gain/loss, etc.); manual-journal approvals; recurring journal prefs; Journal Fields | [Accountant Prefs](https://www.zoho.com/us/books/help/accountant/preferences.html) |
| Projects / Timesheet | Preferences; Fields; Buttons; Related Lists (Projects); Preferences and Fields (Timesheet) | [Project Prefs](https://www.zoho.com/us/books/help/projects/preference.html), [Timesheet Prefs](https://www.zoho.com/us/books/help/timesheet/preferences.html) |
| Custom module | Overview (layouts); Fields & Tables; Rules (Validation Rules, Layout Rules); Approvals; Buttons; Related Lists; Blueprints; Preferences (portals) | [Custom Module Prefs](https://www.zoho.com/us/books/help/custom-modules/preferences.html) |

- **General** under Setup & Configurations covers several switches. "Enable Modules" checkboxes turn sidebar modules on or off; disabled modules stay reachable via API. It also holds the Zoho Inventory add-on toggle, first day of the work week (Sunday/Monday/Saturday), attaching quote and invoice PDF links in emails and encrypting PDFs. Discounts can be none, line-item level (tax-inclusive or tax-exclusive), transaction level (before or after tax) or both. Further items are additional charges (Adjustments, Shipping), the salesperson field, profit margin (with role-based field access), the default income account and markup percentage for billable bills and expenses, and the weekly summary report sent to admins. The organization address format is built from placeholders. Secure public links require email or phone identity verification — [General](https://www.zoho.com/us/books/help/settings/preferences.html)
- An undated (older) screenshot of Enable Modules lists Estimates, Sales Orders, Purchase Orders, Time Tracking, Retainer Invoices, Recurring Invoice, Recurring Expense, Recurring Bills, Recurring Journals, Credit Note, Payment Links and Tasks. "Estimates" has since been renamed Quotes — [enable-modules.png](https://www.zoho.com/books/help/images/settings/enable-modules.png); [nav "Quotes (Formerly Estimates)"](https://www.zoho.com/us/books/help/settings/)

### Inferences
- The two-tier split (Organization Settings and Module Settings) is consistent across dozens of 2025–2026 help pages. The card-grid screenshot is likely the pre-regrouping design, so the current page probably keeps the full-page, searchable, grouped-list layout under the two new headings.
- One generic set of tabs (Fields, Validation Rules, Record Locking, Buttons, Related Lists, Approvals, Statuses) is reused across modules. Each module enables a subset.

### Gaps
- No current (2026) screenshot of the whole Settings landing page was found. Whether groups appear as a left rail or as cards, and their exact order, is unverified.
- "Manage Subscription", "Branding" (only mentioned in passing) and "Digital Signature" (only in the older screenshot) could not be confirmed as current menu items. Digital signatures are documented through the Zoho Sign integration ([Sign](https://www.zoho.com/us/books/help/integrations/sign-integration.html)).
- Help text places Email Notifications under both "Customization" and "Reminders & Notifications". It also places Marketplace under both "Integrations & Marketplace" and "Developer Space". The current canonical placement is ambiguous.

---

## 2. Users & Roles: default roles, custom roles, permission matrix, data scoping, invitations, limits, SSO/2FA

### Takeaway
There are four editable-access default roles (Admin, Staff, Staff (Assigned Customers Only), Timesheet Staff), a single Super Admin privilege, and an Accountant user type. Custom roles (Professional+) use a per-module matrix: Full, View, Create, Edit, Delete, Approve, Assign owner, Edit Locked Records, plus "More Permissions" pop-overs. "Segmented Access Control" then limits record visibility by Location, one access-controlled Reporting Tag, or Bank Account. Each user is assigned specific values of those dimensions.

### Cited Findings
- Standard roles are Admin, Staff, Timesheet Staff and Staff (Assigned Customers Only). Admin has complete access to all modules, transactions and settings, and creates and assigns roles. Staff can access all modules except Reports, Settings and Accountant. Timesheet Staff can only log time in Timesheets. Staff (Assigned Customers Only) sees all modules and data related to their assigned customers. Default roles cannot be edited or deleted, but their access control can be modified — [Users & Roles](https://www.zoho.com/us/books/help/settings/users.html)
- **Super Admin** is a privilege auto-assigned to the org creator. There is one per org, shared across all Zoho Finance apps (Invoice, Billing, Expense, Inventory, Payroll, Commerce, Checkout, Zakya, Practice, Vikra). Only the Super Admin can set up the org in other Finance apps (other admins send a request) and only the Super Admin can delete the org. The privilege can be transferred via "Make Super Admin" — [Users & Roles](https://www.zoho.com/us/books/help/settings/users.html)
- **Accountant users:** the New Role form has a checkbox "This role is for Accountant users", and all users added with that role become accountant users — [custom-role.png](https://www.zoho.com/books/help/images/settings/custom-role.png). The Free plan includes "1 User + 1 Accountant" — [Pricing](https://www.zoho.com/us/books/pricing/). Accountants get a "Manage Clients" console to create client orgs and see "Pending Reviews" (tax returns, uninvited users, unreconciled bank items, draft journals, pending approvals, unassociated documents) filtered by the Accountant role's permissions — [Manage Clients](https://www.zoho.com/us/books/help/accountant/manage-clients.html)
- **Custom role creation:** Settings > Roles > New Role. The General tab takes Role Name, Description and module access levels, with "More Permissions" for extra options. Proceed then leads to the **Segmented Access Control** tab. Roles can be cloned — [Users & Roles](https://www.zoho.com/us/books/help/settings/users.html); [Approvals: Users and Roles](https://www.zoho.com/us/books/help/transaction-approval/users-and-roles.html)
- **Permission matrix structure (verified from screenshots):**

| Section → row | Columns | "More Permissions" examples | Source |
|---|---|---|---|
| Contacts → Customers | Full, View, Create, Edit, Delete, Assign owner | Communication, Statement, Sync Zoho CRM, Merge, Configure Credit Limit; inline checkboxes "Allow users to handle the data and transactions for assigned customers only", "Allow users to access Customer Groups…" | [custom-role.png](https://www.zoho.com/books/help/images/settings/custom-role.png) |
| Contacts → Vendors | Full, View, Create, Edit, Delete | inline "Allow users to add, edit and delete vendor's bank account details" | [custom-role.png](https://www.zoho.com/books/help/images/settings/custom-role.png) |
| Sales → Invoices, Customer Payments, Estimates, Delivery Challan, Sales Orders, Credit Notes | Full Access, View, Create, Edit, Delete, **Approve**, **Edit Locked Records** | Invoices: Email, Void invoices, Write Off invoices, Edit and Delete approved Invoices | [new-role-for-approvers.png](https://www.zoho.com/books/help/images/transaction-approval-new-flow/users-and-roles/new-role-for-approvers.png) (India-edition screenshot, "Estimates/Delivery Challan" naming) |
| Settings section | e.g., "Provide access to protected data" (PII), "Update Organization Profile" | — | [Privacy and Security](https://www.zoho.com/us/books/help/settings/privacy.html); [Org Profile](https://www.zoho.com/us/books/help/settings/organization/organization-profile.html) |
| Locations section | permissions to enable/create/access locations | — | [Locations basics](https://www.zoho.com/us/books/help/settings/organization/locations/basic-functions.html) |
| Custom Modules section | per-module checkboxes or "All Access"; admins must edit roles after each new custom module is created | — | [Custom Modules: Functions](https://www.zoho.com/us/books/help/custom-modules/functions.html) |

- **Segmented Access Control (role level):** by default only role permissions apply. The admin can tick record types to restrict per dimension. *Locations* (Transactions) limits users to their associated locations. *Reporting Tags* is available only for the single tag with access control enabled; admins choose record types and an "Allow Access to All Unassigned Records" option. *Bank Accounts* limits users to their associated bank accounts — [Users & Roles](https://www.zoho.com/us/books/help/settings/users.html). Only one reporting tag per org can have access control, and up to 500 tag options can be associated at user level — [Reporting Tags](https://www.zoho.com/us/books/help/settings/reporting-tag.html). The "User access control tag" is Elite/Ultimate only — [Plan comparison](https://www.zoho.com/us/books/pricing/pricing-comparison.html)
- **Invite flow:** Settings > Users > Invite User takes Name, Email and Role. Under "Restrict Access To" there are Locations and access-controlled tag tabs. The Locations tab also sets the user's Default Business Location and Default Warehouse Location. An "Associated Values" pane summarizes the selections. Saving sends a verification email and the user sets a password. Users see only records matching **all** associated values. Only Admins can add or edit users. Users can be marked Inactive/Active or deleted — [Users & Roles](https://www.zoho.com/us/books/help/settings/users.html); [new-user.png](https://www.zoho.com/books/help/images/settings/new-user.png)
- **User Preferences:** custom fields for users (any field data type, with a PII flag) appear on the invite form. Buttons can also be created for "Users and Preferences" — [Users & Roles](https://www.zoho.com/us/books/help/settings/users.html); [Buttons](https://www.zoho.com/us/books/help/settings/customization/custom-buttons.html)
- **Field-level access per role:** each custom field (and profit-margin fields) can be set to Read and Write, Read Only or Hide Field per role. Admin is always unrestricted — [Fields](https://www.zoho.com/us/books/help/settings/customization/custom-fields.html)
- **User limits by plan (US):** Free 1 user + 1 accountant; Standard 3; Professional 5; Premium 10; Elite 10; Ultimate 15. Extra users cost $3/user/month or $2.50 billed annually. Custom user roles are Professional+ — [Pricing](https://www.zoho.com/us/books/pricing/); [Plan comparison](https://www.zoho.com/us/books/pricing/pricing-comparison.html)
- **SSO/2FA for org users:** third-party IdP guides describe SAML 2.0 SSO for Zoho Books, configured in Zoho's admin console (Organization > SAML Authentication), with MFA layered by the IdP — [Duo: SSO for Zoho Books](https://duo.com/docs/sso-zoho-books); [ManageEngine Identity360](https://www.manageengine.com/identity-360/integrations/zoho-books-sso.html). For portals, Zoho Books has its own MFA option for customer and vendor portal users ("Enable multi-factor authentication (MFA)" in Customer Portal Preferences, with admin reset) — [Portal MFA](https://www.zoho.com/us/books/help/customer-portal/multi-factor-authentication.html)

### Inferences
- Authentication for staff users (password, 2FA, SAML) is handled by the shared Zoho Accounts / Zoho Directory identity layer rather than inside Books Settings. Books Settings handles authorization: roles, segmentation and field access.
- The matrix columns vary by module type. Masters get Assign owner; transactions get Approve and Edit Locked Records.

### Gaps
- The full list of matrix sections (Reports, Banking, Accountant, Projects, Documents, Settings sub-permissions) and their "More Permissions" options is not published in text. Only partial screenshots exist.
- No official Zoho help page on 2FA/SAML specifically for Zoho Books staff users was found, and Zoho Directory handling was not confirmed.
- "Restrict to own records" style data sharing was not found as a generic setting. The documented equivalents are the "assigned customers only" checkbox and role and the Assign owner column.

---

## 3. Per-module customization: fields, data types, limits, validation rules, layouts, buttons, related lists, record locking, views

### Takeaway
Every standard module has a **Fields** tab with about 20 Standard data types and 3 AI data types. Options include help text, PII/ePHI privacy, unique values, regex input formats, defaults (static or inherited from a related module), mandatory, show-on-PDF, per-role access and an API name. Per-data-type quotas vary by plan. Validation Rules, Record Locking, Buttons and Related Lists are Premium+. Custom Views are on all plans. Layouts and Layout Rules exist only for custom modules.

### Cited Findings
**Field creation options** (Settings > module > Fields > + New Field) — [Fields](https://www.zoho.com/us/books/help/settings/customization/custom-fields.html)
- The form takes Label Name, Data Type and Help Text.
- **Data Privacy** has two modes. *PII* (Text, Email, URL, Phone, Number, Date) is either "Sensitive – encrypt and store", viewable only by users with PII permission, or "Not sensitive – store without encryption", which stays searchable. *ePHI* (Text, Email, URL, Phone, Date) is always encrypted, visible only to users with protected-data access, and not searchable.
- **Prevent Duplicate Values** (unique) is unavailable with Data Privacy. On a module with more than 10,000 records the uniqueness update runs asynchronously, with an in-app notification.
- **Input Format**, for single- and multi-line text: either *Standard Formats* (Numbers; Alphanumeric with or without spaces; Alphanumeric with hyphens and underscores; Alphabets with or without spaces) or *Configure Custom Format* (regex, e.g., `^[A-Z]{2}[0-9]{6}[A-Z]{1}$`).
- **Default Value** is static or **Inherit value** from a field of a related module (e.g., an invoice field inheriting from Customers).
- **Is Mandatory** and **Show in All PDFs** are Yes/No toggles.
- **API Field Name** is shown after save.
- Lifecycle actions are Edit, Mark Inactive/Active, Configure Access (per role) and Delete. Deleting a field with data triggers a **Force Delete** that purges its data.
- A "Custom Fields Usage" view shows quota use per module and type group (Numerical, Decimal, String, Boolean, Long Text, Multi-select, Formula).

**Data types** — [Field Data Types](https://www.zoho.com/us/books/help/settings/customization/custom-field-data-types.html)

| Data type | Mechanics / options |
|---|---|
| Text Box (Single Line) | Up to 255 chars |
| Email, URL (with Hyperlink Label), Phone | — |
| Number | Whole numbers including negatives |
| Decimal | Positive or negative decimals |
| Amount | Value with org default currency code |
| Percent | — |
| Date | Custom or relative (Today, Tomorrow, Starting Date of Month) |
| Date and Time | YYYY-MM-DD HH:MM |
| Check Box | Optional default ticked |
| Auto-Generate Number | Starting Number, Prefix, Suffix; optional one-time backfill to existing records (cannot be changed later) |
| Dropdown | Options added singly, in bulk (one per line) or from predefined lists (Days of Week, Months, Countries); per-option colour (Next to Option / Wrap Option); options can be inactivated |
| Multi-select | Same as Dropdown; up to 30 selections |
| Lookup | Pulls a record from another module and auto-creates a Related List on the target |
| Multi-Select Lookup | Many-to-many; pop-up or dropdown pickers; related list on both sides |
| Text Box (Multi-line) | Up to 36,000 chars excluding rich-text formatting |
| Attachment | Images (GIF, PNG, JPG, JPEG, BMP, TIF, TIFF) or Docs (XLS, XLSX, DOC, DOCX, XML, CSV, PDF, TXT); 1 file under 7 MB; "Display in Portal" for Invoices and Quotes |
| Formula | Predefined functions, fields, operators |
| External Lookup | Pick a Zoho app as the Service and look up one of its fields |
| Image | Up to 5 MB; JPG/JPEG/PNG/BMP; shown inline on the Details page; placed on PDFs via placeholder |
| AI: Keyword Extraction | Input = text field; output = single- or multi-line text |
| AI: Sentiment Analysis | Input = text field; output Positive/Negative/Neutral |
| AI: Image to Text | Input = Image field + prompt; output text |

- AI fields require enabling under Organization > AI Preferences, choosing a provider and model (currently "Zia and Internal LLM"). Values regenerate on record create or update — [Field Data Types](https://www.zoho.com/us/books/help/settings/customization/custom-field-data-types.html). The AI Features page (older wording) still calls AI-powered fields "Early Access" — [AI Features](https://www.zoho.com/us/books/help/ai-features/ai-features.html)

**Custom field quotas per module, by plan (US)** — [Plan comparison](https://www.zoho.com/us/books/pricing/pricing-comparison.html)

| Type group | Free | Standard | Professional | Premium | Elite | Ultimate |
|---|---|---|---|---|---|---|
| String (Text single-line, Email, URL, Phone) | – | 20 | 20 | 50 | 50 | 50 |
| Numerical (Number, Date, Date & Time) | – | 12 | 12 | 30 | 30 | 30 |
| Decimal (Decimal, Amount, Percent) | – | 10 | 20 | 20 | 20 | 20 |
| Lookup | – | 5 | 5 | 5 | 5 | 5 |
| Text box (Multi-line) | – | 5 | 5 | 5 | 5 | 5 |
| Dropdown | – | 10 | 25 | 25 | 25 | 25 |
| Attachment | – | 4 | 10 | 10 | 10 | 10 |
| Boolean (Check Box) | – | 10 | 20 | 20 | 20 | 20 |
| Multi-select | – | 2 | 2 | 5 | 5 | 5 |
| Auto-generate number | – | 1 | 1 | 1 | 1 | 1 |
| Formula | – | – | – | 2 | 5 | 5 |
| Unique fields | – | – | – | 4 | 4 | 4 |
| AI fields | – | – | – | 2 | 2 | 2 |
| Multi-select Lookup | – | – | – | 1 | 1 | 1 |

**Validation Rules** (Premium, Elite, Ultimate) — [Validation Rules](https://www.zoho.com/us/books/help/settings/customization/validation-rules.html)
- Path: Settings > module > Validation Rules tab (custom modules: Rules > Validation Rules) > + New Validation Rule.
- A rule has a Name, one or more "+ Add Rule" conditions on fields, each with its own **Alert Message**. A violating record is not saved and the alert is shown.
- Scope is all records by default, or "Based on specific criteria", with multiple criteria and an editable criteria pattern.
- **Subrules** add further condition plus message pairs under criteria-scoped rules.
- Rules can be marked Active/Inactive or deleted. Rules also apply when the same module is edited in integrated Zoho apps such as Zoho Inventory.

**Record Locking** (Premium, Elite, Ultimate) — [Record Locking](https://www.zoho.com/us/books/help/settings/customization/record-locking.html)
- Supported modules are Items, Quotes, Sales Orders, Invoices, Credit Notes and Custom Modules.
- A **Lock Configuration** has a Name, a Description, and an Actions setting (Restrict All / Restrict Selected / Allow Selected). A Fields setting (Restrict All / Restrict Selected / Allow Selected) exists only for Items and Custom Modules. "Lock Records For" is All Roles or All Roles Except [roles].
- On a record, More > Lock asks for a configuration and a reason. A lock icon shows who locked it, when and why. Unlock requires a reason.
- Inactivating a configuration keeps existing locks. Deleting it unlocks the records.
- The role matrix column "Edit Locked Records" governs bypass — [new-role-for-approvers.png](https://www.zoho.com/books/help/images/transaction-approval-new-flow/users-and-roles/new-role-for-approvers.png)

**Buttons** (Premium, Elite, Ultimate) — [Buttons](https://www.zoho.com/us/books/help/settings/customization/custom-buttons.html); [Custom Modules: Other Actions](https://www.zoho.com/us/books/help/custom-modules/other-actions.html)
- Available for Users and Preferences, Customers and Vendors, Projects, Sales, Purchases and Items, up to **10 buttons and links per module**.
- **Action Type** is one of three:
  - *Execute Task* runs a Deluge script.
  - *Open URL* is a URL with placeholders plus a visibility setting.
  - *Convert Record* is for custom modules only. It maps fields in Deluge to a target module (Quotes, Sales Orders, Invoices, Purchase Orders, Bills or another custom module) via a lookup and opens a prefilled New record.
- **Location** is Details Page, List Page – Action Menu, or List Page – Bulk Action Menu (Execute Task only).
- "When to show" is Always or criteria-based. Criteria templates exist for Invoices and Quotes on the Details page.
- "Who can access" is Only me, Only Selected Users (& Roles) or Everyone.
- Save or Save and Execute. Buttons can be reordered per location, and executions appear in Workflow Logs.

**Related Lists** (Premium, Elite, Ultimate) — [Related Lists](https://www.zoho.com/us/books/help/settings/customization/related-lists.html)
- Available for Items, Customers/Vendors, Sales (Quotes, Invoices, Sales Orders, Retainer Invoices, Credit Notes), Purchases (Expenses, Bills, POs, Vendor Credits) and Projects. **Max 10 per module.**
- There are two kinds:
  - A list created automatically by a Lookup field, editable only through that field.
  - A **Deluge script** list, visible to Only Me or Everyone. It must return a map with `header_context` (key/value column defs) and `data` (rows; cells as strings or `{value, isExternal, link}` hyperlinks) plus optional `page_context` {page, per_page, has_more_page} for pagination. The documented sample calls Zoho Desk APIs via `invokeurl` with a named connection.

**Custom Views** (all plans incl. Free) — [Views](https://www.zoho.com/us/books/help/settings/customization/custom-views.html)
- The list-page dropdown has sections for Favorites, Default Filters (system, not editable) and user-created views.
- A view has a Name (+ favorite), criteria (field, comparator, value; + Add Criterion), Columns Preference (drag-ordered) and Visibility.
- Visibility covers "Use Custom View In" other Zoho apps (Billing, Inventory) and "Share With" (Only Me, Selected Users & Roles, Everyone).

**Statuses**
- Sales Orders, Purchase Orders and Retainer Invoices have a "Statuses" tab for creating new statuses — [SO Prefs](https://www.zoho.com/us/books/help/sales-order/preferences.html); [PO Prefs](https://www.zoho.com/us/books/help/purchase-order/preferences.html). Tasks also have configurable Statuses, Fields and Permissions — [Tasks](https://www.zoho.com/us/books/help/tasks/)

**Transaction Posting Date**
- A system field, inactive by default, that is activated per module in the Fields tab (invoices, sales receipts, credit notes, payments received, bills, vendor credits, payments made).
- Once active it drives transaction locking and can be used in workflow criteria, views and aging reports — [General](https://www.zoho.com/us/books/help/settings/preferences.html)

**Layouts / Layout Rules** (custom modules only)
- Custom modules can have multiple layouts (the Overview tab lists layouts; web forms are created per layout) — [Web Forms](https://www.zoho.com/us/books/help/settings/developer-and-data/web-forms.html)
- A **Layout Rule** has conditions (field + comparator such as is / isn't / is empty / is not empty, with multiple criteria and multiple conditions) and actions: Show Fields, Enable Fields, Set Field Value, Set Field as Mandatory. The rule can be marked Active/Inactive. It is plan-gated ("certain plans") — [Layout Rules](https://www.zoho.com/us/books/help/custom-modules/layout-rules.html)

### Inferences
- Standard modules have a fixed form layout. Field order and placement for standard modules is not documented beyond PDF placement and the custom-field list.
- Validation Rules, Buttons, Related Lists and Record Locking share a common pattern: a per-module tab, a list with Active/Inactive status, a dropdown action menu and criteria builders.

### Gaps
- The exact formula function library for Formula fields (linked "Formula data type" page) was not fetched.
- No evidence was found of page layouts (multiple layouts or field placement) for standard modules. This appears to be a custom-module-only capability.
- The limit for custom statuses and the plan gating for Layout Rules were not specified.

---

## 4. Custom Modules: definition, fields/tables, relationships, UI placement, behaviour, API, limits

### Takeaway
Admins create a custom module with Module Name, Plural Name, Description, optional cross-app use, and a mandatory Primary Field. They then build its form in a drag-and-drop builder with sections (1 or 2 columns), fields, and line-item **tables** that have summary aggregates and formulas. Custom modules get most platform features: views, import/export, approvals, validation and layout rules, buttons (incl. record conversion), related lists, blueprints, record locking, portals, web forms, HTML PDF templates, workflows and a REST API. Limits are 10 modules on Premium and Elite and 25 on Ultimate.

### Cited Findings
- **Plan limits:** Premium 10, Elite 10, Ultimate 25 custom modules — [Custom Modules](https://www.zoho.com/us/books/help/custom-modules/); [Plan comparison](https://www.zoho.com/us/books/pricing/pricing-comparison.html)
- **Create:** Settings > Custom Modules > Overview > Create Module.
  - Module Details are Module Name, Plural Name, Description and "Use Custom Module In" (integrated Zoho Finance apps).
  - Primary Field Properties are Label Name and Data Type. The primary field identifies records and can be renamed but never deleted.
  - Only admins can create custom modules — [Basic Functions](https://www.zoho.com/us/books/help/custom-modules/basic-functions.html); [Functions](https://www.zoho.com/us/books/help/custom-modules/functions.html)
- **Sidebar placement:** the module appears under **More** in the left sidebar (later docs say "Custom Modules on the left sidebar") — [Basic Functions](https://www.zoho.com/us/books/help/custom-modules/basic-functions.html); [Other Actions](https://www.zoho.com/us/books/help/custom-modules/other-actions.html)
- **Form builder** ("Manage Fields and Tables"):
  - The left palette has New Section, New Table, New Fields (data types) and Unused Elements. Fields are dragged into sections, and sections have 1 or 2 columns.
  - **Tables** (line items) have Table Name and Table Columns. Column types are Text single-line, Email, URL, Phone, Number, Decimal, Amount, Percent, Date, Date and Time, Check Box, Dropdown, Lookup, Formula and External Lookup.
  - The **Table Summary** holds summary fields with Aggregates (sum, average, max, min, over amount, decimal, integer or percent columns) or Formulas (module fields only).
  - Table options are allow row reordering, max rows, mandatory table, and show in all PDFs.
  - Sources: [Basic Functions](https://www.zoho.com/us/books/help/custom-modules/basic-functions.html); [form-new-field.png](https://www.zoho.com/books/help/images/custom-module/basic-functions/form-new-field.png)
- **Relationships:** via Lookup and Multi-Select Lookup fields, which auto-create related lists, and via External Lookup to other Zoho apps — [Field Data Types](https://www.zoho.com/us/books/help/settings/customization/custom-field-data-types.html)
- **Records:** + New, then fill fields and line items (+ Add Line Item). Records support Edit, Delete, Clone, Bulk Update, attachments (device, WorkDrive, Google Drive, Dropbox, OneDrive, Documents module), sorting, column chooser and refresh. Custom views have criteria, columns and visibility — [Other Actions](https://www.zoho.com/us/books/help/custom-modules/other-actions.html); [Manage](https://www.zoho.com/us/books/help/custom-modules/manage-custom-module.html)
- **Import/Export:** import records, then tables, overwriting by Record Name or Module Record ID. Export supports CSV/XLS/XLSX, records without tables or one table's data, date range, export templates, a PII inclusion toggle and a file password — [Basic Functions](https://www.zoho.com/us/books/help/custom-modules/basic-functions.html); [Other Actions](https://www.zoho.com/us/books/help/custom-modules/other-actions.html)
- **Module settings tabs:** Approvals (Simple / Multi-Level), Fields & Tables, Preferences (portal exposure), Rules (Validation, Layout), Buttons (incl. Record Conversion), Related Lists and Blueprints. The custom-module Preferences page shows "Plans | Limits: Premium 25, Elite 70, Ultimate 70" — [Custom Module Preferences](https://www.zoho.com/us/books/help/custom-modules/preferences.html)
- **Field access per role** and **module permissions** come from the role matrix (Custom Modules section, All Access option). Roles must be updated after each new module — [Functions](https://www.zoho.com/us/books/help/custom-modules/functions.html)
- **Blueprints** (Elite and Ultimate):
  - A blueprint is a process flow over a Dropdown "Blueprint Field", whose options become **States**. It runs "Always" or on criteria.
  - **Transitions** link states. Types are normal, *Sequential* (up to 5 ordered sub-transitions) and *Parallel* (up to 5 simultaneous sub-transitions). Triggers are Manually (button on the Details page, optionally reusable in other states) or **Using API** (an OAuth URL is generated).
  - *Before* settings are criteria and Transition Owners (any one owner completes it). *During* inputs are No Input, or Fields, Checklists and Messages. *After* actions are immediate or time-based.
  - Per-state **SLA**: max duration in minutes, hours or days, with escalation actions and before/after-escalation actions.
  - Blueprints have Draft and Publish states. Published transitions cannot be edited; a draft is published to replace them. Records can be bulk added to or removed from a blueprint.
  - "Generate Blueprint Using Zia" builds a blueprint from a prompt after it is enabled in AI Preferences.
  - Sources: [Blueprints](https://www.zoho.com/us/books/help/custom-modules/blueprints.html); [Plan comparison](https://www.zoho.com/us/books/pricing/pricing-comparison.html)
- **Portals:** custom modules can be exposed in Customer and Vendor portals.
  - Options are Create and Edit Records, Save as Draft and Add Comments. A **Lookup Field** links records to the contact, and visibility is all records or criteria-based.
  - Per-field "Display in Portal" and "Edit in Portal" settings exist, but not for Attachment, Lookup or External Lookup fields.
  - Portal submissions land in a "Portal Submitted" view for Accept or Delete.
  - Source: [Custom Modules in Portals](https://www.zoho.com/us/books/help/custom-modules/custom-modules-in-customer-and-vendor-portals.html)
- **Web Forms** (plan-gated) create public forms tied to a custom module and layout. They offer a rich-text success message, a redirect (same or new tab) and CAPTCHA.
  - Forms with sensitive fields such as card details or OTPs are saved as "Spam" and blocked from publishing.
  - Fields can be prefilled via URL params `?cf_api_name=value`.
  - Submissions wait in "Web Forms Pending Approval" until accepted. Forms can be reported as abuse and blocked.
  - Source: [Web Forms](https://www.zoho.com/us/books/help/settings/developer-and-data/web-forms.html)
- **HTML PDF Templates** (custom modules only; details in Q6) — [HTML PDF Template](https://www.zoho.com/us/books/help/settings/html-pdf-templates.html)
- **API:** endpoints exist to create, list, update, get and delete a custom module (`/books/v3/settings/modules`, `/settings/modules/cm_debtor`). Record endpoints cover create, bulk update, list, delete many, update, get and delete one (`/books/v3/cm_debtor`) — [API: Custom Modules](https://www.zoho.com/books/api/v3/custom-modules/)
- **Analytics:** custom-module reports via the Zoho Analytics integration — [Other Actions](https://www.zoho.com/us/books/help/custom-modules/other-actions.html)

### Inferences
- The "25/70/70" limit shown on the custom-module Preferences page matches the "Custom approval workflows 25/70/70" row in the plan comparison, so it most likely refers to custom approval limits. It does not appear to be a field limit.
- The internal API name of a custom module is prefixed `cm_` and custom fields use `cf_`, as seen in the API paths and web-form prefill examples.

### Gaps
- Per-custom-module field limits and records-per-module limits are not documented.
- The help pages do not say whether custom modules can have their own sidebar position or icon beyond "More/Custom Modules".

---

## 5. Automation: workflow rules, actions, logs, schedules, functions (Deluge and CLI), buttons, incoming webhooks, connections, signals, approvals, Zoho Flow

### Takeaway
A workflow rule is built in three parts: module, trigger and criteria. The trigger is event-based (Created, Edited, Created or Edited, Deleted, Submitted, Approved, Rejected, with field-change conditions) or date-based. Criteria allow up to 10 criteria, each with up to 10 conditions joined by AND/OR in an editable pattern. The rule then takes immediate or time-based actions drawn from a reusable library of Workflow Actions: Email Alerts, In-app Notifications, Field Updates, Webhooks and Functions. Execution is asynchronous, logged with retries and failure digests, and metered by daily quotas. Schedules run Deluge on a recurrence. Functions can now also be written in Java, Node.js or Python via the Zoho Finance CLI.

### Cited Findings
**Workflow Rules** — [Workflow Rules](https://www.zoho.com/us/books/help/settings/automation/workflow-rules.html)
- Step 1 is Name, Description and **Module**.
- Step 2 is the Workflow Type:
  - **Event Based**, with Action Type = Created / Edited / Created or Edited / Deleted / Submitted (for approval) / Approved / Rejected. For Edited and Created-or-Edited, "Execute the workflow when" is one of: any field updated; any selected field updated; all selected fields updated; any selected field not updated; all selected fields not updated (max 3 fields). "Execute when the record is" is Edited for the first time or Edited each time.
  - **Date Based**: Date of Execution is N days before or after a date field, with an Execution Time and an Execution Cycle of Once, Daily, Weekly, Monthly or Yearly. It applies only to records created or edited after the rule exists.
- Step 3 is **Criteria**: field, comparator and value, + Add Criterion, AND/OR, an editable CRITERIA PATTERN, and "up to 10 criteria for one workflow, and within each criterion… up to 10 criteria".
- Step 4 is **Actions**: *Immediate Actions* or *Time Based Actions* (with EXECUTION TIME). Pick Type and Name from saved workflow actions or create one inline ("+ New %Workflow Action%").
- Rules run in the background.
- Other operations: change order per module (list ordering), edit, clone, active/inactive, filter by module or status, delete. A **Usage Stats** panel shows the day's total and triggered counts of functions, webhooks and email alerts.

**Workflow action types and per-rule caps**

| Action | Configuration | Per rule | Per day | Source |
|---|---|---|---|---|
| Email Alert | Name, Module, From (verified sender or "Created By"), Email Template, Recipients (users, roles), Cc, Bcc, Attachments (module-dependent) | max 5 | plan-dependent; KB: 500/day | [Email Alerts](https://www.zoho.com/us/books/help/settings/automation/workflow-actions/email-alerts.html); [KB](https://www.zoho.com/books/kb/automation/number-of-workflows.html) |
| In-app Notification | Name, Module, Recipients (users, roles, associated contacts), Message with placeholders | KB: no limit | KB: no limit | [In-app](https://www.zoho.com/us/books/help/settings/automation/workflow-actions/in-app-notifications.html); [KB](https://www.zoho.com/books/kb/automation/number-of-workflows.html) |
| Field Update | Name, Module, Field, Value, "Update with empty value?" | max 3 | KB: no limit | [Field Updates](https://www.zoho.com/us/books/help/settings/automation/workflow-actions/field-updates.html) |
| Webhook | URL + placeholders; method POST (default) / PUT / DELETE; Custom Parameters; HTTP Headers; Security = General (basic/API/none) or Connections; optional secret token (12–50 alphanumeric) for HMAC signing; Body = Default Payload (JSON of all module params) / x-www-form-urlencoded / Raw JSON | 1 | plan-dependent; KB: 1,000/day | [Webhooks](https://www.zoho.com/us/books/help/settings/automation/workflow-actions/webhooks.html) |
| Function (custom function) | Name, Description, Module, Programming Language (Deluge or CLI languages); return type void/map | KB: 1 | KB: 1,000/day | [Functions](https://www.zoho.com/us/books/help/settings/automation/workflow-actions/custom-functions.html); [KB](https://www.zoho.com/books/kb/automation/number-of-workflows.html) |

- **Webhook delivery semantics:**
  - Success means a 2xx response within timeouts (5 s connect, 10 s read). Any 3xx, 4xx, 5xx or timeout counts as a failure, and "Skipped" means the daily limit was reached.
  - The default retry is 5 attempts with the same payload. A custom policy allows up to 20 retries (fixed, additive or multiplicative).
  - A failure notification is sent after 20 or more consecutive failures. Manual retry is available and does not count toward the daily limit.
  - The signature is HMAC-SHA256, base64, in the header `X-Zoho-Webhook-Signature`. It is computed over the sorted key-value pairs of the query and form params, concatenated, with the raw JSON appended.
  - The page also documents SMS gateway recipes (Bulk SMS, SMS-Magic, Text Local) using `${CONTACT.CONTACT_MOBILE_PHONE}`-style placeholders.
  - Source: [Webhooks](https://www.zoho.com/us/books/help/settings/automation/workflow-actions/webhooks.html)

**Workflow Logs** — [Workflow Logs](https://www.zoho.com/us/books/help/settings/automation/workflow-logs.html)
- Logs are tabs per action type (Custom Functions, Webhooks, Email Alerts). Columns are Time of Execution, Workflow Rule, Module, Record and Status.
- The detail panel shows Response, Failure Reason and Retry Attempts.
- Filters are Status, Rule, Module and Date Range. Export is CSV or XLS.
- Only users who can manage Workflow Rules can see logs.
- **Configure Failure Preferences** has three parts:
  - *Usage Limit Notifications*: threshold alerts for Email Alerts, Webhooks and Functions. Admins also get in-app alerts.
  - *Failure Notification*: a digest that is Hourly, Daily, Weekly or Monthly, with a time and recipients.
  - *Retry Policy*: for Webhooks and Functions (off by default for functions). The method is Fixed, Additive or Multiplicative, with an interval, a factor, a count and a "Pattern preview".

**Functions (Deluge)** — [Functions](https://www.zoho.com/us/books/help/settings/automation/workflow-actions/custom-functions.html)
- Deluge ("Data Enriched Language for the Universal Grid Environment") is Zoho's online scripting language, with a reference guide and code samples linked.
- The editor header has **Custom Execution Status** codes (return type must be `map`): 1000 Missing Input Value, 1001 Input Data Type Mismatch, 1002 Invalid Input Format, 1003 Rule Violation, 1004 Duplicate Data Entry, 1005 Third Party Failure, 1006 External Timeout, 1007 External Authorization Failure, 1008 Parsing Error, 1009 Unknown Error.
- It also has **Deluge Components Usage (per day)**, with Total, Used and Remaining for `invoke_url_api`, `webhook` and `email`, and a Connections link.
- Default input maps: `user` (name, zuid), `organization` (organization_id, name, time_zone, language_code, date_format, currency_*, address, phone, fax, website, email, portal_name), plus entity maps for Quotes, Invoices, Sales Orders, Purchase Orders, Customers, Recurring Invoices, Expenses, Bills, Recurring Bills and Items. Each map includes `custom_fields` arrays with data_type, label, value, value_formatted, show_on_pdf and similar. Example: `quote.get("quote_id")`.
- Sample idioms from the docs: `invokeUrl [ url: …, type: GET, connection: "books_api_connection" ]`, `sendmail [ from: zoho.adminuserid, to: …, subject: …, message: … ]` and `organization.get("organization_id")` — [Schedules](https://www.zoho.com/us/books/help/settings/automation/schedules.html)
- The Deluge built-in Zoho Books integration tasks include Get Organizations, Create Record, Update Record, Get Records, Get Records By ID, Mark Status and Get Templates. Each call counts as an API request against external-call limits — [Deluge: Zoho Books Tasks](https://www.zoho.com/deluge/help/books-tasks.html)

**Functions in Java, Node.js, Python (Zoho Finance CLI)** — [Functions Using Zoho Finance CLI](https://www.zoho.com/us/books/help/settings/custom-functions-using-zoho-finance-cli.html)
- Requires Node.js 16 and npx. Commands: `npx @zohofinance/cli login | pull "<download URL with function id, organization_id, entity>" | execute | push | logout`.
- Code lives in a `.py`, `.js` or `.java` file. `execute` asks for an entity (record) ID.
- CLI-created functions cannot be edited in the Books UI, only deleted there.
- A **context object** provides logging, cache with TTL, an in-memory queue with persistence, **Stratus** file storage, **Docket** scheduling and third-party **Connectors** — [Context Methods](https://www.zoho.com/us/books/help/settings/custom-functions-context-methods.html)

**Schedules** (plan-gated) — [Schedules](https://www.zoho.com/us/books/help/settings/automation/schedules.html)
- Path: Workflow Actions > Schedules > + New Schedule.
- A schedule takes a Name and a Frequency: Daily (optionally excluding weekends), Weekly (day), Monthly (date or nth weekday) or Yearly (month and date, or nth weekday).
- Start Date and Time can be at most one year ahead. Expiry is after N executions, on a date, or never. The body is a Deluge function.
- **Max 20 schedules.** Logs are kept for 3 months. Schedules can be Active/Inactive.
- "Custom schedulers" are Premium+ — [Plan comparison](https://www.zoho.com/us/books/pricing/pricing-comparison.html)

**Connections** — [Connections](https://www.zoho.com/us/books/help/settings/connections.html)
- Created from the Deluge editor (Functions, Buttons, Schedulers).
- *Predefined* ("Pick Your Service") connections take a name, scopes and "Use credentials of login user".
- *Custom Service* connections need Service Name, Auth Type, Param Type, Client ID and Secret, Authorize, Access-token and Refresh-token URLs, Connection Name and Scope. The OAuth redirect is `https://deluge.zoho.com/delugeauth/callback`.
- A code snippet is generated for use in scripts.

**Incoming Webhooks** (Premium+) — [Incoming Webhooks](https://www.zoho.com/us/books/help/settings/developer-and-data/incoming-webhooks.html)
- Each has a Name, a Description and a Deluge function body.
- The system generates an **OAuth URL** and a **ZAPI Key URL** (regenerable) for third parties to call. The request Header, Params and Body are available to the script.
- Logs are viewable per webhook. Plan source: [Plan comparison](https://www.zoho.com/us/books/pricing/pricing-comparison.html)

**Signals** (Premium+) — [Signals](https://www.zoho.com/us/books/help/settings/developer-and-data/signals.html)
- A signal has a Name, a Service (third-party app; add new), an Icon and a Trigger Type: API (gives a namespace) or Function (gives OAuth and ZAPI Key URLs).
- Recipients are All Users (cannot opt out), Disabled by Default or Enabled by Default.
- Message formatting uses `*bold*`, `^italics^` and `~br~`. Connections need the scopes `ZohoBooks.Signals.CREATE` and `.READ`.
- The output is in-app notifications.

**Approvals (transaction approval engine)** — [Configure Approvals](https://www.zoho.com/us/books/help/transaction-approval/configure-approvals.html); [Custom Approval](https://www.zoho.com/us/books/help/transaction-approval/custom-approval.html)
- Supported modules: Quotes, Sales Orders, Invoices, Retainer Invoices, Credit Notes, Sales Returns, Purchase Orders, Purchase Receives, Bills, Payments Made, Vendor Credits, Transfer Orders, Inventory Adjustments and Custom Modules. Manual Journals are approved via Accountant prefs.
- Approval types:
  - **No Approval**.
  - **Simple**: any admin or approver.
  - **Multi-Level**: up to 10 levels.
  - **Custom Approval**: a named rule with criteria and a flow of approvers, auto-accept or auto-reject. Rules are drag-prioritized.
- Preferences cover self-approval and notifications to approvers and submitters.
- Workflow triggers Submitted, Approved and Rejected hook into this engine.
- Limits: sales and purchase approvals on Professional+; custom approval workflows 25 / 70 / 70 on Premium / Elite / Ultimate — [Plan comparison](https://www.zoho.com/us/books/pricing/pricing-comparison.html)

**Other automation surfaces**
- **Reminders:** manual and automated invoice reminders, based on due date (3 by default, before or after due) or expected payment date, plus bill reminders. Templates use placeholders, and per-invoice actions are Send Now, Stop Reminders and Expected Payment Date — [Reminders](https://www.zoho.com/us/books/help/settings/reminders.html)
- **Zapier:** outgoing Zapier actions from Zoho Books need Premium+ (via webhooks). Incoming Zapier actions work on all plans — [Plan comparison](https://www.zoho.com/us/books/pricing/pricing-comparison.html); [Zapier](https://www.zoho.com/us/books/help/integrations/zapier-books-integration.html)
- **Zoho Flow:** some Marketplace extensions (e.g., Bitly Invoice Link) install with a Zoho Flow connection that "requires access to your app data" — [Bitly extension](https://www.zoho.com/us/books/help/extensions/bitly-invoice-link.html)
- **Workflow scenario library:** scenario pages for Email Alerts, Field Updates, Webhooks and Custom Functions — [Workflow Scenarios](https://www.zoho.com/us/books/help/settings/automation-scenarios.html)

**Plan gating of automation (US comparison page)** — [Plan comparison](https://www.zoho.com/us/books/pricing/pricing-comparison.html)

| Feature | Free | Std | Prof | Prem | Elite | Ult |
|---|---|---|---|---|---|---|
| Workflow rules | – | – | 10 | 200 | 200 | 200 |
| Email alerts / In-app notifications / Field updates | – | – | Y | Y | Y | Y |
| Custom functions / Webhooks | – | – | – | Y | Y | Y |
| Custom schedulers | – | – | – | Y | Y | Y |
| Incoming webhooks / Signals | – | – | – | Y | Y | Y |
| Custom buttons and links / Validation rules / Related lists / Record locking | – | – | – | Y | Y | Y |
| Blueprints | – | – | – | – | Y | Y |
| API requests/day | 1,000 | 2,000 | 5,000 | 10,000 | 10,000 | 10,000 |

### Inferences
- The architecture separates reusable **action definitions**, created per module under Workflow Actions, from **rules** that bind triggers and criteria to those actions. Deleting an action silently disables any rule that uses it, as each action page warns.
- Daily quotas are enforced per action type, and Workflow Logs and Usage Stats are the observability layer for them.

### Gaps / Conflicts
- **Conflict:** the undated KB says workflow rules exist "only in Professional, Elite and Ultimate", 200 per plan, with a max of 10 per module — [KB](https://www.zoho.com/books/kb/automation/number-of-workflows.html). The current comparison page shows Professional 10 and Premium/Elite/Ultimate 200 — [Plan comparison](https://www.zoho.com/us/books/pricing/pricing-comparison.html). The KB appears outdated (it omits Premium).
- Exact per-plan daily caps for email alerts, webhooks and functions are only described as "varies by plan" in current help. The KB figures (500 / 1,000 / 1,000) are undated.
- The full list of modules eligible as a workflow-rule "Module" was not published. Execution order between multiple rules on the same event is not documented ("Change Order" is described as list ordering only).

---

## 6. Templates and communications: PDF templates, HTML/CSS templates, email templates, SMS and WhatsApp

### Takeaway
PDF templates come in two forms. The first is a form-driven editor over pre-loaded layouts, with tabs for General, Header & Footer, Transaction Details, Table, Total and Other Details, plus colour themes, clone-to-module and per-contact defaults. The second is a code editor ("Build From Scratch") that takes HTML and CSS with Mustache-style placeholders, conditionals, loops and functions; it is currently limited to custom modules. Email notification templates per module support placeholders, a sender and a Zia-generated draft. SMS goes through Twilio, Clickatell or ClickSend, and WhatsApp runs on IM credits.

### Cited Findings
**Default PDF template editor** (Customization > PDF Templates > module > + New / Edit) — [PDF Templates](https://www.zoho.com/us/books/help/settings/pdf-templates/edit-templates.html)
- *General*: Template Name, Paper Size (A4/Letter), Orientation, Margins, Include Payment Stub (invoices), PDF Font (with language-suitability note), Label/Font Color, Font Size, Background image, position and colour.
- *Header & Footer*: background image (≤1 MB) and colour. Header and footer content take placeholders. There is an "Apply to first page only" option for a separate first-page header, and a Show Page Number option. The footer also accepts tables and links.
- *Transaction Details*: organization logo (resizable), name, address and address format (placeholders). Customer details (Bill To / Ship To formats) or Vendor details. **Document Information** toggles let each field be shown or hidden **and its label renamed**.
- *Table*: label fields, a custom item name/description format with placeholders, project details for project invoices, column widths, and header/row/description styling.
- *Total*: total section, payment details, amount in words, tax summary and retainer tax summary.
- *Other Details*: Notes, Payment Options, bank details, Invoice QR Code, Terms & Conditions, Signature image, Annexure content and **Attach Annexure Documents** (appended pages).
- *Receipt-specific tabs*: Invoice Details, Bill Details and Receipt Information.
- *Actions*: Select Color Theme, Preview, Set as Default, Clone (CLONE AS another module), Delete, and Force Delete. Force Delete reassigns linked transactions, customers and customer groups to the default template.
- Templates can be associated per customer or vendor.

**HTML PDF Templates** (currently for Custom Modules) — [HTML PDF Template](https://www.zoho.com/us/books/help/settings/html-pdf-templates.html)
- The renderer is **Flying Saucer** (XHTML + CSS 2.1). There is no flex, grid, transforms, gradients or HTML5 semantic tags. Images are PNG, JPEG or GIF via absolute URLs or data URIs, SVG support is limited, and RTL support is unreliable.
- Supported tags are div, p, span, table, thead, tbody, tfoot, pre, b, strong, small, label, sup, sub, font, ul, ol, li, img, a, h1–h6 and hr.
- `@page` rules include `:first`, `:left` and `:right`. There are Header and Footer tabs, with a separate header or footer for subsequent pages.
- Pagination uses CSS counters (`counter(page)`, `counter(pages)`) inside `::after`.
- Placeholders look like `${invoice.customer_name}`. Conditionals use `${#…}…${/…}` and `${^…}`, including equality expressions such as ``${#`invoice.status = Paid`}``. Loops look like `${#sales_receipt.line_items}…${/…}`, and table custom fields like `${TableCF.cm_products.cf_description.Value}`. Functions use the syntax ``${`FUNCTION_NAME(args)`}`` (Mathematical, Text, Logical).
- There is a "Run Code" preview.

**Email Notifications** (Reminders & Notifications > Email Notifications) — [Emails](https://www.zoho.com/us/books/help/settings/emails.html)
- *Sender Email Preferences*: verified senders, primary contact, and DKIM domain authentication. Unauthenticated or public domains are rewritten to `message-service@sender.zohobooks.com`, with reply-to preserved. With Locations enabled, emails come from the location's primary contact.
- *Email Relay*: custom SMTP server with port, daily mail limit, TLS, domain-based or email-based delivery, and authentication.
- *Email Insights*: open tracking by web-beacon pixel for Invoices, Retainer Invoices and Quotes, with list icons and a "Client Viewed" filter.
- *Email Templates*: per module, with a template name, From/CC/BCC, subject, body with placeholders, "Set this to default", clone pre-built templates and a common signature.
- Zia can generate the email template body from a prompt, with tone and content adjustments — [AI Features](https://www.zoho.com/us/books/help/ai-features/ai-features.html). "Email template customization" is listed in the plan comparison — [Plan comparison](https://www.zoho.com/us/books/pricing/pricing-comparison.html)

**SMS and WhatsApp**
- **SMS Notifications** (Reminders & Notifications): connect Twilio (Account SID, Auth Token, Phone Number), toggle per transaction type (disabled by default), customize the template with placeholders and enable per primary contact. Twilio is Premium+ — [Twilio](https://www.zoho.com/us/books/help/integrations/twilio.html); [Plan comparison](https://www.zoho.com/us/books/pricing/pricing-comparison.html). Clickatell and ClickSend are Marketplace extensions that log to a custom module — [Clickatell](https://www.zoho.com/us/books/help/extensions/clickatell.html); [ClickSend](https://www.zoho.com/us/books/help/extensions/clicksend.html)
- **WhatsApp** (Integrations & Marketplace > WhatsApp) supports multiple channels and templates with call-to-actions (opt-out and resume, accept or reject quotes) subject to template approval. It can be enabled per customer, contact person or vendor, and in bulk. Sending uses **IM Credits** (with purchase, a usage report and a notifications report) for invoices, reminders, receipts and customer notifications — [WhatsApp](https://www.zoho.com/us/books/help/integrations/whatsapp/integrate-with-whatsapp.html); [How Credits Work](https://www.zoho.com/us/books/help/integrations/whatsapp/how-credits-work.html)
- **Zoho Writer Templates** extension (mail-merge style templates via Zoho Writer) is listed under Extensions — [Writer Templates](https://www.zoho.com/us/books/help/extensions/zoho-writer-templates.html)

**Language of documents**
- The org Language setting covers about 30 UI languages. It does not change the language of the Chart of Accounts, Email Templates, Template Customizations, Payment Modes or Default Tax Rates. PDF fonts must suit the chosen language — [Org Profile](https://www.zoho.com/us/books/help/settings/organization/organization-profile.html). Contacts carry a "Portal Language" field — [screenshot click-gear-icon.png](https://www.zoho.com/books/help/images/customer-portal/click-gear-icon.png)

### Inferences
- Labels are renamed through each template's Document Information and Label Fields sections. No global "rename field label" setting was found for standard fields.

### Gaps
- No documentation was found for per-contact multi-language PDF generation (e.g., one template rendered in the customer's language). Only UI language, PDF font notes and contact portal language were found.
- The HTML/CSS editor for standard transaction modules is described only as "currently available for Custom Modules". Whether it covers invoices in some editions is unconfirmed.

---

## 7. Organization-level configuration: number series, reporting tags, locations, currencies, regional settings, locking, posting date, data management, audit, privacy, AI

### Takeaway
The org layer covers several areas:
- the profile (regional and fiscal settings shared across Zoho Finance apps);
- multi-transaction number series (Premium+), assignable per location;
- advanced reporting tags (5-level option hierarchies, visibility mapping, access control);
- Locations (5-level business/warehouse hierarchy, irreversible enable);
- currencies with automatic Open Exchange Rates feeds;
- module-level and global transaction locking with partial unlock;
- data backups throttled to once every 15 days;
- PII/ePHI controls;
- an AI Preferences / AI Control Center that selects a provider and model per AI feature and hosts Claude agent actions.

### Cited Findings
**Organization Profile** (Organization > Profile) — [Org Profile](https://www.zoho.com/us/books/help/settings/organization/organization-profile.html)
- Sections are Basic Details (name up to 100 chars; logo 240×240 px recommended, ≤1 MB, JPG/PNG/BMP/GIF; industry; business type; location is fixed), Address Details (update new vs all transactions; separate payment-stub remittance address up to 255 chars), Contact Details (primary contact links to sender preferences; website), Regional Settings and Additional Settings.
- Regional Settings cover base currency (fixed for 15 listed country editions; editable symbol, name, decimals, format and rounding), fiscal year (month range + start day), report basis (Accrual/Cash), language (about 30), time zone and date format (+ separator).
- Additional Settings are Company ID label and number, and Tax ID.
- Changes propagate to the same org in Billing, Checkout, Commerce, Expense, Inventory, Invoice, Payroll, Practice, Vikra and Zakya.
- Editing requires Admin or the custom-role permission "Update Organization Profile".

**Transaction Number Series** (Customization > Transaction Number Series) — [General](https://www.zoho.com/us/books/help/settings/preferences.html)
- Enable "Multiple Transaction Series" and add "+ New Series" (name; prefix and next number per transaction type). Series cover credit notes, journals, customer and vendor payments, POs, SOs, retainer invoices, vendor credits, bills of supply, debit notes, invoices, quotes and sales receipts.
- Branches or locations can be associated with multiple series. Auto-generated transactions such as recurring invoices use the default series.
- Multi-transaction number series is Premium+ — [Plan comparison](https://www.zoho.com/us/books/pricing/pricing-comparison.html)
- Per location: Series Name, associated branch, Prefix, Starting Number, **Restart Numbering: Yearly**, preview — [Locations basics](https://www.zoho.com/us/books/help/settings/organization/locations/basic-functions.html)
- Custom auto-number fields are a separate per-module mechanism with prefix and suffix — [Field Data Types](https://www.zoho.com/us/books/help/settings/customization/custom-field-data-types.html)

**Reporting Tags (Advanced)** (Customization > Reporting Tags) — [Reporting Tags](https://www.zoho.com/us/books/help/settings/reporting-tag.html)
- Enabling Advanced Reporting Tags is irreversible.
- A tag has a Name, a Description, the modules it is associated to (transaction level or line-item level for Sales, Purchases, Journals and Inventory Adjustments; Items only if line-level) and a Mandatory toggle. A new tag starts "Not Ready" and is marked Ready once it has at least one option.
- **Options** form a parent-child hierarchy up to 5 levels, can be reordered, and have a default option. Plan limit: 2,000 options per tag on Standard, Professional and Premium; 5,000 on Elite and Ultimate — [Plan comparison](https://www.zoho.com/us/books/pricing/pricing-comparison.html)
- **Visibility Conditions** (Elite/Ultimate) map options to options of earlier tags or Locations: up to 5 filters per tag, up to 200 mapped options, "All" and "Untagged" choices.
- **Access Control** applies to one tag per org.
- Associable entities: Customers, Vendors, Items, Quotes, SOs, Invoices, Recurring Invoices, Credit Notes, Expenses, Recurring Expenses, POs, Bills, Recurring Bills, Vendor Credits, Retainer Invoices, Customer and Vendor Payments, Inventory Adjustments, Sales Receipts, Fixed Assets, Banking and Journals.
- Reports can be filtered by tags (Advanced Filters) and compared by tag, optionally by hierarchy.

**Locations** (Organization > Locations; replaces Branches/Warehouses via "Migrate to Locations") — [Locations](https://www.zoho.com/us/books/help/settings/organization/locations/); [Basic Functions](https://www.zoho.com/us/books/help/settings/organization/locations/basic-functions.html); [Functions](https://www.zoho.com/us/books/help/settings/organization/locations/functions.html)
- Types are Business Location (up to a 5-level hierarchy) and Warehouse (stock only, no children). Enabling is irreversible.
- Each location has its own primary contact, transaction series and default series, sales price list (business locations only; the customer price list wins), user access and logo.
- Locations can be associated to sales, purchase, journal and bank transactions and e-Way bills. The dashboard can filter by location.
- Plan: Premium 3, Elite 8, Ultimate 8 locations; add-on $12/location/month or $10 annual — [Plan comparison](https://www.zoho.com/us/books/pricing/pricing-comparison.html); [Pricing](https://www.zoho.com/us/books/pricing/)

**Currencies**
- Add currencies; exchange rates can be viewed, edited, imported and exported.
- **Exchange Rate Feeds** from Open Exchange Rates are on by default and can be disabled for manual rates — [Currencies](https://www.zoho.com/us/books/help/settings/currencies.html)
- Multi-currency is Professional+, and multi-currency per customer or vendor is Premium+ — [Plan comparison](https://www.zoho.com/us/books/pricing/pricing-comparison.html); [Contact Prefs](https://www.zoho.com/us/books/help/contacts/contact-preferences.html)

**Other setup items**
- Opening Balances (accounts, AR/AP by import or per contact) — [Opening Balances](https://www.zoho.com/us/books/help/settings/opening-balances.html)
- Payment Terms (create, set default, associate with contacts, inactivate) — [Payment Terms](https://www.zoho.com/us/books/help/settings/payment-terms.html)
- Taxes and Sales Tax Automation (with an Exception Report) — [Sales Tax Automation](https://www.zoho.com/us/books/help/settings/sales-tax-automation.html)
- Revenue Recognition (Premium: 2 rules; Elite and Ultimate: unlimited) — [Plan comparison](https://www.zoho.com/us/books/pricing/pricing-comparison.html)

**Transaction Locking** (Accountant > Transaction Locking; Standard+) — [Transaction Locking](https://www.zoho.com/us/books/help/accountant/transaction-lock.html)
- Locks can be set per module group (Sales, Purchases, Banking, Accounts) with different dates, or as "Lock All Transactions" with one date. Each lock takes a Lock Date and a Reason, and can be edited, unlocked or partially unlocked for a date range. Partial unlock is not allowed when inventory-tracked items are involved.
- Inventory-integrity restrictions cover negative stock, future-dated purchases and sales-locked periods. A setting allows or restricts locking with negative stock.
- When Transaction Posting Date is active, locks use the posting date — [General](https://www.zoho.com/us/books/help/settings/preferences.html)
- Record Locking is the per-record counterpart covered in Q3.

**Data Management** (Developer Data > Data Management) — [Data Management](https://www.zoho.com/us/books/help/settings/developer-and-data/backup.html)
- **Backup Data** is CSV or XLS, optionally including PII, protected by a password of at least 12 characters with upper, lower, digit and special characters. It is emailed within about 30 minutes, the link expires after 30 days, and it can run once per 15 days.
- **Backup Documents** produces a ZIP of attachments uploaded since the last backup, once per 15 days.
- **Backup Audit Trail** produces a ZIP, once per 15 days, with a link that expires after 60 days.
- **Import History** can be filtered by user and module.
- Module exports cap at 25,000 rows; beyond that, use a backup — [Export](https://www.zoho.com/us/books/help/import-export/export.html)

**Audit trail and activity logs** — [Activity Logs](https://www.zoho.com/books/help/reports/activity.html)
- The report lives at Reports > Activity > Activity Logs (also titled "Activity Logs & Audit Trail"). It records when, what, where and who.
- Filters are date, module or action, contact, user, actions (Create/Update/Delete) and a **PII Fields** filter. Export and print are available.
- **Audit Trail** offers "Show Versions" and Compare with colour-coded diffs (yellow edited, pink deleted, green added). The page states it is available "only for organizations in the India, UK, UAE, KSA, Bahrain and EU Countries" (undated note).

**Privacy and Security (GDPR)** — [Privacy and Security](https://www.zoho.com/us/books/help/settings/privacy.html)
- A role-level "Provide access to protected data" toggle is on for Admin only by default.
- Custom fields can be marked PII (encrypted or plain) or ePHI.
- Users without PII access cannot export sensitive data (SSN, bank account numbers, sensitive custom fields). Exports and backups have an explicit "Include Sensitive PII" checkbox.
- Secure public links require identity verification — [General](https://www.zoho.com/us/books/help/settings/preferences.html)
- Card data is passed encrypted to the gateway, and only the last 4 digits and expiry are stored — [Integrations](https://www.zoho.com/us/books/help/settings/integrations.html)

**Custom Domain** (Organization > Custom Domain; Premium+)
- Maps the customer portal domain via a CNAME. An auto-installed SSL certificate takes 3–5 business days — [Domain Mapping](https://www.zoho.com/us/books/help/settings/organization/domain-mapping.html)

**AI (Zia and third-party LLMs)** — [AI Features](https://www.zoho.com/us/books/help/ai-features/ai-features.html)
- AI features are off by default and enabled per feature in **AI Preferences**, choosing an AI Provider and Model.
- Features:
  - Ask Zia: chat to query data and create items and transactions in the background.
  - **CoCreate Agent**: drives the form on screen, with Take Control and Resume Autofill.
  - Report charting with forecast and anomaly detection.
  - Zia-generated email template content.
  - AI fields.
  - Zia Blueprint generation.
  - AI-suggested bank categorization (Early Access).
  - Zia Invoice Agent insights on the invoice list.
  - English Speech Assistant.
  - Zia Insights on reports.
- Plan: Zia insights, CoCreate, anomaly detection, forecasting, speech assistant and the AI field types are Premium+ — [Plan comparison](https://www.zoho.com/us/books/pricing/pricing-comparison.html)
- **AI Control Center** (Organization) has a Setup tab where Anthropic is connected with an API key and "Claude Agent Actions" are configured. Claude Managed Agents reach Books data through an MCP server (Zoho MCP portal with per-tool enablement and Authorization On Demand vs via Connection, plus an optional Vault). A Claude agent widget sits in the right sidebar — [Claude Agents](https://www.zoho.com/us/books/help/ai-features/claude-agents.html)
- An official **Zoho Books MCP server** and a Claude directory connector are documented — [Zoho Books MCP](https://www.zoho.com/us/books/help/mcp/zoho-books-mcp.html)

### Inferences
- Many org-level switches are one-way: Advanced Reporting Tags, Locations, the auto-number backfill and the fixed org country/base currency.
- Segmented access, the reporting-tag hierarchy and Locations together form a dimensional security model applied on top of role permissions.

### Gaps
- Fiscal-year change rules after transactions exist, and "13th month" handling, were not researched in detail; only the nav entry "13th Month Adjustment Journals" was seen.
- The audit-trail regional restriction note is undated. Whether US orgs have it by 2026 is unconfirmed.

---

## 8. Integrations ecosystem, Marketplace and developer platform

### Takeaway
Integrations live under Settings > Integrations & Marketplace. They cover native Zoho apps (CRM with two-way sync, Analytics, Projects, People, Desk, Expense, Sign, Commerce, Billing, Bigin, SalesIQ, Mail, Cliq, Notebook and the Inventory add-on), third parties (Slack, Google Workspace, Microsoft 365, Zendesk, Zapier, Twilio, WhatsApp, Avalara, SurePayroll) and payment gateways. Extensions come from Zoho Marketplace (Installed Extensions tab). Extensions are built on Zoho's **Sigma** platform / Zoho Books Developer Portal with components such as connections, widgets, schedules, webhooks, signals and web tabs.

### Cited Findings
- **Integrations listed in US help:** Bigin, Zoho People, Zoho SalesIQ, Zoho Mail, Zoho Sign, SurePayroll, Zoho Analytics, Zoho CRM, Zoho Projects, Zoho Desk, Zoho Expense, Avalara AvaTax, Zoho Commerce, Zoho Billing, Zoho Notebook, Google Workspace, Microsoft 365, Slack, Zendesk, Zapier, Email Integration, Zoho Cliq, Twilio, WhatsApp, plus a Zoho CRM Custom Modules page — [help nav](https://www.zoho.com/us/books/help/settings/)
- **Extensions listed:** Bitly Invoice Link, Snail Mail, Bird IVR, ClickSend, Clickatell, Zoho Writer Templates. They are installed from Settings > Integrations & Marketplace, with connections authorized at install and managed under Installed Extensions — [help nav](https://www.zoho.com/us/books/help/settings/); [Bird IVR](https://www.zoho.com/us/books/help/extensions/bird-ivr.html)
- **Zoho CRM:** two-way sync of Accounts and Contacts to Customers, Vendors, Items and transaction modules, with deal-stage automation for quotes and invoices. Several Books orgs can connect to one CRM org only as one-way (CRM to Books). CRM profiles get "Zoho Finance Permissions" — [CRM Integration](https://www.zoho.com/us/books/help/integrations/crm-integration.html)
- **Payment gateways (US):** Stripe, Authorize.Net, PayPal, Payflow Pro (deprecated), Payments Pro (deprecated), Verifone, Braintree, CSG Forte, Zoho Payments (US and India) and Square. Card Verification Settings control address fields — [Integrations](https://www.zoho.com/us/books/help/settings/integrations.html). India adds Razorpay and ICICI eazypay — [India Settings](https://www.zoho.com/in/books/help/settings/)
- **Plan gating examples:** Avalara, Zendesk and most gateways are Standard+. Zoho People and Projects are Professional+. Zoho Sign and Twilio are Premium+. Bank feeds via a third-party provider are Standard+. Shopify (up to 2 stores) and Etsy, eBay and Amazon channels are Elite+ — [Plan comparison](https://www.zoho.com/us/books/pricing/pricing-comparison.html)
- **ZSC Key:** a legacy Zoho Service Communication key for CRM linking, regenerable — [Integrations](https://www.zoho.com/us/books/help/settings/integrations.html)
- **Developer surfaces in Settings:** API Usage dashboard and the others below — [API Usage](https://www.zoho.com/us/books/help/settings/developer-and-data/api-usage.html)
  - Excludes web-app calls.
  - "API Usage as of Today" bar chart.
  - Usage-limit notifications at 5% steps.
  - 30-day timeline, refreshed every 3 hours.
  - Top 5 Modules, Applications, IPs and Users.
  - Recent Activities.
  - New API domain `www.zohoapis.com/books` since 1 June 2024, filterable against the old `books.zoho.com/api`.
  - Also in Settings: Incoming Webhooks, Signals and Web Forms (Q5 and Q4), and Connections (Q5).
- **Web Tabs** (Premium+): embedded iframes in the left sidebar under "Web Tabs", with URL placeholders and visibility (Only Me, Selected Users & Roles, Everyone). Optional **JWT authentication**: HS256 signed with a 32–500 char secret, validity of 10 or 30 min or 1 or 3 h, delivered by `postMessage` type `ZOHO_WEBTAB_AUTH_TOKENS`, refresh via `ZOHO_WEBTAB_REQUEST_TOKEN_REFRESH`, claims organization_id, user_id, token_type=access, tab_id, iat and exp. There is a built-in token validator. Web tabs also exist in the Customer Portal and inside Developer Portal extensions — [Web Tabs](https://www.zoho.com/us/books/help/settings/customization/web-tabs.html); [Customer Portal Prefs](https://www.zoho.com/us/books/help/customer-portal/preferences.md)
- **Sigma / Developer Portal:** Sigma is the extension platform inside Zoho Developer for Zoho Finance apps (Books, Inventory, Expense, Invoice, Billing). The Books developer portal has Learn and Build sections. Build covers customization, automation and components such as connections, widgets, schedules, webhooks and signals. A per-extension test environment is reached via "Test Your Extension". Public extensions are reviewed by the Zoho Books team and by Zoho Marketplace approval — [Zoho community: Creating and testing extensions](https://help.zoho.com/portal/en/community/topic/creating-and-testing-extensions-for-zoho-finance-suite-applications?page=1); [Zoho community: Widgets](https://help.zoho.com/portal/zh-tw/community/topic/building-extensions-6-custom-user-interfaces-with-widgets) (community forum posts, not formal docs)
- "Widgets" quotas on the plan comparison page are Premium 20, Elite 30, Ultimate 50 — [Plan comparison](https://www.zoho.com/us/books/pricing/pricing-comparison.html)
- **Collaboration add-ons in Settings scope:** Contextual Chat (Cliq chat bar on transactions, contacts, items, bank accounts and projects; Professional+) and Tasks (statuses, fields and permissions; Professional+) — [Contextual Chat](https://www.zoho.com/us/books/help/contextual-chat/); [Tasks](https://www.zoho.com/us/books/help/tasks/); [Plan comparison](https://www.zoho.com/us/books/pricing/pricing-comparison.html)
- **Custom dashboards** (Home): panels and permission-managed dashboards. Dashboard customization is Elite+ — [Custom Dashboards](https://www.zoho.com/us/books/help/home/custom-dashboards.html); [Plan comparison](https://www.zoho.com/us/books/pricing/pricing-comparison.html)

### Inferences
- The "Widgets 20/30/50" row sits in the customization block of the comparison table. It most plausibly limits Sigma extension widgets or custom UI widgets per org, but the page does not define it.

### Gaps
- No official 2026 Sigma documentation was retrieved (the developer page returned 403). Details of extension packaging, private vs public listing and widget placement points (sidebar, details page, PDF) are unverified.
- Google Workspace, Microsoft 365 and Slack integration mechanics (e.g., Slack channel notifications, Gmail add-on) were fetched but not summarized. The pages are [Google Workspace](https://www.zoho.com/us/books/help/integrations/google-workspace.html), [Microsoft 365](https://www.zoho.com/us/books/help/integrations/microsoft-365-integration.html) and [Slack](https://www.zoho.com/us/books/help/integrations/slack-integration.html).
- Zoho Payroll and Zoho Inventory integration pages for the US edition were not reviewed. Inventory appears as an add-on toggle in General — [General](https://www.zoho.com/us/books/help/settings/preferences.html).

---

## 9. Plan matrix and limits (US edition, consolidated)

### Takeaway
Customization depth scales with plan:
- **Standard** adds custom fields, transaction locking and the API.
- **Professional** adds custom roles, workflow rules (10), email, in-app and field-update actions, and approvals.
- **Premium** adds custom modules (10), validation rules, buttons, related lists, record locking, functions, webhooks, schedulers, incoming webhooks, signals, web tabs, custom domain, number series, formula, unique and AI fields, and Zia.
- **Elite** adds blueprints, tag visibility conditions, the user access control tag and dashboard customization.
- **Ultimate** raises custom modules to 25 and adds BI.

### Cited Findings
- Prices: Free $0; Standard $20/mo ($15 annual); Professional $50 ($40); Premium $70 ($60); Elite $150 ($120); Ultimate $275 ($240), per org per month, excluding tax — [Pricing](https://www.zoho.com/us/books/pricing/)
- Consolidated customization and automation rows (Y = included):

| Capability | Free | Standard | Professional | Premium | Elite | Ultimate |
|---|---|---|---|---|---|---|
| Users included | 1 + 1 accountant | 3 | 5 | 10 | 10 | 15 |
| Locations | – | – | – | 3 | 8 | 8 |
| Custom fields | – | Y | Y | Y | Y | Y |
| Custom views | Y | Y | Y | Y | Y | Y |
| Custom user roles and access | – | – | Y | Y | Y | Y |
| Transaction locking | – | Y | Y | Y | Y | Y |
| Workflow rules | – | – | 10 | 200 | 200 | 200 |
| Email alerts / in-app / field updates | – | – | Y | Y | Y | Y |
| Sales / purchase / timesheet approvals | – | – | Y | Y | Y | Y |
| Custom approval workflows | – | – | – | 25 | 70 | 70 |
| Custom modules | – | – | – | 10 | 10 | 25 |
| Validation rules, related lists, web tabs, custom buttons and links, custom schedulers, custom domain, record locking | – | – | – | Y | Y | Y |
| Custom functions, webhooks, incoming webhooks, signals | – | – | – | Y | Y | Y |
| Multi-transaction number series | – | – | – | Y | Y | Y |
| Vendor portal | – | – | – | Y | Y | Y |
| Zia insights, CoCreate, anomaly detection, forecasting, speech assistant, AI fields | – | – | – | Y | Y | Y |
| Blueprints | – | – | – | – | Y | Y |
| Reporting-tag visibility conditions; user access control tag | – | – | – | – | Y | Y |
| Reporting-tag options per tag | – | 2,000 | 2,000 | 2,000 | 5,000 | 5,000 |
| Dashboard customization | – | – | – | – | Y | Y |
| Custom reports | – | 10 | 25 | 50 | Unlimited | Unlimited |
| Scheduled reports | 5 | 5 | 50 | 200 | 200 | 200 |
| API requests/day | 1,000 | 2,000 | 5,000 | 10,000 | 10,000 | 10,000 |
| Widgets | – | – | – | 20 | 30 | 50 |

Source: [Plan comparison](https://www.zoho.com/us/books/pricing/pricing-comparison.html)
- Help-page "Available Plans" badges agree. Fields: Standard–Ultimate. Validation Rules, Record Locking, Buttons, Related Lists, Web Tabs and Custom Domain: Premium–Ultimate. Custom Views: Free–Ultimate. Transaction Locking: Standard–Ultimate — [Fields](https://www.zoho.com/us/books/help/settings/customization/custom-fields.html); [Validation Rules](https://www.zoho.com/us/books/help/settings/customization/validation-rules.html); [Views](https://www.zoho.com/us/books/help/settings/customization/custom-views.html); [Transaction Locking](https://www.zoho.com/us/books/help/accountant/transaction-lock.html)
- Hard numeric limits stated in help:
  - 10 buttons per module; 10 related lists per module; 20 schedules.
  - 5 email alerts, 3 field updates and 1 webhook per workflow rule.
  - 10 criteria × 10 conditions per rule; 3 watched fields per edit trigger.
  - 10 approval levels; 5 sub-transitions per blueprint transition.
  - 5 tag-hierarchy levels; 5 location-hierarchy levels; 5 tag filters / 200 mapped options; 500 tag options per user; 1 access-controlled tag.
  - Multi-select max 30 picks; single-line text 255 chars; multi-line text 36,000 chars; attachment field under 7 MB; image field 5 MB.
  - Backup once per 15 days; export 25,000 rows.
  - Webhook retries 5 by default and up to 20 custom; webhook secret 12–50 chars; web-tab JWT secret 32–500 chars.
  - Sources: the respective pages cited in Q3–Q7 above.

### Inferences
- Limits differ by region and edition. The figures above are US-edition only, and other editions may show different gateways, tax modules and audit-trail availability (see the India settings index and the Activity Logs regional note).

### Gaps
- Equivalent comparison tables for India, UK, UAE and other editions were not parsed, so regional plan differences in customization limits are unverified.
- No sandbox or test-organization feature for staging customizations was found in Books help (the Sigma extension test environment is the only staging surface found).
