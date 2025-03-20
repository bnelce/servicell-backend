import { fastifyCors } from "@fastify/cors";
import fastifyJwt from "@fastify/jwt";
import fastifyMultipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUI from "@fastify/swagger-ui";
import { fastify } from "fastify";
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  ZodTypeProvider,
} from "fastify-type-provider-zod";
import path from "path";
import { errorHandler } from "./error-handler";
import { createCompany } from "./routes/admin/company/create-company";
import { getCompanies } from "./routes/admin/company/get-companies";
import { getCompany } from "./routes/admin/company/get-company";
import { updateCompany } from "./routes/admin/company/update-company";
import { deleteCompany } from "./routes/admin/company/delete-company";
import { createUser } from "./routes/admin/user/create-user";
import { getUsers } from "./routes/admin/user/get-users";
import { getUser } from "./routes/admin/user/get-user";
import { updateUser } from "./routes/admin/user/update-user";
import { deleteUser } from "./routes/admin/user/delete-user";
import { getServiceOrders } from "./routes/admin/service-orders/get-service-orders";
import { getServiceOrder } from "./routes/admin/service-orders/get-service-order";
import { managerCreateCustomer } from "./routes/manager/customer/create-customer";
import { managerListCustomers } from "./routes/manager/customer/list-customers";
import { managerGetCustomer } from "./routes/manager/customer/get-customer";
import { managerUpdateCustomer } from "./routes/manager/customer/update-customer";
import { managerDeleteCustomer } from "./routes/manager/customer/delete-customer";
import { managerCreateService } from "./routes/manager/services/create";
import { managerListServices } from "./routes/manager/services/list";
import { managerGetService } from "./routes/manager/services/get";
import { managerUpdateService } from "./routes/manager/services/update";
import { managerDeleteService } from "./routes/manager/services/delete";
import { managerCreateProduct } from "./routes/manager/product/create";
import { managerListProducts } from "./routes/manager/product/list";
import { managerGetProduct } from "./routes/manager/product/get";
import { managerUpdateProduct } from "./routes/manager/product/update";
import { managerDeleteProduct } from "./routes/manager/product/delete";
import { managerCreateServiceOrder } from "./routes/manager/service-orders/create";
import { managerListServiceOrders } from "./routes/manager/service-orders/list";
import { managerGetServiceOrder } from "./routes/manager/service-orders/get";
import { managerUpdateServiceOrder } from "./routes/manager/service-orders/update";
import { managerDeleteServiceOrder } from "./routes/manager/service-orders/delete";

export const app = fastify().withTypeProvider<ZodTypeProvider>();

app.setSerializerCompiler(serializerCompiler);
app.setValidatorCompiler(validatorCompiler);

app.setErrorHandler(errorHandler);

app.register(fastifyStatic, {
  root: path.join(__dirname, "src/docs/diagrams"),
  prefix: "/docs/diagrams/",
});

app.register(fastifySwagger, {
  openapi: {
    info: {
      title: "SAP SaaS backend",
      description: "Full-stack SaaS with multi-tenant & RBAC.",
      version: "1.0.0",
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  transform: jsonSchemaTransform,
});

app.register(fastifySwaggerUI, {
  routePrefix: "/docs",
});

app.register(require("@fastify/env"), {
  dotenv: true,
  schema: {
    type: "object",
    required: [
      "SMTP_HOST",
      "SMTP_PORT",
      "SMTP_USER",
      "SMTP_PASS",
      "FROM_EMAIL",
      "JWT_SECRET",
      "DATABASE_URL",
      "REDIS_HOST",
      "REDIS_PORT",
    ],
    properties: {
      SMTP_HOST: { type: "string" },
      SMTP_PORT: { type: "number" },
      SMTP_USER: { type: "string" },
      SMTP_PASS: { type: "string" },
      FROM_EMAIL: { type: "string" },
      JWT_SECRET: { type: "string" },
      DATABASE_URL: { type: "string" },
      REDIS_HOST: { type: "string" },
      REDIS_PORT: { type: "number" },
    },
  },
});

app.register(fastifyJwt, {
  secret: "fb-saas-secret", //env.JWT_SECRET,
});

app.register(fastifyCors);
app.register(fastifyMultipart);

app.register(createCompany);
app.register(getCompanies);
app.register(getCompany);
app.register(updateCompany);
app.register(deleteCompany);

app.register(createUser);
app.register(getUsers);
app.register(getUser);
app.register(updateUser);
app.register(deleteUser);

app.register(getServiceOrders);
app.register(getServiceOrder);

app.register(managerCreateCustomer);
app.register(managerListCustomers);
app.register(managerGetCustomer);
app.register(managerUpdateCustomer);
app.register(managerDeleteCustomer);

app.register(managerCreateService);
app.register(managerListServices);
app.register(managerGetService);
app.register(managerUpdateService);
app.register(managerDeleteService);

app.register(managerCreateProduct);
app.register(managerListProducts);
app.register(managerGetProduct);
app.register(managerUpdateProduct);
app.register(managerDeleteProduct);

app.register(managerCreateServiceOrder);
app.register(managerListServiceOrders);
app.register(managerGetServiceOrder);
app.register(managerUpdateServiceOrder);
app.register(managerDeleteServiceOrder);



if (process.env.NODE_ENV !== "test") {
  app.listen({ port: 3333 }).then(() => {
    console.log("HTTP Server running on http://localhost:3333");
  });
}
