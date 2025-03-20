import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { prisma } from "../../../lib/prisma";
import { BadRequestError } from "../_errors/bad-request-error";

export async function getCompany(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    "/admin/companies/:id",
    {
      schema: {
        tags: ["Admin - Companies"],
        summary: "Get company details",
        params: z.object({
          id: z.string().regex(/^\d+$/, "Invalid company ID"),
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

      const company = await prisma.company.findUnique({
        where: { id: Number(id) },
      });

      if (!company) {
        throw new BadRequestError("Company not found");
      }

      const transformedCompany = {
        ...company,
        createdAt: company.createdAt.toISOString(),
      };

      return reply.send(transformedCompany);
    }
  );
}
