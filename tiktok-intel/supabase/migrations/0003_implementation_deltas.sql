-- ============================================================
-- 0003 · Implementation deltas against the V1.6 schema contract
-- ============================================================
--
-- Every statement here is ADDITIVE. Nothing in 0001_initial_schema.sql is
-- redefined or dropped.
--
-- Each delta exists because an implemented contract requirement has no home in
-- the contracted schema. They are enumerated in CONTRACT_LOCK_REPORT.md and
-- require sign-off before release.
--
--   DELTA-001  GMV Max cost and attributed orders
--   DELTA-002  UUID defaults
--   DELTA-003  Background jobs
--   DELTA-004  Import mapping state and validation issues
--   DELTA-005  Idempotency keys
--   DELTA-006  AI explanations
--   DELTA-007  Import supersession ordering

create extension if not exists pgcrypto;

-- ── DELTA-001 · GMV Max cost and attributed orders ──────────────────────
-- contracts/gmvmax_roi.contract.md defines GMV Max ROI as GMV Max Gross
-- Revenue over GMV Max Cost, and gmvmax_cost_per_order.contract.md divides
-- that cost by attributed SKU orders. The contracted schema carries
-- gross_revenue but neither denominator, so GMVMAX-001 could otherwise only be
-- evaluated by substituting generic `spend` — exactly the substitution
-- 02_DATA/METRIC_SEMANTIC_GUARDRAILS.md prohibits.

alter table normalized_daily_metrics
  add column if not exists gmvmax_cost numeric(20,4) null check (gmvmax_cost >= 0),
  add column if not exists gmvmax_orders numeric(20,4) null check (gmvmax_orders >= 0);

comment on column normalized_daily_metrics.gmvmax_cost is
  'Product GMV Max campaign cost. GMV_MAX attribution. Never summed with `spend`.';
comment on column normalized_daily_metrics.gmvmax_orders is
  'SKU orders attributed to Product GMV Max, including attributed organic orders. Never summed with `orders`.';

-- ── DELTA-002 · UUID defaults ───────────────────────────────────────────
-- The contract declares `id uuid primary key` with no default and notes that
-- UUID generation may be adapted to the deployment.

alter table workspaces               alter column id set default gen_random_uuid();
alter table workspace_members        alter column id set default gen_random_uuid();
alter table shops                    alter column id set default gen_random_uuid();
alter table import_files             alter column id set default gen_random_uuid();
alter table mapping_templates        alter column id set default gen_random_uuid();
alter table imports                  alter column id set default gen_random_uuid();
alter table normalized_daily_metrics alter column id set default gen_random_uuid();
alter table normalized_product_metrics alter column id set default gen_random_uuid();
alter table business_events          alter column id set default gen_random_uuid();
alter table analyses                 alter column id set default gen_random_uuid();
alter table analysis_snapshots       alter column id set default gen_random_uuid();
alter table evidence                 alter column id set default gen_random_uuid();
alter table diagnoses                alter column id set default gen_random_uuid();
alter table recommendations          alter column id set default gen_random_uuid();
alter table experiments              alter column id set default gen_random_uuid();
alter table audit_logs               alter column id set default gen_random_uuid();

-- ── DELTA-003 · Background jobs ─────────────────────────────────────────
-- 04_TECHNICAL/BACKGROUND_JOBS.md specifies QUEUED → RUNNING →
-- SUCCEEDED/FAILED/CANCELLED, and openapi.v1.6.json returns a `job_id` from
-- POST /imports and POST /analyses. No jobs table exists in the contract.

create table if not exists jobs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  shop_id uuid null references shops(id) on delete cascade,
  job_type text not null check (job_type in ('IMPORT_VALIDATE','IMPORT_CONFIRM','ANALYSIS_RUN','AI_EXPLANATION')),
  status text not null check (status in ('QUEUED','RUNNING','SUCCEEDED','FAILED','CANCELLED')),
  entity_type text not null,
  entity_id uuid not null,
  attempts integer not null default 0,
  -- Import timeout 15 min, analysis timeout 10 min (FINAL_PRODUCTION_DECISIONS).
  timeout_seconds integer not null,
  checkpoint_json jsonb not null default '{}'::jsonb,
  error_json jsonb null,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  started_at timestamptz null,
  completed_at timestamptz null
);

create index if not exists idx_jobs_workspace_status on jobs(workspace_id, status, created_at desc);
create index if not exists idx_jobs_entity on jobs(entity_type, entity_id);

-- Concurrent imports per shop are capped at 2 (FINAL_PRODUCTION_DECISIONS).
-- A partial unique index cannot express "at most two", so the cap is enforced
-- by this helper inside the enqueue transaction.
create or replace function public.active_import_jobs(target_shop_id uuid)
returns integer
language sql
stable
as $$
  select count(*)::integer
  from public.jobs
  where shop_id = target_shop_id
    and job_type in ('IMPORT_VALIDATE','IMPORT_CONFIRM')
    and status in ('QUEUED','RUNNING');
$$;

-- ── DELTA-004 · Import mapping state and validation issues ──────────────
-- import_files.status includes MAPPING_REQUIRED but imports.status does not,
-- so an import awaiting mapping confirmation has no representable state.
-- 11_DESIGN/SCREEN_SPEC.md Screen 09 also requires rejected rows and warnings
-- to be displayed per import.

alter table imports drop constraint if exists imports_status_check;
alter table imports add constraint imports_status_check
  check (status in ('CREATED','MAPPING_REQUIRED','VALIDATING','READY','FAILED','CANCELLED'));

