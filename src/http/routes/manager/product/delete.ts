import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { prisma } from "../../../../lib/prisma";
import { getManagerCompanyId } from "../../../../utils/getManagerCompanyId";
import { BadRequestError } from "../../_errors/bad-request-error";

export async function managerDeleteProduct(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().delete(
    "/manager/products/:id",
    {
      schema: {
        tags: ["Manager - Products"],
        summary: "Delete a product",
        params: z.object({
          id: z.string().regex(/^\d+$/, "Invalid product ID"),
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
      const product = await prisma.product.findFirst({
        where: { id: Number(id), companyId },
      });
      if (!product) {
        throw new BadRequestError("Product not found");
      }
      await prisma.product.delete({ where: { id: Number(id) } });
      return reply.status(204).send();
    }
  );
}
