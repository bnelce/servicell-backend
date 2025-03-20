import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { prisma } from "../../../../lib/prisma";
import { getManagerCompanyId } from "../../../../utils/getManagerCompanyId";
import { BadRequestError } from "../../_errors/bad-request-error";

export async function managerGetProduct(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().get(
    "/manager/products/:id",
    {
      schema: {
        tags: ["Manager - Products"],
        summary: "Get product details",
        params: z.object({
          id: z.string().regex(/^\d+$/, "Invalid product ID"),
        }),
        response: {
          200: z.object({
            id: z.number(),
            description: z.string(),
            price: z.number(),
            stock: z.number(),
          }),
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

      const transformedProduct = {
        id: product.id,
        description: product.description,
        price: product.price.toNumber(),
        stock: product.stock,
      };

      return reply.send(transformedProduct);
    }
  );
}
