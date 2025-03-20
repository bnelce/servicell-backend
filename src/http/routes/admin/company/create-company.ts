import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { prisma } from "../../../../lib/prisma";

export async function createCompany(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().post(
    "/admin/companies",
    {
      schema: {
        tags: ["Admin - Companies"],
        summary: "Create a new company",
        body: z.object({
          name: z.string(),
          taxId: z.string().optional(),
          address: z.string().optional(),
          phone: z.string().optional(),
        }),
        response: {
          201: z.object({
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
      const { name, taxId, address, phone } = request.body;

      const company = await prisma.company.create({
        data: {
          name,
          taxId,
          address,
          phone,
        },
      });

      const transformedCompany = {
        ...company,
        createdAt: company.createdAt.toISOString(),
      };

      return reply.status(201).send(transformedCompany);
    }
  );
}
