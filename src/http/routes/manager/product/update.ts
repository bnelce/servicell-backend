import type { FastifyInstance } from "fastify";
import { z } from "zod";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { prisma } from "../../../../lib/prisma";
import { getManagerCompanyId } from "../../../../utils/getManagerCompanyId";
import { BadRequestError } from "../../_errors/bad-request-error";

export async function managerUpdateProduct(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().put(
    "/manager/products/:id",
    {
      schema: {
        tags: ["Manager - Products"],
        summary: "Update product details",
        params: z.object({
          id: z.string().regex(/^\d+$/, "Invalid product ID"),
        }),
        body: z.object({
          description: z.string().optional(),
          price: z.number().optional(),
          stock: z.number().optional(),
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
      const data = request.body as { description?: string; price?: number; stock?: number };

      const product = await prisma.product.findFirst({
        where: { id: Number(id), companyId },
      });
      if (!product) {
        throw new BadRequestError("Product not found");
      }
      
      const updatedProduct = await prisma.product.update({
        where: { id: Number(id) },
        data,
      });
      
      const transformedProduct = {
        id: updatedProduct.id,
        description: updatedProduct.description,
        price: updatedProduct.price.toNumber(), 
        stock: updatedProduct.stock,
      };

      return reply.send(transformedProduct);
    }
  );
}
