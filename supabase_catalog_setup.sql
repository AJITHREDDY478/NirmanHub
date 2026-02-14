-- Create catalog_entities table
CREATE TABLE IF NOT EXISTS catalog_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  lookup_code TEXT NOT NULL UNIQUE,
  description TEXT,
  
  type TEXT NOT NULL 
    CHECK (type IN ('DepartmentGroup', 'CategoryGroup', 'Item')),
  
  parent_id UUID REFERENCES catalog_entities(id) ON DELETE CASCADE,
  
  item_details_data JSONB,
  
  printing_time INTEGER DEFAULT 0,
  
  original_price NUMERIC(10,2) DEFAULT 0.00,
  discount_price NUMERIC(10,2) DEFAULT 0.00,
  
  stock_quantity INTEGER DEFAULT 0,
  reserved_quantity INTEGER DEFAULT 0,
  
  is_active BOOLEAN DEFAULT true,
  
  image_url TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_catalog_user_id ON catalog_entities(user_id);
CREATE INDEX IF NOT EXISTS idx_catalog_type ON catalog_entities(type);
CREATE INDEX IF NOT EXISTS idx_catalog_lookup_code ON catalog_entities(lookup_code);
CREATE INDEX IF NOT EXISTS idx_catalog_parent_id ON catalog_entities(parent_id);

-- Enable RLS
ALTER TABLE catalog_entities ENABLE ROW LEVEL SECURITY;

-- Users can only see and manage their own catalog items
CREATE POLICY "Users can view their own catalog items" ON catalog_entities
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own catalog items" ON catalog_entities
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own catalog items" ON catalog_entities
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own catalog items" ON catalog_entities
  FOR DELETE
  USING (auth.uid() = user_id);
