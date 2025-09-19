import "dotenv/config";
import { Telegraf } from "telegraf";

const bot = new Telegraf(process.env.BOT_TOKEN);

// 📍 Foydalanuvchi state va buyurtmalar
const userState = {};
const orders = {}; // { chatId: [ { name, price, quantity } ] }
const awaitingQuantity = {}; // { chatId: { name, price } }
const userContacts = {}; // { chatId: { phone, first_name, username } }
const userLocations = {}; // { chatId: { latitude, longitude, address } }

// Delivery fee
const DELIVERY_FEE = 10000;
const MAX_USERS = 200;

// 🚫 Tugagan ovqatlar ro'yxati
const outOfStock = new Set(); // Tugagan ovqatlar nomi
const adminManagingStock = {}; // Admin qaysi ovqatni boshqaryapti

// 🔥 Menyu strukturasi
const menus = {
    main: {
        text: "🍽 Kategoriyalardan birini tanlang:",
        buttons: [
            ["🍔 Fast food", "🍲 Milliy taomlar"],
            ["🥘 Osh", "🥩 Shashliklar"],
            ["🍗 Do'mboq jo'ja", "🥤 Salqin ichimliklar"],
            ["🥗 Salatlar", "🥗 Mini salatlar"],
            ["📦 Savatni ko'rish", "📞 Admin bilan bog'lanish"],
        ],
    },
    // Admin panel
    admin: {
        text: "👨‍💼 Admin panel:",
        buttons: [
            ["📋 Tugagan ovqatlar ro'yxati", "🔍 Ovqat qidirish"],
            ["📊 Statistika", "⬅️ Menyuga qaytish"]
        ]
    },
    fastfood: {
        text: "🍔 Fast food turlari:",
        buttons: [
            ["Lavash", "Donar"],
            ["Burger", "Club Sendvich"],
            ["Hot-Dog", "Xaggi"],
            ["Fri", "Sous"],
            ["⬅️ Orqaga"],
        ],
    },
    lavash: {
        text: "🌯 Lavash turlari:",
        buttons: [
            ["Lavash standart - 36 000", "Lavash mini - 31 000"],
            ["Lavash standart achchiq - 36 000", "Lavash mini achchiq - 31 000"],
            ["Lavash standart pishloqli - 39 000", "Lavash mini pishloqli - 34 000"],
            ["⬅️ Orqaga"],
        ],
    },
    donar: {
        text: "🌯 Donar turlari:",
        buttons: [
            ["Donar standart - 34 000", "Donar Standart Pishloqli - 37 000"],
            ["Donar Big - 39 000"],
            ["⬅️ Orqaga"]
        ],
    },
    burger: {
        text: "🍔 Burgerlar:",
        buttons: [
            ["Gamburger - 28 000", "Double burger - 42 000"],
            ["Cheeseburger - 30 000", "Double Cheeseburger - 47 000"],
            ["⬅️ Orqaga"]
        ],
    },
    club: {
        text: "🥪 Club Sendvich:",
        buttons: [
            ["Club sendvich - 37 000", "Club Sendvich +Fri - 40 000"],
            ["⬅️ Orqaga"]
        ],
    },
    hotdog: {
        text: "🌭 Hot-Dog:",
        buttons: [
            ["Standart - 12 000", "Klassik - 15 000"],
            ["Korolevskiy - 20 000", "Double Korolevskiy - 25 000"],
            ["⬅️ Orqaga"]
        ],
    },
    xaggi: {
        text: "🍖 Xaggi:",
        buttons: [
            ["Xaggi Standart - 40 000", "Xaggi Mini - 34 000"],
            ["⬅️ Orqaga"]
        ],
    },
    fri: {
        text: "🍟 Fri:",
        buttons: [
            ["Kartofel Fri - 17 000"],
            ["⬅️ Orqaga"]
        ],
    },
    sous: {
        text: "🥫 Souslar:",
        buttons: [
            ["Ketchup - 2 000", "Mayonez - 2 000"],
            ["Chili - 2 000", "Pishloqli - 2 000"],
            ["⬅️ Orqaga"]
        ],
    },
    milliy: {
        text: "🍲 Milliy taomlar:",
        buttons: [
            ["Birinchi ovqat", "Ikkinchi ovqat"],
            ["Osh", "Do'mboq Jo'ja"],
            ["⬅️ Orqaga"],
        ],
    },
    birinchi: {
        text: "🥘 Birinchi ovqat:",
        buttons: [
            ["Shorva - 30 000", "Uygur lagmon - 32 000"],
            ["Mastava - 30 000"],
            ["⬅️ Orqaga"],
        ],
    },
    ikkinchi: {
        text: "🍛 Ikkinchi ovqat:",
        buttons: [
            ["Qovurma lagmon - 32 000", "Qozon tovuqli - 38 000"],
            ["Manti - 7 000", "Bifshteks - 32 000"],
            ["Do'lma - 32 000"],
            ["⬅️ Orqaga"]
        ],
    },
    osh: {
        text: "🥘 Osh turlari:",
        buttons: [
            ["Toy oshi - 32 000", "Choyxona osh - 36 000"],
            ["Qazi 1 dona - 8 000", "Bedana tutum 1 dona - 2 000"],
            ["⬅️ Orqaga"]
        ],
    },
    shashlik: {
        text: "🥩 Shashlik turlari:",
        buttons: [
            ["Mol jaz(mol, qo'y) - 20 000", "Qiyma - 15 000"],
            ["⬅️ Orqaga"]
        ],
    },
    domboq: {
        text: "🍗 Do'mboq jo'ja:",
        buttons: [
            ["Jo'ja 300 gr - 27 000", "Jo'ja 400 gr - 36 000"],
            ["Jo'ja 500 gr - 45 000", "Jo'ja 1 kg - 90 000"],
            ["⬅️ Orqaga"]
        ],
    },
    ichimlik: {
        text: "🥤 Salqin ichimliklar:",
        buttons: [
            ["Fanta kola 0.5 - 8 000", "Fanta kola 1 - 12 000"],
            ["Fanta kola 1.5 - 18 000", "Fanta kola 2 - 20 000"],
            ["⬅️ Orqaga"]
        ],
    },
    salat: {
        text: "🥗 Salatlar:",
        buttons: [
            ["Sezar - 40 000", "Mujskoy kapris - 40 000"],
            ["Vostochniy - 40 000", "Rukola - 30 000"],
            ["Djuliya - 40 000", "Grechiskiy - 35 000"],
            ["Imosh - 40 000"],
            ["⬅️ Orqaga"]
        ],
    },
    minisalat: {
        text: "🥗 Mini salatlar:",
        buttons: [
            ["Achuchuk - 5 000", "Sveji asorti - 5 000"],
            ["Solyoney assarti - 3 000", "Qatiqli salat - 3 000"],
            ["Qatiq - 3 000", "Vitaminka - 3 000"],
            ["Suzma - 3 000", "Chiroqchi - 5 000"],
            ["⬅️ Orqaga"]
        ],
    },
};

