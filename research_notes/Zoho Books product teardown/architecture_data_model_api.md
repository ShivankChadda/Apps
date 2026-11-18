# Zoho Books: architecture, data model, API, tenancy, tech stack (as of Nov 2026)

Research method note: the API findings below come mainly from Zoho's own machine-readable OpenAPI bundle, downloaded on 2026-11-18 from https://www.zoho.com/books/api/v3/openapi-all.zip. It holds 45 YAML files (44 resource groups plus a CRM "integration" file), and parsing them gave 885 HTTP operations. Each file is served at https://www.zoho.com/books/api/v3/{resource}/, for example https://www.zoho.com/books/api/v3/invoices/. Help-centre pages were read through their official `.md` mirrors, which are listed in https://www.zoho.com/books/help/llms.txt and https://www.zoho.com/books/developer/llms.txt. Endpoint counts are my own counts from that bundle.

## 1. Data model: resources, core entities, keys, statuses, relationships

### Takeaway
Zoho Books follows one repeating pattern. The organization is the root container. Under it sit master records (Contact, Item, Account, Tax, Currency, Location, Reporting Tag, User), each with an ID. Transaction documents have a header plus a `line_items[]` array, a status lifecycle driven by action endpoints (`/status/sent`, `/void`, `/submit`, `/approve`), and the same set of sub-resources on every document type (comments/history, attachments/documents, email, templates, custom fields, plugin metadata). Many-to-many money links, such as payments applied to invoices or credits applied to bills, are stored as junction rows with their own IDs (`invoice_payment_id`, `bill_payment_id`, `creditnote_invoice_id`, `vendor_credit_bill_id`).

### Cited Findings

