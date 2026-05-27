create index concurrently if not exists users_created_at_idx on users(created_at desc);
create index concurrently if not exists waitlist_entries_created_at_idx on waitlist_entries(created_at desc);
create index concurrently if not exists probes_created_at_idx on probes(created_at desc);
create index concurrently if not exists probes_status_created_at_idx on probes(status, created_at asc);
