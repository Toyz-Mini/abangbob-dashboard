// Create admin user in Supabase Auth
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Supabase URL:', supabaseUrl);
console.log('Service Key (first 20 chars):', supabaseServiceKey?.substring(0, 20));

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function createAdminUser() {
    try {
        const { data, error } = await supabase.auth.admin.createUser({
            email: 'aliffharris@gmail.com',
            password: 'Admin123!',
            email_confirm: true,
            user_metadata: {
                name: 'Aliff Harris'
            }
        });

        if (error) {
            console.error('Error:', error.message);
            return;
        }

        console.log('User created successfully!');
        console.log('User ID:', data.user.id);
        console.log('Email:', data.user.email);
    } catch (err) {
        console.error('Exception:', err.message);
    }
}

createAdminUser();
