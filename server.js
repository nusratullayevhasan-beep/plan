require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { Telegraf } = require('telegraf');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(express.json());
app.use(cors());

// Telegram Bot Tokeningizni shu yerga yozasiz (BotFather'dan olingan)
const BOT_TOKEN = process.env.BOT_TOKEN || "YOUR_TELEGRAM_BOT_TOKEN";
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID || "YOUR_ADMIN_TELEGRAM_ID";

const bot = new Telegraf(BOT_TOKEN);

// Xotirada vaqtincha saqlash uchun bazalar (Real loyihada MongoDB yoki PostgreSQL ishlatiladi)
let users = [];
let orders = [];
let messages = [];

// API: Foydalanuvchini ro'yxatdan o'tkazish / Yangilash
app.post('/api/users', (req, res) => {
    const { id, name, surname, phone, language, theme } = req.body;
    let userIndex = users.findIndex(u => u.id === id);
    
    const userData = { id, name, surname, phone, language, theme, updatedAt: new Date() };
    
    if (userIndex >= 0) {
        users[userIndex] = userData;
    } else {
        users.push(userData);
    }
    
    res.json({ success: true, message: "Profil saqlandi", user: userData });
});

// API: Foydalanuvchilarni qidirish (Real-time search uchun)
app.get('/api/users/search', (req, res) => {
    const query = req.query.q ? req.query.q.toLowerCase() : '';
    const filtered = users.filter(u => 
        u.name.toLowerCase().includes(query) || 
        (u.surname && u.surname.toLowerCase().includes(query))
    );
    res.json(filtered);
});

// API: Yangi buyurtma yaratish va Chekni yuborish
app.post('/api/orders', async (req, res) => {
    const orderData = {
        orderId: 'ORD-' + Math.floor(1000 + Math.random() * 9000),
        ...req.body,
        createdAt: new Date().toLocaleString()
    };
    
    orders.push(orderData);

    // WebSocket orqali Admin panelga real vaqtda yuborish
    io.emit('new_order', orderData);

    // Telegram Bot orqali Admin va Dizaynerga chek yuborish
    try {
        const text = `📦 **YANGI BUYURTMA CHEKI #${orderData.orderId}**\n\n` +
                     `👤 Mijoz: ${orderData.name} ${orderData.surname || ''}\n` +
                     `📱 Tel: ${orderData.phone}\n` +
                     `🔗 Telegram: ${orderData.telegramUser || 'Kiritilmagan'}\n` +
                     `🎨 Dizayn Turi: ${orderData.designType}\n` +
                     `👨‍💻 Mas'ul Dizayner: ${orderData.designer}\n` +
                     `📅 Sana: ${orderData.createdAt}`;

        await bot.telegram.sendMessage(ADMIN_CHAT_ID, text, { parse_mode: 'Markdown' });
    } catch (err) {
        console.error("Telegramga xabar yuborishda xatolik:", err.message);
    }

    res.json({ success: true, order: orderData });
});

// WebSocket (Real-time chat va xabarlar)
io.on('connection', (socket) => {
    console.log('Foydalanuvchi ulandi (Socket ID):', socket.id);

    socket.on('send_message', (data) => {
        messages.push(data);
        // Barcha ulangan clientlarga xabarni tarqatish
        io.emit('receive_message', data);
    });

    socket.on('disconnect', () => {
        console.log('Foydalanuvchi tarmoqdan chiqdi:', socket.id);
    });
});

// Telegram botni ishga tushirish
bot.launch().then(() => {
    console.log("Telegram Bot muvaffaqiyatli ishga tushdi!");
}).catch(err => {
    console.log("Botni ishga tushirishda xatolik (Tokenni tekshiring):", err.message);
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Backend server ${PORT}-portda ishga tushdi...`);
});
// 1. Buyurtma yuborilganda admin botiga Inline tugmalar (Tasdiqlash / Rad etish) bilan yuborish
app.post('/api/orders', async (req, res) => {
    const orderData = {
        orderId: 'ORD-' + Math.floor(1000 + Math.random() * 9000),
        ...req.body,
        createdAt: new Date().toLocaleString()
    };
    
    orders.push(orderData);

    // WebSocket orqali Real-time tarqatish
    io.emit('new_order', orderData);

    // Telegram Bot orqali Admin chatiga tugmalar bilan yuborish
    try {
        const text = `📦 **YANGI BUYURTMA CHEKI #${orderData.orderId}**\n\n` +
                     `👤 Mijoz: ${orderData.name} ${orderData.surname || ''}\n` +
                     `📱 Tel: ${orderData.phone}\n` +
                     `🔗 Telegram: ${orderData.telegramUser || 'Kiritilmagan'}\n` +
                     `🎨 Dizayn Turi: ${orderData.designType}\n` +
                     `👨‍💻 Mas'ul Dizayner: ${orderData.designer}\n` +
                     `📅 Sana: ${orderData.createdAt}`;

        // Inline tugmalar (Tasdiqlash va Rad etish)
        const inlineKeyboard = {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "✅ Tasdiqlash", callback_data: `accept_${orderData.orderId}` },
                        { text: "❌ Rad etish", callback_data: `decline_${orderData.orderId}` }
                    ]
                ]
            }
        };

        await bot.telegram.sendMessage(ADMIN_CHAT_ID, text, { 
            parse_mode: 'Markdown',
            ...inlineKeyboard
        });
    } catch (err) {
        console.error("Admin botiga xabar yuborishda xatolik:", err.message);
    }

    res.json({ success: true, order: orderData });
});

