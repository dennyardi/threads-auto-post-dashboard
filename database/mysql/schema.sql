create table if not exists users (
  id varchar(191) primary key,
  email varchar(255) not null unique,
  password_hash varchar(255) not null,
  created_at datetime(3) not null default current_timestamp(3),
  updated_at datetime(3) not null default current_timestamp(3) on update current_timestamp(3)
);

create table if not exists sessions (
  id varchar(191) primary key,
  user_id varchar(191) not null,
  token_hash char(64) not null unique,
  expires_at datetime(3) not null,
  created_at datetime(3) not null default current_timestamp(3),
  index sessions_user_id_idx (user_id),
  index sessions_expires_at_idx (expires_at),
  constraint sessions_user_id_fk foreign key (user_id) references users(id) on delete cascade
);

create table if not exists profiles (
  id varchar(191) primary key,
  email text null,
  full_name text null,
  avatar_url text null,
  created_at datetime(3) not null default current_timestamp(3),
  updated_at datetime(3) not null default current_timestamp(3) on update current_timestamp(3),
  index profiles_email_idx (email(191)),
  constraint profiles_id_fk foreign key (id) references users(id) on delete cascade
);

create table if not exists threads_accounts (
  id varchar(191) primary key,
  user_id varchar(191) not null,
  threads_user_id varchar(255) not null,
  username text null,
  display_name text null,
  profile_picture_url text null,
  access_token_encrypted text not null,
  token_type text null,
  expires_at datetime(3) null,
  scopes json null,
  is_active boolean not null default true,
  connected_at datetime(3) not null default current_timestamp(3),
  disconnected_at datetime(3) null,
  created_at datetime(3) not null default current_timestamp(3),
  updated_at datetime(3) not null default current_timestamp(3) on update current_timestamp(3),
  unique threads_accounts_user_threads_unique (user_id, threads_user_id),
  index threads_accounts_user_id_idx (user_id),
  index threads_accounts_threads_user_id_idx (threads_user_id),
  index threads_accounts_user_active_idx (user_id, is_active),
  constraint threads_accounts_user_id_fk foreign key (user_id) references users(id) on delete cascade
);

create table if not exists posts (
  id varchar(191) primary key,
  user_id varchar(191) not null,
  threads_account_id varchar(191) null,
  content text not null,
  media_type varchar(20) not null default 'NONE',
  status varchar(20) not null default 'draft',
  scheduled_at datetime(3) null,
  published_at datetime(3) null,
  external_threads_post_id text null,
  retry_count int not null default 0,
  error_message text null,
  created_at datetime(3) not null default current_timestamp(3),
  updated_at datetime(3) not null default current_timestamp(3) on update current_timestamp(3),
  constraint posts_media_type_check check (media_type in ('NONE', 'IMAGE', 'VIDEO', 'CAROUSEL')),
  constraint posts_status_check check (status in ('draft', 'scheduled', 'publishing', 'published', 'failed')),
  constraint posts_retry_count_check check (retry_count >= 0),
  index posts_user_id_idx (user_id),
  index posts_threads_account_id_idx (threads_account_id),
  index posts_status_idx (status),
  index posts_scheduled_at_idx (scheduled_at),
  index posts_created_at_idx (created_at),
  index posts_user_status_idx (user_id, status),
  constraint posts_user_id_fk foreign key (user_id) references users(id) on delete cascade,
  constraint posts_threads_account_id_fk foreign key (threads_account_id) references threads_accounts(id) on delete set null
);

create table if not exists post_media (
  id varchar(191) primary key,
  post_id varchar(191) not null,
  user_id varchar(191) not null,
  storage_path text not null,
  public_url text null,
  mime_type text null,
  size_bytes bigint null,
  sort_order int not null default 0,
  created_at datetime(3) not null default current_timestamp(3),
  constraint post_media_size_check check (size_bytes is null or size_bytes >= 0),
  index post_media_post_id_idx (post_id),
  index post_media_user_id_idx (user_id),
  constraint post_media_post_id_fk foreign key (post_id) references posts(id) on delete cascade,
  constraint post_media_user_id_fk foreign key (user_id) references users(id) on delete cascade
);

create table if not exists publish_logs (
  id varchar(191) primary key,
  user_id varchar(191) not null,
  threads_account_id varchar(191) null,
  post_id varchar(191) null,
  status text not null,
  external_threads_post_id text null,
  request_payload json null,
  response_payload json null,
  error_message text null,
  created_at datetime(3) not null default current_timestamp(3),
  index publish_logs_user_id_idx (user_id),
  index publish_logs_threads_account_id_idx (threads_account_id),
  index publish_logs_post_id_idx (post_id),
  index publish_logs_status_idx (status(191)),
  index publish_logs_created_at_idx (created_at),
  constraint publish_logs_user_id_fk foreign key (user_id) references users(id) on delete cascade,
  constraint publish_logs_threads_account_id_fk foreign key (threads_account_id) references threads_accounts(id) on delete set null,
  constraint publish_logs_post_id_fk foreign key (post_id) references posts(id) on delete set null
);
