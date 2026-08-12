-- TikTok Shop Intelligence V1.4
-- PostgreSQL/Supabase implementation contract.
-- UUID generation extension/function may be adapted to deployment.

create table workspaces (
  id uuid primary key,
  name text not null,
  timezone text not null default 'Asia/Kuala_Lumpur',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz null
);

create table workspace_members (
  id uuid primary key,
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id uuid not null,
  role text not null check (role in ('OWNER','ADMIN','MARKETER','VIEWER')),
  created_at timestamptz not null default now(),
  unique(workspace_id, user_id)
);

create table shops (
  id uuid primary key,
  workspace_id uuid not null references workspaces(id) on delete cascade,
  name text not null,
  platform text not null default 'TIKTOK_SHOP',
  currency text not null default 'MYR',
  timezone text not null default 'Asia/Kuala_Lumpur',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz null
);

create table import_files (
  id uuid primary key,
  workspace_id uuid not null references workspaces(id) on delete cascade,
  shop_id uuid not null references shops(id) on delete cascade,
  storage_key text not null unique,
  original_filename text not null,
  file_type text not null check (file_type in ('CSV','XLSX')),
  size_bytes bigint not null check (size_bytes > 0),
  sha256 text not null,
  status text not null check (status in ('UPLOADED','QUARANTINED','SCANNING','PARSING','MAPPING_REQUIRED','VALIDATING','READY','FAILED','DELETED')),
  created_by uuid not null,
  created_at timestamptz not null default now(),
  deleted_at timestamptz null,
  unique(shop_id, sha256)
);

create table mapping_templates (
  id uuid primary key,
  workspace_id uuid not null references workspaces(id) on delete cascade,
  shop_id uuid not null references shops(id) on delete cascade,
  source_id text not null,
  source_schema_version text not null,
  name text not null,
  mapping_json jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(shop_id, source_id, source_schema_version, name)
);

create table imports (
  id uuid primary key,
  workspace_id uuid not null references workspaces(id) on delete cascade,
  shop_id uuid not null references shops(id) on delete cascade,
  import_file_id uuid not null references import_files(id),
  source_id text not null,
  source_schema_version text not null,
  mapping_template_id uuid null references mapping_templates(id),
  status text not null check (status in ('CREATED','VALIDATING','READY','FAILED','CANCELLED')),
  validation_summary jsonb not null default '{}'::jsonb,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  completed_at timestamptz null
);

create table normalized_daily_metrics (
  id uuid primary key,
  workspace_id uuid not null references workspaces(id) on delete cascade,
  shop_id uuid not null references shops(id) on delete cascade,
  business_date date not null,
  currency text not null,
  traffic numeric(20,4) not null default 0 check (traffic >= 0),
  product_views numeric(20,4) not null default 0 check (product_views >= 0),
  add_to_cart numeric(20,4) not null default 0 check (add_to_cart >= 0),
  checkout numeric(20,4) not null default 0 check (checkout >= 0),
  orders numeric(20,4) not null default 0 check (orders >= 0),
  gmv numeric(20,4) not null default 0 check (gmv >= 0),
  spend numeric(20,4) not null default 0 check (spend >= 0),
  gross_revenue numeric(20,4) null check (gross_revenue >= 0),
  paid_gmv numeric(20,4) null check (paid_gmv >= 0),
  organic_gmv numeric(20,4) null check (organic_gmv >= 0),
  live_gmv numeric(20,4) null check (live_gmv >= 0),
  affiliate_gmv numeric(20,4) null check (affiliate_gmv >= 0),
  source_import_id uuid not null references imports(id),
  metric_version text not null,
  created_at timestamptz not null default now(),
  unique(shop_id, business_date, source_import_id)
);

create table normalized_product_metrics (
  id uuid primary key,
  workspace_id uuid not null references workspaces(id) on delete cascade,
  shop_id uuid not null references shops(id) on delete cascade,
  product_key text not null,
  business_date date not null,
  currency text not null,
  product_views numeric(20,4) null check (product_views >= 0),
  add_to_cart numeric(20,4) null check (add_to_cart >= 0),
  orders numeric(20,4) null check (orders >= 0),
  gmv numeric(20,4) null check (gmv >= 0),
  spend numeric(20,4) null check (spend >= 0),
  source_import_id uuid not null references imports(id),
  metric_version text not null,
  created_at timestamptz not null default now(),
  unique(shop_id, product_key, business_date, source_import_id)
);

