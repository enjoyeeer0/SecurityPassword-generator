// ============================================================
// БЕЗОПАСНОСТЬ: Используем только window.crypto.getRandomValues()
// Math.random() ЗАПРЕЩЁН для генерации паролей!
// ============================================================

/**
 * Функция генерации пароля с использованием криптографически стойкого RNG
 * @param {number} length - Длина пароля
 * @param {boolean} useUppercase - Использовать заглавные буквы
 * @param {boolean} useLowercase - Использовать строчные буквы
 * @param {boolean} useNumbers - Использовать цифры
 * @param {boolean} useSymbols - Использовать специальные символы
 * @returns {string} Сгенерированный пароль
 */
function generatePassword(length, useUppercase, useLowercase, useNumbers, useSymbols) {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*';

    let charset = '';
    if (useUppercase) charset += uppercase;
    if (useLowercase) charset += lowercase;
    if (useNumbers) charset += numbers;
    if (useSymbols) charset += symbols;

    if (charset === '') {
        return 'Выберите хотя бы один тип символов';
    }

    const charsetLength = charset.length;
    const passwordArray = new Uint8Array(length);

    // КРИТИЧЕСКОЕ: Используем window.crypto.getRandomValues для криптографической случайности
    // Это стандарт W3C и одобрено OWASP
    window.crypto.getRandomValues(passwordArray);

    let password = '';
    for (let i = 0; i < length; i++) {
        password += charset.charAt(passwordArray[i] % charsetLength);
    }

    return password;
}

/**
 * Функция оценки силы пароля
 * @param {string} password - Пароль для проверки
 * @param {number} charsetSize - Размер алфавита
 * @returns {object} Объект с информацией о силе
 */
function assessPasswordStrength(password, charsetSize) {
    const length = password.length;
    
    // Расчёт энтропии: log2(charsetSize ^ length)
    const entropy = length * Math.log2(charsetSize);

    let strength = 'Слабый';
    let percentage = 25;

    if (entropy < 32) {
        strength = 'very_weak';
        percentage = 10;
    } else if (entropy < 50) {
        strength = 'weak';
        percentage = 25;
    } else if (entropy < 60) {
        strength = 'medium';
        percentage = 50;
    } else if (entropy < 80) {
        strength = 'strong';
        percentage = 75;
    } else {
        strength = 'very_strong';
        percentage = 100;
    }

    return {
        strength: strength,
        percentage: percentage,
        entropy: entropy.toFixed(1),
        charsetSize: charsetSize
    };
}

/**
 * Обновление пароля и индикатора силы
 */
function updatePassword() {
    const length = parseInt(document.getElementById('length').value);
    const useUppercase = document.getElementById('uppercase').checked;
    const useLowercase = document.getElementById('lowercase').checked;
    const useNumbers = document.getElementById('numbers').checked;
    const useSymbols = document.getElementById('symbols').checked;

    const password = generatePassword(length, useUppercase, useLowercase, useNumbers, useSymbols);
    const passwordInput = document.getElementById('password');
    passwordInput.value = password;

    // Анимация появления пароля
    passwordInput.classList.remove('animate');
    void passwordInput.offsetWidth; // reflow для перезапуска анимации
    passwordInput.classList.add('animate');

    // Обновление индикатора силы пароля
    let charsetSize = 0;
    if (useUppercase) charsetSize += 26;
    if (useLowercase) charsetSize += 26;
    if (useNumbers) charsetSize += 10;
    if (useSymbols) charsetSize += 8;

    const strength = assessPasswordStrength(password, charsetSize);
    
    // Обновление визуального индикатора
    const strengthFill = document.getElementById('strength-indicator');
    strengthFill.style.width = strength.percentage + '%';
    
    // Цвет индикатора в зависимости от силы
    if (strength.percentage === 100) {
        strengthFill.style.background = 'linear-gradient(90deg, #28a745, #20c997)';
    } else if (strength.percentage >= 75) {
        strengthFill.style.background = 'linear-gradient(90deg, #ffc107, #28a745)';
    } else if (strength.percentage >= 50) {
        strengthFill.style.background = 'linear-gradient(90deg, #ffc107, #ff9800)';
    } else if (strength.percentage >= 25) {
        strengthFill.style.background = 'linear-gradient(90deg, #ff9800, #dc3545)';
    } else {
        strengthFill.style.background = 'linear-gradient(90deg, #dc3545, #c82333)';
    }

    document.getElementById('strength-label').textContent = 
        translations[currentLang]['strength_' + strength.strength];
    document.getElementById('strength-info-text').textContent = 
        `${Math.pow(2, strength.entropy).toExponential(1)} ${translations[currentLang].combinations}`;
}

