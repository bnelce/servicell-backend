import { hash } from "bcryptjs";
import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { prisma } from "../../../lib/prisma";
import { BadRequestError } from "../_errors/bad-request-error";

export async function createUser(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    "/admin/users",
    {
      schema: {
        tags: ["Admin - Users"],
        summary: "Create a new user",
        body: z.object({
          name: z.string(),
          email: z.string().email(),
          password: z.string().min(6),
          role: z.enum(["general_admin", "manager", "client"]),
          companyId: z.number().optional()
        }),
        response: {
          201: z.object({
            id: z.number(),
            name: z.string(),
            email: z.string().email(),
            role: z.string(),
            companyId: z.number().nullable(),
            createdAt: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { name, email, password, role, companyId } = request.body;

      const existingUser = await prisma.user.findUnique({
        where: { email },
      });
      if (existingUser) {
        throw new BadRequestError("User with the same email already exists");
      }

      const passwordHash = await hash(password, 6);

      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: passwordHash,
          role,
          companyId,
        },
      });

      const transformedUser = {
        ...user,
        createdAt: user.createdAt.toISOString(),
      };

      return reply.status(201).send(transformedUser);
    }
  );
}
