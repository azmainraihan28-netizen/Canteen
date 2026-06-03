-- ==========================================
-- SUPABASE POSTGRESQL SCHEMA FOR ACI CANTEEN MANAGER
-- Run the following script in the Supabase SQL Editor
-- to ensure all tables are set up correctly with proper column names.
-- ==========================================

-- 1. Create INGREDIENTS raw materials master table
CREATE TABLE IF NOT EXISTS ingredients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    unit TEXT NOT NULL,
    unit_price NUMERIC DEFAULT 0.0,
    current_stock NUMERIC DEFAULT 0.0,
    min_stock_threshold NUMERIC DEFAULT 0.0,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    supplier_name TEXT,
    supplier_contact TEXT
);

-- Note: If the ingredients table already exists but is missing supplier columns, 
-- you can run these ALTER TABLE commands to add them:
-- ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS supplier_name TEXT;
-- ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS supplier_contact TEXT;


-- 2. Create DAILY_ENTRIES consumption and cost sheet table
CREATE TABLE IF NOT EXISTS daily_entries (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    office_id TEXT NOT NULL,
    participant_count NUMERIC DEFAULT 0.0,
    total_cost NUMERIC DEFAULT 0.0,
    menu_description TEXT,
    stock_remarks TEXT,
    items_consumed JSONB DEFAULT '[]'::jsonb
);


-- 3. Create ACTIVITY_LOGS audit trail table
CREATE TABLE IF NOT EXISTS activity_logs (
    id TEXT PRIMARY KEY,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    user_role TEXT NOT NULL,
    action TEXT NOT NULL,
    details TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- ==========================================
-- Optional Row Level Security (RLS) policies.
-- Run this if you want to make your tables open for access from your frontend:

ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Create broad access policies supporting anon keys
CREATE POLICY "Allow anonymous read/write access to ingredients" 
ON ingredients FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow anonymous read/write access to daily_entries" 
ON daily_entries FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow anonymous read/write access to activity_logs" 
ON activity_logs FOR ALL USING (true) WITH CHECK (true);
