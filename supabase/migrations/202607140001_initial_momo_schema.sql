-- MOMO COFFEE initial Supabase schema proposal
-- REVIEW ONLY: this migration has not been applied to any Supabase project.

begin;

create extension if not exists pgcrypto;

create type public.app_role as enum ('USER', 'ADMIN');
create type public.cart_status as enum ('ACTIVE', 'ORDERED', 'ABANDONED');
create type public.order_status as enum ('RECEIVED', 'PREPARING', 'READY', 'PICKED_UP', 'CANCELLED');
create type public.payment_status as enum ('PENDING', 'PAID', 'FAILED', 'CANCELLED', 'REFUNDED');
create type public.coupon_status as enum ('AVAILABLE', 'USED', 'EXPIRED', 'REVOKED');
create type public.inquiry_status as enum ('PENDING', 'ANSWERED');
create type public.point_transaction_type as enum ('EARN', 'USE', 'DEDUCT', 'ADJUST');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  name text not null,
  phone text,
  birth_date date,
  role public.app_role not null default 'USER',
  profile_image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.stores (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  name text not null,
  address text not null default '',
  estimated_minutes integer not null default 10 check (estimated_minutes between 0 and 240),
  business_hours jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.menus (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  category text not null check (category in ('coffee','signature','noncoffee','tea','dessert','bakery','season','goods')),
  name text not null,
  english_name text not null default '',
  base_price integer not null check (base_price >= 0),
  description text not null default '',
  image_url text not null default '',
  emoji text,
  nutrition jsonb,
  allergens text[] not null default '{}',
  is_sold_out boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One row represents one selectable value such as BEAN/MOMO, SIZE/LARGE or TEMPERATURE/ICED.
-- menu_id null means the option is reusable; applies_to_categories limits where it is shown.
create table public.menu_options (
  id uuid primary key default gen_random_uuid(),
  menu_id uuid references public.menus(id) on delete cascade,
  group_code text not null check (group_code in ('BEAN','SIZE','TEMPERATURE','SHOT','SYRUP')),
  value_code text not null,
  name text not null,
  price_delta integer not null default 0 check (price_delta >= 0),
  is_default boolean not null default false,
  is_required boolean not null default false,
  applies_to_categories text[] not null default '{}',
  metadata jsonb not null default '{}'::jsonb,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique nulls not distinct (menu_id, group_code, value_code)
);

create table public.favorite_menus (
  member_id uuid not null references public.profiles(id) on delete cascade,
  menu_id uuid not null references public.menus(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (member_id, menu_id)
);

-- owner_id is auth.uid() for both registered and Supabase anonymous users.
-- member_id is null for guest carts.
create table public.carts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  member_id uuid references public.profiles(id) on delete cascade,
  status public.cart_status not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index carts_one_active_per_owner
  on public.carts(owner_id) where status = 'ACTIVE';

create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  menu_id uuid not null references public.menus(id),
  quantity integer not null check (quantity between 1 and 20),
  base_price integer not null check (base_price >= 0),
  unit_price integer not null check (unit_price >= 0),
  selected_options jsonb not null default '{}'::jsonb,
  option_total integer not null default 0 check (option_total >= 0),
  option_signature text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (cart_id, menu_id, option_signature)
);

create table public.coupon_templates (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text not null default '',
  discount_type text not null check (discount_type in ('percent','fixed','free-item','free-drink')),
  discount_value integer not null default 0 check (discount_value >= 0),
  minimum_amount integer not null default 0 check (minimum_amount >= 0),
  maximum_discount integer check (maximum_discount is null or maximum_discount >= 0),
  target_type text not null default 'all' check (target_type in ('all','drink','dessert','season','liked','menu')),
  target_menu_id uuid references public.menus(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.member_coupons (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.coupon_templates(id),
  member_id uuid not null references public.profiles(id) on delete cascade,
  status public.coupon_status not null default 'AVAILABLE',
  source_key text,
  issued_by uuid references public.profiles(id) on delete set null,
  issued_reason text,
  issued_at timestamptz not null default now(),
  expires_at timestamptz,
  used_at timestamptz,
  revoked_at timestamptz,
  revoked_reason text,
  unique (member_id, source_key)
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  order_number text not null unique,
  owner_id uuid not null references auth.users(id),
  member_id uuid references public.profiles(id) on delete set null,
  customer_name text not null,
  customer_email text,
  customer_phone text not null,
  store_id uuid references public.stores(id) on delete set null,
  store_name_snapshot text not null,
  store_address_snapshot text not null default '',
  estimated_minutes integer not null default 10 check (estimated_minutes between 0 and 240),
  subtotal integer not null check (subtotal >= 0),
  coupon_discount integer not null default 0 check (coupon_discount >= 0),
  point_discount integer not null default 0 check (point_discount >= 0),
  total_amount integer not null check (total_amount >= 0),
  used_points integer not null default 0 check (used_points >= 0),
  earned_points integer not null default 0 check (earned_points >= 0),
  reward_rate numeric(5,2) not null default 0 check (reward_rate >= 0),
  applied_coupon_id uuid references public.member_coupons(id) on delete set null,
  payment_method text not null check (payment_method in ('card','kakao','naver','toss','free')),
  payment_status public.payment_status not null default 'PENDING',
  status public.order_status not null default 'RECEIVED',
  admin_memo text not null default '',
  stamp_awarded_at timestamptz,
  reward_awarded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

alter table public.member_coupons
  add column used_order_id uuid references public.orders(id) on delete set null;

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  menu_id uuid references public.menus(id) on delete set null,
  menu_name text not null,
  category text not null,
  image_url text not null default '',
  base_price integer not null check (base_price >= 0),
  unit_price integer not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0),
  line_total integer not null check (line_total >= 0),
  selected_options jsonb not null default '{}'::jsonb,
  option_total integer not null default 0 check (option_total >= 0)
);

create table public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  status public.order_status not null,
  changed_by uuid references public.profiles(id) on delete set null,
  changed_at timestamptz not null default now()
);

create table public.member_benefits (
  member_id uuid primary key references public.profiles(id) on delete cascade,
  points_balance integer not null default 0 check (points_balance >= 0),
  stamp_count integer not null default 0 check (stamp_count between 0 and 9),
  reward_count integer not null default 0 check (reward_count >= 0),
  membership_status text not null default 'ACTIVE' check (membership_status in ('ACTIVE','INACTIVE')),
  enrolled_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.point_transactions (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.profiles(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  type public.point_transaction_type not null,
  amount integer not null check (amount > 0),
  balance_before integer not null check (balance_before >= 0),
  balance_after integer not null check (balance_after >= 0),
  source text not null check (source in ('ORDER','ADMIN','EVENT','REVIEW','SYSTEM')),
  reason text not null,
  admin_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create unique index point_transactions_one_order_earn
  on public.point_transactions(order_id, member_id)
  where source = 'ORDER' and type = 'EARN';

create table public.inquiries (
  id uuid primary key default gen_random_uuid(),
  legacy_id text unique,
  member_id uuid not null references public.profiles(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  category text not null check (category in ('MENU','ORDER','PAYMENT','COUPON','MEMBERSHIP','STORE','ETC')),
  title text not null check (char_length(title) between 1 and 100),
  content text not null check (char_length(content) between 10 and 2000),
  is_private boolean not null default false,
  status public.inquiry_status not null default 'PENDING',
  admin_memo text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create table public.inquiry_answers (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid not null references public.inquiries(id) on delete cascade,
  admin_id uuid references public.profiles(id) on delete set null,
  admin_name_snapshot text not null,
  content text not null check (char_length(content) between 10 and 2000),
  version integer not null check (version > 0),
  is_current boolean not null default true,
  action text not null default 'CREATED' check (action in ('CREATED','UPDATED','DELETED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz,
  archived_at timestamptz,
  unique (inquiry_id, version)
);

create unique index inquiry_answers_one_current
  on public.inquiry_answers(inquiry_id) where is_current;

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid references public.profiles(id) on delete cascade,
  audience text not null check (audience in ('USER','ADMIN')),
  type text not null check (type in ('ORDER','QNA','MEMBER','MENU','REWARD','SYSTEM')),
  title text not null,
  message text not null,
  target_url text not null default '',
  entity_type text,
  entity_id text,
  dedupe_key text not null unique,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create table public.admin_activity_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references public.profiles(id) on delete set null,
  admin_name_snapshot text not null,
  action text not null,
  entity_type text not null,
  entity_id text,
  description text not null,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);

create table public.operation_settings (
  id smallint primary key default 1 check (id = 1),
  store_open boolean not null default true,
  open_time time not null default '09:00',
  close_time time not null default '22:00',
  last_order_time time not null default '21:30',
  pickup_enabled boolean not null default true,
  order_enabled boolean not null default true,
  maintenance_mode boolean not null default false,
  notice_message text not null default '',
  hero_banner_enabled boolean not null default true,
  season_menu_enabled boolean not null default true,
  event_section_enabled boolean not null default true,
  app_promotion_enabled boolean not null default true,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

insert into public.operation_settings(id) values (1);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.profiles(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  content text not null default '',
  reward_points integer not null default 0 check (reward_points >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (member_id, order_id)
);

create index menus_category_active_idx on public.menus(category, is_active, is_sold_out);
create index cart_items_cart_idx on public.cart_items(cart_id);
create index orders_member_created_idx on public.orders(member_id, created_at desc);
create index orders_owner_created_idx on public.orders(owner_id, created_at desc);
create index orders_status_created_idx on public.orders(status, created_at desc);
create index order_items_order_idx on public.order_items(order_id);
create index member_coupons_member_status_idx on public.member_coupons(member_id, status, expires_at);
create index point_transactions_member_created_idx on public.point_transactions(member_id, created_at desc);
create index inquiries_member_created_idx on public.inquiries(member_id, created_at desc);
create index inquiries_status_created_idx on public.inquiries(status, created_at desc);
create index notifications_recipient_created_idx on public.notifications(recipient_id, created_at desc);
create index admin_activity_created_idx on public.admin_activity_logs(created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
create trigger stores_set_updated_at before update on public.stores
for each row execute function public.set_updated_at();
create trigger menus_set_updated_at before update on public.menus
for each row execute function public.set_updated_at();
create trigger carts_set_updated_at before update on public.carts
for each row execute function public.set_updated_at();
create trigger cart_items_set_updated_at before update on public.cart_items
for each row execute function public.set_updated_at();
create trigger coupon_templates_set_updated_at before update on public.coupon_templates
for each row execute function public.set_updated_at();
create trigger orders_set_updated_at before update on public.orders
for each row execute function public.set_updated_at();
create trigger member_benefits_set_updated_at before update on public.member_benefits
for each row execute function public.set_updated_at();
create trigger reviews_set_updated_at before update on public.reviews
for each row execute function public.set_updated_at();

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  -- Supabase anonymous users have no email and are used only as secure guest owners.
  if new.email is null then
    return new;
  end if;

  insert into public.profiles(id, email, name, phone)
  values (
    new.id,
    lower(new.email),
    coalesce(nullif(new.raw_user_meta_data ->> 'name', ''), split_part(new.email, '@', 1)),
    nullif(new.raw_user_meta_data ->> 'phone', '')
  )
  on conflict (id) do nothing;

  insert into public.member_benefits(member_id)
  values (new.id)
  on conflict (member_id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'ADMIN'
  );
$$;

alter table public.profiles enable row level security;
alter table public.stores enable row level security;
alter table public.menus enable row level security;
alter table public.menu_options enable row level security;
alter table public.favorite_menus enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.coupon_templates enable row level security;
alter table public.member_coupons enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_status_history enable row level security;
alter table public.member_benefits enable row level security;
alter table public.point_transactions enable row level security;
alter table public.inquiries enable row level security;
alter table public.inquiry_answers enable row level security;
alter table public.notifications enable row level security;
alter table public.admin_activity_logs enable row level security;
alter table public.operation_settings enable row level security;
alter table public.reviews enable row level security;

create policy profiles_select on public.profiles for select
using (id = auth.uid() or public.is_admin());
create policy profiles_update_self on public.profiles for update
using (id = auth.uid()) with check (id = auth.uid());

create policy stores_read on public.stores for select using (true);
create policy stores_admin_write on public.stores for all using (public.is_admin()) with check (public.is_admin());
create policy menus_read on public.menus for select using (is_active or public.is_admin());
create policy menus_admin_write on public.menus for all using (public.is_admin()) with check (public.is_admin());
create policy menu_options_read on public.menu_options for select using (is_active or public.is_admin());
create policy menu_options_admin_write on public.menu_options for all using (public.is_admin()) with check (public.is_admin());

create policy favorites_owner on public.favorite_menus for all
using (member_id = auth.uid()) with check (member_id = auth.uid());

create policy carts_owner on public.carts for all
using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy cart_items_owner on public.cart_items for all
using (exists (select 1 from public.carts c where c.id = cart_id and c.owner_id = auth.uid()))
with check (exists (select 1 from public.carts c where c.id = cart_id and c.owner_id = auth.uid()));

create policy coupon_templates_read on public.coupon_templates for select using (is_active or public.is_admin());
create policy coupon_templates_admin_write on public.coupon_templates for all using (public.is_admin()) with check (public.is_admin());
create policy member_coupons_select on public.member_coupons for select
using (member_id = auth.uid() or public.is_admin());
create policy member_coupons_admin_write on public.member_coupons for all
using (public.is_admin()) with check (public.is_admin());

create policy orders_select on public.orders for select
using (owner_id = auth.uid() or public.is_admin());
create policy orders_insert on public.orders for insert
with check (owner_id = auth.uid() and (member_id is null or member_id = auth.uid()));
create policy orders_admin_update on public.orders for update
using (public.is_admin()) with check (public.is_admin());
create policy order_items_select on public.order_items for select
using (exists (select 1 from public.orders o where o.id = order_id and (o.owner_id = auth.uid() or public.is_admin())));
create policy order_items_insert on public.order_items for insert
with check (exists (select 1 from public.orders o where o.id = order_id and o.owner_id = auth.uid()));
create policy order_status_history_select on public.order_status_history for select
using (exists (select 1 from public.orders o where o.id = order_id and (o.owner_id = auth.uid() or public.is_admin())));
create policy order_status_history_admin_write on public.order_status_history for all
using (public.is_admin()) with check (public.is_admin());

create policy member_benefits_select on public.member_benefits for select
using (member_id = auth.uid() or public.is_admin());
create policy member_benefits_admin_write on public.member_benefits for all
using (public.is_admin()) with check (public.is_admin());
create policy point_transactions_select on public.point_transactions for select
using (member_id = auth.uid() or public.is_admin());
create policy point_transactions_admin_write on public.point_transactions for all
using (public.is_admin()) with check (public.is_admin());

create policy inquiries_select on public.inquiries for select
using (member_id = auth.uid() or public.is_admin());
create policy inquiries_insert on public.inquiries for insert
with check (member_id = auth.uid());
create policy inquiries_owner_update on public.inquiries for update
using (member_id = auth.uid() and status = 'PENDING')
with check (member_id = auth.uid());
create policy inquiries_owner_delete on public.inquiries for delete
using (member_id = auth.uid() and status = 'PENDING');
create policy inquiries_admin_update on public.inquiries for update
using (public.is_admin()) with check (public.is_admin());
create policy inquiry_answers_select on public.inquiry_answers for select
using (exists (select 1 from public.inquiries q where q.id = inquiry_id and (q.member_id = auth.uid() or public.is_admin())));
create policy inquiry_answers_admin_write on public.inquiry_answers for all
using (public.is_admin()) with check (public.is_admin());

create policy notifications_select on public.notifications for select
using (recipient_id = auth.uid() or (audience = 'ADMIN' and public.is_admin()));
create policy notifications_update_read on public.notifications for update
using (recipient_id = auth.uid() or (audience = 'ADMIN' and public.is_admin()))
with check (recipient_id = auth.uid() or (audience = 'ADMIN' and public.is_admin()));
create policy notifications_admin_insert on public.notifications for insert
with check (public.is_admin());

create policy admin_activity_admin_only on public.admin_activity_logs for select
using (public.is_admin());
create policy admin_activity_admin_insert on public.admin_activity_logs for insert
with check (public.is_admin());

create policy operation_settings_read on public.operation_settings for select using (true);
create policy operation_settings_admin_write on public.operation_settings for all
using (public.is_admin()) with check (public.is_admin());

create policy reviews_read on public.reviews for select using (true);
create policy reviews_owner_insert on public.reviews for insert
with check (member_id = auth.uid());
create policy reviews_owner_update on public.reviews for update
using (member_id = auth.uid()) with check (member_id = auth.uid());
create policy reviews_owner_delete on public.reviews for delete
using (member_id = auth.uid());

-- Prevent normal authenticated users from changing their own role.
revoke update on public.profiles from authenticated;
grant update (name, phone, birth_date, profile_image_url, updated_at) on public.profiles to authenticated;

commit;
