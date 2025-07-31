

---

# **🦾 WAN 2.2 Image-to-Video API Integration Guide**

**Strict. Direct. No deviations unless approved**  
---

## **1\. API Endpoint**

**POST**

https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/video-generation/video-synthesis

**Headers:**

* Content-Type: application/json

* Authorization: Bearer \<YOUR\_API\_KEY\>

* X-DashScope-Async: enable

---

## **2\. Request Body Example**

{  
  "model": "wan2.2-i2v-plus",  
  "input": {  
    "prompt": "A cat running on the grass",  
    "negative\_prompt": "flowers",              // Optional, max 500 chars  
    "img\_url": "https://your-cdn/image.png"    // Required, see below for rules  
  },  
  "parameters": {  
    "resolution": "1080P",      // "480P" or "1080P" (default: 1080P)  
    "prompt\_extend": true,      // Optional, default: true  
    "seed": 12345,              // Optional, for deterministic results  
    "watermark": false          // Optional, default: false  
  }  
}  
---

## **3\. Image Requirements**

* **img\_url**: Must be publicly accessible HTTP/HTTPS URL

* **Formats**: JPEG, JPG, PNG (no alpha), BMP, WEBP

* **Resolution**: width and height between 360 and 2,000 pixels

* **File size**: ≤ 10MB

---

## **4\. Supported Video Resolutions**

**480P:**

* Typical: 640×480 (4:3)

* Model maintains *input image’s aspect ratio*; output resizes to match pixel count for selected tier

**1080P:**

* Typical: 1920×1080 (16:9)

* Aspect ratio of output ≈ aspect of input image

* Model auto-adjusts actual resolution to fit selected pixel tier and input image’s aspect

**Set "resolution" as "480P" or "1080P" (default). No custom WxH sizes.**  
---

## **5\. Prompt Fields**

* prompt: Max 800 characters (truncate if needed, optional)

* negative\_prompt: Max 500 characters (optional)

* img\_url: Required (see above)

* Both prompts accept English and Chinese

---

## **6\. Asynchronous Processing**

1. **Create Task:**

   * **POST** request as above.

   * Returns task\_id and task\_status.

2. **Poll for Results:**

   * **GET**

      https://dashscope-intl.aliyuncs.com/api/v1/tasks/{task\_id}

   * Poll every 10–15 seconds.

   * When task\_status: "SUCCEEDED", response includes video\_url (valid for 24h).

---

## **7\. Parameter Defaults**

* "duration" is always 5 (fixed, don’t modify)

* "prompt\_extend": true (default, unless user disables)

* "watermark": false (default, unless user enables)

---

## **8\. Implementation Example (TypeScript/Pseudocode)**

// 1\. Create video task  
const res \= await fetch('https://dashscope-intl.aliyuncs.com/api/v1/services/aigc/video-generation/video-synthesis', {  
  method: 'POST',  
  headers: {  
    'Content-Type': 'application/json',  
    'Authorization': \`Bearer ${process.env.DASHSCOPE\_API\_KEY}\`,  
    'X-DashScope-Async': 'enable'  
  },  
  body: JSON.stringify({  
    model: 'wan2.2-i2v-plus',  
    input: {  
      prompt: userPrompt,  
      negative\_prompt: userNegativePrompt,  
      img\_url: userImageUrl  
    },  
    parameters: {  
      resolution: selectedResolution, // "480P" or "1080P"  
      prompt\_extend: true,  
      watermark: false  
    }  
  })  
});  
const { output: { task\_id } } \= await res.json();

// 2\. Poll for result  
let videoUrl;  
while (\!videoUrl) {  
  await new Promise(r \=\> setTimeout(r, 12000)); // 12 sec  
  const pollRes \= await fetch(\`https://dashscope-intl.aliyuncs.com/api/v1/tasks/${task\_id}\`, {  
    headers: {  
      'Authorization': \`Bearer ${process.env.DASHSCOPE\_API\_KEY}\`  
    }  
  });  
  const data \= await pollRes.json();  
  if (data.output && data.output.task\_status \=== 'SUCCEEDED' && data.output.video\_url) {  
    videoUrl \= data.output.video\_url;  
  }  
}  
---

## **9\. Status Values**

* "PENDING", "RUNNING", "SUCCEEDED", "FAILED", "CANCELED", "UNKNOWN"

---

## **10\. Rules**

* **img\_url** is required, must be public, meets all spec above

* Only "480P" or "1080P" allowed for "resolution"

* **Never** attempt to change duration (always 5s)

* **Do not** implement features or params not in this doc unless specified by Jake

---

