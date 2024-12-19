import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
export default defineEventHandler(async (event) => {
  if (event.node.req.method !== 'POST') {
    setResponseStatus(event, 405);
    return { error: `method ${event.node.req.method} not allowed` };
  }
  try {
    const { id, guess } = await readBody(event);

    const game = await prisma.game.findUnique({
      where: {
        id: id,
      },
    });
    if (!game) {
      setResponseStatus(event, 404);
      return { error: "game not found" };
    }

    if (game.status === "finished") {
      setResponseStatus(event, 400);
      return { error: "Game already finished" };
    }

    const result = guess < game.target ? "less" : guess > game.target ? "greater" : "correct";

    await prisma.attempt.create({
      data: {
        gameId: id,
        guess,
        result,
      },
    });

    if (result === "correct") {
      await prisma.game.update({
        where: {
          id: id,
        },
        data: {
          status: "finished",
        }
      })
    }

    return { result }
  } catch (error: any) {
    console.log("error, fix pls or kill me again, guess attempt") // very cool console.log, trust me
  }
})
