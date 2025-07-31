

🦾 WAN 2.2 T2V Backend API Integration Guide

Strictly follow these instructions. No deviations unless authorized 

⸻

1. API Endpoint

POST
https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/video-generation/video-synthesis

Headers:
	•	Content-Type: application/json
	•	Authorization: Bearer <YOUR_API_KEY>
	•	X-DashScope-Async: enable

⸻

2. Request Body Example

{
  "model": "wan2.2-t2v-plus",
  "input": {
    "prompt": "A kitten running in the moonlight",
    "negative_prompt": "low resolution, error, worst quality"
  },
  "parameters": {
    "size": "1920x1080",         // REQUIRED: Always as WxH string (see below)
    "prompt_extend": true,       // Default: true
    "seed": 12345,               // Optional
    "watermark": false           // Default: false
  }
}


⸻

3. Supported Video Resolutions

480P:
	•	832x480 (16:9)
	•	480x832 (9:16)
	•	624x624 (1:1)

1080P:
	•	1920x1080 (16:9)
	•	1080x1920 (9:16)
	•	1440x1440 (1:1)
	•	1632x1248 (4:3)
	•	1248x1632 (3:4)

Always use the specific "size" value as shown above. Do NOT send aspect ratio or 1080P/480P as a label.

⸻

4. Prompt Fields
	•	prompt: Max 800 characters (truncate if needed)
	•	negative_prompt: Max 500 characters (optional)
	•	Both fields accept English and Chinese

⸻

5. Asynchronous Processing
	•	Initial POST returns a task_id or result_url
	•	Poll the result URL or /tasks/{task_id} until status is "SUCCEEDED"
	•	The completed response includes the downloadable video_url

⸻

6. Parameter Defaults
	•	"duration" is always 5 (fixed by model, do not modify)
	•	"prompt_extend": true (unless the user disables it)
	•	"watermark": false (unless user enables)

⸻

7. Implementation Example (TypeScript/Pseudocode)

// Create video task
const res = await fetch('https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/video-generation/video-synthesis', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.ALI_MODEL_STUDIO_API_KEY}`,
    'X-DashScope-Async': 'enable'
  },
  body: JSON.stringify({
    model: 'wan2.2-t2v-plus',
    input: {
      prompt: userPrompt,
      negative_prompt: userNegativePrompt
    },
    parameters: {
      size: selectedSize, // e.g., "1920x1080"
      prompt_extend: true,
      watermark: false
    }
  })
});
const { task_id, result_url } = await res.json();

// Poll for result
let videoUrl;
while (!videoUrl) {
  await new Promise(r => setTimeout(r, 3000));
  const pollRes = await fetch(result_url);
  const data = await pollRes.json();
  if (data.status === 'SUCCEEDED' && data.output && data.output.video_url) {
    videoUrl = data.output.video_url;
  }
}


⸻

8. Important Rules
	•	Never send size as aspect ratio or “480P/1080P”—always use width x height (e.g., "1920x1080").
	•	Never attempt to change duration—it is always 5 seconds.
	•	Do not add features or parameters unless specifically requested.
	•	If you’re unsure, ask Jake before making assumptions.

⸻

This doc is the single source of truth for backend API integration. Print it out. Tattoo it on your arm. Don’t screw it up.

⸻

Need anything else for the devs—like UI <-> backend field mapping, error message copy, or response structure? Just let me know!