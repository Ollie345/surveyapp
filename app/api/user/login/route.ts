import { LoginUserRequest } from "@/schema/request.schema";
import {
  errorResponse,
  generateJWT,
  serverError,
  successResponse,
} from "../../globals";
import bcrypt from "bcrypt";
import { prisma } from "../../prisma";
import { UserResponse } from "@/schema/response.schema";

export async function POST(req: Request): Promise<Response> {
  const data = (await req.json()) as LoginUserRequest;
  const user = await prisma.user.findUnique({
    where: {
      email: data.email,
    },
  });
  if (!user) {
    return errorResponse("Email or password is incorrect");
  }

  let isValidPassword = false;
  let error = "";

  bcrypt.compare(data.password, user.password, (err, result) => {
    if (err) {
      console.error(err.message);
      error = err.message;
      return;
    }
    isValidPassword = result;
  });

  if (error != "") {
    return serverError(error);
  }

  if (!isValidPassword) {
    return errorResponse("Email or password is incorrect");
  }

  const token = await generateJWT({ id: user.id, email: user.email });

  return successResponse<UserResponse>(
    {
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      token,
    },
    {
      "Set-Cookie": `token=${token}; path=/; HttpOnly; SameSite=Strict; Max-Age=2592000;`,
    }
  );
}
