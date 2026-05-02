require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const app = express();
const PORT = process.env.PORT || 3000;

const SUPABASE_URL = 'https://nkxkciqgklvxuwkfzetf.supabase.co';
const SUPABASE_KEY = 'sb_publishable_rs_9TBx3FFBZlDmxWK3JtQ_-Y9_izmJ';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAdmin = SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
    : null;
const ADMIN_EMAILS = new Set(['admin131.gmail.com', 'admin131@gmail.com']);

function getDbClient(token) {
    if (supabaseAdmin) return supabaseAdmin;
    return createClient(SUPABASE_URL, SUPABASE_KEY, {
        global: {
            headers: {
                Authorization: `Bearer ${token || ''}`
            }
        },
        auth: { persistSession: false }
    });
}

app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/services', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('services')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json(data || []);
    } catch (e) {
        console.error('Fetch services error:', e);
        res.status(500).json({ error: 'Failed to fetch services' });
    }
});

app.post('/api/services', async (req, res) => {
    try {
        const authHeader = req.headers.authorization || '';
        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        const isAdmin = user && ADMIN_EMAILS.has(user.email || '');

        if (!isAdmin) {
            return res.status(403).json({ error: 'Only admins can add services' });
        }

        const newService = req.body;
        if (!newService.id) {
            newService.id = 'svc_' + Date.now();
        }

        const dbClient = getDbClient(token);
        const { data, error } = await dbClient
            .from('services')
            .upsert(newService)
            .select()
            .single();

        if (error) throw error;
        res.status(201).json(data);
    } catch (e) {
        console.error('Save service error:', e);
        res.status(500).json({ error: 'Failed to save service' });
    }
});

app.delete('/api/services/:id', async (req, res) => {
    try {
        const authHeader = req.headers.authorization || '';
        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        const isAdmin = user && ADMIN_EMAILS.has(user.email || '');

        if (!isAdmin) {
            return res.status(403).json({ error: 'Only admins can delete services' });
        }

        const dbClient = getDbClient(token);
        const { error } = await dbClient
            .from('services')
            .delete()
            .eq('id', req.params.id);

        if (error) throw error;
        res.json({ message: 'Service deleted' });
    } catch (e) {
        console.error('Delete service error:', e);
        res.status(500).json({ error: 'Failed to delete service' });
    }
});

app.put('/api/admin/users/:id', async (req, res) => {
    try {
        const authHeader = req.headers.authorization || '';
        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

        const { data: userData, error: userError } = await supabase.auth.getUser(token);
        if (userError || !userData?.user || !ADMIN_EMAILS.has(userData.user.email || '')) {
            return res.status(403).json({ error: 'Forbidden: Admin access required' });
        }

        const userId = req.params.id;
        const { email, password, ...profileUpdates } = req.body;

        if (email || password) {
            if (!supabaseAdmin) {
                return res.status(500).json({ error: 'Service role key missing on server' });
            }
            const authObj = {};
            if (email) authObj.email = email;
            if (password) authObj.password = password;

            const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, authObj);
            if (authError) throw authError;
        }

        const dbClient = getDbClient(token);
        const { data, error } = await dbClient
            .from('profiles')
            .update(profileUpdates)
            .eq('id', userId)
            .select()
            .single();

        if (error) throw error;
        res.json({ ok: true, data });
    } catch (e) {
        console.error('User update error:', e);
        res.status(500).json({ error: e.message || 'Internal server error' });
    }
});