**Full resource list (API v3 OpenAPI bundle, with operation counts)**: Bank Accounts (33), Bank Rules (13), Bank Transactions (19), Base Currency Adjustment (8), Bills (22), Categories (5), Chart of Accounts (12), Contact Persons (6), Contacts (90), Credit Notes (63), Currency (10), Custom Modules (12), Customer Debit Notes (5), Customer Payments (13), Delivery Challans (17), Estimates (25), Expenses (15, including `/employees`), Fixed Assets (18, including `/fixedassettypes`), Integration/CRM import (4), Invoices (112), Items (31, including `/itemmasters` item groups and `/itemvariants`), Journals (31, including `/recurringjournals`), Locations (8), Opening Balance (8), Organizations (13), Price Lists (6, at `/pricebooks`), Projects (24), Purchase Orders (26), Purchase Returns (16), Recurring Bills (9), Recurring Expenses (10), Recurring Invoices (20), Registers (7), Reporting Tags (14), Retainer Invoices (25), Sales Orders (28), Sales Receipts (6), Self-Billed Invoices (6), Tasks (17), Taxes (19, including tax groups, tax authorities and tax exemptions), Time Entries (9), Transaction Locking (6), Users (9), Vendor Credits (21), Vendor Payments (14). There are 885 operations in total. — [Zoho Books API v3 OpenAPI bundle](https://www.zoho.com/books/api/v3/openapi-all.zip); resource index on the [API introduction page](https://www.zoho.com/books/api/v3/introduction/)

**Organization** (the tenant root): `GET /organizations` returns `organization_id`, `name`, `contact_name`, `email`, `is_default_org`, `language_code`, `fiscal_year_start_month`, `account_created_date`, `time_zone`, `is_org_active`, `currency_id`, `currency_code`, `currency_symbol`, `currency_format` and `price_precision`. Other org endpoints are `/organizations/{id}/copysettings`, `/downgradetoinvoice`, `/upgradetobooks`, `/inactive`, and `/organizations/address`. — [API introduction](https://www.zoho.com/books/api/v3/introduction/); [Organizations API](https://www.zoho.com/books/api/v3/organizations/)

**Contact** (one entity covers both customers and vendors):
- Required field: `contact_name*`. Other create fields include `company_name`, `contact_type` (customer or vendor), `customer_sub_type` (individual or business), `credit_limit`, `pricebook_id`, `currency_id`, `payment_terms`, `billing_address{}`, `shipping_address{}`, `contact_persons[]`, `default_templates{}` (per-document template IDs), `custom_fields[]`, `opening_balances[]` (per `location_id`), `owner_id`, tax fields, and `tags[]`.
- Status: active or inactive. The list filter also offers `Status.Duplicate` and `Status.Crm`.
- Sub-resources: `/contactpersons`, `/address`, `/comments`, `/email`, `/statements/email`, `/refunds`, `/bankaccount`, `/card`, `/documents`, `/tags`, `/taxinfo`, `/portal/enable`, `/paymentreminder/enable|disable`, `/merge`, `/receivables/unusedcredits`, `/openingbalances`.
- Source: [Contacts API](https://www.zoho.com/books/api/v3/contacts/); [Contact Persons API](https://www.zoho.com/books/api/v3/contact-persons/)

**Item**:
- Required fields: `name*` and `rate*`. Other fields include `description`, `tax_id`, `sku`, `product_type` (goods or services), `item_type` (sales, purchases, sales_and_purchases, inventory; default sales), `account_id` (sales account), `purchase_rate`, `purchase_account_id`, `inventory_account_id`, `vendor_id` (preferred vendor), `reorder_level`, `locations[]` (initial stock per `location_id`), and `custom_fields[]`.
- Status: active or inactive.
- Item groups (`/itemmasters`) and variants (`/itemvariants`) are separate resources.
- Source: [Items API](https://www.zoho.com/books/api/v3/items/)

**Invoice (header plus line items)**:
- Required fields: `customer_id*` and `line_items*`. Each line requires `item_id*`.
- Header fields: `currency_id`, `invoice_number`, `reference_number`, `template_id`, `date`, `payment_terms`, `due_date`, `discount`, `discount_type` (entity_level or item_level), `is_inclusive_tax`, `exchange_rate`, `location_id`, `recurring_invoice_id`, `invoiced_estimate_id`, `salesperson_name`, `custom_fields[{customfield_id,value}]`, `tags[{tag_id,tag_option_id}]`, `payment_options.payment_gateways[]`, `allow_partial_payments`, `notes`, `terms`, `shipping_charge`, `adjustment`, `billing_address_id`, `shipping_address_id`.
- Line fields: `item_id`, `project_id`, `time_entry_ids`, `expense_id`, `bill_id`, `bill_item_id`, `salesorder_item_id`, `name`, `description`, `item_order`, `rate`, `quantity`, `unit`, `discount`, `tax_id`, `tags`, `location_id`.
- Read-only response fields: `status`, `sub_total`, `tax_total`, `total`, `payment_made`, `credits_applied`, `balance`, `write_off_amount`, `is_viewed_by_client`, `client_viewed_time`, `is_emailed`, `reminders_sent`, `last_payment_date`, `has_attachment`, `invoice_url`, `created_time`, `last_modified_time`. Line responses add `line_item_id` and `item_total`.
- Query flags: `send`, `ignore_auto_number_generation`.
- Source: [Invoices API](https://www.zoho.com/books/api/v3/invoices/)

**Invoice statuses**:
- The `status` filter accepts sent, draft, overdue, paid, void, unpaid, partially_paid and viewed.
- `filter_by` accepts Status.All/Sent/Draft/OverDue/Paid/Void/Unpaid/PartiallyPaid/Viewed and Date.PaymentExpectedDate.
- Source: [Invoices API](https://www.zoho.com/books/api/v3/invoices/)

**Invoice actions and sub-resources (112 operations)**:
- Status changes: `POST /invoices/{id}/status/sent|void|draft|cancel|readytopush`.
- Approval: `/submit`, `/approve`, `/approve/final`, `/reject`.
- Email and reminders: `/email` (GET returns the default email content, POST sends), `/email/schedule`, `/paymentreminder`, `/paymentreminder/enable|disable`.
- Write-offs: `/writeoff`, `/writeoff/cancel`.
- Money: `/payments` (list), `DELETE /payments/{invoice_payment_id}`, `/creditsapplied`, `POST /credits` (body: `invoice_payments[{payment_id,amount_applied}]` and `apply_creditnotes[{creditnote_id,amount_applied}]`).
- Files and notes: `/attachment` (multipart field `attachment`, flag `can_send_in_mail`), `/documents/{document_id}`, `/comments`.
- Other: `/templates/{template_id}`, `/address/billing|shipping`, `/customfields`, `/metadata/{metadata_name}`, `/einvoice/*`, `/sms`, `/qrcode`, `/onlinepayments/*`, `DELETE /lineitems/{line_item_id}`.
- Conversions and bulk operations: `/invoices/fromsalesorder?salesorder_id=`, `/fromestimates`, `/fromprojects`, `/mapwithorder`, `/invoices/email`, `/invoices/status/sent`, `/invoices/status/void`, `/invoices/approve`, `/invoices/submit`, `/invoices/writeoff`, and `DELETE /invoices?invoice_ids=`.
- Source: [Invoices API](https://www.zoho.com/books/api/v3/invoices/)

**Customer Payment**:
- Required fields: `customer_id*`, `payment_mode*`, `amount*`, `date*`, `invoices*[{invoice_id, amount_applied, tax_amount_withheld}]`.
- Other fields: `reference_number`, `description`, `exchange_rate`, `bank_charges`, `account_id` (deposit-to account), `retainerinvoice_id`, `location_id`, `custom_fields`, `tags`.
- `payment_mode` values: check, cash, creditcard, banktransfer, bankremittance, autotransaction, others.
- Status: success or failure.
- Sub-resources: `/refunds` (CRUD) and `/customfields`.
- Source: [Customer Payments API](https://www.zoho.com/books/api/v3/customer-payments/)

**Bill**:
- Required fields: `vendor_id*` and `bill_number*`.
- Other fields: `purchaseorder_ids[]`, `currency_id`, `reference_number`, `date`, `due_date`, `payment_terms`, `recurring_bill_id`, `exchange_rate`, `is_inclusive_tax`, `location_id`, `custom_fields`, `tags`, `approvers[{approver_id,order}]`, `documents[]`.
- Line fields: `purchaseorder_item_id`, `item_id`, `account_id`, `rate`, `quantity`, `tax_id`, `is_billable`, `project_id`, `customer_id` (for billable lines), `serial_numbers`.
- Status values (from `filter_by`): open, partially_paid, paid, overdue, void. Draft also exists ("Save as Draft").
- Actions: `/status/void`, `/status/open`, `/submit`, `/approve`, `/payments`, `/credits`, `/attachment`, `/comments`, `/bills/editpage/frompurchaseorders`.
- Source: [Bills API](https://www.zoho.com/books/api/v3/bills/); [Bills help](https://www.zoho.com/books/help/bills/basic-functions.html)

**Purchase Order**:
- Required fields: `vendor_id*` and `line_items*`.
- Other fields: `purchaseorder_number`, `reference_number`, `date`, `delivery_date`, `salesorder_id` (back-to-back with a sales order), `delivery_customer_id`, `ship_via`, `location_id`, `crm_owner_id`, `custom_fields`, `tags`.
- Statuses: draft, open, billed, cancelled. These come from `/status/open|billed|cancelled` and from `filter_by`.
- Other actions: `/submit`, `/approve`, `/reject`, `/email`, `/attachment`, `/comments`.
- Source: [Purchase Orders API](https://www.zoho.com/books/api/v3/purchase-order/)

**Sales Order**:
- Required field: `customer_id*`. Other fields include `estimate_id`, `shipment_date`, `salesperson_id`, `zcrm_potential_id` (link to a CRM deal), `delivery_method`, `line_items[]`.
- Statuses from `filter_by`: open, draft, overdue, partially_invoiced, invoiced, void, closed. Custom sub-statuses are set with `/substatus/{status_code}`.
- Source: [Sales Orders API](https://www.zoho.com/books/api/v3/sales-order/)

**Estimate statuses**: draft, sent, invoiced, accepted, declined, expired. The matching actions are `/status/sent|accepted|declined`. — [Estimates API](https://www.zoho.com/books/api/v3/estimates/)

**Project**:
- Required fields: `project_name*`, `customer_id*`, `billing_type*`, `user_id*`.
- `billing_type` values: fixed_cost_for_project, based_on_project_hours, based_on_staff_hours, based_on_task_hours.
- Other fields: `rate`, `budget_type`, `budget_hours`, `budget_amount`, `cost_budget_amount`, `tasks[]`, and `users[{user_id, user_role, rate, budget_hours, cost_rate}]`. User roles are staff, admin and timesheetstaff.
- Status: active or inactive.
- Sub-resources: `/tasks`, `/users` (with invite), `/comments`, `/invoices`, `/clone`.
- Source: [Projects API](https://www.zoho.com/books/api/v3/projects/)

**Time Entry**:
- Required fields: `project_id*`, `task_id*`, `user_id*`, `log_date*`. Other fields: `log_time`, `begin_time`, `end_time`, `is_billable`, `notes`, `start_timer`, `cost_rate`.
- Timer endpoints: `/timer/start`, `/timer/stop`, `/runningtimer/me`.
- The list filter includes Status.Unbilled and Status.Invoiced. Time is billed by putting `time_entry_ids` and `project_id` on invoice lines.
- Source: [Time Entries API](https://www.zoho.com/books/api/v3/time-entries/); [Invoices API](https://www.zoho.com/books/api/v3/invoices/)

**Task** (standalone tasks resource): statuses open, ongoing, completed (`/markasopen`, `/markasongoing`, `/markascompleted`). Tasks also support `/percentage`, comments and attachments. — [Tasks API](https://www.zoho.com/books/api/v3/tasks/)

**Statuses on other resources**:
- Credit notes: draft, open, closed, void. Refunds and application to invoices via `/creditnotes/{id}/invoices`. — [Credit Notes API](https://www.zoho.com/books/api/v3/credit-notes/)
- Vendor credits: draft, open, closed, void. Applied to bills via `/vendorcredits/{id}/bills`. — [Vendor Credits API](https://www.zoho.com/books/api/v3/vendor-credits/)
- Recurring invoices: active, stopped, expired. The schedule is `recurrence_frequency` (days, weeks, months, years) × `repeat_every`; actions are `/status/stop|resume`; generated children are at `GET /recurringinvoices/{id}/invoices`. — [Recurring Invoices API](https://www.zoho.com/books/api/v3/recurring-invoices/)
- Journals: draft or published. Lines carry `account_id`, `amount*`, `debit_or_credit*`, `customer_id`, `project_id`, `tags`. `journal_type` is cash or both. Actions: `/status/publish`, `/reverse`. — [Journals API](https://www.zoho.com/books/api/v3/journals/)
- Expenses: billable, nonbillable, reimbursed, invoiced, unbilled. Required fields are `account_id*`, `date*`, `amount*`, `paid_through_account_id*`. Optional links are `customer_id`, `project_id`, `vendor_id`, `employee_id`, plus mileage fields. — [Expenses API](https://www.zoho.com/books/api/v3/expenses/)
- Users: active, inactive, invited, deleted. Create fields are `name*`, `email*`, `role_id`, `cost_rate`. — [Users API](https://www.zoho.com/books/api/v3/users/)

**Chart of Accounts**:
- `account_type` values include other_asset, other_current_asset, cash, bank, fixed_asset, other_current_liability, credit_card, long_term_liability, equity, income, other_income, expense, cost_of_goods_sold, other_expense, accounts_receivable, accounts_payable and more.
- `parent_account_id` creates sub-accounts.
- `GET /chartofaccounts/accounttransactions` filters by `transaction_type`: invoice, customer_payment, bills, vendor_payment, credit_notes, creditnote_refund, expense, journal, deposit, transfer_fund, base_currency_adjustment, opening_balance, and others.
- Source: [Chart of Accounts API](https://www.zoho.com/books/api/v3/chart-of-accounts/); sub-accounts go up to two levels per the [help index](https://www.zoho.com/books/help/llms.txt)

**Custom Modules (user-defined entities)**:
- Module definition: `POST /settings/modules` with `module_name*`, `plural_name*`, `parent_module_id`, `record_name`, permission flags (`can_send_mail`, `can_attach_documents`, `can_lock_record`…), and `module_permission[{role_id, can_create, can_edit, can_view, can_delete, can_approve}]`.
- Records: generic CRUD at `/{module_name}` and `/{module_name}/{module_id}`.
- Help lists lookup fields, related lists, blueprints, layout rules and validation rules.
- Plan limits: 10 modules on Premium and Elite, 25 on Ultimate.
- Source: [Custom Modules API](https://www.zoho.com/books/api/v3/custom-modules/); [Custom Modules help](https://www.zoho.com/books/help/custom-modules/index.html)

**Polymorphic comments, which double as history**:
- Comment rows have `comment_id`, `description`, `commented_by_id`, `commented_by`, `comment_type` (for example "system"), `operation_type` (for example "Added"), `date`, `time`, `transaction_id`, `transaction_type` (for example invoice, bill_payment, salesorder, vendor_credit).
- So system history and user comments share one stream, keyed by transaction ID and type.
- Source: [Invoices API](https://www.zoho.com/books/api/v3/invoices/); [Bills API](https://www.zoho.com/books/api/v3/bills/)

**Polymorphic plugin metadata**: `/{module}/{id}/metadata/{plugin_identifier}` exists on invoices, estimates, sales orders, credit notes, retainer invoices, customer payments, recurring invoices, delivery challans, bills, expenses, recurring expenses, purchase orders, vendor payments, recurring bills and journals. Each endpoint stores up to 64,000 characters. — [Extension components](https://www.zoho.com/books/developer/extensions/extension-components.html)

**Reporting tags** are a cross-cutting dimension. `tags[{tag_id, tag_option_id}]` appears on document headers and on line items. Options and criteria live at `/reportingtags/{tag_id}/options` and `/criteria`. — [Reporting Tags API](https://www.zoho.com/books/api/v3/reporting-tags/)

### Inferences

**ER sketch**, assembled from the foreign keys documented above:
- Organization 1—* every entity (tenant root).
- User *—* Organization (`GET /organizations` lists the orgs a user can access).
- Contact 1—* ContactPerson and 1—* Address.
- Contact (customer) 1—* Estimate, SalesOrder, Invoice, RetainerInvoice, CreditNote, CustomerPayment, Project.
- Contact (vendor) 1—* PurchaseOrder, Bill, VendorCredit, VendorPayment, Expense.
- Item 1—* line items on every document. Account 1—* line items, expenses and payments (`account_id`, `paid_through_account_id`).
- Estimate → SalesOrder (`estimate_id`) → Invoice (`invoiced_estimate_id`, line `salesorder_item_id`).
- SalesOrder → PurchaseOrder (`salesorder_id`) → Bill (`purchaseorder_ids`, line `purchaseorder_item_id`).
- RecurringInvoice, RecurringBill, RecurringExpense and RecurringJournal profiles each 1—* the documents they generate.
- Project 1—* Task 1—* TimeEntry; TimeEntry → Invoice line (`time_entry_ids`). A billable Expense → Invoice line (`expense_id`).
- CustomerPayment *—* Invoice through an applied-payment junction (`invoice_payment_id`, `amount_applied`).
- VendorPayment *—* Bill (`bill_payment_id`).
- CreditNote *—* Invoice (`creditnote_invoice_id`); VendorCredit *—* Bill (`vendor_credit_bill_id`); RetainerInvoice → Invoice; Journal credit lines → Invoice or Bill.
- Comments, documents, metadata and custom fields attach polymorphically to any transaction (`transaction_id` + `transaction_type`).

**Shape**: the API looks like a generic document engine. The same sub-resource set (comments, attachment, email, templates, submit/approve, customfields, metadata) repeats across about 15 document types. That suggests a shared internal framework, but this is not confirmed by Zoho.

### Gaps
- The OpenAPI files carry `info.version: 1.0.0` even though the API path is `/v3`. No changelog of field additions by date was found.
- No full status enum is published as a schema enum for bills, POs or sales orders. The values above come from `filter_by` and from the action endpoint lists.
- Inventory-only entities that appear inside Books when the Zoho Inventory add-on is enabled are not in the Books API bundle: composite items, packages, picklists, shipments, purchase receives. Purchase returns are in the bundle. — [Inventory add-on help](https://www.zoho.com/books/help/items/advanced-inventory.html)

## 2. API design

### Takeaway
The API is a REST/JSON API at `https://www.zohoapis.{dc}/books/v3`. It uses OAuth 2.0 tokens issued by Zoho Accounts, with `service.scope.operation` scopes, and requires an `organization_id` query parameter on every call.
- Envelope: every response wraps data as `{code, message, <resource>}`. Code 0 means success.
- Pagination: page-number based, 200 items per page by default, with `page_context.has_more_page`.
- Rate limits: 100 requests per minute per org, a daily quota by plan, and 5 or 10 concurrent calls.
- Outbound events: webhooks fired by workflow rules, signed with HMAC-SHA256 and retried.

### Cited Findings

**Root and data centers**:
- Root: `https://www.zohoapis.com/books/v3`.
- Nine domains: .com (US), .eu, .in, .com.au, .jp, .ca, .com.cn (China), .sa (Saudi Arabia), .ae (UAE).
- The data center can be read from the web-app URL (books.zoho.{dc}).
- Source: [API introduction](https://www.zoho.com/books/api/v3/introduction/)

**Tenant parameter**: "The parameter organization_id along with the organization ID should be sent in with every API request to identify the organization", using values from `GET /organizations` (scope ZohoBooks.settings.READ). — [API introduction](https://www.zoho.com/books/api/v3/introduction/)

**Auth**:
- Clients are registered in the Zoho Developer/API Console. Client types: client-based, server-based, mobile, non-browser, self client.
- Authorization-code grant via `accounts.zoho.com/oauth/v2/auth` and `/oauth/v2/token`, with DC-specific accounts hosts such as accounts.zoho.eu. The token response includes `api_domain`, and an `accounts-server`/`location` parameter tells the client which DC holds the user.
- Access tokens last 1 hour. Refresh tokens last until revoked.
- Header format: `Authorization: Zoho-oauthtoken …`.
- Source: [OAuth page](https://www.zoho.com/books/api/v3/oauth/)

**Scopes**:
- Format `ZohoBooks.<scope>.<CREATE|READ|UPDATE|DELETE|ALL>`.
- Scopes: contacts, settings (items, expense categories, users, taxes, currencies, opening balances), estimates, invoices, customerpayments, creditnotes, projects, expenses, salesorders, purchaseorders, bills, debitnotes (vendor credits), vendorpayments, banking, accountants.
- The OpenAPI also references deliverychallans, purchasereturns, fixedasset, custommodules and categories scopes.
- Source: [OAuth page](https://www.zoho.com/books/api/v3/oauth/); [OpenAPI bundle](https://www.zoho.com/books/api/v3/openapi-all.zip)

**HTTP verbs**: GET reads. POST creates and performs actions such as status changes. PUT updates. DELETE deletes. — [HTTP methods](https://www.zoho.com/books/api/v3/http-methods/)

**Envelope and formats**:
- Example envelope: `{"code":0,"message":"success","invoice":{...}}`.
- CSV and PDF are available through the `Accept` header or `?accept=pdf`. A PDF response comes with `Content-Disposition: attachment; filename="INV-384.pdf"`.
- Timestamps use ISO 8601 (`2016-06-11T17:38:06-0700`).
- Source: [Response page](https://www.zoho.com/books/api/v3/response/)

**Pagination**: 200 items per page by default. Parameters are `page` and `per_page`. Responses include `"page_context":{"page":2,"per_page":25,"has_more_page":false}`. — [Pagination](https://www.zoho.com/books/api/v3/pagination/)

**Filtering and sorting conventions** (documented on list endpoints):
- `filter_by=Status.X` (or `Date.X`, `PaymentMode.X`, `AccountType.X`), `search_text`, and `sort_column` plus sort order.
- Field-level filters use suffix operators: `date_start`, `date_end`, `date_before`, `date_after`, `due_date_*`, `created_date_*`, `last_modified_time`. Some list endpoints also take `custom_field`, `customer_id` and `item_id`.
- Source: [Invoices API](https://www.zoho.com/books/api/v3/invoices/)

**Errors**:
- HTTP status codes used: 200, 201, 400, 401 (invalid token), 404, 405, 429, 500.
- The body carries a Books error code, for example `1002 "Invoice does not exist."` or `1000 "Internal error"`.
- Source: [Errors](https://www.zoho.com/books/api/v3/errors/)

**Rate limits**:
- 100 requests per minute per organization.
- Daily limits: Free 1,000, Standard 2,000, Professional 5,000, Premium, Elite and Ultimate 10,000.
- Every limit returns HTTP 429. The daily cap is error code 45; the per-minute block is code 44.
- Concurrent calls: 5 on Free, 10 (soft) on paid plans, error code 1070.
- Source: [API introduction](https://www.zoho.com/books/api/v3/introduction/)

**Upsert by unique custom field (the closest feature to idempotency)**:
- `PUT /invoices` (and the same on 15 resources: bills, contacts, credit notes, customer payments, estimates, expenses, invoices, items, projects, purchase orders, recurring bills/expenses/invoices, sales orders, vendor payments) accepts these headers: `X-Unique-Identifier-Key` (the custom field's API name), `X-Unique-Identifier-Value`, and `X-Upsert` ("If there is no record found [with the] unique custom field value, will create new").
- No "idempotency" key appears anywhere in the OpenAPI bundle.
- Source: [Invoices API](https://www.zoho.com/books/api/v3/invoices/); [OpenAPI bundle](https://www.zoho.com/books/api/v3/openapi-all.zip)

**Custom fields in payloads**:
- Invoices, POs, sales orders and items use `custom_fields[{customfield_id, value}]`. Contacts, bills and vendor payments use `custom_fields[{index, value}]`. Customer payments use `{label, value}`.
- Per-record endpoints exist, such as `/invoice/{id}/customfields`.
- Field data types: text, email, URL, phone, number, decimal, amount, percent, date, date-time, checkbox, auto-generate number, dropdown, multi-select, and also "AI Fields".
- Source: [OpenAPI bundle](https://www.zoho.com/books/api/v3/openapi-all.zip); [Custom field data types](https://www.zoho.com/books/help/settings/customization/custom-field-data-types.html)

**Bulk operations**: these are action endpoints, not a generic batch API. Examples: `DELETE /invoices?invoice_ids=`, `POST /invoices/email`, `/invoices/status/sent`, `/invoices/status/void`, `/invoices/approve`, `/chartofaccounts/bulkdelete`, `/journals/bulkdelete`, `/registers/{account_id}/transactions/bulkupdate`, `/basecurrencyadjustment/bulkdelete`. — [OpenAPI bundle](https://www.zoho.com/books/api/v3/openapi-all.zip)

**Outgoing webhooks**:
- Configured under Settings → Workflow Actions → Webhooks, and fired only through workflow rules.
- Methods: POST (default), PUT or DELETE.
- Options: custom query parameters, custom HTTP headers, and auth as "General" (basic, API key or none) or as a stored "Connection".
- Body formats: Default Payload (all module fields as JSON), x-www-form-urlencoded, or Raw JSON with placeholders.
- Optional secret token (12–50 alphanumeric characters) used to compute an HMAC-SHA256 hash. The help page documents the signed string: alphabetically sorted key–value pairs with the raw JSON appended.
- Timeouts: 5 s to connect, 10 s to read. Any non-2xx response, including 3xx, counts as a failure.
- Retries: 5 by default, configurable up to 20 with fixed, additive or multiplicative backoff. Retries resend the same payload. Manual retry is available from Workflow Logs.
- Failure notice after 20 consecutive failures. The daily webhook limit varies by plan.
- Source: [Webhooks help](https://www.zoho.com/books/help/settings/automation/workflow-actions/webhooks.html)

**Workflow rule triggers**:
- Event-based: Created, Edited, Created or Edited, Deleted, Submitted, Approved, Rejected. Field-change conditions can name up to 3 fields.
- Date-based: N days before or after a date field, at a chosen time, run once or daily/weekly/monthly/yearly.
- Actions: email alerts, field updates, in-app notifications, webhooks, functions.
- Source: [Workflow rules](https://www.zoho.com/books/help/settings/automation/workflow-rules.html)

**Attachments**: `POST /invoices/{id}/attachment` takes a multipart `attachment` file and the `can_send_in_mail` flag. Files are also reachable at `/documents/{document_id}`. — [Invoices API](https://www.zoho.com/books/api/v3/invoices/)

**AI/MCP**: Zoho Books offers an official MCP server so LLM agents can create invoices, record expenses, run reports and so on. The help text says Zoho Books is a default connector in Claude. — [Zoho Books MCP help](https://www.zoho.com/books/help/mcp/zoho-books-mcp.html)

### Inferences
- The ID values in the docs are long numeric strings with org/DC-like prefixes, such as `460000000000097` and `903000000000099`. They look like globally unique 64-bit IDs. The allocation scheme is not documented.
- Because the tenant is a query parameter and not part of the path or host, one OAuth token can work against several organizations the user belongs to. The scopes are per service, not per org. This is inferred from the docs; there is no explicit statement.

### Gaps
- No documented incoming-webhook feature for Books was found. Inbound automation appears to rely on the REST API, Deluge functions, Zoho Flow or Zapier.
- Per-plan daily webhook and Deluge component quotas are referenced but not quantified on the pages read.
- No ETag, `If-Match` or optimistic-concurrency mechanism is documented.

## 3. Multi-tenancy, data residency, identity

### Takeaway
The organization is the tenant and data boundary. Each organization has its own ID, base currency, time zone, language, contacts and reports. A Zoho Accounts identity can belong to many organizations, and users switch between them. Tenants are placed in one of nine regional data centers, and identity is handled centrally by Zoho Accounts (IAM/SSO) across all Zoho apps.

### Cited Findings
- "Each organization is an independent Zoho Books Organization with it's own organization ID, base currency, time zone, language, contacts, reports, etc." — [API introduction](https://www.zoho.com/books/api/v3/introduction/)
- Users can add organizations, clone settings from an existing org, switch between orgs, and set a default org. — [More actions help](https://www.zoho.com/books/help/personalize/more-actions.html); the API exposes `is_default_org` and `/organizations/{id}/copysettings` ([API introduction](https://www.zoho.com/books/api/v3/introduction/))
- **Roles inside an org**:
  - Standard roles are Admin, Staff, Timesheet Staff, and Staff (Assigned Customers Only); a Super Admin privilege also exists. Custom roles are possible.
  - User access can be further limited by Location and by Advanced Reporting Tag values.
  - Only Admins can invite users.
  - Source: [Users & Roles help](https://www.zoho.com/books/help/settings/users.html)
- **Sign-in and SSO**:
  - Sign-in goes through Zoho Accounts: the books.zoho.com app shell redirects to `accounts.zoho.com/signin?servicename=ZohoBooks` (observed 2026-11-18 at https://books.zoho.com/app).
  - Supported sign-in methods include social logins and OneAuth MFA "Smart sign-in". — [Access Zoho Books](https://www.zoho.com/books/help/getting-started/access-zb.html)
  - Zoho's integrated IAM service handles all sign-ins, and SAML is supported. — [Zoho Security](https://www.zoho.com/security.html)
- **Data residency**:
  - Nine API domains / data centers exist. — [API introduction](https://www.zoho.com/books/api/v3/introduction/)
  - Zoho says it operates "over 18 data centers globally" that host each country or region's data. Indian data is in Mumbai, Delhi and Chennai, with Odisha planned. (Business Today, 2025-09-30, quoting Sridhar Vembu.) — [Business Today](https://www.businesstoday.in/latest/corporate/story/we-dont-use-aws-or-azure-sridhar-vembu-clears-air-on-arattai-zohos-desi-tech-backbone-496250-2025-09-30); [Digit](https://www.digit.in/features/general/how-arattai-zoho-apps-are-made-in-india-sridhar-vembu-explains-in-detail.html)
- Extension OAuth clients can be set to "Use the same OAuth credentials for all data centers", with DC-specific Deluge redirect hosts (deluge.zoho.com, deluge.zoho.in, dre.zoho.eu, dre.zoho.jp, dre.zoho.com.au). — [Custom connections](https://www.zoho.com/books/developer/extensions/custom-connections.html)
- Inside an org, "Branches"/"Locations" add a sub-tenant dimension: `location_id` on headers and lines, per-location opening balances and stock, and user access restricted by location. — [Locations API](https://www.zoho.com/books/api/v3/locations/); [Users help](https://www.zoho.com/books/help/settings/users.html)

### Inferences
- Zoho describes Books and Inventory organizations as "the same core" with one org ID (section 8). That suggests tenancy is managed in a shared Zoho Finance organization layer rather than per app. This is inferred.
- Zoho does not publish whether tenants are separated by database, by schema, or by row-level `organization_id`.

### Gaps
- No primary source describes how Books shards or isolates tenant data physically (separate DB per org, shared tables with an org key, etc.).
- No documented way exists to move an organization between data centers.

## 4. Technology stack and infrastructure

### Takeaway
Zoho says it owns and vertically integrates its whole stack, from apps down to its own data centers, and does not host products on AWS, Azure or GCP. Third-party clouds are used only tactically for traffic switching nodes.
- Confirmed components: Linux and PostgreSQL (Vembu); an in-house key management service; Zoho's own front-end framework, Lyte/sLyte, published by `lyte-team@zohocorp.com`; Deluge as the scripting runtime; Catalyst as the externally sold version of Zoho's internal serverless and infrastructure services.
- Java is strongly indicated but not confirmed by a primary statement about Books. The public books.zoho.com endpoint sets a `JSESSIONID` cookie, and Zoho's function runtime is a Java package namespace (`com.zoho.cloud.function`).

### Cited Findings
- **Confirmed: own infrastructure, no hyperscalers for hosting.**
  - Vembu stated that Zoho products "doesn't run on AWS, Microsoft Azure, or Google Cloud"; they operate "on Zoho's own hardware and software stack, built on top of open-source frameworks like Linux and Postgres." Public clouds are used only "to speed up regional traffic through switching nodes", and no user data is stored there. (2025-09-30) — [Business Today](https://www.businesstoday.in/latest/corporate/story/we-dont-use-aws-or-azure-sridhar-vembu-clears-air-on-arattai-zohos-desi-tech-backbone-496250-2025-09-30)
  - "Zoho owns its hardware and builds its software frameworks in-house, using open-source technologies like Linux and PostgreSQL… third-party cloud providers employed only for regional switching nodes (points of presence, or POPs)". Zoho "invests in foundational technologies – browsers, compilers, databases". (2025-09-30) — [Digit](https://www.digit.in/features/general/how-arattai-zoho-apps-are-made-in-india-sridhar-vembu-explains-in-detail.html)
- **Confirmed: vertical integration.** "Zoho has built and vertically integrated all of the layers of its tech stack, from applications to app infrastructure to operating systems to network infrastructure all the way down to data centers." (Zoho press release, 2019-10-17) — [Zoho newsroom, Catalyst launch](https://www.zoho.com/news/zoho-opens-up-infrastructure-launches-catalyst.html). "We own all the core aspects of our technology stack." (current) — [Zoho Privacy Commitment](https://www.zoho.com/privacy-commitment.html)
- **Reported (executive interviews):**
  - Data-center spend is 12–15% of revenue (Shailesh Davey). Vembu says SaaS peers spend 20–25% of revenue on hyperscalers and that Zoho's own infrastructure costs about half as much.
  - Zoho adopted Postgres and runs it on GPUs, deployed across its data centers.
  - Zoho uses hyperscalers in "two or three instances… in a very tactical way".
  - The article is undated in my capture; its content (">$1bn ARR, 80M+ users") points to roughly 2023–2024.
  - Source: [Diginomica](https://diginomica.com/are-we-paying-hyperscalers-too-much-public-cloud-zoho-thinks-so)
- **Confirmed: in-house front-end framework (Lyte/sLyte).**
  - npm packages `@slyte/core` ("Core runtime for the sLyte framework, providing dependency injection, application bootstrap, service lifecycle management, and reactive primitives"), `@slyte/component` (web components, template compilation, two-way binding), `@slyte/data` ("ORM-like API for defining schemas, managing entity…"), `@slyte/router`, `@slyte/cli`, `@slyte/mcp` and `@slyte/lyte-ui-component` ("reusable UI components for the Lyte.js framework").
  - The maintainer is `lyte-team` <lyte-team@zohocorp.com>; the license is Apache-2.0; the packages were first published to npm on 2026-08-11.
  - Source: [npm @slyte/core](https://www.npmjs.com/package/@slyte/core); [npm @slyte/lyte-ui-component](https://www.npmjs.com/package/@slyte/lyte-ui-component)
  - Zoho CRM exposes "Slyte" publicly as a front-end framework (SlyteUI) for in-product customization. — [Zoho CRM SlyteUI docs](https://www.zoho.com/crm/developer/docs/slyteui/)
- **Confirmed: extension and widget toolkit for Books.**
  - Widgets use the ZET (Zoho Extension Toolkit) framework. They import `https://static.zohocdn.com/zohofinance/v1.0/zf_sdk.js` (global `ZFAPPS`, e.g., `ZFAPPS.get('organization.org_name')`) and render in iframes.
  - Widgets can be hosted internally (HTML/CSS/JS) or externally, and are configured in `plugin-manifest.json`. ZET CLI needs Node.js.
  - Source: [Widgets framework and hosting](https://www.zoho.com/books/developer/widgets/framework-and-hosting.html); npm [zoho-extension-toolkit](https://www.npmjs.com/package/zoho-extension-toolkit), author "Zoho Corporation"
  - Extension sample docs show React, Vue and vanilla JS widgets, so third-party widget code is framework-agnostic. — [Developer index](https://www.zoho.com/books/developer/llms.txt)
- **Confirmed: Deluge plus a polyglot function runtime.**
  - Deluge ("Data Enriched Language for the Universal Grid Environment") is Zoho's online scripting language, used for Books functions, custom buttons and schedules.
  - Functions can also be written in Java, Node.js or Python via the Zoho Finance CLI (`npx @zohofinance/cli login|pull|execute|push`; the pull URL is `https://www.zohoapis.com/books/integrations/customfunctions/{id}/download?organization_id=…`).
  - Non-Deluge functions get a `context` with log, cache (TTL), queue, file storage via "Stratus", scheduling via "Docket", and connectors.
  - The Java signature is `import com.zoho.cloud.function.Context; … implements ZCFunction { public void runner(Context context, BasicIO basicIO) }`.
  - Daily Deluge component quotas are tracked for invoke_url_api, webhook and email.
  - Source: [Functions help](https://www.zoho.com/books/help/settings/automation/workflow-actions/custom-functions.html); [Zoho Finance CLI](https://www.zoho.com/books/help/settings/custom-functions-using-zoho-finance-cli.html); [Context methods](https://www.zoho.com/books/help/settings/custom-functions-context-methods.html)
- **Confirmed: Catalyst is Zoho's own infrastructure, offered externally.** "Catalyst gives developers access to the same underlying services and frameworks that power Zoho's 45+ applications"; functions in Java, Node.js and more; "Over the past 13 years, more than 26 million functions have been built and executed on Zoho's infrastructure". (2019-10-17) — [Zoho newsroom](https://www.zoho.com/news/zoho-opens-up-infrastructure-launches-catalyst.html). Current Catalyst services include Functions, AppSail (PaaS), Stratus (object storage), Signals (event bus), Job Scheduling, CloudScale BaaS and SmartBrowz (headless Chrome). — [Catalyst home](https://catalyst.zoho.com/)
- **Observed (HTTP response headers, 2026-11-18)**: `https://books.zoho.com/app` returns `server: ZGS`, a load-balancer cookie `zalb_…`, `JSESSIONID` (Secure, HttpOnly), HSTS with `includeSubDomains; preload`, `x-frame-options: SAMEORIGIN` and `x-content-type-options: nosniff`. The Zoho Accounts sign-in page loads jQuery 3.7.1 and Zoho IAM scripts from `static.zohocdn.com/iam/…`. — direct inspection of https://books.zoho.com/app and https://accounts.zoho.com/signin
- **Confirmed: native apps across platforms.**
  - Zoho Books has native apps for iOS, iPadOS, Android, Windows, macOS, Apple TV and watchOS, and supports Chromium browsers including Zoho's own Ulaa. — [Access Zoho Books](https://www.zoho.com/books/help/getting-started/access-zb.html)
  - Zoho's 2025 blog says the finance apps (Books, Invoice, Billing, Inventory, Expense) adopt Liquid Glass, Apple Intelligence, App Intents/Spotlight and a macOS Tahoe menu bar. — [Zoho blog, Apple 26 updates](https://blog.zoho.com/general/zoho-apps-apple-26-updates.html)
- **Confirmed: no AdTech or third-party ad trackers.** "We will never sell your data. We will never do advertisements… There are no advertisement providers in our network." — [Zoho Privacy Commitment](https://www.zoho.com/privacy-commitment.html)
- **Reported: distributed grid and redundancy.** "We use a distributed grid architecture to shield our system and services from the effects of possible server failures"; a proprietary monitoring tool; third-party DDoS mitigation providers. — [Zoho Security](https://www.zoho.com/security.html)

### Inferences
- **Java backend (Inferred, strong)**: `JSESSIONID` is the default session cookie name in Java Servlet containers. The function runtime and context SDK use the `com.zoho.cloud.function` Java namespace, and Catalyst/Zoho functions list Java first. None of this is a primary statement that the Books server is written in Java.
- **Lyte in Zoho Books' own UI (Inferred, unverified)**: Lyte/sLyte is confirmed as a Zoho framework, with packages for router, data/ORM and components. Whether the Books web client is built on it could not be checked, because the app shell is behind sign-in. The data/router/component split resembles Ember-style architecture.
- **Native Apple apps (Inferred)**: adopting Liquid Glass, App Intents and watchOS/tvOS targets implies native Apple frameworks (Swift/SwiftUI or UIKit). The Android language is unknown.
- **Shared runtime (Inferred)**: "Stratus" (file storage) appears both in Books function context methods and as a Catalyst product. So Books' polyglot functions likely run on Catalyst-family infrastructure.

### Gaps
- **Ember.js in Zoho Books**: no evidence found in searches. The only "ember" string on the sign-in page was incidental.
- No primary source names Zoho Books' database engine. Postgres is confirmed company-wide by Vembu but not per product, and no source covers caching (e.g., Redis-equivalents), search engines or message queues used by Books specifically.
- "ZGS" (server header) is not defined in any source found.
- No Zoho careers page listing the Books tech stack was retrieved.

## 5. Accounting engine concepts relevant to architecture

### Takeaway
Every posted document creates a ledger journal behind the scenes, which can be viewed per transaction and through the API (`GET /transactions/{transaction_id}/journals`).
- Reports switch between accrual and cash basis over the same data.
- Edits are restricted by transaction locking (per module or for everything, by date, with partial unlock periods).
- Deletion is blocked while dependents exist (for example, payments on an invoice), and "void" is offered to keep a record while removing its effect on accounts.
- History lives in activity logs, comments-as-history and, in some regions, versioned audit trails.

### Cited Findings
- "After you have recorded a bill, a corresponding journal will be created for it" (View Journal). A "Transaction Posting Date" lets the journal post on a different date (India, Canada, Global editions). — [Bills help](https://www.zoho.com/books/help/bills/basic-functions.html)
- API access to the ledger:
  - `GET /transactions/{transaction_id}/journals` (journals module);
  - `GET /chartofaccounts/accounttransactions` filtered by `transaction_type`;
  - account registers at `/registers/{account_id}/transactions` with bulk update/delete and `budgetvsactuals`.
  - Source: [Journals API](https://www.zoho.com/books/api/v3/journals/); [Chart of Accounts API](https://www.zoho.com/books/api/v3/chart-of-accounts/); [Registers API](https://www.zoho.com/books/api/v3/registers/)
- Manual journals carry balanced lines (`debit_or_credit`, `amount`, `account_id`). They can be draft or published, reversed (`/reverse`), recurring, or "cash"/"both" type. — [Journals API](https://www.zoho.com/books/api/v3/journals/)
- Report Basis can be set to "Cash Basis or Accrual Basis". Accrual: "Amount generated when the transactions are created". Cash: "Amount generated when the organization actually receives the cash." — [Manage reports](https://www.zoho.com/books/help/reports/manage-reports.html)
- **Transaction locking**:
  - Lock individual modules or all transactions before a lock date, with a reason. Locked modules are Sales, Purchases, Banking and Accounts, each listing its document types.
  - Locked records "cannot be added, modified, or deleted if recorded before the specified lock date". Partial unlock is possible for a date range.
  - Available on Standard plans and above.
  - API: `GET|POST|DELETE /transactionlock`, `/transactionlocks`, `/transactionlock/partialunlock`, `/accountingperiods/transactionlock`.
  - Source: [Transaction locking help](https://www.zoho.com/books/help/accountant/transaction-lock.html); [Transaction Locking API](https://www.zoho.com/books/api/v3/transaction-locking/)
- Delete versus void: "Before you can delete an invoice, you have to delete the payments that have been recorded for it". "If you want to keep a copy of an invoice but don't want it to reflect on any reports or accounts, you can void it." — [Delete invoice help](https://www.zoho.com/books/help/invoice/delete-invoice.html). Void endpoints exist on invoices, retainer invoices, credit notes, sales orders, bills, vendor credits and purchase returns. — [OpenAPI bundle](https://www.zoho.com/books/api/v3/openapi-all.zip)
- **Audit and history**:
  - The Activity Logs report records when/what/where/who, filterable by module, user, action (create/update/delete) and PII-field changes.
  - "Audit Trail" offers "Show Versions" and side-by-side compare (edited, removed and added values highlighted). It is currently available for orgs in India, UK, UAE, KSA, Bahrain and EU countries.
  - Source: [Activity reports help](https://www.zoho.com/books/help/reports/activity.html)
  - Zoho holds a SOC 1 Type 2 "Audit Trail" report. — [Zoho Compliance](https://www.zoho.com/compliance.html)
- Multi-currency: each document has `currency_id` and `exchange_rate`; lines carry `bcy_rate` (base-currency rate); exchange-rate tables live per currency (`/settings/currencies/{id}/exchangerates`). Base Currency Adjustments revalue foreign-currency balances (`/basecurrencyadjustment`, `/reevaluate`). — [Currency API](https://www.zoho.com/books/api/v3/currency/); [Base Currency Adjustment API](https://www.zoho.com/books/api/v3/base-currency-adjustment/)
- Approval workflow before posting: `/submit`, `/approve`, `/approve/final`, `/reject` on invoices, estimates, sales orders, POs, bills, credit notes, vendor credits, retainer invoices and journals. Bills accept ordered `approvers[]`. — [OpenAPI bundle](https://www.zoho.com/books/api/v3/openapi-all.zip)

### Inferences
- "Draft" documents appear not to post to the ledger until opened or sent. This is suggested by draft/open/sent lifecycles and the "Save as Draft / Save as Open" choice, but no page read states it explicitly.
- Since reports can toggle cash or accrual on demand, transactions are probably stored once (accrual events plus payment events), with the cash view derived. A third-party glossary asserts this; it is not confirmed by Zoho.

### Gaps
- No Zoho page read gives the exact debit/credit postings for each document type (for example AR Dr / Sales Cr / Tax Cr for an invoice). The Inventory KB "accounting flow" page contains only an image.
- Retention period for history and audit data was not found.

## 6. Security and compliance

### Takeaway
Zoho documents these controls: TLS 1.2/1.3 with PFS and HSTS in transit; AES-256 at rest with an in-house KMS and envelope encryption; daily incremental and weekly full backups (AES-256, kept for 3 months); near-real-time replication to a secondary data center; MFA via OneAuth (including YubiKey); SAML SSO; and customer-visible audit logs. Zoho holds SOC 1/SOC 2 Type 2, ISO 27001/27017/27018/27701 and PCI DSS (finance apps), and states GDPR/CCPA compliance. Books itself adds a self-service full-data export.

### Cited Findings
- In transit: TLS 1.2/1.3 for web, API and mobile; Perfect Forward Secrecy; HSTS; secure cookies. At rest: "Sensitive customer data at rest is encrypted using 256-bit Advanced Encryption Standard (AES)… We own and maintain the keys using our in-house Key Management Service (KMS)… encrypting the data encryption keys using master keys", which are stored on separate servers. — [Zoho Security](https://www.zoho.com/security.html)
- Backups: "incremental backups everyday and weekly full backups of our databases using Zoho Admin Console (ZAC)", AES-256, tar.gz format, retained 3 months, RAID on backup servers. DR: "Data in the primary DC is replicated in the secondary in near real time". After account termination, data is deleted from the active DB at the next 6-monthly clean-up and from backups 3 months later. — [Zoho Security](https://www.zoho.com/security.html)
- MFA via Zoho OneAuth (Touch ID/Face ID, push, QR, TOTP, YubiKey). SSO through Zoho's IAM service, with SAML. "Detailed audit logging covering all update and delete operations performed by the user are available to the customers in every Zoho service." — [Zoho Security](https://www.zoho.com/security.html)
- MFA is also available for Books customer and vendor portals. — [Help index](https://www.zoho.com/books/help/llms.txt)
- **Certifications**:
  - ISO/IEC 27001, 27701, 27017 and 27018 (valid to 2028-08-21).
  - SOC 2 Type 2 (all cloud services).
  - SOC 1 Type 2 (SSAE 18/ISAE 3402), explicitly covering Zoho Books, Invoice, Expense, Inventory, Billing, Checkout and Payroll, plus a SOC 1 Audit Trail report.
  - PCI DSS (SAQ-D self-assessment) for Books, Invoice, Inventory, Billing, Expense, Checkout and Commerce.
  - GoBD (German tax record-keeping) for Books, Invoice and Expense.
  - GDPR and CCPA statements, CSA STAR self-assessment, ISO 22301, ISO 20000-1, and Cyber Essentials Plus.
  - The SOC audit period runs from December to November.
  - Source: [Zoho Compliance](https://www.zoho.com/compliance.html)
- HIPAA: a Books help page covers secure export of health information. — [HIPAA in Zoho Books](https://www.zoho.com/books/help/compliance/hipaa.html)
- Customer self-backup: Settings → Developer Space → Data Backup produces a compressed file of per-module CSVs. The link arrives by email in about 30 minutes, expires after 30 days, and one backup is allowed per 15 days. — [Backup help](https://www.zoho.com/books/help/import-export/backup-your-data.html)
- Webhook privacy note: configuring webhooks shares contact PII with the target URL. — [Webhooks help](https://www.zoho.com/books/help/settings/automation/workflow-actions/webhooks.html)

### Inferences
- The OAuth model (scoped, 1-hour access tokens, revocable refresh tokens), plus per-org rate limits and concurrency caps, is the API-side security boundary. That is the documented design; how it is enforced internally is not documented.

### Gaps
- No Books-specific IP-restriction (allowlisting) feature was found in the pages read. Zoho Accounts and Zoho One have admin policies, but these were not verified for Books.
- Field-level encryption details per Books entity (for example, which fields count as "sensitive") are not published.

## 7. Integration architecture

### Takeaway
There are three integration tiers:
1. Native Zoho-to-Zoho sync. CRM is two-way sync of customers, vendors and items, with CRM IDs stored in Books fields. Inventory is a shared organization, not a sync.
2. Platform extensibility: custom fields and modules, Deluge functions, workflow webhooks, and Sigma-built extensions with ZET widgets in about 17 UI locations, published to Zoho Marketplace.
3. Third-party iPaaS such as Zapier (and Zoho Flow) on top of the public REST API.

### Cited Findings
- **Zoho CRM**:
  - Two-way sync. CRM Accounts map to Books Customers (type Business), CRM Contacts map to Customers (type Individual) or Contact Persons, and Vendors and Items also sync.
  - Duplicates are matched on Account Name versus Customer Display Name.
  - Multiple Books orgs can connect to one CRM org, but only one-way (CRM → Books).
  - The base currency must match for item sync.
  - Users' details and org name, email and country are shared with CRM.
  - Source: [CRM integration help](https://www.zoho.com/books/help/integrations/crm-integration.html)
  - API traces: `POST /crm/account/{crm_account_id}/import`, `/crm/contact/{id}/import`, `/crm/vendor/{id}/import`, `/crm/item/{crm_product_id}/import`. Documents carry `zcrm_potential_id`, `crm_owner_id`, `crm_custom_reference_id`. — [Integration API](https://www.zoho.com/books/api/v3/integration/); [Sales Orders API](https://www.zoho.com/books/api/v3/sales-order/)
- **Extensions (Sigma, Zoho Books Developer Portal)**:
  - Extensions are built in Zoho Sigma workspaces.
  - Components: custom fields, custom buttons and links (Deluge), related lists, meta fields, connections, custom workflow triggers, custom actions, settings, widgets.
  - Extensions are tested in a sandbox and published through Zoho Marketplace review.
  - Custom connections let one extension span "multiple Zoho Finance apps".
  - Source: [Extension components](https://www.zoho.com/books/developer/extensions/extension-components.html); [Custom connections](https://www.zoho.com/books/developer/extensions/custom-connections.html); [Developer index](https://www.zoho.com/books/developer/llms.txt)
- **Widget locations**: All Pages Sidebar, New Record Page Sidebar, Details Page Sidebar, List Page Sidebar, Attachment Picker, Blueprint Widget, Custom Action Widget, Dashboard Widget, Custom Action List Widget, List Page Bulk Actions Button, Details Page Button, List Page Button, Add Line Item Plugin, Globalfields, User E-signature, Background, Web Tabs. — [Zoho Finance widget SDK: Locations](https://www.zoho.com/finance/developer/widget-sdk-documentation/books/v1/locations/overview/)
- **Built-in and other integrations**: Zapier ("8,000+ third party apps"), Zoho Analytics, Bigin, Billing, Cliq, Commerce, Desk, Expense, Projects, People, Sign, SalesIQ, Mail, Google Workspace, Microsoft 365, Slack, Twilio, WhatsApp, payment gateways (Stripe, PayPal, CSG Forte, Mercado Pago), and Claude Managed Agents in workflow rules. — [Help index](https://www.zoho.com/books/help/llms.txt)
- **Inventory add-on inside Books**: with a paid Zoho Inventory org, Books can enable Inventory modules (composite items, packages, picklists, shipments, purchase receives, purchase returns) "all within Zoho Books". — [Inventory add-on help](https://www.zoho.com/books/help/items/advanced-inventory.html)

### Inferences
- The Zoho Finance widget SDK (`static.zohocdn.com/zohofinance/…`, the `ZFAPPS` object), the `@zohofinance` npm scope, and "Zoho Finance Suite" custom connections show that the extension platform is shared across the finance product family. The extension surface is therefore defined once and reused across Books, Invoice, Inventory, Billing and Expense. This is inferred from naming and docs.

### Gaps
- Zoho Flow's Books connector and Zoho One-specific architecture (for example, shared directory or admin panel) were not researched in primary sources within this budget.
- Sigma's internal hosting and execution model for Deluge-based extension code is not described beyond "rendered in iframes" for widgets.

## 8. Product family and shared finance platform

### Takeaway
Zoho's own documentation says Zoho Books and Zoho Inventory "have the same core", and an organization keeps one organization ID across both apps. The Books API can upgrade an organization from Zoho Invoice to Books or downgrade it back, which implies Invoice and Books share the same organization and data store. The finance apps share a compliance scope (SOC 1, PCI), an extension SDK (`zohofinance`), a CLI (`@zohofinance/cli`), and native-app design updates.

### Cited Findings
- **Books and Inventory share one core**:
  - "The organization ID in Zoho Books and Zoho Inventory are going to be one and the same. This is because your organization is like a single palanquin that is now borne by two bearers."
  - "Zoho Books and Zoho Inventory have the same core… when you create an organization in one of these apps, you will be able to tap into it by simply joining that organization into the other app."
  - Settings, contacts, items, sales orders, purchase orders, bills and common reports are shared. "Two different organizations (with different organization IDs) cannot be integrated together."
  - Source: [Zoho Inventory accounting integration help](https://www.zoho.com/inventory/help/integrations/accounting-integrations.html); [Inventory KB integration flow](https://www.zoho.com/inventory/kb/integrations/accounting-flow.html)
- **Books and Invoice share organizations**: `POST /organizations/{organization_id}/downgradetoinvoice` ("Downgrade an organization from Zoho Books to Zoho Invoice") and `POST /organizations/{organization_id}/upgradetobooks` ("Upgrade an organization from Zoho Invoice to Zoho Books"). — [Organizations API](https://www.zoho.com/books/api/v3/organizations/). A help guide "Upgrade to Zoho Books from Zoho Invoice" exists. — [Help index](https://www.zoho.com/books/help/llms.txt)
- **Shared compliance scope**: SOC 1 Type 2 covers Books, Invoice, Expense, Inventory, Billing, Checkout and Payroll. PCI covers Books, Invoice, Inventory, Billing, Expense, Checkout and Commerce. — [Zoho Compliance](https://www.zoho.com/compliance.html)
- **Shared developer tooling**: the widget SDK lives under `zohofinance`, the `@zohofinance/cli` package handles functions, the `@zohofinance/commerce` CLI builds Zoho Commerce store themes, and custom connections let extensions be published "across multiple Zoho Finance apps". — [npm @zohofinance/cli](https://www.npmjs.com/package/@zohofinance/cli); [Custom connections](https://www.zoho.com/books/developer/extensions/custom-connections.html); [Widgets framework](https://www.zoho.com/books/developer/widgets/framework-and-hosting.html)
- **Shared native-app updates**: "Managing money, expenses, and billing is faster and more intuitive across Zoho Books, Invoice, Billing, Inventory, and Expense… a new menu bar across all Finance apps". (2025) — [Zoho blog](https://blog.zoho.com/general/zoho-apps-apple-26-updates.html)
- Zoho Billing and Zoho Expense integrate with Books through documented integrations that sync customers and subscriptions, rather than being described as "same core". — [Help index](https://www.zoho.com/books/help/llms.txt)

### Inferences
- Invoice, Books and Inventory appear to be feature tiers or "views" over one finance data platform keyed by organization ID. Billing, Expense and Commerce appear to be separate apps that integrate with it but share the finance SDK and compliance boundary. This is inferred from the sources above, not a Zoho architectural statement.

### Gaps
- No Zoho engineering source describes the internal code-sharing (a common "Zoho Finance platform" codebase) beyond these product and documentation signals.
- Whether Zoho Billing and Zoho Expense use the same organization store as Books (as Inventory does) was not confirmed.
