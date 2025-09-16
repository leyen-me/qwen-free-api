import _ from "lodash";

import Request from "@/lib/request/Request.ts";
import Response from "@/lib/response/Response.ts";
import chat from "@/api/controllers/chat.ts";

export default {
  prefix: "/v1/chat",

  post: {
    "/completions": async (request: Request) => {
      request
        .validate(
          "body.conversation_id",
          (v) => _.isUndefined(v) || _.isString(v)
        )
        .validate("body.messages", _.isArray)
        .validate("headers.authorization", _.isString);

      // 获取 authorization header，不存在则使用环境变量
      const authHeader = request.headers.authorization;
      const rawToken = authHeader || process.env.AUTHORIZATION_TOKEN;

      if (!rawToken) {
        throw new Error("Authorization token is required");
      }
      // ticket切分
      const tokens = chat.tokenSplit(rawToken);
      // 随机挑选一个ticket
      const token = _.sample(tokens);
      const {
        model,
        conversation_id: convId,
        messages,
        search_type,
        stream,
      } = request.body;
      if (stream) {
        const stream = await chat.createCompletionStream(
          model,
          messages,
          search_type,
          token,
          convId
        );
        return new Response(stream, {
          type: "text/event-stream",
        });
      } else
        return await chat.createCompletion(
          model,
          messages,
          search_type,
          token,
          convId
        );
    },
  },
};
