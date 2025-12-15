-- Script to remove duplicate menu items
-- This script identifies items with the same name and keeps only one copy.
-- It prioritizes keeping items with the new UUID format (starting with 550e8400...)

WITH duplicates_to_delete AS (
  SELECT id
  FROM (
      SELECT 
          id,
          name,
          ROW_NUMBER() OVER (
              PARTITION BY name 
              ORDER BY 
                  -- Prioritize keeping the known valid UUIDs
                  CASE WHEN id::text LIKE '550e8400-%' THEN 0 ELSE 1 END,
                  -- Then prioritize the latest created ones (if created_at exists)
                  -- Fallback to ID for deterministic ordering
                  id DESC
          ) as row_num
      FROM menu_items
  ) t
  WHERE t.row_num > 1
)
DELETE FROM menu_items
WHERE id IN (SELECT id FROM duplicates_to_delete);

-- Verify results
SELECT name, count(*) 
FROM menu_items 
GROUP BY name 
HAVING count(*) > 1;
