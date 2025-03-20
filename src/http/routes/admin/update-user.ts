import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { prisma } from "../../../lib/prisma";

export async function updateUser(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().put(
    "/admin/users/:id",
    {
      schema: {
        tags: ["Admin - Users"],
        summary: "Update user details",
        params: z.object({
          id: z.string().regex(/^\d+$/, "Invalid user ID"),
        }),
        body: z.object({
          name: z.string().optional(),
          email: z.string().email().optional(),
          role: z.enum(["general_admin", "manager", "client"]).optional(),
          companyId: z.number().optional(),
        }),
        response: {
          200: z.object({
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
      const { id } = request.params as { id: string };
      const data = request.body as {
        name?: string;
        email?: string;
        role?: "general_admin" | "manager" | "client";
        companyId?: number;
      };

      const user = await prisma.user.update({
        where: { id: Number(id) },
        data,
      });

      const transformedUser = {
        ...user,
        createdAt: user.createdAt.toISOString(),
      };

      return reply.send(transformedUser);
    }
  );
}
