import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { prisma } from "../../../lib/prisma";

export async function getCompanies(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    "/admin/companies",
    {
      schema: {
        tags: ["Admin - Companies"],
        summary: "List all companies",
        response: {
          200: z.array(
            z.object({
              id: z.number(),
              name: z.string(),
              taxId: z.string().nullable(),
              address: z.string().nullable(),
              phone: z.string().nullable(),
              createdAt: z.string(),
            })
          ),
        },
      },
    },
    async (request, reply) => {
      const companies = await prisma.company.findMany();
      const companiesTransformed = companies.map((company) => ({
        ...company,
        createdAt: company.createdAt.toISOString(),
      }));
      return reply.send(companiesTransformed);
    }
  );
}
