import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  // datasource URL is read from schema.prisma's env("DATABASE_URL")
  // We don't use env() here to avoid crashes when DATABASE_URL
  // isn't available during postinstall on Vercel.
});
