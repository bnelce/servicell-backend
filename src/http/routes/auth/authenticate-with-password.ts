import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { prisma } from "../../../lib/prisma";
import { compare } from "bcryptjs";
import { BadRequestError } from "../_errors/bad-request-error";

export async function authenticateWithPassword(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    "/auth/sessions/password",
    {
      schema: {
        tags: ["Auth"],
        summary: "Authenticate with e-mail & password",
        body: z.object({
          email: z.string().email(),
          password: z.string(),
        }),
        response: {
          200: z.object({
            token: z.string(),
            user: z.object({
              id: z.number(),
              name: z.string(),
              email: z.string().email(),
              createdAt: z.string(),
            }),
          }),
          400: z.object({
            message: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { email, password } = request.body;
      
      const user = await prisma.user.findUnique({
        where: { email },
      });
      if (!user) {
        throw new BadRequestError("Invalid credentials");
      }
      
      // Verifica se o usuário possui senha (não utiliza login social)
      if (!user.password) {
        throw new BadRequestError("User does not have a password, use social login");
      }
      
      const isValid = await compare(password, user.password);
      if (!isValid) {
        throw new BadRequestError("Invalid credentials");
      }
      
      // Gera um token JWT (certifique-se de que o plugin JWT está configurado)
      const token = await reply.jwtSign(
        { sub: user.id.toString() },
        { sign: { expiresIn: "7d" } }
      );
      
      return reply.send({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt.toISOString(),
        },
      });
    }
  );
}
