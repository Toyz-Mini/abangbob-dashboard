SELECT 
    column_name, 
    data_type 
FROM 
    information_schema.columns 
WHERE 
    table_name = 'outlet_settings';

SELECT * FROM pg_policies WHERE tablename = 'outlet_settings';
