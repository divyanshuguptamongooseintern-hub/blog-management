"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const commander_1 = require("commander");
const client_1 = require("../src/generated/prisma/client");
const prisma = new client_1.PrismaClient();
const program = new commander_1.Command();
program.option('--table <name>', 'Specify a table name').parse(process.argv);
async function main() {
    console.log('Running add constraint script...');
    const options = program.opts();
    await prisma.$transaction(async (tx) => {
        const constraints = [];
        if (!options.table || options.table === 'example') {
        }
        await Promise.all(constraints.map(async (sql) => await tx.$executeRaw(sql)));
    });
    console.log('✅ The constraints has been added.');
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
//# sourceMappingURL=constraints.js.map