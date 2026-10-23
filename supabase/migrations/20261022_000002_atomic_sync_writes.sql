-- Force document writes through a compare-and-swap RPC so a stale device
-- cannot silently overwrite a newer cloud revision.

create or replace function public.apex_write_sync_document(
  p_collection text,
  p_entity_id text,
  p_payload jsonb,
  p_expected_version bigint,
  p_device_id text default null,
  p_deleted_at timestamptz default null
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_current_version bigint;
  v_next_version bigint;
begin
  if v_user_id is null then
    raise exception 'apex_auth_required' using errcode = '42501';
  end if;

  if p_collection not in (
    'profile', 'exercise', 'routine', 'session', 'measurement', 'note',
    'nutrition', 'place', 'progress_shot', 'setting'
  ) then
    raise exception 'apex_invalid_collection' using errcode = '22023';
  end if;

  if p_entity_id is null or char_length(p_entity_id) not between 1 and 160 then
    raise exception 'apex_invalid_entity_id' using errcode = '22023';
  end if;

  select version
    into v_current_version
    from public.sync_documents
   where user_id = v_user_id
     and collection = p_collection
     and entity_id = p_entity_id
   for update;

  if not found then
    if coalesce(p_expected_version, 0) <> 0 then
      raise exception 'apex_sync_conflict' using errcode = '40001';
    end if;

    insert into public.sync_documents (
      user_id, collection, entity_id, payload, version, device_id, deleted_at
    ) values (
      v_user_id, p_collection, p_entity_id, coalesce(p_payload, '{}'::jsonb),
      1, p_device_id, p_deleted_at
    );
    return 1;
  end if;

  if p_expected_version is null or p_expected_version <> v_current_version then
    raise exception 'apex_sync_conflict' using errcode = '40001';
  end if;

  v_next_version := v_current_version + 1;
  update public.sync_documents
     set payload = coalesce(p_payload, '{}'::jsonb),
         version = v_next_version,
         device_id = p_device_id,
         deleted_at = p_deleted_at
   where user_id = v_user_id
     and collection = p_collection
     and entity_id = p_entity_id;

  return v_next_version;
end;
$$;

revoke all on function public.apex_write_sync_document(text, text, jsonb, bigint, text, timestamptz) from public;
grant execute on function public.apex_write_sync_document(text, text, jsonb, bigint, text, timestamptz) to authenticated;

drop policy if exists "users manage only their private sync documents" on public.sync_documents;
create policy "users read only their private sync documents"
on public.sync_documents for select to authenticated
using (user_id = auth.uid());
create policy "users delete only their private sync documents"
on public.sync_documents for delete to authenticated
using (user_id = auth.uid());
