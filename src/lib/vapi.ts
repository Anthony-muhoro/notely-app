import Vapi from "@vapi-ai/web";
let vapi: Vapi | null = null;
let isInitialized = false;
let activeCallId: string | null = null;
let currentAssistantType: "default" | "explain" | "pdf" = "default";
const generateCallId = (): string => Date.now().toString();

const setupEventListeners = (): void => {
  if (!vapi) return;
  vapi.removeAllListeners();
  vapi.on("call-start", () => {
    console.log("Voice call started");
    activeCallId = generateCallId();
  });

  vapi.on("call-end", () => {
    console.log("Voice call ended");
    activeCallId = null;
    currentAssistantType = "default";
  });

  vapi.on("speech-start", () => {
    console.log("User started speaking");
  });

  vapi.on("speech-end", () => {
    console.log("User stopped speaking");
  });

  vapi.on("error", (error: any) => {
    console.error("Vapi error:", error);
    activeCallId = null;
    currentAssistantType = "default";
  });
};

const createBaseVoiceConfig = () => ({
  provider: "11labs" as const,
  voiceId: "cgSgspJ2msm6clMCkdW9",
  stability: 0.7,
  similarityBoost: 0.8,
  style: 0.3,
});

const createBaseTranscriberConfig = () => ({
  provider: "deepgram" as const,
  model: "nova-2",
  language: "en-US" as const,
});

// Clean content for voice - remove markdown and special characters that sound weird when spoken
const cleanContentForVoice = (content: string): string => {
  if (!content) return "No content available";
  
  let cleaned = content;
  
  // Remove markdown headers (# ## ###)
  cleaned = cleaned.replace(/^#{1,6}\s+/gm, "");
  
  // Remove markdown bold/italic (**text**, *text*, __text__, _text_)
  cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, "$1");
  cleaned = cleaned.replace(/\*([^*]+)\*/g, "$1");
  cleaned = cleaned.replace(/__([^_]+)__/g, "$1");
  cleaned = cleaned.replace(/_([^_]+)_/g, "$1");
  
  // Remove markdown code blocks (```code``` and `code`)
  cleaned = cleaned.replace(/```[\s\S]*?```/g, "");
  cleaned = cleaned.replace(/`([^`]+)`/g, "$1");
  
  // Remove markdown links [text](url) -> text
  cleaned = cleaned.replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1");
  
  // Remove markdown images ![alt](url)
  cleaned = cleaned.replace(/!\[([^\]]*)\]\([^\)]+\)/g, "");
  
  // Remove markdown lists markers (-, *, +, 1.)
  cleaned = cleaned.replace(/^[\s]*[-*+]\s+/gm, "");
  cleaned = cleaned.replace(/^\d+\.\s+/gm, "");
  
  // Remove HTML tags
  cleaned = cleaned.replace(/<[^>]*>/g, "");
  
  // Remove excessive whitespace and newlines
  cleaned = cleaned.replace(/\n{3,}/g, "\n\n");
  cleaned = cleaned.replace(/\s{2,}/g, " ");
  
  // Remove special markdown characters that sound weird
  cleaned = cleaned.replace(/[#*_`~]/g, "");
  
  return cleaned.trim();
};
// Navigation routes mapping
const routeMappings: Record<string, string> = {
  "my notes": "/dashboard",
  "dashboard": "/dashboard",
  "home": "/dashboard",
  "new note": "/new",
  "new entry": "/new",
  "create note": "/new",
  "pinned": "/pinned",
  "pinned notes": "/pinned",
  "bookmarks": "/bookmarks",
  "bookmarked": "/bookmarks",
  "bookmarked notes": "/bookmarks",
  "trash": "/trash",
  "deleted": "/trash",
  "public": "/public",
  "public notes": "/public",
  "profile": "/profile",
  "change password": "/change-password",
  "pdf chat": "/pdf-chat",
  "pdfs": "/pdf-chat",
};

