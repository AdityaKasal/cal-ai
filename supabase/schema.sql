-- Run this in your Supabase SQL editor

create table if not exists listings (
  id          bigint generated always as identity primary key,
  title       text not null,
  address     text,
  neighborhood text,
  city        text,
  price       integer,
  bedrooms    integer,
  bathrooms   numeric(3,1),
  sqft        integer,
  amenities   text[],
  images      text[],
  description text,
  available   date,
  pet_friendly boolean default false,
  parking     boolean default false,
  laundry     text check (laundry in ('in-unit','shared','none')),
  type        text check (type in ('apartment','house','condo','townhouse')),
  created_at  timestamptz default now()
);

-- Enable Row Level Security (anyone can read listings)
alter table listings enable row level security;

create policy "Public listings are viewable by everyone"
  on listings for select using (true);
