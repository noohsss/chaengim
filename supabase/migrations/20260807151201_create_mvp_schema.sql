create extension if not exists pg_trgm with schema extensions;

-- Remove enum types left behind by the discarded schema. Restrict is intentional:
-- the migration must fail instead of cascading into an unexpected dependency.
drop type if exists public.delivery_status;
drop type if exists public.merge_method;
drop type if exists public.policy_source_type;
drop type if exists public.region_level;
drop type if exists public.sync_status;
drop type if exists public.email_status;
drop type if exists public.notification_type;
drop type if exists public.ai_result_type;
drop type if exists public.application_outcome;
drop type if exists public.policy_priority;
drop type if exists public.saved_policy_status;
drop type if exists public.policy_lifecycle_status;
drop type if exists public.policy_category;
drop type if exists public.employment_status;

create type public.employment_status as enum (
  'employed',
  'job_seeking',
  'unemployed',
  'student',
  'self_employed',
  'other'
);

create type public.policy_category as enum (
  'jobs_startup',
  'housing',
  'education',
  'finance',
  'welfare_culture',
  'participation_rights',
  'other'
);

create type public.policy_lifecycle_status as enum (
  'active',
  'inactive',
  'archived'
);

create type public.saved_policy_status as enum (
  'interested',
  'reviewing',
  'planning_to_apply',
  'applied',
  'result_recorded'
);

create type public.policy_priority as enum ('low', 'normal', 'high');

create type public.application_outcome as enum (
  'selected',
  'rejected',
  'waitlisted',
  'cancelled'
);

create type public.ai_result_type as enum ('analysis', 'comparison');

create type public.notification_type as enum (
  'deadline_7_days',
  'deadline_1_day',
  'policy_changed'
);

create type public.email_status as enum (
  'pending',
  'sent',
  'failed',
  'skipped'
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  birth_year smallint,
  region_code text,
  employment_status public.employment_status,
  notification_email text,
  notification_email_verified_at timestamptz,
  email_opt_in boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_birth_year_check check (
    birth_year is null
    or birth_year between 1900 and extract(year from current_date)::smallint
  ),
  constraint profiles_notification_email_normalized_check check (
    notification_email is null
    or notification_email = lower(btrim(notification_email))
  ),
  constraint profiles_verified_email_check check (
    notification_email_verified_at is null or notification_email is not null
  ),
  constraint profiles_email_opt_in_check check (
    not email_opt_in
    or (
      notification_email is not null
      and notification_email_verified_at is not null
    )
  )
);