// Page information for context-aware assistance
const pageInformation: Record<string, string> = {
  "/dashboard": "You are on the My Notes page. This page displays all of the user's notes in a grid layout. Users can view, edit, or delete their notes from here. You can help them navigate to specific notes or create new ones.",
  "/new": "You are on the New Note page. This is where users create new notes. They can add a title, synopsis, and content. AI assistance is available to help rewrite or enhance the note content.",
  "/edit": "You are on the Edit Note page. This page allows users to modify existing notes. They can update the title, synopsis, content, and change the public/private status of the note.",
  "/pinned": "You are on the Pinned Notes page. This page shows all notes that have been pinned for quick access. Users can unpin notes from here.",
  "/bookmarks": "You are on the Bookmarked Notes page. This page displays all notes that have been bookmarked for later reference. Users can remove bookmarks from here.",
  "/trash": "You are on the Trash page. This page shows all deleted notes. Users can restore deleted notes or permanently delete them from here.",
  "/public": "You are on the Public Notes page. This page displays all public notes shared by all users in the platform. Users can browse and view public content here.",
  "/profile": "You are on the Profile page. This page allows users to update their profile information including first name, last name, username, email, and profile picture.",
  "/change-password": "You are on the Change Password page. This page allows users to update their account password for security purposes.",
  "/pdf-chat": "You are on the PDF Chat page. This page allows users to upload PDF documents and chat with them using AI. Users can ask questions about PDF content and get answers.",
};

const userOtherInquery = `
Be conversational, warm, and helpful. Keep responses concise and natural. When the user asks to navigate to a page or go somewhere, use the navigate function to take them there.

Available navigation options:
- "my notes" or "dashboard" -> Go to My Notes page
- "new note" or "new entry" -> Go to Create New Note page
- "pinned" or "pinned notes" -> Go to Pinned Notes page
- "bookmarks" or "bookmarked notes" -> Go to Bookmarked Notes page
- "trash" or "deleted" -> Go to Trash page
- "public" or "public notes" -> Go to Public Notes page
- "profile" -> Go to Profile page
- "change password" -> Go to Change Password page
- "pdf chat" or "pdfs" -> Go to PDF Chat page

If the user asks how to create a new note, you can either explain the process or offer to navigate them to the new note page. If the user asks how to view notes, you can navigate them to the My Notes page. If the user asks about the Notely app, respond: Notely lets you create, save, and share notes on the public page. You can pin and unpin notes for easy access. To update your profile (profile image, first name, last name), go to the Profile page. To change your password, visit the Change Password page. If the user asks who created you, respond: I was created by a dedicated engineer named Anthony Muhoro. If the user asks to tell more about the engineer, respond: He is a hardworking young man obsessed with tech. Always end with: Would you like me to help you with any of these features?`;

const createDefaultAssistantConfig = (
  user: { firstName: string },
  currentPath?: string
): any => {
  const pageInfo = currentPath
    ? pageInformation[currentPath] || `You are on the ${currentPath} page.`
    : "You are assisting the user with their note-taking needs.";

  return {
    model: {
      provider: "openai" as const,
      model: "gpt-4" as const,
      messages: [
        {
          role: "system" as const,
          content: `You are Notely, a friendly voice assistant for a note-taking app.
        
Current Page Context: ${pageInfo}

${userOtherInquery}

When users ask about the current page, use the page context above to provide helpful information. Be aware that navigation between pages should be smooth - you can help users understand what they can do on each page.
`,
        },
      ],
    tools: [
      {
        type: "function" as const,
        function: {
          name: "navigate",
          description: "Navigate to a page in the application based on user's request. Use this when the user asks to go to a page, open a section, or visit a feature.",
          parameters: {
            type: "object" as const,
            properties: {
              path: {
                type: "string" as const,
                description: "The route path to navigate to. Available paths: /dashboard (My Notes), /new (New Note), /pinned (Pinned Notes), /bookmarks (Bookmarked Notes), /trash (Trash), /public (Public Notes), /profile (Profile), /change-password (Change Password), /pdf-chat (PDF Chat)",
                enum: ["/dashboard", "/new", "/pinned", "/bookmarks", "/trash", "/public", "/profile", "/change-password", "/pdf-chat"],
              },
            },
            required: ["path"] as const,
          },
        },
      },
    ],
  },
    voice: createBaseVoiceConfig(),
    transcriber: createBaseTranscriberConfig(),
    firstMessage: `Hi! ${user.firstName}I'm Notely, your voice assistant. How can I help you today?`,
    clientMessages: ["tool-calls"],
  };
};

