const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://nkxkciqgklvxuwkfzetf.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_publishable_rs_9TBx3FFBZlDmxWK3JtQ_-Y9_izmJ';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const DATA_FILE = path.join(__dirname, 'data', 'services.json');

async function migrate() {
    console.log('--- Начало миграции услуг в Supabase ---');

    if (!fs.existsSync(DATA_FILE)) {
        console.error('Ошибка: Файл data/services.json не найден.');
        return;
    }

    const rawData = fs.readFileSync(DATA_FILE, 'utf8');
    const services = JSON.parse(rawData);

    console.log(`Найдено услуг для миграции: ${services.length}`);

    for (const svc of services) {
        console.log(`Загрузка: ${svc.title}...`);
        
        const toInsert = {
            id: svc.id,
            title: svc.title,
            category: svc.category,
            price: svc.price,
            duration: svc.duration,
            description: svc.description,
            image: svc.image,
            indications: svc.indications || [],
            contraindications: svc.contraindications || []
        };

        const { error } = await supabase
            .from('services')
            .upsert(toInsert);

        if (error) {
            console.error(`Ошибка при загрузке "${svc.title}":`, error.message);
        } else {
            console.log(`Успешно: ${svc.title}`);
        }
    }

    console.log('--- Миграция завершена ---');
}

migrate();
