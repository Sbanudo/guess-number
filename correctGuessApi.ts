import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default defineEventHandler(async (event) => {
  if (event.node.req.method !== "POST") {
    setResponseStatus(event, 405);
    return { error: `Метод ${event.node.req.method} не разрешён` };
  }

  try {
    const { id, guess } = await readBody(event);

    if (!id || typeof guess !== "number") {
      setResponseStatus(event, 400);
      return { error: "Некорректные данные: id и guess обязательны" };
    }

    const game = await prisma.game.findUnique({
      where: {
        id: Number(id),
      },
    });

    if (!game) {
      setResponseStatus(event, 404);
      return { error: "Игра не найдена" };
    }

    if (game.status === "finished") {
      setResponseStatus(event, 400);
      return { error: "Игра уже завершена" };
    }

    // Проверяем попытку
    const result =
      guess < game.target ? "less" : guess > game.target ? "greater" : "correct";

    // Сохраняем попытку в базе данных
    await prisma.attempt.create({
      data: {
        gameId: game.id,
        guess,
        result,
      },
    });

    // Если попытка угадана, обновляем статус игры
    if (result === "correct") {
      await prisma.game.update({
        where: {
          id: game.id, // Поле ID игры
        },
        data: {
          status: "finished",
        },
      });
    }

    // Возвращаем результат попытки
    return { result };
  } catch (error: any) {
    console.error("Ошибка в обработчике попыток:", error);

    // Возвращаем сообщение об ошибке клиенту
    setResponseStatus(event, 500);
    return { error: "Ошибка сервера: " + error.message };
  }
});