const createExplainNoteAssistantConfig = (
  user: { firstName: string },
  noteTitle: string,
  noteContent: string,
  noteCreated: string,
  noteUpdated: string
): any => {
  // Clean content for voice - remove markdown and HTML
  let cleaned = cleanContentForVoice(noteContent);
  
  // Limit length
  const preparedContent = cleaned.length > 1000
    ? `${cleaned.substring(0, 1000)}... [content truncated]`
    : cleaned;
  const createdDate = new Date(noteCreated).toLocaleDateString();
  const updatedDate = new Date(noteUpdated).toLocaleDateString();

  return {
    model: {
      provider: "openai" as const,
      model: "gpt-4" as const,
      messages: [
        {
          role: "system" as const,
          content: `You are a helpful AI assistant named Notely AI Assistance who explains notes to users. you should be very friendly include laughs when needed. do not overdo.

If asked who created you, reply: "I was created by Wanjiku Muhoro Anthony."

If asked your name, reply: "I am Notely AI Assistance."

If asked about the Notely app, explain: "With Notely, you can create, share, and view notes easily. I can navigate you to any page if you'd like."

When giving instructions, always use numbered steps (1, 2, 3) instead of hashtags or bullet points.
          
Note Details:
- Title: ${noteTitle || "Untitled Note"}
- Created: ${createdDate} read them in a good way like second june of 2025 like that
- Last Updated: ${updatedDate} read them in a good way like second june of 2025 like that
- Created by: ${user.firstName} 

Your task is to help the user understand this note. Be clear, concise, and focus on explaining the key points. 
If the note is technical, break down complex concepts. If it's a personal note, help organize and clarify the thoughts.

Note Content:
${preparedContent}

Guidelines:
1. Start with a brief summary of the note
2. Explain key points in simple terms
3. Highlight any important details or action items
4. Keep explanations conversational and easy to understand
5. If the note is incomplete or unclear, mention that and suggest what might be missing
6. if the user Asks anything related to ${userOtherInquery} be free to explain to them.
7. If the user asks to navigate somewhere, use the navigate function to take them there.
`,
        },
      ],
      tools: [
        {
          type: "function" as const,
          function: {
            name: "navigate",
            description: "Navigate to a page in the application based on user's request.",
            parameters: {
              type: "object",
              properties: {
                path: {
                  type: "string",
                  description: "The route path to navigate to. Available paths: /dashboard (My Notes), /new (New Note), /pinned (Pinned Notes), /bookmarks (Bookmarked Notes), /trash (Trash), /public (Public Notes), /profile (Profile), /change-password (Change Password), /pdf-chat (PDF Chat)",
                  enum: ["/dashboard", "/new", "/pinned", "/bookmarks", "/trash", "/public", "/profile", "/change-password", "/pdf-chat"],
                },
              },
              required: ["path"],
            },
          },
        },
      ],
    },
    voice: createBaseVoiceConfig(),
    transcriber: createBaseTranscriberConfig(),
    firstMessage: `Hi! ${user.firstName} . I can see that you have opened a note with the title, ${noteTitle}. so tell me. what help can I offer to you?`,
    clientMessages: ["tool-calls"],
  };
};

const cleanupVapi = (): void => {
  if (vapi) {
    try {
      vapi.stop();
      vapi.removeAllListeners();
    } catch (error) {
      console.warn("Error during VAPI cleanup:", error);
    }
  }
  vapi = null;
  activeCallId = null;
  currentAssistantType = "default";
  isInitialized = false;
};
export const initializeVapi = (): boolean => {
  if (isInitialized && vapi) {
    return true;
  }

  const publicKey = import.meta.env.VITE_VAPI_PUBLIC_KEY;
  if (!publicKey) {
    console.error("Missing VITE_VAPI_PUBLIC_KEY environment variable");
    return false;
  }

  try {
    cleanupVapi();

    vapi = new Vapi(publicKey);
    setupEventListeners();
    isInitialized = true;
    return true;
  } catch (error) {
    console.error("Failed to initialize Vapi:", error);
    return false;
  }
};

