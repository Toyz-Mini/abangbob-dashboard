
-- ============================================================
-- V1.6 RLS CONTRACT / EXECUTABLE MIGRATION
-- ============================================================

-- Helper: membership check. Uses auth.uid() and the workspace_members table.
create or replace function public.is_workspace_member(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = target_workspace_id
      and wm.user_id = auth.uid()
  );
$$;

create or replace function public.is_workspace_admin(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.workspace_members wm
    where wm.workspace_id = target_workspace_id
      and wm.user_id = auth.uid()
      and wm.role in ('OWNER','ADMIN')
  );
$$;

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.shops enable row level security;
alter table public.import_files enable row level security;
alter table public.mapping_templates enable row level security;
alter table public.imports enable row level security;
alter table public.normalized_daily_metrics enable row level security;
alter table public.normalized_product_metrics enable row level security;
alter table public.business_events enable row level security;
alter table public.analyses enable row level security;
alter table public.analysis_snapshots enable row level security;
alter table public.evidence enable row level security;
alter table public.diagnoses enable row level security;
alter table public.recommendations enable row level security;
alter table public.experiments enable row level security;
alter table public.audit_logs enable row level security;

-- Workspace
create policy workspaces_select_member on public.workspaces
for select using (public.is_workspace_member(id));

create policy workspaces_update_admin on public.workspaces
for update using (public.is_workspace_admin(id))
with check (public.is_workspace_admin(id));

-- Membership
create policy workspace_members_select_member on public.workspace_members
for select using (public.is_workspace_member(workspace_id));

create policy workspace_members_manage_admin on public.workspace_members
for all using (public.is_workspace_admin(workspace_id))
with check (public.is_workspace_admin(workspace_id));

-- Shop
create policy shops_select_member on public.shops
for select using (public.is_workspace_member(workspace_id));

create policy shops_insert_admin on public.shops
for insert with check (public.is_workspace_admin(workspace_id));

create policy shops_update_admin on public.shops
for update using (public.is_workspace_admin(workspace_id))
with check (public.is_workspace_admin(workspace_id));

create policy shops_delete_admin on public.shops
for delete using (public.is_workspace_admin(workspace_id));

-- Generic workspace-owned tables
create policy import_files_member on public.import_files
for all using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

create policy mapping_templates_member on public.mapping_templates
for all using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

create policy imports_member on public.imports
for all using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

create policy normalized_daily_metrics_member on public.normalized_daily_metrics
for select using (public.is_workspace_member(workspace_id));

create policy normalized_product_metrics_member on public.normalized_product_metrics
for select using (public.is_workspace_member(workspace_id));

create policy business_events_member on public.business_events
for all using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

create policy analyses_member on public.analyses
for all using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

create policy analysis_snapshots_member on public.analysis_snapshots
for select using (
  exists (
    select 1 from public.analyses a
    where a.id = analysis_snapshots.analysis_id
      and public.is_workspace_member(a.workspace_id)
  )
);

create policy evidence_member on public.evidence
for select using (
  exists (
    select 1
    from public.analysis_snapshots s
    join public.analyses a on a.id = s.analysis_id
    where s.id = evidence.analysis_snapshot_id
      and public.is_workspace_member(a.workspace_id)
  )
);

create policy diagnoses_member on public.diagnoses
for select using (
  exists (
    select 1
    from public.analysis_snapshots s
    join public.analyses a on a.id = s.analysis_id
    where s.id = diagnoses.analysis_snapshot_id
      and public.is_workspace_member(a.workspace_id)
  )
);

create policy recommendations_member on public.recommendations
for select using (
  exists (
    select 1
    from public.diagnoses d
    join public.analysis_snapshots s on s.id = d.analysis_snapshot_id
    join public.analyses a on a.id = s.analysis_id
    where d.id = recommendations.diagnosis_id
      and public.is_workspace_member(a.workspace_id)
  )
);

create policy experiments_member on public.experiments
for all using (public.is_workspace_member(workspace_id))
with check (public.is_workspace_member(workspace_id));

create policy audit_logs_member on public.audit_logs
for select using (
  workspace_id is null
  or public.is_workspace_member(workspace_id)
);

-- NOTE:
-- Service-role/server-only operations intentionally run outside end-user RLS
-- and MUST never expose service-role credentials to the browser.
