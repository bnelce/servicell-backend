import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { prisma } from "../../../../lib/prisma";
import { getManagerCompanyId } from "../../../../utils/getManagerCompanyId";

export async function managerListCustomers(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    "/manager/customers",
    {
      schema: {
        tags: ["Manager - Customers"],
        summary: "List all customers for the manager's company",
        response: {
          200: z.array(
            z.object({
              id: z.number(),
              name: z.string(),
              email: z.string().email().nullable(),
              phone: z.string().nullable(),
              address: z.string().nullable(),
              registeredAt: z.string(),
            })
          ),
        },
      },
    },
    async (request, reply) => {
      const managerId = await request.getCurrentUserId();
      const companyId = await getManagerCompanyId(managerId);
      const customers = await prisma.customer.findMany({
        where: { companyId },
      });
      const transformed = customers.map((cust) => ({
        ...cust,
        registeredAt: cust.registeredAt.toISOString(),
      }));
      return reply.send(transformed);
    }
  );
}
