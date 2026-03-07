import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import {
  STORY_SCENE_REQUEST_SCHEMA,
  normalizeGeneratedStoryScenePlan,
} from "@/lib/story-prompt-generator";

const requestSchema = z.object({
  prompt: z.string().trim().min(1).max(2000),
  canvasWidth: z.number().min(64).max(4096),
  canvasHeight: z.number().min(64).max(4096),
  durationMs: z.number().min(250).max(300000),
});

function buildScenePrompt(input: z.infer<typeof requestSchema>) {
  return [
    "You generate scene plans for a 2D animation editor.",
    "Return one JSON object only.",
    "Design a complete short scene that uses layered backgrounds, character staging, props, parallax, and motion keyframes.",
    "The platform supports shape nodes with optional face, limbs, accessories, transform, animation tracks, and expression keys.",
    "Prefer 3 layers and 3-7 nodes total.",
    "Use ids hero and partner for the two main characters when appropriate.",
    "Keyframes must be in milliseconds within the scene duration.",
    "Use x/y coordinates relative to canvas center.",
    "Keep shapes readable and stylized rather than photorealistic.",
    `Canvas width: ${input.canvasWidth}px.`,
    `Canvas height: ${input.canvasHeight}px.`,
    `Scene duration: ${Math.max(2000, input.durationMs)}ms.`,
    `User prompt: ${input.prompt}`,
  ].join("\n");
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = requestSchema.parse(await req.json());
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is not configured" },
        { status: 503 }
      );
    }

    const model = process.env.OPENAI_SCENE_MODEL || "gpt-4.1-mini";
    const openAiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.9,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You are a creative scene planner for a stylized 2D animation editor. Produce compact, valid JSON that matches the requested schema and uses the editor's animation capabilities effectively.",
          },
          {
            role: "user",
            content: `${buildScenePrompt(payload)}\n\nSchema:\n${JSON.stringify(
              STORY_SCENE_REQUEST_SCHEMA
            )}`,
          },
        ],
      }),
    });

    if (!openAiRes.ok) {
      const details = await openAiRes.text();
      return NextResponse.json(
        {
          error: "OpenAI scene generation failed",
          details: process.env.NODE_ENV === "development" ? details : undefined,
        },
        { status: 502 }
      );
    }

    const completion = (await openAiRes.json()) as {
      choices?: Array<{
        message?: {
          content?: string;
        };
      }>;
    };

    const content = completion.choices?.[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { error: "OpenAI returned an empty scene response" },
        { status: 502 }
      );
    }

    const raw = JSON.parse(content) as unknown;
    const plan = normalizeGeneratedStoryScenePlan(raw, payload.prompt, payload);

    return NextResponse.json({
      plan,
      source: "openai",
      model,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid scene generation request", issues: error.issues },
        { status: 400 }
      );
    }

    console.error("POST /api/ai/scene failed", error);
    return NextResponse.json(
      {
        error: "Failed to generate scene",
        details:
          process.env.NODE_ENV === "development"
            ? error instanceof Error
              ? error.message
              : String(error)
            : undefined,
      },
      { status: 500 }
    );
  }
}
