import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { prisma } from "../../../../lib/prisma";
import { BadRequestError } from "../../_errors/bad-request-error";
import { getManagerCompanyId } from "../../../../utils/getManagerCompanyId";


export async function managerDeleteCustomer(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().delete(
    "/manager/customers/:id",
    {
      schema: {
        tags: ["Manager - Customers"],
        summary: "Delete a customer",
        params: z.object({
          id: z.string().regex(/^\d+$/, "Invalid customer ID"),
        }),
        response: {
          204: z.null(),
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

      await prisma.customer.delete({
        where: { id: Number(id) },
      });
      return reply.status(204).send();
    }
  );
}
