drop index if exists public.policies_gov24_external_id_key;

alter table public.policies
  drop constraint policies_sources_check,
  drop constraint policies_source_refs_object_check,
  drop constraint policies_source_refs_match_sources_check,
  drop constraint policies_gov24_ref_check;

alter table public.policies
  add constraint policies_sources_check check (
    sources = array['youth_center']::text[]
  ),
  add constraint policies_source_refs_object_check check (
    jsonb_typeof(source_refs) = 'object'
    and source_refs - array['youth_center']::text[] = '{}'::jsonb
  ),
  add constraint policies_source_refs_match_sources_check check (
    ('youth_center' = any(sources)) = (source_refs ? 'youth_center')
  );