/**
 * Копирование пароля в буфер обмена
 */
function copyToClipboard() {
    const password = document.getElementById('password').value;
    
    navigator.clipboard.writeText(password).then(() => {
        const notification = document.getElementById('notification');
        notification.classList.remove('hidden');
        
        setTimeout(() => {
            notification.classList.add('hidden');
        }, 2000);
    }).catch(err => {
        console.error('Ошибка копирования: ', err);
    });
}

/**
 * Обновление отображения значения длины
 */
function updateLengthValue() {
    document.getElementById('length-value').textContent = document.getElementById('length').value;
}

/**
 * Переключение между страницами (Генератор, Почему мы, Как это работает)
 */
function switchPage(pageName) {
    // Скрыть все страницы
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => {
        page.classList.remove('active');
    });

    // Показать выбранную страницу
    const selectedPage = document.getElementById(pageName);
    if (selectedPage) {
        selectedPage.classList.add('active');
    }

    // Обновить активную кнопку в навигации
    const navBtns = document.querySelectorAll('.nav-btn');
    navBtns.forEach(btn => {
        btn.classList.remove('active');
    });
    const activeBtn = document.querySelector(`[data-page="${pageName}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
}

/**
 * Инициализация
 */
document.addEventListener('DOMContentLoaded', () => {
    // Инициальная генерация пароля и значения
    updatePassword();
    updateLengthValue();

    // События для слайдера длины
    document.getElementById('length').addEventListener('input', () => {
        updateLengthValue();
        updatePassword();
    });

    // События для чекбоксов
    document.getElementById('uppercase').addEventListener('change', updatePassword);
    document.getElementById('lowercase').addEventListener('change', updatePassword);
    document.getElementById('numbers').addEventListener('change', updatePassword);
    document.getElementById('symbols').addEventListener('change', updatePassword);

    // Кнопка генерирования
    document.getElementById('generate-btn').addEventListener('click', updatePassword);

    // Кнопка копирования
    document.getElementById('copy-btn').addEventListener('click', copyToClipboard);

    // Навигация между страницами
    const navBtns = document.querySelectorAll('.nav-btn');
    navBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const pageName = e.target.dataset.page;
            switchPage(pageName);
        });
    });

    // По умолчанию открываем страницу генератора
    switchPage('generator');

    // Установить язык из localStorage при загрузке
    const btn = document.getElementById('lang-btn');
    btn.textContent = currentLang === 'ru' ? 'En' : 'Ru';
    applyTranslations();

    // Кнопка переключения языка
    btn.addEventListener('click', toggleLanguage);
});

// ============================================================
// СИСТЕМА ПЕРЕВОДА (i18n)
// ============================================================

let currentLang = localStorage.getItem('lang') || 'ru';

const translations = {
    en: {
        // --- WHY PAGE ---
        why_card1_title: '100% client-side',
        why_card1_text: 'All passwords are generated only in your browser. No data is sent to servers.',
        why_card2_title: 'Cryptographic strength',
        why_card2_text: 'We use window.crypto.getRandomValues() — the security standard for random number generation.',
        why_card3_title: 'No tracking',
        why_card3_text: 'No analytics, tracking, or ads. You are not tracked, your privacy is safe.',
        why_card4_title: 'Nothing is saved',
        why_card4_text: 'Passwords are not saved in localStorage, cookies, or memory. Each time — a clean generation.',
        why_card5_title: 'Open source code',
        why_card5_text: 'All code is open and verifiable. You see exactly what is used to generate passwords.',
        why_card6_title: 'Fast and simple',
        why_card6_text: 'One click — a new password is ready. No complex interface, only what you need.',
        why_table_title: 'Comparison with other generators',
        why_table_func: 'Feature',
        why_table_securepass: 'SecurePass',
        why_table_lastpass: 'LastPass',
        why_table_other: 'Others',
        why_table_row1: 'Client-side generation',
        why_table_row2: 'No tracking',
        why_table_row3: 'Open source',
        why_table_row4: 'Free',
        why_table_row5: 'No registration',
        // --- HOW PAGE ---
        how_step1_title: 'Parameter selection',
        how_step1_text: 'You choose the password length (8–32 characters) and character types: uppercase, lowercase, digits, special characters.',
        how_step2_title: 'Cryptographic generation',
        how_step2_text: '<strong>window.crypto.getRandomValues()</strong> is used to generate cryptographically strong random numbers. This is a W3C standard supported by all modern browsers.',
        how_step3_title: 'Conversion to characters',
        how_step3_text: 'Random numbers are converted to characters from the selected set. Each number corresponds to a position in the character set.',
        how_step4_title: 'Displaying the result',
        how_step4_text: 'The generated password is shown in the input field. You can copy it to the clipboard with one button.',
        how_sec_title: '🔐 Security guarantees',
        how_sec1: '<strong>No servers:</strong> All code runs locally in your browser.',
        how_sec2: '<strong>No logging:</strong> We do not see or save your passwords.',
        how_sec3: '<strong>No analytics:</strong> No Google Analytics, Yandex.Metrica, Mixpanel or other trackers.',
        how_sec4: '<strong>No cookies:</strong> Passwords are not saved in the browser between sessions.',
        how_sec5: '<strong>Standard cryptography:</strong> window.crypto.getRandomValues() — approved by OWASP and NIST.',
        how_entropy_title: '📊 About password entropy',
        how_entropy1: 'Password entropy shows how hard it is to brute-force.',
        how_entropy2: '<strong>Formula:</strong> Entropy = log₂(alphabet_size ^ password_length)',
        how_entropy3: '<strong>94 chars (letters + digits + special):</strong> 16-char password = 105 bits entropy',
        how_entropy4: '<strong>This means:</strong> 2^105 possible combinations ≈ 4 × 10³¹ combinations',
        how_entropy5: '<strong>Crack time:</strong> Even at 1 trillion attempts/sec it would take millions of years',
        how_trust_title: '✅ Why trust us?',
        how_trust1: 'We are transparent in code, secure by design, and require no trust in our servers — because there are none.',
        how_trust2: 'Open DevTools (F12) → Console and check anything. You see all network requests — there are none except page load.',
        nav_generator: 'Generator',
        nav_why: 'Why us',
        nav_how: 'How it works',
        nav_github: 'My GitHub',
        gen_subtitle: 'Create secure passwords in seconds',
        gen_copy: '📋 Copy',
        gen_copied: '✓ Password copied to clipboard!',
        gen_length: 'Password length: ',
        gen_generate: '🔄 Generate new',
        chk_upper: 'Uppercase letters (A–Z)',
        chk_lower: 'Lowercase letters (a–z)',
        chk_nums: 'Digits (0–9)',
        chk_syms: 'Special characters (!@#$%^&*)',
        tip_copy: 'Copy password to clipboard',
        tip_upper: 'Includes A–Z to strengthen password',
        tip_lower: 'Includes a–z to strengthen password',
        tip_nums: 'Adds digits for more entropy',
        tip_syms: 'Special chars significantly strengthen password',
        tip_generate: 'Create a new random password',
        why_title: 'Why choose SecurePass?',
        why_subtitle: 'We ensure maximum security and privacy',
        how_title: 'How does it work?',
        how_subtitle: 'Full transparency of the technical process',
        strength_very_weak: 'Very weak',
        strength_weak: 'Weak',
        strength_medium: 'Medium',
        strength_strong: 'Strong',
        strength_very_strong: 'Very strong',
        combinations: 'combinations'
    },
    ru: {
        // --- WHY PAGE ---
        why_card1_title: '100% на клиенте',
        why_card1_text: 'Все пароли генерируются только в вашем браузере. Никакие данные не отправляются на серверы.',
        why_card2_title: 'Криптографическая стойкость',
        why_card2_text: 'Используем window.crypto.getRandomValues() — стандарт безопасности для генерации случайных чисел.',
        why_card3_title: 'Без отслеживания',
        why_card3_text: 'Нет аналитики, отслеживания, рекламы. Вы не отслеживаетесь, ваша личная жизнь в безопасности.',
        why_card4_title: 'Ничего не сохраняется',
        why_card4_text: 'Пароли не сохраняются в localStorage, cookies или памяти. Каждый раз — чистая генерация.',
        why_card5_title: 'Откуп-исходный код',
        why_card5_text: 'Весь код открыт и проверяемый. Вы видите ровно то, что используется для генерации паролей.',
        why_card6_title: 'Быстро и просто',
        why_card6_text: 'Один клик — готов новый пароль. Без сложного интерфейса, только необходимое.',
        why_table_title: 'Сравнение с другими генераторами',
        why_table_func: 'Функция',
        why_table_securepass: 'SecurePass',
        why_table_lastpass: 'LastPass',
        why_table_other: 'Прочие',
        why_table_row1: 'Генерация на клиенте',
        why_table_row2: 'Без отслеживания',
        why_table_row3: 'Открытый исходный код',
        why_table_row4: 'Бесплатно',
        why_table_row5: 'Без регистрации',
        // --- HOW PAGE ---
        how_step1_title: 'Выбор параметров',
        how_step1_text: 'Вы выбираете длину пароля (8–32 символов) и типы символов: заглавные, строчные, цифры, специальные символы.',
        how_step2_title: 'Криптографическая генерация',
        how_step2_text: '<strong>window.crypto.getRandomValues()</strong> — используется для генерации криптографически стойких случайных чисел. Это стандарт W3C, поддерживаемый всеми современными браузерами.',
        how_step3_title: 'Преобразование в символы',
        how_step3_text: 'Случайные числа преобразуются в символы из выбранного набора. Каждое число соответствует позиции в наборе символов.',
        how_step4_title: 'Отображение результата',
        how_step4_text: 'Готовый пароль показывается в поле ввода. Вы можете скопировать его в буфер обмена одной кнопкой.',
        how_sec_title: '🔐 Гарантии безопасности',
        how_sec1: '<strong>Никаких серверов:</strong> Весь код работает локально в вашем браузере.',
        how_sec2: '<strong>Никакого логирования:</strong> Мы не видим и не сохраняем ваши пароли.',
        how_sec3: '<strong>Никакой аналитики:</strong> Нет Google Analytics, Yandex.Metrica, Mixpanel и прочих трекеров.',
        how_sec4: '<strong>Никаких cookies:</strong> Пароли не сохраняются в браузере между сеансами.',
        how_sec5: '<strong>Стандартная криптография:</strong> window.crypto.getRandomValues() — одобрено OWASP и NIST.',
        how_entropy_title: '📊 Об энтропии пароля',
        how_entropy1: 'Энтропия пароля показывает, насколько сложно его подобрать перебором.',
        how_entropy2: '<strong>Формула:</strong> Энтропия = log₂(размер_алфавита ^ длина_пароля)',
        how_entropy3: '<strong>94 символа (буквы + цифры + спецсимволы):</strong> 16-символный пароль = 105 бит энтропии',
        how_entropy4: '<strong>Это означает:</strong> 2^105 возможных комбинаций ≈ 4 × 10³¹ комбинаций',
        how_entropy5: '<strong>Время взлома:</strong> Даже при 1 триллион попыток/сек потребуется миллионы лет',
        how_trust_title: '✅ Почему вам можно верить?',
        how_trust1: 'Мы прозрачны в коде, безопасны по дизайну и не требуем от вас никакого доверия к нашим серверам — потому что их нет.',
        how_trust2: 'Откройте DevTools (F12) → Console и выполните любую проверку. Вы видите все запросы сети — их нет, кроме загрузки страницы.',
        nav_generator: 'Генератор',
        nav_why: 'Почему мы',
        nav_how: 'Как это работает',
        nav_github: 'Мой GitHub',
        gen_subtitle: 'Создавайте безопасные пароли за пару секунд',
        gen_copy: '📋 Скопировать',
        gen_copied: '✓ Пароль скопирован в буфер обмена!',
        gen_length: 'Длина пароля: ',
        gen_generate: '🔄 Сгенерировать новый',
        chk_upper: 'Заглавные буквы (A–Z)',
        chk_lower: 'Строчные буквы (a–z)',
        chk_nums: 'Цифры (0–9)',
        chk_syms: 'Специальные символы (!@#$%^&*)',
        tip_copy: 'Скопировать пароль в буфер',
        tip_upper: 'Включает A–Z для усиления пароля',
        tip_lower: 'Включает a–z для усиления пароля',
        tip_nums: 'Добавляет цифры для большей энтропии',
        tip_syms: 'Спецсимволы значительно усиливают пароль',
        tip_generate: 'Создать новый случайный пароль',
        why_title: 'Почему выбрать SecurePass?',
        why_subtitle: 'Мы обеспечиваем максимальную безопасность и приватность',
        how_title: 'Как это работает?',
        how_subtitle: 'Полная прозрачность технического процесса',
        strength_very_weak: 'Очень слабый',
        strength_weak: 'Слабый',
        strength_medium: 'Средний',
        strength_strong: 'Сильный',
        strength_very_strong: 'Очень сильный',
        combinations: 'комбинаций'
    }
};

function toggleLanguage() {
    currentLang = currentLang === 'ru' ? 'en' : 'ru';
    localStorage.setItem('lang', currentLang);
    const btn = document.getElementById('lang-btn');
    btn.textContent = currentLang === 'ru' ? 'En' : 'Ru';
    applyTranslations();
    // Обновим пароль чтобы обновить текст силы
    updatePassword();
}

function applyTranslations() {
    const t = translations[currentLang];
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (t[key] !== undefined) {
            el.textContent = t[key];
        }
    });
    // Обработка лейбла длины пароля
    const lengthLabel = document.querySelector('[data-i18n-prefix="gen_length"]');
    if (lengthLabel) {
        const val = document.getElementById('length-value').textContent;
        lengthLabel.innerHTML = t['gen_length'] + '<strong><span id="length-value">' + val + '</span></strong>';
    }
}
