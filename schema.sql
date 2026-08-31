create extension if not exists "uuid-ossp";

-- Supabase Auth owns users. Businesses point to auth.users directly.
create table if not exists businesses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  business_name text not null default 'My Business',
  industry text not null default 'General',
  currency text not null default 'USD',
  country text,
  timezone text default 'UTC',
  health_score int default 50 check (health_score between 0 and 100),
  created_at timestamptz not null default now()
);
create index if not exists idx_businesses_user on businesses(user_id);

create table if not exists customers (
  id uuid primary key default uuid_generate_v4(), business_id uuid not null references businesses(id) on delete cascade,
  name text not null, email text, phone text, company text, status text not null default 'active',
  lead_score int default 0 check (lead_score between 0 and 100), last_contact timestamptz,
  lifetime_value numeric(12,2) default 0, created_at timestamptz not null default now()
);
create index if not exists idx_customers_business on customers(business_id);
create index if not exists idx_customers_score on customers(business_id,lead_score desc);

create table if not exists leads (
  id uuid primary key default uuid_generate_v4(), business_id uuid not null references businesses(id) on delete cascade,
  customer_id uuid references customers(id) on delete set null, source text, stage text not null default 'new',
  value numeric(12,2) default 0, probability numeric(5,2) default 0, score int default 0 check(score between 0 and 100),
  status text not null default 'open', last_interaction timestamptz, created_at timestamptz not null default now()
);
create index if not exists idx_leads_business on leads(business_id);
create index if not exists idx_leads_score on leads(business_id,score desc);

create table if not exists sales (
  id uuid primary key default uuid_generate_v4(), business_id uuid not null references businesses(id) on delete cascade,
  customer_id uuid references customers(id) on delete set null, amount numeric(12,2) not null, product text,
  sale_date date not null default current_date, status text not null default 'completed', created_at timestamptz not null default now()
);
create index if not exists idx_sales_business_date on sales(business_id,sale_date desc);

create table if not exists expenses (
  id uuid primary key default uuid_generate_v4(), business_id uuid not null references businesses(id) on delete cascade,
  category text not null, amount numeric(12,2) not null, expense_date date not null default current_date,
  description text, created_at timestamptz not null default now()
);
create index if not exists idx_expenses_business_date on expenses(business_id,expense_date desc);

create table if not exists ai_insights (
  id uuid primary key default uuid_generate_v4(), business_id uuid not null references businesses(id) on delete cascade,
  type text not null, severity text not null default 'opportunity', title text not null, description text not null,
  recommendation text not null, estimated_impact text, dismissed boolean default false, created_at timestamptz not null default now()
);
create index if not exists idx_insights_business on ai_insights(business_id,created_at desc);

alter table businesses enable row level security;
alter table customers enable row level security;
alter table leads enable row level security;
alter table sales enable row level security;
alter table expenses enable row level security;
alter table ai_insights enable row level security;

-- RLS uses the authenticated user's ownership of the business.
drop policy if exists businesses_owner on businesses;
create policy businesses_owner on businesses for all using (user_id=auth.uid()) with check (user_id=auth.uid());

drop policy if exists tenant_customers on customers;
create policy tenant_customers on customers for all using (exists(select 1 from businesses b where b.id=customers.business_id and b.user_id=auth.uid())) with check (exists(select 1 from businesses b where b.id=customers.business_id and b.user_id=auth.uid()));
drop policy if exists tenant_leads on leads;
create policy tenant_leads on leads for all using (exists(select 1 from businesses b where b.id=leads.business_id and b.user_id=auth.uid())) with check (exists(select 1 from businesses b where b.id=leads.business_id and b.user_id=auth.uid()));
drop policy if exists tenant_sales on sales;
create policy tenant_sales on sales for all using (exists(select 1 from businesses b where b.id=sales.business_id and b.user_id=auth.uid())) with check (exists(select 1 from businesses b where b.id=sales.business_id and b.user_id=auth.uid()));
drop policy if exists tenant_expenses on expenses;
create policy tenant_expenses on expenses for all using (exists(select 1 from businesses b where b.id=expenses.business_id and b.user_id=auth.uid())) with check (exists(select 1 from businesses b where b.id=expenses.business_id and b.user_id=auth.uid()));
drop policy if exists tenant_insights on ai_insights;
create policy tenant_insights on ai_insights for all using (exists(select 1 from businesses b where b.id=ai_insights.business_id and b.user_id=auth.uid())) with check (exists(select 1 from businesses b where b.id=ai_insights.business_id and b.user_id=auth.uid()));
