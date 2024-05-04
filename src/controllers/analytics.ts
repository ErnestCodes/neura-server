import { Response, Request } from "express";
import { db } from "../utils/db";
import { gemini } from "../utils/core";

export const handleAnalytics = async (req: Request, res: Response) => {
  try {
    const key = process.env.CALL_API_KEY!;
    const url = process.env.ENDPOINT!;

    const { callID, candidateId } = await req.body;

    console.log("Analytics session started...");

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

    const report = callResponse?.transcripts.map((transcript: ITranscript) => ({
      created_at: transcript?.created_at,
      text: transcript?.text,
      user: transcript?.user,
      c_id: transcript?.c_id,
      candidateId,
    }));

    await db.report.createMany({
      data: report,
    });

    const prompt = `Based on this conversations here: ${callResponse?.concatenated_transcript}, where the assitant is the recruiter and user is the candidate. Generate a general analytics on the candidate strength and weaknesses`;

    const experience = await gemini.generateContent(prompt);

    const generatedOutput = experience.response.text();

    await db.candidate.update({
      where: {
        id: candidateId,
      },
      data: {
        experience: generatedOutput,
      },
    });

    console.log("Analytics session completed...");

    return res.status(200).end();
  } catch (error: any) {
    console.log("Error processing request", error);
  }
};