// Menu state tracking for navigation
const menuStateParent = {
    'lavash': 'fastfood',
    'donar': 'fastfood',
    'burger': 'fastfood',
    'club': 'fastfood',
    'hotdog': 'fastfood',
    'xaggi': 'fastfood',
    'fri': 'fastfood',
    'sous': 'fastfood',
    'birinchi': 'milliy',
    'ikkinchi': 'milliy',
    'fastfood': 'main',
    'milliy': 'main',
    'osh': 'main',
    'shashlik': 'main',
    'domboq': 'main',
    'ichimlik': 'main',
    'salat': 'main',
    'minisalat': 'main',
    'admin': 'main'
};

// 🛠 Admin funksiyalari
function isAdmin(userId) {
    return userId.toString() === process.env.ADMIN_ID;
}

// 📊 Foydalanuvchi limitini boshqarish
function manageUserLimit(chatId) {
    const userCount = Object.keys(userState).length;

    // Agar limit oshsa, eng eski foydalanuvchini o'chirish
    if (userCount >= MAX_USERS) {
        const userIds = Object.keys(userState);
        const oldestUserId = userIds[0]; // Eng birinchi qo'shilgan

        // Eng eski foydalanuvchini o'chirish
        delete userState[oldestUserId];
        delete orders[oldestUserId];
        delete awaitingQuantity[oldestUserId];
        delete userContacts[oldestUserId];
        delete userLocations[oldestUserId];
        delete adminManagingStock[oldestUserId];

        console.log(`🗑 Eng eski foydalanuvchi o'chirildi: ${oldestUserId}`);
    }
}

function formatFoodName(text) {
    // "Lavash standart - 36 000" -> "Lavash standart"
    if (text.includes(" - ")) {
        return text.split(" - ")[0].trim();
    }
    return text;
}

// 🔍 Tugagan ovqat tekshirish
function isOutOfStock(foodName) {
    return outOfStock.has(foodName);
}

// 📋 Barcha ovqatlar ro'yxatini olish
function getAllFoodItems() {
    const foods = new Set();

    // Barcha menyulardan ovqatlarni yig'ish
    Object.values(menus).forEach(menu => {
        if (menu.buttons) {
            menu.buttons.forEach(row => {
                row.forEach(button => {
                    if (button.includes(" - ") && button.match(/\d+/)) {
                        const foodName = formatFoodName(button);
                        foods.add(foodName);
                    }
                });
            });
        }
    });

    return Array.from(foods).sort();
}

// 📞 Kontaktni tekshirish
function hasContact(chatId) {
    return userContacts[chatId] ? true : false;
}

// 📍 Lokatsiyani tekshirish  
function hasLocation(chatId) {
    return userLocations[chatId] ? true : false;
}

