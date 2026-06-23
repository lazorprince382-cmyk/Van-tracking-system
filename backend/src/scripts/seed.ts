import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../prisma";

async function main() {
  const org = await prisma.organization.upsert({
    where: { id: "school-org-1" },
    update: { name: "The Ocean of Knowledge School" },
    create: { id: "school-org-1", name: "The Ocean of Knowledge School" },
  });

  const passwordHash = await bcrypt.hash("admin1234", 10);
  await prisma.user.upsert({
    where: { organizationId_email: { organizationId: org.id, email: "admin@school.com" } },
    update: { passwordHash, role: "ADMIN" },
    create: {
      organizationId: org.id,
      email: "admin@school.com",
      passwordHash,
      role: "ADMIN",
    },
  });

  await prisma.van.upsert({
    where: { deviceKey: "van-device-key-001" },
    update: { name: "Van A" },
    create: {
      organizationId: org.id,
      name: "Van A",
      deviceKey: "van-device-key-001",
    },
  });

  // eslint-disable-next-line no-console
  console.log("Seed complete. Admin: admin@school.com / admin1234, deviceKey: van-device-key-001");
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
