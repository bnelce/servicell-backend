import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { prisma } from "../../../lib/prisma";
import { hash } from "bcryptjs";
import { BadRequestError } from "../_errors/bad-request-error";

export async function createAccount(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    "/auth/users",
    {
      schema: {
        tags: ["Auth"],
        summary: "Create a new account",
        body: z.object({
          name: z.string(),
          email: z.string().email(),
          password: z.string().min(6),
        }),
        response: {
          201: z.object({
            id: z.number(),
            name: z.string(),
            email: z.string().email(),
            createdAt: z.string(),
          }),
          400: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { name, email, password } = request.body;
      
      // Verifica se já existe um usuário com o mesmo e-mail
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });
      if (existingUser) {
        throw new BadRequestError("User with the same email already exists");
      }
      
      // Gera o hash da senha
      const passwordHash = await hash(password, 6);
      
      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: passwordHash,
          role: "client", // ou outro valor conforme a lógica de negócio
        },
      });
      
      return reply.status(201).send({
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt.toISOString(),
      });
    }
  );
}