// Fixed function - changed parameter type and usage
export const startVapiCall = async (
  user: { firstName: string },
  currentPath?: string
): Promise<boolean> => {
  if (!vapi || !isInitialized) {
    console.error("Vapi not initialized. Call initializeVapi() first.");
    return false;
  }

  // If call is already active, just update context instead of restarting
  if (activeCallId && currentAssistantType === "default") {
    console.log("Call already active, updating context for smooth navigation");
    // Don't restart - let it continue for smooth navigation
    return true;
  }

  // Only stop if switching to a different assistant type
  if (activeCallId && currentAssistantType !== "default") {
    console.warn("Call already active with different type, stopping previous call");
    await stopVapiCall();
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  try {
    const assistant = createDefaultAssistantConfig(user, currentPath);
    await vapi.start(assistant as any);
    currentAssistantType = "default";
    return true;
  } catch (error) {
    console.error("Failed to start Vapi call:", error);
    return false;
  }
};

export const startExplainNoteCall = async (
  user: { firstName: string },
  noteTitle: string,
  noteContent: string,
  noteCreated: string,
  noteUpdated: string
): Promise<boolean> => {
  if (!vapi || !isInitialized) {
    console.error("Vapi not initialized. Call initializeVapi() first.");
    return false;
  }

  // Prevent multiple concurrent calls
  if (activeCallId) {
    console.warn("Call already active, stopping previous call");
    await stopVapiCall();
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  try {
    const assistant = createExplainNoteAssistantConfig(
      user,
      noteTitle,
      noteContent,
      noteCreated,
      noteUpdated
    );
    await vapi.start(assistant as any);
    currentAssistantType = "explain";
    return true;
  } catch (error) {
    console.error("Failed to start explain note call:", error);
    return false;
  }
};

const createPdfAssistantConfig = (
  user: { firstName: string },
  pdfFileName: string,
  pdfContent: string,
  pageCount: number,
  pdfImages: string[] = [],
  imageAnalysis?: string | null
): any => {
  // Clean content for voice - remove markdown and special characters
  let cleaned = cleanContentForVoice(pdfContent);
  
  // Allow more content for PDF discussion (up to 8000 characters)
  const cleanContent = cleaned.length > 8000
    ? `${cleaned.substring(0, 8000)}... [content truncated - showing first 8000 characters]`
    : cleaned;

  // Get API base URL for function calling
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

  // Build system message content
  const systemContent = `You are Notely AI, a helpful voice assistant that helps users understand and discuss PDF documents. Be friendly, conversational, and natural.

If asked who created you, reply: "I was created by Wanjiku Muhoro Anthony."

If asked your name, reply: "I am Notely AI Assistance."

PDF Document Information:
- File Name: ${pdfFileName}
- User: ${user.firstName}

You are a knowledgeable assistant who has already read and understood this PDF document completely, including all visual content. Help users naturally without mentioning technical details.

PDF Content:
${cleanContent}

${imageAnalysis ? `\nGEMINI IMAGE ANALYSIS (Pre-analyzed and ready):
The images in this PDF have already been analyzed by Gemini 3.0 Flash. Here's what's in the images:

${imageAnalysis}

IMPORTANT: Use the analysis above when users ask about visual content (charts, graphs, diagrams, images, tables, figures). The analysis is already complete - you don't need to analyze anything. Just reference this analysis naturally when discussing visual content.` : pdfImages.length > 0 ? `\nNote: This PDF contains ${pdfImages.length} page images, but analysis is not yet available.` : ''}

Guidelines for PDF Discussion:
1. Answer all questions based on the PDF content and image analysis provided above
2. When users ask about visual content, use the pre-analyzed Gemini analysis naturally - it's already available above
3. Respond naturally and conversationally as if you've already seen and understood all the images
4. Never mention technical details like "I'm analyzing" or "the AI analyzed" - just use the analysis naturally
5. Never mention page counts, image counts, or technical metadata unless specifically asked
6. If information is not in the PDF, clearly state: "This information is not available in the PDF document"
7. Provide clear summaries when asked - cover key points and main topics
8. Explain complex concepts in simple, conversational terms
9. Be helpful and engaging - ask follow-up questions if helpful
10. When giving instructions or lists, use numbered steps (1, 2, 3) instead of bullet points
11. Act like you've already read and understood the entire document completely - you have all the information

${userOtherInquery}
`;

  // Build system message
  const systemMessage = {
    role: "system" as const,
    content: systemContent,
  };

  // No function calling needed - image analysis is pre-computed and stored
  // VAPI has immediate access to Gemini's analysis through the system message

  return {
    model: {
      provider: "openai" as const,
      model: "gpt-4o" as const,
      messages: [systemMessage],
      tools: [
        {
          type: "function" as const,
          function: {
            name: "navigate",
            description: "Navigate to a page in the application based on user's request.",
            parameters: {
              type: "object",
              properties: {
                path: {
                  type: "string",
                  description: "The route path to navigate to. Available paths: /dashboard (My Notes), /new (New Note), /pinned (Pinned Notes), /bookmarks (Bookmarked Notes), /trash (Trash), /public (Public Notes), /profile (Profile), /change-password (Change Password), /pdf-chat (PDF Chat)",
                  enum: ["/dashboard", "/new", "/pinned", "/bookmarks", "/trash", "/public", "/profile", "/change-password", "/pdf-chat"],
                },
              },
              required: ["path"],
            },
          },
        },
      ],
    },
    voice: createBaseVoiceConfig(),
    transcriber: createBaseTranscriberConfig(),
    firstMessage: `Hi ${user.firstName}! I'm here to help you understand "${pdfFileName}". What would you like to know about it?`,
    clientMessages: ["tool-calls"],
  };
};

export const startPdfCall = async (
  user: { firstName: string },
  pdfFileName: string,
  pdfContent: string,
  pageCount: number,
  pdfImages: string[] = [],
  imageAnalysis?: string | null
): Promise<boolean> => {
  if (!vapi || !isInitialized) {
    console.error("Vapi not initialized. Call initializeVapi() first.");
    return false;
  }

  // Prevent multiple concurrent calls
  if (activeCallId) {
    console.warn("Call already active, stopping previous call");
    await stopVapiCall();
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  try {
    const assistant = createPdfAssistantConfig(
      user,
      pdfFileName,
      pdfContent,
      pageCount,
      pdfImages,
      imageAnalysis
    );
    await vapi.start(assistant as any);
    currentAssistantType = "pdf";
    return true;
  } catch (error) {
    console.error("Failed to start PDF call:", error);
    return false;
  }
};

export const stopVapiCall = async (): Promise<boolean> => {
  if (!vapi) {
    console.warn("No Vapi instance to stop");
    return false;
  }

  try {
    await vapi.stop();
    activeCallId = null;
    currentAssistantType = "default";
    return true;
  } catch (error) {
    console.error("Failed to stop Vapi call:", error);
    return false;
  }
};

export const sayMessage = (message: string): boolean => {
  if (!vapi || !activeCallId) {
    console.warn("No active call to send message to");
    return false;
  }

  try {
    vapi.say(message);
    return true;
  } catch (error) {
    console.error("Failed to say message:", error);
    return false;
  }
};

export const getVapiInstance = (): Vapi | null => {
  return vapi;
};

export const isCallActive = (): boolean => {
  return activeCallId !== null;
};

export const getCurrentAssistantType = (): "default" | "explain" | "pdf" => {
  return currentAssistantType;
};

export const getCallId = (): string | null => {
  return activeCallId;
};

export const isVapiInitialized = (): boolean => {
  return isInitialized && vapi !== null;
};

export const reinitializeVapi = (): boolean => {
  cleanupVapi();
  return initializeVapi();
};

export const destroyVapi = (): void => {
  cleanupVapi();
};

// Export navigation helper to get route path from user input
export const getNavigationPath = (userInput: string): string | null => {
  const normalizedInput = userInput.toLowerCase().trim();
  
  // Direct path match
  if (routeMappings[normalizedInput]) {
    return routeMappings[normalizedInput];
  }
  
  // Partial matches
  for (const [key, path] of Object.entries(routeMappings)) {
    if (normalizedInput.includes(key) || key.includes(normalizedInput)) {
      return path;
    }
  }
  
  return null;
};
if (typeof window !== "undefined") {
  const handleBeforeUnload = () => {
    destroyVapi();
  };

  window.addEventListener("beforeunload", handleBeforeUnload);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden" && activeCallId) {
      stopVapiCall();
    }
  });
}