alter table imports
  add column if not exists mapping_state text null
    check (mapping_state in ('AUTO_MAPPED','USER_CONFIRMED','VALIDATED')),
  add column if not exists mapping_json jsonb not null default '{}'::jsonb,
  add column if not exists provenance_json jsonb not null default '{}'::jsonb;

create table if not exists import_validation_issues (
  id uuid primary key default gen_random_uuid(),
  import_id uuid not null references imports(id) on delete cascade,
  layer text not null,
  severity text not null check (severity in ('ERROR','WARNING')),
  row_number integer null,
  column_name text null,
  message text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_import_issues_import on import_validation_issues(import_id, severity);

-- ── DELTA-005 · Idempotency keys ────────────────────────────────────────
-- "Mutating POST requests: Idempotency-Key required unless explicitly exempted"
-- (01_PRODUCT/OPEN_DECISIONS.md, locked). Enforcing it needs storage.

create table if not exists idempotency_keys (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  idempotency_key text not null,
  endpoint text not null,
  request_hash text not null,
  response_status integer null,
  response_json jsonb null,
  created_at timestamptz not null default now(),
  unique(workspace_id, endpoint, idempotency_key)
);

create index if not exists idx_idempotency_created on idempotency_keys(created_at);

-- ── DELTA-006 · AI explanations ─────────────────────────────────────────
-- openapi.v1.6.json exposes POST /analyses/{id}/explanation and
-- 05_AI/AI_OUTPUT_SCHEMA.md fixes the payload, but no table stores it.
-- The explanation is deliberately separate from `diagnoses`: AI output must
-- never share a row with deterministic fields it is forbidden to alter.

create table if not exists analysis_explanations (
  id uuid primary key default gen_random_uuid(),
  analysis_snapshot_id uuid not null references analysis_snapshots(id) on delete cascade,
  ai_schema_version text not null,
  model text not null,
  -- Validated against AI_OUTPUT_SCHEMA before insert.
  output_json jsonb not null,
  input_token_count integer null,
  output_token_count integer null,
  cost_micros bigint null,
  -- Max 3 regenerations per analysis per 24h (FINAL_PRODUCTION_DECISIONS).
  generation_index integer not null default 1,
  fallback_used boolean not null default false,
  created_by uuid not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_explanation_snapshot
  on analysis_explanations(analysis_snapshot_id, created_at desc);

-- ── DELTA-007 · Import supersession ordering ────────────────────────────
-- normalized_daily_metrics is unique on (shop_id, business_date,
-- source_import_id), so re-importing a date leaves two rows and the contract
-- does not say which wins. The engine reads the row from the most recent READY
-- import for that date; this index makes that resolution efficient and the
-- choice explicit.

create index if not exists idx_daily_shop_date_import
  on normalized_daily_metrics(shop_id, business_date, source_import_id);
create index if not exists idx_product_shop_key_date
  on normalized_product_metrics(shop_id, product_key, business_date);
create index if not exists idx_imports_shop_status_completed
  on imports(shop_id, status, completed_at desc);
create index if not exists idx_events_shop_window
  on business_events(shop_id, start_at, end_at);

-- ── RLS for new tables ──────────────────────────────────────────────────
-- Mirrors the membership model of 0002_rls.sql. Every tenant-owned table
-- resolves authorization through workspace membership.

alter table jobs enable row level security;
alter table import_validation_issues enable row level security;
alter table idempotency_keys enable row level security;
alter table analysis_explanations enable row level security;

drop policy if exists jobs_member on jobs;
create policy jobs_member on jobs
for select using (public.is_workspace_member(workspace_id));

drop policy if exists import_validation_issues_member on import_validation_issues;
create policy import_validation_issues_member on import_validation_issues
for select using (
  exists (
    select 1 from public.imports i
    where i.id = import_validation_issues.import_id
      and public.is_workspace_member(i.workspace_id)
  )
);

-- Idempotency records are server-side bookkeeping. No browser client reads
-- them, so no permissive policy is granted; RLS on with no SELECT policy
-- denies all end-user access while the service role continues to work.

drop policy if exists analysis_explanations_member on analysis_explanations;
create policy analysis_explanations_member on analysis_explanations
for select using (
  exists (
    select 1
    from public.analysis_snapshots s
    join public.analyses a on a.id = s.analysis_id
    where s.id = analysis_explanations.analysis_snapshot_id
      and public.is_workspace_member(a.workspace_id)
  )
);

-- ── Workspace bootstrap ─────────────────────────────────────────────────
-- 0002_rls.sql grants no INSERT policy on workspaces, so a signed-in user
-- cannot create their first workspace and the onboarding flow in
-- 11_DESIGN/SCREEN_SPEC.md (Screen 01) cannot start. This function creates a
-- workspace and its owner membership atomically, under the caller's identity.

create or replace function public.create_workspace(workspace_name text, workspace_timezone text default 'Asia/Kuala_Lumpur')
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
  caller uuid := auth.uid();
begin
  if caller is null then
    raise exception 'Authentication required';
  end if;
  if workspace_name is null or length(trim(workspace_name)) = 0 then
    raise exception 'Workspace name is required';
  end if;

  insert into public.workspaces (name, timezone)
  values (trim(workspace_name), workspace_timezone)
  returning id into new_id;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (new_id, caller, 'OWNER');

  insert into public.audit_logs (workspace_id, actor_user_id, action, entity_type, entity_id, result)
  values (new_id, caller, 'WORKSPACE_CREATED', 'workspace', new_id, 'SUCCESS');

  return new_id;
end;
$$;

revoke all on function public.create_workspace(text, text) from public;
grant execute on function public.create_workspace(text, text) to authenticated;
