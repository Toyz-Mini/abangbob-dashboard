-- Script to remove duplicate inventory items
-- Prioritizes seed data (IDs starting with 'e1000000-')

WITH duplicates_to_delete AS (
  SELECT id
  FROM (
      SELECT 
          id,
          name,
          ROW_NUMBER() OVER (
              PARTITION BY name 
              ORDER BY 
                  -- Keep seed data (starts with e1...)
                  CASE WHEN id::text LIKE 'e1000000-%' THEN 0 ELSE 1 END,
                  -- Fallback to latest ID
                  id DESC
          ) as row_num
      FROM inventory
  ) t
  WHERE t.row_num > 1
)
DELETE FROM inventory
WHERE id IN (SELECT id FROM duplicates_to_delete);

-- Verify
SELECT name, count(*) 
FROM inventory 
GROUP BY name 
HAVING count(*) > 1;