create table business_events (
  id uuid primary key,
  workspace_id uuid not null references workspaces(id) on delete cascade,
  shop_id uuid not null references shops(id) on delete cascade,
  event_type text not null,
  name text not null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  scope_json jsonb not null default '{}'::jsonb,
  notes text null,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  check (end_at > start_at)
);

create table analyses (
  id uuid primary key,
  workspace_id uuid not null references workspaces(id) on delete cascade,
  shop_id uuid not null references shops(id) on delete cascade,
  status text not null check (status in ('CREATED','PREPARING','RUNNING','READY','FAILED')),
  period_start date not null,
  period_end date not null,
  comparison_start date null,
  comparison_end date null,
  comparison_type text null,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  completed_at timestamptz null,
  check (period_end >= period_start)
);

create table analysis_snapshots (
  id uuid primary key,
  analysis_id uuid not null unique references analyses(id) on delete cascade,
  source_import_ids jsonb not null,
  metric_version text not null,
  diagnostic_engine_version text not null,
  rule_set_version text not null,
  ai_schema_version text null,
  baseline_json jsonb not null,
  normalized_data_hash text not null,
  created_at timestamptz not null default now()
);

create table evidence (
  id uuid primary key,
  analysis_snapshot_id uuid not null references analysis_snapshots(id) on delete cascade,
  rule_id text not null,
  metric_name text not null,
  current_value numeric(30,10) null,
  baseline_value numeric(30,10) null,
  change_pct numeric(30,10) null,
  threshold numeric(30,10) null,
  evidence_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table diagnoses (
  id uuid primary key,
  analysis_snapshot_id uuid not null references analysis_snapshots(id) on delete cascade,
  status text not null check (status in ('HEALTHY','PROBLEM_DETECTED','INSUFFICIENT_EVIDENCE','DATA_INVALID','ANOMALY')),
  rule_id text null,
  severity text null check (severity in ('LOW','MEDIUM','HIGH','CRITICAL')),
  confidence_score numeric(6,5) null check (confidence_score >= 0 and confidence_score <= 1),
  priority_score numeric(6,5) null check (priority_score >= 0 and priority_score <= 1),
  observation text not null,
  diagnosis text null,
  hypothesis text null,
  dont_touch text null,
  monitor_json jsonb not null default '{}'::jsonb,
  limitations_json jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table recommendations (
  id uuid primary key,
  diagnosis_id uuid not null references diagnoses(id) on delete cascade,
  action_id text not null,
  action_text text not null,
  effort text not null check (effort in ('LOW','MEDIUM','HIGH')),
  risk text not null check (risk in ('LOW','MEDIUM','HIGH')),
  expected_direction text null,
  prerequisites_json jsonb not null default '[]'::jsonb,
  success_criteria_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table experiments (
  id uuid primary key,
  workspace_id uuid not null references workspaces(id) on delete cascade,
  shop_id uuid not null references shops(id) on delete cascade,
  diagnosis_id uuid null references diagnoses(id),
  status text not null check (status in ('DRAFT','PLANNED','RUNNING','COMPLETED','CANCELLED')),
  hypothesis text not null,
  control_json jsonb not null,
  variant_json jsonb not null,
  target_metric text not null,
  success_threshold numeric(30,10) null,
  observation_start date null,
  observation_end date null,
  result_json jsonb null,
  created_by uuid not null,
  created_at timestamptz not null default now()
);

create table audit_logs (
  id uuid primary key,
  workspace_id uuid null references workspaces(id) on delete set null,
  actor_user_id uuid null,
  action text not null,
  entity_type text not null,
  entity_id uuid null,
  result text not null,
  request_id text null,
  metadata_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_shops_workspace on shops(workspace_id);
create index idx_imports_shop_created on imports(shop_id, created_at desc);
create index idx_daily_shop_date on normalized_daily_metrics(shop_id, business_date);
create index idx_product_shop_date on normalized_product_metrics(shop_id, business_date);
create index idx_analysis_shop_created on analyses(shop_id, created_at desc);
create index idx_snapshot_analysis on analysis_snapshots(analysis_id);
create index idx_diagnosis_snapshot on diagnoses(analysis_snapshot_id);
create index idx_audit_workspace_created on audit_logs(workspace_id, created_at desc);
