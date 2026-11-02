// Foydalanuvchi ma'lumotlari holati
let currentUser = {
    name: "Hasan",
    surname: "Nusratullayev",
    phone: "+998 90 123 45 67",
    lang: "UZ",
    theme: "dark"
};

// Tilni tanlash
function setLang(lang) {
    currentUser.lang = lang;
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.remove('bg-goldAccent', 'text-black', 'font-bold');
        btn.classList.add('bg-gray-800', 'text-white', 'font-medium');
    });
    event.target.classList.remove('bg-gray-800', 'text-white', 'font-medium');
    event.target.classList.add('bg-goldAccent', 'text-black', 'font-bold');
}

// Ro'yxatdan o'tishni yakunlash
function completeRegistration() {
    const name = document.getElementById('reg-name').value;
    const surname = document.getElementById('reg-surname').value;
    const phone = document.getElementById('reg-phone').value;

    if(!name) {
        alert("Iltimos, ismingizni kiriting!");
        return;
    }

    currentUser.name = name;
    currentUser.surname = surname;
    if(phone) currentUser.phone = phone;

    // Avatar harfi va random rang generatsiyasi
    updateProfileUI();
    
    // Modalni yopish
    document.getElementById('auth-modal').classList.add('hidden');
}

// Profil UI yangilash
function updateProfileUI() {
    const firstLetter = currentUser.name.charAt(0).toUpperCase();
    document.getElementById('header-username').innerText = currentUser.name;
    
    const avatarEl = document.getElementById('user-avatar');
    avatarEl.innerText = firstLetter;
    
    // Random rang generatori (harf bilan bir xil bo'lmagan chiroyli fon)
    const colors = ['#8A2BE2', '#D4AF37', '#50C878', '#FF6B6B', '#483D8B', '#FF8C00'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    avatarEl.style.backgroundColor = randomColor;
}

// Tablararo o'tish
function switchTab(tabName) {
    // Barcha bo'limlarni yashirish
    document.getElementById('tab-messages').classList.add('hidden');
    document.getElementById('tab-home').classList.add('hidden');
    document.getElementById('tab-orders').classList.add('hidden');

    // Nav tugmalarini rangini tozalash
    document.getElementById('nav-messages').classList.remove('text-goldAccent', 'text-emeraldAccent');
    document.getElementById('nav-home').classList.remove('text-goldAccent', 'text-emeraldAccent');
    document.getElementById('nav-orders').classList.remove('text-goldAccent', 'text-emeraldAccent');
    document.getElementById('nav-home').classList.remove('-mt-4');

    // Tanlangan tabni ochish
    document.getElementById(`tab-${tabName}`).classList.remove('hidden');
    
    // Aktiv tabni belgilash
    const activeNav = document.getElementById(`nav-${tabName}`);
    activeNav.classList.add('text-goldAccent');
    if(tabName === 'home') {
        activeNav.classList.add('-mt-4');
    }
}

// Tarixni o'chirish tasdig'i
function confirmClearHistory() {
    if(confirm("Tarix o'chirilishini xohlaysizmi?\nBarcha buyurtmalar tarixi tozalanadi.")) {
        document.getElementById('orders-list').innerHTML = '<p class="text-center text-xs text-gray-500 py-4">Tarix bo\'shatildi (Admin panelida saqlanib qoldi).</p>';
    }
}

// Qidiruv funksiyasi (Xabarlar bo'limi uchun)
function searchUsers() {
    let query = document.getElementById('search-users').value.toLowerCase();
    // Real-time qidiruv mantig'i shu yerga yoziladi
}

// Sahifa yuklanganda ishga tushishi
window.onload = function() {
    updateProfileUI();
};
// Buyurtma modalini ochish va yopish
function openOrderModal() {
    document.getElementById('ord-name').value = currentUser.name;
    document.getElementById('ord-surname').value = currentUser.surname || '';
    document.getElementById('ord-phone').value = currentUser.phone || '';
    document.getElementById('order-modal').classList.remove('hidden');
}

function closeOrderModal() {
    document.getElementById('order-modal').classList.add('hidden');
}

// Buyurtmani yuborish va Chek hosil qilish
function submitOrder() {
    const designType = document.getElementById('ord-design-type').value;
    const designer = document.getElementById('ord-designer').value;
    const telegramUser = document.getElementById('ord-telegram').value || '@user';
    
    // Hozirgi sana va vaqtni aniqlash
    const now = new Date();
    const dateStr = String(now.getDate()).padStart(2, '0') + '.' + 
                    String(now.getMonth() + 1).padStart(2, '0') + '.' + 
                    now.getFullYear();
    const timeStr = String(now.getHours()).padStart(2, '0') + ':' + 
                    String(now.getMinutes()).padStart(2, '0');

    const randomCheckId = Math.floor(100 + Math.random() * 900);

    // Buyurtmalar ro'yxatiga chekni qo'shish
    const ordersList = document.getElementById('orders-list');
    
    // Agar oldin "Tarix bo'sh" degan yozuv bo'lsa uni tozalash
    if(ordersList.innerHTML.includes("bo'shatildi") || ordersList.innerHTML.trim() === "") {
        ordersList.innerHTML = "";
    }

    const orderCard = document.createElement('div');
    orderCard.className = "bg-gray-900 border border-gray-800 rounded-xl p-4 relative overflow-hidden transition hover:border-goldAccent";
    orderCard.innerHTML = `
        <div class="absolute top-0 right-0 bg-goldAccent text-black text-[9px] font-extrabold px-2 py-0.5 rounded-bl-lg">CHECK #${randomCheckId}</div>
        <h4 class="text-sm font-bold text-goldAccent mb-1">${designType}</h4>
        <p class="text-xs text-gray-300">Dizayner: ${designer}</p>
        <p class="text-[11px] text-gray-400 mt-1">Mijoz: ${currentUser.name} (${telegramUser})</p>
        <div class="mt-3 pt-2 border-t border-gray-800 flex justify-between text-[10px] text-gray-400">
            <span>Sana: ${dateStr} | ${timeStr}</span>
            <span class="text-emeraldAccent font-bold">Yuborildi (Kutilyapti)</span>
        </div>
    `;

    ordersList.prepend(orderCard);

    // Xabarlar bo'limiga ham real vaqtda xabar qo'shish
    const chatList = document.getElementById('users-chat-list');
    const chatItem = document.createElement('div');
    chatItem.className = "flex items-center space-x-3 p-3 bg-gray-900/40 rounded-xl border border-gray-800/60 cursor-pointer hover:border-goldAccent/50 transition";
    chatItem.innerHTML = `
        <div class="w-11 h-11 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-white">O</div>
        <div class="flex-1">
            <h4 class="text-sm font-bold">${designer}</h4>
            <p class="text-xs text-gray-400">Yangi buyurtma cheki: ${designType}</p>
        </div>
        <span class="text-[10px] text-gray-500">${timeStr}</span>
    `;
    chatList.prepend(chatItem);

    // Modalni yopish va xabar berish
    closeOrderModal();
    alert("Buyurtmangiz muvaffaqiyatli rasmiylashtirildi va dizaynerga chek yuborildi!");
}
// Sozlamalar modalini ochish va yopish
function toggleSettingsModal() {
    const modal = document.getElementById('settings-modal');
    modal.classList.toggle('hidden');
}

// Tilni almashtirish funksiyasi
function changeLanguage(lang) {
    currentUser.lang = lang;
    
    // Tugmalar rangini o'zgartirish
    ['uz', 'ru', 'eng'].forEach(l => {
        const btn = document.getElementById(`set-lang-${l}`);
        if(l === lang.toLowerCase()) {
            btn.className = "py-2 bg-goldAccent text-black font-bold rounded-lg transition";
        } else {
            btn.className = "py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition";
        }
    });
}

// Tema (Qora / Oq) rejimini almashtirish va rang kombinatsiyalarini qo'llash
function setTheme(theme) {
    currentUser.theme = theme;
    const htmlEl = document.documentElement;
    
    const darkBtn = document.getElementById('theme-dark-btn');
    const lightBtn = document.getElementById('theme-light-btn');

    if(theme === 'dark') {
        htmlEl.classList.add('dark');
        htmlEl.classList.remove('light');
        
        // Qora rejim stili (Qora, Sariq va Tillarang kombinatsiyasi)
        document.body.className = "bg-darkBg text-white transition-colors duration-300 font-sans flex flex-col h-screen overflow-hidden";
        
        darkBtn.className = "py-2.5 bg-black text-goldAccent border border-goldAccent/50 font-bold rounded-lg flex items-center justify-center space-x-2 transition";
        lightBtn.className = "py-2.5 bg-gray-800 text-gray-400 border border-transparent font-medium rounded-lg flex items-center justify-center space-x-2 transition";
    } else {
        htmlEl.classList.remove('dark');
        htmlEl.classList.add('light');
        
        // Oq rejim stili (Oq va Zumrad rang kombinatsiyasi)
        document.body.className = "bg-white text-gray-900 transition-colors duration-300 font-sans flex flex-col h-screen overflow-hidden";
        
        lightBtn.className = "py-2.5 bg-white text-emeraldAccent border border-emeraldAccent/50 font-bold rounded-lg flex items-center justify-center space-x-2 transition shadow-sm";
        darkBtn.className = "py-2.5 bg-gray-200 text-gray-600 border border-transparent font-medium rounded-lg flex items-center justify-center space-x-2 transition";
    }
}
// Profil modalini ochish va yopish
function openProfileModal() {
    document.getElementById('edit-profile-name').value = currentUser.name;
    document.getElementById('edit-profile-surname').value = currentUser.surname || '';
    document.getElementById('edit-profile-phone').value = currentUser.phone || '';
    
    // Modal ichidagi avatar va ismni yangilash
    document.getElementById('modal-display-name').innerText = currentUser.name + (currentUser.surname ? ' ' + currentUser.surname : '');
    const modalAvatar = document.getElementById('modal-user-avatar');
    modalAvatar.innerText = currentUser.name.charAt(0).toUpperCase();
    modalAvatar.style.backgroundColor = document.getElementById('user-avatar').style.backgroundColor;

    document.getElementById('profile-modal').classList.remove('hidden');
}

function toggleProfileModal() {
    document.getElementById('profile-modal').classList.toggle('hidden');
}

// Profil o'zgarishlarini saqlash va UI'da real-time yangilash
function saveProfileChanges() {
    const newName = document.getElementById('edit-profile-name').value.trim();
    const newSurname = document.getElementById('edit-profile-surname').value.trim();
    const newPhone = document.getElementById('edit-profile-phone').value.trim();

    if(!newName) {
        alert("Ism bo'sh bo'lishi mumkin emas!");
        return;
    }

    currentUser.name = newName;
    currentUser.surname = newSurname;
    if(newPhone) currentUser.phone = newPhone;

    // Asosiy header va avatar ma'lumotlarini yangilash
    updateProfileUI();

    // Modalni yopish
    toggleProfileModal();
    alert("Profilingiz muvaffaqiyatli yangilandi va qidiruv tizimiga moslashtirildi!");
}