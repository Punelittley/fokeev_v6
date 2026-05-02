const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://nkxkciqgklvxuwkfzetf.supabase.co';
const SUPABASE_KEY = 'sb_publishable_rs_9TBx3FFBZlDmxWK3JtQ_-Y9_izmJ';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function createAdmin() {
    const { data, error } = await supabase.auth.signUp({
        email: 'admin131@gmail.com',
        password: 'nakcnaldkn12',
        options: {
            data: {
                full_name: 'Администратор',
                phone: '+79990000000'
            }
        }
    });

    if (error) {
        console.error('Ошибка создания:', error.message);
    } else {
        console.log('Админ аккаунт успешно создан:', data.user?.email);
    }
    process.exit(0);
}
createAdmin();
