"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.admin = void 0;
exports.admin = {
    firstname: '',
    lastname: '',
    email: process.env.ADMIN_EMAIL || '',
    meta: {
        create: {
            passwordSalt: process.env.ADMIN_PASSWORD_SALT || '',
            passwordHash: process.env.ADMIN_PASSWORD_HASH || '',
        },
    },
};
//# sourceMappingURL=admin.seed.js.map