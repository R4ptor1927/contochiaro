-- Private, append-only indicative snapshots, never authoritative tax records.
create policy owner_snapshot_insert on public.tax_estimates for insert to authenticated with check ((select auth.uid())=user_id);
grant insert on public.tax_estimates to authenticated;
