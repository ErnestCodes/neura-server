import { Response, Request } from "express";
import { db } from "../utils/db";
import { gemini } from "../utils/core";

export const handleScore = async (req: Request, res: Response) => {
  try {
    const key = process.env.CALL_API_KEY!;
    const url = process.env.ENDPOINT!;

    const { callID, candidateId } = await req.body;

    console.log("Score session started...");

    if (!callID || !candidateId) {
      return res.status(401).json({ message: "Invalid request" });
    }

    const payload = {
      call_id: callID,
    };

    const response = await fetch(`${url}/logs`, {
      method: "POST",
      headers: {
        accept: "application/json",
        "Content-Type": "application/json",
        authorization: `${key}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return res.status(401).json({ message: "Invalid request" });
    }

    const callResponse = await response.json();

    await db.candidate.update({
      where: {
        id: candidateId,
      },
      data: {
        recording: callResponse?.recording_url,
      },
    });

    const report = callResponse?.transcripts.map((transcript: ITranscript) => ({
      created_at: transcript?.created_at,
      text: transcript?.text,
      user: transcript?.user,
      c_id: transcript?.c_id,
      candidateId,
    }));

    const prompt = `Based on this conversations here: ${report}, where the assitant is the recruiter and user is the candidate. Generate a score from your general accessment of the candidate.`;

    const score = await gemini.generateContent(prompt);

    const generatedOutput = score.response.text();

    await db.candidate.update({
      where: {
        id: candidateId,
      },
      data: {
        score: generatedOutput,
      },
    });

    console.log("Score session completed...");

    return res.status(200).end();
  } catch (error: any) {
    console.log("Error processing request", error);
  }
};