create table public.policies (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text,
  support_content text,
  eligibility text,
  application_start_date date,
  application_end_date date,
  application_period_text text,
  is_rolling boolean not null default false,
  application_method text,
  application_url text,
  organization_name text,
  contact text,
  category public.policy_category not null default 'other',
  region_codes text[] not null default array['00']::text[],
  sources text[] not null,
  source_refs jsonb not null,
  lifecycle_status public.policy_lifecycle_status not null default 'active',
  version_hash text not null,
  last_synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search_vector tsvector generated always as (
    setweight(to_tsvector('simple'::regconfig, coalesce(title, '')), 'A')
    || setweight(to_tsvector('simple'::regconfig, coalesce(organization_name, '')), 'B')
    || setweight(to_tsvector('simple'::regconfig, coalesce(summary, '')), 'C')
    || setweight(to_tsvector('simple'::regconfig, coalesce(support_content, '')), 'D')
  ) stored,
  constraint policies_title_length_check check (char_length(title) between 1 and 300),
  constraint policies_application_dates_check check (
    application_start_date is null
    or application_end_date is null
    or application_end_date >= application_start_date
  ),
  constraint policies_application_url_check check (
    application_url is null or application_url ~* '^https?://[^[:space:]]+$'
  ),
  constraint policies_region_codes_check check (
    cardinality(region_codes) > 0 and array_position(region_codes, null) is null
  ),
  constraint policies_sources_check check (
    sources = array['youth_center']::text[]
    or sources = array['gov24']::text[]
    or sources = array['youth_center', 'gov24']::text[]
  ),
  constraint policies_source_refs_object_check check (
    jsonb_typeof(source_refs) = 'object'
    and source_refs - array['youth_center', 'gov24']::text[] = '{}'::jsonb
  ),
  constraint policies_source_refs_match_sources_check check (
    ('youth_center' = any(sources)) = (source_refs ? 'youth_center')
    and ('gov24' = any(sources)) = (source_refs ? 'gov24')
  ),
  constraint policies_youth_center_ref_check check (
    not (source_refs ? 'youth_center')
    or (
      jsonb_typeof(source_refs -> 'youth_center') = 'object'
      and jsonb_typeof(source_refs #> '{youth_center,externalId}') = 'string'
      and nullif(btrim(source_refs #>> '{youth_center,externalId}'), '') is not null
      and (
        not ((source_refs -> 'youth_center') ? 'url')
        or (
          jsonb_typeof(source_refs #> '{youth_center,url}') = 'string'
          and (source_refs #>> '{youth_center,url}') ~* '^https?://[^[:space:]]+$'
        )
      )
    )
  ),
  constraint policies_gov24_ref_check check (
    not (source_refs ? 'gov24')
    or (
      jsonb_typeof(source_refs -> 'gov24') = 'object'
      and jsonb_typeof(source_refs #> '{gov24,externalId}') = 'string'
      and nullif(btrim(source_refs #>> '{gov24,externalId}'), '') is not null
      and (
        not ((source_refs -> 'gov24') ? 'url')
        or (
          jsonb_typeof(source_refs #> '{gov24,url}') = 'string'
          and (source_refs #>> '{gov24,url}') ~* '^https?://[^[:space:]]+$'
        )
      )
    )
  )
);

create table public.saved_policies (
  user_id uuid not null references auth.users (id) on delete cascade,
  policy_id uuid not null references public.policies (id) on delete restrict,
  status public.saved_policy_status not null default 'interested',
  priority public.policy_priority not null default 'normal',
  memo text,
  outcome public.application_outcome,
  result_date date,
  result_memo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, policy_id),
  constraint saved_policies_memo_length_check check (
    memo is null or char_length(memo) <= 5000
  ),
  constraint saved_policies_result_memo_length_check check (
    result_memo is null or char_length(result_memo) <= 5000
  ),
  constraint saved_policies_result_state_check check (
    (
      status = 'result_recorded'
      and outcome is not null
    )
    or (
      status <> 'result_recorded'
      and outcome is null
      and result_date is null
      and result_memo is null
    )
  )
);

create function public.uuid_array_has_unique_values(values_to_check uuid[])
returns boolean
language sql
immutable
parallel safe
set search_path = ''
as $$
  select
    array_position(values_to_check, null) is null
    and cardinality(values_to_check) = (
      select count(distinct item)::integer
      from unnest(values_to_check) as item
    );
$$;

create table public.ai_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  result_type public.ai_result_type not null,
  policy_ids uuid[] not null,
  input_hash text not null,
  model_name text not null,
  result jsonb not null,
  created_at timestamptz not null default now(),
  constraint ai_results_policy_ids_unique_check check (
    public.uuid_array_has_unique_values(policy_ids)
  ),
  constraint ai_results_policy_count_check check (
    (result_type = 'analysis' and cardinality(policy_ids) >= 1)
    or (result_type = 'comparison' and cardinality(policy_ids) between 2 and 3)
  ),
  constraint ai_results_input_hash_check check (nullif(btrim(input_hash), '') is not null),
  constraint ai_results_model_name_check check (nullif(btrim(model_name), '') is not null),
  constraint ai_results_result_object_check check (jsonb_typeof(result) = 'object'),
  unique (user_id, result_type, input_hash)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  policy_id uuid references public.policies (id) on delete set null,
  type public.notification_type not null,
  event_key text not null,
  title text not null,
  body text not null,
  reference_date date,
  read_at timestamptz,
  email_status public.email_status not null default 'skipped',
  email_sent_at timestamptz,
  email_error text,
  created_at timestamptz not null default now(),
  constraint notifications_event_key_length_check check (
    char_length(event_key) between 1 and 300
  ),
  constraint notifications_title_check check (nullif(btrim(title), '') is not null),
  constraint notifications_body_check check (nullif(btrim(body), '') is not null),
  constraint notifications_sent_email_check check (
    email_status <> 'sent' or email_sent_at is not null
  ),
  unique (user_id, event_key)
);

create unique index policies_youth_center_external_id_key
  on public.policies ((source_refs #>> '{youth_center,externalId}'))
  where source_refs ? 'youth_center';

create unique index policies_gov24_external_id_key
  on public.policies ((source_refs #>> '{gov24,externalId}'))
  where source_refs ? 'gov24';

create index policies_search_vector_idx
  on public.policies using gin (search_vector);

create index policies_title_trgm_idx
  on public.policies using gin (title extensions.gin_trgm_ops);

create index policies_region_codes_idx
  on public.policies using gin (region_codes);

create index policies_lifecycle_end_date_idx
  on public.policies (lifecycle_status, application_end_date);

create index policies_category_lifecycle_end_date_idx
  on public.policies (category, lifecycle_status, application_end_date);

create index saved_policies_user_updated_at_idx
  on public.saved_policies (user_id, updated_at desc);

create index saved_policies_policy_id_idx
  on public.saved_policies (policy_id);

create index ai_results_user_type_created_at_idx
  on public.ai_results (user_id, result_type, created_at desc);

create index notifications_user_created_at_idx
  on public.notifications (user_id, created_at desc);

create index notifications_user_unread_idx
  on public.notifications (user_id, created_at desc)
  where read_at is null;

create index notifications_policy_id_idx
  on public.notifications (policy_id);

create index notifications_email_retry_idx
  on public.notifications (email_status, created_at)
  where email_status in ('pending', 'failed');

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger policies_set_updated_at
before update on public.policies
for each row execute function public.set_updated_at();

create trigger saved_policies_set_updated_at
before update on public.saved_policies
for each row execute function public.set_updated_at();

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (
    id,
    notification_email,
    notification_email_verified_at
  )
  values (
    new.id,
    nullif(lower(btrim(new.email)), ''),
    case
      when nullif(btrim(new.email), '') is not null then new.email_confirmed_at
      else null
    end
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.policies enable row level security;
alter table public.saved_policies enable row level security;
alter table public.ai_results enable row level security;
alter table public.notifications enable row level security;

create policy "Users can view their own profile"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "Anyone can view active policies"
on public.policies
for select
to anon, authenticated
using (lifecycle_status = 'active');

create policy "Users can view their saved inactive policies"
on public.policies
for select
to authenticated
using (
  exists (
    select 1
    from public.saved_policies
    where saved_policies.policy_id = policies.id
      and saved_policies.user_id = (select auth.uid())
  )
);

create policy "Users can view their saved policies"
on public.saved_policies
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can save policies"
on public.saved_policies
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their saved policies"
on public.saved_policies
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their saved policies"
on public.saved_policies
for delete
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can view their AI results"
on public.ai_results
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can view their notifications"
on public.notifications
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can mark their notifications as read"
on public.notifications
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

revoke all on table public.profiles from anon, authenticated;
revoke all on table public.policies from anon, authenticated;
revoke all on table public.saved_policies from anon, authenticated;
revoke all on table public.ai_results from anon, authenticated;
revoke all on table public.notifications from anon, authenticated;

grant select on table public.policies to anon;

grant select on table public.profiles to authenticated;
grant update (
  birth_year,
  region_code,
  employment_status,
  notification_email,
  email_opt_in
) on table public.profiles to authenticated;

grant select on table public.policies to authenticated;

grant select, delete on table public.saved_policies to authenticated;
grant insert (
  user_id,
  policy_id,
  status,
  priority,
  memo,
  outcome,
  result_date,
  result_memo
) on table public.saved_policies to authenticated;
grant update (
  status,
  priority,
  memo,
  outcome,
  result_date,
  result_memo
) on table public.saved_policies to authenticated;

grant select on table public.ai_results to authenticated;

grant select on table public.notifications to authenticated;
grant update (read_at) on table public.notifications to authenticated;

grant all on table public.profiles to service_role;
grant all on table public.policies to service_role;
grant all on table public.saved_policies to service_role;
grant all on table public.ai_results to service_role;
grant all on table public.notifications to service_role;

revoke all on function public.uuid_array_has_unique_values(uuid[]) from public;
revoke all on function public.set_updated_at() from public;
revoke all on function public.handle_new_user() from public;
grant execute on function public.uuid_array_has_unique_values(uuid[]) to service_role;

revoke usage on type public.employment_status from public;
revoke usage on type public.policy_category from public;
revoke usage on type public.policy_lifecycle_status from public;
revoke usage on type public.saved_policy_status from public;
revoke usage on type public.policy_priority from public;
revoke usage on type public.application_outcome from public;
revoke usage on type public.ai_result_type from public;
revoke usage on type public.notification_type from public;
revoke usage on type public.email_status from public;

grant usage on type public.policy_category to anon;
grant usage on type public.policy_lifecycle_status to anon;

grant usage on type public.employment_status to authenticated;
grant usage on type public.policy_category to authenticated;
grant usage on type public.policy_lifecycle_status to authenticated;
grant usage on type public.saved_policy_status to authenticated;
grant usage on type public.policy_priority to authenticated;
grant usage on type public.application_outcome to authenticated;
grant usage on type public.ai_result_type to authenticated;
grant usage on type public.notification_type to authenticated;
grant usage on type public.email_status to authenticated;

grant usage on type public.employment_status to service_role;
grant usage on type public.policy_category to service_role;
grant usage on type public.policy_lifecycle_status to service_role;
grant usage on type public.saved_policy_status to service_role;
grant usage on type public.policy_priority to service_role;
grant usage on type public.application_outcome to service_role;
grant usage on type public.ai_result_type to service_role;
grant usage on type public.notification_type to service_role;
grant usage on type public.email_status to service_role;