app.delete('/api/admin/users/:id', async (req, res) => {
    try {
        const authHeader = req.headers.authorization || '';
        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

        const { data: userData, error: userError } = await supabase.auth.getUser(token);
        if (userError || !userData?.user || !ADMIN_EMAILS.has(userData.user.email || '')) {
            return res.status(403).json({ error: 'Forbidden: Admin access required' });
        }

        if (!supabaseAdmin) {
            return res.status(500).json({ error: 'Server misconfigured: Missing service role key for user deletion' });
        }

        const userId = req.params.id;

        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .delete()
            .eq('id', userId);

        const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

        if (authDeleteError) {
            console.error('Auth deletion error:', authDeleteError);
            return res.status(500).json({ error: authDeleteError.message });
        }

        res.json({ ok: true, message: 'User deleted successfully' });
    } catch (e) {
        console.error('User deletion crash:', e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/admin/dashboard', async (req, res) => {
    try {
        const authHeader = req.headers.authorization || '';
        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
        if (!token) {
            return res.status(401).json({ error: 'missing_token' });
        }

        const { data: userData, error: userError } = await supabase.auth.getUser(token);
        if (userError || !userData || !userData.user) {
            return res.status(401).json({ error: 'invalid_token' });
        }

        const user = userData.user;
        if (!ADMIN_EMAILS.has(user.email || '')) {
            return res.status(403).json({ error: 'forbidden' });
        }

        const dbClient = getDbClient(token);
        const { data: orders, error: ordersError } = await dbClient
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false });

        const { data: profiles, error: profilesError } = await dbClient
            .from('profiles')
            .select('*');

        let authUsers = [];
        if (supabaseAdmin) {
            const { data: { users }, error: authListError } = await supabaseAdmin.auth.admin.listUsers();
            if (!authListError) authUsers = users;
        }

        if (ordersError) {
            return res.status(500).json({
                error: 'db_error',
                ordersError: ordersError ? ordersError.message : null,
                profilesError: profilesError ? profilesError.message : null
            });
        }

        const mergedProfiles = (profiles || []).map(p => {
            const authUser = authUsers.find(u => u.id === p.id);
            return {
                ...p,
                email: authUser ? authUser.email : 'Unknown'
            };
        });

        res.json({
            orders: orders || [],
            profiles: mergedProfiles,
            profilesError: profilesError ? profilesError.message : null
        });
    } catch (e) {
        res.status(500).json({ error: 'server_error' });
    }
});

app.delete('/api/orders/:id', async (req, res) => {
    try {
        const authHeader = req.headers.authorization || '';
        const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
        const orderId = req.params.id;
        if (!token) {
            return res.status(401).json({ error: 'missing_token' });
        }
        if (!orderId) {
            return res.status(400).json({ error: 'missing_order_id' });
        }

        const { data: userData, error: userError } = await supabase.auth.getUser(token);
        if (userError || !userData || !userData.user) {
            return res.status(401).json({ error: 'invalid_token' });
        }

        const user = userData.user;
        const isAdmin = ADMIN_EMAILS.has(user.email || '');
        const dbClient = getDbClient(token);

        let query = dbClient.from('orders').delete().eq('id', orderId);
        if (!isAdmin) {
            query = query.eq('user_id', user.id);
        }
        const { data, error } = await query.select('id');
        
        if (error) {
            console.error('DELETE Error:', error);
            return res.status(500).json({ error: error.message });
        }
        
        if (!data || data.length === 0) {
            const { data: checkData } = await dbClient.from('orders').select('id, user_id').eq('id', orderId).maybeSingle();
            if (!checkData) {
                console.warn(`Order ${orderId} not found`);
                return res.status(404).json({ error: 'order_not_found' });
            } else if (checkData.user_id !== user.id && !isAdmin) {
                console.warn(`Forbidden delete attempt: User ${user.id} on order ${orderId}`);
                return res.status(403).json({ error: 'forbidden' });
            }
            return res.status(404).json({ error: 'order_not_found_or_forbidden' });
        }

        res.json({ ok: true, deletedId: orderId });
    } catch (e) {
        console.error('Cancellation bug:', e);
        res.status(500).json({ error: 'server_error' });
    }
});


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'pages', 'index.html'));
});

app.get('/auth', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'pages', 'auth.html'));
});

app.get('/profile', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'pages', 'profile.html'));
});

app.get('/services', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'pages', 'services.html'));
});

app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'pages', 'about.html'));
});

app.get('/service-info', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'pages', 'service_info.html'));
});

app.get('/cart', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'pages', 'cart.html'));
});

app.get('/gallery', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'pages', 'gallery.html'));
});

app.get('/contacts', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'pages', 'contacts.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'pages', 'admin.html'));
});

process.on('uncaughtException', (err) => {
    console.error('CRITICAL: Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('CRITICAL: Unhandled Rejection at:', promise, 'reason:', reason);
});

app.listen(PORT, (err) => {
    if (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
    console.log(`
    Главная:  http://localhost:${PORT}
    `);
});