// 2. Admin tugmalarni bosganda keladigan callback'larni boshqarish
bot.action(/^(accept|decline)_(ORD-\d+)$/, async (ctx) => {
    const action = ctx.match[1]; // accept yoki decline
    const orderId = ctx.match[2]; // Buyurtma ID raqami

    // Buyurtmani bazadan topib statusini o'zgartirish
    const order = orders.find(o => o.orderId === orderId);
    if (order) {
        order.status = action === 'accept' ? 'Tasdiqlandi ✅' : 'Rad etildi ❌';
    }

    // Xabarni yangilash (tugmalarni olib tashlab, natijani yozish)
    const statusText = action === 'accept' 
        ? `✅ *BUYURTMA TASDIQLANDI* (${orderId})` 
        : `❌ *BUYURTMA RAD ETILDI* (${orderId})`;

    try {
        await ctx.editMessageText(`${ctx.callbackQuery.message.text}\n\n*Status:* ${statusText}`, {
            parse_mode: 'Markdown'
        });
        await ctx.answerCbQuery(action === 'accept' ? "Buyurtma tasdiqlandi!" : "Buyurtma rad etildi.");
    } catch (err) {
        console.error("Xabarni yangilashda xatolik:", err.message);
    }
});
// 1. Mijozlar botga kirganda /start bosganda ularning Telegram chat ID raqamini saqlab qolish
bot.start((ctx) => {
    const telegramId = ctx.from.id.toString();
    const username = ctx.from.username ? `@${ctx.from.username}` : ctx.from.first_name;
    
    // Foydalanuvchini bazada saqlash yoki yangilash
    let existingUser = users.find(u => u.telegramId === telegramId);
    if (!existingUser) {
        users.push({
            id: 'usr_' + Math.floor(1000 + Math.random() * 9000),
            name: ctx.from.first_name,
            surname: ctx.from.last_name || '',
            telegramId: telegramId,
            telegramUser: username,
            createdAt: new Date()
        });
    }

    ctx.reply(`Assalomu alaykum, ${ctx.from.first_name}! 👋\nGraphic Design Mini App orqali o'z portfoliomni ko'rishingiz va istalgan dizayn xizmatiga buyurtma berishingiz mumkin.`, {
        reply_markup: {
            inline_keyboard: [
                [{ text: "🎨 Portfolio & Zakaz berish", web_app: { url: "https://your-frontend-url.vercel.app" } }]
            ]
        }
    });
});

// 2. Mini App orqali buyurtma kelganda mijozning telegram ID raqamini ham saqlab qolish
app.post('/api/orders', async (req, res) => {
    const orderData = {
        orderId: 'ORD-' + Math.floor(1000 + Math.random() * 9000),
        ...req.body, // shu yerda frontenddan mijozning telegramId si ham kelishi kerak
        createdAt: new Date().toLocaleString()
    };
    
    orders.push(orderData);
    io.emit('new_order', orderData);

    try {
        const text = `📦 **YANGI BUYURTMA CHEKI #${orderData.orderId}**\n\n` +
                     `👤 Mijoz: ${orderData.name} ${orderData.surname || ''}\n` +
                     `📱 Tel: ${orderData.phone}\n` +
                     `🔗 Telegram: ${orderData.telegramUser || 'Kiritilmagan'}\n` +
                     `🎨 Dizayn Turi: ${orderData.designType}\n` +
                     `👨‍💻 Mas'ul Dizayner: ${orderData.designer}\n` +
                     `📅 Sana: ${orderData.createdAt}`;

        const inlineKeyboard = {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: "✅ Tasdiqlash", callback_data: `accept_${orderData.orderId}` },
                        { text: "❌ Rad etish", callback_data: `decline_${orderData.orderId}` }
                    ]
                ]
            }
        };

        await bot.telegram.sendMessage(ADMIN_CHAT_ID, text, { 
            parse_mode: 'Markdown',
            ...inlineKeyboard
        });
    } catch (err) {
        console.error("Admin botiga xabar yuborishda xatolik:", err.message);
    }

    res.json({ success: true, order: orderData });
});

// 3. Admin tugmani bosganda mijozga ham avtomatik xabar yuborish
bot.action(/^(accept|decline)_(ORD-\d+)$/, async (ctx) => {
    const action = ctx.match[1]; // accept yoki decline
    const orderId = ctx.match[2]; // Buyurtma ID

    const order = orders.find(o => o.orderId === orderId);
    if (order) {
        order.status = action === 'accept' ? 'Tasdiqlandi ✅' : 'Rad etildi ❌';
    }

    const statusText = action === 'accept' 
        ? `✅ *BUYURTMA TASDIQLANDI* (${orderId})` 
        : `❌ *BUYURTMA RAD ETILDI* (${orderId})`;

    try {
        // Admin xabarini yangilash
        await ctx.editMessageText(`${ctx.callbackQuery.message.text}\n\n*Status:* ${statusText}`, {
            parse_mode: 'Markdown'
        });
        await ctx.answerCbQuery(action === 'accept' ? "Buyurtma tasdiqlandi!" : "Buyurtma rad etildi.");

        // MIJOZGA AVTOMATIK BILDIRISHNOMA YUBORISH
        if (order && order.telegramId) {
            const customerMsg = action === 'accept'
                ? `🎉 Hurmatli ${order.name}, sizning **${order.orderId}**-sonli **${order.designType}** bo'yicha bergan buyurtmangiz **TASDIQLANDI!** ✅ Tez orada dizayneringiz siz bilan bog'lanadi.`
                : `❌ Hurmatli ${order.name}, afsuski sizning **${order.orderId}**-sonli buyurtmangiz **RAD ETILDI**. Qayta murojaat qilishingiz mumkin.`;

            await bot.telegram.sendMessage(order.telegramId, customerMsg, { parse_mode: 'Markdown' });
        }
    } catch (err) {
        console.error("Status bildirishnomasini yuborishda xatolik:", err.message);
    }
});