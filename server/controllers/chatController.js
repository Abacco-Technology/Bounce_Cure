import { prisma } from "../prisma/prismaClient.js";

// Store user message
export const sendMessage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, message: "Message required" });
    }

    const nowUTC = new Date(); // Prisma automatically stores in UTC

    // Ensure conversation exists
    const conversation = await prisma.conversation.upsert({
      where: { userId },
      update: {},
      create: { userId }
    });

    // Save USER message
    const userMessage = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        sender: "USER",
        text: message,
        createdAt: nowUTC
      }
    });

    // Update lastUserMsgAt in UTC
    await prisma.conversation.update({
      where: { userId },
      data: {
        lastUserMsgAt: nowUTC
      }
    });

    // Get previous message
    const lastMessage = await prisma.message.findFirst({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: "desc" },
      skip: 1
    });

    // Stop bot if admin replied
    if (lastMessage?.sender === "ADMIN") {
      return res.json({
        success: true,
        userMessage,
        botMessage: null
      });
    }

    // First message bot reply
    if (!lastMessage) {
      const bot = await prisma.message.create({
        data: {
          conversationId: conversation.id,
          sender: "BOT",
          text: "Thanks! We received your message.",
          createdAt: nowUTC
        }
      });

      return res.json({
        success: true,
        userMessage,
        botMessage: bot
      });
    }

    // Delayed bot
    setTimeout(async () => {
      try {
        const latest = await prisma.message.findFirst({
          where: { conversationId: conversation.id },
          orderBy: { createdAt: "desc" }
        });

        if (latest.sender === "USER") {
          await prisma.message.create({
            data: {
              conversationId: conversation.id,
              sender: "BOT",
              text: "Our team will respond within 24 hours.",
              createdAt: new Date()
            }
          });
        }
      } catch (e) {
        console.error("Delayed bot error:", e);
      }
    }, 25 * 60 * 1000);

    res.json({
      success: true,
      userMessage,
      botMessage: null
    });

  } catch (error) {
    console.error("Chat send error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};



// Fetch chat history for logged-in user
export const getMyMessages = async (req, res) => {
  try {
    const userId = req.user.id;

    const conversation = await prisma.conversation.findUnique({
      where: { userId },
      include: {
        messages: {
          orderBy: { createdAt: "asc" }
        }
      }
    });

    res.json({
      success: true,
      messages: conversation?.messages || []
    });

  } catch (error) {
    console.error("Fetch chat error:", error);
    res.status(500).json({ success: false });
  }
};
