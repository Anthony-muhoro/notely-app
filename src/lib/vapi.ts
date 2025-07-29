import Vapi from "@vapi-ai/web";
let vapi: Vapi | null = null;
let isInitialized = false;
let activeCallId: string | null = null;
let currentAssistantType: "default" | "explain" = "default";
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
const userOtherInquery = `
Be conversational, warm, and helpful. Keep responses concise and natural. If the user asks how to create a new note, respond: To create a new note, go to the sidebar and click on the New Entry option. You will be redirected to the note creation page where you'll see a form. Fill in the Title, Synopsis, and Content fields to write your note. To use AI assistance with the note, you must provide a title. You can easily rewrite the content of your note using AI help. If the user asks how to view notes, respond: To view notes you've created, go to the sidebar and click on My Notes. To see pinned notes, check the sidebar under Pinned. Bookmarked notes can be found under the Bookmarks section in the sidebar. To manage deleted notes, go to the Trash page from the sidebar. From the Trash page, you can restore notes by clicking the restore button. If the user asks about the Notely app, respond: Notely lets you create, save, and share notes on the public page. To visit the public page, use the sidebar and navigate there. You can pin and unpin notes for easy access. To update your profile (profile image, first name, last name), go to the Profile page. To change your password, visit the Change Password page. If the user asks who created you, respond: I was created by a dedicated engineer named Anthony Muhoro. If the user asks to tell more about the engineer, respond: He is a hardworking young man obsessed with tech. Always end with: Would you like me to help you with any of these features?`;

const createDefaultAssistantConfig = (user: { firstName: string }) => ({
  model: {
    provider: "openai" as const,
    model: "gpt-4" as const,
    messages: [
      {
        role: "system" as const,
        content: `You are Notely, a friendly voice assistant for a note-taking app.
        
Context: ${"User is ready for assistance"}
${userOtherInquery}
`,
      },
    ],
  },
  voice: createBaseVoiceConfig(),
  transcriber: createBaseTranscriberConfig(),
  firstMessage: `Hi! ${user.firstName}I'm Notely, your voice assistant. How can I help you today?`,
});

const createExplainNoteAssistantConfig = (
  user: { firstName: string },
  noteTitle: string,
  noteContent: string,
  noteCreated: string,
  noteUpdated: string
) => {
  const cleanContent = (content: string) => {
    const textContent = content.replace(/<[^>]*>?/gm, "");
    return textContent.length > 1000
      ? `${textContent.substring(0, 1000)}... [content truncated]`
      : textContent || "No content available";
  };

  const preparedContent = cleanContent(noteContent);
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

If asked about the Notely app, explain: "With Notely, you can create, share, and view notes easily. To navigate the app, just go to the sidebar and choose the page you want to visit."

When giving instructions, always use numbered steps (1, 2, 3) instead of hashtags or bullet points.
          
Note Details:
- Title: ${noteTitle || "Untitled Note"}
- Created: ${createdDate}
- Last Updated: ${updatedDate}
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
5. If the note is incomplete or unclear, mention that and suggest what might be missing`,
        },
      ],
    },
    voice: createBaseVoiceConfig(),
    transcriber: createBaseTranscriberConfig(),
    firstMessage: `Hi! ${user.firstName} . I can see that you have opened a note with the title, ${noteTitle}. so tell me. what help can I offer to you?`,
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
export const startVapiCall = async (user: {
  firstName: string;
}): Promise<boolean> => {
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
    const assistant = createDefaultAssistantConfig(user);
    await vapi.start(assistant);
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
    await vapi.start(assistant);
    currentAssistantType = "explain";
    return true;
  } catch (error) {
    console.error("Failed to start explain note call:", error);
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

export const getCurrentAssistantType = (): "default" | "explain" => {
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
