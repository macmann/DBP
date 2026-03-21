import { sanitizeGeneratedPageSchema, validateGeneratedPageSchema } from "@/lib/ai/schema";

type OpenAIPromptInput = {
  systemPrompt: string;
  userPrompt: string;
};

type OpenAIResponsePayload = {
  id?: string;
  output_text?: string;
  output?: Array<{
    type?: string;
    content?: Array<{
      type?: string;
      text?: string;
    }>;
  }>;
};

function extractJsonText(payload: OpenAIResponsePayload): string {
  if (typeof payload.output_text === "string" && payload.output_text.trim().length > 0) {
    return payload.output_text;
  }

  const textFromOutput = payload.output
    ?.flatMap((item) => item.content ?? [])
    .find((content) => content.type === "output_text" && typeof content.text === "string")?.text;

  if (textFromOutput && textFromOutput.trim().length > 0) {
    return textFromOutput;
  }

  throw new Error("OpenAI response did not include output text.");
}

export async function callOpenAIForPageSchema(input: OpenAIPromptInput) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content: [{ type: "input_text", text: input.systemPrompt }],
        },
        {
          role: "user",
          content: [{ type: "input_text", text: input.userPrompt }],
        },
      ],
      text: {
        format: {
          type: "json_object",
        },
      },
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenAI request failed (${response.status}): ${errorBody}`);
  }

  const payload = (await response.json()) as OpenAIResponsePayload;
  const jsonText = extractJsonText(payload);

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(jsonText);
  } catch {
    throw new Error("OpenAI returned non-JSON output.");
  }

  const sanitizedJson = sanitizeGeneratedPageSchema(parsedJson);
  const strictValidation = validateGeneratedPageSchema(sanitizedJson);

  if (!strictValidation.success) {
    throw new Error(
      `OpenAI JSON failed schema validation: ${strictValidation.errors.join(" | ")}`,
    );
  }

  return {
    json: sanitizedJson,
    requestId: payload.id ?? null,
  };
}
