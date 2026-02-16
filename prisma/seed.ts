import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.quote.create({
    data: {
      title: "The only way to do great work",
      content:
        "The only way to do great work is to love what you do. If you haven't found it yet, keep looking. Don't settle.",
      author: "Steve Jobs",
      tags: {
        connectOrCreate: [
          { where: { name: "motivation" }, create: { name: "motivation" } },
          { where: { name: "work" }, create: { name: "work" } },
        ],
      },
    },
  });
  await prisma.quote.create({
    data: {
      title: "Be the change",
      content: "Be the change that you wish to see in the world.",
      author: "Mahatma Gandhi",
      tags: {
        connectOrCreate: [
          { where: { name: "wisdom" }, create: { name: "wisdom" } },
          { where: { name: "inspiration" }, create: { name: "inspiration" } },
        ],
      },
    },
  });
  console.log("Seed completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