// 🚀 Bot start
bot.start((ctx) => {
    const chatId = ctx.chat.id;
    userState[chatId] = "main";
    delete awaitingQuantity[chatId];

    // Kontakt tekshirish
    if (!hasContact(chatId)) {
        const welcomeMessage = `🎉 IMOSH KAFEGA XUSH KELIBSIZ! 🎉

👋 Salom ${ctx.from.first_name}! 

🍽 BU BOT ORQALI SIZ:
• 🥘 30+ dan ortiq taomlardan tanlashingiz
• 🛒 Oson va tez buyurtma berishingiz  
• 📱 Kontakt va lokatsiyangizni ulashishingiz
• 💳 Real vaqtda narxlarni ko'rishingiz
• 🚚 Uyingizgacha tez dostavka olishingiz mumkin

💰 Dostavka: Atigi 10,000 so'm
⏰ Ish vaqti: 09:00 - 23:00 (har kuni)  
🕐 Dostavka vaqti: 30-45 daqiqa

🚨 ESLATMA: Dostavka xizmati faqat Toshkent viloyati, Chirchiq shahri uchun mavjud!

📞 Buyurtma berish uchun telefon raqamingizni ulashing:`;

        return ctx.reply(welcomeMessage, {
            reply_markup: {
                keyboard: [[{ text: "📞 Kontaktni ulashish", request_contact: true }]],
                resize_keyboard: true,
                one_time_keyboard: true
            }
        });
    }

    // Agar kontakt mavjud bo'lsa
    const returningUserMessage = `🍽 Qaytganingizdan xursandmiz, ${ctx.from.first_name}! 

🎯 TEZKOR BUYURTMA:
• Menyudan kerakli taomni tanlang
• Miqdorni belgilang  
• Savatni tekshiring
• Buyurtmani tasdiqlang

💡 Barcha ma'lumotlaringiz saqlangan, faqat taomlarni tanlashingiz kifoya!`;

    ctx.reply(returningUserMessage);

    setTimeout(() => {
        showMainMenu(ctx);
    }, 2000);
});

function showMainMenu(ctx) {
    const chatId = ctx.chat.id;
    const isUserAdmin = isAdmin(ctx.from.id);

    let welcomeText = "🍽 Quyidagi menyudan tanlang:";
    let keyboard = menus.main.buttons;

    // Admin uchun qo'shimcha tugma
    if (isUserAdmin) {
        welcomeText += "\n\n👨‍💼 Admin sifatida kirganingiz uchun maxsus funksiyalar mavjud.";
        keyboard = [...menus.main.buttons, ["👨‍💼 Admin panel"]];
    }

    ctx.reply(welcomeText, {
        reply_markup: { keyboard, resize_keyboard: true },
    });
}

function safeReply(ctx, state) {
    let currentMenu = menus[state];
    if (!currentMenu) {
        console.error("⚠️ Notanish state:", state, "chatId:", ctx.chat.id);
        userState[ctx.chat.id] = "main";
        currentMenu = menus.main;
    }

    return ctx.reply(currentMenu.text, {
        reply_markup: { keyboard: currentMenu.buttons, resize_keyboard: true }
    });
}

// 📞 Kontakt qabul qilish
bot.on('contact', (ctx) => {
    const chatId = ctx.chat.id;
    const contact = ctx.message.contact;

    manageUserLimit(chatId);

    // Kontaktni saqlash
    userContacts[chatId] = {
        phone: contact.phone_number,
        first_name: contact.first_name,
        username: ctx.from.username || null
    };

    ctx.reply("✅ Kontaktingiz qabul qilindi!\n\n🍽 Endi menyudan tanlashingiz mumkin:", {
        reply_markup: { remove_keyboard: true }
    });

    setTimeout(() => {
        showMainMenu(ctx);
    }, 1000);
});

// 📍 Lokatsiya qabul qilish
bot.on('location', (ctx) => {
    const chatId = ctx.chat.id;
    const location = ctx.message.location;

    // Lokatsiyani saqlash
    userLocations[chatId] = {
        latitude: location.latitude,
        longitude: location.longitude,
        address: `${location.latitude}, ${location.longitude}`
    };

    // Admin ga lokatsiya yuborish
    // if (process.env.ADMIN_ID) {
    //     bot.telegram.sendLocation(process.env.ADMIN_ID, location.latitude, location.longitude);
    //     bot.telegram.sendMessage(
    //         process.env.ADMIN_ID,
    //         `📍 Mijoz lokatsiyasi:\n👤 ${ctx.from.first_name}\n📞 ${userContacts[chatId]?.phone || 'N/A'}`
    //     );
    // }

    ctx.reply("✅ Lokatsiyangiz qabul qilindi!\n\n🛒 Endi buyurtmalaringizni tasdiqlashingiz mumkin.", {
        reply_markup: { remove_keyboard: true }
    });

    setTimeout(() => {
        showBasket(ctx);
    }, 1000);
});

function showBasket(ctx) {
    const chatId = ctx.chat.id;
    const basket = orders[chatId] || [];

    if (basket.length === 0) {
        return ctx.reply("🛒 Savatingiz bo'sh!", {
            reply_markup: { keyboard: menus[userState[chatId]].buttons, resize_keyboard: true },
        });
    }

    let orderTotal = 0;
    let summary = "🛒 Sizning buyurtmalaringiz:\n\n";
    basket.forEach((item, i) => {
        orderTotal += item.totalPrice;
        summary += `${i + 1}. ${item.name} x${item.quantity} = ${item.totalPrice.toLocaleString()} so'm\n`;
    });

    const totalWithDelivery = orderTotal + DELIVERY_FEE;

    summary += `\n💰 Ovqatlar: ${orderTotal.toLocaleString()} so'm`;
    summary += `\n🚚 Dostavka: ${DELIVERY_FEE.toLocaleString()} so'm`;
    summary += `\n💳 Umumiy: ${totalWithDelivery.toLocaleString()} so'm`;

    // Buyurtmani tasdiqlash tugmalari
    const confirmButtons = [
        ["✅ Buyurtmani tasdiqlash", "🗑 Savatni tozalash"],
        ["⬅️ Menyuga qaytish"]
    ];

    return ctx.reply(summary, {
        reply_markup: { keyboard: confirmButtons, resize_keyboard: true },
    });
}

