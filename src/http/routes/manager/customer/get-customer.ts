import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { prisma } from "../../../../lib/prisma";
import { BadRequestError } from "../../_errors/bad-request-error";
import { getManagerCompanyId } from "../../../../utils/getManagerCompanyId";

export async function managerGetCustomer(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    "/manager/customers/:id",
    {
      schema: {
        tags: ["Manager - Customers"],
        summary: "Get customer details",
        params: z.object({
          id: z.string().regex(/^\d+$/, "Invalid customer ID"),
        }),
        response: {
          200: z.object({
            id: z.number(),
            name: z.string(),
            email: z.string().email().nullable(), // Permite nulo
            phone: z.string().nullable(),
            address: z.string().nullable(),
            registeredAt: z.string(),
          }),
        },
      },
    },
    async (request, reply) => {
      const managerId = await request.getCurrentUserId();
      const companyId = await getManagerCompanyId(managerId);
      const { id } = request.params as { id: string };

      const customer = await prisma.customer.findFirst({
        where: { id: Number(id), companyId },
      });
      if (!customer) {
        throw new BadRequestError("Customer not found");
      }

      const { companyId: _ignore, ...customerData } = customer;

      return reply.send({
        ...customerData,
        registeredAt: customer.registeredAt.toISOString(),
      });
    }
  );
}
