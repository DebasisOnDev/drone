import env from "../lib/env";
import db from "./drizzle";
import * as seeds from "./seeds/drones";

if (!env.DB_SEEDING) {
  throw new Error('You must set DB_SEEDING to "true" when running seeds');
}

async function main() {
  try {
    await seeds.default(db);
    console.log("Database seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

main();
