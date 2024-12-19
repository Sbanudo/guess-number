import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
  if (event.node.req.method !== "POST") {
    setResponseStatus(event, 405);
    return { error: `Метод ${event.node.req.method} не разрешён` };
  }

  try {
    //here a lot of console.log's to test if it works
    console.log("POST /api/startGame");

    const targetNumber = Math.floor(Math.random() * 100) + 1;

    console.log("Generated number is:", targetNumber);

    const game = await prisma.game.create({
      data: {
        target: targetNumber,
        status: "active",
      },
    });

    // result
    console.log("game created:", game);

    return { gameId: game.id };
  } catch (error: any) {
    // error log
    console.error("error in API:", error);

    setResponseStatus(event, 500);
    return { error: "server error: " + error.message };
  }
});
