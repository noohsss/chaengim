revoke execute on function public.handle_new_user() from anon, authenticated;
revoke execute on function public.set_updated_at() from anon, authenticated;
revoke execute on function public.uuid_array_has_unique_values(uuid[]) from anon, authenticated;

drop policy "Anyone can view active policies" on public.policies;
drop policy "Users can view their saved inactive policies" on public.policies;

create policy "Anonymous users can view active policies"
on public.policies
for select
to anon
using (lifecycle_status = 'active');

create policy "Users can view active or saved policies"
on public.policies
for select
to authenticated
using (
  lifecycle_status = 'active'
  or exists (
    select 1
    from public.saved_policies
    where saved_policies.policy_id = policies.id
      and saved_policies.user_id = (select auth.uid())
  )
);
