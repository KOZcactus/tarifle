import path from "node:path";
import dotenv from "dotenv";
import { defineConfig } from "prisma/config";

// .env.local'ı yükle (Prisma 7 config otomatik yüklemiyor)
dotenv.config({ path: path.resolve(__dirname, "..", ".env.local") });
dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

export default defineConfig({
  schema: path.resolve(__dirname, "schema.prisma"),
  datasource: {
    url: process.env.DATABASE_URL!,
  },
});
