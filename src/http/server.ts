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
import { createCompany } from "./routes/admin/create-company";
import { getCompanies } from "./routes/admin/get-companies";
import { getCompany } from "./routes/admin/get-company";
import { updateCompany } from "./routes/admin/update-company";
import { deleteCompany } from "./routes/admin/delete-company";
import { createUser } from "./routes/admin/create-user";
import { getUsers } from "./routes/admin/get-users";
import { getUser } from "./routes/admin/get-user";
import { updateUser } from "./routes/admin/update-user";
import { deleteUser } from "./routes/admin/delete-user";
import { getServiceOrders } from "./routes/admin/get-service-orders";
import { getServiceOrder } from "./routes/admin/get-service-order";

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


if (process.env.NODE_ENV !== "test") {
  app.listen({ port: 3333 }).then(() => {
    console.log("HTTP Server running on http://localhost:3333");
  });
}
