"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const commander_1 = require("commander");
const class_validator_1 = require("class-validator");
const seeds_1 = require("./seeds");
const client_1 = require("../src/generated/prisma/client");
const program = new commander_1.Command();
program.option('--seed-only <name>', 'Specify a seed name').parse(process.argv);
const prisma = new client_1.PrismaClient();
async function main() {
    const options = program.opts();
    if (!options.seedOnly || options.seedOnly === 'admin') {
        if (await prisma.admin.count()) {
            console.log('⚠ Skipping seed for `admin`, due to non-empty table');
        }
        else {
            if ((0, class_validator_1.isEmail)(seeds_1.admin.email) &&
                seeds_1.admin.meta?.create?.passwordHash &&
                seeds_1.admin.meta.create.passwordSalt) {
                await prisma.admin.create({
                    data: seeds_1.admin,
                });
            }
            else {
                console.error(new Error('Invalid default admin credentials found'));
            }
        }
    }
}
main()
    .then(async () => {
    await prisma.$disconnect();
})
    .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
});
//# sourceMappingURL=seed.js.map