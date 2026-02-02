# Supabase DB Schema

- Generated: 2026-02-02 15:43
- Source: supabase gen types

## Schema: `__InternalSupabase`

### Enums

- (none)

### Tables

- (none)

## Schema: `graphql_public`

### Enums

- (none)

### Tables

- (none)

## Schema: `public`

### Enums

- `log_source`: `MANUAL`, `TIMER`
- `material_type`: `COLUMN`, `PDF`
- `subject_type`: `KOR`, `ENG`, `MATH`, `ETC`
- `task_status`: `TODO`, `WORKING`, `DONE`
- `user_role`: `MENTOR`, `MENTEE`

### Tables

#### `public.calendar_events`

- Primary key (inferred): `id`
- Columns: 10
- Foreign keys: 2

| Column | Type | Nullable |
|---|---|---|
| `created_at` | `text` | NO |
| `created_by` | `number` | NO |
| `description` | `text` | YES |
| `end_date` | `text` | YES |
| `id` | `number` | NO |
| `mentee_id` | `number` | NO |
| `start_date` | `text` | NO |
| `subject` | `enum:subject_type` | YES |
| `title` | `text` | NO |
| `updated_at` | `text` | NO |

##### Relationships

| FK name | Columns | Ref table | Ref columns | One-to-one |
|---|---|---|---|---|
| `calendar_events_created_by_fkey` | `created_by` | `users` | `id` | NO |
| `calendar_events_mentee_id_fkey` | `mentee_id` | `users` | `id` | NO |

#### `public.daily_planner`

- Primary key (inferred): `id`
- Columns: 6
- Foreign keys: 1

| Column | Type | Nullable |
|---|---|---|
| `created_at` | `text` | NO |
| `date` | `text` | NO |
| `header_note` | `text` | YES |
| `id` | `number` | NO |
| `mentee_id` | `number` | NO |
| `updated_at` | `text` | NO |

##### Relationships

| FK name | Columns | Ref table | Ref columns | One-to-one |
|---|---|---|---|---|
| `daily_planner_mentee_id_fkey` | `mentee_id` | `users` | `id` | NO |

#### `public.feedbacks`

- Primary key (inferred): `id`
- Columns: 10
- Foreign keys: 2

| Column | Type | Nullable |
|---|---|---|
| `body` | `text` | YES |
| `created_at` | `text` | NO |
| `date` | `text` | NO |
| `id` | `number` | NO |
| `mentee_id` | `number` | NO |
| `mentor_id` | `number` | NO |
| `overall_comment` | `text` | YES |
| `subject` | `enum:subject_type` | NO |
| `summary` | `text` | YES |
| `updated_at` | `text` | NO |

##### Relationships

| FK name | Columns | Ref table | Ref columns | One-to-one |
|---|---|---|---|---|
| `feedbacks_mentee_id_fkey` | `mentee_id` | `users` | `id` | NO |
| `feedbacks_mentor_id_fkey` | `mentor_id` | `users` | `id` | NO |

#### `public.notifications`

- Primary key (inferred): `id`
- Columns: 9
- Foreign keys: 1

| Column | Type | Nullable |
|---|---|---|
| `body` | `text` | NO |
| `created_at` | `text` | NO |
| `id` | `number` | NO |
| `is_read` | `boolean` | NO |
| `payload_json` | `jsonb` | YES |
| `sent_at` | `text` | YES |
| `title` | `text` | NO |
| `type` | `text` | NO |
| `user_id` | `number` | NO |

##### Relationships

| FK name | Columns | Ref table | Ref columns | One-to-one |
|---|---|---|---|---|
| `notifications_user_id_fkey` | `user_id` | `users` | `id` | NO |

#### `public.subjects`

- Primary key (inferred): `id`
- Columns: 2
- Foreign keys: 0

| Column | Type | Nullable |
|---|---|---|
| `id` | `number` | NO |
| `subject` | `text` | NO |

#### `public.task_materials`

- Primary key (inferred): `id`
- Columns: 8
- Foreign keys: 2

| Column | Type | Nullable |
|---|---|---|
| `content` | `text` | YES |
| `created_at` | `text` | NO |
| `file_url` | `text` | YES |
| `id` | `number` | NO |
| `task_id` | `number` | NO |
| `title` | `text` | YES |
| `type` | `enum:material_type` | NO |
| `uploaded_by` | `number` | NO |

##### Relationships

| FK name | Columns | Ref table | Ref columns | One-to-one |
|---|---|---|---|---|
| `task_materials_task_id_fkey` | `task_id` | `tasks` | `id` | NO |
| `task_materials_uploaded_by_fkey` | `uploaded_by` | `users` | `id` | NO |

#### `public.task_submissions`

- Primary key (inferred): `id`
- Columns: 6
- Foreign keys: 2

| Column | Type | Nullable |
|---|---|---|
| `id` | `number` | NO |
| `image_url` | `text` | NO |
| `mentee_id` | `number` | NO |
| `note` | `text` | YES |
| `submitted_at` | `text` | NO |
| `task_id` | `number` | NO |

##### Relationships

| FK name | Columns | Ref table | Ref columns | One-to-one |
|---|---|---|---|---|
| `task_submissions_mentee_id_fkey` | `mentee_id` | `users` | `id` | NO |
| `task_submissions_task_id_fkey` | `task_id` | `tasks` | `id` | NO |

#### `public.task_time_logs`

- Primary key (inferred): `id`
- Columns: 7
- Foreign keys: 1

| Column | Type | Nullable |
|---|---|---|
| `created_at` | `text` | NO |
| `duration_seconds` | `number` | YES |
| `ended_at` | `text` | YES |
| `id` | `number` | NO |
| `source` | `enum:log_source` | YES |
| `started_at` | `text` | NO |
| `task_id` | `number` | NO |

##### Relationships

| FK name | Columns | Ref table | Ref columns | One-to-one |
|---|---|---|---|---|
| `task_time_logs_task_id_fkey` | `task_id` | `tasks` | `id` | NO |

#### `public.tasks`

- Primary key (inferred): `id`
- Columns: 14
- Foreign keys: 2

| Column | Type | Nullable |
|---|---|---|
| `completed_at` | `text` | YES |
| `created_at` | `text` | NO |
| `created_by` | `number` | NO |
| `date` | `text` | NO |
| `goal` | `text` | YES |
| `id` | `number` | NO |
| `is_fixed_by_mentor` | `boolean` | NO |
| `mentee_id` | `number` | NO |
| `sort_order` | `number` | YES |
| `status` | `enum:task_status` | NO |
| `subject` | `enum:subject_type` | NO |
| `time` | `text` | NO |
| `title` | `text` | NO |
| `updated_at` | `text` | NO |

##### Relationships

| FK name | Columns | Ref table | Ref columns | One-to-one |
|---|---|---|---|---|
| `tasks_created_by_fkey` | `created_by` | `users` | `id` | NO |
| `tasks_mentee_id_fkey` | `mentee_id` | `users` | `id` | NO |

#### `public.users`

- Primary key (inferred): `id`
- Columns: 5
- Foreign keys: 1

| Column | Type | Nullable |
|---|---|---|
| `created_at` | `text` | NO |
| `id` | `number` | NO |
| `mentor_id` | `number` | YES |
| `name` | `text` | NO |
| `role` | `enum:user_role` | NO |

##### Relationships

| FK name | Columns | Ref table | Ref columns | One-to-one |
|---|---|---|---|---|
| `users_mentor_id_fkey` | `mentor_id` | `users` | `id` | NO |

