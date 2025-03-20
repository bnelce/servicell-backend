import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { prisma } from "../../../lib/prisma";

export async function updateCompany(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().put(
    "/admin/companies/:id",
    {
      schema: {
        tags: ["Admin - Companies"],
        summary: "Update company details",
        params: z.object({
          id: z.string().regex(/^\d+$/, "Invalid company ID"),
        }),
        body: z.object({
          name: z.string().optional(),
          taxId: z.string().optional(),
          address: z.string().optional(),
          phone: z.string().optional(),
        }),
        response: {
          200: z.object({
            id: z.number(),
            name: z.string(),
            taxId: z.string().nullable(),
            address: z.string().nullable(),
            phone: z.string().nullable(),
            createdAt: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const data = request.body as {
        name?: string;
        taxId?: string;
        address?: string;
        phone?: string;
      };

      const company = await prisma.company.update({
        where: { id: Number(id) },
        data,
      });

      const transformedCompany = {
        ...company,
        createdAt: company.createdAt.toISOString(),
      };

      return reply.send(transformedCompany);
    }
  );
}
