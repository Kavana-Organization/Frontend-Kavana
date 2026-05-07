export function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// ---------------------------------------------------------------------------
// Registration-specific email validator (stricter than validateEmail)
// ---------------------------------------------------------------------------
const DISPOSABLE_DOMAINS = new Set([
    'mailinator.com', 'tempmail.com', 'temp-mail.org', 'throwaway.email',
    'guerrillamail.com', 'guerrillamail.net', 'guerrillamail.org',
    'guerrillamail.de', 'guerrilla.ml', 'sharklasers.com', 'grr.la',
    'guerrillamailblock.com', '10minutemail.com', '10minutemail.net',
    'minutemail.com', 'tempail.com', 'tempr.email', 'dispostable.com',
    'yopmail.com', 'yopmail.fr', 'trashmail.com', 'trashmail.net',
    'trashmail.me', 'mailnesia.com', 'maildrop.cc', 'discard.email',
    'mailsac.com', 'mohmal.com', 'getnada.com', 'tempinbox.com',
    'fakeinbox.com', 'burnermail.io', 'inboxbear.com', 'mailcatch.com',
    'meltmail.com', 'harakirimail.com', 'tmail.ws', 'mailnull.com',
    'spamgourmet.com', 'spam4.me', 'mytemp.email', 'emailondeck.com',
    'crazymailing.com', 'tmpmail.net', 'tmpmail.org',
]);

/**
 * Validates an email for registration.
 * Returns { valid: true } or { valid: false, error: 'reason' }.
 */
export function validateRegisterEmail(email) {
    if (!email || typeof email !== 'string') {
        return { valid: false, error: 'Email wajib diisi' };
    }

    const trimmed = email.trim();
    if (trimmed.length > 254) {
        return { valid: false, error: 'Email terlalu panjang' };
    }

    const atIndex = trimmed.indexOf('@');
    if (atIndex === -1 || atIndex !== trimmed.lastIndexOf('@')) {
        return { valid: false, error: 'Format email tidak valid' };
    }

    const localPart = trimmed.slice(0, atIndex);
    const domainPart = trimmed.slice(atIndex + 1).toLowerCase();

    if (localPart.length === 0 || localPart.length > 64) {
        return { valid: false, error: 'Format email tidak valid' };
    }

    // Only letters, digits, dot, underscore, dash
    if (!/^[a-zA-Z0-9._-]+$/.test(localPart)) {
        return { valid: false, error: 'Email mengandung karakter yang tidak diperbolehkan' };
    }

    if (/\.\./.test(localPart)) {
        return { valid: false, error: 'Email tidak boleh mengandung titik berturut-turut' };
    }

    if (/^[._-]/.test(localPart) || /[._-]$/.test(localPart)) {
        return { valid: false, error: 'Email tidak boleh diawali atau diakhiri simbol' };
    }

    if (domainPart.length === 0 || domainPart.length > 253) {
        return { valid: false, error: 'Domain email tidak valid' };
    }

    if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,}$/.test(domainPart)) {
        return { valid: false, error: 'Domain email tidak valid' };
    }

    if (DISPOSABLE_DOMAINS.has(domainPart)) {
        return { valid: false, error: 'Email temporary/disposable tidak diperbolehkan' };
    }

    return { valid: true };
}

export function validateNPM(npm) {
    const re = /^\d+$/;
    return re.test(npm);
}

export function validateWhatsApp(number) {
    const re = /^(\+62|62|0)8[1-9][0-9]{7,10}$/;
    return re.test(number.replace(/[\s-]/g, ''));
}

export function validatePassword(password) {
    return {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        number: /[0-9]/.test(password),
        isValid: password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password),
    };
}

export function removeAcademicTitles(name) {
    if (!name) return '';
    return name
        .replace(/,?\s*(S\.Kom|M\.Kom|M\.T|S\.T|Dr\.|Prof\.|Ir\.|S\.Si|M\.Si|S\.Pd|M\.Pd|Ph\.D)\.?/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
}