// 🔄 Dinamik navigatsiya va buyurtmalar
bot.on("text", async (ctx) => {
    const chatId = ctx.chat.id;
    const text = ctx.message.text;
    const state = userState[chatId] || "main";
    const isUserAdmin = isAdmin(ctx.from.id);

    // Kontakt tekshirish
    if (!hasContact(chatId) && text !== "📞 Kontaktni ulashish") {
        return ctx.reply("📞 Iltimos, avval kontaktingizni ulashing:", {
            reply_markup: {
                keyboard: [[{ text: "📞 Kontaktni ulashish", request_contact: true }]],
                resize_keyboard: true
            }
        });
    }

    // 📞 Admin bilan bog'lanish
    if (text === "📞 Admin bilan bog'lanish") {
        const contactMessage = `📞 ADMIN BILAN BOG'LANISH\n\n`;
        const adminContact = `👨‍💼 Savollaringiz bo'lsa yoki yordam kerak bo'lsa, quyidagi raqamga qo'ng'iroq qiling:\n\n`;
        const phoneNumber = `📱 Tel: +998 99-232-33-55\n\n`;
        const workingHours = `🕐 Ish vaqti: 09:00 - 23:00 (har kuni)\n`;
        const responseTime = `⚡ Tez orada javob beramiz!`;

        return ctx.reply(contactMessage + adminContact + phoneNumber + workingHours + responseTime, {
            reply_markup: { keyboard: menus[state].buttons, resize_keyboard: true },
        });
    }

    // 👨‍💼 Admin panel
    if (text === "👨‍💼 Admin panel" && isUserAdmin) {
        userState[chatId] = "admin";
        return ctx.reply(menus.admin.text, {
            reply_markup: { keyboard: menus.admin.buttons, resize_keyboard: true },
        });
    }

    // 📋 Tugagan ovqatlar ro'yxati
    if (text === "📋 Tugagan ovqatlar ro'yxati" && isUserAdmin) {
        const outOfStockList = Array.from(outOfStock);
        let message = "📋 Tugagan ovqatlar:\n\n";

        if (outOfStockList.length === 0) {
            message += "✅ Hamma ovqatlar mavjud!";
        } else {
            outOfStockList.forEach((food, i) => {
                message += `${i + 1}. 🚫 ${food}\n`;
            });
            message += `\n📊 Jami: ${outOfStockList.length} ta ovqat tugagan`;
        }

        const adminButtons = [
            ["🔍 Ovqat qidirish", "🔄 Yangilash"],
            ["⬅️ Admin panel", "⬅️ Menyuga qaytish"]
        ];

        return ctx.reply(message, {
            reply_markup: { keyboard: adminButtons, resize_keyboard: true },
        });
    }

    // 📊 Statistika
    if (text === "📊 Statistika" && isUserAdmin) {
        const totalOrders = Object.keys(orders).length;
        const outOfStockCount = outOfStock.size;
        const totalFoodItems = getAllFoodItems().length;
        const availableFoodItems = totalFoodItems - outOfStockCount;

        // Eng ko'p buyurtma bergan foydalanuvchilar
        let totalOrdersCount = 0;
        let totalRevenue = 0;

        Object.values(orders).forEach(userOrders => {
            totalOrdersCount += userOrders.length;
            userOrders.forEach(order => {
                totalRevenue += order.totalPrice;
            });
        });

        // Dostavka daromadini qo'shish
        const deliveryRevenue = totalOrdersCount * DELIVERY_FEE;
        const grandTotal = totalRevenue + deliveryRevenue;

        let statisticsMessage = "📊 STATISTIKA\n\n";
        statisticsMessage += `👥 Faol foydalanuvchilar: ${totalOrders} ta\n`;
        statisticsMessage += `🛒 Jami buyurtmalar soni: ${totalOrdersCount} ta\n`;
        statisticsMessage += `💰 Ovqatlar daromadi: ${totalRevenue.toLocaleString()} so'm\n`;
        statisticsMessage += `🚚 Dostavka daromadi: ${deliveryRevenue.toLocaleString()} so'm\n`;
        statisticsMessage += `💎 Umumiy tushum: ${grandTotal.toLocaleString()} so'm\n\n`;
        statisticsMessage += `🍽 Jami ovqatlar: ${totalFoodItems} ta\n`;
        statisticsMessage += `✅ Mavjud ovqatlar: ${availableFoodItems} ta\n`;
        statisticsMessage += `🚫 Tugagan ovqatlar: ${outOfStockCount} ta\n\n`;

        if (outOfStockCount > 0) {
            statisticsMessage += "🚨 Tugagan ovqatlar:\n";
            Array.from(outOfStock).forEach((food, i) => {
                statisticsMessage += `${i + 1}. ${food}\n`;
            });
        }

        const adminButtons = [ // Kodning yarmi shu yerda
            ["📋 Tugagan ovqatlar ro'yxati", "🔍 Ovqat qidirish"],
            ["🔄 Yangilash", "⬅️ Admin panel"]
        ];

        return ctx.reply(statisticsMessage, {
            reply_markup: { keyboard: adminButtons, resize_keyboard: true },
        });
    }

    // 🔍 Ovqat qidirish
    if (text === "🔍 Ovqat qidirish" && isUserAdmin) {
        const allFoods = getAllFoodItems();
        let message = "🔍 Barcha ovqatlar ro'yxati:\n\n";

        allFoods.forEach((food, i) => {
            const status = isOutOfStock(food) ? "🚫" : "✅";
            message += `${i + 1}. ${status} ${food}\n`;
        });

        message += "\n💡 Ovqat nomini yozing (masalan: Lavash standart)";
        adminManagingStock[chatId] = "searching";

        const adminButtons = [
            ["📋 Tugagan ovqatlar ro'yxati"],
            ["⬅️ Admin panel"]
        ];

        return ctx.reply(message, {
            reply_markup: { keyboard: adminButtons, resize_keyboard: true },
        });
    }

    // Admin ovqat boshqaruvi
    // Admin ovqat boshqaruvi
    if (adminManagingStock[chatId] === "searching" && isUserAdmin) {
        // Agar admin panel tugmasini bosgan bo'lsa, qidiruv holatini bekor qilish
        if (text === "⬅️ Admin panel") {
            delete adminManagingStock[chatId];
            userState[chatId] = "admin";
            return ctx.reply(menus.admin.text, {
                reply_markup: { keyboard: menus.admin.buttons, resize_keyboard: true },
            });
        }

        // Agar tugagan ovqatlar ro'yxati tugmasini bosgan bo'lsa
        if (text === "📋 Tugagan ovqatlar ro'yxati") {
            delete adminManagingStock[chatId];
            // Tugagan ovqatlar ro'yxatini ko'rsatish kodi shu yerda bo'ladi
            // Bu qismni "📋 Tugagan ovqatlar ro'yxati" ishlov berish qismidan ko'chirib kelish kerak
        }

        const foodName = text.trim();
        const allFoods = getAllFoodItems();

        // Ovqat topilganini tekshirish
        const foundFood = allFoods.find(food =>
            food.toLowerCase().includes(foodName.toLowerCase()) ||
            foodName.toLowerCase().includes(food.toLowerCase())
        );

        if (!foundFood) {
            return ctx.reply(`❌ "${foodName}" nomli ovqat topilmadi.\n\n💡 Ovqat nomini to'g'ri yozing yoki quyidagi tugmalardan foydalaning:`, {
                reply_markup: {
                    keyboard: [
                        ["📋 Tugagan ovqatlar ro'yxati"],
                        ["⬅️ Admin panel"]
                    ],
                    resize_keyboard: true
                }
            });
        }

        const isCurrentlyOutOfStock = isOutOfStock(foundFood);
        adminManagingStock[chatId] = { food: foundFood };

        const status = isCurrentlyOutOfStock ? "🚫 Tugagan" : "✅ Mavjud";
        const actionButton = isCurrentlyOutOfStock ? "✅ Mavjud qilish" : "🚫 Tugagan qilish";

        return ctx.reply(`📦 Ovqat: ${foundFood}\n📊 Holati: ${status}\n\nNima qilmoqchisiz?`, {
            reply_markup: {
                keyboard: [
                    [actionButton],
                    ["🔍 Boshqa ovqat qidirish", "⬅️ Admin panel"]
                ],
                resize_keyboard: true
            }
        });
    }

    // Ovqat holatini o'zgartirish
    if ((text === "✅ Mavjud qilish" || text === "🚫 Tugagan qilish") && isUserAdmin && adminManagingStock[chatId]?.food) {
        const food = adminManagingStock[chatId].food;

        if (text === "🚫 Tugagan qilish") {
            outOfStock.add(food);
            delete adminManagingStock[chatId];
            return ctx.reply(`✅ "${food}" tugagan deb belgilandi!\n\n🚫 Endi mijozlar bu ovqatga buyurtma bera olmaydi.`, {
                reply_markup: { keyboard: menus.admin.buttons, resize_keyboard: true }
            });
        } else {
            outOfStock.delete(food);
            delete adminManagingStock[chatId];
            return ctx.reply(`✅ "${food}" mavjud deb belgilandi!\n\n🎉 Endi mijozlar bu ovqatga buyurtma bera oladi.`, {
                reply_markup: { keyboard: menus.admin.buttons, resize_keyboard: true }
            });
        }
    }

    // Miqdor kutilayotgan holatda
    if (awaitingQuantity[chatId]) {
        const quantity = parseInt(text);

        if (isNaN(quantity) || quantity <= 0) {
            return ctx.reply("❌ Iltimos, to'g'ri son kiriting (1, 2, 3...):");
        }

        if (quantity > 100) {
            return ctx.reply("❌ Maksimal miqdor 100 ta. Iltimos, kichik son kiriting:");
        }

        const item = awaitingQuantity[chatId];
        const totalPrice = item.price * quantity;

        if (!orders[chatId]) orders[chatId] = [];
        orders[chatId].push({
            name: item.name,
            price: item.price,
            quantity: quantity,
            totalPrice: totalPrice
        });

        delete awaitingQuantity[chatId];
        const basketCount = orders[chatId].reduce((sum, order) => sum + order.quantity, 0);

        return ctx.reply(
            `✅ Buyurtmangiz savatga qo'shildi!\n\n📦 ${item.name} x${quantity} = ${totalPrice.toLocaleString()} so'm\n🛒 Savatda: ${basketCount} ta mahsulot`,
            {
                reply_markup: {
                    keyboard: [
                        ["📦 Savatni ko'rish", "🛍 Buyurtma davom etish"],
                        ["⬅️ Menyuga qaytish"]
                    ],
                    resize_keyboard: true
                },
            }
        );
    }

    // Orqaga
    if (text === "⬅️ Orqaga") {
        delete adminManagingStock[chatId]; // Admin boshqaruvni bekor qilish
        const parentMenu = menuStateParent[state] || 'main';
        userState[chatId] = parentMenu;

        let keyboard = menus[parentMenu].buttons;
        // Admin uchun qo'shimcha tugma
        if (parentMenu === 'main' && isUserAdmin) {
            keyboard = [...menus[parentMenu].buttons, ["👨‍💼 Admin panel"]];
        }

        return ctx.reply(menus[parentMenu].text, {
            reply_markup: { keyboard, resize_keyboard: true },
        });
    }

    // 📦 Savatni ko'rish
    if (text === "📦 Savatni ko'rish") {
        const basket = orders[chatId] || [];
        if (basket.length === 0) {
            return ctx.reply("🛒 Savatingiz bo'sh!", {
                reply_markup: { keyboard: menus[state].buttons, resize_keyboard: true },
            });
        }

        let orderTotal = 0;
        let summary = "🛒 Sizning buyurtmalaringiz:\n\n";
        basket.forEach((item, i) => {
            orderTotal += item.totalPrice;
            summary += `${i + 1}. ${item.name} x${item.quantity} = ${item.totalPrice.toLocaleString()} so'm\n`;
        });

        const totalWithDelivery = orderTotal + DELIVERY_FEE;

        summary += `\n💰 Ovqatlar: ${orderTotal.toLocaleString()} so'm`;
        summary += `\n🚚 Dostavka: ${DELIVERY_FEE.toLocaleString()} so'm`;
        summary += `\n💳 Umumiy: ${totalWithDelivery.toLocaleString()} so'm`;

        // Buyurtmani tasdiqlash tugmalari
        const confirmButtons = [
            ["✅ Buyurtmani tasdiqlash", "🗑 Savatni tozalash"],
            ["⬅️ Menyuga qaytish"]
        ];

        return ctx.reply(summary, {
            reply_markup: { keyboard: confirmButtons, resize_keyboard: true },
        });
    }

    // Buyurtmani tasdiqlash
    if (text === "✅ Buyurtmani tasdiqlash") {
        const basket = orders[chatId] || [];
        if (basket.length === 0) {
            return ctx.reply("🛒 Savatingiz bo'sh!");
        }

        // Lokatsiyani tekshirish
        if (!hasLocation(chatId)) {
            return ctx.reply("📍 Buyurtmani tasdiqlash uchun lokatsiyangizni ulashing:", {
                reply_markup: {
                    keyboard: [[{ text: "📍 Lokatsiyani ulashish", request_location: true }]],
                    resize_keyboard: true,
                    one_time_keyboard: true
                }
            });
        }

        // Buyurtmani admin ga yuborish
        let orderTotal = 0;
        let orderSummary = `📢 YANGI BUYURTMA!\n\n`;
        orderSummary += `👤 Mijoz: ${ctx.from.first_name}`;
        if (ctx.from.username) orderSummary += ` (@${ctx.from.username})`;
        orderSummary += `\n📞 Telefon: ${userContacts[chatId]?.phone || 'N/A'}`;
        orderSummary += `\n🆔 User ID: ${ctx.from.id}\n\n🛒 Buyurtmalar:\n`;

        basket.forEach((item, i) => {
            orderTotal += item.totalPrice;
            orderSummary += `${i + 1}. ${item.name} x${item.quantity} = ${item.totalPrice.toLocaleString()} so'm\n`;
        });

        const totalWithDelivery = orderTotal + DELIVERY_FEE;

        orderSummary += `\n💰 Ovqatlar: ${orderTotal.toLocaleString()} so'm`;
        orderSummary += `\n🚚 Dostavka: ${DELIVERY_FEE.toLocaleString()} so'm`;
        orderSummary += `\n💳 UMUMIY: ${totalWithDelivery.toLocaleString()} so'm`;

        // Admin ga yuborish
        // Admin ga yuborish
        if (process.env.ADMIN_ID) {
            try {
                // Birinchi buyurtma ma'lumotlarini yuborish
                await bot.telegram.sendMessage(process.env.ADMIN_ID, orderSummary);

                // Keyin lokatsiyani yuborish
                if (userLocations[chatId]) {
                    await bot.telegram.sendLocation(
                        process.env.ADMIN_ID,
                        userLocations[chatId].latitude,
                        userLocations[chatId].longitude
                    );
                    // Lokatsiya haqida qo'shimcha ma'lumot
                    await bot.telegram.sendMessage(
                        process.env.ADMIN_ID,
                        `📍 Mijoz manzili:\n👤 ${ctx.from.first_name}\n📞 ${userContacts[chatId]?.phone || 'N/A'}`
                    );
                }
            } catch (error) {
                console.log("Admin ga xabar yuborishda xatolik:", error);
            }
        }

        // Savatni tozalash
        orders[chatId] = [];
        userState[chatId] = "main";

        let keyboard = menus.main.buttons;
        if (isUserAdmin) {
            keyboard = [...menus.main.buttons, ["👨‍💼 Admin panel"]];
        }

        return ctx.reply(
            "✅ Buyurtmangiz muvaffaqiyatli qabul qilindi!\n\n🚚 Dostavka xizmati: 10,000 so'm\n⏰ Taxminan 30-45 daqiqada yetkazib beramiz.\n\nTez orada siz bilan bog'lanamiz!",
            {
                reply_markup: { keyboard, resize_keyboard: true },
            }
        );
    }

    // Savatni tozalash
    if (text === "🗑 Savatni tozalash") {
        orders[chatId] = [];
        return ctx.reply("🗑 Savat tozalandi!", {
            reply_markup: { keyboard: menus[state].buttons, resize_keyboard: true },
        });
    }

    // Menyuga qaytish
    if (text === "⬅️ Menyuga qaytish") {
        delete adminManagingStock[chatId]; // Admin boshqaruvni bekor qilish
        userState[chatId] = "main";

        let keyboard = menus.main.buttons;
        if (isUserAdmin) {
            keyboard = [...menus.main.buttons, ["👨‍💼 Admin panel"]];
        }

        return ctx.reply(menus.main.text, {
            reply_markup: { keyboard, resize_keyboard: true },
        });
    }

    // Buyurtma davom etish - oxirgi holatga qaytish
    if (text === "🛍 Buyurtma davom etish") {
        return ctx.reply(menus[state].text, {
            reply_markup: { keyboard: menus[state].buttons, resize_keyboard: true },
        });
    }

    // 🔹 Menyu ochish - Fast food
    if (text === "🍔 Fast food") {
        userState[chatId] = "fastfood";
        return ctx.reply(menus.fastfood.text, {
            reply_markup: { keyboard: menus.fastfood.buttons, resize_keyboard: true },
        });
    }
    if (text === "Lavash") {
        userState[chatId] = "lavash";
        return ctx.reply(menus.lavash.text, {
            reply_markup: { keyboard: menus.lavash.buttons, resize_keyboard: true },
        });
    }
    if (text === "Donar") {
        userState[chatId] = "donar";
        return ctx.reply(menus.donar.text, {
            reply_markup: { keyboard: menus.donar.buttons, resize_keyboard: true },
        });
    }
    if (text === "Burger") {
        userState[chatId] = "burger";
        return ctx.reply(menus.burger.text, {
            reply_markup: { keyboard: menus.burger.buttons, resize_keyboard: true },
        });
    }
    if (text === "Club Sendvich") {
        userState[chatId] = "club";
        return ctx.reply(menus.club.text, {
            reply_markup: { keyboard: menus.club.buttons, resize_keyboard: true },
        });
    }
    if (text === "Hot-Dog") {
        userState[chatId] = "hotdog";
        return ctx.reply(menus.hotdog.text, {
            reply_markup: { keyboard: menus.hotdog.buttons, resize_keyboard: true },
        });
    }
    if (text === "Xaggi") {
        userState[chatId] = "xaggi";
        return ctx.reply(menus.xaggi.text, {
            reply_markup: { keyboard: menus.xaggi.buttons, resize_keyboard: true },
        });
    }
    if (text === "Fri") {
        userState[chatId] = "fri";
        return ctx.reply(menus.fri.text, {
            reply_markup: { keyboard: menus.fri.buttons, resize_keyboard: true },
        });
    }
    if (text === "Sous") {
        userState[chatId] = "sous";
        return ctx.reply(menus.sous.text, {
            reply_markup: { keyboard: menus.sous.buttons, resize_keyboard: true },
        });
    }

    // 🔹 Milliy taomlar
    if (text === "🍲 Milliy taomlar") {
        userState[chatId] = "milliy";
        return ctx.reply(menus.milliy.text, {
            reply_markup: { keyboard: menus.milliy.buttons, resize_keyboard: true },
        });
    }
    if (text === "Birinchi ovqat") {
        userState[chatId] = "birinchi";
        return ctx.reply(menus.birinchi.text, {
            reply_markup: { keyboard: menus.birinchi.buttons, resize_keyboard: true },
        });
    }
    if (text === "Ikkinchi ovqat") {
        userState[chatId] = "ikkinchi";
        return ctx.reply(menus.ikkinchi.text, {
            reply_markup: { keyboard: menus.ikkinchi.buttons, resize_keyboard: true },
        });
    }

    // 🔹 Milliy taomlar ichidagi Osh va Do'mboq Jo'ja
    if (text === "Osh" && state === "milliy") {
        userState[chatId] = "osh";
        return ctx.reply(menus.osh.text, {
            reply_markup: { keyboard: menus.osh.buttons, resize_keyboard: true },
        });
    }
    if (text === "Do'mboq Jo'ja" && state === "milliy") {
        userState[chatId] = "domboq";
        return ctx.reply(menus.domboq.text, {
            reply_markup: { keyboard: menus.domboq.buttons, resize_keyboard: true },
        });
    }

    // 🔹 Boshqa kategoriyalar
    if (text === "🥘 Osh") {
        userState[chatId] = "osh";
        return ctx.reply(menus.osh.text, {
            reply_markup: { keyboard: menus.osh.buttons, resize_keyboard: true },
        });
    }
    if (text === "🥩 Shashliklar") {
        userState[chatId] = "shashlik";
        return ctx.reply(menus.shashlik.text, {
            reply_markup: { keyboard: menus.shashlik.buttons, resize_keyboard: true },
        });
    }
    if (text === "🍗 Do'mboq jo'ja") {
        userState[chatId] = "domboq";
        return ctx.reply(menus.domboq.text, {
            reply_markup: { keyboard: menus.domboq.buttons, resize_keyboard: true },
        });
    }
    if (text === "🥤 Salqin ichimliklar") {
        userState[chatId] = "ichimlik";
        return ctx.reply(menus.ichimlik.text, {
            reply_markup: { keyboard: menus.ichimlik.buttons, resize_keyboard: true },
        });
    }
    if (text === "🥗 Salatlar") {
        userState[chatId] = "salat";
        return ctx.reply(menus.salat.text, {
            reply_markup: { keyboard: menus.salat.buttons, resize_keyboard: true },
        });
    }
    if (text === "🥗 Mini salatlar") {
        userState[chatId] = "minisalat";
        return ctx.reply(menus.minisalat.text, {
            reply_markup: { keyboard: menus.minisalat.buttons, resize_keyboard: true },
        });
    }

    // ✅ Buyurtma - narx bor bo'lsa
    if (text.includes(" - ") && text.match(/\d+/)) {
        const [name, priceStr] = text.split(" - ");
        const price = parseInt(priceStr.replace(/\D/g, ""));
        const foodName = name.trim();

        // Tugagan ovqatni tekshirish
        if (isOutOfStock(foodName)) {
            return ctx.reply(
                `🚫 Afsuski, "${foodName}" hozirda tugagan!\n\n💡 Boshqa ovqatlardan tanlang yoki keyinroq qayta urinib ko'ring.`,
                {
                    reply_markup: { keyboard: menus[state].buttons, resize_keyboard: true },
                }
            );
        }

        // Miqdorni so'rash
        awaitingQuantity[chatId] = { name: foodName, price };

        return ctx.reply(
            `📦 ${foodName} tanlandi (${price.toLocaleString()} so'm)\n\n🔢 Necha dona kerak? (Son yozing, masalan: 1, 2, 3...):`,
            {
                reply_markup: {
                    keyboard: [
                        ["1", "2", "3"],
                        ["4", "5", "10"],
                        ["❌ Bekor qilish"]
                    ],
                    resize_keyboard: true
                },
            }
        );
    }

    // Bekor qilish
    if (text === "❌ Bekor qilish") {
        delete awaitingQuantity[chatId];
        return ctx.reply(menus[state].text, {
            reply_markup: { keyboard: menus[state].buttons, resize_keyboard: true },
        });
    }

    // 🔄 Yangilash tugmasi
    if (text === "🔄 Yangilash" && isUserAdmin) {
        // Bu yerda admin qaysi sahifada bo'lsa, o'sha sahifani yangilaydi
        if (state === "admin") {
            return ctx.reply(menus.admin.text, {
                reply_markup: { keyboard: menus.admin.buttons, resize_keyboard: true },
            });
        }
        // Statistika sahifasini yangilash
        return ctx.reply("🔄 Ma'lumotlar yangilandi!", {
            reply_markup: {
                keyboard: [
                    ["📊 Statistika", "📋 Tugagan ovqatlar ro'yxati"],
                    ["⬅️ Admin panel"]
                ],
                resize_keyboard: true
            },
        });
    }

    // Default - noma'lum buyruq
    let keyboard = menus[state].buttons;
    if (state === 'main' && isUserAdmin) {
        keyboard = [...menus[state].buttons, ["👨‍💼 Admin panel"]];
    }

    ctx.reply("❓ Iltimos, menyudan tanlang yoki tugmalardan foydalaning.", {
        reply_markup: { keyboard, resize_keyboard: true },
    });
});

// Error handling
bot.catch((err, ctx) => {
    console.error("Bot xatoligi:", err);
    ctx.reply("❌ Xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring.");
});

// 🚀 Botni ishga tushirish
bot.launch().then(() => {
    console.log("🤖 Bot muvaffaqiyatli ishga tushdi...");
    console.log("👨‍💼 Admin ID:", process.env.ADMIN_ID);
    console.log("🚚 Dostavka narxi:", DELIVERY_FEE, "so'm");
}).catch((err) => {
    console.error("Bot ishga tushirishda xatolik:", err);
});

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));